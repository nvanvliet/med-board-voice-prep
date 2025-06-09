
import Navbar from '@/components/layout/Navbar';
import ConversationEmpty from '@/components/conversation/ConversationEmpty';
import ConversationView from '@/components/conversation/ConversationView';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();
  const { currentCase } = useCase();
  const { isConfigured } = useVoice();
  
  // If no user is logged in, show a prompt
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col medical-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Medical Oral Board Study Bot</h2>
            <p className="mb-6 text-muted-foreground">Please sign in to start practicing for your medical board exams.</p>
            <Button asChild className="w-full">
              <Link to="/auth">Sign In to Continue</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col medical-bg">
      <Navbar />
      
      <div className="flex-1">
        {!currentCase ? (
          <ConversationEmpty />
        ) : (
          <ConversationView />
        )}
      </div>
    </div>
  );
}
