
export interface User {
  id: string;
  email: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string; // ISO string
}

export interface Case {
  id: string;
  userId: string;
  title: string;
  date: string; // ISO string
  messages: Message[];
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export interface ElevenLabsConfig {
  apiKey?: string;
  voiceId: string;
  modelId: string;
}
