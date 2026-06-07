declare global {
  interface Window {
    OneSignal?: any;
  }
}

// Dynamically load OneSignal SDK script
export function loadOneSignalScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if (window.OneSignal) return resolve();

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('Failed to load OneSignal script, falling back to mock mode.');
      resolve();
    };
    document.head.appendChild(script);
  });
}

// Initialize OneSignal
export async function initOneSignal(appId: string) {
  if (typeof window === 'undefined') return;

  await loadOneSignalScript();

  if (window.OneSignal) {
    try {
      await window.OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true, // For dev convenience
        notifyButton: {
          enable: false, // Custom UI is preferred
        },
      });
      console.log('OneSignal initialized successfully.');
    } catch (err) {
      console.error('OneSignal initialization failed:', err);
    }
  } else {
    console.log('[Mock OneSignal] init mock-app-id');
  }
}

// Request permission / opt-in
export async function requestOneSignalSubscription() {
  if (typeof window === 'undefined') return;

  if (window.OneSignal) {
    try {
      // OneSignal Web SDK v16 opt-in triggers the permission request flow
      if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
        await window.OneSignal.User.PushSubscription.optIn();
      } else if (window.OneSignal.Slidedown) {
        await window.OneSignal.Slidedown.promptPush();
      } else {
        await window.OneSignal.showNativePrompt?.();
      }
      console.log('OneSignal subscription/permission requested.');
    } catch (err) {
      console.error('OneSignal permission request failed:', err);
    }
  } else {
    console.log('[Mock OneSignal] request permission/subscription');
    // Simulate approval by writing to localStorage
    localStorage.setItem('onesignal_permission_mocked', 'granted');
  }
}

// Associate logged-in user with OneSignal
export async function loginToOneSignal(userId: string, email?: string) {
  if (typeof window === 'undefined') return;

  if (window.OneSignal) {
    try {
      await window.OneSignal.login(userId);
      if (email) {
        // In v16, email is added to the User object
        if (window.OneSignal.User && typeof window.OneSignal.User.addEmail === 'function') {
          await window.OneSignal.User.addEmail(email);
        }
      }
      console.log(`Associated user ${userId} with OneSignal.`);
    } catch (err) {
      console.error('Failed to log in user to OneSignal:', err);
    }
  } else {
    console.log(`[Mock OneSignal] login ${userId} (${email || ''})`);
  }
}

// Log out user from OneSignal
export async function logoutFromOneSignal() {
  if (typeof window === 'undefined') return;

  if (window.OneSignal) {
    try {
      await window.OneSignal.logout();
      console.log('Logged out user from OneSignal.');
    } catch (err) {
      console.error('Failed to log out from OneSignal:', err);
    }
  } else {
    console.log('[Mock OneSignal] logout');
  }
}
