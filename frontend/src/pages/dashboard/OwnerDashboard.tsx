import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { supabase } from '@/lib/supabaseClient';
import {
  Car, PlusCircle, Activity, DollarSign, TrendingUp,
  RefreshCw, CheckCircle, Clock, XCircle, Bell, Image as ImageIcon, Video, ShieldCheck,
  Banknote, BarChart3, Star, Calendar, Smartphone, Upload, Wallet, Sparkles,
  Radio, Gauge, Compass, Battery, Navigation, Shield, AlertTriangle
} from 'lucide-react';
import { type DriverTripStatus } from '@/lib/driverGpsService';
import { useFleetHostLocationTracking } from '@/hooks/useFleetHostLocationTracking';
import { completeTripAndArchive } from '@/lib/tripLifecycleService';
import type { TrackingStatus } from '@/types/tracking';
import { useCurrency } from '@/context/CurrencyContext';
import { fetchNotifications, sendNotification, type AppNotification } from '@/lib/notificationService';
import {
  getStoredBookings, getStoredVehicles, saveVehicle, updateBookingStatus,
  claimDemoFleetForHost, generateSampleBookingForVehicle,
  getVehicleHireStatus,
  type StoredBooking, type StoredVehicle
} from '@/lib/bookingStore';
import { withdrawFromWallet } from '@/lib/paymentService';
import { OpenCvVehicleTracker } from '@/components/tracking/OpenCvVehicleTracker';
import { MpesaLogo } from '@/components/ui/MpesaLogo';

