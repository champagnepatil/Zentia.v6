import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';
import * as Sentry from "@sentry/react";
import { 
  logError, 
  AppError, 
  ErrorType, 
  ErrorSeverity, 
  withRetry, 
  safeAsync,
  handleAPIResponse,
  isNetworkError
} from '../utils/errorHandling';
import { getClientDisplayName } from '../utils/clientUtils';

// Inizializzazione Gemini con controllo errori
const initializeGemini = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  console.log('🔍 Gemini API Key Check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWithAI: apiKey?.startsWith('AIza') || false,
    isPlaceholder: apiKey === 'your_gemini_api_key_here'
  });
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const warning = new AppError(
      'Gemini API key not configured',
      ErrorType.EXTERNAL_SERVICE,
      ErrorSeverity.MEDIUM,
      { apiKeyExists: !!apiKey, isPlaceholder: apiKey === 'your_gemini_api_key_here' },
      'AI service temporarily unavailable. Using fallback responses.'
    );
    logError(warning, { 
      action: 'initialize_gemini',
      component: 'GeminiAIService'
    });
    return null;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    console.log('✅ Gemini 2.0 Flash model initialized successfully');
    return model;
  } catch (error) {
    const appError = new AppError(
      `Failed to initialize Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorType.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      { apiKeyLength: apiKey?.length, error: error instanceof Error ? error.message : 'Unknown' },
      'AI service initialization failed. Using fallback mode.'
    );
    logError(appError, {
      action: 'initialize_gemini',
      component: 'GeminiAIService'
    });
    return null;
  }
};

export interface NotesAnalysis {
  riassunto: string;
  temiPrincipali: string[];
  progressi: string[];
  raccomandazioni: string[];
  punteggioBenessere: number;
  areeAttenzione: string[];
  strategie: string[];
}

export interface ChatResponse {
  contenuto: string;
  metadata: {
    emozioniRilevate: string[];
    triggerIndividuati: string[];
    strategieSuggerite: string[];
    livelloUrgenza: 'low' | 'medium' | 'high';
    riferimentiTerapeutici: string[];
  };
}

export class GeminiAIService {
  private static getModel() {
    return initializeGemini();
  }

  /**
   * 📝 Analizza le note terapeutiche di un cliente
   */
  static async analizzaNoteTerapeutiche(clientId: string, noteIds?: string[]): Promise<NotesAnalysis> {
    return await safeAsync(
      async () => {
        console.log(`🤖 Starting notes analysis for client ${clientId}`);

        // Validate input
        if (!clientId) {
          throw new AppError(
            'Client ID is required for notes analysis',
            ErrorType.VALIDATION,
            ErrorSeverity.MEDIUM,
            { clientId },
            'Unable to analyze notes: missing client information.'
          );
        }

        // Fetch notes with retry logic
        const { data: note, error } = await withRetry(async () => {
          let query = supabase
            .from('notes')
            .select('*')
            .eq('user_id', clientId)
            .order('created_at', { ascending: false });

          if (noteIds && noteIds.length > 0) {
            query = query.in('id', noteIds);
          } else {
            query = query.limit(10);
          }

          const result = await query;
          if (result.error) {
            throw new AppError(
              `Database error fetching notes: ${result.error.message}`,
              ErrorType.DATABASE,
              ErrorSeverity.MEDIUM,
              { clientId, noteIds, supabaseError: result.error }
            );
          }
          return result;
        }, {
          maxAttempts: 3,
          shouldRetry: (error) => {
            return error instanceof AppError && 
                   (error.type === ErrorType.NETWORK || error.type === ErrorType.DATABASE);
          }
        });

        if (!note || note.length === 0) {
          logError(new AppError(
            'No notes found for analysis',
            ErrorType.VALIDATION,
            ErrorSeverity.LOW,
            { clientId, noteCount: 0 }
          ), {
            action: 'analyze_notes',
            component: 'GeminiAIService',
            additionalData: { clientId }
          });
          return this.generaAnalisiVuota();
        }

        // Prepara il contenuto per l'analisi
        const contenutoNote = note.map(nota => ({
          data: nota.created_at,
          titolo: 'Note Entry',
          contenuto: nota.content,
          tag: []
        }));

        const model = this.getModel();
        if (model) {
          return await this.analizzaConGemini(contenutoNote, model);
        } else {
          return this.analizzaConFallback(contenutoNote);
        }
      },
      {
        action: 'analyze_therapeutic_notes',
        component: 'GeminiAIService',
        additionalData: { clientId, noteIds }
      },
      this.generaAnalisiVuota() // fallback value
    ).then(result => {
      if (result.error) {
        // Log error but return fallback analysis
        logError(result.error, {
          action: 'analyze_therapeutic_notes',
          component: 'GeminiAIService',
          additionalData: { clientId, noteIds }
        });
        return this.generaAnalisiVuota();
      }
      return result.data!;
    });
  }

  /**
   * 💬 Genera risposta chat con contesto terapeutico
   */
  static async generaRispostaChat(
    messaggioUtente: string, 
    clientId?: string,
    contattoTerapeutico?: boolean,
    additionalContext?: string
  ): Promise<ChatResponse> {
    const { logger } = Sentry;
    return Sentry.startSpan(
      {
        op: "ai.chat_generation",
        name: "Generate Chat Response",
      },
      async (span) => {
        span.setAttribute("message_length", messaggioUtente.length);
        span.setAttribute("has_client_id", !!clientId);
        span.setAttribute("therapeutic_contact", !!contattoTerapeutico);
        logger.info("Starting chat response generation", {
          messageLength: messaggioUtente.length,
          hasClientId: !!clientId,
          therapeuticContact: !!contattoTerapeutico
        });
        // Fetch client context
        let clientContext: any = { name: 'Unknown', age: 'Unknown', triggers: [], copingStrategies: [] };
        if (clientId) {
          // Try to fetch from clients table
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name, age, triggers, coping_strategies')
            .eq('id', clientId)
            .single();
          if (clientData) {
            clientContext.name = `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || getClientDisplayName(clientId);
            clientContext.age = clientData.age || 'Unknown';
            clientContext.triggers = clientData.triggers || [];
            clientContext.copingStrategies = clientData.coping_strategies || [];
          } else {
            clientContext.name = getClientDisplayName(clientId);
          }
        }
        // Fetch all therapy notes for the client
        let allNotes: any[] = [];
        if (clientId && contattoTerapeutico) {
          const { data: notes } = await supabase
            .from('notes')
            .select('created_at, title, content')
            .eq('user_id', clientId)
            .order('created_at', { ascending: false });
          allNotes = notes || [];
        }
            const contattoEmotivo = this.analizzaContestoEmotivo(messaggioUtente);
            console.log('🧠 Emotional context analyzed:', contattoEmotivo);
            
            let noteRilevanti: any[] = [];
            if (clientId && contattoTerapeutico) {
          const { data: notes } = await supabase
                  .from('notes')
                  .select('*')
                  .eq('user_id', clientId)
                  .limit(5);
                noteRilevanti = notes || [];
              }
              console.log('📝 Relevant notes found:', noteRilevanti.length);

            span.setAttribute("relevant_notes_count", noteRilevanti.length);
            span.setAttribute("emotional_intensity", contattoEmotivo.intensita || 'unknown');

            let response: ChatResponse;
        const model = this.getModel();
            if (model) {
              console.log('✅ Using Gemini AI for response');
              span.setAttribute("ai_model_used", "gemini");
          response = await this.generaRispostaChatConGemini(
            messaggioUtente,
            contattoEmotivo,
            noteRilevanti,
            model,
            clientContext,
            allNotes,
            additionalContext
          );
            } else {
              console.log('⚠️ Gemini model not available, using fallback');
              span.setAttribute("ai_model_used", "fallback");
              response = this.generaRispostaChatFallback(messaggioUtente, contattoEmotivo);
            }

            span.setAttribute("response_length", response.contenuto.length);
            span.setAttribute("urgency_level", response.metadata.livelloUrgenza);
            span.setAttribute("success", true);

            logger.info("Successfully generated chat response", {
              responseLength: response.contenuto.length,
              urgencyLevel: response.metadata.livelloUrgenza,
              emotionsDetected: response.metadata.emozioniRilevate.length,
              strategiesSuggested: response.metadata.strategieSuggerite.length
            });

            return response;
      }
    );
  }

  /**
   * 📊 Genera riassunto progressi con error handling
   */
  static async generaRiassuntoProgressi(clientId: string, giorni: number = 30): Promise<string> {
    const { data: summary, error } = await safeAsync(
      async () => {
        if (!clientId) {
          throw new AppError(
            'Client ID is required for progress summary',
            ErrorType.VALIDATION,
            ErrorSeverity.MEDIUM,
            { clientId },
            'Unable to generate progress summary: missing client information.'
          );
        }

        if (giorni <= 0 || giorni > 365) {
          throw new AppError(
            'Invalid time period for progress summary',
            ErrorType.VALIDATION,
            ErrorSeverity.MEDIUM,
            { giorni },
            'Time period must be between 1 and 365 days.'
          );
        }

        const dataInizio = new Date();
        dataInizio.setDate(dataInizio.getDate() - giorni);

        // Fetch data with retry logic
        const datiProgressi = await withRetry(async () => {
          const [
            { data: mood, error: moodError },
            { data: journal, error: journalError },
            { data: assessments, error: assessmentsError }
          ] = await Promise.all([
            supabase
              .from('mood_entries')
              .select('*')
              .eq('user_id', clientId)
              .gte('created_at', dataInizio.toISOString()),
            supabase
              .from('journal_entries')
              .select('*')
              .eq('user_id', clientId)
              .gte('created_at', dataInizio.toISOString()),
            supabase
              .from('assessments')
              .select('*')
              .eq('user_id', clientId)
              .gte('created_at', dataInizio.toISOString())
          ]);

          // Check for database errors
          if (moodError || journalError || assessmentsError) {
            const errors = [moodError, journalError, assessmentsError].filter(Boolean);
            throw new AppError(
              `Database errors fetching progress data: ${errors.map(e => e!.message).join(', ')}`,
              ErrorType.DATABASE,
              ErrorSeverity.MEDIUM,
              { clientId, giorni, errors }
            );
          }

          return {
            mood: mood || [],
            journal: journal || [],
            assessments: assessments || []
          };
        }, {
          maxAttempts: 3,
          shouldRetry: (error) => {
            return error instanceof AppError && 
                   (error.type === ErrorType.NETWORK || error.type === ErrorType.DATABASE);
          }
        });

        const model = this.getModel();
        if (model) {
          return await this.generaRiassuntoConGemini(datiProgressi, giorni, model);
        } else {
          return this.generaRiassuntoFallback(datiProgressi, giorni);
        }
      },
      {
        action: 'generate_progress_summary',
        component: 'GeminiAIService',
        additionalData: { clientId, giorni }
      },
      `Progress summary for the last ${giorni} days is currently unavailable. Please try again later.` // fallback
    );

    if (error) {
      logError(error, {
        action: 'generate_progress_summary',
        component: 'GeminiAIService',
        additionalData: { clientId, giorni }
      });
    }

    return summary!;
  }

  // === METODI PRIVATI ===

  private static async analizzaConGemini(contenutoNote: any[], model: any): Promise<NotesAnalysis> {
    const prompt = `
You are an expert psychologist analyzing therapy notes. Analyze these sessions and provide a structured analysis in JSON format.

THERAPY NOTES:
-${contenutoNote.map((nota: any) => `
Date: ${nota.data}
Title: ${nota.titolo}
Content: ${nota.contenuto}
Tags: ${nota.tag.join(', ')}
`).join('\n---\n')}

Provide the analysis in the following JSON format (respond ONLY with valid JSON):
{
  "riassunto": "Complete summary in 2-3 sentences in English",
  "temiPrincipali": ["theme1", "theme2", "theme3"],
  "progressi": ["progress1", "progress2"],
  "raccomandazioni": ["recommendation1", "recommendation2"],
  "punteggioBenessere": 75,
  "areeAttenzione": ["area1", "area2"],
  "strategie": ["strategy1", "strategy2"]
}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Estrai JSON dalla risposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Nessun JSON valido nella risposta');
      }
    } catch (error) {
      console.error('❌ Errore parsing risposta Gemini:', error);
      return this.analizzaConFallback(contenutoNote);
    }
  }

  private static async generaRispostaChatConGemini(
    messaggio: string, 
    contesto: any, 
    noteRilevanti: any[],
    model: any,
    clientContext?: any,
    allNotes?: any[],
    additionalContext?: string
  ): Promise<ChatResponse> {
    const timestamp = new Date().toISOString();
    // Build therapy notes section
    const therapyNotesSection = (allNotes && allNotes.length > 0)
      ? allNotes.map((n: any) => `- ${n.created_at?.split('T')[0] || 'Unknown date'}: ${n.title || 'Note'} - ${n.content || ''}`).join('\n')
      : 'No therapy notes available';
    // Build triggers and coping strategies
    const triggersSection = (clientContext?.triggers && clientContext.triggers.length > 0)
      ? clientContext.triggers.join(', ')
      : 'None identified';
    const copingSection = (clientContext?.copingStrategies && clientContext.copingStrategies.length > 0)
      ? clientContext.copingStrategies.map((s: any) => s.title || s).join(', ')
      : 'None available';
    // Build prompt
    const prompt = `
You are Zentia, a compassionate therapeutic AI assistant that provides support between therapy sessions.

TIMESTAMP: ${timestamp}

CLIENT CONTEXT:
Name: ${clientContext?.name || 'Unknown'}
Age: ${clientContext?.age || 'Unknown'}

THERAPY NOTES:
${therapyNotesSection}

TRIGGERS: ${triggersSection}
COPING STRATEGIES: ${copingSection}

Please address the client by name (${clientContext?.name || 'Unknown'}) and reference their therapy context when appropriate.

USER MESSAGE: "${messaggio}"
${additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}` : ''}

EMOTIONAL CONTEXT:
- Detected emotions: ${(contesto.emozioni || []).join(', ') || 'no specific emotions detected'}
- Identified triggers: ${(contesto.triggers || []).join(', ') || 'no specific triggers identified'}
- Intensity: ${contesto.intensita || 'normal'}

Respond ONLY with a valid JSON object in this exact format (escape all quotes properly):
{
  "contenuto": "Your therapeutic response here as a single string, use \\\" for any quotes",
  "metadata": {
    "emozioniRilevate": ["emotion1", "emotion2"],
    "triggerIndividuati": ["trigger1", "trigger2"],
    "strategieSuggerite": ["strategy1", "strategy2"],
    "livelloUrgenza": "low",
    "riferimentiTerapeutici": ["reference1", "reference2"]
  }
}

IMPORTANT: 
- Respond ONLY with the JSON object, no additional text
- Use proper JSON escaping for quotes and special characters
- Keep the response compassionate and therapeutic
- livelloUrgenza must be one of: "low", "medium", "high"
- Escape all quotes and special characters properly in the contenuto field
- Respond ONLY with the JSON object, no additional text`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      console.log('🤖 Raw Gemini response length:', responseText.length);
      console.log('🤖 Raw Gemini response preview:', responseText.substring(0, 100) + '...');
      
      // Extract JSON from response with improved cleaning
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON even if wrapped in other text
        const lines = responseText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            jsonMatch = [trimmed];
            break;
          }
        }
      }
      
      // Try alternative extraction methods if first attempt fails
      if (!jsonMatch) {
        // Look for JSON in markdown code blocks
        const markdownMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (markdownMatch) {
          jsonMatch = [markdownMatch[1]];
        }
      }
      
      if (!jsonMatch) {
        // Last resort: try to find any JSON-like structure
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonMatch = [responseText.substring(jsonStart, jsonEnd + 1)];
        }
      }
      
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Clean up common JSON issues more aggressively
        jsonString = this.sanitizeJsonString(jsonString);
        
        try {
          const parsedResponse = JSON.parse(jsonString);
          console.log('✅ Gemini response parsed successfully');
          
          // Validate response structure
          if (parsedResponse.contenuto && parsedResponse.metadata) {
            return parsedResponse;
          } else {
            console.warn('⚠️ Invalid response structure, using fallback');
            throw new Error('Invalid response structure');
          }
        } catch (parseError) {
          console.error('❌ JSON parsing failed:', parseError);
          console.log('🔍 Problematic JSON preview:', jsonString.substring(0, 200) + '...');
          console.log('🔍 Full JSON for debugging:', jsonString);
          throw parseError;
        }
      } else {
        console.warn('⚠️ No valid JSON in Gemini response, using fallback');
        console.log('🔍 Full response for debugging:', responseText);
        throw new Error('No valid JSON in response');
      }
    } catch (error) {
      console.error('❌ Error generating Gemini chat response:', error);
      console.log('🔄 Using fallback response for:', messaggio.substring(0, 30) + '...');
      return this.generaRispostaChatFallback(messaggio, contesto);
    }
  }

  private static async generaRiassuntoConGemini(dati: any, giorni: number, model: any): Promise<string> {
    const prompt = `
Generate a professional summary of therapeutic progress from the last ${giorni} days.

AVAILABLE DATA:
Therapy Notes: ${dati.note.length} sessions
Assessments: ${dati.assessment.length} evaluations
Daily Monitoring: ${dati.monitoraggio.length} entries

NOTES DETAILS:
-${dati.note.map((nota: any) => `- ${nota.title}: ${nota.content.substring(0, 150)}...`).join('\n')}

ASSESSMENT SCORES:
-${dati.assessment.map((assessment: any) => `- ${assessment.instrument}: Score ${assessment.score}`).join('\n')}

MONITORING DATA:
Average mood: ${dati.monitoraggio.length > 0 ? (dati.monitoraggio.reduce((sum: number, entry: any) => sum + (entry.mood_rating || 5), 0) / dati.monitoraggio.length).toFixed(1) : 'N/A'}

Generate a clinical summary of 3-4 paragraphs in English that includes:
1. General overview of progress
2. Significant changes in symptoms/mood
3. Effectiveness of therapeutic strategies
4. Recommendations for next steps`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('❌ Errore generazione riassunto Gemini:', error);
      return this.generaRiassuntoFallback(dati, giorni);
    }
  }

  // === METODI FALLBACK ===

  private static generaAnalisiVuota(): NotesAnalysis {
    return {
      riassunto: 'No therapy notes available for analysis. Continue regular monitoring and therapeutic activities.',
      temiPrincipali: ['Initial assessment', 'Baseline establishment'],
      progressi: ['Started mental health monitoring', 'Engaged with digital therapy tools'],
      raccomandazioni: ['Continue regular monitoring', 'Schedule therapy sessions', 'Complete initial assessments'],
      punteggioBenessere: 50,
      areeAttenzione: ['Assessment completion', 'Regular engagement'],
      strategie: ['Daily check-ins', 'Mood tracking', 'Coping skills practice']
    };
  }

  private static analizzaConFallback(contenutoNote: any[]): NotesAnalysis {
    // Simple keyword-based analysis
    const tuttoTesto = contenutoNote.map(nota => nota.content.toLowerCase()).join(' ');
    
    const temiComuni = this.estraiTemi(tuttoTesto);
    const progressiRilevati = this.rilavaProgressi(tuttoTesto);
    const punteggio = this.calcolaPunteggioFallback(tuttoTesto);

    return {
      riassunto: `Analyzed ${contenutoNote.length} therapy sessions. Themes related to ${temiComuni.slice(0, 2).join(' and ')} emerge.`,
      temiPrincipali: temiComuni.slice(0, 5),
      progressi: progressiRilevati,
      raccomandazioni: [
        'Continue with practiced coping techniques',
        'Monitor identified triggers',
        'Maintain self-observation routine'
      ],
      punteggioBenessere: punteggio,
      areeAttenzione: this.identificaAreeAttenzione(tuttoTesto),
      strategie: this.estraiStrategie(tuttoTesto)
    };
  }

  private static generaRispostaChatFallback(messaggio: string, contesto: any): ChatResponse {
    const messaggioLower = messaggio.toLowerCase();
    
    let risposta = '';
    let livelloUrgenza: 'low' | 'medium' | 'high' = 'low';
    
    if (messaggioLower.includes('anxiety') || messaggioLower.includes('panic') || messaggioLower.includes('ansioso') || messaggioLower.includes('ansia')) {
      risposta = 'I hear you are going through a moment of anxiety. Remember that these feelings are temporary. Try the 4-7-8 breathing technique we practiced together.';
      livelloUrgenza = 'medium';
    } else if (messaggioLower.includes('sad') || messaggioLower.includes('depressed') || messaggioLower.includes('triste') || messaggioLower.includes('depresso')) {
      risposta = 'I understand you are feeling down. It is important to acknowledge these feelings without judgment. Have you tried any of the grounding techniques we discussed?';
      livelloUrgenza = 'medium';
    } else if (messaggioLower.includes('stress') || messaggioLower.includes('stressed') || messaggioLower.includes('stressato')) {
      risposta = 'Stress can be really tough. Remember to take breaks and use the stress management strategies we are developing together.';
    } else {
      risposta = 'Thank you for sharing your thoughts with me. I am here to support you. How can I best help you right now?';
    }

    return {
      contenuto: risposta,
      metadata: {
        emozioniRilevate: contesto.emozioni || ['neutral'],
        triggerIndividuati: contesto.triggers || [],
        strategieSuggerite: ['breathing', 'mindfulness'],
        livelloUrgenza,
        riferimentiTerapeutici: ['CBT techniques', 'stress management']
      }
    };
  }

  private static generaRiassuntoFallback(dati: any, giorni: number): string {
    const numNote = dati.note.length;
    const numAssessment = dati.assessment.length;
    const numMonitoraggio = dati.monitoraggio.length;

    return `
**Progress Summary - Last ${giorni} days**

In the analyzed period, ${numNote} therapy sessions, ${numAssessment} assessments, and ${numMonitoraggio} daily monitoring entries were recorded.

**General Observations:**
The client's commitment to the therapeutic process is ${numNote > 0 ? 'good' : 'needs improvement'} considering the frequency of sessions. Daily monitoring ${numMonitoraggio > 10 ? 'shows consistency' : 'needs more regularity'}.

**Recommendations:**
- Maintain regularity of therapy sessions
- Continue daily mood monitoring
- Implement coping strategies discussed in sessions

*Summary generated automatically - for detailed analysis, consult the complete notes.*
    `.trim();
  }

  // === UTILITIES ===

  private static sanitizeJsonString(jsonString: string): string {
    // Remove markdown code blocks if present
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    jsonString = jsonString.replace(/```/g, '');
    
    // Remove any leading/trailing whitespace
    jsonString = jsonString.trim();
    
    // Find the actual JSON object boundaries
    const startIndex = jsonString.indexOf('{');
    const lastIndex = jsonString.lastIndexOf('}');
    
    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      jsonString = jsonString.substring(startIndex, lastIndex + 1);
    }
    
    try {
      // First try to parse as-is, it might already be valid
      JSON.parse(jsonString);
      return jsonString;
    } catch (error) {
      console.log('🔧 JSON needs sanitization, applying fixes...');
      
      // Apply sanitization only if parsing fails
      jsonString = jsonString
        // Remove control characters that break JSON
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix spacing around colons and commas
        .replace(/:\s*/g, ': ')
        .replace(/,\s*/g, ', ')
        // Remove any extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
      
      try {
        // Try parsing again after basic cleanup
        JSON.parse(jsonString);
        return jsonString;
      } catch (secondError) {
        console.log('🔧 Advanced JSON sanitization needed...');
        
        // More aggressive fixes as last resort
        jsonString = jsonString
          // Fix newlines and tabs in strings
          .replace(/(?<!\\)\n/g, '\\n')
          .replace(/(?<!\\)\r/g, '\\r')
          .replace(/(?<!\\)\t/g, '\\t')
          // Remove any remaining problematic characters
          .replace(/[^\x20-\x7E\s]/g, '');
        
        return jsonString;
      }
    }
  }

  private static analizzaContestoEmotivo(messaggio: string) {
    const messaggioLower = messaggio.toLowerCase();
    const emozioni: string[] = [];
    const triggers: string[] = [];
    let intensita = 'low';

    // Emotion detection (English & Italian)
    if (messaggioLower.includes('anxiety') || messaggioLower.includes('anxious') || 
        messaggioLower.includes('ansia') || messaggioLower.includes('ansioso')) emozioni.push('anxiety');
    if (messaggioLower.includes('sad') || messaggioLower.includes('sadness') || 
        messaggioLower.includes('triste') || messaggioLower.includes('tristezza')) emozioni.push('sadness');
    if (messaggioLower.includes('angry') || messaggioLower.includes('anger') || 
        messaggioLower.includes('arrabbiato') || messaggioLower.includes('rabbia')) emozioni.push('anger');
    if (messaggioLower.includes('stress') || messaggioLower.includes('stressed') || 
        messaggioLower.includes('stressato') || messaggioLower.includes('stressante')) emozioni.push('stress');
    if (messaggioLower.includes('panic') || messaggioLower.includes('panico')) emozioni.push('panic');
    if (messaggioLower.includes('depressed') || messaggioLower.includes('depression') || 
        messaggioLower.includes('depresso') || messaggioLower.includes('depressione')) emozioni.push('depression');

    // Trigger detection (English & Italian)
    if (messaggioLower.includes('work') || messaggioLower.includes('office') || 
        messaggioLower.includes('lavoro') || messaggioLower.includes('ufficio')) triggers.push('work');
    if (messaggioLower.includes('family') || messaggioLower.includes('parents') || 
        messaggioLower.includes('famiglia') || messaggioLower.includes('genitori')) triggers.push('family');
    if (messaggioLower.includes('relationship') || messaggioLower.includes('partner') || 
        messaggioLower.includes('relazione') || messaggioLower.includes('fidanzato')) triggers.push('relationship');
    if (messaggioLower.includes('money') || messaggioLower.includes('financial') || 
        messaggioLower.includes('soldi') || messaggioLower.includes('denaro')) triggers.push('money');
    if (messaggioLower.includes('health') || messaggioLower.includes('illness') || 
        messaggioLower.includes('salute') || messaggioLower.includes('malattia')) triggers.push('health');

    // Intensity detection (English & Italian)
    if (messaggioLower.includes('very') || messaggioLower.includes('extremely') || 
        messaggioLower.includes('molto') || messaggioLower.includes('estremamente')) {
      intensita = 'high';
    } else if (messaggioLower.includes('somewhat') || messaggioLower.includes('fairly') || 
               messaggioLower.includes('abbastanza') || messaggioLower.includes('piuttosto')) {
      intensita = 'medium';
    }

    return { emozioni, triggers, intensita };
  }

  private static estraiTemi(testo: string): string[] {
    const temi = [];
    if (testo.includes('anxiety')) temi.push('anxiety');
    if (testo.includes('depression')) temi.push('depression');
    if (testo.includes('stress')) temi.push('stress management');
    if (testo.includes('relationship')) temi.push('interpersonal relationships');
    if (testo.includes('work')) temi.push('work stress');
    if (testo.includes('family')) temi.push('family dynamics');
    if (testo.includes('self-esteem')) temi.push('self-esteem');
    if (testo.includes('sleep')) temi.push('sleep disturbances');
    return temi;
  }

  private static rilavaProgressi(testo: string): string[] {
    const progressi = [];
    if (testo.includes('improvement')) progressi.push('General improvements observed');
    if (testo.includes('progress')) progressi.push('Progress in therapeutic strategies');
    if (testo.includes('coping')) progressi.push('Development of effective coping strategies');
    if (testo.includes('awareness')) progressi.push('Increased emotional awareness');
    return progressi.length > 0 ? progressi : ['Progress under evaluation'];
  }

  private static calcolaPunteggioFallback(testo: string): number {
    let punteggio = 50; // Neutral base
    
    // Positive factors
    if (testo.includes('improvement')) punteggio += 15;
    if (testo.includes('progress')) punteggio += 10;
    if (testo.includes('positive')) punteggio += 10;
    if (testo.includes('good')) punteggio += 5;
    
    // Negative factors
    if (testo.includes('worsening')) punteggio -= 15;
    if (testo.includes('crisis')) punteggio -= 20;
    if (testo.includes('difficulty')) punteggio -= 10;
    
    return Math.max(0, Math.min(100, punteggio));
  }

  private static identificaAreeAttenzione(testo: string): string[] {
    const aree = [];
    if (testo.includes('anxiety') && testo.includes('high')) aree.push('High levels of anxiety');
    if (testo.includes('sleep') && testo.includes('problem')) aree.push('Sleep disturbances');
    if (testo.includes('isolation')) aree.push('Tendency to social isolation');
    if (testo.includes('work') && testo.includes('stress')) aree.push('Excessive work stress');
    return aree;
  }

  private static estraiStrategie(testo: string): string[] {
    const strategie = [];
    if (testo.includes('breathing')) strategie.push('Breathing techniques');
    if (testo.includes('mindfulness')) strategie.push('Mindfulness practices');
    if (testo.includes('grounding')) strategie.push('Grounding exercises');
    if (testo.includes('cbt')) strategie.push('Cognitive-behavioral techniques');
    if (testo.includes('relaxation')) strategie.push('Relaxation techniques');
    return strategie.length > 0 ? strategie : ['Personalized strategies in development'];
  }
} 