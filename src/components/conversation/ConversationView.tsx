
import { useEffect, useRef, useState } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import MessageBubble from './MessageBubble';
import ConversationFooter from './ConversationFooter';

export default function ConversationView() {
  const { messages, endCurrentCase, currentCase } = useCase();
  const { isListening, isSpeaking, audioLevel, transcription } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastTranscription, setLastTranscription] = useState('');
  const [lastSpeakerType, setLastSpeakerType] = useState<'user' | 'ai'>('user');

  // Store last valid transcription to avoid UI flicker and track speaker type
  useEffect(() => {
    if (transcription && transcription.trim() !== '') {
      setLastTranscription(transcription);
      // We determine speaker type based on whether the AI is speaking
      // If AI is speaking, show as AI, otherwise as user
      setLastSpeakerType(isSpeaking ? 'ai' : 'user');
      console.log("Updated transcription:", transcription, "Speaker:", isSpeaking ? 'ai' : 'user');
    }
  }, [transcription, isSpeaking]);

  // Auto-scroll to bottom when messages change or transcription updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, lastTranscription]);

  // Debug logging
  useEffect(() => {
    console.log("Current transcription:", transcription);
    console.log("Last transcription:", lastTranscription);
    console.log("Is listening:", isListening);
    console.log("Is speaking:", isSpeaking);
    console.log("Last speaker type:", lastSpeakerType);
    console.log("Audio level:", audioLevel);
  }, [transcription, lastTranscription, isListening, isSpeaking, lastSpeakerType, audioLevel]);
  
  // Track AI responses from messages
  useEffect(() => {
    // Check if the latest message is from AI and update state
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai') {
        // When new AI message arrives, update speaker type
        setLastSpeakerType('ai');
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Case title display */}
        {currentCase && (
          <div className="sticky top-0 bg-white/80 backdrop-blur-sm dark:bg-background/80 z-10 py-2 px-1 mb-4 border-b">
            <h2 className="text-lg font-medium">{currentCase.title}</h2>
            <p className="text-xs text-muted-foreground">
              {new Date(currentCase.date).toLocaleString()}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.length === 0 && !lastTranscription ? (
            <div className="text-center text-gray-500 my-8">
              {isListening ? 'Listening... Speak to the AI assistant' : 'Click the microphone icon to start speaking'}
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {/* Display conversation history with all past messages */}
              <div className="conversation-history space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
              
              {/* Show live transcription bubble only if there is transcription */}
              {lastTranscription && (
                <div className={`${lastSpeakerType === 'user' ? 'ml-auto' : 'mr-auto'} max-w-[80%]`}>
                  <div className={`${
                    lastSpeakerType === 'user' 
                      ? 'bg-medical-purple text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    } rounded-lg p-4 animate-pulse-slow`}>
                    {lastTranscription}
                    {isListening && lastSpeakerType === 'user' && (
                      <span className="inline-block ml-1 animate-pulse">...</span>
                    )}
                    {isSpeaking && lastSpeakerType === 'ai' && (
                      <span className="inline-block ml-1 animate-pulse">...</span>
                    )}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${lastSpeakerType === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      
      <ConversationFooter onEndConversation={endCurrentCase} />
    </div>
  );
}
