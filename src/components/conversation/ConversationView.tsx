
import { useEffect, useRef } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import MessageBubble from './MessageBubble';
import ConversationFooter from './ConversationFooter';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ConversationView() {
  const { messages, endCurrentCase, currentCase, isLoading } = useCase();
  const { isListening, isSpeaking, audioLevel, currentTranscription } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or transcription updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscription]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading case...</p>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Live transcription display */}
          {currentTranscription && (
            <div className="ml-auto max-w-[80%]">
              <div className="rounded-lg p-4 bg-gray-100 border-2 border-dashed border-gray-300 text-gray-700 rounded-br-none">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Speaking...</span>
                </div>
                {currentTranscription}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                Live transcription
              </div>
            </div>
          )}

          {/* AI speaking indicator */}
          {isSpeaking && !currentTranscription && (
            <div className="mr-auto max-w-[80%]">
              <div className="rounded-lg p-4 bg-[#9b87f5] text-white rounded-bl-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm">AI is speaking...</span>
                </div>
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
