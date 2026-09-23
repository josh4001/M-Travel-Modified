import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Car, Calendar, Wallet, MapPin, Star, Clock, Search,
  CheckCircle, XCircle, AlertCircle, ArrowRight, TrendingUp, Smartphone, X,
  Compass, Mountain, Trees, Waves, Sparkles, Bell, Palmtree, User, Shield
} from 'lucide-react';
import type { RootState } from '@/store';
import { supabase, cancelBookingInSupabase } from '@/lib/supabaseClient';
import { useCurrency } from '@/context/CurrencyContext';
import { fetchNotifications, type AppNotification } from '@/lib/notificationService';
import {
  getStoredBookings, syncBookingsFromSupabase, updateBookingStatus, isTripBooking,
  type StoredBooking
} from '@/lib/bookingStore';
import { MpesaStkPushModal } from '@/components/ui/MpesaStkPushModal';
import { MpesaLogo } from '@/components/ui/MpesaLogo';
import { DestinationVoucherModal } from '@/components/ui/DestinationVoucherModal';
import { getTravelerCreditProfile } from '@/lib/creditScoreStore';

interface WalletData {
  balance: number;
  currency: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: 'Pending Payment', color: 'text-amber-700 bg-amber-50 border-amber-200',        icon: AlertCircle },
  PAID:        { label: 'Paid',            color: 'text-teal-700 bg-teal-50 border-teal-200',          icon: CheckCircle },
  ACCEPTED:    { label: 'Accepted',        color: 'text-blue-700 bg-blue-50 border-blue-200',          icon: CheckCircle },
  CONFIRMED:   { label: 'Confirmed',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200',  icon: CheckCircle },
  IN_PROGRESS: { label: 'On Road',         color: 'text-emerald-700 bg-emerald-50 border-emerald-300 animate-pulse', icon: Car },
  COMPLETED:   { label: 'Completed',       color: 'text-slate-600 bg-slate-100 border-slate-200',      icon: CheckCircle },
  CANCELLED:   { label: 'Cancelled',       color: 'text-rose-700 bg-rose-50 border-rose-200',          icon: XCircle },
  REJECTED:    { label: 'Rejected',        color: 'text-rose-700 bg-rose-50 border-rose-200',          icon: XCircle },
};

