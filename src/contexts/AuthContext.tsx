
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('medical-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user', error);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // In a real app, this would be an API call
      setIsLoading(true);
      
      // For demo purposes, we'll just simulate a successful login
      // In production, this would validate credentials with a backend
      const mockUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        email
      };
      
      // Save to local storage (would be a token in a real app)
      localStorage.setItem('medical-user', JSON.stringify(mockUser));
      setUser(mockUser);
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Sign in failed', error);
      toast.error('Failed to sign in. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // In a real app, this would be an API call
      setIsLoading(true);
      
      // For demo purposes, we'll just simulate a successful registration
      const mockUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        email
      };
      
      // Save to local storage (would be a token in a real app)
      localStorage.setItem('medical-user', JSON.stringify(mockUser));
      setUser(mockUser);
      toast.success('Account created successfully');
    } catch (error) {
      console.error('Sign up failed', error);
      toast.error('Failed to create account. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('medical-user');
    setUser(null);
    toast.info('Signed out');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
