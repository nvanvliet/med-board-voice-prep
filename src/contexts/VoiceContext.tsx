
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ElevenLabsConfig } from '@/types';
import { toast } from 'sonner';
import { useConversation } from '@11labs/react';

interface VoiceContextType {
  config: ElevenLabsConfig;
  isConfigured: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  setApiKey: (apiKey: string) => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  connectToAgent: () => Promise<void>;
  disconnectFromAgent: () => Promise<void>;
}

const defaultConfig: ElevenLabsConfig = {
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
  modelId: 'eleven_multilingual_v2',
  apiKey: '',
};

// ElevenLabs agent ID
const AGENT_ID = 'pbVKPG3uJWVU0KsvdQlO';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ElevenLabsConfig>(defaultConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Use the ElevenLabs conversation hook
  const conversation = useConversation({
    onMessage: (message) => {
      console.log('ElevenLabs message:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast.error('Error connecting to ElevenLabs');
    }
  });

  // For simplicity, we'll consider it always configured
  const isConfigured = true;
  
  useEffect(() => {
    // Initialize audio context if needed
    if (!audioContext) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      } catch (err) {
        console.error('Could not initialize audio context', err);
      }
    }
    
    return () => {
      // Clean up any resources
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      // End conversation when component unmounts
      conversation.endSession().catch(console.error);
    };
  }, []);
  
  const setApiKey = (apiKey: string) => {
    setConfig({ ...config, apiKey });
    toast.success('API key set successfully');
  };

  const connectToAgent = async () => {
    try {
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to ElevenLabs agent
      await conversation.startSession({
        agentId: AGENT_ID
      });
      
      toast.success('Connected to ElevenLabs agent', { duration: 2000 });
      setIsListening(true);
      
      // Update audio level with animation frame
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to connect to ElevenLabs agent:', error);
      toast.error('Failed to connect to ElevenLabs agent');
    }
  };
  
  const disconnectFromAgent = async () => {
    try {
      await conversation.endSession();
      setIsListening(false);
      setAudioLevel(0);
      toast.info('Disconnected from ElevenLabs agent', { duration: 2000 });
    } catch (error) {
      console.error('Error disconnecting from agent:', error);
    }
  };

  const updateAudioLevel = () => {
    if (!isListening) return;
    
    // Simulate audio levels when connected to ElevenLabs
    const randomValue = Math.random() * 0.5; // Random value between 0 and 0.5
    setAudioLevel(randomValue);
    
    // Continue animation if still listening
    if (isListening) {
      requestAnimationFrame(updateAudioLevel);
    }
  };

  const startListening = async () => {
    try {
      // Connect to ElevenLabs agent
      await connectToAgent();
    } catch (error) {
      console.error('Error accessing microphone', error);
      toast.error('Could not access microphone');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    disconnectFromAgent();
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Simulate speech by showing a toast message
      toast.info(`AI: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`, {
        duration: Math.max(2000, text.length * 50) // Longer text, longer toast
      });
      
      // Simulate speech time based on text length
      await new Promise(resolve => setTimeout(resolve, 100 * text.length));
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Text-to-speech error', error);
      toast.error('Failed to generate speech');
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
      setApiKey,
      startListening,
      stopListening,
      speak,
      connectToAgent,
      disconnectFromAgent
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
