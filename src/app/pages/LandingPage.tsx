import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { ShoppingBag, Shield, Zap, Star, Users, TrendingUp } from 'lucide-react';
import { motion, useAnimationControls } from 'motion/react';
import { FloatingParticles } from '../components/FloatingParticles';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const logoControls = useAnimationControls();

  useEffect(() => {
    if (!loading && user) {
      navigate('/products');
    }
  }, [user, loading, navigate]);

  // Animate random user count between 30-40
  useEffect(() => {
    const targetCount = Math.floor(Math.random() * 11) + 30; // 30-40
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setUserCount(current);
      if (current >= targetCount) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Continuous logo animation
  useEffect(() => {
    let isMounted = true;

    const animateLogo = async () => {
      // Wait for component to mount
      await new Promise(resolve => setTimeout(resolve, 100));

      while (isMounted) {
        try {
          await logoControls.start({
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
            transition: { duration: 2, ease: "easeInOut" }
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          // Animation was interrupted, that's ok
          break;
        }
      }
    };

    animateLogo();

    return () => {
      isMounted = false;
    };
  }, [logoControls]);

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-foreground)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-auto relative" style={{ backgroundColor: 'var(--color-background)' }}>
      <FloatingParticles />
      <div className="flex flex-col min-h-full relative z-10">
        {/* Hero Section with Animated Google Play Points Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex flex-col items-center justify-center p-2xl gap-2xl relative overflow-hidden"
        >
          {/* Background animated circles */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.15, 0.1, 0.15],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          />

          <div className="flex flex-col items-center gap-xl max-w-4xl text-center relative z-10">
            {/* Animated Google Play Points Logo */}
            <motion.div
              animate={logoControls}
              className="relative"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  duration: 1
                }}
                className="relative"
              >
                {/* Outer glow ring */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full blur-xl opacity-50"
                  style={{
                    width: '180px',
                    height: '180px',
                    left: '-15px',
                    top: '-15px',
                    backgroundColor: 'var(--color-primary)'
                  }}
                />

                {/* Main logo circle */}
                <div
                  className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                  }}
                >
                  {/* Inner star pattern */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          transform: `rotate(${i * 45}deg) translateY(-50px)`,
                          backgroundColor: 'var(--color-primary-foreground)'
                        }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Center icon */}
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Star size={48} style={{ color: 'var(--color-primary-foreground)' }} className="fill-current" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Title and description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-5xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                Google Play Points Store
              </h1>
              <p className="text-xl" style={{ color: 'var(--color-muted-foreground)' }}>
                Redeem your points for exclusive digital products and rewards
              </p>
            </motion.div>

            {/* Active users counter */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex items-center gap-4 rounded-full px-6 py-3 shadow-lg"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="rounded-full p-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Users size={20} style={{ color: 'var(--color-primary-foreground)' }} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Active Users</span>
                <motion.span
                  key={userCount}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-medium"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {userCount}
                </motion.span>
              </div>
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
              </motion.div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="primary"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/login')}
              >
                Start Redeeming Points
              </Button>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-xl max-w-5xl w-full relative z-10"
          >
            {[
              {
                icon: Shield,
                title: "Secure Transactions",
                description: "Your points and data protected with enterprise-grade security",
                delay: 0
              },
              {
                icon: Zap,
                title: "Instant Delivery",
                description: "Get your digital products delivered instantly via Discord",
                delay: 0.1
              },
              {
                icon: ShoppingBag,
                title: "Premium Products",
                description: "Curated selection of high-quality digital products and services",
                delay: 0.2
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + feature.delay, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="rounded-[var(--radius-lg)] p-6 flex flex-col gap-4 items-center text-center shadow-lg"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-center w-16 h-16 rounded-full"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                >
                  <feature.icon size={32} style={{ color: 'var(--color-primary)' }} />
                </motion.div>
                <div className="flex flex-col gap-2">
                  <h3 style={{ color: 'var(--color-foreground)' }}>{feature.title}</h3>
                  <p style={{ color: 'var(--color-muted-foreground)' }}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="p-6 text-center"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <p>Google Play Points Store © 2026. Redeem your points today!</p>
        </motion.div>
      </div>
    </div>
  );
}
