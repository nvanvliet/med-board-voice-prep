
import { useEffect, useRef } from 'react';
import { useCase } from '@/contexts/CaseContext';
import MessageBubble from './MessageBubble';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function ConversationView() {
  const { messages, endCurrentCase, currentCase, isLoading } = useCase();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize ElevenLabs widget when component mounts
  useEffect(() => {
    if (widgetRef.current && !widgetRef.current.querySelector('elevenlabs-convai')) {
      // Create the widget element
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', 'pbVKPG3uJWVU0KsvdQlO');
      
      // Add event listeners for transcript capture
      widget.addEventListener('message', (event: any) => {
        console.log('ElevenLabs widget message:', event.detail);
        // Handle transcript messages here if needed
      });

      widgetRef.current.appendChild(widget);

      // Load the script if not already loaded
      if (!document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        script.type = 'text/javascript';
        document.head.appendChild(script);
      }
    }
  }, []);

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
              Use the voice widget below to start speaking with the AI assistant
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* ElevenLabs ConvAI Widget */}
      <div className="border-t p-4">
        <div ref={widgetRef} className="w-full flex justify-center mb-4">
          {/* Widget will be inserted here by useEffect */}
        </div>
        
        <div className="mt-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={endCurrentCase}
          >
            End Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
