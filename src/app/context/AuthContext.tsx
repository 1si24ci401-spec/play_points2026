import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '../../utils/supabase/client';
import { api } from '../../utils/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  role?: string;
  points?: number;
  tier?: 'normal' | 'premium';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePointsLocally: (points: number) => void;
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

      // Try to load cached profile immediately to reduce perceived latency
      const cached = sessionStorage.getItem('pp_user_profile');
      if (cached) {
        try {
          const cachedUser = JSON.parse(cached);
          setUser(cachedUser);
          // Apply premium theme from cache immediately  
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('theme-premium-gold', 'theme-premium-platinum', 'theme-premium-emerald');
            if (cachedUser?.tier === 'premium') {
              const saved = sessionStorage.getItem('pp_premium_theme') || 'theme-premium-gold';
              document.documentElement.classList.add(saved);
            }
          }
        } catch (_) { /* ignore cache parse error */ }
      }

      // Get user profile from backend (always fetch fresh data)
      const profile = await api.getProfile(session.access_token);
      const fetchedUser = profile.user;
      setUser(fetchedUser);

      // Cache for fast subsequent loads
      sessionStorage.setItem('pp_user_profile', JSON.stringify(fetchedUser));

      // Apply premium theme
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('theme-premium-gold', 'theme-premium-platinum', 'theme-premium-emerald');
        if (fetchedUser?.tier === 'premium') {
          // Keep the same theme within session for consistency; randomize only on new session
          let premiumTheme = sessionStorage.getItem('pp_premium_theme');
          if (!premiumTheme) {
            const themes = ['theme-premium-gold', 'theme-premium-platinum', 'theme-premium-emerald'];
            premiumTheme = themes[Math.floor(Math.random() * themes.length)];
            sessionStorage.setItem('pp_premium_theme', premiumTheme);
          }
          document.documentElement.classList.add(premiumTheme);
        }
      }

      // Handle FCM push initialization (non-blocking)
      const provider = import.meta.env.VITE_PUSH_PROVIDER || 'webpush';
      if (provider === 'fcm') {
        import('../../utils/firebase').then(({ initFirebaseFCM }) => {
          initFirebaseFCM().catch((e: any) => console.error('[FCM] Init failed:', e));
        });
      }
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
        sessionStorage.removeItem('pp_user_profile');
        sessionStorage.removeItem('pp_premium_theme');
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

    // Read the user state that refreshUser just set (no second API call)
    const profile = await api.getProfile(data.session.access_token);
    return profile.user as User;
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      await api.signup(email, password, fullName, username);

      // Auto sign in after signup
      return await signIn(email, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const updatePointsLocally = (points: number) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, points };
      sessionStorage.setItem('pp_user_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Clean up FCM on sign-out (FCM tokens remain valid; just clear local state)
    console.log('[FCM] User signed out – FCM token will be refreshed on next login');

    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-premium-gold', 'theme-premium-platinum', 'theme-premium-emerald');
    }
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut, refreshUser, updatePointsLocally }}>
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
