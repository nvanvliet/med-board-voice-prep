import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Case, Message, User } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CaseContextType {
  cases: Case[];
  currentCase: Case | null;
  messages: Message[];
  startNewCase: () => void;
  endCurrentCase: () => void;
  saveCurrentCase: (title?: string) => void;
  addMessage: (text: string, sender: 'user' | 'ai') => void;
  exportCase: (caseId: string) => void;
  toggleFavorite: (caseId: string) => void;
  updateCaseTitle: (caseId: string, newTitle: string) => void;
  favoriteCases: Case[];
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load saved cases from localStorage
  useEffect(() => {
    if (user) {
      const savedCases = localStorage.getItem(`medical-cases-${user.id}`);
      if (savedCases) {
        try {
          setCases(JSON.parse(savedCases));
        } catch (error) {
          console.error('Failed to parse saved cases', error);
        }
      }
    } else {
      setCases([]);
    }
  }, [user]);

  // Save cases to localStorage when they change
  useEffect(() => {
    if (user && cases.length > 0) {
      localStorage.setItem(`medical-cases-${user.id}`, JSON.stringify(cases));
    }
  }, [cases, user]);

  // Get favorite cases (sorted by date)
  const favoriteCases = cases
    .filter(c => c.favorite)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const startNewCase = () => {
    if (!user) {
      toast.error('You must be signed in to start a case');
      return;
    }
    
    const newCase: Case = {
      id: `case-${Date.now()}`,
      userId: user.id,
      title: `Case ${cases.length + 1}`,
      date: new Date().toISOString(),
      messages: []
    };
    
    setCurrentCase(newCase);
    setMessages([]);
    // Removed toast notification: toast.success('New case started');
  };

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    if (!currentCase) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      sender,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setCurrentCase(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });
  };

  const saveCurrentCase = (title?: string) => {
    if (!currentCase || !user) return;
    
    const updatedCase: Case = {
      ...currentCase,
      title: title || currentCase.title,
      messages
    };
    
    setCases(prev => {
      const exists = prev.find(c => c.id === currentCase.id);
      if (exists) {
        return prev.map(c => c.id === currentCase.id ? updatedCase : c);
      } else {
        return [...prev, updatedCase];
      }
    });
    
    toast.success('Case saved successfully');
  };

  const endCurrentCase = () => {
    if (currentCase && messages.length > 0) {
      // Always save the case to "My Cases" when ending a conversation
      saveCurrentCase();
    }
    setCurrentCase(null);
    setMessages([]);
    toast.info('Case ended');
  };

  const exportCase = (caseId: string) => {
    const caseToExport = cases.find(c => c.id === caseId) || 
                          (currentCase?.id === caseId ? currentCase : null);
    
    if (!caseToExport) {
      toast.error('Case not found');
      return;
    }
    
    // Format case data for export
    const title = caseToExport.title;
    const date = new Date(caseToExport.date).toLocaleDateString();
    
    let content = `# ${title}\nDate: ${date}\n\n`;
    
    caseToExport.messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const sender = msg.sender === 'user' ? 'You' : 'AI Examiner';
      content += `[${time}] ${sender}: ${msg.text}\n\n`;
    });
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Case exported successfully');
  };

  const toggleFavorite = (caseId: string) => {
    setCases(prev => {
      return prev.map(c => {
        if (c.id === caseId) {
          return { ...c, favorite: !c.favorite };
        }
        return c;
      });
    });

    // Find the case to show appropriate toast message
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      const isFavorite = targetCase.favorite;
      if (isFavorite) {
        toast.info(`Removed "${targetCase.title}" from favorites`);
      } else {
        toast.success(`Added "${targetCase.title}" to favorites`);
      }
    }
  };

  const updateCaseTitle = (caseId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    setCases(prev => {
      const updatedCases = prev.map(c => {
        if (c.id === caseId) {
          return { ...c, title: newTitle.trim() };
        }
        return c;
      });
      
      // If this is the current case, update it too
      if (currentCase?.id === caseId) {
        setCurrentCase(prev => {
          if (prev) return { ...prev, title: newTitle.trim() };
          return prev;
        });
      }
      
      return updatedCases;
    });
    
    toast.success(`Case title updated successfully`);
  };

  return (
    <CaseContext.Provider value={{
      // Return sorted cases
      cases: [...cases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      currentCase,
      messages,
      startNewCase,
      endCurrentCase,
      saveCurrentCase,
      addMessage,
      exportCase,
      toggleFavorite,
      updateCaseTitle,
      favoriteCases
    }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
}
