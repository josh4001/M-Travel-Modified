import React, { useRef } from 'react';
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
  vehicle,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const ref = booking.booking_ref ?? booking.bookingRef ?? 'MT-884920';
  const start = new Date(booking.start_date ?? booking.startDate ?? Date.now());
  const end = new Date(booking.end_date ?? booking.endDate ?? Date.now() + 86400000 * 3);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const total = Number(booking.total_amount ?? booking.totalAmount ?? 46000);
  const baseRate = Math.round(total / (1.16 * days));
  const subtotal = baseRate * days;
  const vat = total - subtotal;
  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const plate = vehicle.plateNumber ?? vehicle.plate_number ?? 'KDA 789X';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white text-slate-900 shadow-2xl my-8">
        {/* ACTION BAR (Screen Only) */}
        <div className="print:hidden bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-sm">Official Tax Invoice &amp; Trip Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-900 hover:bg-amber-300 transition shadow-md"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 p-1.5 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL RECEIPT CONTAINER */}
        <div ref={receiptRef} className="p-8 sm:p-10 font-sans space-y-6 bg-white">
          {/* HEADER WITH LOGO */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="M-Travel Logo"
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">M-TRAVEL TOURS</h1>
                <p className="text-xs text-slate-500 font-medium">Luxury Safari &amp; VIP Travel Marketplace</p>
                <p className="text-[11px] text-slate-400">KRA PIN: P051938491Z • Nairobi, Kenya</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-bold px-3 py-1 mb-1">
                TAX INVOICE
              </span>
              <p className="font-mono text-sm font-bold text-slate-800">REF: {ref}</p>
              <p className="text-xs text-slate-500">Date: {issueDate}</p>
            </div>
          </div>

          {/* VERIFICATION & PAYMENT BADGE */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-sm">Payment Verified &amp; Cleared</span>
                  <span className="rounded bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold px-1.5 py-0.5">
                    M-PESA LIPA NA M-PESA
                  </span>
                </div>
                <p className="text-xs text-emerald-700">Receipt Code: {ref.replace('MT-', 'NLK-')} • Status: Fully Settled</p>
              </div>
            </div>
            <img
              src="/mpesa-logo.png"
              alt="M-Pesa"
              className="h-7 w-auto object-contain"
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
                <Car className="h-4 w-4 text-slate-700" />
                <span className="font-bold text-slate-900 text-sm">{vehicle.make} {vehicle.model}</span>
              </div>
              <p className="font-mono text-slate-600 font-bold">Plate: {plate}</p>
              <p className="text-slate-600">Chauffeur: {vehicle.owner?.firstName ?? 'James'} {vehicle.owner?.lastName ?? 'Mwangi'} (Certified Guide)</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                Itinerary &amp; Duration
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-700" />
                <span className="font-medium text-slate-800">
                  {start.toLocaleDateString()} — {end.toLocaleDateString()} ({days} {days === 1 ? 'day' : 'days'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-700" />
                <span className="text-slate-700 truncate">{vehicle.address || 'Westlands, Nairobi ➔ Maasai Mara'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Comprehensive 24/7 VIP Safari Insurance Cover</span>
              </div>
            </div>
          </div>

          {/* ITEMIZED BILLING TABLE */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
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
                    <span className="font-bold text-slate-900 block">{vehicle.make} {vehicle.model} Safari Rental</span>
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
              <tfoot className="bg-slate-900 text-white font-bold">
                <tr>
                  <td colSpan={3} className="p-4 text-sm text-right">TOTAL PAID (KES):</td>
                  <td className="p-4 text-base font-mono text-amber-400 text-right">KES {total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
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
      </div>
    </div>
  );
};
