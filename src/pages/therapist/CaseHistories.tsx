import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTherapy } from '../../contexts/TherapyContext';
import { FileText, Plus, Search, Calendar, User, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

const CaseHistories: React.FC = () => {
  const { clients } = useTherapy();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  console.log('📋 Case Histories - Clients loaded:', {
    count: clients.length,
    clientNames: clients.map(c => c.name)
  });

  // Convert clients to case history format for display
  const caseHistories = clients.map(client => ({
    id: client.id,
    client_name: client.name,
    age: client.age.toString(),
    gender: client.gender,
    primary_concerns: client.notes.length > 0 ? client.notes[0].content.substring(0, 200) + '...' : 'No concerns documented yet',
    management_plan: `Ongoing therapy for ${client.triggers.join(', ').toLowerCase() || 'general wellness'}. Regular sessions scheduled.`,
    created_at: client.lastSessionDate,
    updated_at: client.lastSessionDate,
    mental_status_examination: client.safetyNotes ? { suicidal_ideation: false } : undefined,
    therapist_notes: client.notes,
    triggers: client.triggers
  }));

  const filteredHistories = caseHistories.filter(history =>
    history.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    history.primary_concerns?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLevel = (client: any) => {
    // Check for high-risk indicators
    if (client.triggers.some((trigger: string) => 
      trigger.toLowerCase().includes('self-harm') || 
      trigger.toLowerCase().includes('suicide')
    )) {
      return { level: 'high', color: 'error', label: 'High Risk' };
    }
    
    // Check for medium risk (depression, severe anxiety)
    if (client.triggers.some((trigger: string) => 
      trigger.toLowerCase().includes('depression') || 
      trigger.toLowerCase().includes('panic') ||
      client.mood <= 2
    )) {
      return { level: 'medium', color: 'warning', label: 'Medium Risk' };
    }
    
    return { level: 'low', color: 'success', label: 'Low Risk' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Case Histories</h1>
        <Link to="/therapist/case-histories/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Case History
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by client name or concerns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {clients.length === 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center text-warning-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-medium">No clients loaded</span>
          </div>
          <p className="text-warning-600 text-sm mt-1">
            If you're using the demo account, please refresh the page. The case histories are generated from your client list.
          </p>
        </div>
      )}

      {/* Case Histories List */}
      {filteredHistories.length === 0 && clients.length > 0 ? (
        <EmptyState
          type="search"
          title="No matching case histories found"
          description="We couldn't find any case histories matching your search criteria. Try adjusting your search terms or create a new case history."
          primaryAction={{
            label: 'Create Case History',
            onClick: () => navigate('/therapist/case-histories/new'),
            variant: 'default',
            icon: <Plus className="w-5 h-5" />
          }}
          secondaryActions={[
            {
              label: 'Clear Search',
              onClick: () => setSearchTerm(''),
              variant: 'outline',
              icon: <Search className="w-4 h-4" />
            },
            {
              label: 'View All Histories',
              onClick: () => setSearchTerm(''),
              variant: 'outline',
              icon: <FileText className="w-4 h-4" />
            }
          ]}
          sampleData={{
            title: 'Case History Features',
            items: [
              '📝 Comprehensive client documentation',
              '🧠 AI-powered insights and analysis',
              '📊 Progress tracking and outcomes',
              '🎯 Treatment plan recommendations',
              '⚠️ Risk assessment and alerts',
              '📈 Predictive analytics for outcomes'
            ]
          }}
          userRole="therapist"
        />
      ) : filteredHistories.length === 0 && clients.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">No case histories yet</h2>
          <p className="text-neutral-600 mb-6">
            Your client case histories will appear here once you have active clients
          </p>
          <Link to="/therapist/case-histories/new" className="btn btn-primary mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create First Case History
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHistories.map((history, index) => {
            const client = clients.find(c => c.id === history.id);
            const risk = getRiskLevel(client);
            
            return (
              <motion.div
                key={history.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-lg">
                          {history.client_name}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {history.age && `Age: ${history.age}`}
                          {history.age && history.gender && ' • '}
                          {history.gender && `Gender: ${history.gender}`}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${risk.color}-100 text-${risk.color}-800`}>
                      {risk.label}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-900 mb-2">Primary Concerns</h4>
                    <p className="text-neutral-700 text-sm line-clamp-2">
                      {history.primary_concerns || 'No concerns documented'}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-900 mb-2">Current Triggers</h4>
                    <div className="flex flex-wrap gap-1">
                      {client?.triggers.slice(0, 3).map((trigger, idx) => (
                        <span key={idx} className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs">
                          {trigger}
                        </span>
                      ))}
                      {client && client.triggers.length > 3 && (
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs">
                          +{client.triggers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        Last session: {new Date(history.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span>
                      {client?.notes.length || 0} session notes
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <div className="flex space-x-2">
                      <Link
                        to={`/therapist/client/${history.id}`}
                        className="btn btn-ghost text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
                      <Link
                        to={`/therapist/notes/${history.id}`}
                        className="btn btn-ghost text-sm"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Add Note
                      </Link>
                    </div>
                    <span className="text-xs text-neutral-500">
                      Active Client
                    </span>
                  </div>
                </div>

                {/* Risk Indicators */}
                {risk.level === 'high' && (
                  <div className="bg-error-50 border-t border-error-200 p-3">
                    <div className="flex items-center text-error-700">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Requires close monitoring</span>
                    </div>
                  </div>
                )}
                
                {risk.level === 'medium' && client?.mood <= 2 && (
                  <div className="bg-warning-50 border-t border-warning-200 p-3">
                    <div className="flex items-center text-warning-700">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Low mood reported - monitor closely</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CaseHistories;