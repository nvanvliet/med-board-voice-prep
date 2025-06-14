import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCase } from '@/contexts/CaseContext';
import { LogOut } from 'lucide-react';
import { Edit, Check, X, Heart, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import CasesSheet from './CasesSheet';
import FavoritesSheet from './FavoritesSheet';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { startNewCase } = useCase();

  return (
    <header className="border-b bg-white mb-10">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Medical Oral Board Study Bot</h1>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <Button onClick={startNewCase} variant="default" className="flex items-center gap-1">
                Start Exam
              </Button>
              <CasesSheet />
              <FavoritesSheet />
              <Button onClick={signOut} size="sm" variant="ghost">
                <LogOut size={18} className="mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
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
