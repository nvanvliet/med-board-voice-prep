
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCase } from '@/contexts/CaseContext';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import CaseList from '../cases/CaseList';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { favoriteCases, toggleFavorite, exportCase, startNewCase } = useCase();
  
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Medical Oral Board Study Bot</h1>
        </Link>
        
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <>
              <Button onClick={startNewCase} variant="default" className="flex items-center gap-1">
                Start Exam
              </Button>
            
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
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    My Favorites
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>My Favorites</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {favoriteCases.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No favorite cases yet</p>
                        <p className="text-sm mt-2">Click the heart icon to add cases to favorites</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {favoriteCases.map((caseItem) => {
                          const date = new Date(caseItem.date).toLocaleDateString();
                          
                          return (
                            <Card key={caseItem.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">{caseItem.title}</h3>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => toggleFavorite(caseItem.id)}
                                  >
                                    <span className="sr-only">Remove from favorites</span>
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">{date}</p>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

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
