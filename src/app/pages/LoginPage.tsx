import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, InputField } from '@figma/astraui';
import { toast } from 'sonner';
import { LoginSuccessAnimation } from '../components/LoginSuccessAnimation';
import { PlayPointsMatrixRain } from '../components/PlayPointsMatrixRain';
import { MinionRobot } from '../components/MinionRobot';
import { useAuth } from '../context/AuthContext';

import { useEffect } from 'react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profile = await signIn(email, password);

      // Show success animation then redirect based on server-assigned role
      setShowSuccess(true);

      setTimeout(() => {
        // Mark loading as seen so subsequent navigations don't show it
        sessionStorage.setItem('hasSeenLoading', 'true');
        if (profile?.role === 'admin') {
          navigate('/admin', { replace: true });
          toast('Welcome back, Admin!');
        } else {
          navigate('/products', { replace: true });
          toast('Welcome back!');
        }
      }, 1200);
    } catch (error: any) {
      console.error('Login error:', error);

      // Show helpful error message
      if (error.message?.includes('Invalid login credentials')) {
        toast('Invalid email or password. If this is your first time, please sign up instead.');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        toast('⚠️ Network error — please check your connection and try again.');
      } else {
        toast(error.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 pt-32 pb-12 relative overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      <PlayPointsMatrixRain />
      <LoginSuccessAnimation show={showSuccess} />
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border p-8 flex flex-col gap-6 z-10 relative" style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)'
      }}>
        {/* Minion Robot peeking from top edge of card */}
        <div className="absolute -top-[125px] left-1/2 -translate-x-1/2">
          <MinionRobot />
        </div>

        <div className="flex flex-col gap-2 text-center pt-2">
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
