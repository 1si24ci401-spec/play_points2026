import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '../../utils/supabase/client';
import { api } from '../../utils/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setUser(null);
        setAccessToken(null);
        return;
      }

      setAccessToken(session.access_token);

      // Get user profile from backend
      const profile = await api.getProfile(session.access_token);
      setUser(profile.user);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAccessToken(session.access_token);
        refreshUser();
      } else {
        setUser(null);
        setAccessToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }

    if (!data.session) {
      throw new Error('No session returned from login');
    }

    setAccessToken(data.session.access_token);
    await refreshUser();
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      await api.signup(email, password, fullName, username);

      // Auto sign in after signup
      await signIn(email, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut, refreshUser }}>
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
