
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import CaseList from '../cases/CaseList';

export default function CasesSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          My Cases
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>My Cases</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <CaseList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
