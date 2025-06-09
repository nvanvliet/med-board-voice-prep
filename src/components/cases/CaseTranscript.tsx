import { Button } from '@/components/ui/button';
import { Case } from '@/types';
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Heart, Edit, Check, X, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { caseService } from '@/services/caseService';
import { toast } from 'sonner';

interface CaseTranscriptProps {
  caseItem: Case;
  onBack: () => void;
  onExport: () => void;
  onToggleFavorite: () => void;
  onUpdateTitle?: (caseId: string, newTitle: string) => void;
}

export default function CaseTranscript({ 
  caseItem, 
  onBack, 
  onExport, 
  onToggleFavorite,
  onUpdateTitle 
}: CaseTranscriptProps) {
  const date = new Date(caseItem.date).toLocaleDateString();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(caseItem.title);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const transcriptData = await caseService.getCaseTranscript(caseItem.id);
        setTranscript(transcriptData || 'No transcript available for this case');
      } catch (error) {
        console.error('Error fetching transcript:', error);
        setTranscript('Error loading transcript');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [caseItem.id]);
  
  const handleSaveTitle = () => {
    if (editedTitle.trim() && onUpdateTitle) {
      onUpdateTitle(caseItem.id, editedTitle);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(caseItem.title);
    setIsEditing(false);
  };

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
      a.download = `${caseItem.title.replace(/\s+/g, '-').toLowerCase()}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Transcript downloaded');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="sr-only">Back</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleFavorite}
          >
            <Heart
              size={18}
              className={caseItem.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}
            />
            <span className="sr-only">
              {caseItem.favorite ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={onExport}
          >
            <Download size={16} />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      <div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-xl font-semibold h-10"
              autoFocus
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTitle();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            />
            <Button variant="ghost" size="icon" onClick={handleSaveTitle}>
              <Check size={18} />
              <span className="sr-only">Save title</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
              <X size={18} />
              <span className="sr-only">Cancel</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{caseItem.title}</h2>
            {onUpdateTitle && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setIsEditing(true)}
              >
                <Edit size={14} />
                <span className="sr-only">Edit title</span>
              </Button>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Full Transcript with Audio IDs</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={loading || !transcript}>
              <Copy size={16} className="mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTranscript} disabled={loading || !transcript}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading transcript...
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {transcript}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
