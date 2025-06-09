
import { useEffect, useRef } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import MessageBubble from './MessageBubble';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function ConversationView() {
  const { messages, endCurrentCase, currentCase, isLoading } = useCase();
  const { disconnectFromAgent } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEndConversation = async () => {
    // Disconnect from voice agent first
    await disconnectFromAgent();
    
    // Then end the conversation case
    endCurrentCase();
    
    toast.info('Conversation ended', {
      position: 'top-center',
      duration: 2000,
    });
  };

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
      {/* Case title display */}
      {currentCase && (
        <div className="bg-white/80 backdrop-blur-sm dark:bg-background/80 border-b p-4">
          <h2 className="text-lg font-medium">{currentCase.title}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(currentCase.date).toLocaleString()}
          </p>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              No messages yet. Start your conversation!
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* Controls */}
      <div className="border-t p-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleEndConversation}
        >
          End Conversation
        </Button>
      </div>
    </div>
  );
}
