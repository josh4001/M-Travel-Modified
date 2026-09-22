import React from 'react';
import {
  Palmtree, MapPin, Calendar, ShieldCheck, CheckCircle2,
  X, MessageSquare, Phone, Download, Sparkles, User, Receipt
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { openWhatsAppConcierge } from '@/lib/communicationService';
import type { StoredBooking } from '@/lib/bookingStore';

interface DestinationVoucherModalProps {
  booking: StoredBooking;
  onClose: () => void;
}

export const DestinationVoucherModal: React.FC<DestinationVoucherModalProps> = ({
  booking,
  onClose,
}) => {
  const { formatPrice } = useCurrency();
  const startDate = booking.startDate ? booking.startDate.split('T')[0] : '2026-09-16';
  const endDate = booking.endDate ? booking.endDate.split('T')[0] : '2026-09-19';

  const nights = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    openWhatsAppConcierge({ booking, isDestination: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 text-slate-900 font-display">
        {/* GOLD LUXURY ACCENT LINE */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        {/* HERO IMAGE & TITLE */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden">
          {booking.vehicleImage ? (
            <img
              src={booking.vehicleImage}
              alt={booking.vehicleName}
              className="h-full w-full object-cover opacity-85"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-purple-950 to-slate-900 flex items-center justify-center">
              <Palmtree className="h-16 w-16 text-amber-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-slate-950/80 hover:bg-black text-white px-3.5 py-1.5 text-xs font-bold border border-white/20 backdrop-blur-md shadow-lg transition flex items-center gap-1.5"
            title="Close Page"
          >
            <X className="h-4 w-4" /> Close Page
          </button>

          {/* Badge & Ref */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 border border-amber-300/40 px-3 py-0.5 text-[11px] font-bold text-amber-200 uppercase tracking-widest backdrop-blur-md">
                <Palmtree className="h-3 w-3 text-amber-300" /> Holiday Destination Reservation
              </span>
              <span className="font-mono text-xs text-slate-300 bg-black/40 px-2.5 py-0.5 rounded-md border border-white/10">
                Ref: {booking.bookingRef}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white drop-shadow-md">
              {booking.vehicleName}
            </h2>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* FACILITATION STATUS NOTICE */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-purple-600" /> Ground Arrangements Facilitation Active
            </div>
            <p className="text-xs text-purple-950/80 leading-relaxed font-medium">
              This reservation is managed as a <strong>Curated Destination &amp; Holiday Stay</strong> (not a standard car ride). The M-TRAVEL concierge operations desk has notified the property and is facilitating all lodge bookings, park clearance, and safari guide coordination on your behalf.
            </p>
          </div>

          {/* SUMMARY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Stay Dates */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <Calendar className="h-3.5 w-3.5 text-amber-600" /> Stay Duration ({nights} Night{nights > 1 ? 's' : ''})
              </div>
              <p className="font-bold text-slate-900 text-sm">{startDate} ➔ {endDate}</p>
              <p className="text-[11px] text-slate-500">Check-in: 12:00 PM · Check-out: 10:00 AM</p>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <MapPin className="h-3.5 w-3.5 text-teal" /> Property &amp; Destination Location
              </div>
              <p className="font-bold text-slate-900 text-sm truncate">{booking.pickupLocation || 'Kenya Safari Region'}</p>
              <p className="text-[11px] text-slate-500">Concierge transfer &amp; ground support available</p>
            </div>

            {/* Guest Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <User className="h-3.5 w-3.5 text-blue-600" /> Primary Guest / Traveler
              </div>
              <p className="font-bold text-slate-900 text-sm">{booking.touristName || 'Registered Guest'}</p>
              <p className="text-[11px] text-slate-500">{booking.touristPhone} {booking.touristEmail ? `· ${booking.touristEmail}` : ''}</p>
            </div>

            {/* Payment / M-Pesa */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <Receipt className="h-3.5 w-3.5 text-emerald-600" /> Total Paid &amp; M-Pesa Receipt
              </div>
              <p className="font-mono font-bold text-emerald-700 text-base">{formatPrice(booking.totalAmount)}</p>
              <p className="text-[11px] font-mono text-slate-600 font-bold">Code: {booking.mpesaReceipt || 'M-PESA-VERIFIED'}</p>
            </div>
          </div>

          {/* INCLUSIONS & AMENITIES CHECKLIST */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Guaranteed Inclusions &amp; Standards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Verified luxury accommodation voucher</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Dedicated 24/7 M-TRAVEL concierge desk</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Full booking facilitation with host/lodge</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Instant M-Pesa confirmation receipt</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary !py-2.5 !px-4 text-xs font-bold text-slate-700 flex items-center gap-1.5 border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" /> Print Voucher
              </button>
              <a
                href="tel:0722374535"
                className="btn-secondary !py-2.5 !px-4 text-xs font-bold text-slate-700 flex items-center gap-1.5 border-slate-300 hover:bg-slate-50"
              >
                <Phone className="h-3.5 w-3.5 text-teal" /> Call 0722 374 535
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 text-xs font-bold transition shadow-md flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4 fill-white" />
                Concierge WhatsApp
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold transition shadow-md flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
