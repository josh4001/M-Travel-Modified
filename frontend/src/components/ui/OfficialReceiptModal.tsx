import React, { useRef, useEffect } from 'react';
import {
  X, Printer, CheckCircle2, ShieldCheck,
  Calendar, MapPin, Car, FileText, QrCode
} from 'lucide-react';

interface OfficialReceiptModalProps {
  booking: any;
  vehicle: any;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  booking,
  vehicle = {},
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Close on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const ref = booking.booking_ref ?? booking.bookingRef ?? 'MT-884920';
  const start = new Date(booking.start_date ?? booking.startDate ?? Date.now());
  const end = new Date(booking.end_date ?? booking.endDate ?? Date.now() + 86400000 * 3);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const total = Number(booking.total_amount ?? booking.totalAmount ?? 33000);
  const baseRate = Math.round(total / (1.16 * days));
  const subtotal = baseRate * days;
  const vat = total - subtotal;
  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const plate = vehicle.plateNumber ?? vehicle.plate_number ?? 'KDA 789X';
  const isWalletPaid = Boolean(
    (booking.mpesaReceipt && booking.mpesaReceipt.startsWith('WAL-')) ||
    (booking.mpesa_receipt && booking.mpesa_receipt.startsWith('WAL-'))
  );
  const receiptCode = booking.mpesaReceipt || booking.mpesa_receipt || (isWalletPaid ? `WAL-${ref.replace('MT-', '')}` : ref.replace('MT-', 'NLK-'));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 md:p-6 print:static print:bg-white print:p-0 print:backdrop-blur-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none">
        {/* STICKY TOP ACTION BAR (Screen Only - Always pinned & never cut off) */}
        <div className="shrink-0 bg-slate-950 px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight text-white">Official Tax Invoice &amp; Trip Receipt</span>
              <span className="text-[11px] text-slate-400 font-mono">Ref: {ref}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100 transition shadow-sm"
              title="Print receipt or save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition border border-slate-700"
              title="Close receipt (Esc)"
              aria-label="Close receipt"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE SCROLLABLE RECEIPT BODY */}
        <div ref={receiptRef} className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-10 font-sans space-y-6 bg-white print:overflow-visible print:p-0">
          {/* HEADER WITH LOGO */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="M-Travel Logo"
                className="h-12 sm:h-14 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">M-TRAVEL TOURS</h1>
                <p className="text-xs text-slate-500 font-medium">Luxury Safari &amp; VIP Travel Marketplace</p>
                <p className="text-[11px] text-slate-400">KRA PIN: P051938491Z • Nairobi, Kenya</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-lg bg-slate-100 text-slate-900 border border-slate-200 font-mono text-xs font-bold px-3 py-1 mb-1">
                TAX INVOICE
              </span>
              <p className="font-mono text-sm font-bold text-slate-800">REF: {ref}</p>
              <p className="text-xs text-slate-500">Date: {issueDate}</p>
            </div>
          </div>

          {/* VERIFICATION & PAYMENT BADGE */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-sm">Payment Verified &amp; Cleared</span>
                  <span className="rounded bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold px-1.5 py-0.5">
                    {isWalletPaid ? 'M-TRAVEL WALLET' : 'M-PESA LIPA NA M-PESA'}
                  </span>
                </div>
                <p className="text-xs text-emerald-700">Receipt Code: {receiptCode} • Method: {isWalletPaid ? 'Traveler Wallet Deduction' : 'Safaricom M-Pesa'} • Status: Fully Settled</p>
              </div>
            </div>
            <img
              src="/mpesa-logo.png"
              alt="M-Pesa"
              className="h-7 w-auto object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* TRIP & VEHICLE DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                Vehicle &amp; Chauffeur Details
              </span>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-700 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{vehicle.make ?? 'Toyota'} {vehicle.model ?? '4X4 Land Cruiser'}</span>
              </div>
              <p className="font-mono text-slate-600 font-bold">Plate: {plate}</p>
              <p className="text-slate-600">Chauffeur: {vehicle.owner?.firstName ?? 'Samuel'} {vehicle.owner?.lastName ?? 'Omondi'} (Certified Guide)</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                Itinerary &amp; Duration
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-700 shrink-0" />
                <span className="font-medium text-slate-800">
                  {start.toLocaleDateString()} — {end.toLocaleDateString()} ({days} {days === 1 ? 'day' : 'days'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-700 shrink-0" />
                <span className="text-slate-700 truncate">{vehicle.address || 'Nairobi JKIA / Westlands ➔ Safari Reserve'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Comprehensive 24/7 VIP Safari Insurance Cover</span>
              </div>
            </div>
          </div>

          {/* ITEMIZED BILLING TABLE */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Service Description</th>
                    <th className="p-3.5 text-center">Qty / Days</th>
                    <th className="p-3.5 text-right">Rate (KES)</th>
                    <th className="p-3.5 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  <tr>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{vehicle.make ?? 'Toyota'} {vehicle.model ?? '4X4 Land Cruiser'} Safari Rental</span>
                      <span className="text-[11px] text-slate-500">Unlimited mileage, licensed commercial tour vehicle</span>
                    </td>
                    <td className="p-3.5 text-center">{days}</td>
                    <td className="p-3.5 text-right font-mono">{baseRate.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">{subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">Chauffeur &amp; Roadside Assist</span>
                      <span className="text-[11px] text-slate-500">Professional English/Swahili speaking driver</span>
                    </td>
                    <td className="p-3.5 text-center">1</td>
                    <td className="p-3.5 text-right font-mono">0</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">INCLUDED</td>
                  </tr>
                  <tr>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">Value Added Tax (VAT 16%)</span>
                      <span className="text-[11px] text-slate-500">Statutory Tax invoice compliance</span>
                    </td>
                    <td className="p-3.5 text-center">16%</td>
                    <td className="p-3.5 text-right font-mono">—</td>
                    <td className="p-3.5 text-right font-mono text-slate-800">{Math.round(vat).toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-950 text-white font-bold">
                  <tr>
                    <td colSpan={3} className="p-4 text-sm text-right text-slate-200">TOTAL PAID (KES):</td>
                    <td className="p-4 text-base font-mono text-white font-black text-right">KES {total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* FOOTER STAMP & QR CODE */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[11px] text-slate-500">
            <div className="space-y-1">
              <p className="font-bold text-slate-800">M-TRAVEL TOURS &amp; SAFARIS LTD</p>
              <p>Support: +254 700 000 000 • info@m-travel.co.ke • Nairobi, Kenya</p>
              <p className="text-slate-400">Generated automatically by M-Travel Booking Gateway</p>
            </div>

            {/* STAMP & QR */}
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 border border-slate-300 rounded-xl p-1 bg-white flex flex-col items-center justify-center">
                <QrCode className="h-12 w-12 text-slate-800" />
              </div>
              <div className="rounded-xl border-2 border-dashed border-emerald-600 px-3 py-1.5 text-emerald-800 text-center font-mono font-bold text-[10px] uppercase">
                <span>OFFICIAL STAMP</span><br />
                <span className="text-emerald-950 font-black">VERIFIED PAID</span>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM ACTION BAR (Screen Only - Quick Close option after reviewing receipt) */}
        <div className="shrink-0 bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Statutory KRA Tax Compliant ETR Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-slate-700" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
            >
              <X className="h-3.5 w-3.5" /> Close Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
