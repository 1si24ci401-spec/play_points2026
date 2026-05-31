import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, InputField } from '@figma/astraui';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { createClient } from '../../utils/supabase/client';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
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

      // Immediately redirect for better perceived performance
      if (email === 'hydrabus45@gmail.com') {
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
    <div className="size-full bg-brand-tertiary flex items-center justify-center p-2xl overflow-auto">
      <div className="w-full max-w-md bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-xl my-2xl">
        <div className="flex flex-col gap-xs text-center">
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

        <div className="flex items-center gap-md">
          <div className="flex-1 h-px bg-border-primary" />
          <span className="text-text-secondary text-sm">OR</span>
          <div className="flex-1 h-px bg-border-primary" />
        </div>

        <Button
          variant="neutral"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full"
        >
          Continue with Google
        </Button>

        <div className="text-center text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-primary hover:underline">
            Sign in
          </Link>
        </div>

        {/* Admin hint */}
        <div className="bg-brand-secondary rounded-corner-md p-lg">
          <p className="text-sm text-text-primary">
            <span className="font-medium">Create Admin Account:</span> Use email{' '}
            <code className="bg-bg-faint px-sm py-xs rounded text-brand-primary">
              hydrabus45@gmail.com
            </code>{' '}
            to automatically get admin access.
          </p>
        </div>
      </div>
    </div>
  );
}
