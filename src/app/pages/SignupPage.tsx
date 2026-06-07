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
      await signUp(email, password, fullName, username);

      // signUp calls signIn internally; fetch the profile role for redirect
      const profile = await signIn(email, password);
      if (profile?.role === 'admin') {
        navigate('/admin', { replace: true });
        toast('Admin account created successfully!');
      } else {
        navigate('/products', { replace: true });
        toast('Account created successfully!');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast('Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="size-full bg-brand-tertiary flex items-center justify-center p-2xl overflow-auto relative">
      <PlayPointsMatrixRain />
      <div className="relative mt-24 w-full max-w-md bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-xl my-2xl z-10">
        {/* Minion Robot peeking from top edge of card */}
        <div className="absolute -top-[125px] left-1/2 -translate-x-1/2">
          <MinionRobot />
        </div>

        <div className="flex flex-col gap-xs text-center pt-2">
          <h1 className="text-text-primary">Create Account</h1>
          <p className="text-text-secondary">Join us to start shopping</p>
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

        <div className="text-center text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-primary hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
