
import { useConversation } from '@11labs/react';
import { ELEVEN_LABS_AGENT_ID } from '@/config/voiceConfig';
import { toast } from 'sonner';
import { ConversationMessage } from '@/types/voice';

export function useVoiceService(
  onMessageCallback: (text: string, source: 'user' | 'ai') => void,
  onTranscriptionCallback?: (text: string | null) => void
) {
  // Initialize the ElevenLabs conversation
  const conversation = useConversation({
    onMessage: (message: any) => {
      // Log the message to debug structure
      console.log('Received message from ElevenLabs:', message);
      
      // Handle different message types from ElevenLabs
      if (message.type === 'user_transcript') {
        // This is a user transcription (either interim or final)
        handleUserTranscript(message.message, message.is_final);
      } else if (message.type === 'agent_response') {
        // This is an AI response
        handleAgentResponse(message.message);
      } else if ('message' in message && 'source' in message) {
        // Fallback for other message formats
        const messageText = message.message;
        const source = message.source;
        handleMessageBySource(messageText, source);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs agent error:', error);
      toast.error('Error communicating with voice service');
    }
  });

  const handleUserTranscript = (text: string, isFinal: boolean) => {
    console.log('User transcript:', { text, isFinal });
    
    if (isFinal) {
      // This is the final transcription - add it as a permanent message
      onMessageCallback(text, 'user');
      
      // Clear any live transcription
      if (onTranscriptionCallback) {
        onTranscriptionCallback(null);
      }
    } else {
      // This is interim transcription - show it live
      if (onTranscriptionCallback) {
        onTranscriptionCallback(text);
      }
    }
  };

  const handleAgentResponse = (text: string) => {
    console.log('Agent response:', text);
    
    // Add AI response as permanent message
    onMessageCallback(text, 'ai');
    
    // Clear any live transcription
    if (onTranscriptionCallback) {
      onTranscriptionCallback(null);
    }
  };

  const handleMessageBySource = (messageText: string, source: string) => {
    console.log('Processing message:', { messageText, source });
    
    if (source === 'user') {
      // Add user message immediately as permanent
      onMessageCallback(messageText, 'user');
      
      // Clear any live transcription
      if (onTranscriptionCallback) {
        onTranscriptionCallback(null);
      }
    } else if (source === 'agent' || source === 'ai') {
      // Add AI message as permanent
      onMessageCallback(messageText, 'ai');
      
      // Clear any live transcription
      if (onTranscriptionCallback) {
        onTranscriptionCallback(null);
      }
    }
  };

  const connectToAgent = async () => {
    try {
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to the ElevenLabs agent
      await conversation.startSession({
        agentId: ELEVEN_LABS_AGENT_ID
      });
      
      // Show a toast notification that microphone is active
      toast.success('Connected to voice service', {
        position: 'top-center',
        duration: 2000,
      });
      
      console.log('Connected to voice agent, listening active');
      return true;
    } catch (error) {
      console.error('Failed to connect microphone:', error);
      toast.error('Failed to connect microphone. Please check permissions.', {
        position: 'top-center',
        duration: 3000,
      });
      return false;
    }
  };
  
  const disconnectFromAgent = async () => {
    try {
      // Clear transcription when disconnecting
      if (onTranscriptionCallback) {
        onTranscriptionCallback(null);
      }
      
      // End the ElevenLabs session
      await conversation.endSession();
      console.log('Disconnected from voice agent');
      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      return false;
    }
  };

  const toggleMicrophoneVolume = (isActive: boolean) => {
    if (isActive) {
      conversation.setVolume({ volume: 1 });
    } else {
      conversation.setVolume({ volume: 0 });
      // Clear transcription when muting
      if (onTranscriptionCallback) {
        onTranscriptionCallback(null);
      }
    }
  };

  return {
    conversation,
    connectToAgent,
    disconnectFromAgent,
    toggleMicrophoneVolume
  };
}
