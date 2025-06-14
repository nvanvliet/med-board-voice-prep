
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

  // Add explicit debug logging for all agent messages.
  const conversation = useConversation({
    onMessage: (message: any) => {
      console.log('⚡ ElevenLabs useVoiceAgent - Received message:', message);

      // Explicitly log for interim and final transcript
      if (message.type === 'user_transcript') {
        console.log(
          `[useVoiceAgent] user_transcript received | is_final: ${message.is_final ?? 'undefined'} | message: "${message.message}"`
        );

        // Always update context with transcript! (show live)
        setCurrentTranscription(message.message);

        if (message.is_final) {
          const audioId = message.audio_id || Date.now().toString();
          if (message.message.trim()) {
            processAudioChunk(message.message, 'user', audioId);
          }
          // Clear transcription so user input box isn't stuck with last words
          setCurrentTranscription(null);
        }
      } else if (message.type === 'agent_response') {
        console.log('[useVoiceAgent] agent_response:', message.message);
        if (message.message.trim()) {
          processAudioChunk(message.message, 'ai');
        }
        setCurrentTranscription(null);
      } else if (message.source === 'user' && message.message) {
        const audioId = message.audio_id || Date.now().toString();
        console.log(`[useVoiceAgent] Fallback user message: "${message.message}" (id: ${audioId})`);
        processAudioChunk(message.message, 'user', audioId);
        setCurrentTranscription(null);
      } else if ((message.source === 'ai' || message.source === 'agent') && message.message) {
        console.log('[useVoiceAgent] Fallback ai/agent message:', message.message);
        processAudioChunk(message.message, 'ai');
        setCurrentTranscription(null);
      } else {
        console.log('[useVoiceAgent] Unrecognized or empty message:', message);
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
