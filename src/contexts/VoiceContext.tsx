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
  toggleMicrophone: () => void;
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
      console.log('ElevenLabs message received:', message);
      
      // Handle user messages (transcriptions)
      if (message.source === 'user') {
        // Always update live transcription, regardless of is_final
        console.log('Setting transcription to:', message.message);
        setTranscription(message.message);
        
        // Only add to chat history if final
        if (message.is_final === true) {
          console.log('Adding final user message to chat');
          addMessage(message.message, 'user');
          // Clear transcription after adding final message to avoid duplication
          setTranscription('');
        }
      }
      // Handle AI responses
      else if (message.source === 'ai') {
        console.log('Adding AI message to chat');
        // Update transcription to show what AI is saying
        setTranscription(message.message);
        
        // Add it to the messages history
        addMessage(message.message, 'ai');
        
        // Keep transcription visible for a moment to ensure users see it
        // before clearing it to prepare for next interaction
        setTimeout(() => {
          setTranscription('');
        }, 1000);
        
        // Also trigger text-to-speech
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
        console.log('Starting new ElevenLabs session');
        // Connect to ElevenLabs agent
        await conversation.startSession({
          agentId: AGENT_ID
        });
        setSessionActive(true);
        
        // Initialize with empty messages to ensure it's visible in the ConversationView
        setTranscription('Connecting to AI assistant...');
        
        // Clear the connection message after a short delay
        setTimeout(() => {
          if (transcription === 'Connecting to AI assistant...') {
            setTranscription('');
          }
        }, 2000);
      }
      
      // Always set isListening to true when connecting
      setIsListening(true);
      
      // Update audio level with animation frame
      updateAudioLevel();
      
      // Show a toast notification that microphone is active
      toast.success('Microphone turned on', {
        position: 'top-center',
        duration: 2000,
      });
      
      console.log('Connected to ElevenLabs agent, listening active');
    } catch (error) {
      console.error('Failed to connect to ElevenLabs agent:', error);
      toast.error('Failed to connect microphone. Please check permissions.', {
        position: 'top-center',
        duration: 3000,
      });
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
      console.log('Disconnected from ElevenLabs agent');
    } catch (error) {
      console.error('Error disconnecting from agent:', error);
    }
  };

  // Function to toggle microphone without ending the conversation
  const toggleMicrophone = () => {
    console.log("Toggle microphone called, current state:", isListening);
    
    if (isListening) {
      // If currently listening, just mute the microphone
      console.log('Muting microphone, conversation continues');
      setIsListening(false);
      setAudioLevel(0);
      // Don't clear transcription when muting, keep last transcription visible
    } else {
      // If not listening, resume microphone
      // Only start a new session if one isn't already active
      if (sessionActive) {
        console.log('Unmuting microphone, conversation continues');
        setIsListening(true);
        updateAudioLevel();
      } else {
        console.log('Starting new conversation and unmuting');
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
