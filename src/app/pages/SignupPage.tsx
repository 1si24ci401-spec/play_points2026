import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, InputField } from '@figma/astraui';
import { toast } from 'sonner';
import { PlayPointsMatrixRain } from '../components/PlayPointsMatrixRain';
import { MinionRobot } from '../components/MinionRobot';
import { useAuth } from '../context/AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profile = await signUp(email, password, fullName, username);
      if (profile?.role === 'admin') {
        navigate('/admin', { replace: true });
        toast('Admin account created successfully!');
      } else {
        navigate('/products', { replace: true });
        toast('Account created successfully!');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast(error.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 pt-32 pb-12 relative overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      <PlayPointsMatrixRain />
      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border p-8 flex flex-col gap-6 z-10" style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)'
      }}>
        {/* Minion Robot peeking from top edge of card */}
        <div className="absolute -top-[125px] left-1/2 -translate-x-1/2">
          <MinionRobot />
        </div>

        <div className="flex flex-col gap-2 text-center pt-2">
          <h1 className="text-3xl font-medium" style={{ color: 'var(--color-foreground)' }}>Create Account</h1>
          <p style={{ color: 'var(--color-muted-foreground)' }}>Join us to start shopping</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          <InputField
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="John Doe"
            disabled={loading}
          />

          <InputField
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="johndoe"
            disabled={loading}
          />

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
            placeholder="Choose a strong password"
            disabled={loading}
          />

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' || '#6366F1' }}>
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
