import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeClosed } from 'lucide-react';

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email is required');
      return;
    }

    if (showForgotPassword) {
      try {
        await resetPassword(email);
        setShowForgotPassword(false);
        setEmail('');
      } catch (error) {
        console.error('Password reset error:', error);
      }
      return;
    }

    if (!password) {
      toast.error('Password is required');
      return;
    }

    try {
      if (activeTab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setPassword('');
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setEmail('');
    setPassword('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border p-6 shadow-sm bg-white">
      {showForgotPassword ? (
        <>
          <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
          <p className="text-muted-foreground mb-6">Enter your email to receive a password reset link</p>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-medical-purple hover:bg-medical-purple-dark"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-2">Authentication</h2>
          <p className="text-muted-foreground mb-6">Enter your email below to sign in or create an account</p>
          
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeClosed className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {activeTab === 'login' && (
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={handleForgotPassword}
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-medical-purple hover:bg-medical-purple-dark"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : (activeTab === 'login' ? 'Sign In' : 'Sign Up')}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
          </Tabs>
        </>
      )}
    </div>
  );
}
