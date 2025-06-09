
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
    console.log('ConversationView useEffect triggered');
    
    const initializeWidget = () => {
      if (widgetRef.current && !widgetRef.current.querySelector('elevenlabs-convai')) {
        console.log('Creating ElevenLabs widget in conversation view');
        
        // Clear any existing content
        widgetRef.current.innerHTML = '';
        
        // Create the widget element
        const widget = document.createElement('elevenlabs-convai');
        widget.setAttribute('agent-id', 'pbVKPG3uJWVU0KsvdQlO');
        
        // Add event listeners for transcript capture
        widget.addEventListener('message', (event: any) => {
          console.log('ElevenLabs widget message in conversation:', event.detail);
        });

        widget.addEventListener('conversationStarted', (event: any) => {
          console.log('Conversation started in view:', event);
        });

        widget.addEventListener('transcript', (event: any) => {
          console.log('Transcript received in view:', event.detail);
        });

        // Auto-start the conversation after widget is loaded
        widget.addEventListener('load', () => {
          console.log('Widget loaded, attempting to auto-start');
          // Try to auto-start the conversation
          setTimeout(() => {
            try {
              // Look for the start button and click it automatically
              const startButton = widget.shadowRoot?.querySelector('button[data-testid="start-call"]') || 
                                widget.shadowRoot?.querySelector('button:contains("Start call")') ||
                                widget.shadowRoot?.querySelector('button');
              
              if (startButton) {
                console.log('Auto-clicking start button');
                (startButton as HTMLButtonElement).click();
              }
            } catch (error) {
              console.log('Could not auto-start conversation:', error);
            }
          }, 1000);
        });

        widgetRef.current.appendChild(widget);
        console.log('ElevenLabs widget added to conversation view');
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="convai-widget-embed"]');
    
    if (existingScript) {
      console.log('Script exists, initializing widget in conversation view');
      setTimeout(initializeWidget, 500);
    } else {
      console.log('Loading ElevenLabs script in conversation view');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('ElevenLabs script loaded in conversation view');
        setTimeout(initializeWidget, 100);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load ElevenLabs script in conversation view:', error);
      };
      
      document.head.appendChild(script);
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
      {/* Case title display */}
      {currentCase && (
        <div className="bg-white/80 backdrop-blur-sm dark:bg-background/80 border-b p-4">
          <h2 className="text-lg font-medium">{currentCase.title}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(currentCase.date).toLocaleString()}
          </p>
        </div>
      )}
      
      <div className="flex-1 flex flex-col">
        {/* ElevenLabs ConvAI Widget - Centered */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div ref={widgetRef} className="w-full max-w-md">
            <div className="text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading voice assistant...</p>
              <p className="text-sm mt-2">The conversation will start automatically</p>
            </div>
          </div>
        </div>

        {/* Messages area - smaller and at bottom */}
        {messages.length > 0 && (
          <div className="border-t bg-muted/30">
            <ScrollArea className="h-48 p-4">
              <div className="space-y-2">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="border-t p-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={endCurrentCase}
        >
          End Conversation
        </Button>
      </div>
    </div>
  );
}
