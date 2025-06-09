
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VoiceContextType } from '@/types/voice';
import { useCase } from '@/contexts/CaseContext';
import { defaultVoiceConfig } from '@/config/voiceConfig';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { SpeechToTextService } from '@/services/speechToTextService';
import { toast } from 'sonner';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultVoiceConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const [speechToTextService, setSpeechToTextService] = useState<SpeechToTextService | null>(null);
  const { addMessage, updateTranscript } = useCase();
  
  const { audioLevel, updateAudioLevel, resetAudioLevel } = useAudioVisualization();

  // For now, we'll consider it configured if we have an API key
  const isConfigured = !!config.apiKey;
  
  const setApiKey = (apiKey: string) => {
    const newConfig = { ...config, apiKey };
    setConfig(newConfig);
    
    // Create new speech service with the API key
    if (apiKey) {
      setSpeechToTextService(new SpeechToTextService(apiKey));
    }
  };

  const startConnection = async () => {
    if (!speechToTextService) {
      toast.error('Please set your ElevenLabs API key first');
      return false;
    }

    try {
      await speechToTextService.startRecording((text, isFinal) => {
        console.log('Transcription received:', { text, isFinal });
        
        if (isFinal) {
          // Final transcription - add as permanent message and clear live transcription
          addMessage(text, 'user');
          updateTranscript(text, 'user');
          setCurrentTranscription(null);
        } else {
          // Interim transcription - show live
          setCurrentTranscription(text);
        }
      });

      setIsListening(true);
      updateAudioLevel(true);
      
      toast.success('Recording started', {
        position: 'top-center',
        duration: 2000,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
      return false;
    }
  };
  
  const endConnection = async () => {
    if (speechToTextService) {
      speechToTextService.stopRecording();
    }
    
    setIsListening(false);
    setIsSpeaking(false);
    resetAudioLevel();
    setCurrentTranscription(null);
    
    return true;
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
