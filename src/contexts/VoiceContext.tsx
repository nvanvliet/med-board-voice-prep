
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ElevenLabsConfig } from '@/types';
import { toast } from 'sonner';
import { useConversation } from '@11labs/react';
import { useCase } from '@/contexts/CaseContext';

// Define the structure of ElevenLabs message
interface ElevenLabsMessage {
  message: string;
  source: 'user' | 'ai';
  is_final?: boolean; // Make it optional since some messages might not have this property
}

interface VoiceContextType {
  config: ElevenLabsConfig;
  isConfigured: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  transcription: string;
  setApiKey: (apiKey: string) => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  connectToAgent: () => Promise<void>;
  disconnectFromAgent: () => Promise<void>;
  toggleMicrophone: () => void; // New function for toggling microphone
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
  const [transcription, setTranscription] = useState<string>('');
  const [sessionActive, setSessionActive] = useState(false);
  const { addMessage } = useCase();

  // Use the ElevenLabs conversation hook
  const conversation = useConversation({
    onMessage: (message: ElevenLabsMessage) => {
      console.log('ElevenLabs message:', message);
      
      // Update transcription for user messages in progress
      if (message.source === 'user' && message.is_final === false) {
        setTranscription(message.message);
      }
      
      // Forward final messages from ElevenLabs to the chat interface
      if (message.source === 'user' && message.is_final === true) {
        addMessage(message.message, 'user');
        setTranscription(''); // Clear transcription once the message is final
      }
      else if (message.source === 'ai') {
        addMessage(message.message, 'ai');
        speak(message.message);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      addMessage("There was an error connecting to ElevenLabs.", 'ai');
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
      if (sessionActive) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [sessionActive]);
  
  const setApiKey = (apiKey: string) => {
    setConfig({ ...config, apiKey });
  };

  const connectToAgent = async () => {
    try {
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Only start a new session if one isn't already active
      if (!sessionActive) {
        // Connect to ElevenLabs agent
        await conversation.startSession({
          agentId: AGENT_ID
        });
        setSessionActive(true);
      }
      
      setIsListening(true);
      setTranscription(''); // Reset transcription when starting a new session
      
      // Update audio level with animation frame
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to connect to ElevenLabs agent:', error);
      addMessage("Failed to connect to ElevenLabs agent. Please check your microphone permissions.", 'ai');
    }
  };
  
  const disconnectFromAgent = async () => {
    try {
      // Only end the session if we're fully disconnecting
      await conversation.endSession();
      setIsListening(false);
      setAudioLevel(0);
      setTranscription(''); // Clear transcription when disconnecting
      setSessionActive(false);
    } catch (error) {
      console.error('Error disconnecting from agent:', error);
    }
  };

  // New function to toggle microphone without ending the conversation
  const toggleMicrophone = () => {
    if (isListening) {
      // If currently listening, just mute the microphone
      setIsListening(false);
      setAudioLevel(0);
    } else {
      // If not listening, resume microphone
      // Only start a new session if one isn't already active
      if (sessionActive) {
        setIsListening(true);
        updateAudioLevel();
      } else {
        connectToAgent();
      }
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
      addMessage("Could not access microphone. Please check your browser permissions.", 'ai');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setAudioLevel(0);
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
      transcription,
      setApiKey,
      startListening,
      stopListening,
      speak,
      connectToAgent,
      disconnectFromAgent,
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
