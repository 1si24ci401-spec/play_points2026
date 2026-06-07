/**
 * Firebase Cloud Messaging (FCM) utility
 * Supports real FCM when credentials are configured, or logs mock output for local dev.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Run in mock mode if credentials are not yet fully configured
const isMock =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === 'mock-firebase-api-key' ||
  !FIREBASE_VAPID_KEY ||
  FIREBASE_VAPID_KEY === 'mock-firebase-vapid-key' ||
  FIREBASE_VAPID_KEY.startsWith('REPLACE_ME');


let _app: any = null;
let _messaging: any = null;

async function getMessagingInstance() {
  if (_messaging) return _messaging;

  const { initializeApp, getApps } = await import('firebase/app');
  const { getMessaging } = await import('firebase/messaging');

  if (getApps().length === 0) {
    _app = initializeApp(firebaseConfig);
  } else {
    _app = getApps()[0];
  }

  _messaging = getMessaging(_app);
  return _messaging;
}

/** Initialize FCM and register the service worker. Returns the messaging instance or null in mock mode. */
export async function initFirebaseFCM(): Promise<any> {
  if (isMock) {
    console.log('[Mock FCM] initFirebaseFCM called – no real credentials configured');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[FCM] Service workers not supported');
    return null;
  }

  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Pass Firebase config to the service worker
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });

    return await getMessagingInstance();
  } catch (err) {
    console.error('[FCM] Initialization failed:', err);
    return null;
  }
}

/** Request notification permission and get the FCM registration token. */
export async function requestFCMPermission(): Promise<string | null> {
  if (isMock) {
    const mockToken = `mock-fcm-token-${Date.now()}`;
    console.log('[Mock FCM] Permission granted (mock). Token:', mockToken);
    return mockToken;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    const messaging = await getMessagingInstance();
    const { getToken } = await import('firebase/messaging');

    const reg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });

    console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    return null;
  }
}

/** Save FCM token to the backend for the authenticated user. */
export async function saveFCMTokenToServer(token: string, accessToken: string, userId: string): Promise<void> {
  if (isMock) {
    console.log('[Mock FCM] saveFCMTokenToServer – token:', token.substring(0, 20) + '...');
    return;
  }

  try {
    await fetch('/make-server-549f93eb/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token, userId }),
    });
  } catch (err) {
    console.error('[FCM] Failed to save token to server:', err);
  }
}

/** Listen for foreground messages (when app is open). */
export async function onFCMMessage(callback: (payload: any) => void): Promise<void> {
  if (isMock) {
    console.log('[Mock FCM] onFCMMessage listener registered (no-op in mock)');
    return;
  }

  try {
    const messaging = await getMessagingInstance();
    const { onMessage } = await import('firebase/messaging');
    onMessage(messaging, callback);
  } catch (err) {
    console.error('[FCM] Failed to register message listener:', err);
  }
}
