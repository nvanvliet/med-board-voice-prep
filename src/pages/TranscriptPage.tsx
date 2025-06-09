
import TranscriptViewer from '@/components/TranscriptViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TranscriptPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Button>
      </div>
      
      <TranscriptViewer caseId="5" />
    </div>
  );
}
