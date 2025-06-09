
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
      
      // Check if message has correct structure
      if ('message' in message && 'source' in message) {
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

  const handleMessageBySource = (messageText: string, source: string) => {
    console.log('Processing message:', { messageText, source });
    
    if (source === 'user') {
      // For user messages, show live transcription first
      if (onTranscriptionCallback) {
        onTranscriptionCallback(messageText);
      }
      
      // After a short delay, convert to final message and clear transcription
      setTimeout(() => {
        onMessageCallback(messageText, 'user');
        if (onTranscriptionCallback) {
          onTranscriptionCallback(null);
        }
      }, 1000); // Give 1 second to see the transcription
      
    } else {
      // For AI messages, clear any pending transcription and add as final message
      if (onTranscriptionCallback) {
        onTranscriptionCallback(null);
      }
      onMessageCallback(messageText, 'ai');
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
