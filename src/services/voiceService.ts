
import { useConversation } from '@11labs/react';
import { ELEVEN_LABS_AGENT_ID } from '@/config/voiceConfig';
import { toast } from 'sonner';
import { ConversationMessage } from '@/types/voice';

export function useVoiceService(onMessageCallback: (text: string, source: 'user' | 'ai') => void) {
  // Initialize the ElevenLabs conversation
  const conversation = useConversation({
    onMessage: (message: any) => {
      // Log the message to debug structure
      console.log('Received message from ElevenLabs:', message);
      
      // Check if message has correct structure
      if ('message' in message && 'source' in message) {
        // Handle the message based on its source (user or system)
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
        onMessageCallback(messageText, 'user');
      } 
    } 
    // Handle messages from the system (anything not from user)
    else if (source !== 'user') {
      // Convert any non-user message to our internal message format
      // We use 'as' to safely handle the type conversion
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
    }
  };

  return {
    conversation,
    connectToAgent,
    disconnectFromAgent,
    toggleMicrophoneVolume
  };
}
