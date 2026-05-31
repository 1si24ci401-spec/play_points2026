import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge, Button } from '@figma/astraui';
import { X, Edit3, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AppNav } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { OrderCancelledAnimation } from '../components/OrderCancelledAnimation';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';

interface Order {
  id: string;
  items: any[];
  total: number;
  discountedTotal: number;
  couponCode?: string;
  discordUsername: string;
  status: string;
  paymentType: 'full' | 'partial';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  partialAmount?: number;
  remainingAmount?: number;
  createdAt: string;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [showCancelAnimation, setShowCancelAnimation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (accessToken) {
      loadOrders();
    }
  }, [accessToken]);

  const loadOrders = async () => {
    try {
      const { orders: data } = await api.getOrders(accessToken!);
      setOrders(data.sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancellingOrder(orderId);
    try {
      await api.cancelOrder(accessToken!, orderId);
      setShowCancelAnimation(true);
      setTimeout(() => {
        setShowCancelAnimation(false);
        toast('Order cancelled successfully');
        loadOrders();
      }, 1500);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast('Failed to cancel order');
    } finally {
      setTimeout(() => setCancellingOrder(null), 1500);
    }
  };

  const canCancelOrder = (order: Order) => {
    // Users can only cancel orders that are still pending
    // Once admin starts processing, they cannot cancel
    return order.status === 'pending';
  };

  const canEditOrder = (order: Order) => {
    return order.status === 'pending' && order.paymentStatus === 'pending';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (authLoading || !user) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="size-full flex" style={{ backgroundColor: 'var(--color-background)' }}>
      <ScrollProgress />
      <AppNav />
      <OrderCancelledAnimation show={showCancelAnimation} />

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
              <h1 className="text-2xl font-medium" style={{ color: 'var(--color-foreground)' }}>
                My Orders
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Track and manage your orders
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {loading ? (
            <div className="text-center py-20" style={{ color: 'var(--color-muted-foreground)' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
              <p className="text-lg mb-2" style={{ color: 'var(--color-foreground)' }}>
                No orders yet
              </p>
              <p className="mb-6" style={{ color: 'var(--color-muted-foreground)' }}>
                Start shopping to see your orders here
              </p>
              <Button variant="primary" onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-[var(--radius-lg)] border overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  {/* Order Header */}
                  <div className="p-4 border-b flex justify-between items-center" style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-muted)'
                  }}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(order.status)}
                        <span className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                          Order #{order.id.split(':')[1].slice(0, 8)}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        variant={getStatusBadgeVariant(order.status) as any}
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Payment Status Message */}
                    {order.paymentStatus === 'pending' && (
                      <div className="mb-4 p-3 rounded-[var(--radius-md)]" style={{
                        backgroundColor: 'var(--color-muted)',
                        borderLeft: '4px solid var(--color-primary)'
                      }}>
                        <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                          ⏳ Payment pending approval
                        </p>
                      </div>
                    )}

                    {order.paymentStatus === 'approved' && (
                      <div className="mb-4 p-3 rounded-[var(--radius-md)]" style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderLeft: '4px solid rgb(34, 197, 94)'
                      }}>
                        <p className="text-sm" style={{ color: 'rgb(34, 197, 94)' }}>
                          ✓ Payment approved
                        </p>
                      </div>
                    )}

                    {order.paymentStatus === 'rejected' && (
                      <div className="mb-4 p-3 rounded-[var(--radius-md)]" style={{
                        backgroundColor: 'var(--color-destructive)',
                        borderLeft: '4px solid var(--color-destructive)'
                      }}>
                        <p className="text-sm" style={{ color: 'var(--color-destructive-foreground)' }}>
                          ✗ Payment rejected
                        </p>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: 'var(--color-card-foreground)' }}>
                              {item.name}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Payment Details */}
                    <div className="pt-4 border-t space-y-2 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-muted-foreground)' }}>Subtotal</span>
                        <span style={{ color: 'var(--color-foreground)' }}>{formatCurrency(order.total)}</span>
                      </div>
                      {order.couponCode && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-muted-foreground)' }}>
                            Discount ({order.couponCode})
                          </span>
                          <span style={{ color: 'var(--color-primary)' }}>
                            -{formatCurrency(order.total - order.discountedTotal)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-medium" style={{ color: 'var(--color-foreground)' }}>
                          Total
                        </span>
                        <span className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                          {formatCurrency(order.discountedTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {canEditOrder(order) && (
                        <Button
                          variant="neutral"
                          size="small"
                          iconStart={<Edit3 size={16} />}
                          onClick={() => {
                            toast('Redirecting to cart to edit order...');
                            navigate('/cart');
                          }}
                        >
                          Edit Order
                        </Button>
                      )}
                      {canCancelOrder(order) && (
                        <Button
                          variant="neutral"
                          size="small"
                          iconStart={<X size={16} />}
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrder === order.id}
                        >
                          {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => {
                            toast('Order details downloaded');
                          }}
                        >
                          Download Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
