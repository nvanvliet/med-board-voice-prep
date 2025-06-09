import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Case, Message, User } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { caseService } from '@/services/caseService';

interface CaseContextType {
  cases: Case[];
  currentCase: Case | null;
  messages: Message[];
  isLoading: boolean;
  startNewCase: () => Promise<void>;
  endCurrentCase: () => void;
  saveCurrentCase: (title?: string) => Promise<void>;
  addMessage: (text: string, sender: 'user' | 'ai') => Promise<void>;
  exportCase: (caseId: string) => void;
  toggleFavorite: (caseId: string) => void;
  updateCaseTitle: (caseId: string, newTitle: string) => Promise<void>;
  favoriteCases: Case[];
  refreshCases: () => Promise<void>;
  updateTranscript: (text: string, sender: 'user' | 'ai', audioId?: string) => Promise<void>;
  updateConversationId: (conversationId: string) => Promise<void>;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullTranscript, setFullTranscript] = useState<string>('');

  // Load cases from Supabase when user changes
  useEffect(() => {
    if (user) {
      refreshCases();
    } else {
      setCases([]);
      setCurrentCase(null);
      setMessages([]);
      setFullTranscript('');
    }
  }, [user]);

  const refreshCases = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const dbCases = await caseService.getCases(user.id);
      const convertedCases = dbCases.map(dbCase => caseService.convertDatabaseCaseToCase(dbCase));
      setCases(convertedCases);
    } catch (error) {
      console.error('Failed to load cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  // Get favorite cases (sorted by date)
  const favoriteCases = cases
    .filter(c => c.favorite)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const startNewCase = async () => {
    if (!user) {
      toast.error('You must be signed in to start a case');
      return;
    }
    
    setIsLoading(true);
    try {
      const dbCase = await caseService.createCase(`Case ${cases.length + 1}`, user.id);
      const newCase = caseService.convertDatabaseCaseToCase(dbCase);
      
      setCurrentCase(newCase);
      setMessages([]);
      setFullTranscript('');
      console.log('Started new case:', newCase.id);
      await refreshCases();
    } catch (error) {
      console.error('Error starting new case:', error);
      toast.error('Failed to start new case');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (text: string, sender: 'user' | 'ai') => {
    if (!currentCase) return;
    
    try {
      const dbMessage = await caseService.addMessage(currentCase.id, text, sender);
      
      const newMessage: Message = {
        id: dbMessage.id,
        text: dbMessage.message_text,
        sender: dbMessage.sender as 'user' | 'ai' | 'system',
        timestamp: dbMessage.timestamp
      };
      
      setMessages(prev => [...prev, newMessage]);
      setCurrentCase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage]
        };
      });
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to save message');
    }
  };

  const updateTranscript = async (text: string, sender: 'user' | 'ai', audioId?: string) => {
    if (!currentCase) {
      console.warn('No current case to update transcript for');
      return;
    }

    try {
      const timestamp = new Date().toLocaleTimeString();
      const senderLabel = sender === 'user' ? 'User' : 'AI Assistant';
      const audioIdSuffix = audioId ? ` [Audio ID: ${audioId}]` : '';
      const transcriptEntry = `[${timestamp}] ${senderLabel}: ${text}${audioIdSuffix}\n`;
      
      const newTranscript = fullTranscript + transcriptEntry;
      setFullTranscript(newTranscript);
      
      console.log('Updating transcript for case:', currentCase.id);
      console.log('New transcript entry:', transcriptEntry);
      
      // Save the updated transcript to Supabase
      await caseService.updateCaseTranscript(currentCase.id, newTranscript);
      
      console.log('Transcript updated successfully');
    } catch (error) {
      console.error('Error updating transcript:', error);
      toast.error('Failed to update transcript');
    }
  };

  const updateConversationId = async (conversationId: string) => {
    if (!currentCase) {
      console.warn('No current case to update conversation ID for');
      return;
    }

    try {
      console.log('Updating conversation ID for case:', currentCase.id, 'with ID:', conversationId);
      
      // Save the conversation ID to Supabase
      await caseService.updateCaseConversationId(currentCase.id, conversationId);
      
      // Update the current case in state
      setCurrentCase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          conversationId
        };
      });
      
      console.log('Conversation ID updated successfully');
    } catch (error) {
      console.error('Error updating conversation ID:', error);
      toast.error('Failed to update conversation ID');
    }
  };

  const saveCurrentCase = async (title?: string) => {
    if (!currentCase || !user) return;
    
    try {
      if (title && title !== currentCase.title) {
        // Note: We'll need to add an updateCase method to caseService later
        setCurrentCase(prev => prev ? { ...prev, title } : null);
        await refreshCases();
        toast.success('Case saved successfully');
      }
    } catch (error) {
      console.error('Error saving case:', error);
      toast.error('Failed to save case');
    }
  };

  const endCurrentCase = () => {
    if (currentCase) {
      setCurrentCase(null);
      setMessages([]);
      setFullTranscript('');
      toast.info('Case ended and saved to My Cases');
      refreshCases();
    }
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

  const updateCaseTitle = async (caseId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      // Note: We'll need to add an updateCase method to caseService later
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
    } catch (error) {
      console.error('Error updating case title:', error);
      toast.error('Failed to update case title');
    }
  };

  return (
    <CaseContext.Provider value={{
      cases: [...cases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      currentCase,
      messages,
      isLoading,
      startNewCase,
      endCurrentCase,
      saveCurrentCase,
      addMessage,
      exportCase,
      toggleFavorite,
      updateCaseTitle,
      favoriteCases,
      refreshCases,
      updateTranscript,
      updateConversationId
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
