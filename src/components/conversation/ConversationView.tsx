
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

  // Store last valid transcription to avoid UI flicker
  useEffect(() => {
    if (transcription && transcription.trim() !== '') {
      setLastTranscription(transcription);
    }
  }, [transcription]);

  // Auto-scroll to bottom when messages change or transcription updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, lastTranscription]);

  // Debug logging
  useEffect(() => {
    console.log("Current transcription:", transcription);
    console.log("Is listening:", isListening);
  }, [transcription, isListening]);

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
        
        {messages.length === 0 && !transcription ? (
          <div className="text-center text-gray-500 my-8">
            {isListening ? 'Listening... Speak to the AI assistant' : 'Click the microphone icon to start speaking'}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Show live transcript if there's text and we're listening */}
            {isListening && lastTranscription && (
              <div className="ml-auto max-w-[80%] mb-4">
                <div className="bg-medical-purple text-white rounded-lg rounded-br-none p-4">
                  {lastTranscription}
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ConversationFooter onEndConversation={endCurrentCase} />
    </div>
  );
}
