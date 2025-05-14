
import { Button } from '@/components/ui/button';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';

export default function ConversationEmpty() {
  const { startNewCase } = useCase();
  const { isConfigured, connectToAgent } = useVoice();
  
  const handleStartExam = async () => {
    if (!isConfigured) {
      // We'll handle this in the parent component
      return;
    }
    
    // Start a new case first
    startNewCase();
    
    // Then connect to the ElevenLabs agent
    setTimeout(() => {
      connectToAgent();
    }, 500); // Small delay to ensure case is initialized
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-3">May the odds be ever in your favor!</h2>
        <p className="text-muted-foreground mb-6">Click the Start Exam button to begin</p>
        
        <Button 
          onClick={handleStartExam}
          size="lg" 
          className="bg-medical-purple hover:bg-medical-purple-dark px-8 py-6 text-lg"
        >
          Start Exam
        </Button>
      </div>
    </div>
  );
}
