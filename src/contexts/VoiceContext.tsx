// Core context logic, provider, and composition imports
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { defaultVoiceConfig, ELEVEN_LABS_AGENT_ID } from '@/config/voiceConfig';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { ElevenLabsService } from '@/services/elevenLabsService';
import { toast } from 'sonner';
import { ElevenLabsConfig } from '@/types';
import { VoiceContextType } from '@/types/voiceTypes';
import { useVoiceAgent } from './useVoiceAgent';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ElevenLabsConfig>(defaultVoiceConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const [elevenLabsService, setElevenLabsService] = useState<ElevenLabsService | null>(null);

  let addMessage, updateTranscript, currentCase, updateConversationId;
  try {
    const caseContext = useCase();
    addMessage = caseContext.addMessage;
    updateTranscript = caseContext.updateTranscript;
    currentCase = caseContext.currentCase;
    updateConversationId = caseContext.updateConversationId;
  } catch (error) {
    console.error('VoiceContext: useCase hook error:', error);
    // Provide fallback functions
    addMessage = async () => {};
    updateTranscript = async () => {};
    currentCase = null;
    updateConversationId = async () => {};
  }

  const { audioLevel, updateAudioLevel, resetAudioLevel } = useAudioVisualization();

  React.useEffect(() => {
    if (config.apiKey) {
      setElevenLabsService(new ElevenLabsService(config.apiKey));
    }
  }, [config.apiKey]);

  const isConfigured = !!config.apiKey;

  // --- Agent hook composition split out of main file for cleanliness ---
  const conversation = useVoiceAgent({
    config,
    currentCase,
    updateConversationId,
    addMessage,
    updateTranscript,
    setCurrentTranscription,
    setIsListening,
    setIsSpeaking,
    resetAudioLevel,
    updateAudioLevel,
  });

  const generateTranscriptFromAudio = async (audioBlob: Blob): Promise<string | null> => {
    if (!elevenLabsService || !currentCase) {
      console.warn('ElevenLabs service not initialized or no current case');
      return null;
    }

    try {
      const result = await elevenLabsService.convertSpeechToText(audioBlob, config.modelId);
      if (result.text && result.text.trim()) {
        // Can't call processAudioChunk directly here (would require another context split)
        await addMessage(result.text.trim(), 'user');
        await updateTranscript(result.text.trim(), 'user', Date.now().toString());
        return result.text.trim();
      }
    } catch (error) {
      console.error('Error generating transcript:', error);
      toast.error('Failed to generate transcript');
    }
    return null;
  };

  const setApiKey = (apiKey: string) => {
    const newConfig = { ...config, apiKey };
    setConfig(newConfig);
  };

  const startConnection = async (caseId?: string) => {
    if (!config.apiKey) {
      toast.error('Please set your ElevenLabs API key first');
      return false;
    }

    const targetCaseId = caseId || currentCase?.id;
    if (!targetCaseId) {
      toast.error('No active case found to start the connection.');
      return false;
    }

    try {
      console.log('🚀 Starting ElevenLabs connection for case:', targetCaseId);
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to the ElevenLabs agent
      const conversationId = await conversation.startSession({
        agentId: ELEVEN_LABS_AGENT_ID
      });
      
      console.log('📞 ElevenLabs session started with conversation ID:', conversationId);
      
      // Store the conversation ID in the current case
      if (conversationId && updateConversationId) {
        console.log('💾 Setting conversation ID in case:', targetCaseId);
        await updateConversationId(conversationId, targetCaseId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to agent:', error);
      toast.error('Failed to connect to voice agent. Please check microphone permissions.');
      return false;
    }
  };

  const endConnection = async () => {
    try {
      console.log('🛑 Ending ElevenLabs connection...');
      await conversation.endSession();
      console.log('✅ ElevenLabs session ended successfully');
      return true;
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      return false;
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      endConnection();
      toast.info('Recording stopped', {
        position: 'top-center',
        duration: 2000,
      });
    } else {
      startConnection();
    }
  };

  const startListening = async () => {
    await startConnection();
  };

  const stopListening = () => {
    endConnection();
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Simulate speech time based on text length
      await new Promise(resolve => setTimeout(resolve, 100 * text.length));
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Text-to-speech error', error);
      await addMessage("Failed to generate speech.", 'ai');
      setIsSpeaking(false);
    }
  };

  React.useEffect(() => {
    console.log('📊 currentTranscription state changed:', {
      value: currentTranscription,
      length: currentTranscription?.length || 0,
      isListening
    });
  }, [currentTranscription, isListening]);

  return (
    <VoiceContext.Provider value={{
      config,
      isConfigured,
      isListening,
      isSpeaking: conversation.isSpeaking || isSpeaking,
      audioLevel,
      currentTranscription,
      setApiKey,
      startListening,
      stopListening,
      speak,
      connectToAgent: startConnection,
      disconnectFromAgent: endConnection,
      toggleMicrophone,
      generateTranscriptFromAudio,
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
