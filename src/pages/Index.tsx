
import { useState } from 'react';
import HomePage from './HomePage';
import CaseTranscript from '@/components/cases/CaseTranscript';
import { useCase } from '@/contexts/CaseContext';

const Index = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { cases, exportCase, toggleFavorite } = useCase();

  const selectedCase = selectedCaseId ? cases.find(c => c.id === selectedCaseId) : null;
  
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
  
  // Custom event listener to handle case viewing
  document.addEventListener('viewCaseTranscript', ((e: CustomEvent) => {
    setSelectedCaseId(e.detail.caseId);
  }) as EventListener, { once: true });

  return <HomePage />;
};

export default Index;
