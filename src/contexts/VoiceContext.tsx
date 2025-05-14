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
  apiKey: 'using-convai-widget', // Using Convai widget instead of direct API
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

declare global {
  interface Window {
    elevenLabsConvai?: {
      startConversation: () => void;
      endConversation: () => void;
      isWidgetOpen: () => boolean;
      openWidget: () => void;
      closeWidget: () => void;
    };
  }
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ElevenLabsConfig>(defaultConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // With Convai widget, we're always configured
  const isConfigured = true;
  
  useEffect(() => {
    // Check if the Convai widget is loaded
    const checkConvaiWidget = setInterval(() => {
      if (window.elevenLabsConvai) {
        clearInterval(checkConvaiWidget);
        console.log('ElevenLabs Convai widget loaded');
      }
    }, 1000);
    
    return () => clearInterval(checkConvaiWidget);
  }, []);
  
  const setApiKey = (apiKey: string) => {
    // No longer needed with Convai widget, but keeping the function for compatibility
    toast.success('Using integrated ElevenLabs Convai widget');
  };

  const startListening = async () => {
    if (window.elevenLabsConvai) {
      try {
        // Make sure to initialize the audio context for audio level visualization
        if (!audioContext) {
          const context = new AudioContext();
          setAudioContext(context);
        }
        
        // Start the conversation without opening the widget visibly
        window.elevenLabsConvai.startConversation();
        setIsListening(true);
        
        // Request microphone access
        try {
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
          }
        } catch (err) {
          console.error('Error accessing microphone', err);
          toast.error('Could not access microphone');
          setIsListening(false);
        }
        
        toast.success('Microphone activated', { duration: 2000 });
      } catch (error) {
        console.error('Error starting Convai widget', error);
        toast.error('Could not start conversation');
        setIsListening(false);
      }
    } else {
      toast.error('ElevenLabs Convai widget not loaded yet');
    }
  };

  const stopListening = () => {
    if (window.elevenLabsConvai) {
      window.elevenLabsConvai.endConversation();
    }
    
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
      
      // With Convai widget, we don't need to directly handle speaking
      // This function is kept for compatibility
      console.log(`Text to speak: "${text}"`);
      
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
