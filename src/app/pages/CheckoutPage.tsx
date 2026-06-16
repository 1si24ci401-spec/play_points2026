import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, InputField, RadioGroup } from '@figma/astraui';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { AppNav } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { CheckoutSuccessAnimation } from '../components/CheckoutSuccessAnimation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, accessToken } = useAuth();
  const { items, totalPoints, clearCart } = useCart();
  const [discordUsername, setDiscordUsername] = useState('');
  const [codGameId, setCodGameId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPremiumConfetti, setShowPremiumConfetti] = useState(false);
  const [pointPrice, setPointPrice] = useState(0.10);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.getPointsSettings();
        if (res?.settings?.pointPrice) {
          setPointPrice(res.settings.pointPrice);
        }
      } catch (e) {
        console.error('Failed to load points settings:', e);
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !authLoading) {
      navigate('/cart');
    }
  }, [items.length, authLoading, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await api.validateCoupon(accessToken!, couponCode);
      if (result.valid) {
        setCoupon(result.coupon);
        
        const isPremium = user?.tier === 'premium';
        if (isPremium) {
          setShowPremiumConfetti(true);
          setTimeout(() => setShowPremiumConfetti(false), 4500);
          
          if (result.coupon.discountType === 'point_value') {
            toast(`✨ Luxury Privilege: Coupon applied! -${result.coupon.pointValueDiscount} per point worth. ✨`);
          } else {
            toast(`✨ Luxury Privilege: Coupon applied! ${result.coupon.discountPercent}% discount activated. ✨`);
          }
        } else {
          if (result.coupon.discountType === 'point_value') {
            toast(`Coupon applied! -${result.coupon.pointValueDiscount} per point`);
          } else {
            toast(`Coupon applied! ${result.coupon.discountPercent}% off`);
          }
        }
      } else {
        toast(result.error || 'Invalid coupon code');
        setCoupon(null);
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast('Failed to validate coupon');
      setCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode('');
  };

  let finalRupeesTotal = totalPoints * pointPrice;
  let pointsToDeduct = totalPoints;
  let couponLabel = '';

  if (coupon) {
    if (coupon.discountType === 'point_value' && typeof coupon.pointValueDiscount === 'number') {
      const netPointValue = Math.max(0, pointPrice - coupon.pointValueDiscount);
      finalRupeesTotal = totalPoints * netPointValue;
      pointsToDeduct = pointPrice > 0 ? Math.round(finalRupeesTotal / pointPrice) : 0;
      couponLabel = `-Rs ${coupon.pointValueDiscount.toFixed(2)} per point worth`;
    } else if (coupon.discountPercent) {
      pointsToDeduct = Math.round(totalPoints * (100 - coupon.discountPercent) / 100);
      finalRupeesTotal = pointsToDeduct * pointPrice;
      couponLabel = `${coupon.discountPercent}% off`;
    }
  }

  const hasEnoughPoints = (user.points || 0) >= pointsToDeduct;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discordUsername.trim()) {
      toast('Please enter your Discord username');
      return;
    }

    const cleanUid = codGameId.replace(/\s+/g, '');
    if (cleanUid.length < 19 || !/^\d+$/.test(cleanUid)) {
      toast("The Call of Duty Mobile (COD Mobile) UID (User ID) is a 19-digit number.");
      return;
    }

    if (!hasEnoughPoints) {
      toast('Insufficient points balance');
      return;
    }

    setSubmitting(true);
    try {
      await api.createOrder(accessToken!, {
        items,
        total: totalPoints * pointPrice,
        discountedTotal: finalRupeesTotal,
        couponCode: coupon?.code || null,
        discordUsername,
        codGameId: cleanUid,
        paymentType: 'full',
        partialAmount: 0,
      });

      // Update local points state
      if (user) {
        user.points = (user.points || 0) - pointsToDeduct;
      }

      clearCart();
      setShowSuccess(true);
      setTimeout(() => {
        toast('Order placed successfully! Paid in Points.');
        navigate('/orders');
      }, 2000);
    } catch (error: any) {
      console.error('Order creation error:', error);
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        toast('⚠️ Network error — please check your connection and try again.');
      } else {
        toast(error?.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return null;
  }

  const finalAmount = pointsToDeduct;

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />
      <CheckoutSuccessAnimation show={showSuccess} />

      <main className="flex-1 overflow-auto md:pt-20 pb-16 md:pb-0">
        {/* Header */}
        <div className="backdrop-blur-lg border-b" style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)'
        }}>
          <div className="max-w-4xl mx-auto px-6 py-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                Checkout
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Complete your order
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Order Summary */}
            <div className="rounded-[var(--radius-lg)] border p-6 flex flex-col gap-4" style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}>
              <h2 style={{ color: 'var(--color-card-foreground)' }}>Order Summary</h2>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span style={{ color: 'var(--color-card-foreground)' }}>{item.name}</span>
                      <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        {(item.pointsCost || Math.round(item.price))} Points × {item.quantity}
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                      {(item.pointsCost || Math.round(item.price)) * item.quantity} Points
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Code */}
            <div className="rounded-[var(--radius-lg)] border p-6 flex flex-col gap-4" style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}>
              <h2 style={{ color: 'var(--color-card-foreground)' }}>Discount Coupon</h2>

              {!coupon ? (
                <div className="flex gap-3">
                  <InputField
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={setCouponCode}
                    className="flex-1"
                  />
                  <Button
                    variant="neutral"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                  >
                    {validatingCoupon ? 'Validating...' : 'Apply'}
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-[var(--radius-md)] flex justify-between items-center" style={{ backgroundColor: 'var(--color-muted)' }}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>{coupon.code}</span>
                    <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {couponLabel} discount applied
                    </span>
                  </div>
                  <Button variant="subtle" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Delivery Information */}
            <div className="rounded-[var(--radius-lg)] border p-6 flex flex-col gap-4" style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}>
              <h2 style={{ color: 'var(--color-card-foreground)' }}>Delivery Information</h2>
              <InputField
                label="Discord Username"
                description="Your products will be delivered via Discord"
                placeholder="username#1234"
                value={discordUsername}
                onChange={setDiscordUsername}
                required
              />
              <InputField
                label="COD Mobile UID"
                description="The Call of Duty Mobile (COD Mobile) UID (User ID) is a 19-digit number."
                placeholder="Enter your 19-digit COD Mobile UID"
                value={codGameId}
                onChange={setCodGameId}
                required
              />
            </div>

            {/* Total */}
            <div className="rounded-[var(--radius-lg)] border p-6 flex flex-col gap-6" style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Subtotal</span>
                  <div className="flex flex-col items-end">
                    <span style={{ color: 'var(--color-card-foreground)' }}>{totalPoints} Points</span>
                    <span className="text-xs text-muted-foreground">({formatCurrency(totalPoints * pointPrice)})</span>
                  </div>
                </div>
                {coupon && (
                  <div className="flex justify-between items-center" style={{ color: 'var(--color-primary)' }}>
                    <span>Discount</span>
                    <span>-{formatCurrency(totalPoints * pointPrice - finalRupeesTotal)} ({couponLabel})</span>
                  </div>
                )}
                <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg" style={{ color: 'var(--color-card-foreground)' }}>
                    Total Cost (Rs)
                  </span>
                  <span className="font-medium text-2xl text-emerald-500">
                    {formatCurrency(finalRupeesTotal)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-dashed" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Points to Deduct</span>
                  <span className="font-bold text-indigo-400">
                    {pointsToDeduct} Points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Your Points Balance</span>
                  <span className={`font-semibold text-sm ${hasEnoughPoints ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {user.points || 0} Points
                  </span>
                </div>
              </div>

              {!hasEnoughPoints && (
                <div className="rounded-[var(--radius-md)] p-4 border border-rose-500/20 bg-rose-500/5">
                  <p className="text-sm text-rose-400 font-medium">
                    ⚠️ Insufficient Points balance. You need {pointsToDeduct} points to complete this purchase but only have {user.points || 0} points.
                  </p>
                </div>
              )}

              <div className="rounded-[var(--radius-md)] p-4" style={{ backgroundColor: 'var(--color-muted)' }}>
                <p className="text-sm" style={{ color: 'var(--color-card-foreground)' }}>
                  ⏳ Your order is transacted instantly using points. The delivery will be processed by an admin.
                </p>
              </div>

              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting || !hasEnoughPoints} 
                className="w-full"
              >
                {submitting ? 'Placing Order...' : `Place Order - ${formatCurrency(finalRupeesTotal)} (${pointsToDeduct} Points)`}
              </Button>
            </div>
          </form>
        </div>
      </main>
      {showPremiumConfetti && <PremiumConfetti />}
    </div>
  );
}

function PremiumConfetti() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string; rotate: number }>>([]);

  useEffect(() => {
    const colors = [
      '#d4af37', // Gold
      '#f3e5ab', // Champagne
      '#ffdf7a', // Metallic Yellow
      '#b76e79', // Rose Gold
      '#e5e4e2'  // Platinum
    ];
    const generated = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // Left percentage
      y: -10 - Math.random() * 20, // Start height percentage
      size: 6 + Math.random() * 10, // px
      delay: Math.random() * 2, // seconds
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            opacity: 0.8,
            animation: `fall 4.5s linear infinite`,
            animationDelay: `${p.delay}s`,
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fall {
          0% {
            top: -10%;
            transform: translateY(0) rotate(0deg) translateX(0);
          }
          50% {
            transform: translateY(45vh) rotate(180deg) translateX(40px);
          }
          100% {
            top: 110%;
            transform: translateY(90vh) rotate(360deg) translateX(-40px);
          }
        }
      `}} />
    </div>
  );
}
