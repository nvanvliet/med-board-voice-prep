
import { Button } from '@/components/ui/button';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import ApiKeyPrompt from '@/components/voice/ApiKeyPrompt';

export default function ConversationEmpty() {
  const { startNewCase } = useCase();
  const { isConfigured } = useVoice();

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
        <ApiKeyPrompt />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Ready to Practice?</h2>
          <p className="text-muted-foreground">
            Start a new oral board examination case to practice your clinical skills and decision-making.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full bg-medical-red hover:bg-medical-red-dark text-white"
            onClick={startNewCase}
          >
            Start New Case
          </Button>
          
          <p className="text-sm text-muted-foreground">
            The AI examiner will present you with a clinical scenario and guide you through the examination process.
          </p>
        </div>
      </div>
    </div>
  );
}
