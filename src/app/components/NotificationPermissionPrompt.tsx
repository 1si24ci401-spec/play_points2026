import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, X, CheckCircle2, Shield, Smartphone } from 'lucide-react';
import { Button } from '@figma/astraui';
import { toast } from 'sonner';
import { HYDRA_BILL_LOGO_DATA_URL } from '../../assets/hydraInvoiceAssets';

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only run in browser environments supporting Notifications
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // If permission already granted or explicitly denied by browser, don't show prompt
    if (Notification.permission !== 'default') {
      return;
    }

    // Check if dismissed recently (within 24 hours)
    try {
      const dismissedAt = localStorage.getItem('hydra_notif_prompt_dismissed');
      if (dismissedAt) {
        const diffHours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
        if (diffHours < 24) {
          return;
        }
      }
    } catch {}

    // Delay prompt appearance by 1.8 seconds for smooth onboarding experience
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleAllowNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast('Notifications are not supported in your current browser.');
      setShowPrompt(false);
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        localStorage.setItem('hydra_push_notifications_enabled', 'true');
        setShowPrompt(false);
        toast.success('Push notifications enabled! You will receive live updates for orders & bills.');

        // Trigger native mobile/system banner notification immediately
        try {
          const testNotif = new Notification('Hydra Traders Notifications Enabled', {
            body: 'You will receive real-time alerts for your orders, tax invoices, and payments!',
            icon: '/images/hydra-bill-logo.png',
            badge: '/images/hydra-bill-logo.png',
            tag: 'hydra-welcome-notif',
          });

          testNotif.onclick = () => {
            window.focus();
          };
        } catch (e) {
          console.warn('Native notification spawn note:', e);
        }
      } else if (permission === 'denied') {
        localStorage.setItem('hydra_notif_prompt_dismissed', Date.now().toString());
        setShowPrompt(false);
        toast('Notification permission was denied. You can enable it in your browser settings.');
      } else {
        // Dismissed / default
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      toast('Could not request notification permissions.');
      setShowPrompt(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('hydra_notif_prompt_dismissed', Date.now().toString());
    } catch {}
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[95] max-w-sm w-[calc(100vw-2rem)]">
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="relative bg-zinc-950/95 border border-amber-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl overflow-hidden text-zinc-100"
          style={{
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.12)'
          }}
        >
          {/* Top glowing accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Dismiss for now"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3.5">
            {/* Mobile App Style Icon with pulsing ring */}
            <div className="relative shrink-0 mt-0.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-600/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
                <Smartphone className="w-2.5 h-2.5 text-zinc-950" />
              </div>
            </div>

            {/* Prompt details */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Allow Push Notifications
                </h4>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Stay updated just like a mobile app! Get instant alerts when your bill is generated, order status updates, or payment is approved.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2 justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
              Maybe Later
            </button>
            <Button
              variant="primary"
              size="small"
              onClick={handleAllowNotifications}
              disabled={isRequesting}
              iconStart={<Bell size={14} />}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold hover:brightness-110 shadow-lg shadow-amber-500/20"
            >
              {isRequesting ? 'Requesting...' : 'Allow Notifications'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
