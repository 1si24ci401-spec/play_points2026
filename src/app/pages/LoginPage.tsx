import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, InputField } from '@figma/astraui';
import { toast } from 'sonner';
import { LoginSuccessAnimation } from '../components/LoginSuccessAnimation';
import { useAuth } from '../context/AuthContext';
import { createClient } from '../../utils/supabase/client';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);

      // Show success animation
      setShowSuccess(true);

      // Redirect after animation
      setTimeout(() => {
        if (email === 'hydrabus45@gmail.com') {
          navigate('/admin', { replace: true });
          toast('Welcome back, Admin!');
        } else {
          navigate('/products', { replace: true });
          toast('Welcome back!');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Login error:', error);

      // Show helpful error message
      if (error.message?.includes('Invalid login credentials')) {
        toast('Invalid email or password. If this is your first time, please sign up instead.');
      } else {
        toast(error.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast('Google sign in failed. Please ensure Google OAuth is enabled in Supabase.');
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast('Google sign in failed. Please try again.');
    }
  };

  return (
    <div className="size-full flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <LoginSuccessAnimation show={showSuccess} />
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border p-8 flex flex-col gap-6" style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)'
      }}>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-medium" style={{ color: 'var(--color-foreground)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-muted-foreground)' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            disabled={loading}
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            disabled={loading}
          />

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>OR</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>

        <Button
          variant="neutral"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full"
        >
          Continue with Google
        </Button>

        <div className="text-center" style={{ color: 'var(--color-muted-foreground)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="hover:underline" style={{ color: 'var(--color-primary)' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
