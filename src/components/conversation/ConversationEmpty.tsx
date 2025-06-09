
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useCase } from '@/contexts/CaseContext';

export default function ConversationEmpty() {
  const { startNewCase } = useCase();
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleStartExam = async () => {
    console.log('Start Exam button clicked');
    // Start a new case first
    await startNewCase();
  };

  // Initialize ElevenLabs widget when component mounts
  useEffect(() => {
    console.log('ConversationEmpty useEffect triggered');
    
    const initializeWidget = () => {
      if (widgetRef.current && !widgetRef.current.querySelector('elevenlabs-convai')) {
        console.log('Creating ElevenLabs widget');
        
        // Clear any existing content
        widgetRef.current.innerHTML = '';
        
        // Create the widget element
        const widget = document.createElement('elevenlabs-convai');
        widget.setAttribute('agent-id', 'pbVKPG3uJWVU0KsvdQlO');
        
        // Add event listeners for transcript capture
        widget.addEventListener('message', (event: any) => {
          console.log('ElevenLabs widget message:', event.detail);
        });

        widget.addEventListener('conversationStarted', (event: any) => {
          console.log('Conversation started:', event);
        });

        widget.addEventListener('transcript', (event: any) => {
          console.log('Transcript received:', event.detail);
        });

        widgetRef.current.appendChild(widget);
        console.log('ElevenLabs widget added to DOM');
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="convai-widget-embed"]');
    
    if (existingScript) {
      console.log('Script already exists, initializing widget');
      // Wait a bit for the script to fully load
      setTimeout(initializeWidget, 500);
    } else {
      console.log('Loading ElevenLabs script');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('ElevenLabs script loaded successfully');
        setTimeout(initializeWidget, 100);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load ElevenLabs script:', error);
      };
      
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        May the odds be ever in your favor!
      </h1>
      
      <Button 
        size="lg" 
        className="text-lg px-8 py-4 h-auto mb-8"
        onClick={handleStartExam}
      >
        Start Exam
      </Button>

      {/* ElevenLabs ConvAI Widget */}
      <div ref={widgetRef} className="w-full max-w-md flex justify-center min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-4">
        <div className="text-center text-gray-500">
          Loading voice widget...
        </div>
      </div>
    </div>
  );
}
