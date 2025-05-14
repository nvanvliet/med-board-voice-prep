
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCase } from '@/contexts/CaseContext';
import { LogOut } from 'lucide-react';
import { Edit, Check, X, Heart, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import CaseList from '../cases/CaseList';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { favoriteCases, toggleFavorite, exportCase, startNewCase, updateCaseTitle } = useCase();
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  
  const handleCaseClick = (caseId: string) => {
    if (editingFavoriteId) return;
    
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
    setEditingFavoriteId(caseId);
    setEditedTitle(currentTitle);
  };

  const handleSaveTitle = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim()) {
      updateCaseTitle(caseId, editedTitle);
      setEditingFavoriteId(null);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFavoriteId(null);
  };
  
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
                          const isEditing = editingFavoriteId === caseItem.id;
                          
                          return (
                            <Card 
                              key={caseItem.id} 
                              className={`cursor-pointer hover:border-primary/50 transition-colors ${isEditing ? 'border-primary' : ''}`}
                              onClick={() => handleCaseClick(caseItem.id)}
                            >
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <Input
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        className="h-8 text-sm"
                                        autoFocus
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
                                      className="fill-red-500 text-red-500"
                                    />
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
