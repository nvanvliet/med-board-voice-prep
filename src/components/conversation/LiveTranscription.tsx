
import React, { useEffect, useState } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import { ElevenLabsService } from '@/services/elevenLabsService';
import { defaultVoiceConfig } from '@/config/voiceConfig';

export default function LiveTranscription() {
  const { currentCase } = useCase();
  const { isListening } = useVoice();
  const [liveTranscription, setLiveTranscription] = useState<string | null>(null);

  useEffect(() => {
    let polling: NodeJS.Timeout | null = null;
    let service: ElevenLabsService | null = null;

    async function poll() {
      if (!currentCase?.conversationId || !isListening) return;
      try {
        if (!service) service = new ElevenLabsService(defaultVoiceConfig.apiKey);
        const state = await service.getConversationStatus(currentCase.conversationId);
        // Use "transcript" property, not "pending_transcript"
        if (state?.transcript) {
          setLiveTranscription(state.transcript);
        } else {
          setLiveTranscription(null);
        }
      } catch (err) {
        setLiveTranscription(null);
      }
    }

    if (currentCase?.conversationId && isListening) {
      polling = setInterval(() => {
        poll();
      }, 1000);
    }
    return () => {
      if (polling) clearInterval(polling);
    };
  }, [currentCase?.conversationId, isListening]);

  if (!currentCase?.conversationId || !isListening) return null;
  if (!liveTranscription) return null;

  return (
    <div className="mt-2 animate-pulse px-2 py-1 rounded text-muted-foreground bg-background/70 border border-muted max-w-2xl mx-auto text-center">
      {liveTranscription}
    </div>
  );
}
