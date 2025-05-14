
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/contexts/VoiceContext';
import { Download, Home, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import CaseList from '../cases/CaseList';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { setApiKey, isConfigured } = useVoice();
  const [apiKey, setApiKeyState] = useState('');
  
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <Home size={24} />
          <h1 className="text-xl font-semibold">Medical Board Exam</h1>
        </Link>
        
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">My Cases</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>My Cases</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <CaseList />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Save Case</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Current Case</DialogTitle>
                  </DialogHeader>
                  <p>This feature will be implemented in the full version.</p>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download size={18} className="mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Options</DialogTitle>
                  </DialogHeader>
                  <p>This feature will be implemented in the full version.</p>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    {user.email}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Voice API Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ElevenLabs API Key</label>
                      <Input 
                        type="password" 
                        placeholder={isConfigured ? "••••••••••••••••" : "Enter your API key"} 
                        value={apiKey}
                        onChange={(e) => setApiKeyState(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => {
                      if (apiKey) setApiKey(apiKey);
                      setApiKeyState('');
                    }}>
                      Save API Key
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={signOut}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {!user && (
            <Button asChild>
              <Link to="/auth">
                <User size={18} className="mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
