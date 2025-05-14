
import { ElevenLabsConfig } from '@/types';

export interface VoiceContextType {
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
  connectToAgent: () => Promise<boolean>;
  disconnectFromAgent: () => Promise<boolean>;
  toggleMicrophone: () => void;
}

export interface ConversationMessage {
  message: string;
  source: string;
}
