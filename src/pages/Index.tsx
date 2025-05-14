
import { useState, useEffect } from 'react';
import HomePage from './HomePage';
import CaseTranscript from '@/components/cases/CaseTranscript';
import { useCase } from '@/contexts/CaseContext';

const Index = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { cases, exportCase, toggleFavorite } = useCase();

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

  if (selectedCase) {
    return (
      <div className="container mx-auto px-4 py-6">
        <CaseTranscript 
          caseItem={selectedCase} 
          onBack={() => setSelectedCaseId(null)} 
          onExport={() => exportCase(selectedCase.id)}
          onToggleFavorite={() => toggleFavorite(selectedCase.id)}
        />
      </div>
    );
  }
  
  return <HomePage />;
};

export default Index;
