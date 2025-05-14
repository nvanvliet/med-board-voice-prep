
import { useCase } from '@/contexts/CaseContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function CaseList() {
  const { cases, exportCase } = useCase();
  
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
              <CardTitle>{caseItem.title}</CardTitle>
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
