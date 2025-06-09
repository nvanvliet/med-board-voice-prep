
import { useState, useEffect } from 'react';
import HomePage from './HomePage';
import CaseTranscript from '@/components/cases/CaseTranscript';
import { useCase } from '@/contexts/CaseContext';

const Index = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // Check if we're in a CaseProvider context
  let cases, exportCase, toggleFavorite, updateCaseTitle;
  try {
    const caseContext = useCase();
    cases = caseContext.cases;
    exportCase = caseContext.exportCase;
    toggleFavorite = caseContext.toggleFavorite;
    updateCaseTitle = caseContext.updateCaseTitle;
  } catch (error) {
    console.error('useCase hook error:', error);
    // Fallback to prevent crash
    cases = [];
    exportCase = () => {};
    toggleFavorite = () => {};
    updateCaseTitle = async () => {};
  }

  const selectedCase = selectedCaseId ? cases.find(c => c.id === selectedCaseId) : null;
  
  // Listen for custom events to handle case viewing
  useEffect(() => {
    const handleViewCase = (e: CustomEvent<{caseId: string}>) => {
      setSelectedCaseId(e.detail.caseId);
    };
    
    document.addEventListener('viewCaseTranscript', handleViewCase as EventListener);
    
    return () => {
      document.removeEventListener('viewCaseTranscript', handleViewCase as EventListener);
    };
  }, []);

  // If viewing a case transcript, show that instead of HomePage
  if (selectedCase) {
    return (
      <div className="container mx-auto px-4 py-6">
        <CaseTranscript 
          caseItem={selectedCase} 
          onBack={() => setSelectedCaseId(null)} 
          onExport={() => exportCase(selectedCase.id)}
          onToggleFavorite={() => toggleFavorite(selectedCase.id)}
          onUpdateTitle={updateCaseTitle}
        />
      </div>
    );
  }
  
  // Otherwise show the HomePage which contains conversation view
  return <HomePage />;
};

export default Index;
