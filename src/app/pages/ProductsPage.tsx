import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { Plus, Sparkles, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { AppNav, getUserNavPermissions, getFirstPermittedPage } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { AddToCartAnimation } from '../components/AddToCartAnimation';
import { ProductRevealAnimation } from '../components/ProductRevealAnimation';
import { ProductCarousel } from '../components/ProductCarousel';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../components/ui/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  image?: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
}

export function ProductsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [cartAnimPosition, setCartAnimPosition] = useState({ x: 0, y: 0 });

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
      if (perms && perms.shop === false) {
        navigate(getFirstPermittedPage(user.id, user.tier));
      }
    }
  }, [user, authLoading, navigate, perms]);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadOffers();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      const { products: data } = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      const { offers: data } = await api.getOffers();
      setOffers(data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
      // Use default offers as fallback
      setOffers([
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
    }
  };

  const handleAddToCart = (product: Product, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setCartAnimPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setShowAddToCart(true);
    setTimeout(() => setShowAddToCart(false), 1200);

    addToCart(product);
    toast(`Added ${product.name} to cart`);
  };

  const [welcomeStep, setWelcomeStep] = useState<'button' | 'shimmer' | 'none'>('button');

  if (authLoading || !user) {
    return null;
  }

  const isPremium = user?.tier === 'premium';
  const showWelcome = isPremium && welcomeStep !== 'none';

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />
      <AddToCartAnimation show={showAddToCart} position={cartAnimPosition} />

      <main className="flex-1 overflow-auto md:pt-20 pb-16 md:pb-0">
        {isPremium
          ? <PremiumProductsView
              products={products}
              offers={offers}
              loading={loading}
              user={user}
              onAddToCart={handleAddToCart}
              navigate={navigate}
            />
          : <NormalProductsView
              products={products}
              offers={offers}
              loading={loading}
              user={user}
              onAddToCart={handleAddToCart}
              navigate={navigate}
            />
        }
      </main>

      {/* ── Premium Welcome Overlay ── */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07080b]"
            style={{
              backgroundImage: 'radial-gradient(circle at center, rgba(236,72,153,0.12) 0%, transparent 65%)',
            }}
          >
            {/* Elegant luxury dotted grid background */}
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            {welcomeStep === 'button' && (
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center gap-5 text-center px-6"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-amber-500/25 mb-1">
                  <Crown size={30} className="text-white fill-white animate-pulse" />
                </div>
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <h2 className="text-white text-lg font-bold tracking-[0.15em] font-serif uppercase">VIP Lounge Entrance</h2>
                  <p className="text-[11px] text-zinc-500 font-mono tracking-wide">
                    Exclusive collections, premium points rates & priority checkout unlocked.
                  </p>
                </div>
                <SlideTextButton
                  text="Enter VIP Store"
                  hoverText="Welcome, VIP! ✨"
                  onClick={(e) => {
                    e.preventDefault();
                    setWelcomeStep('shimmer');
                    setTimeout(() => {
                      setWelcomeStep('none');
                    }, 5000);
                  }}
                />
              </motion.div>
            )}

            {welcomeStep === 'shimmer' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl px-6 text-center"
              >
                <ShimmerText text="Welcome, VIP! ✨ Step into the Exclusive Luxury Store — where elegance meets excellence." />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PREMIUM USER EXPERIENCE
───────────────────────────────────────────── */
function PremiumProductsView({ products, offers, loading, user, onAddToCart, navigate }: any) {
  return (
    <div className="relative">
      {/* Luxury Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative overflow-hidden px-6 py-10 md:py-14"
        style={{
          background: 'linear-gradient(135deg, var(--color-background) 0%, var(--color-muted) 50%, var(--color-background) 100%)'
        }}
      >
        {/* Animated grid mesh background */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Large glow orb behind text */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] uppercase font-black tracking-[0.25em] px-3 py-1 rounded-full border"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
              ✦ VIP Exclusive Catalog
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black tracking-tight premium-title"
          >
            Luxury Collection
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm max-w-md"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {products.length} exclusive items curated for VIP members · Points never expire
          </motion.p>
        </div>
      </motion.div>

      {/* Premium Offers Strip */}
      {offers.length > 0 && (
        <div className="px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs uppercase font-black tracking-[0.2em] mb-4"
              style={{ color: 'var(--color-primary)' }}
            >
              ✦ VIP Offers
            </motion.h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {offers.map((offer: any, index: number) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.5 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="flex-shrink-0 w-64 p-4 rounded-2xl border premium-glow relative overflow-hidden cursor-default"
                  style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-primary)' }}
                >
                  <div className="absolute inset-0 premium-shimmer pointer-events-none opacity-30" />
                  <div className="text-2xl font-black premium-title mb-1">{offer.discount}</div>
                  <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-foreground)' }}>{offer.title}</div>
                  <div className="text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>{offer.description}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Products Grid */}
      <div className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                  className="h-80 rounded-2xl"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--color-muted-foreground)' }}>
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Your VIP catalog is being curated…</p>
            </div>
          ) : (
            <>
              {/* Mobile: Skiper HoverExpand accordion */}
              <div className="block md:hidden">
                <ProductHoverExpand products={products} onAddToCart={onAddToCart} />
              </div>

              {/* Desktop Premium Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any, index: number) => (
                  <PremiumProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumProductCard({ product, index, onAddToCart }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group premium-glow"
      style={{ backgroundColor: 'var(--color-card)' }}
    >
      {/* Top shimmer bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />

      {/* Product Image */}
      <div className="relative overflow-hidden h-52">
        {product.image && product.image.trim() !== '' && product.image !== 'null' ? (
          <motion.img
            src={product.image}
            alt={product.name}
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--color-muted) 0%, var(--color-card) 100%)' }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute w-32 h-32 rounded-full opacity-10"
              style={{ border: '2px solid var(--color-primary)' }}
            />
            <Sparkles className="w-14 h-14" style={{ color: 'var(--color-primary)', opacity: 0.6 }} />
          </div>
        )}

        {/* VIP badge overlay */}
        <div className="absolute top-3 left-3">
          <motion.span
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-wider"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, rgba(0,0,0,0.6))',
              color: 'var(--color-primary)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 40%, transparent)'
            }}
          >
            ✦ VIP
          </motion.span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 relative">
        {/* Subtle inner glow on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 70%)' }}
        />

        {product.category && (
          <span className="text-[10px] uppercase tracking-wider font-bold mb-2 inline-block"
            style={{ color: 'var(--color-primary)', opacity: 0.8 }}>
            {product.category}
          </span>
        )}

        <h3 className="font-bold text-lg leading-tight mb-2" style={{ color: 'var(--color-foreground)' }}>
          {product.name}
        </h3>

        <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
          {product.description}
        </p>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xl font-black premium-title">
              {product.pointsCost || Math.round(product.price)} pts
            </div>
            <div className="text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>
              ≈ {formatCurrency(product.price)}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => onAddToCart(product, e)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 70%, #fff) 100%)',
              color: 'var(--color-primary-foreground)',
              boxShadow: '0 4px 15px color-mix(in srgb, var(--color-primary) 30%, transparent)'
            }}
          >
            <Plus size={15} />
            Add to Cart
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   NORMAL USER EXPERIENCE (clean & refined)
───────────────────────────────────────────── */
function NormalProductsView({ products, offers, loading, user, onAddToCart, navigate }: any) {
  return (
    <>
      {/* Clean header */}
      <div className="backdrop-blur-lg border-b" style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>Products</h1>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{products.length} products available</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Offers Section */}
      {offers.length > 0 && (
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-medium mb-4" style={{ color: 'var(--color-foreground)' }}>Special Offers</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {offers.map((offer: any, index: number) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-72 p-4 rounded-[var(--radius-lg)] border"
                  style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-xl"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                      {offer.discount}
                    </div>
                    <h3 className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>{offer.title}</h3>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{offer.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20" style={{ color: 'var(--color-muted-foreground)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="mb-6" style={{ color: 'var(--color-muted-foreground)' }}>No products available yet</p>
              {user?.role === 'admin' && (
                <Button variant="neutral" onClick={() => navigate('/admin')}>Add Products</Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Skiper HoverExpand accordion */}
              <div className="block md:hidden">
                <ProductHoverExpand products={products} onAddToCart={onAddToCart} />
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product: any, index: number) => (
                  <ProductRevealAnimation key={product.id} delay={index * 0.05}>
                    <div
                      className="rounded-[var(--radius-lg)] border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                    >
                      {product.image && product.image.trim() !== '' && product.image !== 'null' ? (
                        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center"
                          style={{ backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }}>
                          <Sparkles className="w-16 h-16" style={{ color: 'var(--color-primary-foreground)' }} />
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <h3 className="text-lg font-medium" style={{ color: 'var(--color-card-foreground)' }}>{product.name}</h3>
                          {product.category && (
                            <span className="text-xs px-2 py-1 rounded-[var(--radius-sm)] inline-flex w-fit"
                              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
                              {product.category}
                            </span>
                          )}
                        </div>

                        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-lg font-bold flex flex-col" style={{ color: 'var(--color-foreground)' }}>
                            <span>{product.pointsCost || Math.round(product.price)} Points</span>
                            <span className="text-[11px] font-normal" style={{ color: 'var(--color-muted-foreground)' }}>
                              Valued at {formatCurrency(product.price)}
                            </span>
                          </span>
                          <Button
                            variant="primary"
                            size="small"
                            iconStart={<Plus size={16} />}
                            onClick={(e) => onAddToCart(product, e as any)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ProductRevealAnimation>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Skiper HoverExpand_002 — Responsive Product Accordion ──
function ProductHoverExpand({ products, onAddToCart }: { products: any[]; onAddToCart: (p: any, e: any) => void }) {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // Responsive collapsed height: 2.5rem; expanded: clamp between 14rem and 22rem
  const expandedH = typeof window !== 'undefined' && window.innerWidth < 380 ? '14rem' : '20rem';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="w-full px-1"
    >
      <div className="flex flex-col gap-[5px]">
        {products.map((product: any, index: number) => {
          const isActive = activeIdx === index;
          const hasImg = product.image && product.image.trim() !== '' && product.image !== 'null';
          return (
            <motion.div
              key={product.id}
              className="relative cursor-pointer overflow-hidden rounded-3xl w-full"
              animate={{ height: isActive ? expandedH : '2.75rem' }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => setActiveIdx(index)}
              onHoverStart={() => setActiveIdx(index)}
            >
              {/* Collapsed bar */}
              <AnimatePresence>
                {!isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-center justify-between px-4 z-10"
                    style={{ backgroundColor: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>
                      {product.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold ml-3 flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                      {product.pointsCost || Math.round(product.price)} pts
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Background — image or gradient */}
              {hasImg ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-muted) 0%, var(--color-card) 100%)' }}>
                  <Sparkles size={40} style={{ color: 'var(--color-primary)', opacity: 0.4 }} />
                </div>
              )}

              {/* Gradient overlay when expanded */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                  />
                )}
              </AnimatePresence>

              {/* Expanded info overlay */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2"
                  >
                    {/* Category badge */}
                    {product.category && (
                      <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded w-fit"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-primary) 25%, rgba(0,0,0,0.5))',
                          color: 'var(--color-primary)',
                        }}>
                        {product.category}
                      </span>
                    )}

                    {/* Title + price */}
                    <div className="flex items-end justify-between gap-2">
                      <h3 className="text-sm font-black text-white leading-tight flex-1">{product.name}</h3>
                      <span className="text-[11px] font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded bg-white/90 text-zinc-900">
                        {product.pointsCost || Math.round(product.price)} pts
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-white/60 leading-tight line-clamp-2">{product.description}</p>

                    {/* Add to cart CTA */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product, e); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 70%, #fff) 100%)',
                        color: 'var(--color-primary-foreground)',
                      }}
                    >
                      <Plus size={13} />
                      Add to Cart
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
// ── Slide Text Button with animated vertical text transition (Kokonut UI) ──
interface SlideTextButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  text?: string;
  hoverText?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

function SlideTextButton({
  text = "Browse Components",
  hoverText,
  onClick,
  className,
  ...props
}: SlideTextButtonProps) {
  const slideText = hoverText ?? text;

  return (
    <motion.div
      animate={{ x: 0, opacity: 1, transition: { duration: 0.3 } }}
      className="relative z-10"
      initial={{ x: 100, opacity: 0 }}
    >
      <a
        onClick={onClick}
        className={cn(
          "group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl px-10 font-bold text-base tracking-tight transition-all duration-300 md:min-w-60 cursor-pointer shadow-xl",
          "bg-white text-zinc-950 hover:bg-white/95 hover:shadow-white/5 border border-white/25",
          className
        )}
        {...props}
      >
        <span className="relative inline-block transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
          <span className="flex items-center gap-2 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
            <span className="font-semibold">{text}</span>
          </span>
          <span className="absolute top-full left-0 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="font-semibold">{slideText}</span>
          </span>
        </span>
      </a>
    </motion.div>
  );
}

// ── Shimmer Text Component (Kokonut UI) ──
function ShimmerText({
  text = "   Welcome, VIP! ✨ Step into the Exclusive Luxury Store — where elegance meets excellence. ",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden px-4 py-2"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          animate={{
            backgroundPosition: ["200% center", "-200% center"],
          }}
          className={cn(
            "bg-[length:200%_100%] bg-gradient-to-r from-amber-100 via-amber-400 to-amber-100 bg-clip-text font-bold text-xl md:text-3xl text-transparent leading-relaxed tracking-wide font-serif",
            className
          )}
          transition={{
            duration: 3,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          {text}
        </motion.h1>
      </motion.div>
    </div>
  );
}
