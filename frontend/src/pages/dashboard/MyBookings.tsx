import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, MapPin, Calendar, Shield, RefreshCw, Trash2, Palmtree,
  Star, Download, RotateCcw, Navigation,
  CheckCircle2, Clock, TrendingUp, Zap, Share2, X, AlertTriangle,
  ChevronRight, Sparkles, Heart, Smartphone, ArrowRight, ShieldCheck, FileText, UserCheck, User,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import { useCurrency } from '@/context/CurrencyContext';
import { fetchUserBookings, cancelBookingInSupabase, supabase } from '@/lib/supabaseClient';
import { sendNotification } from '@/lib/notificationService';
import { api } from '@/lib/api';
import { OfficialReceiptModal } from '@/components/ui/OfficialReceiptModal';
import { MpesaStkPushModal } from '@/components/ui/MpesaStkPushModal';
import { DestinationVoucherModal } from '@/components/ui/DestinationVoucherModal';
import { MpesaLogo } from '@/components/ui/MpesaLogo';
import {
  getStoredBookings,
  updateBookingStatus,
  deleteBooking,
  bulkDeleteBookings,
  isTripBooking,
  type StoredBooking,
} from '@/lib/bookingStore';

export interface UnifiedBooking {
  id: string;
  bookingRef: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleName: string;
  vehicleImage: string;
  ownerId?: string;
  driverName?: string;
  driverPhone?: string;
  touristId: string;
  touristName?: string;
  touristPhone?: string;
  touristEmail?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  mpesaReceipt?: string;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  // Raw backing object
  raw?: any;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse font-bold',
  CONFIRMED:   'bg-teal/10 text-teal border border-teal/30 font-bold',
  PAID:        'bg-teal/15 text-teal border border-teal/30 font-bold',
  PENDING:     'bg-amber-50 text-amber-800 border border-amber-300 font-bold',
  COMPLETED:   'bg-slate-100 text-slate-700 border border-slate-300 font-bold',
  CANCELLED:   'bg-red-50 text-red-700 border border-red-300 font-bold',
  ACCEPTED:    'bg-blue-50 text-blue-700 border border-blue-200 font-bold',
  REJECTED:    'bg-red-50 text-red-700 border border-red-200 font-bold',
};

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'Active Trip',
  CONFIRMED:   'Confirmed',
  PAID:        'Paid & Confirmed',
  PENDING:     'Pending Payment',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
  ACCEPTED:    'Accepted',
  REJECTED:    'Rejected',
};

function filterBookings(bookings: UnifiedBooking[], tab: FilterTab): UnifiedBooking[] {
  if (tab === 'ALL')       return bookings;
  if (tab === 'ACTIVE')    return bookings.filter(b => b.status === 'IN_PROGRESS');
  if (tab === 'UPCOMING')  return bookings.filter(b => ['PENDING', 'PAID', 'CONFIRMED', 'ACCEPTED'].includes(b.status));
  if (tab === 'COMPLETED') return bookings.filter(b => b.status === 'COMPLETED');
  if (tab === 'CANCELLED') return bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status));
  return bookings;
}

function SpendingStrip({ bookings, formatPrice }: { bookings: UnifiedBooking[]; formatPrice: (p: number) => string }) {
  const now = new Date();
  const thisMonth = bookings.filter(b => {
    try {
      const d = new Date(b.startDate);
      return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  });
  const monthSpend = thisMonth.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const active    = bookings.filter(b => b.status === 'IN_PROGRESS').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'This Month', value: formatPrice(monthSpend), icon: TrendingUp,   color: 'text-amber-700' },
        { label: 'Active Trips', value: String(active),         icon: Zap,          color: 'text-emerald-700' },
        { label: 'Completed',   value: String(completed),      icon: CheckCircle2, color: 'text-teal' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</span>
          </div>
          <span className={`font-display text-2xl font-bold ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function EtaChip({ startPct = 35 }: { startPct?: number }) {
  const [pct, setPct] = useState(startPct);
  const [eta, setEta] = useState(Math.max(1, Math.round((100 - startPct) * 0.4)));
  useEffect(() => {
    const t = setInterval(() => {
      setPct(p => {
        const next = Math.min(100, p + 1.5);
        setEta(Math.max(0, Math.round((100 - next) * 0.4)));
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 animate-pulse">
      <Navigation className="h-3.5 w-3.5 text-emerald-600" />
      {eta === 0 ? 'Arrived!' : `ETA ${eta} min`}
      <span className="text-emerald-600 font-semibold">· {Math.round(pct)}%</span>
    </div>
  );
}

function TripHealthScore({ rating }: { rating: number }) {
  const score = Math.round((rating / 5) * 100);
  const color = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';
  const ring  = score >= 80 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
  const circ  = 2 * Math.PI * 28;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle cx="32" cy="32" r="28" fill="none" className={ring} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * score) / 100}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-sm ${color}`}>
          {score}
        </span>
      </div>
      <div>
        <p className="font-display font-bold text-slate-900 text-sm">Trip Health Score</p>
        <p className="text-[11px] text-slate-600 font-medium">Based on your rating</p>
        <div className="mt-1 flex gap-1 text-[10px] text-slate-600 font-semibold">
          <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5">Punctuality</span>
          <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5">Safety</span>
          <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5">Comfort</span>
        </div>
      </div>
    </div>
  );
}

