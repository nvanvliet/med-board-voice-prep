
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VoiceContextType } from '@/types/voice';
import { useCase } from '@/contexts/CaseContext';
import { defaultVoiceConfig, ELEVEN_LABS_AGENT_ID } from '@/config/voiceConfig';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { useConversation } from '@11labs/react';
import { toast } from 'sonner';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultVoiceConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const { addMessage, updateTranscript } = useCase();
  
  const { audioLevel, updateAudioLevel, resetAudioLevel } = useAudioVisualization();

  // For now, we'll consider it configured if we have an API key
  const isConfigured = !!config.apiKey;
  
  // Initialize the ElevenLabs conversation
  const conversation = useConversation({
    onMessage: (message: any) => {
      console.log('Received message from ElevenLabs:', message);
      
      // Handle different message types from ElevenLabs
      if (message.type === 'user_transcript' && message.is_final) {
        console.log('Final user transcript:', message.message);
        addMessage(message.message, 'user');
        updateTranscript(message.message, 'user');
        setCurrentTranscription(null);
      } else if (message.type === 'user_transcript' && !message.is_final) {
        console.log('Interim user transcript:', message.message);
        setCurrentTranscription(message.message);
      } else if (message.type === 'agent_response') {
        console.log('Agent response:', message.message);
        addMessage(message.message, 'ai');
        setCurrentTranscription(null);
      } else if (message.source === 'user') {
        console.log('User message (fallback):', message.message);
        addMessage(message.message, 'user');
        updateTranscript(message.message, 'user');
        setCurrentTranscription(null);
      } else if (message.source === 'ai' || message.source === 'agent') {
        console.log('AI message (fallback):', message.message);
        addMessage(message.message, 'ai');
        setCurrentTranscription(null);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs agent error:', error);
      toast.error('Error communicating with voice service');
    },
    onConnect: () => {
      setIsListening(true);
      updateAudioLevel(true);
      toast.success('Connected to voice agent', {
        position: 'top-center',
        duration: 2000,
      });
    },
    onDisconnect: () => {
      setIsListening(false);
      setIsSpeaking(false);
      resetAudioLevel();
      setCurrentTranscription(null);
    }
  });
  
  const setApiKey = (apiKey: string) => {
    const newConfig = { ...config, apiKey };
    setConfig(newConfig);
  };

  const startConnection = async () => {
    if (!config.apiKey) {
      toast.error('Please set your ElevenLabs API key first');
      return false;
    }

    try {
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to the ElevenLabs agent
      await conversation.startSession({
        agentId: ELEVEN_LABS_AGENT_ID
      });
      
      return true;
    } catch (error) {
      console.error('Failed to connect to agent:', error);
      toast.error('Failed to connect to voice agent. Please check microphone permissions.');
      return false;
    }
  };
  
  const endConnection = async () => {
    try {
      setCurrentTranscription(null);
      await conversation.endSession();
      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
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
      toggleMicrophone
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
