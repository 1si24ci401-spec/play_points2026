import React, { useRef } from 'react';
import { Button } from '@figma/astraui';
import { Printer, Download, X, FileText, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { numberToIndianWords } from '../../utils/numberToWords';
import { format } from 'date-fns';
import { HydraCrestLogo, HydraRubberStamp, HandwrittenSignature } from './HydraBranding';

export interface OrderBillingData {
  id: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  discordUsername?: string;
  codGameId?: string;
  items: Array<{
    id?: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    pointsCost?: number;
    hsn?: string;
    unit?: string;
  }>;
  total: number;
  discountedTotal: number;
  pointsTotal?: number;
  pointsDeducted?: number;
  couponCode?: string;
  status: string;
  paymentType?: 'full' | 'partial';
  paymentStatus?: 'pending' | 'approved' | 'rejected';
  partialAmount?: number;
  remainingAmount?: number;
  createdAt: string;

  // Billing specific fields
  invoiceNo?: string;
  invoiceDate?: string;
  paymentId?: string;
  paymentPeriod?: string;
  balanceDueDate?: string;
  billEnabled?: boolean;
  billGeneratedAt?: string;
  hsnCode?: string;
  billNotes?: string;
  customerGstin?: string;
  companyName?: string;
}

interface TallyInvoiceProps {
  order: OrderBillingData;
  onClose?: () => void;
  showActions?: boolean;
}

export function TallyInvoice({ order, onClose, showActions = true }: TallyInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Formatting invoice reference
  const shortId = order.id.split(':')[1]?.slice(0, 4) || '0482';
  const invoiceNumber = order.invoiceNo || `HT/26-27/${shortId.toUpperCase()}`;
  const invoiceDate = order.invoiceDate ? new Date(order.invoiceDate) : new Date(order.createdAt || Date.now());
  const formattedDate = format(invoiceDate, 'dd-MM-yyyy');

  const originalTotal = Number(order.total || 0);
  const grandTotal = Number(order.discountedTotal || order.total || 0);
  const discountAmount = Math.max(0, originalTotal - grandTotal);

  const paidAmount = order.paymentType === 'partial'
    ? Number(order.partialAmount || 0)
    : (order.paymentStatus === 'approved' ? grandTotal : 0);
  
  const balanceDue = order.remainingAmount !== undefined
    ? Number(order.remainingAmount)
    : Math.max(0, grandTotal - paidAmount);

  const paymentStatus = order.paymentStatus || 'approved';
  const paymentId = order.paymentId || (order.paymentStatus === 'approved' ? `TXN-${shortId.toUpperCase()}` : 'Pending Verification');
  const paymentPeriod = order.paymentPeriod || (balanceDue > 0 ? (order.balanceDueDate ? `Due by ${format(new Date(order.balanceDueDate), 'dd-MM-yyyy')}` : 'Within 7 Business Days') : 'Settled in Full');

  // Tax computation (inclusive 18% GST: 9% CGST + 9% SGST on final bill)
  const baseTotalForTax = grandTotal;
  const netTaxableSubTotal = Math.round((baseTotalForTax / 1.18) * 100) / 100;
  const grossSubTotal = discountAmount > 0 
    ? Math.round((originalTotal / 1.18) * 100) / 100 
    : netTaxableSubTotal;

  const totalTax = Math.round((baseTotalForTax - netTaxableSubTotal) * 100) / 100;
  const cgst = Math.round((totalTax / 2) * 100) / 100;
  const sgst = Math.round((totalTax - cgst) * 100) / 100;

  const amountInWords = numberToIndianWords(grandTotal, 'Rupees');

  // Items preparation
  const items = (order.items && order.items.length > 0)
    ? order.items
    : [
        { name: 'Industrial Valves 3-inch', price: 2450 * 1.18, quantity: 12, hsn: '8481', unit: 'Pcs' },
        { name: 'Heavy Duty Fasteners', price: 180 * 1.18, quantity: 50, hsn: '7318', unit: 'Kgs' },
        { name: 'Hydraulic Hoses', price: 1250 * 1.18, quantity: 8, hsn: '4009', unit: 'Nos' },
      ];

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    // Grab all active document styles to ensure exact font rendering and SVG fidelity
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNumber}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0;
              padding: 0;
              font-size: 13px;
              line-height: 1.35;
            }
            .invoice-wrapper {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff !important;
              padding: 12px 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse !important;
              border: 1.5px solid #000000 !important;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #000000 !important;
              padding: 6px 10px;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: bold;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 700);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top Action Bar */}
      {showActions && (
        <div className="w-full max-w-3xl flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm text-zinc-100 font-sans">
              Tax Invoice Preview (Hydra Format)
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono font-bold">
              {invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="small"
              iconStart={<Printer size={15} />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="neutral"
              size="small"
              iconStart={<Download size={15} />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bill Sheet Paper (Direct replica of user's photo) */}
      <div
        ref={invoiceRef}
        id="tally-invoice-print-area"
        className="w-full max-w-3xl bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm font-sans text-[13px] leading-normal select-text border border-zinc-200"
        style={{ color: '#000000', backgroundColor: '#ffffff' }}
      >
        {/* Header: Logo on Left, HYDRA TRADERS on Right */}
        <div className="flex items-start justify-between gap-6 pb-2">
          {/* Logo */}
          <div className="shrink-0 -mt-2">
            <HydraCrestLogo className="w-24 h-24 sm:w-28 sm:h-28" />
          </div>

          {/* Company Info */}
          <div className="flex-1 text-left flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172554] uppercase font-sans">
              HYDRA TRADERS
            </h1>
            <p className="text-xs text-zinc-800 font-medium mt-0.5">
              No. 45, 1st Cross, JC Road, Bengaluru, Karnataka - 560002
            </p>
            <p className="text-xs text-zinc-900 font-semibold">
              GSTIN: 29AABCH3481D1ZX
            </p>
            <p className="text-xs text-zinc-800 font-medium">
              Phone: +91 80 4123 4567 | Email: info@hydratraders.com
            </p>
          </div>
        </div>

        {/* Solid Divider Line */}
        <div className="w-full border-b-[1.5px] border-black my-2.5" />

        {/* Centered Document Title */}
        <div className="text-center my-1.5">
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-black font-sans">
            TAX INVOICE
          </h2>
        </div>

        {/* Subheader: Billed To (Left) & Invoice Meta (Right) */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 my-3 text-xs sm:text-[13px]">
          {/* Billed To */}
          <div className="flex flex-col">
            <span className="font-bold text-black">Billed To:</span>
            <span className="font-extrabold text-sm text-black">
              {order.userFullName || 'M/s. Apex Enterprises'}
            </span>
            <span className="font-medium text-zinc-800">
              GSTIN: {order.customerGstin || '29AAICA4567R1Z5'}
            </span>
            <span className="text-zinc-700">
              {order.userEmail ? `${order.userEmail}` : 'Bengaluru, Karnataka - 560011'}
            </span>
            {order.discordUsername && (
              <span className="text-[11px] text-zinc-600">
                Discord: @{order.discordUsername} {order.codGameId ? `• COD UID: ${order.codGameId}` : ''}
              </span>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="flex flex-col sm:text-right">
            <div>
              <span className="font-bold">Invoice No:</span>{' '}
              <span className="font-bold text-black">{invoiceNumber}</span>
            </div>
            <div>
              <span className="font-bold">Date:</span>{' '}
              <span className="text-black">{formattedDate}</span>
            </div>
            <div>
              <span className="font-bold">Place of Supply:</span>{' '}
              <span className="text-black">Karnataka (29)</span>
            </div>
            {/* Payment Details */}
            <div className="text-[11px] text-zinc-700 mt-1">
              <span className="font-semibold">Payment Status:</span>{' '}
              <span className="font-bold text-emerald-700 uppercase">
                {paymentStatus === 'approved' ? 'PAID / APPROVED' : paymentStatus.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-zinc-600">
              <span className="font-medium">Payment ID:</span>{' '}
              <span className="font-mono font-semibold">{paymentId}</span>
            </div>
            {balanceDue > 0 && (
              <div className="text-[11px] text-amber-800 font-bold">
                Balance Due: {formatCurrency(balanceDue)} ({paymentPeriod})
              </div>
            )}
          </div>
        </div>

        {/* Table Matching Image */}
        <div className="w-full my-4">
          <table className="w-full border-collapse border border-black text-xs sm:text-[13px] font-sans">
            <thead>
              <tr className="bg-[#f1f5f9] text-black border-b border-black">
                <th className="border border-black px-2 py-2 text-center w-14 font-bold">
                  Sl. No.
                </th>
                <th className="border border-black px-3 py-2 text-left font-bold">
                  Description of Goods
                </th>
                <th className="border border-black px-2 py-2 text-center w-16 font-bold">
                  HSN
                </th>
                <th className="border border-black px-2 py-2 text-center w-20 font-bold">
                  Qty
                </th>
                <th className="border border-black px-3 py-2 text-right w-24 font-bold">
                  Rate (₹)
                </th>
                <th className="border border-black px-3 py-2 text-right w-28 font-bold">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const itemRate = (item.price || 0) / 1.18;
                const itemQty = item.quantity || 1;
                const itemAmount = itemRate * itemQty;
                const itemHsn = item.hsn || order.hsnCode || (idx === 0 ? '8481' : idx === 1 ? '7318' : '4009');
                const unit = item.unit || (idx === 0 ? 'Pcs' : idx === 1 ? 'Kgs' : 'Nos');

                return (
                  <tr key={idx} className="border-b border-black">
                    <td className="border border-black px-2 py-2 text-center font-medium">
                      {idx + 1}.
                    </td>
                    <td className="border border-black px-3 py-2 text-left font-medium text-black">
                      {item.name}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-medium">
                      {itemHsn}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-medium">
                      {itemQty} {unit}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-medium">
                      {itemRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-medium">
                      {itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {/* Sub-Total Row */}
              <tr className="border-b border-black font-semibold">
                <td colSpan={4} className="border border-black"></td>
                <td className="border border-black px-3 py-1.5 text-right font-bold text-black">
                  Sub-Total:
                </td>
                <td className="border border-black px-3 py-1.5 text-right font-bold text-black">
                  ₹{grossSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Vendor Promo Row (Avails promo price deduction; hides internal coupon code) */}
              {discountAmount > 0 && (
                <tr className="border-b border-black font-semibold" style={{ backgroundColor: '#f0fdf4' }}>
                  <td colSpan={4} className="border border-black"></td>
                  <td className="border border-black px-3 py-1.5 text-right font-bold text-emerald-800">
                    Vendor Promo:
                  </td>
                  <td className="border border-black px-3 py-1.5 text-right font-bold text-emerald-800">
                    -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {/* CGST (9%) Row */}
              <tr className="border-b border-black font-semibold">
                <td colSpan={4} className="border border-black"></td>
                <td className="border border-black px-3 py-1.5 text-right font-bold text-black">
                  CGST (9%):
                </td>
                <td className="border border-black px-3 py-1.5 text-right font-bold text-black">
                  ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* SGST (9%) Row */}
              <tr className="border-b border-black font-semibold">
                <td colSpan={4} className="border border-black"></td>
                <td className="border border-black px-3 py-1.5 text-right font-bold text-black">
                  SGST (9%):
                </td>
                <td className="border border-black px-3 py-1.5 text-right font-bold text-black">
                  ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Partial / Balance Due Rows if applicable */}
              {balanceDue > 0 && (
                <>
                  <tr className="border-b border-black font-semibold bg-zinc-50">
                    <td colSpan={4} className="border border-black"></td>
                    <td className="border border-black px-3 py-1.5 text-right text-xs font-bold text-emerald-800">
                      Paid Amount:
                    </td>
                    <td className="border border-black px-3 py-1.5 text-right text-xs font-bold text-emerald-800">
                      ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-b border-black font-semibold bg-amber-50">
                    <td colSpan={4} className="border border-black"></td>
                    <td className="border border-black px-3 py-1.5 text-right text-xs font-bold text-amber-900">
                      Balance Due:
                    </td>
                    <td className="border border-black px-3 py-1.5 text-right text-xs font-bold text-amber-900">
                      ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </>
              )}

              {/* Grand Total Row */}
              <tr className="border-b border-black bg-white">
                <td colSpan={4} className="border border-black"></td>
                <td className="border border-black px-3 py-2 text-right font-extrabold text-sm sm:text-base text-black">
                  Grand Total:
                </td>
                <td className="border border-black px-3 py-2 text-right font-extrabold text-sm sm:text-base text-black">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Amount In Words Row (Spanning all columns) */}
              <tr className="border border-black">
                <td colSpan={6} className="px-3 py-2.5 text-left font-medium text-black">
                  {amountInWords}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer: For HYDRA TRADERS, Stamp & Signature */}
        <div className="mt-8 pt-4 flex flex-col items-end">
          <div className="flex flex-col items-center sm:items-end w-full max-w-xs">
            <span className="font-extrabold text-sm text-black mb-1">
              For HYDRA TRADERS
            </span>

            {/* Rubber Stamp and Signature pair */}
            <div className="flex items-center justify-end relative h-28 w-full pr-2">
              {/* Circular Violet Rubber Stamp */}
              <div className="absolute right-24 sm:right-28 top-0 z-10 pointer-events-none">
                <HydraRubberStamp className="w-28 h-28 sm:w-32 sm:h-32" />
              </div>

              {/* Blue Fountain Pen Cursive Signature */}
              <div className="relative z-20">
                <HandwrittenSignature className="w-36 h-14 sm:w-44 sm:h-16" />
              </div>
            </div>

            <span className="font-bold text-xs sm:text-sm text-black text-right mt-1">
              Authorized Signatory
            </span>
          </div>
        </div>

        {/* Computer Generated Bill Authorization Line */}
        <div className="w-full border-t border-zinc-300 mt-8 pt-3 text-center">
          <p className="text-[11px] sm:text-xs text-zinc-600 font-medium tracking-wide">
            This is a computer generated bill and its authorized by the Hydra Traders
          </p>
        </div>
      </div>
    </div>
  );
}
