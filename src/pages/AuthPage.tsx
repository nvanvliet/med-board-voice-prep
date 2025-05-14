
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  
  // Redirect if already logged in
  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 medical-bg">
      <AuthForm />
    </div>
  );
}
