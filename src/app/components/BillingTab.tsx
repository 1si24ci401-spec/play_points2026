import { useState, useEffect } from 'react';
import { Button, Badge } from '@figma/astraui';
import {
  FileText, Search, Filter, Printer, Download, Eye, CheckCircle2,
  XCircle, Clock, AlertCircle, Edit, Bell, ArrowUpDown, ChevronRight,
  DollarSign, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { TallyInvoice, OrderBillingData } from './TallyInvoice';
import { EditBillModal } from './EditBillModal';

interface BillingTabProps {
  accessToken: string;
}

export function BillingTab({ accessToken }: { accessToken: string }) {
  const [orders, setOrders] = useState<OrderBillingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'pending' | 'due'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modals state
  const [viewingOrder, setViewingOrder] = useState<OrderBillingData | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderBillingData | null>(null);
  const [togglingBillId, setTogglingBillId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [accessToken]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders(accessToken);
      const list = (res.orders || []).sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(list);
    } catch (err: any) {
      console.error('Failed to load orders for billing:', err);
      toast.error('Failed to load orders for billing');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBillStatus = async (order: OrderBillingData) => {
    setTogglingBillId(order.id);
    const newStatus = !order.billEnabled;
    const shortId = order.id.split(':')[1]?.slice(0, 8) || order.id;
    const invNo = order.invoiceNo || `HT/26-27/${shortId.toUpperCase()}`;

    try {
      await api.updateOrder(accessToken, order.id, {
        billEnabled: newStatus,
        billGeneratedAt: newStatus ? new Date().toISOString() : order.billGeneratedAt,
      });

      // Update local state
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, billEnabled: newStatus } : o));

      if (newStatus && order.userId) {
        try {
          await api.sendUserNotification(
            accessToken,
            order.userId,
            `📄 Tax Invoice (${invNo}) for your Order #${shortId} is now enabled and available for download in My Orders!`
          );
        } catch (e) {
          console.warn('Could not send notification:', e);
        }
      }

      toast.success(
        newStatus
          ? `Bill #${invNo} is now ENABLED for customer!`
          : `Bill #${invNo} is now DISABLED for customer.`
      );
    } catch (error: any) {
      console.error('Failed to toggle bill status:', error);
      toast.error('Failed to update bill visibility');
    } finally {
      setTogglingBillId(null);
    }
  };

  const handleQuickNotify = async (order: OrderBillingData) => {
    if (!order.userId) {
      toast.error('No customer ID associated with this order');
      return;
    }
    const shortId = order.id.split(':')[1]?.slice(0, 8) || order.id;
    const invNo = order.invoiceNo || `HT/26-27/${shortId.toUpperCase()}`;
    const balance = order.remainingAmount || (order.paymentType === 'partial' ? (order.discountedTotal - (order.partialAmount || 0)) : 0);

    try {
      await api.sendUserNotification(
        accessToken,
        order.userId,
        `🔔 Notice from Admin: Tax Invoice (${invNo}) for Order #${shortId} is ready. Payment Status: ${(order.paymentStatus || 'Pending').toUpperCase()}. Balance Due: ${formatCurrency(balance)}. Period: ${order.paymentPeriod || 'Immediate'}.`
      );
      toast.success(`Notification sent to ${order.userEmail || 'customer'}!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to dispatch notification');
    }
  };

  // KPI calculations
  const totalInvoiced = orders.reduce((sum, o) => sum + (o.discountedTotal || o.total || 0), 0);
  const totalCollected = orders.reduce((sum, o) => {
    if (o.paymentType === 'partial') {
      return sum + (o.partialAmount || 0);
    }
    return sum + (o.paymentStatus === 'approved' ? (o.discountedTotal || o.total || 0) : 0);
  }, 0);
  const totalBalanceDue = orders.reduce((sum, o) => {
    if (o.remainingAmount !== undefined) return sum + o.remainingAmount;
    if (o.paymentType === 'partial') {
      return sum + Math.max(0, (o.discountedTotal || o.total || 0) - (o.partialAmount || 0));
    }
    return sum + (o.paymentStatus === 'approved' ? 0 : (o.discountedTotal || o.total || 0));
  }, 0);
  const totalBillsEnabled = orders.filter(o => o.billEnabled).length;

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const shortId = o.id.split(':')[1] || o.id;
    const invoiceNo = o.invoiceNo || `HT/26-27/${shortId.slice(0, 6).toUpperCase()}`;
    const matchesSearch =
      shortId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.discordUsername && o.discordUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.paymentId && o.paymentId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (paymentFilter !== 'all') {
      if (paymentFilter === 'approved' && o.paymentStatus !== 'approved') return false;
      if (paymentFilter === 'pending' && o.paymentStatus !== 'pending') return false;
      if (paymentFilter === 'rejected' && o.paymentStatus !== 'rejected') return false;
      if (paymentFilter === 'partial' && o.paymentType !== 'partial') return false;
    }

    const balance = o.remainingAmount !== undefined
      ? o.remainingAmount
      : (o.paymentType === 'partial' ? ((o.discountedTotal || 0) - (o.partialAmount || 0)) : (o.paymentStatus === 'approved' ? 0 : o.discountedTotal));

    if (statusFilter === 'enabled' && !o.billEnabled) return false;
    if (statusFilter === 'pending' && o.billEnabled) return false;
    if (statusFilter === 'due' && balance <= 0) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 font-mono text-sm">
        Loading billing & invoice records...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-white flex items-center gap-2">
            <FileText className="text-amber-400 w-5 h-5" />
            Billing & Invoices Management
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Admin controls invoice generation, payment reconciliations, customer visibility, and Tally Tax Invoices.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Total Invoiced Amount</span>
          <span className="text-2xl font-serif font-semibold text-zinc-100">
            {formatCurrency(totalInvoiced)}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            Across {orders.length} total orders
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Total Collected / Paid</span>
          <span className="text-2xl font-serif font-semibold text-emerald-400">
            {formatCurrency(totalCollected)}
          </span>
          <span className="text-[11px] text-emerald-500/80 font-mono">
            {totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}% settled` : '0%'}
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Outstanding Balance Due</span>
          <span className="text-2xl font-serif font-semibold text-amber-400">
            {formatCurrency(totalBalanceDue)}
          </span>
          <span className="text-[11px] text-amber-500/80 font-mono">
            Requires customer follow-up
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Bills Enabled for Users</span>
          <span className="text-2xl font-serif font-semibold text-indigo-400">
            {totalBillsEnabled} / {orders.length}
          </span>
          <span className="text-[11px] text-indigo-400/80 font-mono">
            {orders.length - totalBillsEnabled} under admin preparation
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Invoice #, Email, Payment ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-mono"
          >
            <option value="all">All Bill Statuses</option>
            <option value="enabled">Enabled for Customer</option>
            <option value="pending">Bill Pending / Disabled</option>
            <option value="due">Has Balance Due</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-mono"
          >
            <option value="all">All Payments</option>
            <option value="approved">Approved & Paid</option>
            <option value="partial">Partial Payment</option>
            <option value="pending">Pending Payment</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bills & Orders Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-4">Invoice / Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-right">Paid</th>
                <th className="px-5 py-4 text-right">Balance Due</th>
                <th className="px-5 py-4">Payment Details</th>
                <th className="px-5 py-4 text-center">Customer Visibility</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500 font-mono">
                    No orders matching billing criteria found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const shortId = order.id.split(':')[1]?.slice(0, 8) || order.id;
                  const invoiceNo = order.invoiceNo || `HT/26-27/${shortId.slice(0, 6).toUpperCase()}`;
                  const total = order.discountedTotal || order.total || 0;
                  const paid = order.paymentType === 'partial'
                    ? (order.partialAmount || 0)
                    : (order.paymentStatus === 'approved' ? total : 0);
                  const balance = order.remainingAmount !== undefined
                    ? order.remainingAmount
                    : Math.max(0, total - paid);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-850/40 transition-colors duration-150"
                    >
                      {/* Invoice & Order ID */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-amber-400 text-xs tracking-wider">
                            {invoiceNo}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Order #{shortId}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {format(new Date(order.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-sans font-medium text-zinc-200">
                            {order.userFullName || order.userEmail?.split('@')[0] || 'Customer'}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {order.userEmail}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            @{order.discordUsername || 'n/a'}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right font-semibold text-zinc-100">
                        {formatCurrency(total)}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-5 py-4 text-right font-medium text-emerald-400">
                        {formatCurrency(paid)}
                      </td>

                      {/* Balance Due */}
                      <td className="px-5 py-4 text-right font-bold">
                        {balance > 0 ? (
                          <span className="text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {formatCurrency(balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-500 text-[10px] uppercase font-semibold">
                            Nil / Paid
                          </span>
                        )}
                      </td>

                      {/* Payment Details */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                              order.paymentStatus === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : order.paymentStatus === 'rejected'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {order.paymentStatus || 'pending'}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {order.paymentType || 'full'}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[140px]" title={order.paymentId}>
                            Ref: {order.paymentId || 'N/A'}
                          </span>
                          {balance > 0 && (
                            <span className="text-[9px] text-amber-500/90 font-mono">
                              Period: {order.paymentPeriod || 'Within 7 Days'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bill Customer Visibility Switch */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleBillStatus(order)}
                          disabled={togglingBillId === order.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono tracking-wider uppercase font-bold border transition-all cursor-pointer ${
                            order.billEnabled
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                          }`}
                          title={order.billEnabled ? 'Bill is visible & downloadable by user. Click to disable.' : 'Bill is locked/hidden from user. Click to enable.'}
                        >
                          {order.billEnabled ? (
                            <>
                              <CheckCircle2 size={12} className="text-emerald-400" />
                              <span>Enabled</span>
                            </>
                          ) : (
                            <>
                              <Clock size={12} className="text-zinc-500" />
                              <span>In Prep</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
                            title="Preview Tally Bill & Print/PDF"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                            title="Edit Invoice & Payment Details"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleQuickNotify(order)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors"
                            title="Send In-App Notification to Customer"
                          >
                            <Bell size={14} />
                          </button>
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

      {/* Tally Invoice Viewer Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setViewingOrder(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] z-10 flex flex-col items-center"
            >
              <TallyInvoice
                order={viewingOrder}
                onClose={() => setViewingOrder(null)}
                showActions={true}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Bill Modal */}
      {editingOrder && (
        <EditBillModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          accessToken={accessToken}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
