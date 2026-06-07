import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { registerServiceWorkerAndSubscribe } from '../../utils/push';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function OffersNotification() {
  const { user, loading, accessToken } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    try {
      const dismissedAt = localStorage.getItem('offersNotificationDismissedAt');
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;

      if (!dismissedAt || now - Number(dismissedAt) > DAY) {
        setVisible(true);
      }
    } catch (e) {
      setVisible(true);
    }
  }, [user, loading]);

  const dismiss = () => {
    try {
      localStorage.setItem('offersNotificationDismissedAt', String(Date.now()));
    } catch (e) {
      // ignore
    }
    setVisible(false);
  };

  const enablePush = async () => {
    const provider = import.meta.env.VITE_PUSH_PROVIDER || 'webpush';

    if (provider === 'fcm') {
      try {
        const { initFirebaseFCM, requestFCMPermission, saveFCMTokenToServer } = await import('../../utils/firebase');
        await initFirebaseFCM();
        const token = await requestFCMPermission();
        if (token && accessToken && user?.id) {
          await saveFCMTokenToServer(token, accessToken, user.id);
          if (user?.id) localStorage.setItem('userId', user.id);
        }
        setVisible(false);
      } catch (err) {
        console.error('[FCM] Permission/subscription flow failed', err);
      }
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID public key not configured (VITE_VAPID_PUBLIC_KEY)');
      return;
    }

    try {
      await registerServiceWorkerAndSubscribe(VAPID_PUBLIC_KEY, accessToken || undefined);
      if (user?.id) localStorage.setItem('userId', user.id);
      setVisible(false);
    } catch (e) {
      console.error('Push subscription failed', e);
    }
  };


  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg shadow-lg p-4 flex gap-3 items-start">
      <div className="flex-1">
        <div className="font-semibold">Exclusive offers waiting</div>
        <div className="text-sm opacity-90">Come back and check today's offers tailored for you.</div>
        <div className="mt-2 flex gap-2">
          <Link to="/offers" className="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium">View Offers</Link>
          {typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? (
            <button onClick={enablePush} className="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium">Enable Notifications</button>
          ) : null}
          <button onClick={dismiss} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm">Dismiss</button>
        </div>
      </div>
    </div>
  );
}

export default OffersNotification;
