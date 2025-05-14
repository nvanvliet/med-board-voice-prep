
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Home, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import CaseList from '../cases/CaseList';

export default function Navbar() {
  const { user, signOut } = useAuth();
  
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <Home size={24} />
          <h1 className="text-xl font-semibold">Medical Board Exam</h1>
        </Link>
        
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">My Cases</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>My Cases</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <CaseList />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Save Case</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Current Case</DialogTitle>
                  </DialogHeader>
                  <p>This feature will be implemented in the full version.</p>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download size={18} className="mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Options</DialogTitle>
                  </DialogHeader>
                  <p>This feature will be implemented in the full version.</p>
                </DialogContent>
              </Dialog>

              <Button onClick={signOut} size="sm" variant="ghost">
                <LogOut size={18} className="mr-2" />
                Sign Out
              </Button>
            </>
          )}
          
          {!user && (
            <Button asChild>
              <Link to="/auth">
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
