import { useState, useEffect } from 'react';
import { Button, Badge } from '@figma/astraui';
import { Mail, MessageSquare, ShieldAlert, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { SendUserPopupNotificationModal } from './SendUserPopupNotificationModal';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  createdAt: string;
}

interface OrderData {
  id: string;
  userId: string;
  total: number;
  discountedTotal: number;
  paymentType: 'full' | 'partial';
  paymentStatus: string;
  status: string;
  partialAmount?: number;
  remainingAmount?: number;
}

interface AggregatedUser {
  profile: UserData;
  orderCount: number;
  totalSpent: number;
  pendingAmount: number;
}

export function UsersTab({ accessToken }: { accessToken: string }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AggregatedUser | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, ordersResponse] = await Promise.all([
        api.getUsers(accessToken),
        api.getOrders(accessToken)
      ]);
      setUsers(usersResponse.users || []);
      setOrders(ordersResponse.orders || []);
    } catch (error) {
      console.error('Failed to load users tab data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate user statistics
  const getAggregatedUsers = (): AggregatedUser[] => {
    return users.map(user => {
      // Find orders for this user
      const userOrders = orders.filter(o => o.userId === user.id);

      // Exclude cancelled and rejected orders from calculations
      const activeOrders = userOrders.filter(o => o.status !== 'cancelled' && o.status !== 'rejected');

      const totalSpent = activeOrders.reduce((sum, o) => sum + o.discountedTotal, 0);

      // Pending amount is the sum of remainingAmount on partial payment orders
      // or if paymentStatus is pending, the full discountedTotal could be considered pending?
      // Actually, if paymentType is full and paymentStatus is pending, the whole amount is pending.
      // If paymentType is partial and paymentStatus is pending, the full amount is pending.
      // If paymentType is partial and paymentStatus is approved, the remainingAmount is pending.
      // Let's implement this robust pending calculation:
      const pendingAmount = activeOrders.reduce((sum, o) => {
        if (o.status === 'completed' || o.status === 'delivered') {
          // Completed orders generally have no pending amount, but if partial, maybe they do?
          // Usually completed means fully paid. So only check non-completed, non-delivered, active orders,
          // OR check the remainingAmount directly.
          return sum; 
        }

        if (o.paymentStatus === 'approved') {
          return sum + (o.remainingAmount || 0);
        } else {
          // If payment is pending/rejected, the entire discountedTotal is pending
          return sum + o.discountedTotal;
        }
      }, 0);

      return {
        profile: user,
        orderCount: userOrders.length,
        totalSpent,
        pendingAmount
      };
    }).filter(user => user.orderCount > 0); // Only users who placed orders, as requested
  };

  const aggregatedList = getAggregatedUsers();

  if (loading) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Loading registered users list...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium" style={{ color: 'var(--color-foreground)' }}>
            Registered Customers
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            List of users who have placed orders, showing lifetime spent and pending balances.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Total Customers:</span>
            <span style={{ color: 'var(--color-primary)' }}>{aggregatedList.length}</span>
          </div>
        </div>
      </div>

      <div className="border rounded-[var(--radius-lg)] overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Discord username</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Total Spent</th>
                <th className="px-6 py-4 text-right">Pending Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {aggregatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
                    No users have placed orders yet.
                  </td>
                </tr>
              ) : (
                aggregatedList.map((user, idx) => (
                  <tr
                    key={user.profile.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {user.profile.fullName}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {user.profile.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-foreground)' }}>
                      @{user.profile.username || 'n/a'}
                    </td>
                    <td className="px-6 py-4 text-center" style={{ color: 'var(--color-foreground)' }}>
                      <Badge label={user.orderCount.toString()} variant="default" />
                    </td>
                    <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.pendingAmount > 0 ? (
                        <span className="font-semibold" style={{ color: 'var(--color-destructive)' }}>
                          {formatCurrency(user.pendingAmount)}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                          Fully Paid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <Button
                          variant={user.pendingAmount > 0 ? "primary" : "neutral"}
                          size="small"
                          iconStart={<MessageSquare size={14} />}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowNotificationModal(true);
                          }}
                        >
                          Send Notification
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <SendUserPopupNotificationModal
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            setSelectedUser(null);
          }}
          accessToken={accessToken}
          userId={selectedUser.profile.id}
          userEmail={selectedUser.profile.email}
        />
      )}
    </div>
  );
}
