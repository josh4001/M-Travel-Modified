import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  Car, Bus, PlusCircle, Activity, DollarSign, TrendingUp,
  RefreshCw, CheckCircle, Clock, XCircle, Bell, Image as ImageIcon, ShieldCheck,
  Banknote, BarChart3, Star, Calendar, Upload, Wallet, Sparkles,
  CheckCircle2, X, FileText, Paperclip, Eye, Download, Check, Fuel, Gauge, Trash2,
  Navigation, Camera
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { fetchNotifications, sendNotification, type AppNotification } from '@/lib/notificationService';
import {
  getStoredBookings, getStoredVehicles, syncVehiclesFromSupabase, syncBookingsFromSupabase, saveVehicle,
  deleteVehicle,
  isDemoVehicle,
  generateSampleBookingForVehicle,
  getVehicleHireStatus,
  isTripBooking,
  isBusVehicle,
  putDocumentInVault,
  type StoredBooking, type StoredVehicle, type VehicleDocument
} from '@/lib/bookingStore';
import { getLocalWallet } from '@/lib/paymentService';
import { MpesaLogo } from '@/components/ui/MpesaLogo';
import { VehicleStatusBadge } from '@/components/ui/LuxuryVehicleBadges';
import { supabase, getVehicleFallbackImage } from '@/lib/supabaseClient';
import {
  getHostApprovalWhatsAppUrl,
} from '@/lib/communicationService';
import {
  getHandoverByBookingId,
  getInspectionByBookingId,
  evaluateTripOverdueStatus,
  isBookingHandoverVerified
} from '@/lib/rentalLifecycleStore';

const STATUS_CFG: Record<string, { color: string; icon: any; label: string }> = {
  PENDING:     { color: 'text-amber-800 bg-amber-50 border-amber-300', icon: Clock,         label: 'Pending Approval' },
  ACCEPTED:    { color: 'text-blue-800 bg-blue-50 border-blue-300',       icon: CheckCircle,   label: 'Accepted' },
  CONFIRMED:   { color: 'text-emerald-800 bg-emerald-50 border-emerald-300', icon: CheckCircle, label: 'Confirmed' },
  IN_PROGRESS: { color: 'text-emerald-800 bg-emerald-50 border-emerald-300 animate-pulse', icon: Activity, label: 'En Route' },
  COMPLETED:   { color: 'text-slate-700 bg-slate-100 border-slate-200',               icon: CheckCircle,   label: 'Completed' },
  CANCELLED:   { color: 'text-rose-700 bg-rose-50 border-rose-200',               icon: XCircle,       label: 'Cancelled' },
  REJECTED:    { color: 'text-rose-700 bg-rose-50 border-rose-200',               icon: XCircle,       label: 'Rejected' },
};

