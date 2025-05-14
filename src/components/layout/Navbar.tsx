
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCase } from '@/contexts/CaseContext';
import { Download, Heart, Home, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import CaseList from '../cases/CaseList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { favoriteCases, toggleFavorite, exportCase } = useCase();
  
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <Home size={24} />
          <h1 className="text-xl font-semibold">Medical Oral Board Study Bot</h1>
        </Link>
        
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    My Cases
                    {favoriteCases.length > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {favoriteCases.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>My Cases</SheetTitle>
                  </SheetHeader>
                  <Tabs defaultValue="all" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="all">All Cases</TabsTrigger>
                      <TabsTrigger value="favorites" className="flex items-center gap-1">
                        <Heart size={14} className="fill-current" />
                        <span>Favorites</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="py-4">
                      <CaseList />
                    </TabsContent>
                    <TabsContent value="favorites" className="py-4">
                      {favoriteCases.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No favorite cases yet</p>
                          <p className="text-sm mt-2">Click the heart icon to add cases to favorites</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {favoriteCases.map((caseItem) => {
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
                                      <Heart size={18} className="fill-red-500 text-red-500" />
                                      <span className="sr-only">Remove from favorites</span>
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
                      )}
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>
              
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
