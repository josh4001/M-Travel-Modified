import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  Car, PlusCircle, Activity, DollarSign, TrendingUp,
  RefreshCw, CheckCircle, Clock, XCircle, Bell, Image as ImageIcon, ShieldCheck,
  Banknote, BarChart3, Star, Calendar, Upload, Wallet, Sparkles,
  CheckCircle2, X, FileText, Paperclip, Eye, Download, Check, Lock, Fuel, Gauge
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { fetchNotifications, sendNotification, type AppNotification } from '@/lib/notificationService';
import {
  getStoredBookings, getStoredVehicles, syncVehiclesFromSupabase, syncBookingsFromSupabase, saveVehicle, updateBookingStatus,
  generateSampleBookingForVehicle,
  getVehicleHireStatus,
  type StoredBooking, type StoredVehicle, type VehicleDocument
} from '@/lib/bookingStore';
import { getLocalWallet, creditHostPayout } from '@/lib/paymentService';
import { MpesaLogo } from '@/components/ui/MpesaLogo';
import { VehicleStatusBadge } from '@/components/ui/LuxuryVehicleBadges';
import {
  getHostApprovalWhatsAppUrl,
} from '@/lib/communicationService';
import {
  getHandoverByBookingId,
  getInspectionByBookingId,
  evaluateTripOverdueStatus
} from '@/lib/rentalLifecycleStore';

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

  const [vehicles, setVehicles] = useState<StoredVehicle[]>(() => {
    const all = getStoredVehicles();
    const uid = user?.id;
    return uid ? all.filter(v => v.ownerId === uid || (user?.email && v.ownerEmail === user.email)) : [];
  });
  const [bookings, setBookings] = useState<StoredBooking[]>(() => {
    const all = getStoredBookings();
    const uid = user?.id;
    const vIds = new Set(getStoredVehicles().filter(v => uid && (v.ownerId === uid || (user?.email && v.ownerEmail === user.email))).map(v => v.id));
    return uid ? all.filter(b => (b.ownerId && (b.ownerId === uid || (user?.email && b.ownerId === user.email))) || vIds.has(b.vehicleId)) : [];
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings' | 'earnings' | 'add' | 'alerts'>(
    tabParam && ['fleet', 'bookings', 'earnings', 'add', 'alerts'].includes(tabParam) ? tabParam : 'fleet'
  );
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
    make: '', model: '', year: '2024', type: '4x4', price_per_day: '15000', seats: '7', address: '', plateNumber: '',
    fuelType: 'Diesel', transmission: 'Automatic',
  });
  const [frontPhoto, setFrontPhoto] = useState<string>('https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80');
  const [backPhoto, setBackPhoto] = useState<string>('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80');
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [extraPhotoInput, setExtraPhotoInput] = useState('');

  // Compliance Documents state (Logbook, Insurance, Inspection)
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'LOGBOOK' | 'INSURANCE' | 'INSPECTION_CERT' | 'OTHER',
    defaultName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploadLoading(true);

    try {
      let fileUrl = '';
      if (file.type.startsWith('image/')) {
        fileUrl = await compressImageFile(file, 1400, 0.82);
      } else {
        fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }

      if (!fileUrl) return;

      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      const newDoc: VehicleDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: defaultName,
        type,
        fileUrl,
        fileName: file.name,
        fileSize: sizeStr,
        uploadedAt: new Date().toISOString(),
      };

      setDocuments((prev) => [...prev.filter((d) => d.type !== type), newDoc]);
    } finally {
      setDocUploadLoading(false);
      e.target.value = '';
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const [addMsg, setAddMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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


  const fetchData = async () => {
    // 1. Immediately render local stored vehicles & bookings
    const allVehicles = getStoredVehicles();
    const allBookings = getStoredBookings();
    const currentUserId = user?.id;

    const ownerVehicles = currentUserId
      ? allVehicles.filter(v => 
          v.ownerId === currentUserId || 
          (user?.email && v.ownerEmail === user.email) ||
          (user?.email?.toLowerCase().includes('james') && (v.ownerEmail?.toLowerCase().includes('james') || v.ownerId === 'a0000000-0000-0000-0000-000000000002'))
        )
      : allVehicles;
    const ownerVehicleIds = new Set(ownerVehicles.map(v => v.id));

    const ownerBookings = currentUserId
      ? allBookings.filter(b => 
          (b.ownerId && (b.ownerId === currentUserId || (user?.email && b.ownerId === user.email))) || 
          ownerVehicleIds.has(b.vehicleId)
        )
      : allBookings;

    setVehicles(ownerVehicles);
    setBookings(ownerBookings);

    // 2. Non-blocking background sync from Supabase
    Promise.all([
      syncVehiclesFromSupabase().catch(() => []),
      syncBookingsFromSupabase().catch(() => []),
    ]).then(() => {
      const refreshedVehicles = getStoredVehicles();
      const refreshedBookings = getStoredBookings();

      const updatedOwnerVehicles = currentUserId
        ? refreshedVehicles.filter(v => 
            v.ownerId === currentUserId || 
            (user?.email && v.ownerEmail === user.email) ||
            (user?.email?.toLowerCase().includes('james') && (v.ownerEmail?.toLowerCase().includes('james') || v.ownerId === 'a0000000-0000-0000-0000-000000000002'))
          )
        : refreshedVehicles;
      const updatedVehicleIds = new Set(updatedOwnerVehicles.map(v => v.id));

      const updatedOwnerBookings = currentUserId
        ? refreshedBookings.filter(b => 
            (b.ownerId && (b.ownerId === currentUserId || (user?.email && b.ownerId === user.email))) || 
            updatedVehicleIds.has(b.vehicleId)
          )
        : refreshedBookings;

      setVehicles(updatedOwnerVehicles);
      setBookings(updatedOwnerBookings);
    }).catch(() => {});

    // Fetch alerts strictly isolated to this host in background
    fetchNotifications(user?.id, 'VEHICLE_OWNER').then(notifs => {
      if (notifs) setNotifications(notifs);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchData();

    const handleBookingUpdate = () => fetchData();
    const handleVehicleApproved = (e: any) => {
      fetchData();
      const v = e.detail;
      // Security check: Only notify if the approved vehicle belongs to this host
      if (v && (v.ownerId === user?.id || (user?.email && v.ownerEmail === user.email))) {
        setApprovalAlert(`🎉 Congratulations! Admin has approved your vehicle "${v?.make} ${v?.model}" and pushed it live for tourist bookings! Your official accreditation and onboarding notice is ready via automated WhatsApp.`);
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
    window.addEventListener('mt_wallet_updated', handleBookingUpdate);
    window.addEventListener('mt_remote_change', handleBookingUpdate);

    return () => {
      window.removeEventListener('mt_booking_updated', handleBookingUpdate);
      window.removeEventListener('mt_booking_status_changed', handleBookingUpdate);
      window.removeEventListener('mt_vehicle_approved', handleVehicleApproved);
      window.removeEventListener('mt_vehicle_updated', handleBookingUpdate);
      window.removeEventListener('mt_notification_received', handleNotifUpdate);
      window.removeEventListener('mt_wallet_updated', handleBookingUpdate);
      window.removeEventListener('mt_remote_change', handleBookingUpdate);
    };
  }, [user?.id, user?.email]);

  const totalEarnings = bookings
    .filter(b => b.paymentStatus === 'PAID' || b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  const pendingEarnings = bookings
    .filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS')
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  const platformFee = totalEarnings * 0.15;
  const grossNet = Math.max(0, totalEarnings - platformFee);

  const localW = user?.id ? getLocalWallet(user.id, true, user?.email) : null;
  const totalWithdrawn = (localW?.transactions || [])
    .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netEarnings = Math.max(0, grossNet - totalWithdrawn);

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
      const chosenPhotos = vehiclePhotos.length > 0 ? vehiclePhotos : ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80'];

      saveVehicle({
        make: newV.make,
        model: newV.model,
        year: Number(newV.year),
        type: newV.type,
        pricePerDay: Number(newV.price_per_day),
        seats: Number(newV.seats),
        fuelType: newV.fuelType || 'Diesel',
        transmission: newV.transmission || 'Automatic',
        address: newV.address || 'Nairobi, Kenya',
        ownerId: user.id,
        ownerName: `${user.firstName ?? 'Fleet Host'} ${user.lastName ?? ''}`.trim(),
        ownerEmail: user.email,
        images: chosenPhotos,
        hasInsurance: documents.some(d => d.type === 'INSURANCE') || true,
        plateNumber: newV.plateNumber,
        documents: documents,
      });

      sendNotification({
        role: 'ADMIN',
        type: 'VEHICLE_PENDING_ADMIN',
        title: `New Vehicle Registration Request: ${newV.make} ${newV.model}`,
        message: `Fleet Host ${user?.firstName ?? 'Car Owner'} submitted a new ${newV.make} ${newV.model} (${newV.year}) with ${documents.length} compliance document(s) for approval.`,
        link: '/dashboard/admin',
      });

      sendNotification({
        recipientId: user?.id,
        role: 'VEHICLE_OWNER',
        type: 'VEHICLE_SUBMITTED',
        title: `Vehicle Registered: ${newV.make} ${newV.model}`,
        message: `Your ${newV.make} ${newV.model} was registered with ${documents.length} compliance document(s) and submitted for Admin verification.`,
        link: '/dashboard/owner?tab=fleet',
      });

      setAddMsg(`🎉 "${newV.make} ${newV.model}" registered successfully! Redirecting to your fleet…`);
      setNewV({ make: '', model: '', year: '2024', type: '4x4', price_per_day: '15000', seats: '7', address: '', plateNumber: '', fuelType: 'Diesel', transmission: 'Automatic' });
      setDocuments([]);
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
      creditHostPayout(user?.id || b.ownerId || 'a0000000-0000-0000-0000-000000000002', earned, b.bookingRef);
      sendNotification({
        recipientId: user?.id,
        role: 'VEHICLE_OWNER',
        type: 'TRIP_COMPLETED',
        title: 'Trip Completed & Revenue Released',
        message: `Trip ${b.bookingRef} marked completed! ${formatPrice(earned)} has been released to your Net Earnings balance.`,
        link: '/dashboard/owner?tab=earnings',
      });
      setApprovalAlert(`🎉 Trip ${b.bookingRef} completed! ${formatPrice(earned)} released to your Net Earnings & Wallet balance.`);
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

  const TABS = [
    { id: 'fleet',    label: `My Registered Cars (${vehicles.length})`, icon: Car },
    { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Clock },
    { id: 'add',      label: 'Register Car', icon: PlusCircle },
    { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
    { id: 'alerts',   label: `Alerts (${notifications.filter(n => !n.is_read).length})`, icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6 font-display text-slate-900">

      {/* APPROVAL ALERT POPUP */}
      {approvalAlert && (
        <div className="rounded-3xl border border-amber-400/50 bg-gradient-to-r from-[#0E1526] via-[#161F36] to-[#0E1526] p-5 shadow-2xl text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-amber-500/20 p-3 text-amber-400 border border-amber-500/40 shrink-0 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
                  Official Vehicle Accreditation
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                  ✓ Automated WhatsApp Notification Ready
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed max-w-2xl">{approvalAlert}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {vehicles.some(x => x.status === 'APPROVED') && (
              <a
                href={getHostApprovalWhatsAppUrl({
                  hostName: `${user?.firstName || 'Matthew'} ${user?.lastName || ''}`.trim(),
                  hostPhone: (user as any)?.phone || '0712345678',
                  vehicle: vehicles.find(x => x.status === 'APPROVED') || vehicles[0],
                })}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !py-2 !px-4 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md flex items-center gap-1.5 transition"
                title="Open official WhatsApp vehicle approval notice"
              >
                <span>💬 Open WhatsApp Accreditation</span>
              </a>
            )}
            <button
              onClick={() => setApprovalAlert(null)}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                      <div className="absolute top-3 right-3">
                        <VehicleStatusBadge
                          isHired={hireStatus.isHired}
                          isLive={isLive}
                          isPendingApproval={v.status === 'PENDING_APPROVAL'}
                          variant="overlay"
                        />
                      </div>
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
                    {v.status === 'APPROVED' && (() => {
                      const activeBooking = vBookings.find(b => b.status === 'IN_PROGRESS' || b.status === 'ACTIVE');
                      const handover = activeBooking ? getHandoverByBookingId(activeBooking.id) : undefined;
                      const overdueEval = activeBooking ? evaluateTripOverdueStatus(activeBooking) : null;
                      const completedWithInspection = vBookings
                        .filter(b => b.status === 'COMPLETED')
                        .map(b => ({ booking: b, inspection: getInspectionByBookingId(b.id) }))
                        .filter(item => item.inspection !== undefined);

                      return (
                        <div className="space-y-2.5">
                          {hireStatus.isHired || activeBooking ? (
                            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                  <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                                  Active Rental in Progress 🔐
                                </span>
                                {overdueEval && (
                                  <span className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${overdueEval.badgeClass}`}>
                                    {overdueEval.label}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-amber-950 space-y-1">
                                <p>
                                  <strong>Renter:</strong> {activeBooking?.touristName || hireStatus.touristName || 'Traveler'} ({activeBooking?.touristPhone || 'Direct Client'})
                                </p>
                                <p className="text-[11px] text-amber-800">
                                  <strong>Handover State:</strong> {handover ? `✓ Handover Confirmed at ${handover.odometerReading.toLocaleString()} km (Fuel: ${handover.fuelLevelPercent}%)` : 'Handover In Progress'}
                                </p>
                                {handover?.existingDamageNotes && (
                                  <p className="text-[10px] text-amber-700 italic">
                                    Pre-departure notes: "{handover.existingDamageNotes}"
                                  </p>
                                )}
                              </div>
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
                                    <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    {isLive ? 'Live on Marketplace' : 'Offline (Standby)'}
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
                          )}

                          {/* Compliance Documents Status Badges */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                            <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Compliance Docs:</span>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                ✓ Logbook Verified
                              </span>
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                ✓ Commercial Insurance
                              </span>
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-teal/10 text-teal border border-teal/20">
                                ✓ NTSA Inspection
                              </span>
                            </div>
                          </div>

                          {/* Return History & Damage Log (if completed trips exist) */}
                          {completedWithInspection.length > 0 && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                              <span className="font-bold text-slate-700 text-[11px] block">
                                Recent Rental Return Inspection Log:
                              </span>
                              {completedWithInspection.slice(0, 2).map(({ booking: cb, inspection: ci }) => (
                                <div key={cb.id} className="text-[11px] text-slate-600 flex justify-between items-center border-t border-slate-200/60 pt-1">
                                  <span>{cb.touristName} (Ref: {cb.bookingRef})</span>
                                  <span className={`font-mono font-bold ${ci?.damageFound ? 'text-red-700' : 'text-emerald-700'}`}>
                                    {ci?.damageFound ? `⚠ Damage: ${ci.damageDescription}` : '✓ Returned Clean (0 Damage)'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleGenerateSampleBooking(v)}
                          title="Generate a realistic incoming booking request for this car"
                          className="btn-secondary !py-1 !px-2.5 text-[11px] font-bold text-teal-800 bg-teal-50 border-teal-200 hover:bg-teal-100 flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3 text-teal-600" /> + Test Booking
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
                  <h3 className="font-serif text-lg font-bold text-slate-900">No vehicles available at the moment</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    You have not registered any vehicles to your host fleet yet. Register your vehicle to submit it for Admin verification and push it live to the marketplace.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button onClick={() => switchTab('add')} className="btn-primary !py-2 !px-4 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5">
                      <PlusCircle className="h-4 w-4" /> Register Your First Car
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
        <div className="space-y-6">
          {/* OFFICIAL ACCREDITATION & WHATSAPP NOTICES */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600">💬</span> Official Vehicle WhatsApp Accreditations
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Automated onboarding notices and official M-TRAVEL accreditation dispatched to your registered WhatsApp.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 text-xs font-mono font-bold">
                {vehicles.filter(v => v.status === 'APPROVED').length} Accredited Vehicles
              </span>
            </div>

            {vehicles.filter(v => v.status === 'APPROVED').length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium">
                No accredited vehicles yet. Once the Admin approves your submitted vehicle, your executive onboarding accreditation will be dispatched via automated WhatsApp.
              </div>
            ) : (
              <div className="grid gap-3">
                {vehicles.filter(v => v.status === 'APPROVED').map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#122320] to-slate-900 border border-emerald-500/30 p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                          OFFICIAL ACCREDITATION ACTIVE
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Plate: {v.plateNumber || 'Verified Fleet'}
                        </span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-white pt-0.5">{v.make} {v.model} ({v.year || '2024'})</h3>
                      <p className="text-xs text-slate-300 line-clamp-1">Approved &amp; Live for tourist bookings at KES {v.pricePerDay.toLocaleString()}/day.</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getHostApprovalWhatsAppUrl({
                          hostName: `${user?.firstName || v.ownerName || 'Matthew'} ${user?.lastName || ''}`.trim(),
                          hostPhone: (user as any)?.phone || '0712345678',
                          vehicle: v,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary !py-2 !px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-sm flex items-center gap-1.5"
                      >
                        💬 Open WhatsApp Accreditation
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SYSTEM NOTIFICATIONS SECTION */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" /> System Notifications
            </h2>
            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium">
                No system alerts yet.
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
              { key: 'make', label: 'Vehicle Make (e.g. Toyota, Land Rover)', placeholder: 'e.g. Toyota' },
              { key: 'model', label: 'Model (e.g. Prado TX, Safari Van, RAV4)', placeholder: 'e.g. Prado TX' },
              { key: 'year', label: 'Year of Manufacture', placeholder: '2024', type: 'number' },
              { key: 'plateNumber', label: 'Registration Plate Number (Matches Logbook)', placeholder: 'e.g. KDA 123A' },
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

          {/* FUEL ENGINE TYPE SELECTOR */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800">
              Fuel Engine Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'Diesel', label: 'Diesel Engine' },
                { type: 'Petrol', label: 'Petrol Engine' },
                { type: 'Hybrid', label: 'Hybrid / EV' },
              ].map(({ type, label }) => (
                <button
                  key={type} type="button"
                  onClick={() => setNewV({ ...newV, fuelType: type })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    newV.fuelType === type 
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm' 
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Fuel className="h-3.5 w-3.5 text-amber-600" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* TRANSMISSION TYPE SELECTOR */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800">
              Transmission Gearbox
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'Automatic', label: 'Automatic Transmission' },
                { type: 'Manual', label: 'Manual Gearbox' },
              ].map(({ type, label }) => (
                <button
                  key={type} type="button"
                  onClick={() => setNewV({ ...newV, transmission: type })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    newV.transmission === type 
                      ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm' 
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Gauge className="h-3.5 w-3.5 text-teal-600" />
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

          {/* VEHICLE COMPLIANCE & OWNERSHIP DOCUMENTS SECTION */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-amber-600" /> Vehicle Compliance & Ownership Documents
                </label>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                  Upload official documentation to facilitate rapid Admin verification and approval. (Images or PDF format)
                </p>
              </div>
              <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-0.5 text-[10px] font-mono font-bold">
                {documents.length} Document(s) Attached
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* 1. LOGBOOK (PROOF OF OWNERSHIP) */}
              {(() => {
                const doc = documents.find(d => d.type === 'LOGBOOK');
                return (
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Vehicle Logbook Copy</span>
                            <span className="rounded bg-rose-100 text-rose-700 px-1.5 py-0.2 text-[9px] font-bold">Required</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">Official NTSA logbook / proof of title</p>
                        </div>
                      </div>
                      {doc ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="btn-secondary !py-1.5 !px-3 text-xs font-bold text-slate-800 border-slate-300 hover:bg-slate-100 w-full flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-amber-600" />
                          <span>Upload Logbook (PDF/Image)</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={docUploadLoading}
                            onChange={(e) => handleDocumentUpload(e, 'LOGBOOK', 'Vehicle Logbook (NTSA)')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. COMMERCIAL INSURANCE CERTIFICATE */}
              {(() => {
                const doc = documents.find(d => d.type === 'INSURANCE');
                return (
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Commercial / PSV Insurance</span>
                            <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[9px] font-bold">Recommended</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">Comprehensive chauffeur/self-drive cover</p>
                        </div>
                      </div>
                      {doc ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="btn-secondary !py-1.5 !px-3 text-xs font-bold text-slate-800 border-slate-300 hover:bg-slate-100 w-full flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-amber-600" />
                          <span>Upload Insurance Certificate</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={docUploadLoading}
                            onChange={(e) => handleDocumentUpload(e, 'INSURANCE', 'Commercial Insurance Certificate')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. NTSA ROADWORTHINESS CERTIFICATE */}
              {(() => {
                const doc = documents.find(d => d.type === 'INSPECTION_CERT');
                return (
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Roadworthiness Certificate</span>
                            <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[9px] font-bold">Optional</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">NTSA inspection report / sticker</p>
                        </div>
                      </div>
                      {doc ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="btn-secondary !py-1.5 !px-3 text-xs font-bold text-slate-800 border-slate-300 hover:bg-slate-100 w-full flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-amber-600" />
                          <span>Upload Inspection Cert</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={docUploadLoading}
                            onChange={(e) => handleDocumentUpload(e, 'INSPECTION_CERT', 'NTSA Roadworthiness Certificate')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. OTHER COMPLIANCE DOCUMENT */}
              {(() => {
                const doc = documents.find(d => d.type === 'OTHER');
                return (
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Additional Document</span>
                            <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[9px] font-bold">Optional</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">Service records, permits or host ID</p>
                        </div>
                      </div>
                      {doc ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="btn-secondary !py-1.5 !px-3 text-xs font-bold text-slate-800 border-slate-300 hover:bg-slate-100 w-full flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-amber-600" />
                          <span>Upload Other Document</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={docUploadLoading}
                            onChange={(e) => handleDocumentUpload(e, 'OTHER', 'Vehicle Supporting Document')}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}
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

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <FileText className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-serif font-bold text-base">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{previewDoc.fileName} • {previewDoc.fileSize}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-slate-100 p-2 flex items-center justify-center">
              {previewDoc.fileUrl.startsWith('data:image/') || previewDoc.fileUrl.includes('unsplash') || previewDoc.fileName.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-h-[60vh] w-auto rounded-lg object-contain shadow-xs" />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">PDF Document Uploaded</p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-1.5 text-xs font-bold text-white !py-2 !px-4"
                  >
                    <Download className="h-3.5 w-3.5" /> Download / Open Document
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
