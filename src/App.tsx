
import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { CaseProvider } from '@/contexts/CaseContext';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';

function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <VoiceProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </VoiceProvider>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;
