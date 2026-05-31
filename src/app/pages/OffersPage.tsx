import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { Gift, Star, Zap, Tag } from 'lucide-react';
import { AppNav } from '../components/AppNav';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export function OffersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="size-full flex bg-brand-tertiary">
      <AppNav />

      <main className="flex-1 overflow-auto p-2xl">
        <div className="flex flex-col gap-xl max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-xs"
          >
            <h1 className="text-text-primary">Seasonal Welcome Offers</h1>
            <p className="text-text-secondary">
              Exclusive deals and discounts just for you!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-corner-lg p-xl flex flex-col gap-lg text-on-brand"
            >
              <div className="flex items-center gap-md">
                <div className="bg-surface-bg text-brand-primary rounded-corner-full p-md">
                  <Gift size={32} />
                </div>
                <h2 className="text-on-brand">Welcome Bonus</h2>
              </div>

              <div className="flex flex-col gap-xs">
                <p className="text-3xl font-medium">20% OFF</p>
                <p className="text-on-brand opacity-90">
                  Your first purchase with code <span className="font-mono font-medium">WELCOME20</span>
                </p>
              </div>

              <Button variant="neutral" onClick={() => navigate('/products')}>
                Start Shopping
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg"
            >
              <div className="flex items-center gap-md">
                <div className="bg-brand-secondary text-brand-primary rounded-corner-full p-md">
                  <Star size={32} />
                </div>
                <h2 className="text-text-primary">Premium Bundle</h2>
              </div>

              <div className="flex flex-col gap-xs">
                <p className="text-text-primary">
                  Get 3 products and save 30% on the total price!
                </p>
                <p className="text-text-secondary text-sm">
                  Mix and match any digital products
                </p>
              </div>

              <Button variant="primary" onClick={() => navigate('/products')}>
                View Products
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg"
            >
              <div className="flex items-center gap-md">
                <div className="bg-brand-secondary text-brand-primary rounded-corner-full p-md">
                  <Zap size={32} />
                </div>
                <h2 className="text-text-primary">Flash Sale</h2>
              </div>

              <div className="flex flex-col gap-xs">
                <p className="text-text-primary">
                  Limited time offer - 15% off on all memberships!
                </p>
                <p className="text-text-secondary text-sm">
                  Use code <span className="font-mono text-brand-primary">FLASH15</span>
                </p>
              </div>

              <Button variant="primary" onClick={() => navigate('/checkout')}>
                Shop Now
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg"
            >
              <div className="flex items-center gap-md">
                <div className="bg-brand-secondary text-brand-primary rounded-corner-full p-md">
                  <Tag size={32} />
                </div>
                <h2 className="text-text-primary">Loyalty Rewards</h2>
              </div>

              <div className="flex flex-col gap-xs">
                <p className="text-text-primary">
                  Earn points with every purchase and unlock exclusive deals!
                </p>
                <p className="text-text-secondary text-sm">
                  Your current points: <span className="text-brand-primary font-medium">0</span>
                </p>
              </div>

              <Button variant="neutral" onClick={() => navigate('/orders')}>
                View History
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg"
          >
            <h2 className="text-text-primary">How to Use Your Offers</h2>
            <ol className="flex flex-col gap-md text-text-secondary list-decimal list-inside">
              <li>Browse our digital products catalog</li>
              <li>Add your favorite items to the cart</li>
              <li>At checkout, enter your coupon code</li>
              <li>See your discount applied instantly!</li>
              <li>Complete your order and enjoy your savings</li>
            </ol>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
