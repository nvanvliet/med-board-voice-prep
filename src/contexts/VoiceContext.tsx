
import React, { createContext, useContext, useState, ReactNode } from 'react';
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
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ElevenLabsConfig>(() => {
    const savedKey = localStorage.getItem('elevenlabs-api-key');
    return {
      ...defaultConfig,
      apiKey: savedKey || undefined
    };
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const isConfigured = Boolean(config.apiKey);
  
  const setApiKey = (apiKey: string) => {
    localStorage.setItem('elevenlabs-api-key', apiKey);
    setConfig({ ...config, apiKey });
    toast.success('ElevenLabs API key saved');
  };

  const startListening = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Media devices not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context for visualization
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = context.createAnalyser();
      const microphone = context.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Monitor audio levels
      const checkAudioLevel = () => {
        if (!isListening) return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(average / 256); // Normalize to 0-1
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      // Setup recording
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // In a real implementation, this is where we'd send the audio to ElevenLabs
        // or another speech-to-text service
        
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioContext(context);
      setIsListening(true);
      recorder.start();
      checkAudioLevel();
      
    } catch (error) {
      console.error('Error accessing microphone', error);
      toast.error('Could not access microphone');
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsListening(false);
    setAudioLevel(0);
  };

  const speak = async (text: string) => {
    if (!isConfigured) {
      toast.error('ElevenLabs API key not configured');
      return;
    }
    
    try {
      setIsSpeaking(true);
      
      // In a real implementation, this would call the ElevenLabs API
      console.log(`Speaking: "${text}" with voice ${config.voiceId} using model ${config.modelId}`);
      
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
