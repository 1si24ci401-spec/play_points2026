import { useState } from 'react';
import { Button } from '@figma/astraui';
import { toast } from 'sonner';
import { api } from '../../utils/api';
import { X } from 'lucide-react';
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
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Notification message is required');
      return;
    }

    setLoading(true);
    try {
      await api.sendUserNotification(accessToken, userId, message.trim());
      toast.success(`Notification sent successfully to ${userEmail}`);
      setMessage('');
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
          className="bg-black/60 absolute inset-0 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="border rounded-[var(--radius-lg)] p-6 z-10 w-full max-w-md flex flex-col gap-4 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Send In-App Notification
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Recipient: {userEmail}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Message Content
            </label>
            <textarea
              placeholder="Type your message here. It will immediately pop up on the user's dashboard next time they are active."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={250}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            />
            <div className="flex justify-between text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              <span>User will see this as a popup modal</span>
              <span>{message.length}/250</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="neutral"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
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
