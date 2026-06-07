import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { format, parseISO } from 'date-fns';

interface OrderData {
  id: string;
  userId: string;
  total: number;
  discountedTotal: number;
  paymentType: 'full' | 'partial';
  paymentStatus: string;
  status: string;
  createdAt: string;
  remainingAmount?: number;
}

export function StatsTab({ accessToken }: { accessToken: string }) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [accessToken]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { orders: data } = await api.getOrders(accessToken);
      setOrders(data || []);
    } catch (e) {
      console.error('Failed to load orders for stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Loading statistics...
      </div>
    );
  }

  // Filter out cancelled and rejected orders for general sales stats
  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'rejected');

  // KPI Calculations
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.discountedTotal, 0);
  const totalOrders = orders.length;
  const activeCustomers = new Set(orders.map(o => o.userId)).size;
  const aov = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
  
  // Pending payments is where remainingAmount exists, or the entire order total if payment is pending
  const pendingPayments = activeOrders.reduce((sum, o) => {
    if (o.status === 'completed' || o.status === 'delivered') return sum;
    if (o.paymentStatus === 'approved') {
      return sum + (o.remainingAmount || 0);
    } else {
      return sum + o.discountedTotal;
    }
  }, 0);

  // Group by Date for Sales Trend
  const getSalesTrendData = () => {
    const dailyMap: { [key: string]: { date: string; Sales: number; Orders: number } } = {};

    // Sort orders chronologically first
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedOrders.forEach(order => {
      try {
        const dateStr = format(parseISO(order.createdAt), 'MMM d');
        const isAct = order.status !== 'cancelled' && order.status !== 'rejected';

        if (!dailyMap[dateStr]) {
          dailyMap[dateStr] = { date: dateStr, Sales: 0, Orders: 0 };
        }
        if (isAct) {
          dailyMap[dateStr].Sales += order.discountedTotal;
        }
        dailyMap[dateStr].Orders += 1;
      } catch (err) {
        console.error('Date parsing error', err);
      }
    });

    return Object.values(dailyMap);
  };

  const salesTrendData = getSalesTrendData();

  // Order Status Distribution Data
  const getStatusData = () => {
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

    return statuses.map((status, idx) => {
      const count = orders.filter(o => o.status === status).length;
      return {
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: colors[idx]
      };
    }).filter(d => d.value > 0);
  };

  const statusData = getStatusData();

  // Payment Type Breakdown Data
  const getPaymentTypeData = () => {
    const fullCount = orders.filter(o => o.paymentType === 'full').length;
    const partialCount = orders.filter(o => o.paymentType === 'partial').length;

    return [
      { name: 'Full Payment', value: fullCount, color: 'var(--color-primary)' },
      { name: 'Partial Payment', value: partialCount, color: '#ec4899' }
    ].filter(d => d.value > 0);
  };

  const paymentTypeData = getPaymentTypeData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium" style={{ color: 'var(--color-foreground)' }}>
          Dashboard Analytics
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          Real-time metrics, order distributions, and revenue sales trends.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          desc="From active orders"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders.toString()}
          icon={<ShoppingBag className="w-5 h-5 text-blue-500" />}
          desc="All-time placed"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(aov)}
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          desc="Per active order"
        />
        <StatCard
          title="Active Customers"
          value={activeCustomers.toString()}
          icon={<Users className="w-5 h-5 text-purple-500" />}
          desc="Who placed orders"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(pendingPayments)}
          icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
          desc="Uncollected balances"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend (2/3 width) */}
        <div
          className="lg:col-span-2 border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
        >
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
              Sales & Orders Trend
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              Daily accumulated sales and total orders count.
            </p>
          </div>
          <div className="h-80 w-full">
            {salesTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No sales trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Area type="monotone" dataKey="Sales" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status & Payment Breakdown (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Order Status Distribution */}
          <div
            className="border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4 flex-1"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                Order Status Distribution
              </h3>
            </div>
            <div className="h-44 w-full relative flex items-center justify-center">
              {statusData.length === 0 ? (
                <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  No orders placed yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        borderColor: 'var(--color-border)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
              {statusData.map((d, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span style={{ color: 'var(--color-foreground)' }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Type Distribution */}
          <div
            className="border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4 flex-1"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                Payment Methods Breakdown
              </h3>
            </div>
            <div className="h-44 w-full relative flex items-center justify-center">
              {paymentTypeData.length === 0 ? (
                <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  No payment data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        borderColor: 'var(--color-border)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
              {paymentTypeData.map((d, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span style={{ color: 'var(--color-foreground)' }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, desc }: { title: string; value: string; icon: React.ReactNode; desc: string }) {
  return (
    <div
      className="border rounded-[var(--radius-lg)] p-4 flex flex-col gap-2"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
          {title}
        </span>
        {icon}
      </div>
      <div>
        <span className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
          {value}
        </span>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
          {desc}
        </p>
      </div>
    </div>
  );
}
