
import { useEffect, useState } from 'react';
import { caseService } from '@/services/caseService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptViewerProps {
  caseId: string;
}

export default function TranscriptViewer({ caseId }: TranscriptViewerProps) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const caseData = await caseService.getCase(caseId);
        if (caseData) {
          setTranscript(caseData.transcript || 'No transcript available');
          setCaseTitle(caseData.title);
        } else {
          setTranscript('Case not found');
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
        setTranscript('Error loading transcript');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [caseId]);

  const copyToClipboard = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      toast.success('Transcript copied to clipboard');
    }
  };

  const downloadTranscript = () => {
    if (transcript) {
      const blob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseTitle.replace(/\s+/g, '-').toLowerCase()}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Transcript downloaded');
    }
  };

  if (loading) {
    return <div className="p-4">Loading transcript...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Transcript for {caseTitle}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy size={16} className="mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTranscript}>
            <Download size={16} className="mr-2" />
            Download
          </Button>
        </div>
      </div>
      <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {transcript}
        </pre>
      </div>
    </Card>
  );
}
