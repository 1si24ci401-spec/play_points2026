import { useState, useEffect, useCallback } from 'react';
import { Button } from '@figma/astraui';
import { Bell, X, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';

interface UserNotification {
  id: string;
  title?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function UserNotificationPopup() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [activeNotification, setActiveNotification] = useState<UserNotification | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const checkNotifications = useCallback(async () => {
    if (!accessToken || !user) return;
    try {
      const response = await api.getUserNotifications(accessToken, user.id);
      const list: UserNotification[] = response.notifications || [];
      setNotifications(list);

      // If we don't have an active notification showing, pick the latest unread one
      if (list.length > 0 && !activeNotification) {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const target = list[0];
        setActiveNotification(target);

        // Native mobile-app-like OS/Browser notification popup
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const isOrderOrBill =
              target.message.toLowerCase().includes('order') ||
              target.message.toLowerCase().includes('invoice') ||
              target.message.toLowerCase().includes('bill');

            const native = new Notification(target.title || (isOrderOrBill ? 'Tax Invoice & Bill Notice' : 'Hydra Traders Notice'), {
              body: target.message,
              icon: '/images/hydra-bill-logo.png',
              badge: '/images/hydra-bill-logo.png',
              tag: target.id,
            });

            native.onclick = () => {
              window.focus();
              if (isOrderOrBill) {
                navigate('/orders');
              }
            };
          } catch (notifErr) {
            console.warn('Native notification trigger note:', notifErr);
          }
        }
      }
    } catch (error) {
      // Non-fatal, suppress console noise
    }
  }, [accessToken, user, activeNotification, navigate]);

  useEffect(() => {
    if (!accessToken || !user) {
      setNotifications([]);
      setActiveNotification(null);
      return;
    }

    // Initial check
    checkNotifications();

    // Listen to custom notification event for instant real-time wakeup
    const handleUpdate = () => {
      checkNotifications();
    };
    window.addEventListener('user-notifications-updated', handleUpdate);

    // Poll every 12 seconds as fallback
    const interval = setInterval(checkNotifications, 12000);

    return () => {
      window.removeEventListener('user-notifications-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [accessToken, user, checkNotifications]);

  const handleDismiss = async () => {
    if (!activeNotification || !accessToken || !user) {
      setActiveNotification(null);
      return;
    }

    const currentId = activeNotification.id;
    try {
      await api.markNotificationRead(accessToken, currentId, user.id);
    } catch (err) {
      console.warn('Could not mark notification read:', err);
    }

    // Filter out dismissed notification
    const remaining = notifications.filter(n => n.id !== currentId);
    setNotifications(remaining);

    if (remaining.length > 0) {
      remaining.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActiveNotification(remaining[0]);
    } else {
      setActiveNotification(null);
    }
  };

  const handleActionClick = () => {
    const isOrderOrBill =
      activeNotification?.message.toLowerCase().includes('order') ||
      activeNotification?.message.toLowerCase().includes('invoice') ||
      activeNotification?.message.toLowerCase().includes('bill');

    handleDismiss();
    if (isOrderOrBill) {
      navigate('/orders');
    }
  };

  if (!activeNotification) return null;

  const isOrderOrBill =
    activeNotification.message.toLowerCase().includes('order') ||
    activeNotification.message.toLowerCase().includes('invoice') ||
    activeNotification.message.toLowerCase().includes('bill');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-black/75 absolute inset-0 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Floating Popup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md border rounded-[var(--radius-lg)] p-6 z-10 overflow-hidden shadow-2xl"
          style={{
            backgroundColor: 'var(--color-card, #18181b)',
            borderColor: isOrderOrBill ? 'var(--color-primary, #f59e0b)' : 'var(--color-primary, #6366f1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.15)'
          }}
        >
          {/* Top highlight bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isOrderOrBill
                ? 'bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
            }`}
          />

          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Dismiss"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col gap-4 items-center text-center mt-1">
            <div
              className={`p-3.5 rounded-full flex items-center justify-center ${
                isOrderOrBill
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              {isOrderOrBill ? <FileText className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white font-serif">
                  {activeNotification.title || (isOrderOrBill ? 'Tax Invoice & Billing Notice' : 'Notice from Admin')}
                </h3>
                {notifications.length > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                    1 of {notifications.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {new Date(activeNotification.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div
              className="w-full p-4 rounded-xl border text-xs text-left leading-relaxed font-sans bg-zinc-950/80 border-zinc-800 text-zinc-200"
            >
              {activeNotification.message}
            </div>

            {/* In-app Mobile Push Permission helper if not yet allowed */}
            {browserPermission === 'default' && (
              <div className="w-full flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <span className="flex items-center gap-1.5 text-[11px] font-medium">
                  <Bell className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-400" />
                  Want native mobile popups for order & bill updates?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                      const res = await Notification.requestPermission();
                      setBrowserPermission(res);
                      if (res === 'granted') {
                        try {
                          new Notification('Push Notifications Enabled', {
                            body: 'You will receive instant popups for orders, bills, and payments!',
                            icon: '/images/hydra-bill-logo.png',
                          });
                        } catch (e) {}
                      }
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500 text-zinc-950 font-bold text-[10px] uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all shrink-0 shadow"
                >
                  Allow
                </button>
              </div>
            )}

            <div className="w-full pt-1 flex gap-2 flex-col sm:flex-row">
              {isOrderOrBill && (
                <Button
                  variant="primary"
                  className="flex-1 py-2 font-medium"
                  iconStart={<ExternalLink size={14} />}
                  onClick={handleActionClick}
                >
                  View My Orders
                </Button>
              )}
              <Button
                variant={isOrderOrBill ? 'neutral' : 'primary'}
                className="flex-1 py-2 font-medium"
                onClick={handleDismiss}
              >
                Acknowledge & Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
