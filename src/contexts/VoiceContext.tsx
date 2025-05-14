
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ElevenLabsConfig } from '@/types';
import { toast } from 'sonner';

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
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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
    };
  }, []);
  
  const setApiKey = (apiKey: string) => {
    setConfig({ ...config, apiKey });
    toast.success('API key set successfully');
  };

  const startListening = async () => {
    try {
      // Initialize audio context for visualizations
      if (!audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create an audio analyzer to visualize audio levels
      if (audioContext) {
        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);
        
        // Start audio level visualization
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        const updateAudioLevel = () => {
          if (!isListening) return;
          
          analyzer.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          const normalized = Math.min(average / 128, 1); // Normalize to 0-1
          
          setAudioLevel(normalized);
          requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
        
        // Set up media recorder
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        
        // Start recording
        recorder.start();
        
        // Handle data availability
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // Here we would normally send data to the ElevenLabs API
            // But since we're removing that functionality, we'll just log it
            console.log('Audio data available', event.data.size);
          }
        };
      }
      
      setIsListening(true);
      toast.success('Microphone activated', { duration: 2000 });
    } catch (error) {
      console.error('Error accessing microphone', error);
      toast.error('Could not access microphone');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    setIsListening(false);
    setAudioLevel(0);
    toast.info('Microphone deactivated', { duration: 2000 });
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
      speak
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
