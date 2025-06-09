
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useCase } from '@/contexts/CaseContext';

export default function ConversationEmpty() {
  const { startNewCase } = useCase();
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleStartExam = async () => {
    // Start a new case first
    await startNewCase();
  };

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
      <div ref={widgetRef} className="w-full max-w-md flex justify-center">
        {/* Widget will be inserted here by useEffect */}
      </div>
    </div>
  );
}
