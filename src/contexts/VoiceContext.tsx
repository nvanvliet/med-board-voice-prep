
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ElevenLabsConfig } from '@/types';
import { toast } from 'sonner';
import { useCase } from '@/contexts/CaseContext';
import { useConversation } from '@11labs/react';

// Define the agent ID
const ELEVEN_LABS_AGENT_ID = 'pbVKPG3uJWVU0KsvdQlO';

interface VoiceContextType {
  config: ElevenLabsConfig;
  isConfigured: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  currentTranscription: string | null;
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

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ElevenLabsConfig>(defaultConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const { addMessage } = useCase();
  
  // Initialize the ElevenLabs conversation
  const conversation = useConversation({
    onMessage: (message) => {
      // Log the message to debug structure
      console.log('Received message from ElevenLabs:', message);
      
      // Check if message has correct structure
      if ('message' in message && 'source' in message) {
        // Handle the message based on its source (user or system)
        const messageText = message.message;
        const source = message.source;
        
        // Check if it's a user message and handle transcription
        if (source === 'user') {
          // For user messages, check if it's final or interim transcription
          // Since we don't have a 'final' property directly, look for patterns
          // that might indicate a final transcription
          const isFinal = messageText.trim().endsWith('.') || 
                          messageText.trim().endsWith('?') || 
                          messageText.trim().endsWith('!');
          
          if (isFinal) {
            // Final user transcript - add to messages
            addMessage(messageText, 'user');
            setCurrentTranscription(null);
          } else {
            // We no longer show current transcription on screen
            // But we still track it internally for processing purposes
            setCurrentTranscription(messageText);
          }
        } 
        // Handle messages from the system (avoiding the 'assistant' string comparison)
        else if (source !== 'user') {
          // Convert any non-user message to our internal message format
          addMessage(messageText, 'ai');
        }
      }
    },
    onError: (error) => {
      console.error('ElevenLabs agent error:', error);
      toast.error('Error communicating with voice service');
    }
  });

  // For simplicity, we'll consider it always configured
  const isConfigured = true;
  
  const setApiKey = (apiKey: string) => {
    setConfig({ ...config, apiKey });
  };

  const connectToAgent = async () => {
    try {
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to the ElevenLabs agent
      await conversation.startSession({
        agentId: ELEVEN_LABS_AGENT_ID
      });
      
      // Set isListening to true when connecting
      setIsListening(true);
      
      // Update audio level with animation frame
      updateAudioLevel();
      
      // Show a toast notification that microphone is active
      toast.success('Connected to voice service', {
        position: 'top-center',
        duration: 2000,
      });
      
      console.log('Connected to voice agent, listening active');
    } catch (error) {
      console.error('Failed to connect microphone:', error);
      toast.error('Failed to connect microphone. Please check permissions.', {
        position: 'top-center',
        duration: 3000,
      });
    }
  };
  
  const disconnectFromAgent = async () => {
    try {
      // End the ElevenLabs session
      await conversation.endSession();
      
      setIsListening(false);
      setAudioLevel(0);
      setCurrentTranscription(null);
      console.log('Disconnected from voice agent');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // Function to toggle microphone
  const toggleMicrophone = () => {
    console.log("Toggle microphone called, current state:", isListening);
    
    if (isListening) {
      // If currently listening, temporarily mute the microphone
      conversation.setVolume({ volume: 0 });
      
      setIsListening(false);
      setAudioLevel(0);
      setCurrentTranscription(null);
      
      toast.info('Microphone turned off', {
        position: 'top-center',
        duration: 2000,
      });
    } else {
      // If not listening, resume microphone
      conversation.setVolume({ volume: 1 });
      
      setIsListening(true);
      updateAudioLevel();
      
      toast.success('Microphone turned on', {
        position: 'top-center',
        duration: 2000,
      });
    }
  };

  const updateAudioLevel = () => {
    if (!isListening) return;
    
    // Simulate audio levels
    const randomValue = Math.random() * 0.5; // Random value between 0 and 0.5
    setAudioLevel(randomValue);
    
    // Continue animation if still listening
    if (isListening) {
      requestAnimationFrame(updateAudioLevel);
    }
  };

  const startListening = async () => {
    try {
      // Connect to voice agent
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
