import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, InputField, SwitchField, IconButton, Badge } from '@figma/astraui';
import { Plus, Trash2, Mail, Edit, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { AppNav } from '../components/AppNav';
import { SeedDataButton } from '../components/SeedDataButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { RevealText } from '../components/RevealText';
import { ScrollProgress } from '../components/ScrollProgress';
import { OffersEditModal } from '../components/OffersEditModal';
import { NotificationModal } from '../components/NotificationModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';
import { apiCall } from '../../utils/api';
import { format } from 'date-fns';
import { UsersTab } from '../components/UsersTab';
import { StatsTab } from '../components/StatsTab';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, accessToken } = useAuth();
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationEvents, setNotificationEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'coupons' | 'orders' | 'offers' | 'users' | 'stats'>('products');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/products');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-lg border-b" style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)'
        }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-1">
                <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Manage products, coupons, offers, and orders
              </p>
            </motion.div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="max-w-7xl flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <TabButton
                active={activeTab === 'products'}
                onClick={() => setActiveTab('products')}
              >
                Products
              </TabButton>
              <TabButton
                active={activeTab === 'offers'}
                onClick={() => setActiveTab('offers')}
              >
                Offers
              </TabButton>
              <TabButton
                active={activeTab === 'coupons'}
                onClick={() => setActiveTab('coupons')}
              >
                Coupons
              </TabButton>
              <TabButton
                active={activeTab === 'orders'}
                onClick={() => setActiveTab('orders')}
              >
                Orders
              </TabButton>
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
              >
                Users
              </TabButton>
              <TabButton
                active={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
              >
                Statistics
              </TabButton>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'products' && <ProductsTab accessToken={accessToken!} />}
              {activeTab === 'offers' && <OffersTab accessToken={accessToken!} onOpenNotificationModal={() => setShowNotificationModal(true)} onShowEvents={() => setShowEventsModal(true)} onLoadEvents={async () => {
                try {
                  const { events } = await api.getNotificationEvents(accessToken!);
                  setNotificationEvents(events || []);
                } catch (e) {
                  console.error('Failed to load notification events', e);
                }
              }} />}
              {activeTab === 'coupons' && <CouponsTab accessToken={accessToken!} />}
              {activeTab === 'orders' && <OrdersTab accessToken={accessToken!} />}
              {activeTab === 'users' && <UsersTab accessToken={accessToken!} />}
              {activeTab === 'stats' && <StatsTab accessToken={accessToken!} />}
            </motion.div>
          </div>
        </div>
      </main>
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        accessToken={accessToken!}
        onSuccess={() => {
          // Optionally refresh events
        }}
      />

      {showEventsModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="bg-black/50 absolute inset-0" onClick={() => setShowEventsModal(false)} />
          <div className="bg-card border border-border rounded-lg p-6 z-10 w-[90%] max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Notification Events</h2>
              <div className="flex gap-2">
                <Button variant="neutral" onClick={() => setShowEventsModal(false)}>Close</Button>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-auto">
              {notificationEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground">No events recorded yet.</div>
              ) : (
                notificationEvents.map((e: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-md">
                    <div className="text-sm font-medium">{e.type.toUpperCase()} — {e.title}</div>
                    <div className="text-xs text-muted-foreground">User: {e.userId || 'unknown'} • {new Date(e.receivedAt || e.receivedAt).toLocaleString()}</div>
                    <div className="text-sm mt-2">{e.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to list users (admin) - small internal helper
async function apiCallForUsers(token: string) {
  // This function hits the /profile endpoint for all users by reading KV via a temporary admin endpoint
  // For simplicity, reuse getOffers (not ideal). In production add a proper endpoint to list users.
  const resp = await fetch('/make-server-549f93eb/users', { headers: { Authorization: `Bearer ${token}` } });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Failed to get users');
  return data.users || [];
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 border-b-2 transition-all"
      style={{
        borderColor: active ? 'var(--color-primary)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
        fontWeight: active ? 500 : 400
      }}
    >
      {children}
    </button>
  );
}

function ProductsTab({ accessToken }: { accessToken: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const MAX_IMAGE_BYTES = 500 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) {
      setImage('');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPG, JPEG, or PNG files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be 500KB or smaller');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setImageError('Failed to read image file');
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { products: data } = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setImage('');
    setImageError('');
    setShowForm(false);
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price != null ? String(product.price) : '');
    setCategory(product.category || '');
    setImage(product.image || '');
    setImageError('');
    setShowForm(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        category,
        image: image || null,
      };

      if (editingId) {
        await api.updateProduct(accessToken, editingId, payload);
        toast('Product updated successfully');
      } else {
        await api.createProduct(accessToken, payload);
        toast('Product created successfully');
      }

      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast(editingId ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(accessToken, productId);
      toast('Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast('Failed to delete product');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {!showForm ? (
        <div className="flex gap-4">
          <Button variant="primary" iconStart={<Plus size={16} />} onClick={() => setShowForm(true)}>
            Add Product
          </Button>
          {products.length === 0 && <SeedDataButton accessToken={accessToken} />}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-[var(--radius-lg)] p-6"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h2 className="text-xl font-medium text-card-foreground">
              {editingId ? 'Edit Product' : 'New Product'}
            </h2>

            <InputField
              label="Product Name"
              value={name}
              onChange={setName}
              placeholder="Premium Digital License"
              required
            />

            <InputField
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe the product"
              required
            />

            <div className="flex gap-6">
              <InputField
                label="Price"
                type="number"
                step="0.01"
                value={price}
                onChange={setPrice}
                placeholder="29.99"
                prefix="$"
                className="flex-1"
                required
              />

              <InputField
                label="Category"
                value={category}
                onChange={setCategory}
                placeholder="Software, License, etc."
                className="flex-1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                style={{
                  color: 'var(--color-card-foreground)',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Product Image
              </label>
              <span
                style={{
                  color: 'var(--color-muted-foreground)',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                }}
              >
                JPG, JPEG, or PNG. Max 500KB.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                style={{
                  color: 'var(--color-card-foreground)',
                  backgroundColor: 'var(--color-input-background, var(--color-card))',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                }}
              />
              {imageError && (
                <span style={{ color: 'var(--color-destructive)', fontSize: '0.75rem', fontFamily: 'inherit' }}>
                  {imageError}
                </span>
              )}
              {image && (
                <div
                  className="mt-2 flex items-center gap-3 p-3"
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-muted)',
                  }}
                >
                  <img
                    src={image}
                    alt="Product preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage('');
                      setImageError('');
                    }}
                    style={{
                      color: 'var(--color-destructive)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="neutral" onClick={resetForm}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading
                  ? editingId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingId
                  ? 'Save Changes'
                  : 'Create Product'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {products.length === 0 ? (
        <div className="bg-card rounded-[var(--radius-lg)] p-12 text-center text-muted-foreground">
          No products yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <AnimatedCard key={product.id} delay={index * 0.05}>
              <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden flex flex-col gap-4">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  />
                )}
                <div className="flex flex-col gap-4 p-6 pt-0" style={product.image ? undefined : { paddingTop: '1.5rem' }}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2 flex-1">
                    <h3 className="text-lg font-medium text-card-foreground">{product.name}</h3>
                    {product.category && (
                      <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-[var(--radius-md)] inline-flex w-fit">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <IconButton
                      icon={<Edit size={16} />}
                      variant="subtle"
                      size="small"
                      onClick={() => handleEdit(product)}
                    />
                    <IconButton
                      icon={<Trash2 size={16} />}
                      variant="subtle"
                      size="small"
                      onClick={() => handleDelete(product.id)}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground flex-1">{product.description}</p>
                <span className="text-3xl font-medium text-foreground pt-4 border-t border-border">
                  ${product.price.toFixed(2)}
                </span>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}

function OffersTab({ accessToken, onOpenNotificationModal, onShowEvents, onLoadEvents }: { accessToken: string; onOpenNotificationModal: () => void; onShowEvents: () => void; onLoadEvents: () => Promise<void> }) {
  const [offers, setOffers] = useState<any[]>([
    {
      id: '1',
      title: 'Limited Time Offer',
      description: 'Get exclusive access to our premium digital products with special discounts',
      discount: '50%',
    },
    {
      id: '2',
      title: 'Bundle Deal',
      description: 'Purchase multiple products and save even more on your order',
      discount: '30%',
    },
    {
      id: '3',
      title: 'First Purchase',
      description: 'New customers get a special welcome discount on their first order',
      discount: '20%',
    },
  ]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { offers: data } = await api.getOffers();
      if (data && data.length > 0) {
        setOffers(data);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const handleSaveOffers = async (updatedOffers: any[]) => {
    try {
      await api.updateOffers(accessToken, updatedOffers);
      setOffers(updatedOffers);
      toast('Offers updated successfully');
    } catch (error) {
      console.error('Error saving offers:', error);
      toast('Failed to update offers');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
            iconStart={<Edit size={16} />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Offers
          </Button>
          <Button
            variant="secondary"
            iconStart={<Mail size={16} />}
            onClick={onOpenNotificationModal}
          >
            Send Notification
          </Button>
          <Button
            variant="outline"
            iconStart={<Edit size={16} />}
            onClick={async () => {
              const userId = prompt('Enter user id to preview (or leave blank to find by email)');
              if (!userId) {
                const email = prompt('Enter user email to preview for');
                if (!email) return;
                try {
                  const users = await apiCallForUsers(accessToken);
                  const found = users.find((u: any) => u.email === email);
                  if (!found) return alert('User not found');
                  const preview = await api.previewPersonalizedPush(accessToken, found.id);
                  alert(`Preview:\nTitle: ${preview.title}\nBody: ${preview.body}`);
                } catch (e) {
                  console.error(e);
                  toast.error('Failed to preview for email');
                }
                return;
              }
              try {
                const preview = await api.previewPersonalizedPush(accessToken, userId);
                alert(`Preview:\nTitle: ${preview.title}\nBody: ${preview.body}`);
              } catch (e) {
                console.error(e);
                toast.error('Failed to preview for user');
              }
            }}
          >
            Preview For User
          </Button>
          <Button
            variant="ghost"
            iconStart={<Mail size={16} />}
            onClick={async () => {
              try {
                await onLoadEvents();
                onShowEvents();
              } catch (e) {
                console.error('Failed to load notification events', e);
                toast.error('Failed to load notification events');
              }
            }}
          >
            View Notification Events
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((offer, index) => (
          <AnimatedCard key={offer.id} delay={index * 0.1}>
            <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6 h-full flex flex-col gap-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-md)] bg-primary/10">
                <span className="text-3xl font-bold text-primary">{offer.discount}</span>
              </div>
              <h3 className="text-xl font-medium text-card-foreground">{offer.title}</h3>
              <p className="text-muted-foreground flex-1">{offer.description}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>

      <OffersEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        offers={offers}
        onSave={handleSaveOffers}
      />
    </div>
  );
}

function CouponsTab({ accessToken }: { accessToken: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { coupons: data } = await api.getCoupons(accessToken);
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createCoupon(accessToken, {
        code,
        discountPercent: parseInt(discountPercent),
        active,
        expiresAt: expiresAt || null,
      });

      toast('Coupon created successfully');
      setCode('');
      setDiscountPercent('');
      setActive(true);
      setExpiresAt('');
      setShowForm(false);
      loadCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast('Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (couponCode: string, currentActive: boolean) => {
    try {
      await api.updateCoupon(accessToken, couponCode, { active: !currentActive });
      toast('Coupon updated');
      loadCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast('Failed to update coupon');
    }
  };

  const handleDelete = async (couponCode: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await api.deleteCoupon(accessToken, couponCode);
      toast('Coupon deleted');
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast('Failed to delete coupon');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {!showForm ? (
        <div>
          <Button variant="primary" iconStart={<Plus size={16} />} onClick={() => setShowForm(true)}>
            Create Coupon
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-[var(--radius-lg)] p-6"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h2 className="text-xl font-medium text-card-foreground">New Coupon</h2>

            <InputField
              label="Coupon Code"
              value={code}
              onChange={setCode}
              placeholder="SAVE20"
              description="Will be converted to uppercase"
              required
            />

            <InputField
              label="Discount Percentage"
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={setDiscountPercent}
              placeholder="20"
              suffix="%"
              required
            />

            <InputField
              label="Expiration Date (Optional)"
              type="datetime-local"
              value={expiresAt}
              onChange={setExpiresAt}
            />

            <SwitchField
              label="Active"
              description="Inactive coupons cannot be used"
              defaultSelected={active}
              onChange={setActive}
            />

            <div className="flex gap-3 justify-end">
              <Button variant="neutral" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {coupons.length === 0 ? (
        <div className="bg-card rounded-[var(--radius-lg)] p-12 text-center text-muted-foreground">
          No coupons yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon, index) => (
            <AnimatedCard key={coupon.code} delay={index * 0.05}>
              <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-mono text-card-foreground">{coupon.code}</h3>
                    <span className="text-2xl font-medium text-primary">
                      {coupon.discountPercent}% off
                    </span>
                  </div>
                  <Badge label={coupon.active ? 'Active' : 'Inactive'} variant={coupon.active ? 'success' : 'default' as any} />
                </div>

                {coupon.expiresAt && (
                  <div className="text-sm text-muted-foreground">
                    Expires: {format(new Date(coupon.expiresAt), 'MMM d, yyyy h:mm a')}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="neutral"
                    size="small"
                    onClick={() => handleToggleActive(coupon.code, coupon.active)}
                  >
                    {coupon.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <IconButton
                    icon={<Trash2 size={16} />}
                    variant="subtle"
                    size="small"
                    onClick={() => handleDelete(coupon.code)}
                  />
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ accessToken }: { accessToken: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentType, setEditPaymentType] = useState<'full' | 'partial'>('full');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editPartialAmount, setEditPartialAmount] = useState<string>('0');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSavePayment = async (order: any) => {
    setIsSavingPayment(true);
    try {
      const pAmt = editPaymentType === 'partial' ? Number(editPartialAmount) : 0;
      await api.updateOrder(accessToken, order.id, {
        paymentType: editPaymentType,
        paymentStatus: editPaymentStatus,
        partialAmount: pAmt
      });
      toast.success('Payment details updated successfully!');
      setEditingPaymentId(null);
      loadOrders();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment details');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { orders: data } = await api.getOrders(accessToken);
      setOrders(data.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrder(accessToken, orderId, { status });
      toast('Order status updated');
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast('Failed to update order');
    }
  };

  const handleResendEmail = async (orderId: string) => {
    try {
      await api.resendOrderEmail(accessToken, orderId);
      toast('Confirmation email resent');
    } catch (error) {
      console.error('Error resending email:', error);
      toast('Failed to resend email');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-[var(--radius-lg)] p-12 text-center text-muted-foreground">
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-[var(--radius-lg)] p-12 text-center text-muted-foreground">
        No orders yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {orders.map((order, index) => (
        <AnimatedCard key={order.id} delay={index * 0.05}>
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm text-muted-foreground">
                  {order.id.split(':')[1]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <Badge
                label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                variant={getStatusBadgeVariant(order.status) as any}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Customer Email</span>
                  <p className="text-card-foreground">{order.userEmail}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Discord Username</span>
                  <p className="text-card-foreground font-mono">{order.discordUsername}</p>
                </div>
                {order.codGameId && (
                  <div>
                    <span className="text-sm text-muted-foreground">COD GAME ID</span>
                    <p className="text-card-foreground font-mono">{order.codGameId}</p>
                  </div>
                )}
                {order.couponCode && (
                  <div>
                    <span className="text-sm text-muted-foreground">Coupon Applied</span>
                    <p className="text-primary">{order.couponCode}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <span className="text-card-foreground">{item.name}</span>
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </div>
                ))}
                <div className="text-lg font-medium text-foreground mt-2 pt-4 border-t border-border">
                  Total: ${order.discountedTotal.toFixed(2)}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment Type:</span>
                    <span className="font-medium text-foreground uppercase">{order.paymentType || 'full'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge
                      label={(order.paymentStatus || 'pending').toUpperCase()}
                      variant={
                        order.paymentStatus === 'approved' ? 'success' :
                        order.paymentStatus === 'rejected' ? 'danger' : 'warning' as any
                      }
                    />
                  </div>
                  {order.paymentType === 'partial' ? (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Paid Amount:</span>
                        <span className="font-semibold text-emerald-500">${(order.partialAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Pending Balance:</span>
                        <span className="font-semibold text-amber-500">${(order.remainingAmount || 0).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-semibold text-foreground">
                        {order.paymentStatus === 'approved' ? `$${order.discountedTotal.toFixed(2)}` : '$0.00'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {editingPaymentId === order.id && (
              <div className="mt-2 p-4 border rounded-lg flex flex-col gap-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                <h4 className="text-sm font-semibold text-foreground">Edit Payment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Payment Type</label>
                    <select
                      value={editPaymentType}
                      onChange={(e) => setEditPaymentType(e.target.value as any)}
                      className="p-2 border rounded bg-background text-foreground text-sm outline-none"
                    >
                      <option value="full">Full Payment</option>
                      <option value="partial">Partial Payment</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                      className="p-2 border rounded bg-background text-foreground text-sm outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {editPaymentType === 'partial' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Paid Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={order.discountedTotal}
                        value={editPartialAmount}
                        onChange={(e) => setEditPartialAmount(e.target.value)}
                        className="p-2 border rounded bg-background text-foreground text-sm outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <Button
                    variant="neutral"
                    size="small"
                    onClick={() => setEditingPaymentId(null)}
                    disabled={isSavingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleSavePayment(order)}
                    disabled={isSavingPayment}
                  >
                    {isSavingPayment ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border items-center flex-wrap">
              <select
                value={order.status}
                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                className="cursor-pointer outline-none"
                style={{
                  backgroundColor: 'var(--color-input-background, var(--color-card))',
                  color: 'var(--color-card-foreground)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  minWidth: '160px',
                }}
              >
                <option value="pending" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}>Pending</option>
                <option value="processing" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}>Processing</option>
                <option value="completed" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}>Completed</option>
                <option value="delivered" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}>Delivered</option>
                <option value="cancelled" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}>Cancelled</option>
              </select>
              <Button
                variant="neutral"
                size="small"
                onClick={() => {
                  setEditingPaymentId(order.id);
                  setEditPaymentType(order.paymentType || 'full');
                  setEditPaymentStatus(order.paymentStatus || 'pending');
                  setEditPartialAmount(String(order.partialAmount || 0));
                }}
              >
                Update Payment
              </Button>
              <Button
                variant="neutral"
                size="small"
                iconStart={<Mail size={16} />}
                onClick={() => handleResendEmail(order.id)}
              >
                Resend Email
              </Button>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
}
