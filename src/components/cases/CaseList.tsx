
import { useCase } from '@/contexts/CaseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Heart } from 'lucide-react';

export default function CaseList() {
  const { cases, exportCase, toggleFavorite } = useCase();
  
  if (cases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No saved cases yet</p>
        <p className="text-sm mt-2">Complete an exam to see your cases here</p>
      </div>
    );
  }
  
  const handleCaseClick = (caseId: string) => {
    // Dispatch custom event to notify the application to show the transcript
    const event = new CustomEvent('viewCaseTranscript', {
      detail: { caseId }
    });
    document.dispatchEvent(event);
    
    // Close the sheet by triggering a click on the document body
    document.body.click();
  };
  
  return (
    <div className="space-y-3">
      {cases.map((caseItem) => {
        const date = new Date(caseItem.date).toLocaleDateString();
        const messageCount = caseItem.messages.length;
        
        return (
          <Card 
            key={caseItem.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleCaseClick(caseItem.id)}
          >
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{caseItem.title}</h3>
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
  );
}