function StarRating({ bookingId, onRated }: { bookingId: string; onRated: (r: number) => void }) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [done, setDone]         = useState(false);
  const submit = async (r: number) => {
    setSelected(r); setDone(true); onRated(r);
    try { await api.post('/reviews', { bookingId, rating: r }); } catch { /* silent */ }
  };
  if (done) return <TripHealthScore rating={selected} />;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold text-slate-800">Rate your trip experience</p>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(s => (
          <button key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => submit(s)} className="transition-transform hover:scale-125">
            <Star className={`h-7 w-7 transition-colors ${s <= (hovered || selected) ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-600 font-medium">{hovered ? ['','Poor','Fair','Good','Great','Excellent'][hovered] : 'Tap to rate'}</span>
      </div>
    </div>
  );
}

function TripMemoryCard({ booking, vehicle, onClose, formatPrice }: { booking: UnifiedBooking; vehicle: any; onClose: () => void; formatPrice: (p: number) => string }) {
  const start = new Date(booking.startDate);
  const end   = new Date(booking.endDate);
  const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) || 1;
  const vImg  = booking.vehicleImage || vehicle?.images?.[0]?.url || vehicle?.image_url;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-teal/20" />
        {vImg && <img src={vImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20"><X className="h-4 w-4" /></button>
        <div className="relative z-10 p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-[11px] font-bold text-amber-400 mb-4">
            <Sparkles className="h-3 w-3" /> M-TRAVEL MEMORY
          </span>
          <h2 className="font-display text-3xl font-bold text-white leading-tight">{booking.vehicleName}</h2>
          <p className="mt-1 text-slate-300 text-sm">{booking.pickupLocation || 'Nairobi ➔ Safari National Reserve'}</p>
          <div className="my-6 h-px bg-white/10" />
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Days', value: String(days) },
              { label: 'Year', value: String(start.getFullYear() || 2026) },
              { label: 'Amount', value: formatPrice(booking.totalAmount) },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="block font-display text-xl font-bold text-amber-400">{value}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
          <div className="my-6 h-px bg-white/10" />
          <div className="flex gap-3">
            <button onClick={() => {
              const text = `M-TRAVEL: ${days} days in ${booking.vehicleName} — ${formatPrice(booking.totalAmount)}`;
              if (navigator.share) navigator.share({ title: 'My M-Travel Trip', text }).catch(() => {});
              else navigator.clipboard.writeText(text).catch(() => {});
            }} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-slate-950 font-bold py-3 text-sm hover:bg-amber-300 transition">
              <Share2 className="h-4 w-4" /> Share Card
            </button>
            <button onClick={onClose} className="rounded-xl border border-white/20 px-4 text-slate-300 hover:text-white text-sm transition">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  b,
  isSelected,
  onToggleSelect,
  onTrack,
  onPayNow,
  onCancel,
  onDelete,
  formatPrice,
}: {
  b: UnifiedBooking;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onTrack: (b: UnifiedBooking) => void;
  onPayNow: (b: UnifiedBooking) => void;
  onCancel: (b: UnifiedBooking) => void | Promise<void>;
  onDelete: (b: UnifiedBooking) => void;
  formatPrice: (p: number) => string;
}) {
  const status = (b.status ?? 'PENDING') as string;
  const ref = b.bookingRef;
  const start = b.startDate;
  const end = b.endDate;
  const amount = b.totalAmount;

  let nights = 1;
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (!isNaN(s) && !isNaN(e)) {
      nights = Math.max(1, Math.round((e - s) / 86400000));
    }
  } catch {}

  const [showMemory, setShowMemory] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [ratedScore, setRatedScore] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCancelClick = async () => {
    if (confirmCancel) {
      setIsCancelling(true);
      try {
        await onCancel(b);
      } finally {
        setIsCancelling(false);
        setConfirmCancel(false);
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
      }
    } else {
      setConfirmCancel(true);
      confirmTimer.current = setTimeout(() => setConfirmCancel(false), 4500);
    }
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(b);
      setConfirmDelete(false);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    } else {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3500);
    }
  };

  const isActive = status === 'IN_PROGRESS';
  const isCompleted = status === 'COMPLETED';
  const isCancellable = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'PAID'].includes(status);
  const isDeletable = true; // Renter can delete any booking record from their personal account

  // Reusable vehicle mock for sub-modals
  const vehicleModalObj = {
    id: b.vehicleId,
    make: b.vehicleMake || b.vehicleName,
    model: b.vehicleModel || '',
    type: '4x4',
    images: [{ id: 'img-1', url: b.vehicleImage, isPrimary: true }],
    address: b.pickupLocation || 'Nairobi ➔ Safari National Reserve',
    plateNumber: 'KDA 789X',
    owner: {
      firstName: b.driverName?.split(' ')[0] || 'Samuel',
      lastName: b.driverName?.split(' ')[1] || 'Omondi',
      phone: b.driverPhone || '+254722374535',
    },
  };

  return (
    <>
      {showMemory && isCompleted && (
        <TripMemoryCard
          booking={b}
          vehicle={vehicleModalObj}
          onClose={() => setShowMemory(false)}
          formatPrice={formatPrice}
        />
      )}
      {showReceipt && isCompleted && (
        <OfficialReceiptModal
          booking={b.raw || b}
          vehicle={vehicleModalObj}
          onClose={() => setShowReceipt(false)}
        />
      )}
      <div className={`rounded-2xl border overflow-hidden transition-all duration-300 card-luxe bg-white ${
        isActive ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-400/30' : (isSelected ? 'border-amber-500 ring-2 ring-amber-400/30 shadow-md' : 'border-slate-200 shadow-sm')
      }`}>
        {b.vehicleImage && (
          <div className="relative h-36 overflow-hidden bg-slate-100">
            <img src={b.vehicleImage} alt={b.vehicleName} className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/30 to-transparent" />
            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 to-transparent" />}
            <div className="absolute bottom-3 left-4 text-white">
              <span className="font-mono text-xs text-amber-400 font-bold tracking-wider">{b.vehicleMake}</span>
              <h4 className="font-display font-bold text-base drop-shadow-sm">{b.vehicleName}</h4>
            </div>
          </div>
        )}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    checked={Boolean(isSelected)}
                    onChange={() => onToggleSelect(b.id)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    title="Select for bulk actions"
                  />
                )}
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">Ref: {ref}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                  {STATUS_LABEL[status] ?? status}
                </span>
                {isActive && <EtaChip />}
              </div>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">{b.vehicleName}</h3>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-bold text-amber-700">{formatPrice(amount)}</span>
              <span className="block text-[10px] text-slate-500 font-semibold">{nights} day(s) · {b.paymentStatus === 'PAID' ? 'M-Pesa Verified' : 'Payment Required'}</span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{start} – {end}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal shrink-0" />
              <span>{b.pickupLocation || 'Nairobi ➔ Safari National Reserve'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Full Comprehensive Insurance &amp; GPS Telemetry</span>
            </div>
          </div>

          {/* Active: driver / self-drive hirer details */}
          {isActive && (() => {
            const isDriverPkg = Boolean(
              b.raw?.hasDriver ||
              (b as any).hasDriver ||
              (b.raw?.pickupMethod && String(b.raw.pickupMethod).toUpperCase() === 'WITH_DRIVER') ||
              (b.pickupLocation && b.pickupLocation.toLowerCase().includes('driver'))
            );

            if (isDriverPkg) {
              return (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 font-bold text-white text-lg shrink-0 shadow-sm">
                    D
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">Driver <span className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md ml-1.5">Station Chauffeur</span></p>
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-medium mt-0.5">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> 4.9 · Verified Safari Chauffeur Included
                    </div>
                  </div>
                </div>
              );
            }

            // Self Drive: Traveler is the primary driver
            const travelerName = b.touristName || (b.raw?.touristName) || 'Traveler';
            const initial = travelerName.trim().charAt(0).toUpperCase() || 'T';

            return (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-teal to-emerald-700 font-bold text-white text-lg shrink-0 shadow-sm">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{travelerName} <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md ml-1.5">Self-Drive Hirer</span></p>
                  <div className="flex items-center gap-1 text-xs text-slate-600 font-medium mt-0.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Primary Driver &amp; Hirer
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Completed: rating */}
          {isCompleted && (
            <div className="space-y-3">
              {ratedScore === null ? <StarRating bookingId={b.id} onRated={setRatedScore} /> : <TripHealthScore rating={ratedScore} />}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-600 font-medium">
              {isActive
                ? (Boolean(b.raw?.hasDriver || (b as any).hasDriver)
                    ? 'Real-time driver GPS & telemetry live'
                    : 'Real-time vehicle GPS & telemetry live')
                : isCompleted
                ? 'Trip complete — thank you for exploring with M-Travel'
                : 'Manage your reservation below'}
            </span>
            <div className="flex flex-wrap gap-2">
              {/* Pay Now Button (if Pending Payment) */}
              {status === 'PENDING' && (
                <button
                  onClick={() => onPayNow(b)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#00A859] px-4 py-2 text-xs font-bold text-white hover:bg-[#008C4A] transition shadow-sm"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Pay via M-Pesa
                  <MpesaLogo variant="icon" size="sm" className="ml-1" />
                </button>
              )}

              {/* Cancel button — for active/pending bookings */}
              {isCancellable && (
                <button
                  onClick={handleCancelClick}
                  disabled={isCancelling}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                    confirmCancel
                      ? 'border-red-500 bg-red-600 text-white animate-pulse'
                      : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400'
                  }`}
                >
                  {isCancelling ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Cancelling…</span>
                    </>
                  ) : confirmCancel ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-white" />
                      <span>Confirm Cancel?</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-red-600" />
                      <span>Cancel Booking</span>
                    </>
                  )}
                </button>
              )}

              {/* Delete button — only for already cancelled/rejected */}
              {isDeletable && (
                <button onClick={handleDeleteClick}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${confirmDelete ? 'border-red-500 bg-red-100 text-red-700 animate-pulse' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-red-400 hover:text-red-700 hover:bg-red-50'}`}>
                  <Trash2 className="h-3.5 w-3.5" /> {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                </button>
              )}

              {isCompleted && (
                <>
                  <button onClick={() => setShowMemory(true)} className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm">
                    <Heart className="h-3.5 w-3.5 text-amber-600" /> Trip Memory
                  </button>
                  <Link to={`/vehicles/${b.vehicleId}?rebook=1`} className="flex items-center gap-1.5 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-xs font-bold text-teal hover:bg-teal/20 transition shadow-sm">
                    <RotateCcw className="h-3.5 w-3.5" /> Re-Book
                  </Link>
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 text-amber-600" /> Official Receipt
                  </button>
                </>
              )}

              {(() => {
                const isTrip = isTripBooking(b.raw || b);
                return (
                  <button onClick={() => onTrack(b)} className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2 shadow-sm font-bold text-white">
                    {isTrip ? <Palmtree className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                    {isTrip ? 'View Destination Details' : 'View Ride Details'}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MyBookings() {
  const authUser = useSelector(selectUser);
  const { formatPrice } = useCurrency();

  // Rehydrate safely if auth hasn't settled yet
  const user = authUser || (() => {
    try {
      const raw = localStorage.getItem('mt_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<UnifiedBooking | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // M-Pesa payment modal state
  const [showMpesa, setShowMpesa] = useState(false);
  const [mpesaBooking, setMpesaBooking] = useState<UnifiedBooking | null>(null);
  const [selectedDestVoucher, setSelectedDestVoucher] = useState<StoredBooking | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(b => b.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      bulkDeleteBookings(selectedIds);
      setSelectedIds([]);
      setShowBulkConfirm(false);
      await loadAllBookings();
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const loadAllBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Centralized persistent store (immediate local sync across all dashboards)
    const allStored = getStoredBookings();
    const userStored = allStored.filter(b => {
      if (user.id && b.touristId === user.id) return true;
      if (user.email && b.touristEmail && b.touristEmail.toLowerCase() === user.email.toLowerCase()) return true;
      if (user.email?.toLowerCase().includes('sarah') && (b.touristId === 'user-tourist-1' || b.touristName?.toLowerCase().includes('sarah'))) return true;
      return false;
    });

    const normalizedStored: UnifiedBooking[] = userStored.map(b => ({
      id: b.id,
      bookingRef: b.bookingRef || b.id,
      vehicleId: b.vehicleId || 'v-safari-1',
      vehicleMake: b.vehicleMake || '',
      vehicleModel: b.vehicleModel || '',
      vehicleName: b.vehicleName || `${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim() || 'Safari Fleet Vehicle',
      vehicleImage: b.vehicleImage || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
      ownerId: b.ownerId,
      driverName: b.driverName || 'Samuel Omondi',
      driverPhone: '+254722374535',
      touristId: b.touristId,
      touristName: b.touristName,
      touristPhone: b.touristPhone,
      touristEmail: b.touristEmail,
      startDate: b.startDate,
      endDate: b.endDate,
      totalAmount: Number(b.totalAmount || 0),
      paymentStatus: b.paymentStatus || (['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status) ? 'PAID' : 'PENDING'),
      mpesaReceipt: b.mpesaReceipt,
      status: b.status as UnifiedBooking['status'],
      createdAt: b.createdAt || new Date().toISOString(),
      pickupLocation: 'Nairobi JKIA / Westlands ➔ Safari Reserve',
      raw: b,
    }));

    // 2. Fetch from Supabase Postgres Database (if available)
    let normalizedSupa: UnifiedBooking[] = [];
    if (user.id) {
      try {
        const supaData = await fetchUserBookings(user.id);
        if (Array.isArray(supaData)) {
          normalizedSupa = supaData.map((sb: any) => {
            const vImg = Array.isArray(sb.vehicles?.vehicle_images)
              ? sb.vehicles.vehicle_images.find((img: any) => img.is_primary)?.url || sb.vehicles.vehicle_images[0]?.url
              : sb.vehicles?.image_url;
            const make = sb.vehicles?.make || 'Toyota';
            const model = sb.vehicles?.model || 'Safari Cruiser 4x4';
            return {
              id: sb.id,
              bookingRef: sb.booking_ref || `MT-${sb.id.slice(0, 8).toUpperCase()}`,
              vehicleId: sb.vehicle_id || 'v1',
              vehicleMake: make,
              vehicleModel: model,
              vehicleName: `${make} ${model}`,
              vehicleImage: vImg || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
              touristId: sb.user_id,
              startDate: sb.start_date?.split('T')[0] || sb.start_date,
              endDate: sb.end_date?.split('T')[0] || sb.end_date,
              totalAmount: Number(sb.total_amount || 0),
              paymentStatus: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(sb.status) ? 'PAID' : 'PENDING',
              status: sb.status,
              createdAt: sb.created_at || new Date().toISOString(),
              pickupLocation: 'Nairobi ➔ Safari National Reserve',
              driverName: 'Verified Safari Chauffeur',
              driverPhone: '+254722374535',
              raw: sb,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase fetch notice on MyBookings:', err);
      }
    }

    // 3. Deduplicate by booking reference / ID (favor stored bookings for rich real-time metadata)
    const map = new Map<string, UnifiedBooking>();
    for (const b of normalizedSupa) {
      const key = (b.bookingRef || b.id).toUpperCase();
      map.set(key, b);
    }
    for (const b of normalizedStored) {
      const key = (b.bookingRef || b.id).toUpperCase();
      map.set(key, b);
    }

    const merged = Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startDate).getTime();
      const timeB = new Date(b.createdAt || b.startDate).getTime();
      return timeB - timeA;
    });

    setBookings(merged);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadAllBookings();

    const handleUpdate = () => {
      loadAllBookings();
    };

    window.addEventListener('mt_booking_updated', handleUpdate);
    window.addEventListener('mt_booking_status_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const channel = supabase
      .channel('tourist-my-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadAllBookings();
      })
      .subscribe();

    return () => {
      window.removeEventListener('mt_booking_updated', handleUpdate);
      window.removeEventListener('mt_booking_status_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [loadAllBookings]);

  const handleCancelBooking = async (b: UnifiedBooking) => {
    // 1. Optimistic immediate UI update
    setBookings((prev) =>
      prev.map((item) =>
        item.id === b.id || (b.bookingRef && item.bookingRef === b.bookingRef)
          ? { ...item, status: 'CANCELLED' }
          : item
      )
    );

    // 2. Update local storage bookingStore by both ID and Ref
    updateBookingStatus(b.id, 'CANCELLED');
    if (b.bookingRef && b.bookingRef !== b.id) {
      updateBookingStatus(b.bookingRef, 'CANCELLED');
    }

    // 3. Ensure this booking is saved with status 'CANCELLED' in mt_shared_bookings_v2
    try {
      const stored = getStoredBookings();
      const matchIndex = stored.findIndex(
        (item) =>
          item.id === b.id ||
          (b.bookingRef && item.bookingRef === b.bookingRef) ||
          (item.bookingRef && item.bookingRef.toUpperCase() === (b.bookingRef || b.id).toUpperCase())
      );
      if (matchIndex >= 0) {
        stored[matchIndex].status = 'CANCELLED';
        localStorage.setItem('mt_shared_bookings_v2', JSON.stringify(stored));
      } else {
        const newEntry: StoredBooking = {
          id: b.id,
          bookingRef: b.bookingRef,
          vehicleId: b.vehicleId,
          vehicleMake: b.vehicleMake,
          vehicleModel: b.vehicleModel,
          vehicleName: b.vehicleName,
          vehicleImage: b.vehicleImage,
          ownerId: b.ownerId,
          driverName: b.driverName,
          touristId: b.touristId || user?.id || 'tourist',
          touristName: b.touristName || user?.firstName || 'Traveler',
          touristPhone: b.touristPhone || user?.phone || '0712345678',
          touristEmail: b.touristEmail,
          startDate: b.startDate,
          endDate: b.endDate,
          totalAmount: b.totalAmount,
          paymentStatus: 'PENDING',
          status: 'CANCELLED',
          createdAt: b.createdAt,
        };
        stored.unshift(newEntry);
        localStorage.setItem('mt_shared_bookings_v2', JSON.stringify(stored));
      }
    } catch {}

    // 4. Update Supabase database
    try {
      if (b.id) await cancelBookingInSupabase(b.id);
      if (b.bookingRef) await cancelBookingInSupabase(b.bookingRef);
    } catch (err) {
      console.warn('Supabase booking cancel error:', err);
    }

    // 5. Send notifications
    try {
      sendNotification({
        recipientId: b.touristId || user?.id || 'tourist',
        role: 'TOURIST',
        type: 'BOOKING_CANCELLED_TOURIST',
        title: `Booking Cancelled: ${b.vehicleName}`,
        message: `Your reservation (Ref: ${b.bookingRef}) has been successfully cancelled.`,
        link: '/dashboard/bookings',
      });
      if (b.ownerId) {
        sendNotification({
          recipientId: b.ownerId,
          role: 'VEHICLE_OWNER',
          type: 'BOOKING_CANCELLED_HOST',
          title: `Booking Cancelled: ${b.vehicleName}`,
          message: `Tourist cancelled booking Ref: ${b.bookingRef}. Vehicle has been freed.`,
          link: '/dashboard/owner',
        });
      }
    } catch {}

    // 6. Broadcast event notifications
    window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: { ...b, status: 'CANCELLED' } }));
    window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: { ...b, status: 'CANCELLED' } }));

    // 7. Re-sync from sources
    await loadAllBookings();
  };

  const handleDeleteBooking = async (b: UnifiedBooking) => {
    deleteBooking(b.id);
    try {
      await supabase.from('bookings').delete().eq('id', b.id);
    } catch {}
    loadAllBookings();
  };

  const handlePayNow = (b: UnifiedBooking) => {
    setMpesaBooking(b);
    setShowMpesa(true);
  };

  const displayBookings = bookings;
  const filtered = filterBookings(displayBookings, activeTab);

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL',       label: 'All',       count: displayBookings.length },
    { key: 'ACTIVE',    label: 'Active',    count: displayBookings.filter(b => b.status === 'IN_PROGRESS').length },
    { key: 'UPCOMING',  label: 'Upcoming',  count: displayBookings.filter(b => ['PENDING','PAID','CONFIRMED','ACCEPTED'].includes(b.status)).length },
    { key: 'COMPLETED', label: 'Completed', count: displayBookings.filter(b => b.status === 'COMPLETED').length },
    { key: 'CANCELLED', label: 'Cancelled', count: displayBookings.filter(b => ['CANCELLED','REJECTED'].includes(b.status)).length },
  ];



  const handleDownloadVoucher = (b: UnifiedBooking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>M-TRAVEL Voucher & Verification Receipt - ${b.bookingRef}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #f59e0b; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .brand { font-size: 24px; font-weight: bold; color: #5c0632; }
            .ref { font-family: monospace; font-size: 16px; color: #b45309; font-weight: bold; }
            .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .notice-box { background: #fffbebf5; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
            .notice-title { font-weight: bold; color: #78350f; font-size: 14px; text-transform: uppercase; margin-bottom: 8px; }
            .notice-list { margin: 8px 0; padding-left: 20px; font-weight: 600; color: #1e293b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .val { font-weight: bold; font-size: 15px; }
            .footer { border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">M-TRAVEL EAST AFRICA</div>
              <div style="font-size:12px; color:#64748b;">Luxury Vehicle Rental & Safari Expedition Pass</div>
            </div>
            <div class="ref">REF: ${b.bookingRef}</div>
          </div>

          <div class="notice-box">
            <div class="notice-title">⚠️ Mandatory Vehicle Handover Document Requirements</div>
            <p style="font-size:13px; margin:0;">Please bring the following original identity credentials to the M-TRAVEL station at pickup for physical inspection by our fleet agents:</p>
            <ul class="notice-list">
              <li>Original National ID Card or Valid International Passport (Mandatory for all renters)</li>
              <li>Valid National Driving License (Mandatory for Self-Drive vehicle hires)</li>
            </ul>
            <div style="font-size:11px; color:#92400e; font-style:italic;">Key release and vehicle activation are strictly contingent on physical document verification.</div>
          </div>

          <div class="section">
            <div style="font-weight:bold; font-size:16px; margin-bottom:15px; color:#0f172a;">Reserved Vehicle Details</div>
            <div class="grid">
              <div>
                <div class="label">Vehicle Model</div>
                <div class="val">${b.vehicleName}</div>
              </div>
              <div>
                <div class="label">Total Amount Paid</div>
                <div class="val" style="color:#059669;">KES ${b.totalAmount.toLocaleString()} (Verified)</div>
              </div>
            </div>
            <div class="grid">
              <div>
                <div class="label">Rental Pickup Date</div>
                <div class="val">${b.startDate}</div>
              </div>
              <div>
                <div class="label">Return End Date</div>
                <div class="val">${b.endDate}</div>
              </div>
            </div>
            <div class="grid">
              <div>
                <div class="label">Pickup Station</div>
                <div class="val">${b.pickupLocation || 'Westlands Fleet Hub, Nairobi'}</div>
              </div>
              <div>
                <div class="label">Assigned Driver / Service Mode</div>
                <div class="val">${(b.raw?.hasDriver || (b as any).hasDriver) ? 'Professional Safari Chauffeur (Station Chauffeur Included)' : `${b.touristName || 'Traveler'} (Self-Drive Hirer)`}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Official M-TRAVEL Digital Voucher • East Africa Luxury Travel Network • 24/7 Support: +254 722 374 535
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* ── VEHICLE RIDE & RENTAL DETAILS MODAL (NO GPS TRACKER) ── */}
      {activeTrackingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md font-display">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800 space-y-4">
            <button
              onClick={() => setActiveTrackingBooking(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-amber-700">Booked Vehicle &amp; Ride Details</span>
                <h3 className="font-display text-lg font-bold text-slate-900">{activeTrackingBooking.vehicleName}</h3>
              </div>
            </div>

            {activeTrackingBooking.vehicleImage && (
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                <img src={activeTrackingBooking.vehicleImage} alt={activeTrackingBooking.vehicleName} className="h-full w-full object-cover" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg">
                  Ref: {activeTrackingBooking.bookingRef}
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-400">
                  {activeTrackingBooking.status === 'IN_PROGRESS' ? 'Active Trip' : activeTrackingBooking.status}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-slate-400">Rental Period</p>
                <p className="font-semibold text-slate-800 mt-1">{activeTrackingBooking.startDate}</p>
                <p className="text-[11px] text-slate-500">to {activeTrackingBooking.endDate}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Amount</p>
                <p className="font-mono font-bold text-amber-700 text-base mt-0.5">{formatPrice(activeTrackingBooking.totalAmount)}</p>
                <p className="text-[10px] text-emerald-700 font-bold">Payment Verified</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Pickup Location:</strong> {activeTrackingBooking.pickupLocation || 'Westlands Fleet Hub, Nairobi'}
                </div>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Dropoff Destination:</strong> {activeTrackingBooking.dropoffLocation || 'Maasai Mara / Reserved Station'}
                </div>
              </div>
            </div>



            {/* MANDATORY HANDOVER DOCUMENT VERIFICATION NOTICE */}
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-amber-100/50 to-orange-50 p-4 text-xs space-y-2 shadow-sm">
              <div className="flex items-center gap-2 font-display font-bold text-amber-900 uppercase tracking-wider text-[11px] border-b border-amber-200 pb-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Mandatory Handover Document Notice</span>
              </div>
              <p className="text-slate-800 text-[11px] leading-relaxed font-semibold">
                Please present the following physical documents to the M-TRAVEL representative at vehicle pickup for identity verification &amp; fleet security:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-slate-900 pt-1">
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/80">
                  <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>National ID or International Passport</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/80">
                  <Car className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Valid Driving License (Self-Drive)</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Full Comprehensive Insurance &amp; 24/7 Roadside Assistance Included.</span>
            </div>

            <button
              onClick={() => handleDownloadVoucher(activeTrackingBooking)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 text-xs font-bold shadow-sm transition"
            >
              <Download className="h-4 w-4" /> Download Official Verification Voucher &amp; Receipt (PDF)
            </button>

            <button
              onClick={() => setActiveTrackingBooking(null)}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-xs font-bold hover:bg-slate-800 transition"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Destination Voucher Modal */}
      {selectedDestVoucher && (
        <DestinationVoucherModal
          booking={selectedDestVoucher}
          onClose={() => setSelectedDestVoucher(null)}
        />
      )}

      {/* M-Pesa STK Push Payment Modal */}
      {showMpesa && mpesaBooking && (
        <MpesaStkPushModal
          onClose={() => {
            setShowMpesa(false);
            setMpesaBooking(null);
          }}
          amount={mpesaBooking.totalAmount}
          bookingRef={mpesaBooking.bookingRef}
          vehicleName={mpesaBooking.vehicleName}
          touristPhone={mpesaBooking.touristPhone || user?.phone || '0712345678'}
          onSuccess={(receipt) => {
            updateBookingStatus(mpesaBooking.id, 'PAID', receipt);
            loadAllBookings();
            setShowMpesa(false);
            setMpesaBooking(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-teal">
            <Car className="h-3.5 w-3.5" /> Traveler Reservations &amp; Telemetry
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">My Bookings &amp; Rides</h1>
          {user && (
            <p className="mt-1 text-sm text-slate-600 font-medium">
              Welcome back, <span className="text-amber-700 font-bold">{user.firstName || user.email}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/catalogue?category=vehicles"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold shadow-sm transition"
          >
            <Car className="h-3.5 w-3.5" /> Explore Fleet
          </Link>
          <button
            onClick={() => loadAllBookings()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-600 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Spending Strip */}
      <SpendingStrip bookings={displayBookings} formatPrice={formatPrice} />

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === key ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === key ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading && displayBookings.length === 0 && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Synchronizing your reservations…</p>
        </div>
      )}

      {/* Bulk Action Bar */}
      {!isLoading && filtered.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              Select All ({filtered.length})
            </label>
            {selectedIds.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                {selectedIds.length} selected
              </span>
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              {showBulkConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600 animate-pulse">Delete {selectedIds.length} booking(s)?</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
                  >
                    {isBulkDeleting ? 'Deleting...' : 'Yes, Delete All'}
                  </button>
                  <button
                    onClick={() => setShowBulkConfirm(false)}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBulkConfirm(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-400 transition shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        {!isLoading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <Clock className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-display text-lg font-bold text-slate-700">No bookings in this category</p>
            <p className="text-sm text-slate-500 mt-1 font-medium max-w-sm">
              {activeTab === 'ALL'
                ? 'You do not have any vehicle reservations under this account yet. Discover our inspected safari fleet and private chauffeurs.'
                : 'Switch tabs or browse our luxury vehicles to make a reservation.'}
            </p>
            <Link
              to="/catalogue?category=vehicles"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition"
            >
              <Car className="h-3.5 w-3.5" /> Browse Luxury Fleet <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          filtered.map((b) => (
            <BookingCard
              key={b.id}
              b={b}
              isSelected={selectedIds.includes(b.id)}
              onToggleSelect={toggleSelect}
              onTrack={(item) => {
                if (isTripBooking(item.raw || item)) {
                  setSelectedDestVoucher((item.raw || item) as StoredBooking);
                } else {
                  setActiveTrackingBooking(item);
                }
              }}
              onPayNow={handlePayNow}
              onCancel={handleCancelBooking}
              onDelete={handleDeleteBooking}
              formatPrice={formatPrice}
            />
          ))
        )}
      </div>
    </div>
  );
}
