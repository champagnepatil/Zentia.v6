import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCaseHistory } from '../../hooks/useCaseHistory';
import { ArrowLeft, Save, User, Brain, Smile as Family, Baby, AlertTriangle } from 'lucide-react';
import type { CaseHistory, MentalStatusExamination, FamilyHistory, DevelopmentalHistory } from '../../types/caseHistory';

const CaseHistoryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { caseHistories, createCaseHistory, updateCaseHistory, createMSE, createFamilyHistory, createDevelopmentalHistory } = useCaseHistory();
  
  const isEditing = id !== 'new';
  const existingHistory = isEditing ? caseHistories.find(h => h.id === id) : null;

  const [activeTab, setActiveTab] = useState<'general' | 'mse' | 'family' | 'developmental'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // General Information State
  const [generalInfo, setGeneralInfo] = useState<Partial<CaseHistory>>({
    client_name: '',
    father_mother_guardian_name: '',
    age: '',
    gender: undefined,
    address: '',
    language_of_communication: 'English',
    referred_by: '',
    informants: '',
    primary_concerns: '',
    history_of_concerns: {
      onset: '',
      duration: '',
      stressful_factors: '',
      progression: '',
    },
    medical_history: '',
    diagnosis_by_doctor: '',
    management_plan: '',
    behavioral_observation: '',
    strengths: '',
    areas_of_interest: '',
  });

  // MSE State
  const [mseData, setMseData] = useState<Partial<MentalStatusExamination>>({
    general_appearance: {
      physical_appearance: '',
      self_care: '',
      body_language: '',
      attitude_towards_examiner: '',
      psychomotor_activity: '',
      rapport: '',
      eye_contact: '',
      odd_eccentric_behavior: '',
      other_observations: '',
    },
    speech_assessment: '',
    mood_and_affect: '',
    emotional_response: '',
    thought_content: '',
    thought_flow: '',
    suicidal_ideation: false,
    risk_assessment: '',
    perception_data: {
      hallucinations: {
        auditory: false,
        visual: false,
        tactile: false,
        gustatory: false,
      },
      illusions: {
        auditory: false,
        visual: false,
      },
    },
    cognition_data: {
      consciousness: '',
      orientation: {
        time: false,
        place: false,
        person: false,
      },
      attention_concentration: '',
      memory: {
        immediate: '',
        recent: '',
        remote: '',
      },
    },
    insight_level: '',
  });

  // Family History State
  const [familyData, setFamilyData] = useState<Partial<FamilyHistory>>({
    family_tree: '',
    losses: '',
    conflicts: '',
    differences: '',
    disorders: '',
    family_atmosphere: '',
  });

  // Developmental History State
  const [devData, setDevData] = useState<Partial<DevelopmentalHistory>>({
    pregnancy_and_birth: '',
    motor_activity: '',
    speech_language: '',
    toilet_training: '',
    schooling: '',
    neurodevelopment_functioning: {
      attention: '',
      activity_energy_level: '',
      impulsivity: '',
      time_management: '',
      organization_skills: '',
      emotional_regulation: '',
      language_communication: {
        receptive: false,
        expressive: false,
      },
    },
    academic_history: '',
    social_development: {
      awareness_of_boundaries: '',
      interaction_with_adults: '',
      social_appropriateness: '',
      peer_relationships: '',
    },
    play_behavior: {
      types_of_plays: '',
      imitation: '',
      creative_imaginative: '',
      solitary_group: '',
      understanding_following_instruction: '',
      repetitive_stereotypical: '',
    },
    puberty_milestones: '',
  });

  // Load existing data if editing
  useEffect(() => {
    if (existingHistory) {
      setGeneralInfo(existingHistory);
      if (existingHistory.mental_status_examination) {
        setMseData(existingHistory.mental_status_examination);
      }
      if (existingHistory.family_history) {
        setFamilyData(existingHistory.family_history);
      }
      if (existingHistory.developmental_history) {
        setDevData(existingHistory.developmental_history);
      }
    }
  }, [existingHistory]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!generalInfo.client_name?.trim()) {
        setError('Client name is required');
        return;
      }

      let caseHistoryId: string;

      if (isEditing && existingHistory) {
        await updateCaseHistory(existingHistory.id, generalInfo);
        caseHistoryId = existingHistory.id;
      } else {
        const newHistory = await createCaseHistory(generalInfo);
        caseHistoryId = newHistory.id;
      }

      // Save MSE data if provided
      if (Object.values(mseData.general_appearance || {}).some(v => v) || mseData.speech_assessment) {
        await createMSE({ ...mseData, case_history_id: caseHistoryId });
      }

      // Save family history if provided
      if (Object.values(familyData).some(v => v)) {
        await createFamilyHistory({ ...familyData, case_history_id: caseHistoryId });
      }

      // Save developmental history if provided
      if (Object.values(devData).some(v => v)) {
        await createDevelopmentalHistory({ ...devData, case_history_id: caseHistoryId });
      }

      navigate('/therapist/case-histories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save case history');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Information', icon: User },
    { id: 'mse', label: 'Mental Status Exam', icon: Brain },
    { id: 'family', label: 'Family History', icon: Family },
    { id: 'developmental', label: 'Developmental History', icon: Baby },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/therapist/case-histories')} 
            className="p-2 rounded-full hover:bg-neutral-100 mr-3"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEditing ? 'Edit Case History' : 'New Case History'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Case History'}
        </button>
      </div>

      {error && (
        <div className="bg-error-50 text-error-700 p-4 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card p-6"
      >
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">General Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Client Name *</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.client_name || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, client_name: e.target.value })}
                  placeholder="Jacqueline Silverio"
                  required
                />
              </div>
              
              <div>
                <label className="label">Father's/Mother's/Guardian's Name</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.father_mother_guardian_name || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, father_mother_guardian_name: e.target.value })}
                  placeholder="Guardian name"
                />
              </div>
              
              <div>
                <label className="label">Age</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.age || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, age: e.target.value })}
                  placeholder="30+"
                />
              </div>
              
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={generalInfo.gender || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, gender: e.target.value as any })}
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.address || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, address: e.target.value })}
                  placeholder="Rhode Island (used to live in Pennsylvania)"
                />
              </div>
              
              <div>
                <label className="label">Language of Communication</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.language_of_communication || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, language_of_communication: e.target.value })}
                  placeholder="English"
                />
              </div>
              
              <div>
                <label className="label">Referred By</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.referred_by || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, referred_by: e.target.value })}
                  placeholder="Referring professional or organization"
                />
              </div>
            </div>

            <div>
              <label className="label">Primary Concerns/Present Problems</label>
              <textarea
                className="textarea min-h-[120px]"
                value={generalInfo.primary_concerns || ''}
                onChange={(e) => setGeneralInfo({ ...generalInfo, primary_concerns: e.target.value })}
                placeholder="She lost her baby when she was 3 months pregnant. She is devastated and depressed..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Onset</label>
                <select
                  className="input"
                  value={generalInfo.history_of_concerns?.onset || ''}
                  onChange={(e) => setGeneralInfo({
                    ...generalInfo,
                    history_of_concerns: { ...generalInfo.history_of_concerns, onset: e.target.value }
                  })}
                >
                  <option value="">Select onset</option>
                  <option value="acute">Acute</option>
                  <option value="gradual">Gradual</option>
                </select>
              </div>
              
              <div>
                <label className="label">Duration</label>
                <input
                  type="text"
                  className="input"
                  value={generalInfo.history_of_concerns?.duration || ''}
                  onChange={(e) => setGeneralInfo({
                    ...generalInfo,
                    history_of_concerns: { ...generalInfo.history_of_concerns, duration: e.target.value }
                  })}
                  placeholder="months, weeks, etc."
                />
              </div>
            </div>

            <div>
              <label className="label">Stressful Factors/Events</label>
              <textarea
                className="textarea"
                value={generalInfo.history_of_concerns?.stressful_factors || ''}
                onChange={(e) => setGeneralInfo({
                  ...generalInfo,
                  history_of_concerns: { ...generalInfo.history_of_concerns, stressful_factors: e.target.value }
                })}
                placeholder="miscarriage, work stress, family issues..."
              />
            </div>

            <div>
              <label className="label">Medical History</label>
              <textarea
                className="textarea"
                value={generalInfo.medical_history || ''}
                onChange={(e) => setGeneralInfo({ ...generalInfo, medical_history: e.target.value })}
                placeholder="She had a miscarriage..."
              />
            </div>

            <div>
              <label className="label">Management Plan</label>
              <textarea
                className="textarea"
                value={generalInfo.management_plan || ''}
                onChange={(e) => setGeneralInfo({ ...generalInfo, management_plan: e.target.value })}
                placeholder="Empathize, tell her that this situation is right now and use SFBT..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Behavioral Observation</label>
                <textarea
                  className="textarea"
                  value={generalInfo.behavioral_observation || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, behavioral_observation: e.target.value })}
                  placeholder="calm and cooperative..."
                />
              </div>
              
              <div>
                <label className="label">Strengths</label>
                <textarea
                  className="textarea"
                  value={generalInfo.strengths || ''}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, strengths: e.target.value })}
                  placeholder="Family and friends support..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mse' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Mental Status Examination</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">General Appearance and Behavior</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Physical Appearance</label>
                    <input
                      type="text"
                      className="input"
                      value={mseData.general_appearance?.physical_appearance || ''}
                      onChange={(e) => setMseData({
                        ...mseData,
                        general_appearance: { ...mseData.general_appearance, physical_appearance: e.target.value }
                      })}
                      placeholder="casual dressed"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Self-care</label>
                    <input
                      type="text"
                      className="input"
                      value={mseData.general_appearance?.self_care || ''}
                      onChange={(e) => setMseData({
                        ...mseData,
                        general_appearance: { ...mseData.general_appearance, self_care: e.target.value }
                      })}
                      placeholder="fair"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Body Language</label>
                    <input
                      type="text"
                      className="input"
                      value={mseData.general_appearance?.body_language || ''}
                      onChange={(e) => setMseData({
                        ...mseData,
                        general_appearance: { ...mseData.general_appearance, body_language: e.target.value }
                      })}
                      placeholder="good"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Attitude Towards Examiner</label>
                    <input
                      type="text"
                      className="input"
                      value={mseData.general_appearance?.attitude_towards_examiner || ''}
                      onChange={(e) => setMseData({
                        ...mseData,
                        general_appearance: { ...mseData.general_appearance, attitude_towards_examiner: e.target.value }
                      })}
                      placeholder="frank and cooperative"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Speech Assessment</label>
                <textarea
                  className="textarea"
                  value={mseData.speech_assessment || ''}
                  onChange={(e) => setMseData({ ...mseData, speech_assessment: e.target.value })}
                  placeholder="She seems to have some sort of speech disorder but she is able to communicate effectively"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Mood and Affect</label>
                  <textarea
                    className="textarea"
                    value={mseData.mood_and_affect || ''}
                    onChange={(e) => setMseData({ ...mseData, mood_and_affect: e.target.value })}
                    placeholder="grieving and depressed"
                  />
                </div>
                
                <div>
                  <label className="label">Emotional Response</label>
                  <textarea
                    className="textarea"
                    value={mseData.emotional_response || ''}
                    onChange={(e) => setMseData({ ...mseData, emotional_response: e.target.value })}
                    placeholder="She is very sad for the loss of her foetus but also wants to protect her loved ones"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Thought Content</label>
                  <textarea
                    className="textarea"
                    value={mseData.thought_content || ''}
                    onChange={(e) => setMseData({ ...mseData, thought_content: e.target.value })}
                    placeholder="She is logical and wants to take care of her friends ticket also..."
                  />
                </div>
                
                <div>
                  <label className="label">Thought Flow</label>
                  <textarea
                    className="textarea"
                    value={mseData.thought_flow || ''}
                    onChange={(e) => setMseData({ ...mseData, thought_flow: e.target.value })}
                    placeholder="Ideas, content, delusions, obsessions..."
                  />
                </div>
              </div>

              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-error-600 mr-2" />
                  <h4 className="font-medium text-error-900">Risk Assessment</h4>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={mseData.suicidal_ideation || false}
                      onChange={(e) => setMseData({ ...mseData, suicidal_ideation: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-error-800">Suicidal Ideation Present</span>
                  </label>
                </div>
                
                <div>
                  <label className="label text-error-800">Risk Assessment Details</label>
                  <textarea
                    className="textarea border-error-300 focus:border-error-500 focus:ring-error-500"
                    value={mseData.risk_assessment || ''}
                    onChange={(e) => setMseData({ ...mseData, risk_assessment: e.target.value })}
                    placeholder="Detailed risk assessment if suicidal ideation is present..."
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-neutral-900 mb-3">Cognition</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Consciousness Level</label>
                    <select
                      className="input"
                      value={mseData.cognition_data?.consciousness || ''}
                      onChange={(e) => setMseData({
                        ...mseData,
                        cognition_data: { ...mseData.cognition_data, consciousness: e.target.value }
                      })}
                    >
                      <option value="">Select level</option>
                      <option value="alert">Alert</option>
                      <option value="stupor">Stupor</option>
                      <option value="unconscious">Unconscious</option>
                      <option value="coma">Coma</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Insight Level</label>
                    <input
                      type="text"
                      className="input"
                      value={mseData.insight_level || ''}
                      onChange={(e) => setMseData({ ...mseData, insight_level: e.target.value })}
                      placeholder="good, fair, poor"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="label">Orientation</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mseData.cognition_data?.orientation?.time || false}
                        onChange={(e) => setMseData({
                          ...mseData,
                          cognition_data: {
                            ...mseData.cognition_data,
                            orientation: { ...mseData.cognition_data?.orientation, time: e.target.checked }
                          }
                        })}
                        className="mr-2"
                      />
                      <span>Time</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mseData.cognition_data?.orientation?.place || false}
                        onChange={(e) => setMseData({
                          ...mseData,
                          cognition_data: {
                            ...mseData.cognition_data,
                            orientation: { ...mseData.cognition_data?.orientation, place: e.target.checked }
                          }
                        })}
                        className="mr-2"
                      />
                      <span>Place</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mseData.cognition_data?.orientation?.person || false}
                        onChange={(e) => setMseData({
                          ...mseData,
                          cognition_data: {
                            ...mseData.cognition_data,
                            orientation: { ...mseData.cognition_data?.orientation, person: e.target.checked }
                          }
                        })}
                        className="mr-2"
                      />
                      <span>Person</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'family' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Family History</h2>
            
            <div>
              <label className="label">Family Tree</label>
              <textarea
                className="textarea"
                value={familyData.family_tree || ''}
                onChange={(e) => setFamilyData({ ...familyData, family_tree: e.target.value })}
                placeholder="She has a 17 year old daughter and a step sister who support her..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Losses</label>
                <textarea
                  className="textarea"
                  value={familyData.losses || ''}
                  onChange={(e) => setFamilyData({ ...familyData, losses: e.target.value })}
                  placeholder="Lost 3 month foetus..."
                />
              </div>
              
              <div>
                <label className="label">Family Atmosphere</label>
                <textarea
                  className="textarea"
                  value={familyData.family_atmosphere || ''}
                  onChange={(e) => setFamilyData({ ...familyData, family_atmosphere: e.target.value })}
                  placeholder="supportive, tense, chaotic..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Conflicts</label>
                <textarea
                  className="textarea"
                  value={familyData.conflicts || ''}
                  onChange={(e) => setFamilyData({ ...familyData, conflicts: e.target.value })}
                  placeholder="Family conflicts or disputes..."
                />
              </div>
              
              <div>
                <label className="label">Disorders</label>
                <textarea
                  className="textarea"
                  value={familyData.disorders || ''}
                  onChange={(e) => setFamilyData({ ...familyData, disorders: e.target.value })}
                  placeholder="Mental health or medical disorders in family..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'developmental' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Developmental History</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Pregnancy and Birth</label>
                <textarea
                  className="textarea"
                  value={devData.pregnancy_and_birth || ''}
                  onChange={(e) => setDevData({ ...devData, pregnancy_and_birth: e.target.value })}
                  placeholder="Pregnancy complications, birth details..."
                />
              </div>
              
              <div>
                <label className="label">Speech/Language Development</label>
                <textarea
                  className="textarea"
                  value={devData.speech_language || ''}
                  onChange={(e) => setDevData({ ...devData, speech_language: e.target.value })}
                  placeholder="She seems to have some speech disorder..."
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Neurodevelopmental Functioning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Attention</label>
                  <input
                    type="text"
                    className="input"
                    value={devData.neurodevelopment_functioning?.attention || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      neurodevelopment_functioning: {
                        ...devData.neurodevelopment_functioning,
                        attention: e.target.value
                      }
                    })}
                    placeholder="good, fair, poor"
                  />
                </div>
                
                <div>
                  <label className="label">Activity/Energy Level</label>
                  <input
                    type="text"
                    className="input"
                    value={devData.neurodevelopment_functioning?.activity_energy_level || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      neurodevelopment_functioning: {
                        ...devData.neurodevelopment_functioning,
                        activity_energy_level: e.target.value
                      }
                    })}
                    placeholder="optimal, high, low"
                  />
                </div>
                
                <div>
                  <label className="label">Organization Skills</label>
                  <textarea
                    className="textarea"
                    value={devData.neurodevelopment_functioning?.organization_skills || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      neurodevelopment_functioning: {
                        ...devData.neurodevelopment_functioning,
                        organization_skills: e.target.value
                      }
                    })}
                    placeholder="In spite of her difficult times, she has taken responsibility..."
                  />
                </div>
                
                <div>
                  <label className="label">Emotional Regulation</label>
                  <textarea
                    className="textarea"
                    value={devData.neurodevelopment_functioning?.emotional_regulation || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      neurodevelopment_functioning: {
                        ...devData.neurodevelopment_functioning,
                        emotional_regulation: e.target.value
                      }
                    })}
                    placeholder="She is in a lot of pain but she wants to take responsibility..."
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="label">Language/Communication</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={devData.neurodevelopment_functioning?.language_communication?.receptive || false}
                      onChange={(e) => setDevData({
                        ...devData,
                        neurodevelopment_functioning: {
                          ...devData.neurodevelopment_functioning,
                          language_communication: {
                            ...devData.neurodevelopment_functioning?.language_communication,
                            receptive: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span>Receptive</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={devData.neurodevelopment_functioning?.language_communication?.expressive || false}
                      onChange={(e) => setDevData({
                        ...devData,
                        neurodevelopment_functioning: {
                          ...devData.neurodevelopment_functioning,
                          language_communication: {
                            ...devData.neurodevelopment_functioning?.language_communication,
                            expressive: e.target.checked
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span>Expressive</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Social Development</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Awareness of Boundaries</label>
                  <input
                    type="text"
                    className="input"
                    value={devData.social_development?.awareness_of_boundaries || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      social_development: {
                        ...devData.social_development,
                        awareness_of_boundaries: e.target.value
                      }
                    })}
                    placeholder="She seems to understand her boundaries..."
                  />
                </div>
                
                <div>
                  <label className="label">Interaction with Adults</label>
                  <input
                    type="text"
                    className="input"
                    value={devData.social_development?.interaction_with_adults || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      social_development: {
                        ...devData.social_development,
                        interaction_with_adults: e.target.value
                      }
                    })}
                    placeholder="She is calm and able to interact well..."
                  />
                </div>
                
                <div>
                  <label className="label">Social Appropriateness</label>
                  <input
                    type="text"
                    className="input"
                    value={devData.social_development?.social_appropriateness || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      social_development: {
                        ...devData.social_development,
                        social_appropriateness: e.target.value
                      }
                    })}
                    placeholder="She is responsible and socially appropriate..."
                  />
                </div>
                
                <div>
                  <label className="label">Peer Relationships</label>
                  <input
                    type="text"
                    className="input"
                    value={devData.social_development?.peer_relationships || ''}
                    onChange={(e) => setDevData({
                      ...devData,
                      social_development: {
                        ...devData.social_development,
                        peer_relationships: e.target.value
                      }
                    })}
                    placeholder="She has good friends and family support..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CaseHistoryForm;