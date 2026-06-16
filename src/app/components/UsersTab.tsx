import { useState, useEffect } from 'react';
import { Button, Badge } from '@figma/astraui';
import { Mail, MessageSquare, ShieldAlert, DollarSign, Star, Crown, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { toast } from 'sonner';
import { SendUserPopupNotificationModal } from './SendUserPopupNotificationModal';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  points?: number;
  tier?: 'normal' | 'premium';
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
  const [editingPointsUserId, setEditingPointsUserId] = useState<string | null>(null);
  const [pointsValue, setPointsValue] = useState<number>(0);
  const [savingPoints, setSavingPoints] = useState(false);
  const [updatingTierId, setUpdatingTierId] = useState<string | null>(null);

  const handleUpdateTier = async (userId: string, tier: 'normal' | 'premium') => {
    setUpdatingTierId(userId);
    try {
      await api.updateUserTier(accessToken, userId, tier);
      toast(`User tier updated to ${tier === 'premium' ? 'Premium ✨' : 'Normal'} successfully!`);
      loadData();
    } catch (e: any) {
      console.error('Failed to update user tier:', e);
      toast(e.message || 'Failed to update user tier');
    } finally {
      setUpdatingTierId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const handleSavePoints = async (userId: string) => {
    setSavingPoints(true);
    try {
      await api.updateUserPoints(accessToken, userId, pointsValue);
      toast('Points balance updated successfully!');
      setEditingPointsUserId(null);
      loadData();
    } catch (e: any) {
      console.error('Failed to update points:', e);
      toast(e.message || 'Failed to update points');
    } finally {
      setSavingPoints(false);
    }
  };

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
    }).sort((a, b) => b.orderCount - a.orderCount);
  };

  const aggregatedList = getAggregatedUsers();

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 font-mono text-sm">
        Loading registered users list...
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white font-serif">
            Registered Customers
          </h2>
          <p className="text-xs text-zinc-400 font-sans">
            List of registered users, showing order statistics, points, and account balances.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono">
            <span className="text-zinc-400">Total:</span>
            <span className="text-amber-500 font-bold">{aggregatedList.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs font-mono">
            <Crown size={11} className="text-amber-400" />
            <span className="text-amber-400">Premium:</span>
            <span className="text-amber-300 font-bold">{aggregatedList.filter(u => u.profile.tier === 'premium').length}</span>
          </div>
        </div>
      </div>

      {/* Premium Users quick-view strip */}
      {aggregatedList.some(u => u.profile.tier === 'premium') && (
        <div className="border border-amber-500/20 rounded-2xl bg-amber-500/[0.03] p-4 flex flex-wrap gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold w-full mb-1 flex items-center gap-1.5">
            <Crown size={11} className="fill-current" />
            VIP PREMIUM MEMBERS
          </span>
          {aggregatedList.filter(u => u.profile.tier === 'premium').map(u => (
            <div key={u.profile.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-mono">
              <Star size={9} className="fill-current text-amber-400" />
              {u.profile.fullName || u.profile.email?.split('@')[0]}
            </div>
          ))}
        </div>
      )}

      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-mono tracking-wider uppercase">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Discord username</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Total Spent</th>
                <th className="px-6 py-4 text-right">Pending Amount</th>
                <th className="px-6 py-4 text-center">Tier</th>
                <th className="px-6 py-4 text-right">Points Balance</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {aggregatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-zinc-500 font-mono">
                    No users found.
                  </td>
                </tr>
              ) : (
                aggregatedList.map((user, idx) => {
                  const isPremium = user.profile.tier === 'premium';
                  return (
                    <tr
                      key={user.profile.id}
                      className={`transition-colors duration-200 ${
                        isPremium 
                          ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]' 
                          : 'hover:bg-zinc-850/40'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${isPremium ? 'text-amber-400 font-serif' : 'text-zinc-100'}`}>
                              {user.profile.fullName}
                            </span>
                            {isPremium && (
                              <Star size={12} className="text-amber-500 fill-amber-500 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {user.profile.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300 font-mono">
                        @{user.profile.username || 'n/a'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge label={user.orderCount.toString()} variant="default" />
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-200">
                        {formatCurrency(user.totalSpent)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.pendingAmount > 0 ? (
                          <span className="font-semibold text-rose-400">
                            {formatCurrency(user.pendingAmount)}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-500">
                            Fully Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {/* VIP Toggle Switch */}
                          <button
                            onClick={() => handleUpdateTier(
                              user.profile.id,
                              isPremium ? 'normal' : 'premium'
                            )}
                            disabled={updatingTierId === user.profile.id}
                            title={isPremium ? 'Click to remove VIP (hides VIP Lounge)' : 'Click to grant VIP (shows VIP Lounge)'}
                            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono tracking-wider uppercase font-bold border transition-all duration-300 cursor-pointer disabled:opacity-50 ${
                              isPremium
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            {/* Toggle pill */}
                            <motion.div
                              className={`relative w-8 h-4 rounded-full flex items-center transition-colors duration-300 ${
                                isPremium ? 'bg-amber-500' : 'bg-zinc-700'
                              }`}
                            >
                              <motion.div
                                layout
                                className={`absolute w-3 h-3 rounded-full bg-white shadow-sm ${
                                  isPremium ? 'left-[18px]' : 'left-[2px]'
                                }`}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            </motion.div>
                            {updatingTierId === user.profile.id ? (
                              <span className="text-zinc-500">...</span>
                            ) : isPremium ? (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Crown size={9} className="fill-current" />
                                VIP ON
                              </span>
                            ) : (
                              <span>VIP OFF</span>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingPointsUserId === user.profile.id ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <input
                              type="number"
                              value={pointsValue}
                              onChange={(e) => setPointsValue(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-150 text-right outline-none focus:border-zinc-700 transition-all"
                            />
                            <Button 
                              size="small" 
                              variant="primary" 
                              onClick={() => handleSavePoints(user.profile.id)}
                              disabled={savingPoints}
                            >
                              Save
                            </Button>
                            <Button 
                              size="small" 
                              variant="neutral" 
                              onClick={() => setEditingPointsUserId(null)}
                            >
                              X
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <span className={`font-semibold font-mono ${isPremium ? 'text-amber-500' : 'text-zinc-300'}`}>
                              {user.profile.points || 0}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPointsUserId(user.profile.id);
                                setPointsValue(user.profile.points || 0);
                              }}
                              className="text-amber-500 hover:text-amber-400 font-mono text-[10px] uppercase hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Button
                            variant={user.pendingAmount > 0 ? "primary" : "neutral"}
                            size="small"
                            iconStart={<MessageSquare size={12} />}
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
                  );
                })
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
