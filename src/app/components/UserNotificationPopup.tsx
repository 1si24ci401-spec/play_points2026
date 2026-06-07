import { useState, useEffect } from 'react';
import { Button } from '@figma/astraui';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';

interface UserNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function UserNotificationPopup() {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [activeNotification, setActiveNotification] = useState<UserNotification | null>(null);

  useEffect(() => {
    if (!accessToken || !user) {
      setNotifications([]);
      setActiveNotification(null);
      return;
    }

    // Initial load
    checkNotifications();

    // Poll every 10 seconds for new notifications
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [accessToken, user]);

  const checkNotifications = async () => {
    if (!accessToken) return;
    try {
      const response = await api.getUserNotifications(accessToken);
      const list: UserNotification[] = response.notifications || [];
      setNotifications(list);
      
      // If we don't have an active notification showing, pick the first unread one
      if (list.length > 0 && !activeNotification) {
        // Sort by createdAt desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActiveNotification(list[0]);
      }
    } catch (error) {
      console.error('Failed to fetch user notifications:', error);
    }
  };

  const handleDismiss = async () => {
    if (!activeNotification || !accessToken) return;
    try {
      await api.markNotificationRead(accessToken, activeNotification.id);
      
      // Remove from list
      const remaining = notifications.filter(n => n.id !== activeNotification.id);
      setNotifications(remaining);
      
      // Show next notification if available, otherwise clear
      if (remaining.length > 0) {
        remaining.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActiveNotification(remaining[0]);
      } else {
        setActiveNotification(null);
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      // Fallback: just close locally
      setActiveNotification(null);
    }
  };

  if (!activeNotification) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-black/70 absolute inset-0 backdrop-blur-md"
          onClick={handleDismiss}
        />

        {/* Floating Popup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md border rounded-[var(--radius-lg)] p-6 z-10 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-primary)',
            boxShadow: '0 0 30px rgba(var(--color-primary-rgb, 99, 102, 241), 0.25)'
          }}
        >
          {/* Subtle top glow bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />

          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col gap-4 items-center text-center mt-2">
            <div className="p-3.5 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
              <Bell className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
                Notification from Admin
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {new Date(activeNotification.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div
              className="w-full p-4 rounded-[var(--radius-md)] border text-sm text-left font-medium leading-relaxed"
              style={{
                backgroundColor: 'var(--color-muted)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            >
              {activeNotification.message}
            </div>

            <div className="w-full pt-2 flex gap-3">
              <Button
                variant="primary"
                className="w-full py-2.5 font-medium"
                onClick={handleDismiss}
              >
                Acknowledge & Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
