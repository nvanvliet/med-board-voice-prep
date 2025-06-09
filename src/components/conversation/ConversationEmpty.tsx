
import { Button } from '@/components/ui/button';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import ApiKeyPrompt from '@/components/voice/ApiKeyPrompt';

export default function ConversationEmpty() {
  const { startNewCase } = useCase();
  const { isConfigured, connectToAgent } = useVoice();

  const handleStartExam = async () => {
    // Start a new case first
    startNewCase();
    
    // Then connect to the ElevenLabs agent
    await connectToAgent();
  };

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
        <ApiKeyPrompt />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
      <Button 
        size="lg" 
        className="text-lg px-8 py-4 h-auto"
        onClick={handleStartExam}
      >
        Start Exam
      </Button>
    </div>
  );
}
