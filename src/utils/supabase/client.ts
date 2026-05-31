import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

let supabaseInstance: SupabaseClient | null = null;

export const createClient = () => {
  // Return existing instance if already created (singleton pattern)
  if (supabaseInstance) {
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
