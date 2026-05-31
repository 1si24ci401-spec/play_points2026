import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, IconButton } from '@figma/astraui';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { AppNav } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../../utils/currency';

export function CartPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, removeFromCart, updateQuantity, total } = useCart();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
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
          <div className="max-w-5xl mx-auto px-6 py-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                Cart
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="text-lg mb-2" style={{ color: 'var(--color-foreground)' }}>
                Your cart is empty
              </p>
              <p className="mb-6" style={{ color: 'var(--color-muted-foreground)' }}>
                Add items to get started
              </p>
              <Button variant="primary" onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Cart Items */}
              <div className="flex-1 space-y-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-[var(--radius-lg)] border p-4"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Product Image Placeholder */}
                      <div
                        className="w-20 h-20 rounded-[var(--radius-md)] flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                        }}
                      >
                        <ShoppingCart className="w-8 h-8" style={{ color: 'var(--color-primary-foreground)' }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--color-card-foreground)' }}>
                          {item.name}
                        </h3>
                        <p className="text-sm mb-2 line-clamp-1" style={{ color: 'var(--color-muted-foreground)' }}>
                          {item.description}
                        </p>
                        <p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <IconButton
                          icon={<Trash2 size={16} />}
                          variant="subtle"
                          size="small"
                          onClick={() => removeFromCart(item.productId)}
                        />

                        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border px-2 py-1" style={{
                          borderColor: 'var(--color-border)'
                        }}>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center"
                            style={{ color: 'var(--color-foreground)' }}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-medium w-8 text-center" style={{ color: 'var(--color-foreground)' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center"
                            style={{ color: 'var(--color-foreground)' }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:w-96">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky top-24 rounded-[var(--radius-lg)] border p-6"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--color-card-foreground)' }}>
                    Order Summary
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-muted-foreground)' }}>Subtotal</span>
                      <span style={{ color: 'var(--color-foreground)' }}>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-muted-foreground)' }}>Delivery</span>
                      <span style={{ color: 'var(--color-primary)' }}>Free</span>
                    </div>
                    <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-medium" style={{ color: 'var(--color-foreground)' }}>
                        Total
                      </span>
                      <span className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/checkout')}
                  >
                    Checkout
                  </Button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
