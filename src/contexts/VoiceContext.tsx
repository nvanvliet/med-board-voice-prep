
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VoiceContextType } from '@/types/voice';
import { useCase } from '@/contexts/CaseContext';
import { defaultVoiceConfig } from '@/config/voiceConfig';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { useVoiceService } from '@/services/voiceService';
import { toast } from 'sonner';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultVoiceConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const { addMessage } = useCase();
  
  // Use our custom hooks
  const { audioLevel, updateAudioLevel, resetAudioLevel } = useAudioVisualization();
  const { connectToAgent, disconnectFromAgent, toggleMicrophoneVolume } = useVoiceService((text, source) => {
    // Handle messages from the voice service
    if (source === 'user') {
      addMessage(text, 'user');
      setCurrentTranscription(null);
    } else {
      addMessage(text, 'ai');
    }
  });

  // For simplicity, we'll consider it always configured
  const isConfigured = true;
  
  const setApiKey = (apiKey: string) => {
    setConfig({ ...config, apiKey });
  };

  const startConnection = async () => {
    const success = await connectToAgent();
    
    if (success) {
      setIsListening(true);
      updateAudioLevel(true);
    }
    
    return success;
  };
  
  const endConnection = async () => {
    const success = await disconnectFromAgent();
    
    if (success) {
      setIsListening(false);
      resetAudioLevel();
      setCurrentTranscription(null);
    }
    
    return success;
  };

  // Function to toggle microphone
  const toggleMicrophone = () => {
    console.log("Toggle microphone called, current state:", isListening);
    
    if (isListening) {
      // If currently listening, temporarily mute the microphone
      toggleMicrophoneVolume(false);
      
      setIsListening(false);
      resetAudioLevel();
      setCurrentTranscription(null);
      
      toast.info('Microphone turned off', {
        position: 'top-center',
        duration: 2000,
      });
    } else {
      // If not listening, resume microphone
      toggleMicrophoneVolume(true);
      
      setIsListening(true);
      updateAudioLevel(true);
      
      toast.success('Microphone turned on', {
        position: 'top-center',
        duration: 2000,
      });
    }
  };

  const startListening = async () => {
    try {
      // Connect to voice agent
      await startConnection();
    } catch (error) {
      console.error('Error accessing microphone', error);
      addMessage("Could not access microphone. Please check your browser permissions.", 'ai');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    resetAudioLevel();
    setCurrentTranscription(null);
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Simulate speech time based on text length
      await new Promise(resolve => setTimeout(resolve, 100 * text.length));
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Text-to-speech error', error);
      addMessage("Failed to generate speech.", 'ai');
      setIsSpeaking(false);
    }
  };

  return (
    <VoiceContext.Provider value={{
      config,
      isConfigured,
      isListening,
      isSpeaking,
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
