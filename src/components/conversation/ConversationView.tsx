
import { useEffect, useRef } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import MessageBubble from './MessageBubble';
import ConversationFooter from './ConversationFooter';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ConversationView() {
  const { messages, endCurrentCase, currentCase } = useCase();
  const { isListening, isSpeaking, audioLevel, currentTranscription } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or transcription updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscription]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ScrollArea className="flex-1 p-4">
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
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              {isListening ? 'Listening... Speak to the AI assistant' : 'Click the microphone icon to start speaking'}
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {/* Show current voice transcription while listening */}
          {currentTranscription && (
            <div className="ml-auto max-w-[80%]">
              <div className="rounded-lg p-4 bg-[#1A1F2C] text-white rounded-br-none opacity-70">
                <div className="flex items-center">
                  <span>{currentTranscription}</span>
                  <span className="ml-2 animate-pulse">•</span>
                </div>
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
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <ConversationFooter onEndConversation={endCurrentCase} />
    </div>
  );
}
