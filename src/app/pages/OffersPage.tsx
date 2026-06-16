import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { Gift, Sparkles, ShieldAlert, ArrowRight, Edit } from 'lucide-react';
import { AppNav, getUserNavPermissions, getFirstPermittedPage } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { OffersEditModal } from '../components/OffersEditModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
}

export function OffersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, accessToken } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [perms, setPerms] = useState<Record<string, boolean> | null>(() => 
    user ? getUserNavPermissions(user.id) : null
  );

  useEffect(() => {
    if (!user) return;
    setPerms(getUserNavPermissions(user.id));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.userId === user.id) {
        setPerms(customEvent.detail.perms);
      }
    };
    window.addEventListener('nav-permissions-updated', handleUpdate);
    return () => window.removeEventListener('nav-permissions-updated', handleUpdate);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (perms && perms.offers === false) {
        navigate(getFirstPermittedPage(user.id, user.tier));
      }
    }
  }, [user, authLoading, navigate, perms]);

  useEffect(() => {
    if (user) {
      loadOffers();
    }
  }, [user]);

  const loadOffers = async () => {
    try {
      const { offers: data } = await api.getOffers();
      if (data) {
        setOffers(data);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffers = async (updatedOffers: Offer[]) => {
    if (!accessToken) return;
    try {
      await api.updateOffers(accessToken, updatedOffers);
      setOffers(updatedOffers);
      toast('Offers updated successfully');
      loadOffers();
    } catch (error) {
      console.error('Error saving offers:', error);
      toast('Failed to update offers');
    }
  };

  if (authLoading || !user) {
    return null;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />

      <main className="flex-1 overflow-auto md:pt-20 pb-16 md:pb-0">
        {/* Header */}
        <div className="backdrop-blur-lg border-b" style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)'
        }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                Seasonal Offers
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Exclusive deals and discount events curated for you
              </p>
            </motion.div>

            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-wrap items-center gap-2"
              >
                <Button
                  variant="primary"
                  iconStart={<Edit size={16} />}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit Page Content
                </Button>
                <Button
                  variant="neutral"
                  iconStart={<ShieldAlert size={16} />}
                  onClick={() => navigate('/admin')}
                >
                  Admin Panel
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-[var(--radius-lg)] border p-6 h-[200px]"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)'
                  }}
                />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="text-lg mb-2" style={{ color: 'var(--color-foreground)' }}>
                No Active Offers Right Now
              </p>
              <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
                Check back later! Our admins post exciting new promotions frequently.
              </p>
              <Button variant="primary" onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative rounded-[var(--radius-lg)] border p-6 flex flex-col gap-4 shadow-sm overflow-hidden"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none rounded-bl-full" />
                    
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] bg-primary/10 border border-primary/20">
                      <span className="text-2xl font-bold text-primary">{offer.discount}</span>
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <h3 className="text-lg font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                        {offer.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)', lineHeight: '1.5' }}>
                        {offer.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Sparkles size={12} /> Active Deal
                      </span>
                      <div className="flex gap-2">
                        {isAdmin && (
                          <Button
                            variant="neutral"
                            size="small"
                            iconStart={<Edit size={14} />}
                            onClick={() => setIsEditModalOpen(true)}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="subtle"
                          size="small"
                          iconEnd={<ArrowRight size={14} />}
                          onClick={() => navigate('/products')}
                        >
                          Shop Now
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Inline Offers Editor Modal */}
      <OffersEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        offers={offers}
        onSave={handleSaveOffers}
      />
    </div>
  );
}
