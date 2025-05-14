import React from 'react';
import './App.css';
import ConversationView from '@/components/conversation/ConversationView';
import { CaseProvider } from '@/contexts/CaseContext';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { Toaster } from 'sonner';

function App() {
  return (
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
  );
}

export default App;
