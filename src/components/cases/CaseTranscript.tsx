
import { Button } from '@/components/ui/button';
import { Case } from '@/types';
import { useState } from 'react';
import { ArrowLeft, Download, Heart, Edit, Save, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
