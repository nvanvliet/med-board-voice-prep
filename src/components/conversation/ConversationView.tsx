
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
            <div className="text-center p-8">
              <div className="text-xl font-semibold mb-4">Exam in Progress</div>
              <p className="text-muted-foreground">Your conversation is being recorded and saved to the database.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Messages: {messages.length}
              </p>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <ConversationFooter onEndConversation={endCurrentCase} />
    </div>
  );
}
