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
  const { items, total, clearCart } = useCart();
  const [discordUsername, setDiscordUsername] = useState('');
  const [codGameId, setCodGameId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

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
        toast(`Coupon applied! ${result.coupon.discountPercent}% off`);
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

  const discountAmount = coupon ? (total * coupon.discountPercent) / 100 : 0;
  const discountedTotal = total - discountAmount;

  // Calculate min and max for partial payment (25% to 75%)
  const minPartialAmount = Math.ceil(discountedTotal * 0.25);
  const maxPartialAmount = Math.floor(discountedTotal * 0.75);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discordUsername.trim()) {
      toast('Please enter your Discord username');
      return;
    }

    if (!codGameId.trim()) {
      toast('Please enter your COD GAME ID');
      return;
    }

    if (paymentType === 'partial') {
      const partial = parseFloat(partialAmount);
      if (!partial || partial < minPartialAmount || partial > maxPartialAmount) {
        toast(`Partial payment must be between ${formatCurrency(minPartialAmount)} and ${formatCurrency(maxPartialAmount)}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.createOrder(accessToken!, {
        items,
        total,
        discountedTotal,
        couponCode: coupon?.code || null,
        discordUsername,
        codGameId,
        paymentType,
        partialAmount: paymentType === 'partial' ? parseFloat(partialAmount) : 0,
      });

      clearCart();
      setShowSuccess(true);
      setTimeout(() => {
        toast('Order placed successfully! Waiting for admin approval.');
        navigate('/orders');
      }, 2000);
    } catch (error) {
      console.error('Order creation error:', error);
      toast('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return null;
  }

  const finalAmount = paymentType === 'partial' && partialAmount
    ? parseFloat(partialAmount)
    : discountedTotal;

  const remainingAmount = paymentType === 'partial' && partialAmount
    ? discountedTotal - parseFloat(partialAmount)
    : 0;

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />
      <CheckoutSuccessAnimation show={showSuccess} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-lg border-b" style={{
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
                        {formatCurrency(item.price)} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                      {formatCurrency(item.price * item.quantity)}
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
                      {coupon.discountPercent}% discount applied
                    </span>
                  </div>
                  <Button variant="subtle" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div className="rounded-[var(--radius-lg)] border p-6 flex flex-col gap-4" style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}>
              <h2 style={{ color: 'var(--color-card-foreground)' }}>Payment Type</h2>
              <RadioGroup
                options={[
                  {
                    value: 'full',
                    label: 'Full Payment',
                    description: `Pay complete amount: ${formatCurrency(discountedTotal)}`
                  },
                  {
                    value: 'partial',
                    label: 'Partial Payment',
                    description: `Pay a portion now, rest after admin approval (25%-75%)`
                  }
                ]}
                value={paymentType}
                onChange={setPaymentType}
              />

              {paymentType === 'partial' && (
                <div className="mt-4">
                  <InputField
                    label="Partial Payment Amount"
                    type="number"
                    min={minPartialAmount}
                    max={maxPartialAmount}
                    step="0.01"
                    value={partialAmount}
                    onChange={setPartialAmount}
                    placeholder={`Between ${formatCurrency(minPartialAmount)} and ${formatCurrency(maxPartialAmount)}`}
                    prefix="₹"
                    description={`Minimum: ${formatCurrency(minPartialAmount)} | Maximum: ${formatCurrency(maxPartialAmount)}`}
                    required
                  />
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
                label="COD GAME ID"
                description="Your Call of Duty game identifier"
                placeholder="Enter your COD GAME ID"
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
                  <span style={{ color: 'var(--color-card-foreground)' }}>{formatCurrency(total)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between items-center" style={{ color: 'var(--color-primary)' }}>
                    <span>Discount ({coupon.discountPercent}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg" style={{ color: 'var(--color-card-foreground)' }}>
                    {paymentType === 'partial' ? 'Paying Now' : 'Total'}
                  </span>
                  <span className="font-medium text-2xl" style={{ color: 'var(--color-card-foreground)' }}>
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
                {paymentType === 'partial' && partialAmount && (
                  <div className="flex justify-between items-center" style={{ color: 'var(--color-muted-foreground)' }}>
                    <span>Remaining Amount</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                )}
              </div>

              <div className="rounded-[var(--radius-md)] p-4" style={{ backgroundColor: 'var(--color-muted)' }}>
                <p className="text-sm" style={{ color: 'var(--color-card-foreground)' }}>
                  ⏳ Your order will be reviewed by an admin. You'll be notified once payment is approved and order is processed.
                </p>
              </div>

              <Button variant="primary" type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Placing Order...' : `Place Order - ${formatCurrency(finalAmount)}`}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
