/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are present
 * and properly configured at build time. It prevents missing secrets from
 * causing runtime errors.
 */

// List of required environment variables
const REQUIRED_ENV_VARS = [
  'VITE_VAPID_PUBLIC_KEY',
  'VITE_SUPABASE_PROJECT_ID',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_PUSH_PROVIDER',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

// Type for environment variables
export interface EnvironmentConfig {
  vapidPublicKey: string;
  supabaseProjectId: string;
  supabaseAnonKey: string;
  pushProvider: 'fcm' | 'webpush' | 'onesignal';
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    vapidKey?: string;
  };
}

/**
 * Validates that all required environment variables are defined
 * @throws Error if any required environment variable is missing
 */
function validateEnvironment(): void {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = import.meta.env[envVar as keyof ImportMetaEnv];
    
    if (!value || value === `{${envVar}}`) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const missingList = missing.join('\n  - ');
    throw new Error(
      `Missing required environment variables:\n  - ${missingList}\n\n` +
      `Please copy .env.example to .env.local and fill in the values.`
    );
  }
}

/**
 * Gets the validated environment configuration
 * @returns Validated environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  validateEnvironment();

  return {
    vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    pushProvider: import.meta.env.VITE_PUSH_PROVIDER as 'fcm' | 'webpush' | 'onesignal',
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    },
  };
}

// Validate environment on module load
validateEnvironment();
