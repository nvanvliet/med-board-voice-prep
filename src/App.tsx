
import React from 'react';
import './App.css';
import ConversationView from '@/components/conversation/ConversationView';
import { CaseProvider } from '@/contexts/CaseContext';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <VoiceProvider>
          <div className="App">
            <header className="App-header">
              <p>Medical AI Assistant</p>
            </header>
            <ConversationView />
          </div>
          <Toaster />
        </VoiceProvider>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;
