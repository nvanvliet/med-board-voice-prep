
import { useCase } from '@/contexts/CaseContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  return (
    <div className="space-y-4">
      {cases.map((caseItem) => {
        const date = new Date(caseItem.date).toLocaleDateString();
        const messageCount = caseItem.messages.length;
        
        return (
          <Card key={caseItem.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{caseItem.title}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => toggleFavorite(caseItem.id)}
                >
                  <Heart 
                    size={18} 
                    className={caseItem.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} 
                  />
                  <span className="sr-only">
                    {caseItem.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  </span>
                </Button>
              </div>
              <CardDescription>{date}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {messageCount} message{messageCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto flex items-center gap-1"
                onClick={() => exportCase(caseItem.id)}
              >
                <Download size={16} />
                <span>Export</span>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