const STATUS_CFG: Record<string, { color: string; icon: any; label: string }> = {
  PENDING:     { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: Clock,         label: 'Pending Approval' },
  ACCEPTED:    { color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',       icon: CheckCircle,   label: 'Accepted' },
  CONFIRMED:   { color: 'text-teal bg-teal/10 border-teal/30',                   icon: CheckCircle,   label: 'Confirmed' },
  IN_PROGRESS: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30 animate-pulse', icon: Activity, label: 'En Route' },
  COMPLETED:   { color: 'text-slate-700 bg-slate-100 border-slate-300',               icon: CheckCircle,   label: 'Completed' },
  CANCELLED:   { color: 'text-coral bg-coral/10 border-coral/30',               icon: XCircle,       label: 'Cancelled' },
  REJECTED:    { color: 'text-coral bg-coral/10 border-coral/30',               icon: XCircle,       label: 'Rejected' },
};

export default function OwnerDashboard() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'fleet' | 'bookings' | 'earnings' | 'add' | 'alerts' | null;

  const [vehicles, setVehicles] = useState<StoredVehicle[]>([]);
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings' | 'earnings' | 'add' | 'alerts'>(
    tabParam && ['fleet', 'bookings', 'earnings', 'add', 'alerts'].includes(tabParam) ? tabParam : 'fleet'
  );
  const [showOpenCvTracker, setShowOpenCvTracker] = useState(false);
  const [selectedBookingForTrack, setSelectedBookingForTrack] = useState<StoredBooking | null>(null);
  const [approvalAlert, setApprovalAlert] = useState<string | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab') as any;
    if (t && ['fleet', 'bookings', 'earnings', 'add', 'alerts'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const switchTab = (tabId: 'fleet' | 'bookings' | 'earnings' | 'add' | 'alerts') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // New vehicle form state with verification photos (Front & Back view)
  const [newV, setNewV] = useState({
    make: '', model: '', year: '2024', type: '4x4', price_per_day: '15000', seats: '7', address: '',
  });
  const [frontPhoto, setFrontPhoto] = useState<string>('https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80');
  const [backPhoto, setBackPhoto] = useState<string>('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80');
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [extraPhotoInput, setExtraPhotoInput] = useState('');

  const [addMsg, setAddMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [tripStatus, setTripStatus] = useState<DriverTripStatus>('OFFLINE');

  // Client-side Canvas Image Compression helper (converts heavy uploads to lightweight ~40KB JPEGs)
  const compressImageFile = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back' | 'extra') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (target === 'front') setFrontPhoto(compressed);
      else if (target === 'back') setBackPhoto(compressed);
      else if (compressed) setExtraPhotos(prev => [...prev, compressed]);
    } catch {
      // Fallback
    }
  };

  const addExtraPhoto = () => {
    if (!extraPhotoInput) return;
    setExtraPhotos(prev => [...prev, extraPhotoInput]);
    setExtraPhotoInput('');
  };

  // Payout form state
  const [payoutPhone, setPayoutPhone] = useState(user?.phone || '0722374535');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Live GPS Tracking Hook for Fleet Host
  const [selectedVehicleIdForTracking, setSelectedVehicleIdForTracking] = useState<string>('');
  const {
    isPublishing,
    startTracking,
    stopTracking,
    setTripStatus: setHostTripStatus,
    currentTelemetry,
    error: gpsError,
    gpsQuality,
    bufferedCount,
  } = useFleetHostLocationTracking({
    vehicleId: selectedVehicleIdForTracking || vehicles[0]?.id,
    tripId: 'TRIP-AVAILABLE',
  });

  const toggleDriverGps = async () => {
    if (!isPublishing) {
      const vId = selectedVehicleIdForTracking || vehicles[0]?.id || '00000000-0000-0000-0000-000000000001';
      const activeBooking = bookings.find(b => b.vehicleId === vId && ['IN_PROGRESS', 'CONFIRMED'].includes(b.status));
      const tripId = activeBooking?.bookingRef || `TRIP-${vId.slice(0, 8)}`;
      const ok = await startTracking(vId, tripId);
      if (ok) {
        setIsDriverOnline(true);
        setTripStatus('DRIVING_TO_PICKUP');
      }
    } else {
      stopTracking();
      setIsDriverOnline(false);
      setTripStatus('OFFLINE');
    }
  };

  const handleTripStatusChange = async (newStatus: TrackingStatus) => {
    setHostTripStatus(newStatus);
    setTripStatus(newStatus as DriverTripStatus);

    // If marked completed, archive route and refresh
    if (newStatus === 'TRIP_COMPLETED') {
      const vId = selectedVehicleIdForTracking || vehicles[0]?.id || '';
      const activeBooking = bookings.find(b => b.vehicleId === vId && ['IN_PROGRESS', 'CONFIRMED'].includes(b.status));
      if (activeBooking) {
        await completeTripAndArchive(activeBooking.bookingRef, []);
        updateBookingStatus(activeBooking.id, 'COMPLETED');
        window.dispatchEvent(new CustomEvent('mt_booking_status_changed'));
      }
      setTimeout(() => {
        stopTracking();
        setIsDriverOnline(false);
        setTripStatus('OFFLINE');
      }, 1500);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const allVehicles = getStoredVehicles();
    const allBookings = getStoredBookings();

    const currentUserId = user?.id;
    // Strict data privacy: only cars registered to this specific host account
    const ownerVehicles = currentUserId
      ? allVehicles.filter(v => 
          v.ownerId === currentUserId || 
          (user?.email && v.ownerEmail === user.email)
        )
      : [];
    const ownerVehicleIds = new Set(ownerVehicles.map(v => v.id));

    // Strict data privacy: only bookings done for this host's registered cars
    const ownerBookings = currentUserId
      ? allBookings.filter(b => 
          (b.ownerId && (b.ownerId === currentUserId || (user?.email && b.ownerId === user.email))) || 
          ownerVehicleIds.has(b.vehicleId)
        )
      : [];

    setVehicles(ownerVehicles);
    setBookings(ownerBookings);

    // Fetch alerts strictly isolated to this host
    const notifs = await fetchNotifications(user?.id, 'VEHICLE_OWNER');
    setNotifications(notifs);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const handleBookingUpdate = () => fetchData();
    const handleVehicleApproved = (e: any) => {
      fetchData();
      const v = e.detail;
      // Security check: Only notify if the approved vehicle belongs to this host
      if (v && (v.ownerId === user?.id || (user?.email && v.ownerEmail === user.email))) {
        setApprovalAlert(`🎉 Congratulations! Admin has approved your vehicle "${v?.make} ${v?.model}" and pushed it live for tourist bookings!`);
      }
    };
    const handleNotifUpdate = () => {
      fetchNotifications(user?.id, 'VEHICLE_OWNER').then(setNotifications);
    };

    window.addEventListener('mt_booking_updated', handleBookingUpdate);
    window.addEventListener('mt_booking_status_changed', handleBookingUpdate);
    window.addEventListener('mt_vehicle_approved', handleVehicleApproved);
    window.addEventListener('mt_vehicle_updated', handleBookingUpdate);
    window.addEventListener('mt_notification_received', handleNotifUpdate);

    return () => {
      window.removeEventListener('mt_booking_updated', handleBookingUpdate);
      window.removeEventListener('mt_booking_status_changed', handleBookingUpdate);
      window.removeEventListener('mt_vehicle_approved', handleVehicleApproved);
      window.removeEventListener('mt_vehicle_updated', handleBookingUpdate);
      window.removeEventListener('mt_notification_received', handleNotifUpdate);
    };
  }, [user?.id, user?.email]);

  const totalEarnings = bookings
    .filter(b => b.paymentStatus === 'PAID' || b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  const pendingEarnings = bookings
    .filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS')
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  const platformFee = totalEarnings * 0.15;
  const netEarnings = Math.max(0, totalEarnings - platformFee);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setAddMsg('Please log in as a Fleet Host to register a vehicle.');
      return;
    }
    setSubmitting(true);
    setAddMsg('');

    try {
      const vehiclePhotos = [frontPhoto, backPhoto, ...extraPhotos].filter(Boolean);

      saveVehicle({
        make: newV.make,
        model: newV.model,
        year: Number(newV.year),
        type: newV.type,
        pricePerDay: Number(newV.price_per_day),
        seats: Number(newV.seats),
        fuelType: 'Diesel',
        transmission: 'Automatic',
        address: newV.address || 'Nairobi, Kenya',
        ownerId: user.id,
        ownerName: `${user.firstName ?? 'Fleet Host'} ${user.lastName ?? ''}`.trim(),
        ownerEmail: user.email,
        images: vehiclePhotos.length > 0 ? vehiclePhotos : ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80'],
        hasInsurance: true,
      });

      try {
        await supabase.from('vehicles').insert({
          owner_id: user?.id,
          make: newV.make, model: newV.model, year: Number(newV.year),
          type: newV.type, price_per_day: Number(newV.price_per_day),
          seats: Number(newV.seats), fuel_type: 'DIESEL', transmission: 'AUTOMATIC',
          latitude: -1.2921, longitude: 36.8219,
          address: newV.address || 'Nairobi, Kenya',
          is_available: true, has_insurance: true,
          rating_average: 5, rating_count: 1,
        });
      } catch {}

      sendNotification({
        role: 'ADMIN',
        type: 'VEHICLE_PENDING_ADMIN',
        title: `New Vehicle Registration Request: ${newV.make} ${newV.model}`,
        message: `Fleet Host ${user?.firstName ?? 'Car Owner'} submitted a new ${newV.make} ${newV.model} (${newV.year}) for approval.`,
        link: '/dashboard/admin',
      });

      sendNotification({
        recipientId: user?.id,
        role: 'VEHICLE_OWNER',
        type: 'VEHICLE_SUBMITTED',
        title: `Vehicle Registered: ${newV.make} ${newV.model}`,
        message: `Your ${newV.make} ${newV.model} was registered and submitted for Admin verification.`,
        link: '/dashboard/owner?tab=fleet',
      });

      setAddMsg(`🎉 "${newV.make} ${newV.model}" registered successfully! Redirecting to your fleet…`);
      setNewV({ make: '', model: '', year: '2024', type: '4x4', price_per_day: '15000', seats: '7', address: '' });
      fetchData();
      setTimeout(() => switchTab('fleet'), 1200);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setAddMsg(`Registration failed: ${err?.message || 'Please check input values'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBooking = (bId: string) => {
    updateBookingStatus(bId, 'ACCEPTED');
    window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: { id: bId, status: 'ACCEPTED' } }));
    fetchData();
  };

  const handleRejectBooking = (bId: string) => {
    if (rejectConfirm === bId) {
      updateBookingStatus(bId, 'REJECTED');
      window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: { id: bId, status: 'REJECTED' } }));
      setRejectConfirm(null);
      fetchData();
    } else {
      setRejectConfirm(bId);
      setTimeout(() => setRejectConfirm(null), 4000);
    }
  };

  const handleCompleteTrip = (bId: string) => {
    updateBookingStatus(bId, 'COMPLETED');
    const b = bookings.find(x => x.id === bId);
    if (b) {
      const earned = b.totalAmount * 0.85;
      sendNotification({
        recipientId: user?.id,
        role: 'VEHICLE_OWNER',
        type: 'TRIP_COMPLETED',
        title: 'Trip Completed & Revenue Released',
        message: `Trip ${b.bookingRef} marked completed! ${formatPrice(earned)} has been released to your Net Earnings balance.`,
        link: '/dashboard/owner?tab=earnings',
      });
      setApprovalAlert(`🎉 Trip ${b.bookingRef} completed! ${formatPrice(earned)} released to your Net Earnings.`);
    }
    fetchData();
  };



  const handleGenerateSampleBooking = (v: StoredVehicle) => {
    if (!user?.id) return;
    const b = generateSampleBookingForVehicle(
      v.id,
      user.id,
      v.make,
      v.model,
      v.pricePerDay
    );
    sendNotification({
      recipientId: user.id,
      role: 'VEHICLE_OWNER',
      type: 'BOOKING_CREATED_OWNER',
      title: `New Tourist Booking: ${v.make} ${v.model}`,
      message: `${b.touristName} placed a booking request (Ref: ${b.bookingRef}) for your ${v.make} ${v.model}.`,
      link: '/dashboard/owner?tab=bookings',
    });
    setApprovalAlert(`New booking request (${b.bookingRef}) received from tourist ${b.touristName}! View it in the Bookings tab.`);
    fetchData();
    switchTab('bookings');
  };

  const handleClaimDemoFleet = () => {
    if (!user?.id) return;
    claimDemoFleetForHost(
      user.id,
      `${user.firstName ?? 'Host'} ${user.lastName ?? ''}`.trim(),
      user.email
    );
    setApprovalAlert('🎉 Demo fleet of 2 verified luxury vehicles assigned to your host account!');
    fetchData();
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) {
      setPayoutMsg({ type: 'err', text: 'Please enter a valid payout amount.' });
      return;
    }
    if (amt > netEarnings) {
      setPayoutMsg({ type: 'err', text: `Amount exceeds available net earnings of ${formatPrice(netEarnings)}.` });
      return;
    }
    if (!payoutPhone || payoutPhone.length < 9) {
      setPayoutMsg({ type: 'err', text: 'Please enter a valid M-Pesa phone number (e.g. 0712345678).' });
      return;
    }

    setPayoutLoading(true);
    setPayoutMsg(null);
    const res = await withdrawFromWallet(user.id, payoutPhone, amt);

    if (res.success) {
      const receiptRef = res.reference || `B2C-${Date.now()}`;
      setPayoutMsg({
        type: 'ok',
        text: `🎉 M-Pesa B2C Payout of ${formatPrice(amt)} approved & dispatched to ${payoutPhone}! (M-Pesa Ref: ${receiptRef})`
      });
      setPayoutAmount('');
      sendNotification({
        recipientId: user?.id,
        role: 'VEHICLE_OWNER',
        type: 'PAYOUT_DISPATCHED',
        title: 'M-Pesa Payout Dispatched',
        message: `M-Pesa B2C transfer of ${formatPrice(amt)} sent to ${payoutPhone}. Receipt: ${receiptRef}`,
        link: '/dashboard/wallet',
      });
      fetchData();
    } else {
      setPayoutMsg({ type: 'err', text: res.message || 'Payout request failed.' });
    }
    setPayoutLoading(false);
  };

  const TABS = [
    { id: 'fleet',    label: `My Registered Cars (${vehicles.length})`, icon: Car },
    { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Clock },
    { id: 'add',      label: 'Register Car', icon: PlusCircle },
    { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
    { id: 'alerts',   label: `Alerts (${notifications.filter(n => !n.is_read).length})`, icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6 font-display text-slate-900">
      {/* OPENCV LIVE TRACKER MODAL */}
      {showOpenCvTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-4xl">
            <OpenCvVehicleTracker
              vehicleName={selectedBookingForTrack ? `${selectedBookingForTrack.vehicleMake} ${selectedBookingForTrack.vehicleModel}` : 'Toyota Land Cruiser 4x4'}
              bookingRef={selectedBookingForTrack?.bookingRef || 'MT-884920'}
              driverName={`${user?.firstName ?? 'Samuel'} ${user?.lastName ?? 'Omondi'} (Certified Driver)`}
              onClose={() => setShowOpenCvTracker(false)}
            />
          </div>
        </div>
      )}

      {/* APPROVAL ALERT POPUP */}
      {approvalAlert && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-900 font-bold">{approvalAlert}</p>
          </div>
          <button onClick={() => setApprovalAlert(null)} className="btn-ghost !py-1 !px-3 text-xs border border-emerald-200 text-emerald-800">Dismiss</button>
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mtravel-burgundy via-mtravel-darkBurgundy to-mtravel-obsidian border border-mtravel-gold/30 p-8 shadow-xl">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 font-mono">Fleet Host Dashboard</span>
              <MpesaLogo variant="badge" />
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold text-white">
              {user?.firstName ?? 'Vehicle Owner'}'s Host Portal
            </h1>
            <p className="mt-1 text-sm text-slate-200 font-medium">Manage your registered cars, tourist bookings, and earnings in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDriverGps}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition shadow-md ${
                isDriverOnline
                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 animate-pulse'
                  : 'border-white/30 bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {isDriverOnline ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-950 animate-ping" />
                  Live ({tripStatus})
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 text-amber-300" />
                  Start GPS Broadcast
                </>
              )}
            </button>
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-xs font-bold transition">
              <RefreshCw className="h-4 w-4 text-amber-300" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'My Registered Cars', value: vehicles.length, icon: Car, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Live & Ready to Hire', value: vehicles.filter(v => v.status === 'APPROVED' && v.isLive !== false && !getVehicleHireStatus(v.id).isHired).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'On Active Trip', value: vehicles.filter(v => getVehicleHireStatus(v.id).isHired).length, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Net Earnings', value: formatPrice(netEarnings), icon: DollarSign, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-600 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === t.id ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950 hover:bg-white'}`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* FLEET TAB */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">My Registered Cars</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Viewing cars registered to your host account only.</p>
            </div>
            <button onClick={() => switchTab('add')} className="btn-primary !py-2 !px-4 text-xs font-bold text-white shadow-sm">
              + Register New Car
            </button>
          </div>

          {/* FLEET HOST LIVE GPS TELEMETRY CONSOLE */}
          <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-teal/10 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-slate-900 text-sm">Fleet Host GPS Telemetry Console</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isPublishing
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      {isPublishing ? '● BROADCASTING LIVE' : '○ STANDBY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Broadcast your vehicle's live smartphone GPS position to the assigned traveller and platform admin.</p>
                </div>
              </div>

              {/* Start/Stop Toggle Button */}
              <button
                onClick={toggleDriverGps}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md ${
                  isPublishing
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                }`}
              >
                {isPublishing ? (
                  <>
                    <XCircle className="h-4 w-4" /> Stop Live GPS
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" /> Start Live GPS Broadcast
                  </>
                )}
              </button>
            </div>

            {/* Vehicle selection for GPS tracking if multiple cars */}
            {vehicles.length > 1 && (
              <div className="flex items-center gap-2 text-xs pt-2 border-t border-emerald-200/50">
                <span className="font-semibold text-slate-700">Select Car for Live GPS:</span>
                <select
                  value={selectedVehicleIdForTracking || vehicles[0]?.id}
                  onChange={(e) => setSelectedVehicleIdForTracking(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.plateNumber || 'Car'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* GPS Error notification */}
            {gpsError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* When Publishing, show interactive telemetry gauges & status controller */}
            {isPublishing && (
              <div className="pt-2 border-t border-emerald-200/60 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {/* Signal Quality */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" /> GPS Signal
                    </div>
                    <div className="font-mono font-black text-xs text-slate-900 mt-1">
                      {gpsQuality} {currentTelemetry?.accuracy ? `(±${currentTelemetry.accuracy}m)` : ''}
                    </div>
                  </div>

                  {/* Speedometer */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Gauge className="h-3.5 w-3.5 text-teal" /> Live Speed
                    </div>
                    <div className="font-mono font-black text-xs text-slate-900 mt-1">
                      {currentTelemetry?.speed || 0} km/h
                    </div>
                  </div>

                  {/* Compass Heading */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Compass className="h-3.5 w-3.5 text-amber-500" /> Compass Heading
                    </div>
                    <div className="font-mono font-black text-xs text-slate-900 mt-1">
                      {currentTelemetry?.heading || 0}°
                    </div>
                  </div>

                  {/* Battery / Offline Buffer */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Battery className="h-3.5 w-3.5 text-emerald-500" /> Battery / Sync
                    </div>
                    <div className="font-mono font-black text-xs text-slate-900 mt-1">
                      {currentTelemetry?.battery_level !== undefined ? `${currentTelemetry.battery_level}%` : '100%'}
                      {bufferedCount > 0 && <span className="text-[9px] text-amber-600 ml-1 font-sans font-bold">({bufferedCount} buffered)</span>}
                    </div>
                  </div>
                </div>

                {/* Trip Phase Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Update Trip Phase:</span>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                    {(['AVAILABLE', 'DRIVING_TO_PICKUP', 'WAITING_FOR_TOURIST', 'TRIP_IN_PROGRESS', 'TRIP_COMPLETED'] as TrackingStatus[]).map((phase) => (
                      <button
                        key={phase}
                        onClick={() => handleTripStatusChange(phase)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                          (currentTelemetry?.status || tripStatus) === phase
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {phase.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-mtravel-gold border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {vehicles.map(v => {
                const vBookings = bookings.filter(b => b.vehicleId === v.id);
                const vEarnings = vBookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + b.totalAmount, 0);
                const utilization = Math.min(100, Math.round((vBookings.length / 30) * 100));
                const hireStatus = getVehicleHireStatus(v.id);
                const isLive = v.isLive !== false;

                return (
                  <div key={v.id} className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-sm hover:shadow-md transition">
                    <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-200/60">
                      <img src={v.images[0] || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b'} alt={v.make} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 rounded-full bg-mtravel-burgundy text-amber-300 font-mono text-[10px] font-bold px-2.5 py-0.5 border border-amber-400/30">
                        {v.type}
                      </span>
                      {v.status === 'PENDING_APPROVAL' ? (
                        <span className="absolute top-3 right-3 rounded-full bg-yellow-400 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 shadow-sm">
                          ⏳ Reviewing
                        </span>
                      ) : hireStatus.isHired ? (
                        <span className="absolute top-3 right-3 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 shadow-sm animate-pulse">
                          🚗 On Trip
                        </span>
                      ) : isLive ? (
                        <span className="absolute top-3 right-3 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 shadow-sm">
                          🟢 Live
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 rounded-full bg-slate-700 text-slate-100 font-bold text-[10px] px-2.5 py-0.5 shadow-sm">
                          ⏸️ Offline
                        </span>
                      )}
                      <span className="absolute bottom-3 left-3 text-xs font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-full border border-white/20">
                        {v.seats} Seats | {v.fuelType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-bold text-slate-900">{v.make} {v.model} ({v.year})</h3>
                      {v.status === 'PENDING_APPROVAL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-bold text-yellow-700">
                          <Clock className="h-3 w-3" /> Awaiting Admin Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> Admin Approved
                        </span>
                      )}
                    </div>

                    {/* PENDING APPROVAL NOTICE */}
                    {v.status === 'PENDING_APPROVAL' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Clock className="h-3.5 w-3.5 text-amber-700" />
                            Awaiting Admin Verification &amp; Activation
                          </span>
                          <span className="rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                            Under Inspection
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium">
                          Submitted to M-TRAVEL Administration. The Admin will verify documents and push this vehicle live to the traveler marketplace.
                        </p>
                      </div>
                    )}

                    {/* LIVE FLEET / TRIP STATUS CONTROL PANEL */}
                    {v.status === 'APPROVED' && (
                      hireStatus.isHired ? (
                        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                              <Car className="h-3.5 w-3.5 text-amber-700" />
                              🚗 On Active Trip (Hired until {hireStatus.returnDate || 'completion'})
                            </span>
                            <span className="rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                              Auto-Locked
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 font-medium">
                            Currently with tourist <strong className="font-semibold text-slate-900">{hireStatus.touristName || 'Traveler'}</strong>. Hire is automatically paused on marketplace until car is returned.
                          </p>
                        </div>
                      ) : (
                        <div className={`rounded-xl border p-3 flex items-center justify-between transition-all duration-200 ${
                          isLive ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="space-y-0.5 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                                isLive ? 'text-emerald-800' : 'text-slate-600'
                              }`}>
                                <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                {isLive ? '🟢 Live on Marketplace' : '⏸️ Offline (Standby)'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-tight">
                              {isLive 
                                ? 'Pushed live by Admin. Tourists can discover and book this vehicle in real time.' 
                                : 'Vehicle is approved. Admin activates the live toggle to push vehicle to travelers.'}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-xs ${
                              isLive 
                                ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' 
                                : 'bg-slate-200/80 text-slate-700 border-slate-300'
                            }`}>
                              <ShieldCheck className="h-3 w-3" />
                              {isLive ? 'Admin Verified Live' : 'Admin Controlled'}
                            </span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Performance metrics */}
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                      <div className="text-center">
                        <p className="font-mono text-sm font-bold text-amber-700">{formatPrice(vEarnings)}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Earned</p>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <p className="font-mono text-sm font-bold text-teal-700">{utilization}%</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Utilization</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-sm font-bold text-emerald-700">{vBookings.length}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Bookings</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="font-mono font-bold text-amber-700 text-base">{formatPrice(v.pricePerDay)}/day</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateSampleBooking(v)}
                          title="Generate a realistic incoming booking request for this car"
                          className="btn-secondary !py-1 !px-2.5 text-[11px] font-bold text-teal-800 bg-teal-50 border-teal-200 hover:bg-teal-100 flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3 text-teal-600" /> + Test Booking
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookingForTrack({
                              id: 'b-0',
                              bookingRef: 'MT-LIVE',
                              vehicleId: v.id,
                              vehicleMake: v.make,
                              vehicleModel: v.model,
                              vehicleName: `${v.make} ${v.model}`,
                              vehicleImage: v.images[0],
                              touristId: 't-1',
                              touristName: 'Tourist Traveler',
                              touristPhone: '0712345678',
                              startDate: '2026-08-10',
                              endDate: '2026-08-12',
                              totalAmount: v.pricePerDay * 2,
                              paymentStatus: 'PAID',
                              status: 'IN_PROGRESS',
                              createdAt: new Date().toISOString(),
                            });
                            setShowOpenCvTracker(true);
                          }}
                          className="btn-secondary !py-1 !px-2.5 text-[11px] flex items-center gap-1 text-slate-800 border-slate-200 hover:text-slate-950 font-bold"
                        >
                          <Video className="h-3.5 w-3.5 text-amber-600" /> Live Feed
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {vehicles.length === 0 && (
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3 shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                    <Car className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">No cars registered to your host account yet</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    Only vehicles registered to your host account appear here. Register your first vehicle to start receiving tourist bookings and earning.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button onClick={() => switchTab('add')} className="btn-primary !py-2 !px-4 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5">
                      <PlusCircle className="h-4 w-4" /> Register Your First Car
                    </button>
                    <button onClick={handleClaimDemoFleet} className="btn-secondary !py-2 !px-4 text-xs font-bold text-slate-800 border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-600" /> Claim Demo Fleet (2 Vehicles)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-serif text-xl font-bold text-slate-900">Tourist Booking Requests</h2>
            <span className="text-xs text-slate-500 font-mono font-semibold">{bookings.length} total</span>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3 shadow-sm">
              <Clock className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-serif text-lg font-bold text-slate-800">No tourist bookings received yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once tourists book your registered vehicles, incoming requests will appear here for you to accept, decline, track live, and fulfill.
              </p>
              {vehicles.length > 0 && (
                <button
                  onClick={() => handleGenerateSampleBooking(vehicles[0])}
                  className="btn-primary !py-2 !px-4 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" /> + Simulate Incoming Tourist Booking
                </button>
              )}
            </div>
          ) : (
            bookings.map(b => {
              const cfg = STATUS_CFG[b.status] ?? STATUS_CFG['CONFIRMED'];
              const isPending = b.status === 'PENDING';
              return (
                <div key={b.id} className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Booking Ref</span>
                      <p className="font-mono text-base font-bold text-amber-700">{b.bookingRef}</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        Vehicle: {b.vehicleMake} {b.vehicleModel}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tourist: <strong className="text-slate-900">{b.touristName}</strong> ({b.touristPhone})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${cfg.color}`}>
                        <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
                      </span>
                      <p className="text-xs text-emerald-700 font-mono font-bold mt-1.5 flex items-center gap-1 justify-end">
                        <ShieldCheck className="h-3.5 w-3.5" /> M-PESA ({b.mpesaReceipt || 'QK89X201'})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {b.startDate} → {b.endDate}
                    </span>
                    <span className="font-mono font-bold text-lg text-slate-900">{formatPrice(b.totalAmount)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Accept button — functional, updates tourist booking */}
                    {isPending && (
                      <button
                        onClick={() => handleAcceptBooking(b.id)}
                        className="flex-1 rounded-xl border border-teal-300 bg-teal-50 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-teal-700" /> Accept Request
                      </button>
                    )}
                    {/* Complete trip button — releases funds to host wallet and net earnings */}
                    {['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) && (
                      <button
                        onClick={() => handleCompleteTrip(b.id)}
                        className="flex-1 rounded-xl border border-emerald-300 bg-emerald-50 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Complete & Release Funds
                      </button>
                    )}
                    {/* Reject button */}
                    {(isPending || b.status === 'ACCEPTED') && (
                      <button
                        onClick={() => handleRejectBooking(b.id)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          rejectConfirm === b.id
                            ? 'border-rose-400 bg-rose-50 text-rose-800 animate-pulse'
                            : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        {rejectConfirm === b.id ? 'Confirm Rejection?' : 'Decline'}
                      </button>
                    )}
                    {/* Live track */}
                    {['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) && (
                      <button
                        onClick={() => {
                          setSelectedBookingForTrack(b);
                          setShowOpenCvTracker(true);
                        }}
                        className="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
                      >
                        <Video className="h-3.5 w-3.5 text-amber-700" /> Live Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EARNINGS & PAYOUTS TAB (replaces GPS Map — unique to owner) */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-amber-600" /> Earnings & Payouts
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">Your revenue breakdown after platform commission.</p>
            </div>
            <Link to="/dashboard/wallet" className="btn-secondary !py-1.5 !px-3.5 text-xs font-bold text-slate-800 hover:text-slate-950 flex items-center gap-1.5 shadow-sm">
              <Wallet className="h-3.5 w-3.5 text-amber-600" /> Open Full Wallet →
            </Link>
          </div>

          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                <TrendingUp className="h-4 w-4" /> Gross Revenue
              </div>
              <p className="font-mono text-3xl font-bold text-slate-900">{formatPrice(totalEarnings)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">From {bookings.filter(b => b.status === 'COMPLETED').length} completed trips</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">
                <BarChart3 className="h-4 w-4" /> Platform Fee (15%)
              </div>
              <p className="font-mono text-3xl font-bold text-slate-900">{formatPrice(platformFee)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">M-TRAVEL service commission</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                <Banknote className="h-4 w-4" /> Net Earnings
              </div>
              <p className="font-mono text-3xl font-bold text-emerald-700">{formatPrice(netEarnings)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Available for M-Pesa withdrawal</p>
            </div>
          </div>

          {/* Pending earnings */}
          {pendingEarnings > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending (Active Trips)</p>
                <p className="font-mono text-2xl font-bold text-amber-900 mt-1">{formatPrice(pendingEarnings)}</p>
                <p className="text-xs text-amber-700 mt-0.5 font-medium">Will be released to Net Earnings on trip completion</p>
              </div>
              <Clock className="h-10 w-10 text-amber-600/30" />
            </div>
          )}

          {/* Working M-Pesa Payout Request Form */}
          <form onSubmit={handleRequestPayout} className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <MpesaLogo variant="badge" /> Request M-Pesa Payout
            </h3>

            {payoutMsg && (
              <div className={`rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${payoutMsg.type === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
                {payoutMsg.type === 'ok' ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{payoutMsg.text}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 font-medium">
              Available balance: <span className="font-mono font-bold text-emerald-700">{formatPrice(netEarnings)}</span>
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">M-Pesa Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0712345678"
                  className="input-field text-slate-900 placeholder:text-slate-400 border-slate-300 text-xs w-full"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Payout Amount (KES)</label>
                <input
                  type="number"
                  placeholder={`Amount (max ${netEarnings})`}
                  className="input-field text-slate-900 placeholder:text-slate-400 border-slate-300 text-xs w-full"
                  max={netEarnings}
                  min={10}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={payoutLoading || netEarnings <= 0}
              className="w-full rounded-xl bg-[#00A859] py-3 text-sm font-bold text-white hover:bg-[#008C4A] disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm font-display"
            >
              {payoutLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Processing M-Pesa B2C Transfer…
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" /> Request M-Pesa Payout
                </>
              )}
            </button>
          </form>

          {/* Per-vehicle earnings breakdown */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-amber-600" /> Revenue by Vehicle
            </h3>
            {vehicles.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No vehicles registered yet.</p>
            )}
            {vehicles.map(v => {
              const vCompleted = bookings.filter(b => b.vehicleId === v.id && b.status === 'COMPLETED');
              const vRevenue = vCompleted.reduce((s, b) => s + b.totalAmount, 0);
              const vNet = vRevenue * 0.85;
              const vRating = 4.8;
              return (
                <div key={v.id} className="rounded-2xl bg-white border border-slate-200/90 p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                      <img src={v.images[0]} alt={v.make} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">{v.make} {v.model}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{vCompleted.length} completed trips</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] text-slate-700 font-semibold">{vRating} avg rating</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900">{formatPrice(vRevenue)}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Gross</p>
                    <p className="font-mono font-bold text-emerald-700 text-sm">{formatPrice(vNet)}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Net</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" /> System Notifications & Approval Alerts
          </h2>
          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-500 font-medium">
              No new alerts. Registration approval notifications will appear here.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADD VEHICLE TAB */}
      {activeTab === 'add' && (
        <form onSubmit={handleAdd} className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-600" /> Register New Vehicle for Admin Approval
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Add vehicle photos & specs. Submissions reflect on the Admin Dashboard for registration approval.
            </p>
          </div>

          {addMsg && (
            <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${!addMsg.toLowerCase().includes('fail') && !addMsg.toLowerCase().includes('error') ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              {addMsg}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: 'make', label: 'Vehicle Make (e.g. Toyota)', placeholder: 'Toyota' },
              { key: 'model', label: 'Model (e.g. Land Cruiser Prado)', placeholder: 'Land Cruiser Prado' },
              { key: 'year', label: 'Year of Manufacture', placeholder: '2024', type: 'number' },
              { key: 'price_per_day', label: 'Daily Rental Rate (KES)', placeholder: '15000', type: 'number' },
              { key: 'seats', label: 'Passenger Seats', placeholder: '7', type: 'number' },
              { key: 'address', label: 'Location / Base Area', placeholder: 'Nairobi JKIA / Westlands' },
            ].map(f => (
              <div key={f.key}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800">{f.label}</label>
                <input
                  required={f.key !== 'address'}
                  type={(f as any).type ?? 'text'}
                  placeholder={f.placeholder}
                  className="input-field text-slate-900 placeholder:text-slate-400 border-slate-300 text-xs"
                  value={(newV as any)[f.key]}
                  onChange={e => setNewV({ ...newV, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800">Vehicle Category</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: '4x4', label: '4x4 Safari' },
                { type: 'SUV', label: 'Luxury SUV' },
                { type: 'VAN', label: 'Alphard Van' },
                { type: 'SEDAN', label: 'Sedan' },
              ].map(({ type, label }) => (
                <button
                  key={type} type="button"
                  onClick={() => setNewV({ ...newV, type })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${newV.type === type ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <Car className="h-3.5 w-3.5 text-amber-600" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* VEHICLE VERIFICATION PHOTOS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <ImageIcon className="h-4 w-4 text-amber-600" /> Required Vehicle Verification Photos
              </label>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">
                Upload clear exterior photos showing both the <strong>Front View</strong> and <strong>Back/Rear View</strong> of the vehicle for Admin inspection.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* FRONT VIEW PHOTO */}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">1. Front Exterior Photo</span>
                  <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[9px] font-mono font-bold">Front View</span>
                </div>
                <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                  <img src={frontPhoto} alt="Front View" className="h-full w-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <label className="btn-secondary flex-1 text-center cursor-pointer !py-1.5 text-xs font-bold text-slate-800 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload Front File
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste Front photo URL..."
                  className="input-field text-[11px] !py-1 text-slate-900 placeholder:text-slate-400 border-slate-300"
                  value={frontPhoto}
                  onChange={(e) => setFrontPhoto(e.target.value)}
                />
              </div>

              {/* BACK VIEW PHOTO */}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">2. Back / Rear Photo</span>
                  <span className="rounded bg-teal-100 text-teal-900 px-2 py-0.5 text-[9px] font-mono font-bold">Back View</span>
                </div>
                <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                  <img src={backPhoto} alt="Back View" className="h-full w-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <label className="btn-secondary flex-1 text-center cursor-pointer !py-1.5 text-xs font-bold text-slate-800 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload Rear File
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste Rear photo URL..."
                  className="input-field text-[11px] !py-1 text-slate-900 placeholder:text-slate-400 border-slate-300"
                  value={backPhoto}
                  onChange={(e) => setBackPhoto(e.target.value)}
                />
              </div>
            </div>

            {/* EXTRA PHOTOS */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">3. Additional Exterior / Interior Photos</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste additional image URL (e.g. Interior, Dashboard)..."
                  className="input-field flex-1 text-xs text-slate-900 placeholder:text-slate-400 border-slate-300"
                  value={extraPhotoInput}
                  onChange={(e) => setExtraPhotoInput(e.target.value)}
                />
                <label className="btn-secondary !px-3 text-xs font-bold border-slate-200 text-slate-800 cursor-pointer flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> File
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'extra')} />
                </label>
                <button type="button" onClick={addExtraPhoto} className="btn-primary !px-4 text-xs font-bold text-white shadow-sm">
                  + Add Photo
                </button>
              </div>

              {extraPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {extraPhotos.map((url, index) => (
                    <div key={index} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 group bg-slate-900">
                      <img src={url} alt={`Extra ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setExtraPhotos(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center opacity-80 hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full font-bold shadow-md text-white !py-3.5 flex items-center justify-center gap-2">
            {submitting ? 'Submitting to Admin…' : (
              <>
                <CheckCircle className="h-4 w-4" />
                Submit Vehicle for Admin Registration Approval
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