export default function TouristDashboard() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { formatPrice } = useCurrency();
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [storeBookings, setStoreBookings] = useState<StoredBooking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDestVoucher, setSelectedDestVoucher] = useState<StoredBooking | null>(null);

  // M-Pesa STK push modal
  const [showMpesa, setShowMpesa] = useState(false);
  const [mpesaBooking, setMpesaBooking] = useState<StoredBooking | null>(null);

  // Profile Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Cancel confirmation
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);

    // Sync remote Supabase bookings first for cross-device parity
    await syncBookingsFromSupabase().catch(() => []);

    const allStored = getStoredBookings();
    // Strict data privacy: Only show bookings that belong to this tourist account
    const relevant = user?.id 
      ? allStored.filter(b => 
          b.touristId === user.id || 
          (user.email && b.touristEmail?.toLowerCase() === user.email.toLowerCase())
        ) 
      : [];
    setStoreBookings(relevant);

    if (user?.id) {
      try {
        const notifs = await fetchNotifications(user.id, 'TOURIST');
        setNotifications(notifs);

        const [bookRes, walRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, vehicles(make, model, type, vehicle_images(url, is_primary))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('wallets')
            .select('balance, currency')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);
        setDbBookings(bookRes.data ?? []);
        if (walRes.data) setWallet({ balance: walRes.data.balance, currency: walRes.data.currency });
      } catch (e) {
        console.warn('Supabase fetch error:', e);
      }
    } else {
      setNotifications([]);
      setDbBookings([]);
      setWallet(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();

    const handleStoreUpdate = () => {
      if (!user?.id) {
        setStoreBookings([]);
        return;
      }
      const all = getStoredBookings();
      setStoreBookings(all.filter(b => 
        b.touristId === user.id || 
        (user.email && b.touristEmail?.toLowerCase() === user.email.toLowerCase())
      ));
    };

    const handleNotifUpdate = () => {
      if (user?.id) {
        fetchNotifications(user.id, 'TOURIST').then(setNotifications);
      }
    };

    window.addEventListener('mt_booking_updated', handleStoreUpdate);
    window.addEventListener('mt_booking_status_changed', handleStoreUpdate);
    window.addEventListener('mt_notification_received', handleNotifUpdate);
    window.addEventListener('mt_remote_change', refreshData);

    const channel = supabase
      .channel('tourist-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => refreshData())
      .subscribe();

    return () => {
      window.removeEventListener('mt_booking_updated', handleStoreUpdate);
      window.removeEventListener('mt_booking_status_changed', handleStoreUpdate);
      window.removeEventListener('mt_notification_received', handleNotifUpdate);
      window.removeEventListener('mt_remote_change', refreshData);
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email]);

  const allStoreBookings = storeBookings;
  const active    = allStoreBookings.filter(b => ['PAID', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
  const pending   = allStoreBookings.filter(b => b.status === 'PENDING');
  const completed = allStoreBookings.filter(b => b.status === 'COMPLETED');
  const spent     = completed.reduce((s, b) => s + b.totalAmount, 0);
  const dbCompleted = dbBookings.filter(b => b.status === 'COMPLETED').length;
  const dbSpent     = dbBookings.filter(b => b.status === 'COMPLETED').reduce((s: number, b: any) => s + Number(b.total_amount), 0);

  const handlePayNow = (booking: StoredBooking) => { setMpesaBooking(booking); setShowMpesa(true); };
  const handlePaymentSuccess = (_ref: string) => {
    if (!mpesaBooking) return;
    updateBookingStatus(mpesaBooking.id, 'CONFIRMED');
    setShowMpesa(false);
    setMpesaBooking(null);
  };


  const handleCancelBooking = async (bookingId: string) => {
    if (cancelConfirm === bookingId) {
      updateBookingStatus(bookingId, 'CANCELLED');
      try {
        await cancelBookingInSupabase(bookingId);
      } catch {}
      setCancelConfirm(null);
      refreshData();
    } else {
      setCancelConfirm(bookingId);
      setTimeout(() => setCancelConfirm(null), 4000);
    }
  };

  return (
    /* ── LIGHT PAGE SHELL ─────────────────────────────────────── */
    <div className="min-h-screen bg-[#F8F7F4] font-display text-slate-800 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">

        {/* ── WELCOME HEADER ──────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mtravel-burgundy via-mtravel-darkBurgundy to-mtravel-obsidian p-8 shadow-xl">
          {/* decorative glow blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-mtravel-gold/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-mtravel-gold/10 blur-2xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mtravel-gold/40 bg-mtravel-gold/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-mtravel-lightGold">
              <Sparkles className="h-3 w-3 text-mtravel-lightGold" />
              <span>Tourist Portal</span>
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold text-white">
              Welcome back, {user?.firstName ?? 'Traveler'}
            </h1>
            <p className="mt-1.5 text-sm text-white/70">
              Explore Kenya's finest vehicles and unforgettable experiences.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition backdrop-blur-xs cursor-pointer"
              >
                <User className="h-4 w-4 text-mtravel-lightGold" /> My Profile &amp; Credit Score
              </button>
              {pending.length > 0 && (
                <button
                  onClick={() => handlePayNow(pending[0])}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/20 px-6 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-400/30"
                >
                  <Smartphone className="h-4 w-4" /> Pay Now via M-Pesa ({pending.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Bookings',  value: allStoreBookings.length + dbBookings.length, icon: Calendar,    accent: '#5C0632', light: '#FDF2F5' },
            { label: 'Active Trips',    value: active.length,                               icon: Car,         accent: '#17A398', light: '#F0FAFA' },
            { label: 'Trips Completed', value: completed.length + dbCompleted,              icon: CheckCircle, accent: '#059669', light: '#F0FDF4' },
            { label: 'Total Spent',     value: formatPrice(spent + dbSpent),                icon: TrendingUp,  accent: '#B45309', light: '#FFFBEB' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.light }}
              >
                <s.icon className="h-5 w-5" style={{ color: s.accent }} />
              </div>
              <p className="mt-3 font-mono text-xl font-bold text-slate-800">{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── KENYA SAFARI HERO IMAGE BANNER ───────────────────── */}
        <div className="relative overflow-hidden rounded-3xl shadow-md h-52 sm:h-64">
          <img
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80"
            alt="Kenya Safari"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-mtravel-obsidian/80 via-mtravel-obsidian/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center pl-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mtravel-gold/50 bg-mtravel-gold/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-mtravel-lightGold w-fit mb-3">
              <MapPin className="h-3 w-3" /> Explore Kenya
            </span>
            <h2 className="font-serif text-2xl font-bold text-white drop-shadow">
              Your next safari awaits
            </h2>
            <p className="mt-1 text-sm text-white/70 max-w-xs">
              Nairobi · Maasai Mara · Diani Beach · Amboseli · Nakuru
            </p>
          </div>
        </div>

        {/* ── MAIN CONTENT + SIDEBAR ───────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* BOOKINGS LIST ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-slate-800">
                <Calendar className="h-5 w-5 text-mtravel-burgundy" /> My Bookings
              </h2>
              <Link
                to="/dashboard/bookings"
                className="text-xs font-semibold text-mtravel-burgundy hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-8 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-mtravel-burgundy border-t-transparent" />
                <p className="mt-3 text-sm text-slate-500">Loading your bookings…</p>
              </div>
            )}

            {!loading && allStoreBookings.length === 0 && dbBookings.length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center shadow-sm">
                <Car className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 font-serif text-lg text-slate-700">No bookings yet</p>
                <p className="mt-1 text-sm text-slate-500">Start your East African adventure today.</p>
              </div>
            )}

            {/* STORE BOOKINGS */}
            {allStoreBookings.map(b => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['PENDING'];
              const canCancel = ['PENDING', 'PAID', 'ACCEPTED', 'CONFIRMED'].includes(b.status);
              const isDest = isTripBooking(b);
              return (
                <div
                  key={b.id}
                  className="flex gap-4 overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm transition hover:shadow-md hover:border-slate-300"
                >
                  {/* Vehicle thumbnail */}
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {b.vehicleImage ? (
                      <img src={b.vehicleImage} alt="vehicle" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-bold text-slate-900">{b.vehicleName}</p>
                        <p className="text-xs text-slate-500 font-mono">{b.bookingRef}</p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {b.startDate} — {b.endDate}
                      </span>
                      <span className="ml-auto font-mono font-bold text-mtravel-burgundy text-sm">
                        {formatPrice(b.totalAmount)}
                      </span>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handlePayNow(b)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#00A859] px-4 py-2 text-xs font-bold text-white hover:bg-[#008C4A] transition shadow"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          Pay via M-Pesa
                          <MpesaLogo variant="icon" size="sm" className="ml-1" />
                        </button>
                      )}
                      {['CONFIRMED', 'IN_PROGRESS', 'PAID', 'ACCEPTED'].includes(b.status) && (
                        isDest ? (
                          <button
                            onClick={() => setSelectedDestVoucher(b)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white hover:from-purple-800 hover:to-indigo-800 transition shadow"
                          >
                            <Palmtree className="h-3.5 w-3.5 text-amber-300" />
                            View Destination
                          </button>
                        ) : (
                          <Link
                            to="/dashboard/bookings"
                            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow"
                          >
                            <Car className="h-3.5 w-3.5 text-amber-400" />
                            View Rental Details
                          </Link>
                        )
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow border ${
                            cancelConfirm === b.id
                              ? 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse'
                              : 'bg-white border-rose-200 text-rose-500 hover:bg-rose-50'
                          }`}
                        >
                          <X className="h-3.5 w-3.5" />
                          {cancelConfirm === b.id ? 'Confirm Cancel?' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* DB BOOKINGS (legacy from Supabase) */}
            {allStoreBookings.length === 0 && dbBookings.map((b: any) => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['PENDING'];
              const img = b.vehicles?.vehicle_images?.find((i: any) => i.is_primary)?.url;
              const nights = Math.max(1, Math.ceil(
                (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000
              ));
              return (
                <div
                  key={b.id}
                  className="flex gap-4 overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm transition hover:shadow-md hover:border-slate-300"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {img ? (
                      <img src={img} alt="vehicle" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-bold text-slate-900">
                          {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : 'Vehicle'}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{b.booking_ref}</p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(b.start_date).toLocaleDateString('en-KE')} — {new Date(b.end_date).toLocaleDateString('en-KE')}
                      </span>
                      <span>{nights} night{nights > 1 ? 's' : ''}</span>
                      <span className="ml-auto font-mono font-bold text-mtravel-burgundy text-sm">
                        {formatPrice(b.total_amount)}
                      </span>
                    </div>

                    {['CONFIRMED', 'IN_PROGRESS', 'ACCEPTED'].includes(b.status) && (
                      <Link
                        to={`/vehicles/${b.id}`}
                        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
                      >
                        <MapPin className="h-3.5 w-3.5 animate-pulse" /> Track Trip Live (GPS)
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── SIDEBAR ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* WALLET CARD */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-serif font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Wallet className="h-4 w-4 text-amber-600" />
                </div>
                My Wallet
              </h3>
              {wallet ? (
                <>
                  <p className="mt-4 font-mono text-3xl font-bold text-slate-900">
                    {wallet.currency} {Number(wallet.balance).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Available balance</p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to="/dashboard/wallet"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Top Up
                    </Link>
                    <Link
                      to="/dashboard/wallet"
                      className="flex-1 rounded-xl border border-mtravel-burgundy/20 bg-mtravel-burgundy/5 py-2 text-center text-xs font-semibold text-mtravel-burgundy hover:bg-mtravel-burgundy/10 transition"
                    >
                      Transactions
                    </Link>
                  </div>
                </>
              ) : (
                <div className="mt-4 text-center text-slate-400 text-sm py-4">
                  {loading ? 'Loading wallet…' : 'Wallet not set up yet'}
                </div>
              )}
            </div>

            {/* M-PESA CARD */}
            <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MpesaLogo variant="badge" size="sm" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lipa Na M-Pesa</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay securely with M-Pesa STK Push. An instant prompt will appear on your phone for PIN confirmation.
              </p>
              {pending.length > 0 && (
                <button
                  onClick={() => handlePayNow(pending[0])}
                  className="mt-3 w-full rounded-xl bg-[#00A859] py-2.5 text-sm font-bold text-white hover:bg-[#008C4A] transition flex items-center justify-center gap-2 shadow"
                >
                  <Smartphone className="h-4 w-4" /> Pay Pending Booking
                </button>
              )}
            </div>

            {/* ACCOUNT ALERTS & NOTIFICATIONS (Strictly isolated) */}
            {notifications.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                      <Bell className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Account Alerts</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {notifications.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n.id} className="pt-2 first:pt-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-mono">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm">
              <h3 className="font-display font-semibold text-slate-500 text-xs uppercase tracking-wider mb-3">Quick Actions</h3>
              {[
                { to: '/dashboard/bookings', icon: Calendar, label: 'All Bookings & Rides', accent: '#F5A623' },
                { to: '/dashboard/wallet',   icon: Wallet,   label: 'Wallet & Payments',  accent: '#059669' },
                { to: '/contact',            icon: Star,     label: 'Contact Support',    accent: '#5C0632' },
              ].map(a => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200/60 transition shadow-sm">
                    <a.icon className="h-4 w-4" style={{ color: a.accent }} />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 transition">{a.label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                </Link>
              ))}
            </div>

            {/* TRAVEL TIPS */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Travel Tips
              </p>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span><strong>Maasai Mara:</strong> Peak safari migration July–Oct</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mountain className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  <span><strong>Mount Kenya:</strong> Optimal trekking window Jan–Feb</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trees className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Amboseli:</strong> Superb Kilimanjaro wildlife views</span>
                </li>
                <li className="flex items-center gap-2">
                  <Waves className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span><strong>Diani Beach:</strong> Calm coastal waters Nov–Apr</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* ── M-PESA STK PUSH MODAL ──────────────────────────────── */}
      {showMpesa && mpesaBooking && (
        <MpesaStkPushModal
          bookingId={mpesaBooking.id}
          bookingRef={mpesaBooking.bookingRef}
          amount={mpesaBooking.totalAmount}
          vehicleName={mpesaBooking.vehicleName}
          touristPhone={user?.phone ?? ''}
          onSuccess={handlePaymentSuccess}
          onClose={() => { setShowMpesa(false); setMpesaBooking(null); }}
        />
      )}
      {/* ── DESTINATION VOUCHER & ITINERARY MODAL ────────────────── */}
      {selectedDestVoucher && (
        <DestinationVoucherModal
          booking={selectedDestVoucher}
          onClose={() => setSelectedDestVoucher(null)}
        />
      )}

      {/* ── TRAVELER ACCOUNT PROFILE & CREDIT RATING MODAL ── */}
      {showProfileModal && (() => {
        const creditProfile = getTravelerCreditProfile(user?.id || 'user-tourist-1', {
          name: `${user?.firstName || 'Sarah'} ${user?.lastName || 'Ochieng'}`.trim(),
          email: user?.email || 'sarah.ochieng@gmail.com',
          phone: user?.phone || '0712345678',
        });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md font-display">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-700">Account Credentials &amp; Rating</span>
                  <h3 className="font-display text-xl font-bold text-slate-900">{user?.firstName || 'Sarah'} {user?.lastName || 'Ochieng'}</h3>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Verified Traveler Account</span>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-semibold">Registered Email:</span>
                  <span className="font-mono font-bold text-slate-900">{user?.email || 'sarah.ochieng@gmail.com'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-semibold">Contact Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{user?.phone || '0712345678'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Account Role:</span>
                  <span className="font-bold text-amber-700">Tourist / Traveler</span>
                </div>
              </div>

              {/* Traveler Credit Score Card */}
              <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-amber-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-amber-600" /> Traveler Credit Rating
                  </span>
                  <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                    {creditProfile.tier}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-bold text-slate-900">{creditProfile.score}</span>
                  <span className="text-slate-500 text-sm font-semibold">/ 850 Max Score</span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  Your credit score reflects clean vehicle handovers, prompt return inspections, and verified identity document standing.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                  <div className="rounded-xl bg-white p-2.5 border border-amber-200 text-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Completed Trips</span>
                    <span className="font-mono font-bold text-base text-slate-900">{creditProfile.completedTrips}</span>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-amber-200 text-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Clean Returns</span>
                    <span className="font-mono font-bold text-base text-emerald-700">{creditProfile.cleanHandovers}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
