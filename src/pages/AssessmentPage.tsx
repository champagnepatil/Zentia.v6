import React, { useState, useEffect } from 'react';
import { AssessmentForm } from '@/components/monitoring/AssessmentForm';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'sonner';
import { ArrowLeft, ClipboardList, User, Calendar, BarChart3, Plus, CheckCircle, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeClientId, getClientDisplayName } from '@/utils/clientUtils';
import { useAuth } from '@/contexts/AuthContext';
import EmptyState from '../components/ui/EmptyState';

interface AssessmentData {
  clientId?: string;
  patientId?: string;
  assessmentType: 'PHQ9' | 'GAD7' | 'WHODAS';
  scores: Record<string, number>;
  notes?: string;
}

export function AssessmentPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentResults, setAssessmentResults] = useState<any[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<string[]>(['PHQ-9', 'GAD-7', 'WHODAS-2.0']);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showInstrumentsModal, setShowInstrumentsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const scale = searchParams.get('scale') || 'phq9';
  
  // Map scale parameter to assessment type
  const getAssessmentType = (scaleParam: string): 'PHQ9' | 'GAD7' | 'WHODAS' => {
    switch (scaleParam.toLowerCase()) {
      case 'gad7': return 'GAD7';
      case 'whodas': return 'WHODAS';
      case 'dsm5': return 'PHQ9'; // For now, map DSM5 to PHQ9
      default: return 'PHQ9';
    }
  };

  const getScaleInfo = (scaleParam: string) => {
    switch (scaleParam.toLowerCase()) {
      case 'phq9':
        return {
          name: 'PHQ-9',
          title: 'Depression Assessment',
          description: 'Patient Health Questionnaire - 9 items',
          icon: '😔',
          duration: '5 minutes'
        };
      case 'gad7':
        return {
          name: 'GAD-7',
          title: 'Anxiety Assessment',
          description: 'Generalized Anxiety Disorder - 7 items',
          icon: '😰',
          duration: '3 minutes'
        };
      case 'whodas':
        return {
          name: 'WHODAS-2.0',
          title: 'Functioning Assessment',
          description: 'World Health Organization Disability Assessment Schedule',
          icon: '🎯',
          duration: '8 minutes'
        };
      case 'dsm5':
        return {
          name: 'DSM-5-CC',
          title: 'Cross-Cutting Assessment',
          description: 'DSM-5 Cross-Cutting Symptom Measure',
          icon: '📋',
          duration: '15 minutes'
        };
      default:
        return {
          name: 'PHQ-9',
          title: 'Depression Assessment',
          description: 'Patient Health Questionnaire - 9 items',
          icon: '😔',
          duration: '5 minutes'
        };
    }
  };

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        const clientUUID = normalizeClientId(clientId!);
        
        // Try to fetch from clients table first
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('first_name, last_name, email')
          .eq('id', clientUUID)
          .single();
        
        if (clientData) {
          setClientInfo({
            id: clientId,
            name: `${clientData.first_name} ${clientData.last_name}`,
            email: clientData.email
          });
        } else {
          // Fallback to demo data
          setClientInfo({
            id: clientId,
            name: getClientDisplayName(clientId!),
            email: 'client@demo.com'
          });
        }
      } catch (error) {
        console.error('Error fetching client info:', error);
        // Use fallback demo data
        setClientInfo({
          id: clientId,
          name: getClientDisplayName(clientId!),
          email: 'client@demo.com'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClientInfo();
    } else {
      setIsLoading(false);
    }
  }, [clientId]);

  // Fetch assessment results for therapist view
  useEffect(() => {
    const fetchAssessmentResults = async () => {
      if (!clientId || user?.role !== 'therapist') return;

      try {
        const clientUUID = normalizeClientId(clientId);
        
        const { data, error } = await supabase
          .from('assessment_results')
          .select(`
            *,
            assessments (
              id,
              instrument,
              created_at
            )
          `)
          .eq('assessments.client_id', clientUUID)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssessmentResults(data || []);
      } catch (error) {
        console.error('Error fetching assessment results:', error);
      }
    };

    fetchAssessmentResults();
  }, [clientId, user]);

  const handleAssignAssessment = async (instrument: string) => {
    if (!clientId) return;

    try {
      const clientUUID = normalizeClientId(clientId);
      
      const { error } = await supabase
        .from('assessments')
        .insert([{
          client_id: clientUUID,
          instrument: instrument,
          schedule: 'once',
          next_due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }]);

      if (error) throw error;
      
      // Reload assessment results
      const { data, error: fetchError } = await supabase
        .from('assessment_results')
        .select(`
          *,
          assessments (
            id,
            instrument,
            created_at
          )
        `)
        .eq('assessments.client_id', clientUUID)
        .order('created_at', { ascending: false });

      if (!fetchError) {
        setAssessmentResults(data || []);
      }
      
      alert(`${instrument} assessment assigned successfully!`);
    } catch (error) {
      console.error('Error assigning assessment:', error);
      alert('Failed to assign assessment');
    }
  };

  const handleSubmit = async (data: AssessmentData) => {
    try {
      // Accept both clientId and patientId for backward compatibility
      const id = data.clientId || data.patientId;
      const clientUUID = normalizeClientId(id!);
      const totalScore = Object.values(data.scores).reduce((sum, score) => sum + score, 0);

      // Map assessment type to instrument name
      const instrumentMap: Record<string, string> = {
        'PHQ9': 'PHQ-9',
        'GAD7': 'GAD-7', 
        'WHODAS': 'WHODAS-2.0',
        'DSM5': 'DSM-5-CC'
      };
      
      const instrument = instrumentMap[data.assessmentType] || 'PHQ-9';

      // First, create an assessment record
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([{
          client_id: clientUUID,
          instrument: instrument,
          schedule: 'once',
          next_due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }])
        .select()
        .single();

      if (assessmentError) {
        throw assessmentError;
      }

      // Then create the assessment result
      const { error: resultError } = await supabase
        .from('assessment_results')
        .insert([{
          assessment_id: assessment.id,
          score: totalScore,
          raw_json: data.scores,
          interpretation: `Assessment completed with score: ${totalScore}`,
          severity_level: totalScore >= 15 ? 'moderate' : totalScore >= 10 ? 'mild' : 'minimal'
        }]);

      if (resultError) {
        throw resultError;
      }

      // Navigate back to dashboard after successful submission
      setTimeout(() => {
        navigate('/client');
      }, 1500);

      return Promise.resolve();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      return Promise.reject(error);
    }
  };

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client ID Required</h2>
          <p className="text-gray-600 mb-4">No client ID was provided for this assessment.</p>
          <Button variant="default" onClick={() => navigate('/client')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  const scaleInfo = getScaleInfo(scale);
  const assessmentType = getAssessmentType(scale);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/client')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{scaleInfo.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {scaleInfo.name} Assessment
                  </h1>
                  <p className="text-gray-600">{scaleInfo.description}</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClipboardList className="w-4 h-4" />
                Estimated time: {scaleInfo.duration}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info */}
      {clientInfo && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Assessment for: {clientInfo.name}
                </p>
                <p className="text-sm text-blue-700">
                  Client ID: {clientInfo.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on user role */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {user?.role === 'therapist' ? (
          // Therapist View - Show results and assignment options
          <div className="space-y-8">
            {/* Assign New Assessment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assign New Assessment
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {availableAssessments.map((instrument) => (
                  <button
                    key={instrument}
                    onClick={() => handleAssignAssessment(instrument)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{instrument}</h3>
                        <p className="text-sm text-gray-600">
                          {instrument === 'PH-9' && 'Depression screening'}
                          {instrument === 'GAD-7' && 'Anxiety screening'}
                          {instrument === 'WHODAS-2.0' && 'Functioning assessment'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment Results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assessment Results History
              </h2>
              
              {assessmentResults.length === 0 ? (
                <EmptyState
                  type="assessments"
                  title="No Assessment Results Available"
                  description="No assessment results found for this client. Schedule an assessment to start tracking progress and generating insights."
                  primaryAction={{
                    label: 'Schedule Assessment',
                    onClick: () => setShowAssessmentModal(true),
                    variant: 'default',
                    icon: <Target className="w-5 h-5" />
                  }}
                  secondaryActions={[
                    {
                      label: 'View Available Instruments',
                      onClick: () => setShowInstrumentsModal(true),
                      variant: 'outline',
                      icon: <ClipboardList className="w-4 h-4" />
                    },
                    {
                      label: 'Learn More',
                      onClick: () => setShowHelpModal(true),
                      variant: 'outline',
                      icon: <Brain className="w-4 h-4" />
                    }
                  ]}
                  sampleData={{
                    title: 'Assessment Benefits',
                    items: [
                      '📊 Track treatment progress over time',
                      '🎯 Identify areas needing attention',
                      '📈 Measure intervention effectiveness',
                      '⚠️ Early detection of risk factors',
                      '🧠 AI-powered insights and recommendations',
                      '📝 Automated scoring and interpretation'
                    ]
                  }}
                  userRole="therapist"
                />
              ) : (
                <div className="space-y-4">
                  {assessmentResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {result.assessments?.instrument || 'Unknown Assessment'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Completed: {new Date(result.created_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {result.score}
                          </div>
                          <div className={`text-sm font-medium ${
                            result.severity_level === 'minimal' ? 'text-green-600' :
                            result.severity_level === 'mild' ? 'text-yellow-600' :
                            result.severity_level === 'moderate' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {result.severity_level?.charAt(0).toUpperCase() + result.severity_level?.slice(1)}
                          </div>
                        </div>
                      </div>
                      
                      {result.interpretation && (
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-700">{result.interpretation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Therapist Instructions */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-3">
                🩺 Therapist Dashboard
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• <strong>Assign assessments</strong> to track client progress over time</p>
                <p>• <strong>Review results</strong> to identify trends and treatment efficacy</p>
                <p>• <strong>Monitor severity levels</strong> to adjust intervention strategies</p>
                <p>• All client data is encrypted and HIPAA compliant</p>
              </div>
            </div>
          </div>
        ) : (
          // Client View - Show assessment form
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {scaleInfo.title}
              </h2>
              <p className="text-gray-600">
                Please answer each question honestly based on how you have been feeling 
                over the <strong>past two weeks</strong>. There are no right or wrong answers.
              </p>
            </div>

            <AssessmentForm
              clientId={clientId}
              onSubmit={handleSubmit}
              defaultAssessmentType={assessmentType}
            />
          </div>
        )}

        {/* Client Instructions (only for client view) */}
        {user?.role !== 'therapist' && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-3">
              📋 Assessment Instructions
            </h3>
            <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">Scoring Guide:</h4>
                <ul className="space-y-1">
                  <li>• <strong>0 - Not at all:</strong> Never experienced</li>
                  <li>• <strong>1 - Several days:</strong> Few times in 2 weeks</li>
                  <li>• <strong>2 - More than half:</strong> More than 7 days</li>
                  <li>• <strong>3 - Nearly every day:</strong> Almost daily</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Privacy & Confidentiality:</h4>
                <ul className="space-y-1">
                  <li>• Your responses are completely confidential</li>
                  <li>• Only you and your therapist can access results</li>
                  <li>• Data is encrypted and securely stored</li>
                  <li>• Results help improve your treatment plan</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default AssessmentPage; 