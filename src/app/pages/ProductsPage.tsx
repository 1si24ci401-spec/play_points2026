import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { AppNav } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { AddToCartAnimation } from '../components/AddToCartAnimation';
import { ProductRevealAnimation } from '../components/ProductRevealAnimation';
import { ProductCarousel } from '../components/ProductCarousel';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    loadProducts();
    loadOffers();
  }, []);

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

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />
      <AddToCartAnimation show={showAddToCart} position={cartAnimPosition} />

      <main className="flex-1 overflow-auto">
        {/* Compact Header */}
        <div className="sticky top-0 z-20 backdrop-blur-lg border-b" style={{
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
                <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Products
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  {products.length} products available
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Offers Section */}
        {offers.length > 0 && (
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-xl font-medium mb-4" style={{ color: 'var(--color-foreground)' }}>
                Special Offers
              </h2>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {offers.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-72 p-4 rounded-[var(--radius-lg)] border"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-xl"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-foreground)'
                        }}
                      >
                        {offer.discount}
                      </div>
                      <h3 className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                        {offer.title}
                      </h3>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {offer.description}
                    </p>
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
                <p className="mb-6" style={{ color: 'var(--color-muted-foreground)' }}>
                  No products available yet
                </p>
                {user.role === 'admin' && (
                  <Button variant="neutral" onClick={() => navigate('/admin')}>
                    Add Products
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Carousel */}
                <div className="block md:hidden">
                  <ProductCarousel products={products} onAddToCart={handleAddToCart} />
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <ProductRevealAnimation key={product.id} delay={index * 0.05}>
                    <div
                      className="rounded-[var(--radius-lg)] border overflow-hidden"
                      style={{
                        backgroundColor: 'var(--color-card)',
                        borderColor: 'var(--color-border)'
                      }}
                    >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="w-full h-48 bg-gradient-to-br flex items-center justify-center"
                        style={{
                          backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                        }}
                      >
                        <Sparkles className="w-16 h-16" style={{ color: 'var(--color-primary-foreground)' }} />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex flex-col gap-2 mb-3">
                        <h3 className="text-lg font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                          {product.name}
                        </h3>
                        {product.category && (
                          <span
                            className="text-xs px-2 py-1 rounded-[var(--radius-sm)] inline-flex w-fit"
                            style={{
                              backgroundColor: 'var(--color-muted)',
                              color: 'var(--color-muted-foreground)'
                            }}
                          >
                            {product.category}
                          </span>
                        )}
                      </div>

                      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                          {formatCurrency(product.price)}
                        </span>
                        <Button
                          variant="primary"
                          size="small"
                          iconStart={<Plus size={16} />}
                          onClick={(e) => handleAddToCart(product, e as any)}
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
      </main>
    </div>
  );
}
