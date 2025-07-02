import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Brain,
  MessageSquare,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GeminiAIService } from '../services/geminiAIService';

export const AITestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    configTest: 'pending' | 'success' | 'error';
    chatTest: 'pending' | 'success' | 'error';
    analysisTest: 'pending' | 'success' | 'error';
  }>({
    configTest: 'pending',
    chatTest: 'pending',
    analysisTest: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');

  const testSpecificMessage = async (message: string) => {
    setLoading(true);
    setTestOutput(prev => prev + `\n🔍 Testing message: "${message}"\n`);
    
    try {
      const mockClientContext = {
        name: 'Sarah Mitchell',
        age: 32,
        triggers: ['work stress', 'relationship conflict', 'public speaking']
      };
      const chatResponse = await GeminiAIService.generaRispostaChatConContesto(message, mockClientContext);
      setTestOutput(prev => prev + `✅ Response generated: ${chatResponse.contenuto}\n`);
      setTestOutput(prev => prev + `📊 Metadata: ${JSON.stringify(chatResponse.metadata, null, 2)}\n\n`);
    } catch (error) {
      setTestOutput(prev => prev + `❌ Error: ${error}\n\n`);
    }
    
    setLoading(false);
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestOutput('🚀 Starting full AI system test...\n\n');

    // Test 1: API Key Configuration
    setTestOutput(prev => prev + '1️⃣ Testing Gemini API Key configuration...\n');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      setTestResults(prev => ({ ...prev, configTest: 'error' }));
      setTestOutput(prev => prev + '❌ Gemini API Key not configured\n');
      setTestOutput(prev => prev + 'ℹ️ Add VITE_GEMINI_API_KEY to your .env file\n\n');
    } else {
      setTestResults(prev => ({ ...prev, configTest: 'success' }));
      setTestOutput(prev => prev + `✅ API Key found (length: ${apiKey.length})\n\n`);
    }

    // Test 2: AI Chat
    setTestOutput(prev => prev + '2️⃣ Testing AI chat response...\n');
    try {
      const chatResponse = await GeminiAIService.generaRispostaChat(
        'Hello, I feel a bit anxious about work today.',
        'demo-client-1',
        true
      );
      
      setTestResults(prev => ({ ...prev, chatTest: 'success' }));
      setTestOutput(prev => prev + '✅ AI Chat working\n');
      setTestOutput(prev => prev + `📝 Response: ${chatResponse.contenuto.substring(0, 100)}...\n`);
      setTestOutput(prev => prev + `🧠 Detected emotions: ${chatResponse.metadata.emozioniRilevate.join(', ')}\n\n`);
    } catch (error) {
      setTestResults(prev => ({ ...prev, chatTest: 'error' }));
      setTestOutput(prev => prev + `❌ AI Chat error: ${error}\n\n`);
    }

    // Test 3: Notes Analysis
    setTestOutput(prev => prev + '3️⃣ Testing therapy notes analysis...\n');
    try {
      const analysis = await GeminiAIService.analizzaNoteTerapeutiche('demo-client-1');
      
      setTestResults(prev => ({ ...prev, analysisTest: 'success' }));
      setTestOutput(prev => prev + '✅ Notes analysis working\n');
      setTestOutput(prev => prev + `📊 Wellness score: ${analysis.punteggioBenessere}%\n`);
      setTestOutput(prev => prev + `🎯 Main themes: ${analysis.temiPrincipali.join(', ')}\n\n`);
    } catch (error) {
      setTestResults(prev => ({ ...prev, analysisTest: 'error' }));
      setTestOutput(prev => prev + `❌ Notes analysis error: ${error}\n\n`);
    }

    setTestOutput(prev => prev + '🏁 Tests completed!\n');
    setLoading(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-neutral-300" />;
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-success-600';
      case 'error':
        return 'text-error-600';
      default:
        return 'text-neutral-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Gemini AI System Test</h2>
              <p className="text-neutral-600">Verify configuration and features</p>
            </div>
          </div>
          <button
            onClick={runAllTests}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            <span>{loading ? 'Testing...' : 'Run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Test Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon(testResults.configTest)}
            <h3 className={`font-semibold ${getStatusColor(testResults.configTest)}`}>
              API Configuration
            </h3>
          </div>
          <p className="text-neutral-600 text-sm">
            Checks if the Gemini API key is configured correctly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon(testResults.chatTest)}
            <h3 className={`font-semibold ${getStatusColor(testResults.chatTest)}`}>
              AI Chat
            </h3>
          </div>
          <p className="text-neutral-600 text-sm">
            Tests the intelligent response system of the chat.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon(testResults.analysisTest)}
            <h3 className={`font-semibold ${getStatusColor(testResults.analysisTest)}`}>
              Notes Analysis
            </h3>
          </div>
          <p className="text-neutral-600 text-sm">
            Tests the intelligent analysis of therapy notes.
          </p>
        </motion.div>
      </div>

      {/* Test Output */}
      {testOutput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-neutral-600 mr-2" />
            <h3 className="font-semibold text-neutral-900">Test Output</h3>
          </div>
          <div className="bg-neutral-900 rounded-lg p-4 text-green-400 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {testOutput}
          </div>
        </motion.div>
      )}

      {/* Debug Chat Test */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center mb-4">
          <MessageSquare className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="font-semibold text-neutral-900">Chat Debugging</h3>
        </div>
        <p className="text-neutral-600 mb-4">
          Test the chat with different messages to ensure responses are not repetitive.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => testSpecificMessage("Hello, how are you?")}
            disabled={loading}
            className="btn btn-outline w-full text-left"
          >
            Test: "Hello, how are you?"
          </button>
          <button
            onClick={() => testSpecificMessage("I'm feeling very anxious today")}
            disabled={loading}
            className="btn btn-outline w-full text-left"
          >
            Test: "I'm feeling very anxious today"
          </button>
          <button
            onClick={() => testSpecificMessage("I'm sad about what happened")}
            disabled={loading}
            className="btn btn-outline w-full text-left"
          >
            Test: "I'm sad about what happened"
          </button>
        </div>
      </motion.div>

      {/* Configuration Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center mb-4">
          <Info className="w-5 h-5 text-info-600 mr-2" />
          <h3 className="font-semibold text-neutral-900">Setup Guide</h3>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">How to configure the API Key:</h4>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside text-sm">
            <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
            <li>Log in with your Google account</li>
            <li>Click "Create API Key"</li>
            <li>Copy the generated key</li>
            <li>Create a <code className="bg-blue-100 px-1 rounded">.env</code> file in the project root</li>
            <li>Add: <code className="bg-blue-100 px-1 rounded">VITE_GEMINI_API_KEY=your_key_here</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </motion.div>

      {/* Current Configuration Status */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Current Configuration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">API Key Gemini:</span>
            <span className={import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here' 
              ? 'text-success-600 font-medium' 
              : 'text-error-600 font-medium'
            }>
              {import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here' 
                ? '✅ Configured' 
                : '❌ Not Configured'
              }
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Environment:</span>
            <span className="text-neutral-900 font-medium">{import.meta.env.MODE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 