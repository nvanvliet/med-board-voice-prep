
import Navbar from '@/components/layout/Navbar';
import ConversationEmpty from '@/components/conversation/ConversationEmpty';
import ConversationView from '@/components/conversation/ConversationView';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();
  const { currentCase } = useCase();
  const { isConfigured, setApiKey } = useVoice();
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  
  // If no user is logged in, show a prompt
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col medical-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Medical Board Exam Practice</h2>
            <p className="mb-6 text-muted-foreground">Please sign in to start practicing for your medical board exams.</p>
            <Button asChild className="w-full">
              <Link to="/auth">Sign In to Continue</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If user is logged in but API is not configured
  const showApiKeyInput = user && !isConfigured && !currentCase;
  
  const handleApiKeySave = () => {
    if (apiKey) {
      setApiKey(apiKey);
      setApiKeyState('');
      setShowApiDialog(false);
    }
  };
  
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
      
      {/* API Key Dialog */}
      <Dialog open={showApiKeyInput || showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ElevenLabs API Setup Required</DialogTitle>
            <DialogDescription>
              To use the voice features, you need to provide an ElevenLabs API key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ElevenLabs API Key</label>
              <Input 
                type="password" 
                placeholder="Enter your API key" 
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API key at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">elevenlabs.io</a>
              </p>
            </div>
            <Button onClick={handleApiKeySave} className="w-full">
              Save API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
