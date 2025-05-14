
import { useCase } from '@/contexts/CaseContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Heart, Edit, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CaseList() {
  const { cases, exportCase, toggleFavorite, updateCaseTitle } = useCase();
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  
  if (cases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No saved cases yet</p>
        <p className="text-sm mt-2">Complete an exam to see your cases here</p>
      </div>
    );
  }
  
  // Sort cases by date in descending order (newest first)
  const sortedCases = [...cases].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const handleCaseClick = (caseId: string) => {
    if (editingCaseId) return;
    
    // Dispatch custom event to notify the application to show the transcript
    const event = new CustomEvent('viewCaseTranscript', {
      detail: { caseId }
    });
    document.dispatchEvent(event);
    
    // Close the sheet by triggering a click on the document body
    document.body.click();
  };

  const startEditing = (caseId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCaseId(caseId);
    setEditedTitle(currentTitle);
  };

  const handleSaveTitle = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim()) {
      updateCaseTitle(caseId, editedTitle);
      setEditingCaseId(null);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCaseId(null);
  };
  
  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-3 pr-4">
        {sortedCases.map((caseItem) => {
          const date = new Date(caseItem.date).toLocaleDateString();
          const messageCount = caseItem.messages.length;
          const isEditing = editingCaseId === caseItem.id;
          
          return (
            <Card 
              key={caseItem.id}
              className={`cursor-pointer hover:border-primary/50 transition-colors ${isEditing ? 'border-primary' : ''}`}
              onClick={() => handleCaseClick(caseItem.id)}
            >
              <div className="p-4 flex items-center justify-between">
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveTitle(caseItem.id, e as unknown as React.MouseEvent);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit(e as unknown as React.MouseEvent);
                          }
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleSaveTitle(caseItem.id, e)}>
                        <Check size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{caseItem.title}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={(e) => startEditing(caseItem.id, caseItem.title, e)}
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{date} • {messageCount} message{messageCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(caseItem.id);
                    }}
                  >
                    <Heart 
                      size={16} 
                      className={caseItem.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} 
                    />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportCase(caseItem.id);
                    }}
                  >
                    <Download size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
