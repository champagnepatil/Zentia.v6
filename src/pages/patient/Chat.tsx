import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTherapy, ChatMessage } from '../../contexts/TherapyContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Info, HelpCircle, Mic, Square, X, Brain, AlertCircle, Calendar, BookOpen, TrendingUp, Heart, Settings } from 'lucide-react';
import { EnhancedAICompanionMCP, CopingSuggestion, EnhancedChatMessage } from '../../services/enhancedAICompanionMCP';
import { AudioRecorder } from '../../components/audio/AudioRecorder';

const navItems = [
  { icon: <Brain className="w-6 h-6" />, label: 'AI Companion', active: true },
  { icon: <BookOpen className="w-6 h-6" />, label: 'Smart Journal' },
  { icon: <TrendingUp className="w-6 h-6" />, label: 'My Progress' },
  { icon: <Heart className="w-6 h-6" />, label: 'Coping Tools' },
];

const Chat: React.FC = () => {
  const { chatHistory, addChatMessage } = useTherapy();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Enhanced AI features
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [showProactivePanel, setShowProactivePanel] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<CopingSuggestion[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // STEP 4: Proactive Check-ins
  useEffect(() => {
    const checkForProactiveSupport = async () => {
      if (!user?.id) return;
      
      try {
        // Simulate checking patterns (in real implementation, this would query mood history)
        const shouldCheckIn = Math.random() > 0.7; // 30% chance for demo
        
        if (shouldCheckIn && !proactiveMessage) {
          const checkInMessages = [
            "Hi! I noticed it's been a few days since we last talked. How are you feeling today?",
            "Just wanted to check in - I see you have a therapy session coming up. Would you like to prepare or discuss anything?",
            "I've noticed some patterns in your recent mood entries. Would you like to explore some coping strategies together?",
            "Hey there! How has your week been going? I'm here if you need support or just want to chat."
          ];
          
          const randomMessage = checkInMessages[Math.floor(Math.random() * checkInMessages.length)];
          setProactiveMessage(randomMessage);
          setShowProactivePanel(true);
        }
      } catch (error) {
        console.error('Error checking for proactive support:', error);
      }
    };

    // Check for proactive support after a delay (simulate real-world timing)
    const timer = setTimeout(checkForProactiveSupport, 3000);
    return () => clearTimeout(timer);
  }, [user?.id, proactiveMessage]);

  const startRecording = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results as any)
          .map((result: any) => result[0].transcript)
          .join('');
        
        setInputValue(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (err) {
      console.error('Speech recognition error:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    addChatMessage({
      sender: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    });
    
    const userMessage = inputValue;
    setInputValue('');
    setIsTyping(true);
    
    try {
      // STEP 3: Therapy History Integration & Context-Aware Responses
      const userId = user?.id || 'demo-user';
      
      // Analyze message for mood and themes
      const isLowMoodMessage = /\b(sad|depressed|down|awful|terrible|anxious|worried|stressed)\b/i.test(userMessage);
      const moodScore = isLowMoodMessage ? 2 : 4; // Simple mood detection
      
      // Get AI response with therapy context
      let aiResponse: EnhancedChatMessage;
      let suggestions: CopingSuggestion[] = [];
      
      if (isLowMoodMessage) {
        // Handle as mood trigger
        const moodResponse = await EnhancedAICompanionMCP.handleMoodTrigger(
          moodScore,
          userMessage,
          userId
        );
        aiResponse = moodResponse.message;
        suggestions = moodResponse.suggestions;
      } else {
        // Analyze as journal-like entry for themes
        const analysis = await EnhancedAICompanionMCP.analyzeJournalEntry(
          userMessage,
          userId,
          moodScore
        );
        aiResponse = analysis.message;
        suggestions = analysis.suggestions;
      }
      
      // Add AI response to chat
      addChatMessage({
        sender: 'bot',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
      });
      
      // Store suggestions for quick access
      setAiSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      addChatMessage({
        sender: 'bot',
        content: "Thank you for sharing that with me. I'm here to listen and support you. How can I help you feel better today?",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    // Placeholder for voice message handling
    const voiceMessage: ChatMessage = {
      id: Date.now().toString(),
      content: "🎤 Voice message received. (Voice processing coming soon!)",
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    addChatMessage(voiceMessage);
  };

  return (
    <div className="h-screen flex bg-calm-background text-calm-text-primary font-sans">
      {/* Left Navigation Rail */}
      <nav className="w-16 flex flex-col items-center py-6 bg-white/80 border-r border-neutral-100 shadow-calm-soft">
        <div className="flex flex-col gap-8 flex-1">
          {navItems.map((item, idx) => (
            <button
              key={item.label}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${item.active ? 'bg-calm-primary-light text-calm-primary shadow-calm-md' : 'hover:bg-neutral-100 text-neutral-400'}`}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          ))}
          </div>
        <div className="mt-auto mb-2">
          <button className="flex items-center justify-center w-12 h-12 rounded-xl hover:bg-neutral-100 text-neutral-400" aria-label="Settings">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Right Chat Canvas */}
      <main className="flex-1 flex flex-col h-full">
        <div className="w-full max-w-3xl mx-auto flex flex-col flex-grow p-4 md:p-6 h-full">
          {/* Chat Log */}
          <div className="flex flex-col space-y-4 overflow-y-auto flex-grow pb-4">
            {/* Onboarding/First Message Example */}
            <div className="flex justify-start">
              <div className="p-4 rounded-soft-2xl max-w-lg bg-calm-surface text-calm-text-primary font-serif text-lg shadow-calm-soft">
                <p className="mb-2">Hello, I'm your Zentia AI Companion. I'm here to be a supportive, non-judgmental space for you to explore your thoughts and feelings, available 24/7.<br/><br/>You can talk to me about anything—what's on your mind, how your day went, or any challenges you're facing.<br/><br/>To start, just choose one of the prompts below, or type anything you'd like.</p>
                <p className="text-xs mt-4 text-calm-text-secondary">Please remember, while I am here to support you, I am an AI and not a substitute for a human therapist or medical advice. In case of a crisis, please contact a local emergency service immediately.</p>
              </div>
            </div>
            {/* Example mapped messages (replace with your chatHistory.map) */}
            {/* {chatHistory.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-soft-2xl max-w-lg shadow-calm-soft ${message.sender === 'user' ? 'bg-calm-primary-light self-end' : 'bg-calm-surface self-start'} text-calm-text-primary`}>
                  <p>{message.content}</p>
                </div>
              </div>
            ))} */}
                      </div>

          {/* Quick Reply Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Gentle Check-in */}
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">I want to talk through my feelings.</button>
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">Let's reflect on my day.</button>
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">Something is on my mind.</button>
            {/* Facing a Challenge */}
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">I'm feeling anxious or overwhelmed.</button>
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">I'm dealing with negative thoughts.</button>
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">I need help preparing for a stressful event.</button>
            {/* Proactive Growth */}
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">I want to celebrate a small win.</button>
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">Help me set a positive intention for the day.</button>
            <button className="px-4 py-2 rounded-full bg-calm-surface text-calm-text-primary shadow-calm-soft hover:bg-calm-primary-light transition">I'd like to practice a coping skill.</button>
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="mt-auto pt-4">
            <div className="bg-white rounded-soft-full shadow-calm-md p-2 flex items-center">
                <input
                  type="text"
                  value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="flex-grow bg-transparent border-none focus:ring-0 px-4 text-calm-text-primary placeholder:text-calm-text-secondary font-sans"
                placeholder="Your thoughts are safe here..."
              />
              <button
                type="submit"
                className="bg-calm-primary rounded-full p-2.5 flex-shrink-0 hover:opacity-90 transition-opacity ml-2"
                aria-label="Send"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Chat;