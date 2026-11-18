import { useState } from 'react';
import { Button } from '@figma/astraui';
import { toast } from 'sonner';
import { api } from '../../utils/api';
import { X, Send, Sparkles, FileText, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SendUserPopupNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  userId: string;
  userEmail: string;
  onSuccess?: () => void;
}

export function SendUserPopupNotificationModal({
  isOpen,
  onClose,
  accessToken,
  userId,
  userEmail,
  onSuccess
}: SendUserPopupNotificationModalProps) {
  const [title, setTitle] = useState('Notice from Admin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      label: '📄 Tax Invoice Ready',
      title: 'Tax Invoice Available',
      text: 'Your official Tally Tax Invoice has been generated and enabled for your recent order! You can now view and download your bill directly in My Orders.'
    },
    {
      label: '✓ Payment Approved',
      title: 'Payment Approved',
      text: 'Your payment details have been verified and approved by admin. Your digital order is now being processed!'
    },
    {
      label: '⏳ Balance Due Reminder',
      title: 'Balance Payment Due',
      text: 'Friendly reminder: A balance payment remains due on your order. Please settle the remaining amount within the specified period. Check My Orders for invoice details.'
    },
    {
      label: '✨ Exclusive VIP Perk',
      title: 'Special VIP Offer',
      text: 'Special rewards have been credited to your account. Check out the latest shop deals now!'
    }
  ];

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Notification message is required');
      return;
    }

    setLoading(true);
    try {
      await api.sendUserNotification(accessToken, userId, message.trim(), title.trim() || 'Notice from Admin');
      toast.success(`Notification sent successfully to ${userEmail}`);
      setMessage('');
      setTitle('Notice from Admin');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to send user notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-black/70 absolute inset-0 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="border rounded-2xl p-6 z-10 w-full max-w-lg flex flex-col gap-4 relative overflow-hidden bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-start pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-serif font-medium text-white flex items-center gap-2">
                <Send size={18} className="text-amber-400" />
                Send In-App Notification
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Recipient: <span className="text-zinc-200">{userEmail}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(p.title);
                    setMessage(p.text);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tax Invoice Available"
              className="px-3 py-2 border rounded-xl bg-zinc-950 border-zinc-800 text-xs text-zinc-100 outline-none focus:border-amber-500 transition-colors font-mono"
            />
          </div>

          {/* Message Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
              Message Body
            </label>
            <textarea
              placeholder="Type message here. It will immediately pop up on the customer's screen..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={350}
              className="w-full px-3 py-2.5 border rounded-xl bg-zinc-950 border-zinc-800 text-xs text-zinc-100 outline-none focus:border-amber-500 transition-colors resize-none h-28 leading-relaxed"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>Will trigger popup modal upon user activity</span>
              <span>{message.length}/350</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button
              variant="neutral"
              size="small"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
