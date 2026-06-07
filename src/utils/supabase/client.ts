import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = () => {
  return (
    projectId &&
    publicAnonKey &&
    projectId !== 'your_supabase_project_id' &&
    publicAnonKey !== 'your_supabase_anon_key' &&
    projectId.trim() !== '' &&
    publicAnonKey.trim() !== ''
  );
};

export const createClient = () => {
  // Return existing instance if already created (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!isSupabaseConfigured()) {
    console.warn(
      '[Supabase Client] Supabase Project ID or Anon Key is missing or placeholder. Returning a mock client to prevent crash.'
    );
    supabaseInstance = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => { throw new Error("Supabase is not configured."); },
        signUp: async () => { throw new Error("Supabase is not configured."); },
        signOut: async () => {},
      }
    } as unknown as SupabaseClient;
    return supabaseInstance;
  }

  // Create new instance
  supabaseInstance = createSupabaseClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return supabaseInstance;
};
