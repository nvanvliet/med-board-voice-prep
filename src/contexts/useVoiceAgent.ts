
import { useConversation } from '@11labs/react';
import { ELEVEN_LABS_AGENT_ID } from '@/config/voiceConfig';
import { toast } from 'sonner';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { ElevenLabsService } from '@/services/elevenLabsService';
import { useVoiceAgentHelpers } from './useVoiceAgentHelpers';

/**
 * Custom hook for all ElevenLabs conversation/session handling logic
 * Used internally by VoiceContextProvider
 */
export function useVoiceAgent({
  config,
  currentCase,
  updateConversationId,
  addMessage,
  updateTranscript,
  setCurrentTranscription,
  setIsListening,
  setIsSpeaking,
  resetAudioLevel,
  updateAudioLevel,
}: {
  config: any;
  currentCase: any;
  updateConversationId: any;
  addMessage: any;
  updateTranscript: any;
  setCurrentTranscription: any;
  setIsListening: any;
  setIsSpeaking: any;
  resetAudioLevel: any;
  updateAudioLevel: any;
}) {
  const { processAudioChunk } = useVoiceAgentHelpers({
    addMessage,
    updateTranscript,
    currentCase,
  });

  const conversation = useConversation({
    onMessage: (message: any) => {
      if (message.type === 'user_transcript') {
        setCurrentTranscription(message.message);
        if (message.is_final) {
          const audioId = message.audio_id || Date.now().toString();
          if (message.message.trim()) {
            processAudioChunk(message.message, 'user', audioId);
          }
        }
      } else if (message.type === 'agent_response') {
        if (message.message.trim()) {
          processAudioChunk(message.message, 'ai');
        }
        setCurrentTranscription(null);
      } else if (message.source === 'user' && message.message) {
        const audioId = message.audio_id || Date.now().toString();
        processAudioChunk(message.message, 'user', audioId);
        setCurrentTranscription(null);
      } else if ((message.source === 'ai' || message.source === 'agent') && message.message) {
        processAudioChunk(message.message, 'ai');
        setCurrentTranscription(null);
      }
    },
    onError: (error) => {
      console.error('❌ ElevenLabs agent error:', error);
      toast.error('Error communicating with voice service');
    },
    onConnect: () => {
      setIsListening(true);
      updateAudioLevel(true);
      toast.success('Connected to voice agent', {
        position: 'top-center',
        duration: 2000,
      });
    },
    onDisconnect: () => {
      setIsListening(false);
      setIsSpeaking(false);
      resetAudioLevel();
    },
  });

  return conversation;
}
