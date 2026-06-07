import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { createClient } from '../../utils/supabase/client';
import { api } from '../../utils/api';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing sign in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Exchange the code/token from URL for a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('Sign in failed. Redirecting...');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        if (!session) {
          // No session yet — wait for onAuthStateChange to fire
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            subscription.unsubscribe();
            if (newSession) {
              await setupUserAndRedirect(newSession);
            } else {
              navigate('/login', { replace: true });
            }
          });
          return;
        }

        await setupUserAndRedirect(session);
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    const setupUserAndRedirect = async (session: any) => {
      try {
        setStatus('Setting up your account...');

        let profile;
        try {
          profile = await api.getProfile(session.access_token);
        } catch {
          // Profile doesn't exist — create it (first-time OAuth user).
          // Role is assigned server-side in /signup; no client-side email check.
          await api.signup(
            session.user.email!,
            '', // OAuth users have no password
            session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
            session.user.email!.split('@')[0]
          );
          profile = await api.getProfile(session.access_token);
        }

        if (profile.user?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/products', { replace: true });
        }
      } catch (err) {
        console.error('Profile setup error:', err);
        // Still redirect even if profile setup fails
        navigate('/products', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      className="size-full flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: 'var(--color-muted-foreground)', fontSize: 16 }}>{status}</p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
