
import { Button } from '@/components/ui/button';
import { Case } from '@/types';
import { ArrowLeft, Download, Heart } from 'lucide-react';

interface CaseTranscriptProps {
  caseItem: Case;
  onBack: () => void;
  onExport: () => void;
  onToggleFavorite: () => void;
}

export default function CaseTranscript({ caseItem, onBack, onExport, onToggleFavorite }: CaseTranscriptProps) {
  const date = new Date(caseItem.date).toLocaleDateString();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="sr-only">Back to cases</span>
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
        <h2 className="text-xl font-semibold">{caseItem.title}</h2>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto border rounded-md p-4">
        {caseItem.messages.map((message) => {
          const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          const isUser = message.sender === 'user';
          
          return (
            <div 
              key={message.id} 
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  isUser 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <div>{message.text}</div>
                <div className="text-xs opacity-70 mt-1">{time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