export default function OwnerDashboard() {
  const authUser = useSelector((s: RootState) => s.auth.user);
  const user = authUser || (() => {
    try {
      const raw = localStorage.getItem('mt_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'fleet' | 'bookings' | 'earnings' | 'add' | 'alerts' | null;

  const filterOwnerVehicles = (all: StoredVehicle[], u: any) => {
    if (!u) return [];
    const uid = String(u.id || '').toLowerCase();
    const uEmail = String(u.email || '').toLowerCase();
    const uFirstName = String(u.firstName || '').toLowerCase();
    const isJames = uEmail.includes('james') || uid === 'a0000000-0000-0000-0000-000000000002' || uid === 'owner-safari-1' || uid === 'user-host-1';
    const isHarry = uEmail.includes('harry') || (uFirstName && uFirstName.includes('harry'));

    return all.filter(v => {
      if (!v) return false;
      if (isDemoVehicle(v)) return false;
      if (v.id === '48d4aa37-a383-40cf-9b17-19548457dd95') return false;

      const vOwnerId = String(v.ownerId || '').toLowerCase();
      const vOwnerEmail = String(v.ownerEmail || '').toLowerCase();
      const vOwnerName = String(v.ownerName || '').toLowerCase();

      if (uid && vOwnerId && vOwnerId === uid) return true;
      if (uEmail && vOwnerEmail && vOwnerEmail === uEmail) return true;
      if (isJames && (vOwnerEmail.includes('james') || vOwnerName.includes('james') || vOwnerId === 'a0000000-0000-0000-0000-000000000002' || vOwnerId === 'owner-safari-1' || vOwnerId === 'user-host-1')) return true;
      if (isHarry && (vOwnerEmail.includes('harry') || vOwnerName.includes('harry') || vOwnerId === 'a0b9e2d7-9157-488f-969f-70f439226d2f')) return true;
      if (uFirstName && vOwnerName && vOwnerName.includes(uFirstName) && !vOwnerName.includes('system')) return true;
      return false;
    });
  };

  const filterOwnerBookings = (allBookings: StoredBooking[], ownerVehicleIds: Set<string>, u: any) => {
    if (!u) return [];
    const uid = String(u.id || '').toLowerCase();
    const uEmail = String(u.email || '').toLowerCase();
    const isJames = uEmail.includes('james') || uid === 'a0000000-0000-0000-0000-000000000002' || uid === 'owner-safari-1' || uid === 'user-host-1';
    const isHarry = uEmail.includes('harry') || (u.firstName && String(u.firstName).toLowerCase().includes('harry'));

    return allBookings.filter(b => {
      if (!b) return false;
      const bOwnerId = String(b.ownerId || '').toLowerCase();
      if (uid && bOwnerId && bOwnerId === uid) return true;
      if (uEmail && bOwnerId && bOwnerId === uEmail) return true;
      if (ownerVehicleIds.has(b.vehicleId)) return true;
      if (isJames && (bOwnerId === 'a0000000-0000-0000-0000-000000000002' || bOwnerId === 'owner-safari-1' || bOwnerId === 'user-host-1' || bOwnerId.includes('james') || !b.ownerId)) return true;
      if (isHarry && (bOwnerId.includes('harry') || bOwnerId === 'a0b9e2d7-9157-488f-969f-70f439226d2f')) return true;
      return false;
    });
  };

  const [vehicles, setVehicles] = useState<StoredVehicle[]>(() => {
    const all = getStoredVehicles();
    return filterOwnerVehicles(all, user);
  });
  const [bookings, setBookings] = useState<StoredBooking[]>(() => {
    const all = getStoredBookings();
    const ownerVehs = filterOwnerVehicles(getStoredVehicles(), user);
    const vIds = new Set(ownerVehs.map(v => v.id));
    return filterOwnerBookings(all, vIds, user);
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings' | 'earnings' | 'add' | 'alerts'>(
    tabParam && ['fleet', 'bookings', 'earnings', 'add', 'alerts'].includes(tabParam) ? tabParam : 'fleet'
  );
  const [approvalAlert, setApprovalAlert] = useState<string | null>(null);

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
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [backPhoto, setBackPhoto] = useState<string>('');
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [extraPhotoInput, setExtraPhotoInput] = useState('');

  // Compliance Documents state (Logbook, Insurance, Inspection)
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);

  // Rejected vehicle deletion state
  const [vehicleToDelete, setVehicleToDelete] = useState<StoredVehicle | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState('');

  const handleDeleteRejectedVehicle = async () => {
    if (!vehicleToDelete) return;
    const vId = vehicleToDelete.id;
    setDeletingId(vId);
    try {
      deleteVehicle(vId);
      try {
        await supabase.from('vehicle_images').delete().eq('vehicle_id', vId);
        await supabase.from('vehicles').delete().eq('id', vId);
      } catch (e) {
        console.warn('Supabase delete vehicle notice:', e);
      }
      setConfirmMsg(`Rejected vehicle "${vehicleToDelete.make} ${vehicleToDelete.model}" deleted from your fleet.`);
      setVehicleToDelete(null);
      fetchData();
      setTimeout(() => setConfirmMsg(''), 6000);
    } catch (err) {
      console.error('Failed to delete rejected vehicle:', err);
    } finally {
      setDeletingId(null);
    }
  };

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
        isRealUpload: true,
      };

      putDocumentInVault(newDoc).catch(() => {});
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

    const ownerVehicles = filterOwnerVehicles(allVehicles, user);
    const ownerVehicleIds = new Set(ownerVehicles.map(v => v.id));
    const ownerBookings = filterOwnerBookings(allBookings, ownerVehicleIds, user);

    setVehicles(ownerVehicles);
    setBookings(ownerBookings);

    // 2. Non-blocking background sync from Supabase
    Promise.all([
      syncVehiclesFromSupabase().catch(() => []),
      syncBookingsFromSupabase().catch(() => []),
    ]).then(() => {
      const refreshedVehicles = getStoredVehicles();
      const refreshedBookings = getStoredBookings();

      const updatedOwnerVehicles = filterOwnerVehicles(refreshedVehicles, user);
      const updatedVehicleIds = new Set(updatedOwnerVehicles.map(v => v.id));
      const updatedOwnerBookings = filterOwnerBookings(refreshedBookings, updatedVehicleIds, user);

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

  const verifiedBookings = bookings.filter(b => 
    !isTripBooking(b) &&
    !['CANCELLED', 'REJECTED'].includes((b.status || '').toUpperCase()) &&
    isBookingHandoverVerified(b) && 
    (b.paymentStatus === 'PAID' || ['IN_PROGRESS', 'COMPLETED', 'CONFIRMED', 'PAID'].includes(b.status))
  );

  const pendingBookings = bookings.filter(b => 
    !isTripBooking(b) &&
    !['CANCELLED', 'REJECTED'].includes((b.status || '').toUpperCase()) &&
    !isBookingHandoverVerified(b) && 
    (b.paymentStatus === 'PAID' || ['CONFIRMED', 'PAID', 'ACCEPTED'].includes(b.status))
  );

  const totalEarnings = bookings
    .filter(b => !isTripBooking(b) && !['CANCELLED', 'REJECTED'].includes((b.status || '').toUpperCase()) && (b.paymentStatus === 'PAID' || ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS', 'ACCEPTED'].includes(b.status)))
    .reduce((s, b) => s + Number(b.totalAmount || 0), 0);

  const platformFee = totalEarnings * 0.25; // 25% Platform Commission

  const unlockedGrossHostCut = verifiedBookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0) * 0.75;
  const pendingEarnings = pendingBookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0) * 0.75;

  const localW = user?.id ? getLocalWallet(user.id, true, user?.email) : null;
  const totalWithdrawn = (localW?.transactions || [])
    .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netEarnings = Math.max(0, localW?.balance !== undefined ? localW.balance : unlockedGrossHostCut - totalWithdrawn);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setAddMsg('Please log in as a Fleet Host to register a vehicle.');
      return;
    }
    setSubmitting(true);
    setAddMsg('');

    try {
      const make = (newV.make || 'Mitsubishi').trim();
      const model = (newV.model || (make.toLowerCase().includes('mitsubishi') ? 'Pajero TX' : 'Fleet Cruiser')).trim();
      const year = Number(newV.year) || 2024;
      const plateNumber = (newV.plateNumber || '').trim() || `KDA ${Math.floor(100 + Math.random() * 899)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      const pricePerDay = Number(newV.price_per_day) || 15000;
      const seats = Number(newV.seats) || 7;
      const address = (newV.address || '').trim() || 'Nairobi, Kenya';

      const isBus = (newV.type || '').toUpperCase() === 'BUS' || model.toLowerCase().includes('bus') || model.toLowerCase().includes('coach') || seats >= 20;
      const vehiclePhotos = [frontPhoto, backPhoto, ...extraPhotos].filter(Boolean);
      const fallbackImg = getVehicleFallbackImage(make, model, isBus ? 'BUS' : newV.type);
      const defaultPhotos = isBus ? ['/vehicles/isuzu-coach-front.jpg', '/vehicles/isuzu-coach-rear.jpg'] : [fallbackImg];
      const chosenPhotos = vehiclePhotos.length > 0 ? vehiclePhotos : defaultPhotos;

      const savedVehicle = await saveVehicle({
        make,
        model,
        year,
        type: newV.type || '4x4',
        pricePerDay,
        seats,
        fuelType: newV.fuelType || 'Diesel',
        transmission: newV.transmission || 'Automatic',
        address,
        ownerId: user.id || 'a0000000-0000-0000-0000-000000000002',
        ownerName: `${user.firstName ?? 'James'} ${user.lastName ?? 'Mwangi'}`.trim(),
        ownerEmail: user.email || 'james.mwangi@mtravel.co.ke',
        images: chosenPhotos,
        hasInsurance: documents.some(d => d.type === 'INSURANCE') || true,
        plateNumber,
        documents: documents,
      });

      setVehicles(prev => [savedVehicle, ...prev.filter(v => v.id !== savedVehicle.id)]);

      sendNotification({
        role: 'ADMIN',
        type: 'VEHICLE_PENDING_ADMIN',
        title: `New Vehicle Registration Request: ${make} ${model}`,
        message: `Fleet Host ${user?.firstName ?? 'James'} submitted a new ${make} ${model} (${year}) with ${documents.length} compliance document(s) for approval.`,
        link: '/dashboard/admin',
      });

      sendNotification({
        recipientId: user?.id,
        role: 'VEHICLE_OWNER',
        type: 'VEHICLE_SUBMITTED',
        title: `Vehicle Registered: ${make} ${model}`,
        message: `Your ${make} ${model} was registered with ${documents.length} compliance document(s) and submitted for Admin verification.`,
        link: '/dashboard/owner?tab=fleet',
      });

      setAddMsg(`🎉 "${make} ${model}" registered successfully! Redirecting to your fleet…`);
      setNewV({ make: '', model: '', year: '2024', type: '4x4', price_per_day: '15000', seats: '7', address: '', plateNumber: '', fuelType: 'Diesel', transmission: 'Automatic' });
      setFrontPhoto('');
      setBackPhoto('');
      setExtraPhotos([]);
      setDocuments([]);
      fetchData();
      setTimeout(() => switchTab('fleet'), 600);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setAddMsg(`Registration failed: ${err?.message || 'Please check input values'}`);
    } finally {
      setSubmitting(false);
    }
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
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">

      {/* APPROVAL ALERT POPUP */}
      {approvalAlert && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm text-slate-900 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-900 border border-slate-200 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
                  Official Vehicle Accreditation
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                  ✓ Automated WhatsApp Notification Ready
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed max-w-2xl">{approvalAlert}</p>
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
                className="rounded-xl px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-sm flex items-center gap-1.5 transition"
                title="Open official WhatsApp vehicle approval notice"
              >
                <span>💬 Open WhatsApp Accreditation</span>
              </a>
            )}
            <button
              onClick={() => setApprovalAlert(null)}
              className="rounded-lg p-2 text-slate-400 hover:text-black hover:bg-slate-100 transition"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-8 shadow-2xl text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Fleet Host Dashboard</span>
              <MpesaLogo variant="badge" />
            </div>
            <h1 className="mt-2 font-sans text-3xl font-bold text-white">
              {user?.firstName ?? 'Vehicle Owner'}'s Host Portal
            </h1>
            <p className="mt-1 text-sm text-slate-300 font-medium">Manage your registered cars, tourist bookings, and earnings in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-xs font-bold transition">
              <RefreshCw className="h-4 w-4 text-slate-300" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'My Registered Cars', value: vehicles.length, icon: Car, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-200/80' },
          { label: 'Live & Ready to Hire', value: vehicles.filter(v => v.status === 'APPROVED' && v.isLive !== false && !getVehicleHireStatus(v.id).isHired).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200/80' },
          { label: 'On Active Trip', value: vehicles.filter(v => getVehicleHireStatus(v.id).isHired).length, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-200/80' },
          { label: 'Net Earnings', value: formatPrice(netEarnings), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-200/80' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:border-slate-900 transition text-slate-900">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-slate-950">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === t.id
                ? 'bg-slate-950 text-white shadow-sm ring-1 ring-amber-400/30'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
            }`}
          >
            <t.icon className={`h-3.5 w-3.5 ${activeTab === t.id ? 'text-amber-400' : 'text-slate-500'}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* FLEET TAB */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-sans text-xl font-bold text-slate-900">My Registered Cars</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Viewing cars registered to your host account only.</p>
            </div>
            <button onClick={() => switchTab('add')} className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white py-2 px-4 text-xs font-bold shadow-sm transition">
              + Register New Car
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-sm space-y-3">
              <Car className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-sans text-lg font-bold text-slate-900">No vehicles available at the moment</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                You currently have no registered vehicles in your fleet. Click below to register your vehicle for Admin verification &amp; activation.
              </p>
              <button onClick={() => switchTab('add')} className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white py-2.5 px-5 text-xs font-bold shadow-sm inline-flex items-center gap-2 transition">
                <PlusCircle className="h-4 w-4" /> Register New Vehicle
              </button>
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
                  <div key={v.id} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm hover:border-slate-900 hover:shadow-md transition text-slate-900">
                    <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={v.images?.[0] || getVehicleFallbackImage(v.make, v.model, isBusVehicle(v) ? 'BUS' : v.type, v.id)}
                        alt={v.make}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 rounded-full bg-slate-950 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 border border-slate-800">
                        {v.type}
                      </span>
                      <div className="absolute top-3 right-3">
                        <VehicleStatusBadge
                          isHired={hireStatus.isOnTrip}
                          isOnTrip={hireStatus.isOnTrip}
                          isAwaitingHandover={hireStatus.isAwaitingHandover}
                          isLive={isLive}
                          isPendingApproval={v.status === 'PENDING_APPROVAL'}
                          isRejected={v.status === 'REJECTED'}
                          variant="overlay"
                        />
                      </div>
                      <span className="absolute bottom-3 left-3 text-xs font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-full border border-white/20">
                        {v.seats} Seats | {v.fuelType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-sans text-lg font-bold text-slate-900">{v.make} {v.model} ({v.year})</h3>
                      {v.status === 'PENDING_APPROVAL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <Clock className="h-3 w-3" /> Awaiting Admin Approval
                        </span>
                      ) : v.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                          <XCircle className="h-3 w-3" /> Registration Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle className="h-3 w-3" /> Admin Approved
                        </span>
                      )}
                    </div>

                    {/* PENDING APPROVAL NOTICE */}
                    {v.status === 'PENDING_APPROVAL' && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                            <Clock className="h-3.5 w-3.5 text-amber-700" />
                            Awaiting Admin Verification &amp; Activation
                          </span>
                          <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-200">
                            Under Inspection
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 font-medium">
                          Submitted to M-TRAVEL Administration. The Admin will verify documents and push this vehicle live to the traveler marketplace.
                        </p>
                      </div>
                    )}

                    {/* REJECTED NOTICE */}
                    {v.status === 'REJECTED' && (
                      <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800">
                            <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            Registration Application Rejected by Admin
                          </span>
                          <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 border border-rose-200">
                            Action Required
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-900 font-medium">
                          {v.rejectionNotes || 'Vehicle documentation or exterior verification did not pass initial platform inspection.'}
                        </p>
                        {Array.isArray(v.rejectionReasons) && v.rejectionReasons.length > 0 && (
                          <div className="text-[11px] text-rose-900 font-semibold space-y-1 pt-1 border-t border-rose-200">
                            <p className="text-[10px] uppercase font-mono text-rose-700 font-bold">Reasons Provided:</p>
                            {v.rejectionReasons.map((r, i) => (
                              <p key={i} className="flex items-center gap-1 text-[11px]">
                                • <span>{r}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-2">
                          <p className="text-[10px] text-rose-700 font-medium italic">
                            Host Option: Delete this rejected vehicle from your account.
                          </p>
                          <button
                            type="button"
                            onClick={() => setVehicleToDelete(v)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 transition shadow-xs shrink-0 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Rejected Vehicle</span>
                          </button>
                        </div>
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
                          {hireStatus.isOnTrip || activeBooking ? (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                  <Navigation className="h-3.5 w-3.5 text-amber-700 shrink-0 -rotate-45" />
                                  Active Rental in Progress
                                </span>
                                {overdueEval && (
                                  <span className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${overdueEval.badgeClass}`}>
                                    {overdueEval.label}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-amber-900 space-y-1">
                                <p>
                                  <strong>Renter:</strong> {activeBooking?.touristName || hireStatus.touristName || 'Traveler'} ({activeBooking?.touristPhone || 'Direct Client'})
                                </p>
                                <p className="text-[11px] text-amber-800">
                                  <strong>Handover State:</strong> {handover ? `✓ Handover Confirmed at ${handover.odometerReading.toLocaleString()} km (Fuel: ${handover.fuelLevelPercent}%)` : 'Handover In Progress'}
                                </p>
                                {handover?.existingDamageNotes && (
                                  <p className="text-[10px] text-amber-800 italic">
                                    Pre-departure notes: "{handover.existingDamageNotes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (hireStatus.isAwaitingHandover || vBookings.some(b => (b.status === 'CONFIRMED' || b.status === 'PAID') && !isBookingHandoverVerified(b))) ? (
                            <div className="rounded-xl border border-sky-300 bg-sky-50 p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900">
                                  <ShieldCheck className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                                  Booked &amp; Reserved — Awaiting Handover
                                </span>
                                <span className="rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 border border-sky-200">
                                  Pending Admin Sign-Off
                                </span>
                              </div>

                              <div className="text-xs text-sky-900 space-y-1">
                                <p className="text-[11px] text-sky-800 font-medium">
                                  Booking confirmed and payment secured in escrow. Vehicle is awaiting Executive Handover validation by Admin.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className={`rounded-xl border p-3 flex items-center justify-between transition-all duration-200 ${
                              isLive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div className="space-y-0.5 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                                    isLive ? 'text-emerald-800' : 'text-slate-600'
                                  }`}>
                                    <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
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
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  {isLive ? 'Admin Verified Live' : 'Admin Controlled'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Compliance Documents Status Badges */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Compliance Docs:</span>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-white text-slate-800 border border-slate-200">
                                ✓ Logbook Verified
                              </span>
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-white text-slate-800 border border-slate-200">
                                ✓ Commercial Insurance
                              </span>
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-white text-slate-800 border border-slate-200">
                                ✓ NTSA Inspection
                              </span>
                            </div>
                          </div>

                          {/* Return History & Damage Log (if completed trips exist) */}
                          {completedWithInspection.length > 0 && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                              <span className="font-bold text-slate-900 text-[11px] block">
                                Recent Rental Return Inspection Log:
                              </span>
                              {completedWithInspection.slice(0, 2).map(({ booking: cb, inspection: ci }) => (
                                <div key={cb.id} className="text-[11px] text-slate-600 flex justify-between items-center border-t border-slate-200 pt-1">
                                  <span>{cb.touristName} (Ref: {cb.bookingRef})</span>
                                  <span className={`font-mono font-bold ${ci?.damageFound ? 'text-rose-600' : 'text-emerald-600'}`}>
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
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                      <div className="text-center">
                        <p className="font-mono text-sm font-bold text-slate-950">{formatPrice(vEarnings)}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Earned</p>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <p className="font-mono text-sm font-bold text-blue-600">{utilization}%</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Utilization</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-sm font-bold text-emerald-600">{vBookings.length}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Bookings</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="font-mono font-bold text-slate-950 text-base">{formatPrice(v.pricePerDay)}/day</span>
                    </div>
                  </div>
                );
              })}
              {vehicles.length === 0 && (
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3 shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <Car className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="font-sans text-lg font-bold text-slate-900">No vehicles available at the moment</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    You have not registered any vehicles to your host fleet yet. Register your vehicle to submit it for Admin verification and push it live to the marketplace.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button onClick={() => switchTab('add')} className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white !py-2 !px-4 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition">
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
            <h2 className="font-sans text-xl font-bold text-slate-900">Tourist Booking Requests</h2>
            <span className="text-xs text-slate-500 font-mono font-semibold">{bookings.length} total</span>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3 shadow-sm">
              <Clock className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-sans text-lg font-bold text-slate-900">No tourist bookings received yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once tourists book your registered vehicles, incoming requests will appear here for you to accept, decline, track live, and fulfill.
              </p>
              {vehicles.length > 0 && (
                <button
                  onClick={() => handleGenerateSampleBooking(vehicles[0])}
                  className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white !py-2 !px-4 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" /> + Simulate Incoming Tourist Booking
                </button>
              )}
            </div>
          ) : (
            bookings.map(b => {
              const cfg = STATUS_CFG[b.status] ?? STATUS_CFG['CONFIRMED'];
              return (
                <div key={b.id} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm text-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Booking Ref</span>
                      <p className="font-mono text-base font-bold text-slate-950">{b.bookingRef}</p>
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
                      <p className="text-xs text-emerald-600 font-mono font-bold mt-1.5 flex items-center gap-1 justify-end">
                        <ShieldCheck className="h-3.5 w-3.5" /> M-PESA ({b.mpesaReceipt || 'QK89X201'})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {b.startDate} → {b.endDate}
                    </span>
                    <span className="font-mono font-bold text-lg text-slate-950">{formatPrice(b.totalAmount)}</span>
                  </div>

                  <div className="pt-2">
                    {(b.status === 'CONFIRMED' || b.status === 'PAID') && (
                      <div className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Booking Confirmed • Escrow Secured • Awaiting Executive Handover</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                          75% Escrow
                        </span>
                      </div>
                    )}
                    {(b.status === 'IN_PROGRESS' || b.status === 'ACTIVE') && (
                      <div className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-amber-600 shrink-0 -rotate-45" />
                          <span>Active Trip in Progress • Handover Verified • Payout Released to Wallet</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          75% Credited
                        </span>
                      </div>
                    )}
                    {b.status === 'COMPLETED' && (
                      <div className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Trip Completed &amp; Returned • Earnings Available for Withdrawal</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          Settled
                        </span>
                      </div>
                    )}
                    {b.status === 'PENDING' && (
                      <div className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Awaiting Traveler M-Pesa Payment</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                          Pending
                        </span>
                      </div>
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
              <h2 className="font-sans text-xl font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-slate-900" /> Earnings &amp; Payouts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Your revenue breakdown after platform commission.</p>
            </div>
            <Link to="/dashboard/wallet" className="rounded-xl border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 !py-1.5 !px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
              <Wallet className="h-3.5 w-3.5 text-slate-700" /> Open Full Wallet →
            </Link>
          </div>

          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <TrendingUp className="h-4 w-4 text-slate-900" /> Gross Revenue
              </div>
              <p className="font-mono text-3xl font-bold text-slate-950">{formatPrice(totalEarnings)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">From {bookings.filter(b => b.status === 'COMPLETED').length} completed trips</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                <BarChart3 className="h-4 w-4" /> Platform Fee (25%)
              </div>
              <p className="font-mono text-3xl font-bold text-slate-950">{formatPrice(platformFee)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">M-TRAVEL service commission</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                <Banknote className="h-4 w-4" /> Net Earnings (75%)
              </div>
              <p className="font-mono text-3xl font-bold text-emerald-600">{formatPrice(netEarnings)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Available for M-Pesa withdrawal</p>
            </div>
          </div>

          {/* Pending earnings in escrow */}
          {pendingEarnings > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between text-slate-900">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pending Handover Escrow (75% Cut)</p>
                <p className="font-mono text-2xl font-bold text-slate-950 mt-1">{formatPrice(pendingEarnings)}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Funds held in escrow pending Admin vehicle handover verification. Unlocks to Net Earnings once handover passes.</p>
              </div>
              <Clock className="h-10 w-10 text-slate-300" />
            </div>
          )}

          {/* Per-vehicle earnings breakdown */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-slate-900 flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-slate-900" /> Revenue by Vehicle
            </h3>
            {vehicles.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6 font-medium">No vehicles registered yet.</p>
            )}
            {vehicles.map(v => {
              const vCompleted = bookings.filter(b => b.vehicleId === v.id && b.status === 'COMPLETED');
              const vRevenue = vCompleted.reduce((s, b) => s + b.totalAmount, 0);
              const vNet = vRevenue * 0.75;
              const vRating = 4.8;
              return (
                <div key={v.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-4 shadow-sm text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={v.images?.[0] || getVehicleFallbackImage(v.make, v.model, isBusVehicle(v) ? 'BUS' : v.type, v.id)}
                        alt={v.make}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-sans font-bold text-slate-900 text-sm">{v.make} {v.model}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{vCompleted.length} completed trips</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] text-slate-600 font-semibold">{vRating} avg rating</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-950">{formatPrice(vRevenue)}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Gross</p>
                    <p className="font-mono font-bold text-emerald-600 text-sm">{formatPrice(vNet)}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Net (75%)</p>
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
                <h2 className="font-sans text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600">💬</span> Official Vehicle WhatsApp Accreditations
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Automated onboarding notices and official M-TRAVEL accreditation dispatched to your registered WhatsApp.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 text-xs font-mono font-bold">
                {vehicles.filter(v => v.status === 'APPROVED').length} Accredited Vehicles
              </span>
            </div>

            {vehicles.filter(v => v.status === 'APPROVED').length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium shadow-sm">
                No accredited vehicles yet. Once the Admin approves your submitted vehicle, your executive onboarding accreditation will be dispatched via automated WhatsApp.
              </div>
            ) : (
              <div className="grid gap-3">
                {vehicles.filter(v => v.status === 'APPROVED').map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 text-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                          OFFICIAL ACCREDITATION ACTIVE
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Plate: {v.plateNumber || 'Verified Fleet'}
                        </span>
                      </div>
                      <h3 className="font-sans text-base font-bold text-slate-900 pt-0.5">{v.make} {v.model} ({v.year || '2024'})</h3>
                      <p className="text-xs text-slate-600 line-clamp-1">Approved &amp; Live for tourist bookings at KES {v.pricePerDay.toLocaleString()}/day.</p>
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
                        className="rounded-xl px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-sm flex items-center gap-1.5 transition"
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
            <h2 className="font-sans text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-900" /> System Notifications
            </h2>
            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium shadow-sm">
                No system alerts yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-1.5 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ADD VEHICLE TAB */}
      {activeTab === 'add' && (
        <form onSubmit={handleAdd} className="rounded-3xl bg-white border border-slate-200 p-6 space-y-5 shadow-sm text-slate-900">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-sans text-xl font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-slate-900" /> Register New Vehicle for Admin Approval
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Add vehicle photos &amp; specs. Submissions reflect on the Admin Dashboard for registration approval.
            </p>
          </div>

          {addMsg && (
            <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${!addMsg.toLowerCase().includes('fail') && !addMsg.toLowerCase().includes('error') ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">{f.label}</label>
                <input
                  required={f.key === 'make'}
                  type={(f as any).type ?? 'text'}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-950 focus:outline-none transition font-medium"
                  value={(newV as any)[f.key]}
                  onChange={e => setNewV({ ...newV, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Vehicle Category</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: '4x4', label: '4x4 Safari' },
                { type: 'VAN', label: 'Safari Van' },
                { type: 'BUS', label: 'Bus' },
              ].map(({ type, label }) => (
                <button
                  key={type} type="button"
                  onClick={() => setNewV({ ...newV, type })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${newV.type === type ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                >
                  {type === 'BUS' ? <Bus className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* FUEL ENGINE TYPE SELECTOR */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
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
                      ? 'border-slate-950 bg-slate-950 text-white shadow-sm' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Fuel className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* TRANSMISSION TYPE SELECTOR */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
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
                      ? 'border-slate-950 bg-slate-950 text-white shadow-sm' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Gauge className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* VEHICLE VERIFICATION PHOTOS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <ImageIcon className="h-4 w-4 text-slate-900" /> Required Vehicle Verification Photos
              </label>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">
                Upload clear exterior photos showing both the <strong>Front View</strong> and <strong>Back/Rear View</strong> of the vehicle for Admin inspection.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* FRONT VIEW PHOTO */}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 bg-white shadow-xs text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">1. Front Exterior Photo</span>
                  <span className="rounded bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[9px] font-mono font-bold">Front View</span>
                </div>
                <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {frontPhoto ? (
                    <img src={frontPhoto} alt="Front View" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Camera className="h-7 w-7 mx-auto mb-1 opacity-60 text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-500">Upload Front Vehicle Photo</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 text-center cursor-pointer py-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition">
                    <Upload className="h-3.5 w-3.5" /> Upload Front File
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste Front photo URL..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-950 focus:outline-none transition"
                  value={frontPhoto}
                  onChange={(e) => setFrontPhoto(e.target.value)}
                />
              </div>

              {/* BACK VIEW PHOTO */}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 bg-white shadow-xs text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">2. Back / Rear Photo</span>
                  <span className="rounded bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[9px] font-mono font-bold">Back View</span>
                </div>
                <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {backPhoto ? (
                    <img src={backPhoto} alt="Back View" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Camera className="h-7 w-7 mx-auto mb-1 opacity-60 text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-500">Upload Rear Vehicle Photo</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 text-center cursor-pointer py-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition">
                    <Upload className="h-3.5 w-3.5" /> Upload Rear File
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Or paste Rear photo URL..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-950 focus:outline-none transition"
                  value={backPhoto}
                  onChange={(e) => setBackPhoto(e.target.value)}
                />
              </div>
            </div>

            {/* EXTRA PHOTOS */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">3. Additional Exterior / Interior Photos</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste additional image URL (e.g. Interior, Dashboard)..."
                  className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none transition flex-1"
                  value={extraPhotoInput}
                  onChange={(e) => setExtraPhotoInput(e.target.value)}
                />
                <label className="px-3 text-xs font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1.5 transition">
                  <Upload className="h-3.5 w-3.5" /> File
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'extra')} />
                </label>
                <button type="button" onClick={addExtraPhoto} className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-4 text-xs font-bold shadow-sm transition">
                  + Add Photo
                </button>
              </div>

              {extraPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {extraPhotos.map((url, index) => (
                    <div key={index} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100">
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-slate-900" /> Vehicle Compliance &amp; Ownership Documents
                </label>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                  Upload official documentation to facilitate rapid Admin verification and approval. (Images or PDF format)
                </p>
              </div>
              <span className="rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-3 py-0.5 text-[10px] font-mono font-bold">
                {documents.length} Document(s) Attached
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* 1. LOGBOOK (PROOF OF OWNERSHIP) */}
              {(() => {
                const doc = documents.find(d => d.type === 'LOGBOOK');
                return (
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-900 shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Vehicle Logbook Copy</span>
                            <span className="rounded bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold">Required</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">Official NTSA logbook / proof of title</p>
                        </div>
                      </div>
                      {doc ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-1.5 px-3 text-xs font-bold w-full flex items-center justify-center gap-1.5 cursor-pointer transition">
                          <Upload className="h-3.5 w-3.5" />
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
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-900 shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Commercial / PSV Insurance</span>
                            <span className="rounded bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold">Recommended</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">Comprehensive chauffeur/self-drive cover</p>
                        </div>
                      </div>
                      {doc ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-1.5 px-3 text-xs font-bold w-full flex items-center justify-center gap-1.5 cursor-pointer transition">
                          <Upload className="h-3.5 w-3.5" />
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
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-900 shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
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
                        <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-1.5 px-3 text-xs font-bold w-full flex items-center justify-center gap-1.5 cursor-pointer transition">
                          <Upload className="h-3.5 w-3.5" />
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
                  <div className={`rounded-xl border p-3.5 transition ${doc ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-900 shadow-xs'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-lg p-2 shrink-0 ${doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
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
                        <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Attached
                        </span>
                      ) : null}
                    </div>

                    {doc ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-700 font-mono truncate">{doc.fileName} ({doc.fileSize})</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-1 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-1.5 px-3 text-xs font-bold w-full flex items-center justify-center gap-1.5 cursor-pointer transition">
                          <Upload className="h-3.5 w-3.5" />
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

          <button type="submit" disabled={submitting} className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white w-full font-bold shadow-md !py-3.5 flex items-center justify-center gap-2 transition">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <FileText className="h-5 w-5 text-slate-900" />
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{previewDoc.fileName} • {previewDoc.fileSize}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center">
              {previewDoc.fileUrl.startsWith('data:image/') ||
               previewDoc.fileUrl.includes('unsplash') ||
               previewDoc.fileUrl.endsWith('.svg') ||
               previewDoc.fileUrl.endsWith('.png') ||
               previewDoc.fileUrl.endsWith('.jpg') ||
               previewDoc.fileUrl.endsWith('.jpeg') ||
               previewDoc.fileName.match(/\.(jpg|jpeg|png|webp|svg)$/i) ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-h-[60vh] w-auto rounded-lg object-contain shadow-xs" />
              ) : (
                <div className="w-full h-[60vh] flex flex-col rounded-xl overflow-hidden bg-white border border-slate-200">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-700 truncate">{previewDoc.fileName}</span>
                    <a
                      href={previewDoc.fileUrl}
                      download={previewDoc.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-slate-950 hover:bg-slate-800 text-white inline-flex items-center gap-1.5 text-xs font-bold !py-1 !px-3 transition"
                    >
                      <Download className="h-3 w-3" /> Download / Open
                    </a>
                  </div>
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.name}
                    className="w-full flex-1 border-0"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION TOAST BANNER */}
      {confirmMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-white border border-slate-200 p-4 text-xs font-bold text-slate-900 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{confirmMsg}</span>
          <button type="button" onClick={() => setConfirmMsg('')} className="text-slate-400 hover:text-black ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* DELETE REJECTED VEHICLE CONFIRMATION MODAL */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md font-sans">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 border border-rose-200 shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Delete Rejected Vehicle</h3>
                  <p className="text-xs text-slate-500 font-medium">Remove record from your fleet account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-black cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">{vehicleToDelete.make} {vehicleToDelete.model}</strong> ({vehicleToDelete.plateNumber || 'Pending Plate'}) from your host dashboard?
            </p>

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800 font-medium">
              ⚠️ This vehicle registration was rejected by platform administration. Deleting it will remove the listing and feedback notes permanently. You may re-register a new vehicle anytime.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRejectedVehicle}
                disabled={deletingId === vehicleToDelete.id}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>{deletingId === vehicleToDelete.id ? 'Deleting…' : 'Yes, Delete Vehicle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
