
/**
 * Helper functions for audio chunk processing for the VoiceAgent
 */
export function useVoiceAgentHelpers({
  addMessage,
  updateTranscript,
  currentCase,
}: {
  addMessage: any;
  updateTranscript: any;
  currentCase: any;
}) {
  return {
    processAudioChunk: async (text: string, sender: 'user' | 'ai', audioId?: string) => {
      if (!currentCase || !text.trim()) return;
      try {
        await addMessage(text.trim(), sender);
        await updateTranscript(text.trim(), sender, audioId);
      } catch (error) {
        console.error('❌ Failed to process audio chunk:', error);
      }
    },
  };
}
