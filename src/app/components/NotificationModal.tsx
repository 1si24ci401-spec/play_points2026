import { useState } from 'react';
import { Button } from '@figma/astraui';
import { toast } from 'sonner';
import { api } from '../../utils/api';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onSuccess?: () => void;
}

export function NotificationModal({ isOpen, onClose, accessToken, onSuccess }: NotificationModalProps) {
  const [title, setTitle] = useState('Exclusive Offers for You');
  const [body, setBody] = useState("We've curated offers just for you based on your order history!");
  const [url, setUrl] = useState('/offers');
  const [notificationType, setNotificationType] = useState<'personalized' | 'broadcast' | 'specific'>('personalized');
  const [targetEmail, setTargetEmail] = useState('');
  const [useOrderHistory, setUseOrderHistory] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }

    if (notificationType === 'specific' && !targetEmail.trim()) {
      toast.error('Target user email is required');
      return;
    }

    setLoading(true);
    try {
      if (notificationType === 'personalized') {
        const payload = { title, body, url };
        await api.sendPersonalizedPush(accessToken, payload);
        toast.success('Personalized notifications queued for delivery');
      } else if (notificationType === 'specific') {
        const payload = { title, body, url, email: targetEmail.trim() };
        await api.sendPush(accessToken, payload);
        toast.success(`Push notification sent to user ${targetEmail.trim()}`);
      } else {
        // For broadcast, send to all subscriptions
        const payload = { title, body, url };
        const response = await api.sendPush(accessToken, payload);
        toast.success(`Broadcast sent to ${(response as any).sent || 0} users`);
      }
      
      setTitle('Exclusive Offers for You');
      setBody("We've curated offers just for you based on your order history!");
      setUrl('/offers');
      setTargetEmail('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/50 absolute inset-0" onClick={onClose} />
      <div className="bg-card border border-border rounded-lg p-6 z-10 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Send Notification</h2>
        
        <div className="space-y-4 mb-6">
          {/* Notification Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notification Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="personalized"
                  checked={notificationType === 'personalized'}
                  onChange={() => setNotificationType('personalized')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Personalized (based on order history)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="specific"
                  checked={notificationType === 'specific'}
                  onChange={() => setNotificationType('specific')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Specific User (by Email)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="broadcast"
                  checked={notificationType === 'broadcast'}
                  onChange={() => setNotificationType('broadcast')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Broadcast (all users)</span>
              </label>
            </div>
          </div>

          {/* Target User Email (Conditional) */}
          {notificationType === 'specific' && (
            <div>
              <label className="text-sm font-medium block mb-2">Target User Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px var(--color-primary)')}
                onBlur={(e) => (e.target.style.boxShadow = 'none')}
                autoComplete="email"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                The push notification will be sent to this user only.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm font-medium block mb-2">Title</label>
            <input
              type="text"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px var(--color-primary)')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            />
            <div className="text-xs text-muted-foreground mt-1">{title.length}/100</div>
          </div>

          {/* Body */}
          <div>
            <label className="text-sm font-medium block mb-2">Message</label>
            <textarea
              placeholder="Notification message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
            />
            <div className="text-xs text-muted-foreground mt-1">{body.length}/200</div>
          </div>

          {/* URL */}
          <div>
            <label className="text-sm font-medium block mb-2">Target URL (when clicked)</label>
            <input
              type="text"
              placeholder="/offers"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px var(--color-primary)')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
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
      </div>
    </div>
  );
}
