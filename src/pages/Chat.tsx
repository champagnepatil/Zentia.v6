import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, Lightbulb, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { useZentia } from '../contexts/ZentiaContext';
import { EmotionPrivacyManager } from '../utils/emotionPrivacy';
import { useAuth } from '../contexts/AuthContext';
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { TextShimmer } from "@/components/ui/text-shimmer";

const Chat: React.FC = () => {
  const { chatHistory, addMessage, getRecommendedTools, isGeneratingResponse } = useZentia();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevChatLength = useRef(chatHistory.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatHistory.length > prevChatLength.current) {
      scrollToBottom();
    }
    prevChatLength.current = chatHistory.length;
  }, [chatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isGeneratingResponse) return;
    
    addMessage({
      sender: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    });
    
    setInputValue('');
  };

  const handleQuickResponse = (message: string) => {
    if (isGeneratingResponse) return;
    
    addMessage({
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const recommendedTools = getRecommendedTools().slice(0, 2);

  return (
    <div className="h-screen flex flex-col bg-neutral-50 font-sans">
      {/* Optional: Header here if needed */}
      {/* Prompts (Quick Replies) always visible above chat log */}
      {chatHistory.length <= 1 && !isGeneratingResponse && (
        <div className="shrink-0 w-full px-4 py-2 bg-white border-t border-primary-100">
          <h3 className="text-base font-medium text-primary-700 mb-3 flex items-center font-sans">
            <Sparkles className="w-5 h-5 mr-2 text-primary-400" />
            How are you feeling today? Choose what resonates:
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <PromptSuggestion className="w-full" onClick={() => handleQuickResponse("I'm feeling overwhelmed.")}>I'm feeling overwhelmed.</PromptSuggestion>
            <PromptSuggestion className="w-full" onClick={() => handleQuickResponse("My mind is racing.")}>My mind is racing.</PromptSuggestion>
            <PromptSuggestion className="w-full" onClick={() => handleQuickResponse("I'm being hard on myself.")}>I'm being hard on myself.</PromptSuggestion>
            <PromptSuggestion className="w-full" onClick={() => handleQuickResponse("Explore my thoughts.")}>Explore my thoughts.</PromptSuggestion>
            <PromptSuggestion className="w-full" onClick={() => handleQuickResponse("Celebrate a small win.")}>Celebrate a small win.</PromptSuggestion>
            <PromptSuggestion className="w-full" onClick={() => handleQuickResponse("I'm feeling grateful.")}>I'm feeling grateful.</PromptSuggestion>
          </div>
        </div>
      )}
      {/* Chat Log (scrollable, with bottom padding for input bar) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-6 pb-28">
        {chatHistory.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-[85%]">
              <div
                className={`rounded-2xl px-5 py-3 shadow-soft font-sans text-base ${
                  message.sender === 'user'
                    ? 'bg-primary-100 text-primary-900 self-end'
                    : 'bg-white text-neutral-900 self-start'
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>
                
                {/* Show metadata if present */}
                {message.metadata && (
                  <div className="mt-4 pt-4 border-t border-primary-200 space-y-2">
                    {message.metadata.emotionalContext && (() => {
                      const isTherapist = EmotionPrivacyManager.isTherapist(user?.role);
                      const displayEmotions = isTherapist 
                        ? message.metadata.emotionalContext 
                        : EmotionPrivacyManager.filterEmotionsForPatient(message.metadata.emotionalContext);
                      
                      if (!displayEmotions) return null;
                      
                      return (
                        <div className="flex items-center text-primary-700">
                          <Heart className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {isTherapist ? 'Detected: ' : ''}
                            {isTherapist ? displayEmotions : EmotionPrivacyManager.getEmotionInsight(message.metadata.emotionalContext)}
                          </span>
                        </div>
                      );
                    })()}
                    {message.metadata.copingToolSuggested && (
                      <div className="flex items-center text-primary-700">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Suggested: {message.metadata.copingToolSuggested}</span>
                      </div>
                    )}
                    {message.metadata.therapistNotesUsed && message.metadata.therapistNotesUsed.length > 0 && (
                      <div className="flex items-center text-primary-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span className="text-sm">Referenced: {message.metadata.therapistNotesUsed.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <span className={`text-xs mt-2 text-neutral-500 ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}>
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          </motion.div>
        ))}
        
        {/* AI Typing Indicator */}
        <AnimatePresence>
          {isGeneratingResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                <TextShimmer className="text-sm">Zentia is thinking...</TextShimmer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
    {/* Input Bar always fixed at the bottom of the viewport */}
    <form onSubmit={handleSendMessage} className="fixed bottom-0 left-0 right-0 bg-white px-6 py-4 border-t border-primary-100 z-50">
      <div className="flex items-center bg-white rounded-full shadow-soft px-4 py-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="flex-grow bg-transparent border-none focus:ring-0 px-2 text-primary-900 placeholder:text-neutral-400 font-sans text-base"
          placeholder="How are you feeling today?"
        />
        <button
          type="submit"
          className="bg-primary-500 text-white rounded-full p-2 ml-2 shadow-soft hover:bg-primary-600 transition"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
    </div>
  );
};

export default Chat;