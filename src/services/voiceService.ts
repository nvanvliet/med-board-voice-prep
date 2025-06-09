
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
      if (message.type === 'user_transcript' && message.is_final) {
        // Only process final user transcripts as permanent messages
        console.log('Final user transcript:', message.message);
        onMessageCallback(message.message, 'user');
        
        // Clear live transcription
        if (onTranscriptionCallback) {
          onTranscriptionCallback(null);
        }
      } else if (message.type === 'user_transcript' && !message.is_final) {
        // Show interim transcription live
        console.log('Interim user transcript:', message.message);
        if (onTranscriptionCallback) {
          onTranscriptionCallback(message.message);
        }
      } else if (message.type === 'agent_response') {
        // This is an AI response - add as permanent message
        console.log('Agent response:', message.message);
        onMessageCallback(message.message, 'ai');
        
        // Clear live transcription
        if (onTranscriptionCallback) {
          onTranscriptionCallback(null);
        }
      } else if (message.source === 'user') {
        // Fallback for user messages
        console.log('User message (fallback):', message.message);
        onMessageCallback(message.message, 'user');
        
        if (onTranscriptionCallback) {
          onTranscriptionCallback(null);
        }
      } else if (message.source === 'ai' || message.source === 'agent') {
        // Fallback for AI messages
        console.log('AI message (fallback):', message.message);
        onMessageCallback(message.message, 'ai');
        
        if (onTranscriptionCallback) {
          onTranscriptionCallback(null);
        }
      }
    },
    onError: (error) => {
      console.error('ElevenLabs agent error:', error);
      toast.error('Error communicating with voice service');
    }
  });

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
