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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto text-slate-900 font-sans">
        {/* GOLD LUXURY ACCENT LINE */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shrink-0" />

        {/* HERO IMAGE & TITLE HEADER */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-950 overflow-hidden shrink-0">
          {booking.vehicleImage ? (
            <img
              src={booking.vehicleImage}
              alt={booking.vehicleName}
              className="h-full w-full object-cover opacity-85"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40 flex items-center justify-center">
              <Palmtree className="h-16 w-16 text-amber-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-slate-950/80 hover:bg-black text-white px-3.5 py-1.5 text-xs font-bold border border-white/20 backdrop-blur-md shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            title="Close Page"
          >
            <X className="h-4 w-4" /> Close Page
          </button>

          {/* Badge & Ref */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/25 border border-amber-300/40 px-3 py-0.5 text-[11px] font-bold text-amber-200 uppercase tracking-widest backdrop-blur-md">
                <Palmtree className="h-3 w-3 text-amber-300" /> Holiday Destination Reservation
              </span>
              <span className="font-mono text-xs text-slate-300 bg-black/50 px-2.5 py-0.5 rounded-md border border-white/15">
                Ref: {booking.bookingRef}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-white drop-shadow-md">
              {booking.vehicleName}
            </h2>
          </div>
        </div>

        {/* SCROLLABLE BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
          {/* FACILITATION STATUS NOTICE (SYSTEM LUXURY AMBER THEME) */}
          <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Ground Arrangements Facilitation Active</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              This reservation is managed as a <strong className="text-slate-950 font-bold">Curated Destination &amp; Holiday Stay</strong> (not a standard car ride). The M-TRAVEL concierge operations desk has notified the property and is facilitating all lodge bookings, park clearance, and safari guide coordination on your behalf.
            </p>
          </div>

          {/* SUMMARY GRID (WELL-FITTED 4-COLUMN RESPONSIVE LAYOUT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Stay Duration */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 flex flex-col justify-between hover:border-slate-300 transition shadow-2xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold uppercase tracking-wider text-[10px]">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                <span>Stay Duration ({nights} Night{nights > 1 ? 's' : ''})</span>
              </div>
              <div>
                <p className="font-bold text-slate-950 text-sm">{startDate}</p>
                <p className="text-xs text-slate-500 font-medium">➔ {endDate}</p>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                Check-in: 12:00 PM · Out: 10:00 AM
              </p>
            </div>

            {/* Location */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 flex flex-col justify-between hover:border-slate-300 transition shadow-2xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <span className="p-1.5 rounded-lg bg-slate-200 text-slate-800">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span>Destination Location</span>
              </div>
              <div>
                <p className="font-bold text-slate-950 text-sm line-clamp-1">{booking.pickupLocation || 'Kenya Safari Region'}</p>
                <p className="text-xs text-slate-500 font-medium">{booking.destinationLocation || 'East Africa'}</p>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                Concierge transfer &amp; support available
              </p>
            </div>

            {/* Guest Details */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 flex flex-col justify-between hover:border-slate-300 transition shadow-2xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <span className="p-1.5 rounded-lg bg-slate-200 text-slate-800">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span>Primary Guest</span>
              </div>
              <div>
                <p className="font-bold text-slate-950 text-sm">{booking.touristName || 'Registered Guest'}</p>
                <p className="text-xs text-slate-500 font-medium truncate">{booking.touristPhone}</p>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 truncate">
                {booking.touristEmail || 'traveler@mtravel.co.ke'}
              </p>
            </div>

            {/* Payment & Receipt */}
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 space-y-2 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                  <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700">
                    <Receipt className="h-3.5 w-3.5" />
                  </span>
                  <span>Total Paid</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Verified
                </span>
              </div>
              <div>
                <p className="font-mono font-bold text-emerald-700 text-lg leading-tight">
                  {formatPrice(booking.totalAmount)}
                </p>
                <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                  Code: {booking.mpesaReceipt || 'M-PESA-VERIFIED'}
                </p>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium pt-1 border-t border-emerald-200/60">
                M-Pesa Official Receipt Issued
              </p>
            </div>
          </div>

          {/* INCLUSIONS & AMENITIES CHECKLIST */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Guaranteed Inclusions &amp; Standards</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700 font-medium">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verified luxury accommodation voucher</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dedicated 24/7 M-TRAVEL concierge desk</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Full booking facilitation with host/lodge</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant M-Pesa confirmation receipt</span>
              </div>
            </div>
          </div>
        </div>

        {/* PINNED BOTTOM ACTION BAR */}
        <div className="border-t border-slate-200 bg-slate-50/90 p-4 sm:px-7 py-3.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary !py-2.5 !px-4 text-xs font-bold text-slate-800 flex items-center gap-1.5 border-slate-300 hover:bg-white shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-700" />
              <span>Print Voucher</span>
            </button>
            <a
              href="tel:0722374535"
              className="btn-secondary !py-2.5 !px-4 text-xs font-bold text-slate-800 flex items-center gap-1.5 border-slate-300 hover:bg-white shadow-2xs"
            >
              <Phone className="h-3.5 w-3.5 text-amber-600" />
              <span>0722 374 535</span>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 fill-white" />
              <span>Concierge WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary !py-2.5 !px-5 text-xs font-bold cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Close Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
