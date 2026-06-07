import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { registerServiceWorkerAndSubscribe } from '../../utils/push';
import { X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl shadow-[0_8px_32px_rgba(99,102,241,0.25)] p-4 flex gap-3 items-start border border-white/10"
        >
          <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell size={18} />
          </div>
          
          <div className="flex-1 pr-6">
            <div className="font-semibold text-sm md:text-base">Exclusive offers waiting</div>
            <div className="text-xs md:text-sm opacity-90 mt-0.5">Come back and check today's offers tailored for you.</div>
            <div className="mt-3 flex gap-2">
              <Link to="/offers" onClick={dismiss} className="bg-white text-indigo-600 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                View Offers
              </Link>
              {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
                <button 
                  onClick={enablePush} 
                  className="bg-white/20 text-white border border-white/20 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  Enable Notifications
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={dismiss} 
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/15 transition-colors text-white/80 hover:text-white cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OffersNotification;
