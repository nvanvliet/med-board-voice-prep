
import { Button } from '@/components/ui/button';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';

export default function ConversationEmpty() {
  const { startNewCase } = useCase();
  const { connectToAgent } = useVoice();

  const handleStartExam = async () => {
    console.log('Start Exam button clicked');
    // Start a new case first
    await startNewCase();
    // Then connect to the ElevenLabs agent
    await connectToAgent();
  };

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

      <div className="text-center text-muted-foreground">
        <p>Click "Start Exam" to begin your oral board examination</p>
      </div>
    </div>
  );
}
