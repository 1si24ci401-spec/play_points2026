import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, InputField } from '@figma/astraui';
import { toast } from 'sonner';
import { LoginSuccessAnimation } from '../components/LoginSuccessAnimation';
import { PlayPointsMatrixRain } from '../components/PlayPointsMatrixRain';
import { MinionRobot } from '../components/MinionRobot';
import { useAuth } from '../context/AuthContext';

import { useEffect } from 'react';

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, InputField } from '@figma/astraui';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LoginSuccessAnimation } from '../components/LoginSuccessAnimation';
import { PlayPointsMatrixRain } from '../components/PlayPointsMatrixRain';
import { MinionRobot } from '../components/MinionRobot';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';
import { createClient } from '../../utils/supabase/client';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Forgot password flow state
  const [view, setView] = useState<'login' | 'forgot_password' | 'enter_code'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    }
  }, [user, navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const profile = await signIn(email, password);

      // Instant responsive transition
      setShowSuccess(true);
      localStorage.setItem('hasSeenLoading', 'true');
      sessionStorage.setItem('hasSeenLoading', 'true');

      setTimeout(() => {
        if (profile?.role === 'admin') {
          navigate('/admin', { replace: true });
          toast.success('Welcome back, Admin!');
        } else {
          navigate('/products', { replace: true });
          toast.success('Welcome back!');
        }
      }, 200);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. If you forgot your password, click "Forgot password?" below.');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast.error('⚠️ Network error — please check your connection and try again.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  // Step 1: Send confirmation code & email
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingCode(true);
    try {
      // 1. Dispatch through backend forgot-password API
      const res = await api.forgotPassword(resetEmail);

      // 2. Also dispatch native Supabase email recovery
      try {
        const supabase = createClient();
        await supabase.auth.resetPasswordForEmail(resetEmail.toLowerCase().trim(), {
          redirectTo: `${window.location.origin}/login?type=recovery`,
        });
      } catch (nativeErr) {
        console.warn('Native reset dispatch info:', nativeErr);
      }

      toast.success(res?.message || `Confirmation code sent to ${resetEmail}! Check your inbox.`);
      setView('enter_code');
      setCountdown(30);
    } catch (err: any) {
      console.error('Failed to send reset code:', err);
      toast.error(err.message || 'Failed to send confirmation code. Please check the email address.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Step 2: Verify code and update password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.trim().length < 4) {
      toast.error('Please enter the verification code sent to your email');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsResetting(true);
    try {
      await api.resetPassword(resetEmail, resetCode.trim(), newPassword);

      toast.success('Password updated successfully! Signing you in...');

      // Auto sign in with the new password
      try {
        const profile = await signIn(resetEmail, newPassword);
        setShowSuccess(true);
        setTimeout(() => {
          if (profile?.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/products', { replace: true });
          }
        }, 300);
      } catch {
        // If auto sign-in requires manual step, redirect back to login
        setEmail(resetEmail);
        setPassword(newPassword);
        setView('login');
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      toast.error(err.message || 'Invalid or expired confirmation code. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 pt-32 pb-12 relative overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      <PlayPointsMatrixRain />
      <LoginSuccessAnimation show={showSuccess} />

      <div className="w-full max-w-md rounded-[var(--radius-lg)] border p-8 flex flex-col gap-6 z-10 relative bg-zinc-900/90 backdrop-blur-xl border-zinc-800 shadow-2xl">
        {/* Minion Robot peeking from top edge of card */}
        <div className="absolute -top-[125px] left-1/2 -translate-x-1/2">
          <MinionRobot />
        </div>

        {/* View 1: Standard Sign In */}
        {view === 'login' && (
          <>
            <div className="flex flex-col gap-2 text-center pt-2">
              <h1 className="text-3xl font-medium text-white">Welcome Back</h1>
              <p className="text-zinc-400 text-sm">Sign in to your account</p>
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

              <div className="flex flex-col gap-1.5">
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setView('forgot_password');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="w-full mt-1"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center text-xs text-zinc-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </>
        )}

        {/* View 2: Forgot Password - Request Email */}
        {view === 'forgot_password' && (
          <>
            <div className="flex flex-col gap-2 text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-1">
                <KeyRound size={24} />
              </div>
              <h1 className="text-2xl font-medium text-white">Reset Password</h1>
              <p className="text-zinc-400 text-xs leading-relaxed px-2">
                Enter your registered email address and we'll send you a confirmation code to set a new password.
              </p>
            </div>

            <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
              <InputField
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={setResetEmail}
                placeholder="you@example.com"
                disabled={isSendingCode}
              />

              <Button
                variant="primary"
                type="submit"
                disabled={isSendingCode}
                className="w-full"
              >
                {isSendingCode ? 'Sending Code...' : 'Send Confirmation Code'}
              </Button>
            </form>

            <div className="flex items-center justify-center pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setView('login')}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </>
        )}

        {/* View 3: Enter Code & Set New Password */}
        {view === 'enter_code' && (
          <>
            <div className="flex flex-col gap-2 text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-2xl font-medium text-white">Confirm & Reset</h1>
              <p className="text-zinc-400 text-xs leading-relaxed">
                We sent a 6-digit confirmation code to{' '}
                <span className="text-white font-medium">{resetEmail}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-300">Confirmation Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  disabled={isResetting}
                  className="w-full text-center tracking-[0.5em] text-lg font-mono py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <InputField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter at least 6 characters"
                disabled={isResetting}
              />

              <InputField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your new password"
                disabled={isResetting}
              />

              <Button
                variant="primary"
                type="submit"
                disabled={isResetting}
                className="w-full mt-1"
              >
                {isResetting ? 'Updating Password...' : 'Reset Password & Sign In'}
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setView('login')}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back to Login</span>
              </button>

              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={countdown > 0 || isSendingCode}
                className={`inline-flex items-center gap-1 transition-colors ${
                  countdown > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300 cursor-pointer'
                }`}
              >
                <RefreshCw size={12} className={isSendingCode ? 'animate-spin' : ''} />
                <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
