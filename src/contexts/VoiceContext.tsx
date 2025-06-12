
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VoiceContextType } from '@/types/voice';
import { useCase } from '@/contexts/CaseContext';
import { defaultVoiceConfig, ELEVEN_LABS_AGENT_ID } from '@/config/voiceConfig';
import { useAudioVisualization } from '@/hooks/useAudioVisualization';
import { useConversation } from '@11labs/react';
import { ElevenLabsService } from '@/services/elevenLabsService';
import { toast } from 'sonner';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultVoiceConfig);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const [elevenLabsService, setElevenLabsService] = useState<ElevenLabsService | null>(null);
  
  // Safely get case context
  let addMessage, updateTranscript, currentCase, updateConversationId;
  try {
    const caseContext = useCase();
    addMessage = caseContext.addMessage;
    updateTranscript = caseContext.updateTranscript;
    currentCase = caseContext.currentCase;
    updateConversationId = caseContext.updateConversationId;
  } catch (error) {
    console.error('VoiceContext: useCase hook error:', error);
    // Provide fallback functions
    addMessage = async () => {};
    updateTranscript = async () => {};
    currentCase = null;
    updateConversationId = async () => {};
  }
  
  const { audioLevel, updateAudioLevel, resetAudioLevel } = useAudioVisualization();

  // Initialize ElevenLabs service when API key changes
  React.useEffect(() => {
    if (config.apiKey) {
      setElevenLabsService(new ElevenLabsService(config.apiKey));
    }
  }, [config.apiKey]);

  const isConfigured = !!config.apiKey;
  
  // Process audio chunk immediately when received - this adds messages to the chat
  const processAudioChunk = async (text: string, sender: 'user' | 'ai', audioId?: string) => {
    console.log('🎯 processAudioChunk called:', { text, sender, audioId, hasCurrentCase: !!currentCase });
    
    if (!currentCase || !text.trim()) {
      console.warn('⚠️ No current case available or empty text for message saving');
      return;
    }

    try {
      console.log('📝 Processing audio chunk for chat display:', { text, sender, audioId, caseId: currentCase.id });
      
      // Add message to conversation chat immediately
      await addMessage(text.trim(), sender);
      
      // Also update transcript for record keeping
      await updateTranscript(text.trim(), sender, audioId);
      
      console.log('✅ Audio chunk processed and displayed in chat successfully');
    } catch (error) {
      console.error('❌ Failed to process audio chunk for chat:', error);
      toast.error('Failed to save message to chat');
    }
  };
  
  // Initialize the ElevenLabs conversation
  const conversation = useConversation({
    onMessage: (message: any) => {
      console.log('🎤 Received message from ElevenLabs:', message);
      console.log('🔍 Message details:', {
        type: message.type,
        source: message.source,
        is_final: message.is_final,
        messageText: message.message,
        messageLength: message.message?.length || 0
      });
      
      // Handle different message types from ElevenLabs and display them in chat
      if (message.type === 'user_transcript' && message.is_final) {
        console.log('✅ Final user transcript - adding to chat:', message.message);
        const audioId = message.audio_id || Date.now().toString();
        processAudioChunk(message.message, 'user', audioId);
        console.log('🧹 Clearing live transcription after final transcript');
        setCurrentTranscription(null);
      } else if (message.type === 'user_transcript' && !message.is_final) {
        console.log('⏳ Interim user transcript - showing as live transcription:', message.message);
        console.log('📝 Setting currentTranscription to:', message.message);
        setCurrentTranscription(message.message);
      } else if (message.type === 'agent_response') {
        console.log('🤖 Agent response - adding to chat:', message.message);
        processAudioChunk(message.message, 'ai');
        console.log('🧹 Clearing live transcription after agent response');
        setCurrentTranscription(null);
      } else if (message.source === 'user' && message.message) {
        console.log('👤 User message (fallback) - adding to chat:', message.message);
        const audioId = message.audio_id || Date.now().toString();
        processAudioChunk(message.message, 'user', audioId);
        console.log('🧹 Clearing live transcription after user message');
        setCurrentTranscription(null);
      } else if ((message.source === 'ai' || message.source === 'agent') && message.message) {
        console.log('🤖 AI message (fallback) - adding to chat:', message.message);
        processAudioChunk(message.message, 'ai');
        console.log('🧹 Clearing live transcription after AI message');
        setCurrentTranscription(null);
      } else {
        console.log('❓ Unhandled message type/source:', {
          type: message.type,
          source: message.source,
          hasMessage: !!message.message
        });
      }
    },
    onError: (error) => {
      console.error('❌ ElevenLabs agent error:', error);
      toast.error('Error communicating with voice service');
    },
    onConnect: () => {
      console.log('🔗 Connected to ElevenLabs agent');
      setIsListening(true);
      updateAudioLevel(true);
      toast.success('Connected to voice agent', {
        position: 'top-center',
        duration: 2000,
      });
    },
    onDisconnect: () => {
      console.log('🔌 Disconnected from ElevenLabs agent');
      setIsListening(false);
      setIsSpeaking(false);
      resetAudioLevel();
      console.log('🧹 Clearing transcription on disconnect');
      setCurrentTranscription(null);
    }
  });

  // Manual transcript generation using ElevenLabs API
  const generateTranscriptFromAudio = async (audioBlob: Blob): Promise<string | null> => {
    if (!elevenLabsService || !currentCase) {
      console.warn('ElevenLabs service not initialized or no current case');
      return null;
    }

    try {
      const result = await elevenLabsService.convertSpeechToText(audioBlob, config.modelId);
      if (result.text && result.text.trim()) {
        // Process the transcript immediately and add to chat
        await processAudioChunk(result.text.trim(), 'user', Date.now().toString());
        return result.text.trim();
      }
    } catch (error) {
      console.error('Error generating transcript:', error);
      toast.error('Failed to generate transcript');
    }
    return null;
  };
  
  const setApiKey = (apiKey: string) => {
    const newConfig = { ...config, apiKey };
    setConfig(newConfig);
  };

  const startConnection = async () => {
    if (!config.apiKey) {
      toast.error('Please set your ElevenLabs API key first');
      return false;
    }

    try {
      console.log('🚀 Starting ElevenLabs connection...');
      // Request microphone permission before connecting
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to the ElevenLabs agent
      const conversationId = await conversation.startSession({
        agentId: ELEVEN_LABS_AGENT_ID
      });
      
      console.log('📞 ElevenLabs session started with conversation ID:', conversationId);
      
      // Store the conversation ID in the current case
      if (conversationId && updateConversationId) {
        console.log('💾 Setting conversation ID in case:', conversationId);
        await updateConversationId(conversationId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to agent:', error);
      toast.error('Failed to connect to voice agent. Please check microphone permissions.');
      return false;
    }
  };
  
  const endConnection = async () => {
    try {
      console.log('🛑 Ending ElevenLabs connection...');
      console.log('🧹 Clearing transcription before disconnect');
      setCurrentTranscription(null);
      await conversation.endSession();
      console.log('✅ ElevenLabs session ended successfully');
      return true;
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      return false;
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      endConnection();
      toast.info('Recording stopped', {
        position: 'top-center',
        duration: 2000,
      });
    } else {
      startConnection();
    }
  };

  const startListening = async () => {
    await startConnection();
  };

  const stopListening = () => {
    endConnection();
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Simulate speech time based on text length
      await new Promise(resolve => setTimeout(resolve, 100 * text.length));
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Text-to-speech error', error);
      await addMessage("Failed to generate speech.", 'ai');
      setIsSpeaking(false);
    }
  };

  // Add effect to log currentTranscription changes
  React.useEffect(() => {
    console.log('📊 currentTranscription state changed:', {
      value: currentTranscription,
      length: currentTranscription?.length || 0,
      isListening
    });
  }, [currentTranscription, isListening]);

  return (
    <VoiceContext.Provider value={{
      config,
      isConfigured,
      isListening,
      isSpeaking: conversation.isSpeaking || isSpeaking,
      audioLevel,
      currentTranscription,
      setApiKey,
      startListening,
      stopListening,
      speak,
      connectToAgent: startConnection,
      disconnectFromAgent: endConnection,
      toggleMicrophone,
      generateTranscriptFromAudio
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
