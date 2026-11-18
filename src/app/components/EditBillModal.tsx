import React, { useState } from 'react';
import { Button } from '@figma/astraui';
import { X, CheckCircle, FileText, Calendar, DollarSign, CreditCard, Clock, Bell, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { OrderBillingData } from './TallyInvoice';

interface EditBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderBillingData;
  accessToken: string;
  onSuccess: () => void;
}

export function EditBillModal({ isOpen, onClose, order, accessToken, onSuccess }: EditBillModalProps) {
  const shortId = order.id.split(':')[1]?.slice(0, 4) || '0482';
  const defaultInvNo = order.invoiceNo || `HT/26-27/${shortId.toUpperCase()}`;

  const [invoiceNo, setInvoiceNo] = useState(defaultInvNo);
  const [customerName, setCustomerName] = useState(order.userFullName || 'M/s. Apex Enterprises');
  const [customerGstin, setCustomerGstin] = useState(order.customerGstin || '29AAICA4567R1Z5');
  const [invoiceDate, setInvoiceDate] = useState(
    order.invoiceDate ? order.invoiceDate.split('T')[0] : '2026-11-18'
  );
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>(
    order.paymentStatus || 'pending'
  );
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>(
    order.paymentType || 'full'
  );
  const [paymentId, setPaymentId] = useState(
    order.paymentId || (order.paymentStatus === 'approved' ? `TXN-${shortId.toUpperCase()}` : '')
  );

  const initialPaid = order.paymentType === 'partial'
    ? (order.partialAmount || 0)
    : (order.paymentStatus === 'approved' ? (order.discountedTotal || order.total || 0) : 0);
  const [paidAmount, setPaidAmount] = useState<number>(initialPaid);

  const [balanceDueDate, setBalanceDueDate] = useState(
    order.balanceDueDate ? order.balanceDueDate.split('T')[0] : ''
  );
  const [paymentPeriod, setPaymentPeriod] = useState(
    order.paymentPeriod || 'Within 7 Business Days'
  );
  const [hsnCode, setHsnCode] = useState(order.hsnCode || '8481');
  const [billNotes, setBillNotes] = useState(order.billNotes || '');
  const [billEnabled, setBillEnabled] = useState<boolean>(
    order.billEnabled !== undefined ? order.billEnabled : true
  );
  const [customItems, setCustomItems] = useState(order.items || []);
  const [orderTotal, setOrderTotal] = useState<number>(Number(order.discountedTotal || order.total || 0));
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const total = orderTotal || Number(order.discountedTotal || order.total || 0);
  const calculatedRemaining = Math.max(0, total - paidAmount);

  // Quick Preset: Replicates the exact uploaded photo invoice
  const handleLoadHydraPreset = () => {
    setInvoiceNo('HT/26-27/0482');
    setCustomerName('M/s. Apex Enterprises');
    setCustomerGstin('29AAICA4567R1Z5');
    setInvoiceDate('2026-11-18');
    setPaymentStatus('approved');
    setPaymentType('full');
    setPaymentId('TXN-HT-0482');
    setPaidAmount(57112);
    setOrderTotal(57112);
    setPaymentPeriod('Settled in Full');
    setHsnCode('8481');
    setBillEnabled(true);
    setCustomItems([
      { name: 'Industrial Valves 3-inch', hsn: '8481', quantity: 12, unit: 'Pcs', price: 2450 * 1.18 },
      { name: 'Heavy Duty Fasteners', hsn: '7318', quantity: 50, unit: 'Kgs', price: 180 * 1.18 },
      { name: 'Hydraulic Hoses', hsn: '4009', quantity: 8, unit: 'Nos', price: 1250 * 1.18 },
    ]);
    toast.success('Loaded Hydra Traders reference invoice preset (₹57,112.00)!');
  };

  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    setPaymentType(type);
    if (type === 'full') {
      setPaidAmount(total);
    } else {
      if (paidAmount >= total) {
        setPaidAmount(Math.round(total / 2));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const remainingAmount = paymentType === 'partial' ? Math.max(0, total - paidAmount) : 0;
      const finalPaid = paymentType === 'full' ? (paymentStatus === 'approved' ? total : 0) : paidAmount;

      const updates: any = {
        invoiceNo: invoiceNo.trim() || defaultInvNo,
        userFullName: customerName.trim() || 'M/s. Apex Enterprises',
        customerGstin: customerGstin.trim() || '29AAICA4567R1Z5',
        invoiceDate: new Date(invoiceDate).toISOString(),
        paymentStatus,
        paymentType,
        paymentId: paymentId.trim() || `TXN-${Date.now().toString().slice(-8)}`,
        partialAmount: finalPaid,
        remainingAmount: remainingAmount,
        balanceDueDate: balanceDueDate ? new Date(balanceDueDate).toISOString() : null,
        paymentPeriod: paymentPeriod.trim() || 'Settled in Full',
        hsnCode: hsnCode.trim() || '8481',
        billNotes: billNotes.trim(),
        billEnabled,
        billGeneratedAt: new Date().toISOString(),
      };

      if (customItems.length > 0) {
        updates.items = customItems;
        updates.total = total;
        updates.discountedTotal = total;
      }

      await api.updateOrder(accessToken, order.id, updates);

      // If notifyCustomer is enabled, send in-app notification to customer
      if (notifyCustomer && order.userId) {
        try {
          const statusText = paymentStatus === 'approved' ? 'Approved & Paid' : paymentStatus === 'rejected' ? 'Rejected' : 'Pending Verification';
          const msg = billEnabled
            ? `📄 Tax Invoice (${updates.invoiceNo}) for Order #${shortId} has been updated & enabled! Payment Status: ${statusText}. Balance Due: ${formatCurrency(remainingAmount)}. Period: ${updates.paymentPeriod}. Download in My Orders.`
            : `ℹ️ Payment details for Order #${shortId} have been updated by admin. Status: ${statusText}.`;
          await api.sendUserNotification(accessToken, order.userId, msg);
        } catch (notifErr) {
          console.warn('Could not dispatch customer notification:', notifErr);
        }
      }

      toast.success('Billing and invoice details saved successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update billing details:', error);
      toast.error(error.message || 'Failed to save billing details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] z-10 flex flex-col gap-6 text-zinc-100"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FileText size={22} />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium text-white flex items-center gap-2">
                  Invoice & Billing Settings
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Order #{shortId} • Customer: {order.userEmail || order.discordUsername}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5 text-xs">
            {/* Quick Demo Preset Banner */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold text-amber-200 text-xs block">
                    Hydra Traders Reference Invoice (₹57,112.00)
                  </span>
                  <span className="text-[11px] text-amber-300/80">
                    Instantly fills M/s. Apex Enterprises, GSTIN, HT/26-27/0482, seal, and demo items.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadHydraPreset}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                Load Exact Preset
              </button>
            </div>

            {/* Bill Enable Master Switch */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm text-white flex items-center gap-2">
                  <span>Enable Bill / Invoice for Customer</span>
                  {billEnabled && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </span>
                <span className="text-zinc-400 text-[11px]">
                  When enabled, customer can view and download the official Tally Tax Invoice PDF from their "My Orders" tab.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={billEnabled}
                  onChange={(e) => setBillEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Row 1: Invoice Number & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. HT/26-27/0482"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Billed To Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Billed To: Customer / Business Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. M/s. Apex Enterprises"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Customer GSTIN / Business Reg No
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="e.g. 29AAICA4567R1Z5"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Payment Status & Payment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="approved">Approved / Cleared</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Payment Mode / Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => handlePaymentTypeChange(e.target.value as any)}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="full">Full Payment (100% Paid)</option>
                  <option value="partial">Partial Payment (Balance Due)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Payment ID / Reference & Amounts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Payment ID / Transaction Ref
                </label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="e.g. UPI/8391039842"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Amount Paid (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={total}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  disabled={paymentType === 'full' && paymentStatus === 'approved'}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono outline-none focus:border-amber-500 transition-colors disabled:opacity-60"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Balance Amount Due (Rs)
                </label>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold flex items-center justify-between">
                  <span>{formatCurrency(calculatedRemaining)}</span>
                  {calculatedRemaining > 0 && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Due Period & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  When to be Paid (Period / Terms)
                </label>
                <input
                  type="text"
                  value={paymentPeriod}
                  onChange={(e) => setPaymentPeriod(e.target.value)}
                  placeholder="e.g. Within 7 Days / On Delivery"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Balance Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={balanceDueDate}
                  onChange={(e) => setBalanceDueDate(e.target.value)}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Row 5: HSN/SAC Code & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  GST HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="998439 (Digital gaming goods / services)"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Bill Terms / Special Notes
                </label>
                <input
                  type="text"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="e.g. Balance payable via UPI to playpoints@hdfcbank"
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Notification Checkbox */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
              <input
                type="checkbox"
                id="notify-customer"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
              />
              <label htmlFor="notify-customer" className="text-zinc-300 text-xs cursor-pointer flex items-center gap-1.5">
                <Bell size={14} className="text-amber-400" />
                <span>Send automated in-app notification popup to customer regarding this invoice update</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-zinc-800">
              <Button
                variant="neutral"
                size="small"
                type="button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="small"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Update Bill'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
