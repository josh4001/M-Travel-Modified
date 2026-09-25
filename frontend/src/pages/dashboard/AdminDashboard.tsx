import { useEffect, useState } from 'react';
import {
  Users, Car, Bus, Shield, DollarSign, Activity, CheckCircle,
  RefreshCw, BarChart3, TrendingUp, AlertTriangle, ArrowDownLeft, ArrowUpRight, FileCheck, Landmark,
  XCircle, Trash2, Server, Wifi, HardDrive, Clock, MapPin, Lock,
  Palmtree, Plus, Edit2, Check, ExternalLink, Sparkles, Award, Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useCurrency } from '@/context/CurrencyContext';
import { sendNotification } from '@/lib/notificationService';
import {
  getStoredBookings, getStoredVehicles, syncVehiclesFromSupabase, syncBookingsFromSupabase,
  approveVehicle as approveVehicleInStore, updateBookingStatus,
  toggleVehicleLiveStatus, getVehicleHireStatus, deleteVehicle, isVehicleLive, rejectVehicle,
  isTripBooking, isBusVehicle,
  type StoredBooking, type StoredVehicle
} from '@/lib/bookingStore';
import { syncUsersFromSupabase } from '@/lib/authService';
import {
  getStoredDestinations, saveDestination, updateDestination,
  deleteDestination as deleteDestinationInStore, toggleDestinationLiveStatus,
  type TravelDestinationItem, type HolidayOrTourCategory
} from '@/lib/destinationsStore';
import { VehicleStatusBadge, ChauffeurServiceBadge } from '@/components/ui/LuxuryVehicleBadges';
import {
  getHostApprovalWhatsAppUrl,
  openHostRejectionWhatsApp,
  getHostRejectionWhatsAppUrl,
} from '@/lib/communicationService';
import { getLocalAccounts, updateUserStatus } from '@/lib/authService';
import { DestinationVoucherModal } from '@/components/ui/DestinationVoucherModal';
import { VehicleInspectionModal } from '@/components/admin/VehicleInspectionModal';
import { VehicleHandoverModal } from '@/components/handover/VehicleHandoverModal';
import { VehicleReturnInspectionModal } from '@/components/handover/VehicleReturnInspectionModal';
import {
  getExceptionMetrics,
  getAttentionRequiredQueue,
  getAllIncidents,
  updateIncidentStatus,
  getAllAuditLogs,
  getHandoverByBookingId,
  type IncidentReport,
  type AuditLogEntry,
  type ExceptionMetrics,
  type AttentionItem
} from '@/lib/rentalLifecycleStore';
import {
  getStoredCreditProfiles,
  toggleTravelerRestriction,
} from '@/lib/creditScoreStore';

interface DBUser {
  id: string; email: string; first_name: string; last_name: string;
  role: string; is_active: boolean; created_at: string; phone?: string;
}

const getAdminUserList = (): DBUser[] => {
  return getLocalAccounts().map((a) => ({
    id: a.id,
    email: a.email,
    first_name: a.firstName,
    last_name: a.lastName,
    role: a.role,
    is_active: a.isActive !== false,
    created_at: '2026-01-15T00:00:00.000Z',
    phone: a.phone || '0712345678',
  }));
};

interface DBTransaction {
  id: string; type: string; amount: number; status: string;
  reference?: string; description?: string; created_at: string;
  wallets?: { user_id: string; users?: { first_name: string; last_name: string; role: string } };
}

type Tab = 'overview' | 'approvals' | 'accounting' | 'users' | 'fleet' | 'destinations' | 'bookings' | 'incidents' | 'audit_logs' | 'credit_scores';

export default function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers]         = useState<DBUser[]>(() => getAdminUserList());
  const [vehicles, setVehicles]   = useState<StoredVehicle[]>(() => getStoredVehicles());
  const [bookings, setBookings]   = useState<StoredBooking[]>(() => getStoredBookings());
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [loading]                 = useState(false);
  const [search, setSearch]       = useState('');
  const [approvalMsg, setApprovalMsg] = useState<{ text: string; waUrl?: string } | string | null>(null);
  const [selectedDestVoucher, setSelectedDestVoucher] = useState<StoredBooking | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  // Lifecycle & Exception management states (Admin)
  const [exceptionMetrics, setExceptionMetrics] = useState<ExceptionMetrics>(() => getExceptionMetrics());
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>(() => getAttentionRequiredQueue());
  const [incidentsList, setIncidentsList] = useState<IncidentReport[]>(() => getAllIncidents());
  const [auditLogsList, setAuditLogsList] = useState<AuditLogEntry[]>(() => getAllAuditLogs());
  const [selectedBookingForHandover, setSelectedBookingForHandover] = useState<StoredBooking | null>(null);
  const [selectedBookingForReturnInspection, setSelectedBookingForReturnInspection] = useState<StoredBooking | null>(null);
  const [incidentFilter, setIncidentFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [resolvingIncident, setResolvingIncident] = useState<IncidentReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Fleet Category Filter state (Admin Exclusive)
  const [fleetCategoryFilter, setFleetCategoryFilter] = useState<'vehicles' | 'buses'>('vehicles');

  // De-registration / Vehicle Deletion & Smart Inspection Modals (Admin Exclusive)
  const [inspectingVehicle, setInspectingVehicle] = useState<StoredVehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<StoredVehicle | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Violation of vehicle safety or roadworthiness standards');
  const [deleteCustomReason, setDeleteCustomReason] = useState<string>('');
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  // Destinations & Holidays management state (Admin Exclusive)
  const [destinationsList, setDestinationsList] = useState<TravelDestinationItem[]>(() => getStoredDestinations());
  const [destCategoryFilter, setDestCategoryFilter] = useState<'ALL' | HolidayOrTourCategory>('ALL');
  const [destSearch, setDestSearch] = useState('');
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<TravelDestinationItem | null>(null);

  const [destForm, setDestForm] = useState({
    title: '',
    subtitle: '',
    category: 'TOUR' as HolidayOrTourCategory,
    badge: 'Premier Safari Package',
    priceKES: 45000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    images: [] as string[],
    location: 'Maasai Mara, Kenya',
    region: 'Narok County',
    specs: '3 Days / 2 Nights, Full Board Lodge, 4x4 Cruiser, Park Entry Included',
    overview: 'All-inclusive guided safari with private 4x4 pop-up roof cruiser and certified safari guide.',
    highlights: 'Big Five game drives, Gourmet lodge dining, Cultural visit, Park entry fees',
    itinerary: 'Day 1: Transfer from Nairobi & afternoon safari\nDay 2: Full day wildlife safari with bush picnic\nDay 3: Sunrise game drive & return journey',
    isLive: true,
    featured: true,
  });

  const [alerts] = useState<any[]>([]);

  const fetchAll = async () => {
    // 1. Immediately reflect latest local persistent state
    setVehicles(getStoredVehicles());
    setBookings(getStoredBookings());
    setDestinationsList(getStoredDestinations());
    setExceptionMetrics(getExceptionMetrics());
    setAttentionItems(getAttentionRequiredQueue());
    setIncidentsList(getAllIncidents());
    setAuditLogsList(getAllAuditLogs());
    const localUsers = getAdminUserList();
    setUsers(localUsers);

    // 2. Fetch Supabase remote users & transactions in background with 2s timeout
    try {
      const fetchPromise = Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('transactions')
          .select('*, wallets(user_id, users(first_name, last_name, role))')
          .order('created_at', { ascending: false }).limit(50),
      ]);
      const timeoutPromise = new Promise<{ data: null }[]>((resolve) =>
        setTimeout(() => resolve([{ data: null }, { data: null }]), 2000)
      );

      const [uRes, txRes] = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (uRes?.data && Array.isArray(uRes.data) && uRes.data.length > 0) {
        const userMap = new Map<string, DBUser>();
        localUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
        (uRes.data as DBUser[]).forEach(u => {
          if (u.email) {
            userMap.set(u.email.toLowerCase(), {
              ...u,
              first_name: u.first_name || 'Explorer',
              last_name: u.last_name || '',
              role: u.role || 'TOURIST',
              is_active: u.is_active !== false,
            });
          }
        });
        setUsers(Array.from(userMap.values()));
      }
      if (txRes?.data) setTransactions(txRes.data as DBTransaction[]);
    } catch (e) {
      console.warn('Admin background fetch notice:', e);
    }

    // 3. Background sync vehicles, bookings, and users from Supabase for cross-device parity
    Promise.all([
      syncVehiclesFromSupabase().catch(() => []),
      syncBookingsFromSupabase().catch(() => []),
      syncUsersFromSupabase().catch(() => []),
    ]).then(([syncedV, syncedB]) => {
      setVehicles(Array.isArray(syncedV) && syncedV.length > 0 ? syncedV : getStoredVehicles());
      setBookings(Array.isArray(syncedB) && syncedB.length > 0 ? syncedB : getStoredBookings());
    }).catch(() => {});
  };

  useEffect(() => {
    fetchAll();
    const handleUpdate = () => {
      setVehicles(getStoredVehicles());
      setBookings(getStoredBookings());
      setDestinationsList(getStoredDestinations());
      setExceptionMetrics(getExceptionMetrics());
      setAttentionItems(getAttentionRequiredQueue());
      setIncidentsList(getAllIncidents());
      setAuditLogsList(getAllAuditLogs());
      setUsers(getAdminUserList());
    };
    const handleDestUpdate = () => setDestinationsList(getStoredDestinations());
    const handleRemoteChange = () => fetchAll();
    window.addEventListener('mt_vehicle_updated', handleUpdate);
    window.addEventListener('mt_booking_updated', handleUpdate);
    window.addEventListener('mt_booking_status_changed', handleUpdate);
    window.addEventListener('mt_vehicle_approved', handleUpdate);
    window.addEventListener('mt_destinations_updated', handleDestUpdate);
    window.addEventListener('mt_rental_handover', handleUpdate);
    window.addEventListener('mt_return_inspected', handleUpdate);
    window.addEventListener('mt_trip_checkin', handleUpdate);
    window.addEventListener('mt_incident_reported', handleUpdate);
    window.addEventListener('mt_incident_updated', handleUpdate);
    window.addEventListener('mt_audit_logged', handleUpdate);
    window.addEventListener('mt_accounts_updated', handleUpdate);
    window.addEventListener('mt_remote_change', handleRemoteChange);
    return () => {
      window.removeEventListener('mt_vehicle_updated', handleUpdate);
      window.removeEventListener('mt_booking_updated', handleUpdate);
      window.removeEventListener('mt_booking_status_changed', handleUpdate);
      window.removeEventListener('mt_vehicle_approved', handleUpdate);
      window.removeEventListener('mt_destinations_updated', handleDestUpdate);
      window.removeEventListener('mt_rental_handover', handleUpdate);
      window.removeEventListener('mt_return_inspected', handleUpdate);
      window.removeEventListener('mt_trip_checkin', handleUpdate);
      window.removeEventListener('mt_incident_reported', handleUpdate);
      window.removeEventListener('mt_incident_updated', handleUpdate);
      window.removeEventListener('mt_audit_logged', handleUpdate);
      window.removeEventListener('mt_accounts_updated', handleUpdate);
      window.removeEventListener('mt_remote_change', handleRemoteChange);
    };
  }, []);

  const toggleUserActive = async (id: string, val: boolean) => {
    updateUserStatus(id, val);
    try {
      await supabase.from('users').update({ is_active: val }).eq('id', id);
    } catch {}
    setUsers(us => us.map(u => u.id === id ? { ...u, is_active: val } : u));
  };

  const resolveHostDetails = (v: StoredVehicle) => {
    const localAccounts = getLocalAccounts();
    const hostUser =
      users.find((u: DBUser) => u.id === v.ownerId) ||
      localAccounts.find((u: any) => u.id === v.ownerId) ||
      users.find((u: DBUser) => v.ownerEmail && u.email?.toLowerCase() === v.ownerEmail.toLowerCase()) ||
      localAccounts.find((u: any) => v.ownerEmail && u.email?.toLowerCase() === v.ownerEmail.toLowerCase()) ||
      localAccounts.find((u: any) => v.ownerName && (u.firstName?.toLowerCase().includes(v.ownerName.toLowerCase()) || v.ownerName.toLowerCase().includes(u.firstName?.toLowerCase()))) ||
      (v.ownerName?.toLowerCase().includes('matthew') ? localAccounts.find((u: any) => u.firstName?.toLowerCase().includes('matthew') || u.email?.toLowerCase().includes('matthew')) : null);

    const hostEmail = v.ownerEmail || hostUser?.email || (v.ownerName?.toLowerCase().includes('matthew') ? 'matthew@gmail.com' : 'host@mtravel.co.ke');
    const hostName = v.ownerName || (hostUser ? `${(hostUser as any).first_name || (hostUser as any).firstName || ''} ${(hostUser as any).last_name || (hostUser as any).lastName || ''}`.trim() : 'Fleet Host');
    const hostPhone = (hostUser as any)?.phone || (v as any).ownerPhone || (v.ownerName?.toLowerCase().includes('matthew') ? '0712345678' : '0722374535');
    return { hostEmail, hostName, hostPhone };
  };

  const handleApproveVehicle = async (vehicle: StoredVehicle) => {
    approveVehicleInStore(vehicle.id);
    try {
      await supabase.from('vehicles').update({ is_approved: true, is_available: true }).eq('id', vehicle.id);
    } catch { /* Supabase may not have this record yet, store already updated */ }

    // 1. In-app notification to host
    sendNotification({
      recipientId: vehicle.ownerId,
      role: 'VEHICLE_OWNER',
      type: 'VEHICLE_APPROVED_OWNER',
      title: 'Vehicle Approved & Registered',
      message: `Your ${vehicle.make} ${vehicle.model} has been inspected & approved by M-TRAVEL Admin. It is now live in tourist searches!`,
      link: '/dashboard/owner',
    });

    // 2. Strictly resolve host's registered account & phone
    const { hostEmail, hostName, hostPhone } = resolveHostDetails(vehicle);

    // Ensure vehicle retains host's email in local store permanently
    if (!vehicle.ownerEmail && hostEmail) {
      vehicle.ownerEmail = hostEmail;
      vehicle.ownerName = hostName;
      const allV = getStoredVehicles().map((v) => v.id === vehicle.id ? { ...v, ownerEmail: hostEmail, ownerName: hostName } : v);
      try { localStorage.setItem('mt_stored_vehicles', JSON.stringify(allV)); } catch {}
    }

    // 3. Automated WhatsApp Accreditation Notice (Direct wa.me link to host phone)
    const waUrl = getHostApprovalWhatsAppUrl({ hostName, hostPhone, vehicle });
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {}

    setApprovalMsg({
      text: `🎉 ${vehicle.make} ${vehicle.model} approved & published live! Official WhatsApp accreditation notice sent to ${hostName} (${hostPhone}).`,
      waUrl,
    });
    fetchAll();
    setTimeout(() => setApprovalMsg(null), 14000);
  };

  const handleOpenDeleteModal = (vehicle: StoredVehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteReason('Violation of vehicle safety or roadworthiness standards');
    setDeleteCustomReason('');
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setIsDeletingVehicle(true);
    const finalReason = deleteReason === 'Other'
      ? (deleteCustomReason.trim() || 'Administrative policy or operational discretion')
      : deleteReason;

    // 1. Remove from local store and dispatch real-time update
    deleteVehicle(vehicleToDelete.id);

    // 2. Remove from Supabase DB (if exists)
    try {
      await supabase.from('vehicles').delete().eq('id', vehicleToDelete.id);
    } catch (e) {
      console.warn('Supabase vehicle delete error:', e);
    }

    // 3. Dispatch isolated notification directly to the Fleet Host
    if (vehicleToDelete.ownerId) {
      sendNotification({
        recipientId: vehicleToDelete.ownerId,
        role: 'VEHICLE_OWNER',
        type: 'VEHICLE_REMOVED_ADMIN',
        title: `Vehicle De-Registered: ${vehicleToDelete.make} ${vehicleToDelete.model}`,
        message: `M-TRAVEL Administration has removed your ${vehicleToDelete.make} ${vehicleToDelete.model} from the platform. Reason: ${finalReason}. Contact platform management for assistance.`,
        link: '/dashboard/owner?tab=fleet',
      });
    }

    setApprovalMsg(`Vehicle "${vehicleToDelete.make} ${vehicleToDelete.model}" permanently removed from system. Fleet host has been notified.`);
    setTimeout(() => setApprovalMsg(''), 6000);
    setVehicleToDelete(null);
    setIsDeletingVehicle(false);
    fetchAll();
  };

  const handleRejectVehicle = async (vehicle: StoredVehicle, reasons: string[], customFeedback: string) => {
    // 1. Mark status as REJECTED and persist rejection audit data
    rejectVehicle(vehicle.id, reasons, customFeedback);

    // 2. Remove from Supabase DB completely so unapproved rejected vehicles are not stored in database
    try {
      await supabase.from('vehicle_images').delete().eq('vehicle_id', vehicle.id);
      await supabase.from('vehicles').delete().eq('id', vehicle.id);
    } catch (e) {
      console.warn('Supabase vehicle reject error:', e);
    }

    // 3. Resolve host registered phone and details
    const { hostName, hostPhone } = resolveHostDetails(vehicle);

    // 4. Dispatch notification to Fleet Host account
    if (vehicle.ownerId) {
      const summaryReason = reasons.length > 0 ? reasons.join('; ') : (customFeedback || 'Quality & compliance adjustments required');
      sendNotification({
        recipientId: vehicle.ownerId,
        role: 'VEHICLE_OWNER',
        type: 'VEHICLE_REMOVED_ADMIN',
        title: `Vehicle Registration Notice: ${vehicle.make} ${vehicle.model}`,
        message: `M-TRAVEL Admin has reviewed your ${vehicle.make} ${vehicle.model}. Key feedback: ${summaryReason}. Please review inspection notes and re-submit.`,
        link: '/dashboard/owner?tab=fleet',
      });
    }

    // 5. Automated WhatsApp Rejection Feedback to Fleet Host
    const waUrl = getHostRejectionWhatsAppUrl({
      hostName,
      hostPhone,
      vehicle,
      reasons,
      customFeedback,
    });
    try {
      openHostRejectionWhatsApp({
        hostName,
        hostPhone,
        vehicle,
        reasons,
        customFeedback,
      });
    } catch {}

    setApprovalMsg({
      text: `📋 ${vehicle.make} ${vehicle.model} rejected & feedback logged. Official WhatsApp audit notice sent to ${hostName} (${hostPhone}).`,
      waUrl,
    });
    setInspectingVehicle(null);
    fetchAll();
    setTimeout(() => setApprovalMsg(null), 14000);
  };

  const compressImageFile = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
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
        img.onerror = () => resolve('');
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleDestImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const compressed = await compressImageFile(files[i], 1200, 0.8);
      if (compressed) newUrls.push(compressed);
    }
    if (newUrls.length > 0) {
      setDestForm(prev => {
        const currentImages = prev.images && prev.images.length > 0 ? prev.images : (prev.imageUrl ? [prev.imageUrl] : []);
        const combined = [...currentImages, ...newUrls];
        return {
          ...prev,
          imageUrl: combined[0] || prev.imageUrl,
          images: combined,
        };
      });
    }
    e.target.value = '';
  };

  const handleRemoveDestImage = (indexToRemove: number) => {
    setDestForm(prev => {
      const filtered = (prev.images || []).filter((_, i) => i !== indexToRemove);
      return {
        ...prev,
        imageUrl: filtered[0] || '',
        images: filtered,
      };
    });
  };

  const handleOpenCreateDest = () => {
    setEditingDest(null);
    setDestForm({
      title: '',
      subtitle: '',
      category: 'TOUR',
      badge: 'Premier Safari Package',
      priceKES: 45000,
      priceUnit: '/ person',
      imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80'],
      location: 'Maasai Mara, Kenya',
      region: 'Narok County',
      specs: '3 Days / 2 Nights, Full Board Lodge, 4x4 Cruiser, Park Entry Included',
      overview: 'All-inclusive guided safari with private 4x4 pop-up roof cruiser and certified safari guide.',
      highlights: 'Big Five game drives, Gourmet lodge dining, Cultural visit, Park entry fees',
      itinerary: 'Day 1: Transfer from Nairobi & afternoon safari\nDay 2: Full day wildlife safari with bush picnic\nDay 3: Sunrise game drive & return journey',
      isLive: true,
      featured: true,
    });
    setIsDestModalOpen(true);
  };

  const handleOpenEditDest = (item: TravelDestinationItem) => {
    setEditingDest(item);
    setDestForm({
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      badge: item.badge,
      priceKES: item.priceKES,
      priceUnit: item.priceUnit,
      imageUrl: item.imageUrl,
      images: item.images && item.images.length > 0 ? item.images : [item.imageUrl],
      location: item.location,
      region: item.region,
      specs: item.specs.join(', '),
      overview: item.details.overview,
      highlights: item.details.highlights.join(', '),
      itinerary: item.details.scheduleOrItinerary ? item.details.scheduleOrItinerary.join('\n') : '',
      isLive: item.isLive,
      featured: item.featured || false,
    });
    setIsDestModalOpen(true);
  };

  const handleSaveDestForm = (e: React.FormEvent) => {
    e.preventDefault();
    const specsArray = destForm.specs.split(',').map(s => s.trim()).filter(Boolean);
    const highlightsArray = destForm.highlights.split(',').map(s => s.trim()).filter(Boolean);
    const itineraryArray = destForm.itinerary.split('\n').map(s => s.trim()).filter(Boolean);
    const imagesArray = destForm.images && destForm.images.length > 0 ? destForm.images : (destForm.imageUrl ? [destForm.imageUrl] : []);
    const primaryImage = imagesArray[0] || destForm.imageUrl || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80';

    if (editingDest) {
      updateDestination(editingDest.id, {
        title: destForm.title,
        subtitle: destForm.subtitle,
        category: destForm.category,
        badge: destForm.badge,
        priceKES: Number(destForm.priceKES),
        priceUnit: destForm.priceUnit,
        imageUrl: primaryImage,
        images: imagesArray,
        location: destForm.location,
        region: destForm.region,
        specs: specsArray,
        isLive: destForm.isLive,
        featured: destForm.featured,
        details: {
          overview: destForm.overview,
          highlights: highlightsArray,
          scheduleOrItinerary: itineraryArray,
        }
      });
      setApprovalMsg(`Updated "${destForm.title}" successfully.`);
    } else {
      saveDestination({
        title: destForm.title,
        subtitle: destForm.subtitle,
        category: destForm.category,
        badge: destForm.badge,
        priceKES: Number(destForm.priceKES),
        priceUnit: destForm.priceUnit,
        imageUrl: primaryImage,
        images: imagesArray,
        location: destForm.location,
        region: destForm.region,
        specs: specsArray.length ? specsArray : ['Exclusive Access', 'Verified M-Travel'],
        rating: 5.0,
        reviews: 1,
        isLive: destForm.isLive,
        featured: destForm.featured,
        details: {
          overview: destForm.overview,
          highlights: highlightsArray.length ? highlightsArray : ['Luxury Accommodation', 'Full Concierge Support'],
          scheduleOrItinerary: itineraryArray,
        }
      });
      setApprovalMsg(`Added new package "${destForm.title}" successfully.`);
    }

    setDestinationsList(getStoredDestinations());
    setIsDestModalOpen(false);
    setTimeout(() => setApprovalMsg(''), 5000);
  };

  const handleToggleDestLive = (id: string) => {
    toggleDestinationLiveStatus(id);
    setDestinationsList(getStoredDestinations());
  };

  const handleDeleteDest = (id: string) => {
    deleteDestinationInStore(id);
    setDestinationsList(getStoredDestinations());
  };

  const pendingVehicles = vehicles.filter(v => v.status === 'PENDING_APPROVAL');

  const totalRevenue = bookings
    .filter(b => ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS'].includes(b.status))
    .reduce((s, b) => s + b.totalAmount, 0);

  const totalPlatformFees = totalRevenue * 0.15;

  const totalOwnerWithdrawals = transactions
    .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
    .reduce((s, t) => s + Number(t.amount), 0);

  const filtered = search
    ? users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const filteredDestinations = destinationsList.filter(item => {
    const matchesCategory = destCategoryFilter === 'ALL' || item.category === destCategoryFilter;
    const matchesSearch = !destSearch ||
      item.title.toLowerCase().includes(destSearch.toLowerCase()) ||
      item.location.toLowerCase().includes(destSearch.toLowerCase()) ||
      item.region.toLowerCase().includes(destSearch.toLowerCase()) ||
      item.badge.toLowerCase().includes(destSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview',     label: 'Overview', icon: BarChart3 },
    { id: 'approvals',    label: `Approvals (${pendingVehicles.length})`, icon: FileCheck },
    { id: 'fleet',        label: 'Fleet & Status', icon: Car },
    { id: 'bookings',     label: `Bookings (${bookings.length})`, icon: Clock },
    { id: 'incidents',    label: `🚨 Incidents (${incidentsList.filter(i => i.status !== 'RESOLVED').length})`, icon: AlertTriangle },
    { id: 'audit_logs',   label: 'Audit Trail', icon: FileCheck },
    { id: 'accounting',   label: 'Accounting', icon: DollarSign },
    { id: 'users',        label: `Accounts (${users.length})`, icon: Users },
    { id: 'credit_scores', label: '🛡️ Traveler Credit Ratings', icon: Shield },
    { id: 'destinations', label: `Holidays & Tours (${destinationsList.length})`, icon: Palmtree },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 font-display text-slate-900">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-700">
            <Shield className="h-3.5 w-3.5" /> Platform Administration
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">Admin Console</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchAll} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2 font-bold text-slate-800 border-slate-200 hover:text-slate-950">
            <RefreshCw className="h-4 w-4 text-purple-600" /> Sync Live Data
          </button>
        </div>
      </div>

      {/* ── PENDING VEHICLE REGISTRATION APPROVAL ALERT BANNER ── */}
      {pendingVehicles.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <span>🚨</span> {pendingVehicles.length} New Vehicle Registration Request{pendingVehicles.length > 1 ? 's' : ''} Awaiting Admin Approval
              </h4>
              <p className="text-xs text-amber-900/90 font-medium mt-0.5">
                Fleet Host{pendingVehicles.length > 1 ? 's have' : ' has'} submitted {pendingVehicles.map(v => `${v.make} ${v.model} (${v.plateNumber || 'Pending Plate'})`).join(', ')}. Review photos & compliance docs to approve or decline.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('approvals')}
            className="btn-primary !py-2 !px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm shrink-0 flex items-center gap-1.5"
          >
            Review Pending Queue ({pendingVehicles.length}) →
          </button>
        </div>
      )}

      {/* ── TOP EXCEPTION METRICS STRIP (OPERATIONAL STATUS AT A GLANCE) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Fleet</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">{exceptionMetrics.totalFleet}</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Available</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-700">{exceptionMetrics.available}</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Active Rentals</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-indigo-700">{exceptionMetrics.activeRentals}</span>
            <Lock className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Reserved</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-purple-700">{exceptionMetrics.reserved}</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Return Due</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-700">{exceptionMetrics.returnDue}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border shadow-2xs ${
          exceptionMetrics.overdue > 0
            ? 'bg-red-600 text-white border-red-700 animate-pulse'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${exceptionMetrics.overdue > 0 ? 'text-white' : 'text-slate-500'}`}>
            Overdue 🚨
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xl font-bold font-mono ${exceptionMetrics.overdue > 0 ? 'text-white' : 'text-slate-700'}`}>
              {exceptionMetrics.overdue}
            </span>
            <AlertTriangle className={`w-4 h-4 ${exceptionMetrics.overdue > 0 ? 'text-white' : 'text-slate-400'}`} />
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border shadow-2xs ${
          exceptionMetrics.activeIncidents > 0
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Incidents 🚨</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-rose-700">{exceptionMetrics.activeIncidents}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === t.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950 hover:bg-white'}`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p className="mt-4 text-slate-500 text-sm font-medium">Loading live platform data…</p>
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {!loading && activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ── PRIORITY EXCEPTION QUEUE: ATTENTION REQUIRED ── */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${attentionItems.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    Priority Attention Feed
                    {attentionItems.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800 border border-red-200">
                        {attentionItems.length} Exceptions Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        All Normal
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">Live operational exceptions requiring agency review or dispatch</p>
                </div>
              </div>
            </div>

            {attentionItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero pending exceptions. All vehicle rentals, returns, and safety check-ins are operating smoothly.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {attentionItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition shadow-2xs ${
                      item.severity === 'high'
                        ? 'bg-red-50/90 border-red-300'
                        : item.severity === 'medium'
                        ? 'bg-amber-50/90 border-amber-300'
                        : 'bg-indigo-50/90 border-indigo-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${
                          item.severity === 'high' ? 'text-red-900' : item.severity === 'medium' ? 'text-amber-900' : 'text-indigo-900'
                        }`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/80 border border-slate-200 shrink-0">
                          {item.timeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.subtitle}</p>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      {item.type === 'HANDOVER_PENDING' && (
                        <button
                          type="button"
                          onClick={() => {
                            const b = bookings.find(x => x.id === item.bookingId);
                            if (b) setSelectedBookingForHandover(b);
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Lock className="w-3.5 h-3.5" /> Execute Handover
                        </button>
                      )}

                      {(item.type === 'OVERDUE' || item.type === 'RETURN_DUE') && (
                        <button
                          type="button"
                          onClick={() => {
                            const b = bookings.find(x => x.id === item.bookingId);
                            if (b) setSelectedBookingForReturnInspection(b);
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Inspect & Settle
                        </button>
                      )}

                      {item.type === 'INCIDENT' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('incidents')}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Manage Incident
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Platform Revenue',  value: formatPrice(totalRevenue),  icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Registered Users',  value: users.length,               icon: Users,      color: 'text-teal-700',    bg: 'bg-teal-50' },
              { label: 'Fleet Vehicles',    value: vehicles.length,            icon: Car,        color: 'text-amber-700',   bg: 'bg-amber-50' },
              { label: 'Total Bookings',    value: bookings.length,            icon: Activity,   color: 'text-rose-700',    bg: 'bg-rose-50' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition">
                <div className={`inline-flex p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="mt-3 font-mono text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-600 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ROLE BREAKDOWN */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" /> Live Role Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { role: 'TOURIST',       label: 'Tourists',          icon: Users,  cls: 'text-teal-800 border-teal-200 bg-teal-50' },
                { role: 'VEHICLE_OWNER', label: 'Vehicle Owners',    icon: Car,    cls: 'text-amber-800 border-amber-200 bg-amber-50' },
                { role: 'ADMIN',         label: 'Administrators',    icon: Shield, cls: 'text-purple-800 border-purple-200 bg-purple-50' },
              ].map(r => {
                const count = users.filter(u => u.role === r.role).length;
                const pct = (count / Math.max(users.length, 1)) * 100;
                return (
                  <div key={r.role} className={`rounded-xl border p-4 ${r.cls}`}>
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <r.icon className="h-4 w-4" />
                        {r.label}
                      </span>
                      <span className="font-mono text-xl">{count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200/70" />
                    <div className={`-mt-2 h-2 rounded-full ${r.role === 'TOURIST' ? 'bg-teal-600' : r.role === 'VEHICLE_OWNER' ? 'bg-amber-500' : 'bg-purple-600'}`} style={{ width: `${pct}%` }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ROUTE ALERTS */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" /> Smart Route Vehicle Alerts
            </h3>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`rounded-xl border p-3 text-xs flex items-start justify-between ${
                  a.type === 'SPEEDING' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}>
                  <span className="font-medium">{a.message}</span>
                  <span className="text-[10px] ml-2 whitespace-nowrap opacity-75 font-mono">{a.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT BOOKINGS */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-3 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" /> Recent Bookings
            </h3>
            {bookings.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-mono text-xs text-amber-700 font-bold">{b.bookingRef}</p>
                  <p className="text-sm font-bold text-slate-900">{b.touristName} → {b.vehicleName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-700">{formatPrice(b.totalAmount)}</p>
                  <p className="text-xs text-slate-500 font-medium">{b.status}</p>
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-xs text-slate-500 font-medium py-4 text-center">No bookings yet.</p>}
          </div>

          {/* SYSTEM HEALTH — Admin Exclusive */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-600" /> System Health & Platform Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'API Server',    value: '99.8%',   sub: 'Uptime (30d)',    icon: Server,    color: 'text-emerald-800', bg: 'border-emerald-200 bg-emerald-50' },
                { label: 'Fleet Network', value: 'Online',  sub: `${bookings.filter(b => b.status === 'IN_PROGRESS').length} active`,  icon: Wifi,      color: 'text-teal-800',    bg: 'border-teal-200 bg-teal-50' },
                { label: 'Data Storage',  value: '42%',     sub: 'Capacity used',   icon: HardDrive, color: 'text-amber-800',   bg: 'border-amber-200 bg-amber-50' },
                { label: 'Avg Response',  value: '184ms',   sub: 'API latency',     icon: Clock,     color: 'text-purple-800',  bg: 'border-purple-200 bg-purple-50' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                  </div>
                  <p className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-medium">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-700 font-semibold">All systems operational — M-TRAVEL Platform v2.0</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-medium">{new Date().toLocaleString('en-KE')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── VEHICLE APPROVALS ── */}
      {!loading && activeTab === 'approvals' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-600" /> Pending Vehicle Registration Approvals ({pendingVehicles.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Review owner vehicle specs and verification photos before approving for live tourist booking.
            </p>
          </div>

          {approvalMsg && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/95 p-4 text-xs text-emerald-950 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  {typeof approvalMsg === 'string' ? approvalMsg : approvalMsg.text}
                </span>
              </div>
              {typeof approvalMsg === 'object' && approvalMsg?.waUrl && (
                <a
                  href={approvalMsg.waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <span>💬 Open Host WhatsApp Confirmation</span>
                </a>
              )}
            </div>
          )}

          {pendingVehicles.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-500 font-medium shadow-sm">
              No pending vehicle registration approvals. All vehicles are approved.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {pendingVehicles.map(v => (
                <div key={v.id} className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-700">{v.type}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-0.5 text-[10px] font-bold text-yellow-700">
                      <Clock className="h-3 w-3" /> Pending Approval
                    </span>
                  </div>

                  {/* VERIFICATION IMAGES (FRONT & REAR VIEW) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={v.images[0] || '/vehicles/prado-front.jpg'}
                        alt="Front View"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-1 left-1 rounded bg-amber-500 text-slate-950 px-1.5 py-0.5 text-[9px] font-mono font-bold">
                        Front View
                      </span>
                    </div>
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={v.images[1] || v.images[0] || '/vehicles/prado-rear.jpg'}
                        alt="Rear View"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-1 left-1 rounded bg-teal-500 text-slate-950 px-1.5 py-0.5 text-[9px] font-mono font-bold">
                        Rear/Back View
                      </span>
                    </div>
                  </div>
                  {v.images.length > 2 && (
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[10px] text-slate-600 font-mono font-semibold">Extra ({v.images.length - 2}):</span>
                      {v.images.slice(2, 6).map((img, i) => (
                        <img key={i} src={img} alt="extra" className="h-7 w-7 rounded object-cover border border-slate-200" />
                      ))}
                    </div>
                  )}

                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{v.make} {v.model} ({v.year ?? 2024})</h3>
                    <p className="text-xs text-slate-600 font-medium">Submitted by: {v.ownerName}</p>
                    <p className="font-mono font-bold text-amber-700 mt-1">{formatPrice(v.pricePerDay)} / day</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingVehicle(v)}
                      className="btn-primary !py-2.5 !px-3.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 text-white bg-amber-600 hover:bg-amber-500"
                      title="Inspect vehicle photos & specs with AI Advisor before deciding"
                    >
                      <Sparkles className="h-4 w-4" /> Inspect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveVehicle(v)}
                      className="btn-primary flex-1 text-xs !py-2.5 font-bold shadow-sm flex items-center justify-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-500"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve Live
                    </button>
                    {(() => {
                      const { hostName, hostPhone } = resolveHostDetails(v);
                      const waUrl = getHostApprovalWhatsAppUrl({ hostName, hostPhone, vehicle: v });
                      return (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary !py-2 !px-3 text-xs flex items-center justify-center gap-1 font-bold text-emerald-900 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                          title="Open official WhatsApp vehicle accreditation notice"
                        >
                          💬 WhatsApp
                        </a>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => setInspectingVehicle(v)}
                      className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1 shrink-0"
                      title="Inspect vehicle & send custom rejection feedback via WhatsApp"
                    >
                      <Trash2 className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACCOUNTING LEDGER ── */}
      {!loading && activeTab === 'accounting' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" /> Platform Financial Ledger & Audit
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">Complete accounting: total deposits, withdrawals, and platform revenue.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <ArrowDownLeft className="h-4 w-4" /> Total Customer Deposits
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-slate-900">{formatPrice(totalRevenue)}</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">Total paid by tourists via M-Pesa & Cards</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
                <ArrowUpRight className="h-4 w-4" /> Total Owner Withdrawals
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-slate-900">{formatPrice(totalOwnerWithdrawals)}</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">Total payouts withdrawn by car owners</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <DollarSign className="h-4 w-4" /> Platform Revenue (15% Fee)
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-amber-700">{formatPrice(totalPlatformFees)}</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">Net platform commission retained</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-slate-900 text-lg">Platform Transaction Audit Log</h3>
            <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm">
              <table className="w-full text-xs text-left text-slate-800">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    {['Reference', 'User / Account', 'Role', 'Type', 'Status', 'Amount', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(t => {
                    const isIn = ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'REFUND'].includes(t.type);
                    const userName = (t.wallets as any)?.users?.first_name
                      ? `${(t.wallets as any).users.first_name} ${(t.wallets as any).users.last_name ?? ''}`
                      : 'System Account';
                    const userRole = (t.wallets as any)?.users?.role ?? 'TOURIST';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition font-mono">
                        <td className="px-4 py-3 text-amber-700 font-bold">{t.reference || t.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-slate-900 font-sans font-semibold">{userName}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            userRole === 'ADMIN' ? 'bg-purple-100 text-purple-900' :
                            userRole === 'VEHICLE_OWNER' ? 'bg-amber-100 text-amber-900' :
                            'bg-teal-100 text-teal-900'
                          }`}>{userRole}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-sans">{t.type}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-yellow-700 bg-yellow-50 border border-yellow-200'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-bold ${isIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIn ? '+' : '-'} {formatPrice(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(t.created_at).toLocaleDateString('en-KE')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {transactions.length === 0 && <p className="p-6 text-xs text-slate-500 font-medium text-center">No transactions yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {!loading && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">All Registered Accounts ({filtered.length})</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Central directory of platform users (Travelers, Fleet Hosts, and Administrators). Manage account status and role permissions.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field max-w-xs text-xs text-slate-900 placeholder:text-slate-400 border-slate-300"
            />
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <table className="w-full text-xs text-left text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => {
                  const roleLabel =
                    u.role === 'ADMIN' ? 'Platform Admin' :
                    u.role === 'VEHICLE_OWNER' ? 'Fleet Host' :
                    'Traveler (Tourist)';
                  const roleBadgeClass =
                    u.role === 'ADMIN' ? 'text-purple-800 bg-purple-50 border-purple-200' :
                    u.role === 'VEHICLE_OWNER' ? 'text-amber-800 bg-amber-50 border-amber-200' :
                    'text-teal-800 bg-teal-50 border-teal-200';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${roleBadgeClass}`}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 font-semibold ${u.is_active ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {u.is_active ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleUserActive(u.id, !u.is_active)}
                          className={`rounded-lg border px-3 py-1 text-[10px] font-bold transition ${u.is_active ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No accounts found matching your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLEET ── */}
      {!loading && activeTab === 'fleet' && (() => {
        const totalVehiclesCount = vehicles.filter(v => !isBusVehicle(v)).length;
        const totalBusesCount = vehicles.filter(v => isBusVehicle(v)).length;

        const displayedFleetVehicles = vehicles.filter(v => {
          const isBus = isBusVehicle(v);
          if (fleetCategoryFilter === 'buses') return isBus;
          return !isBus;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">All Platform Vehicles ({vehicles.length})</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Toggle live marketplace status upon host request or oversee vehicle availability.</p>
              </div>
              <a
                href={`/catalogue?category=${fleetCategoryFilter}`}
                className="btn-secondary !py-2 !px-3 text-xs font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 flex items-center gap-1.5"
              >
                {fleetCategoryFilter === 'buses' ? <Bus className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />} View Live Marketplace ({fleetCategoryFilter === 'buses' ? 'Buses' : 'Vehicles'})
              </a>
            </div>

            {/* CATEGORY FILTER SUB-TABS */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setFleetCategoryFilter('vehicles')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  fleetCategoryFilter === 'vehicles'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Car className="h-3.5 w-3.5" /> Live Vehicle Hire ({totalVehiclesCount})
              </button>
              <button
                type="button"
                onClick={() => setFleetCategoryFilter('buses')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  fleetCategoryFilter === 'buses'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bus className="h-3.5 w-3.5" /> Bus Reservations ({totalBusesCount})
              </button>
            </div>

            {displayedFleetVehicles.length === 0 ? (
              <div className="rounded-3xl bg-white border border-slate-200/90 p-12 md:p-16 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                  {fleetCategoryFilter === 'buses' ? <Bus className="h-8 w-8 stroke-[1.75]" /> : <Car className="h-8 w-8 stroke-[1.75]" />}
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    {fleetCategoryFilter === 'buses' ? 'No buses at the moment' : 'No vehicles available at the moment'}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                    {fleetCategoryFilter === 'buses'
                      ? 'There are currently no buses registered into the system. Admin and hosts can register buses under live fleet.'
                      : 'No vehicles have been registered by fleet hosts or submitted for platform inspection. When hosts list vehicles, they will appear here for verification and live fleet control.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedFleetVehicles.map(v => {
                  const hireStatus = getVehicleHireStatus(v.id);
                  const isLive = isVehicleLive(v.id);

                return (
                  <div key={v.id} className="rounded-2xl bg-white border border-slate-200/90 p-4 space-y-2.5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-amber-700 font-bold">{v.type}</span>
                      <VehicleStatusBadge
                        isHired={hireStatus.isHired}
                        isLive={isLive}
                        isPendingApproval={v.status === 'PENDING_APPROVAL'}
                        variant="light"
                      />
                    </div>

                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900">
                      <img
                        src={v.images[0] || '/vehicles/prado-front.jpg'}
                        alt={`${v.make} ${v.model}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-slate-950/80 px-2 py-0.5 rounded-full">
                        {v.seats} Seats • {v.fuelType}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-base">{v.make} {v.model} ({v.year ?? 2024})</h4>
                      <p className="text-xs text-slate-600 font-medium">Plate: <span className="font-mono font-bold text-slate-900">{v.plateNumber || 'Pending'}</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">Owner: <span className="font-semibold text-slate-700">{v.ownerName}</span> ({v.ownerEmail || 'Host'})</p>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2 font-medium">
                      <span className="font-bold text-slate-900">{formatPrice(v.pricePerDay)}<span className="text-[10px] font-normal text-slate-500">/day</span></span>
                      <span className="text-[10px] text-slate-500">{v.address || 'Nairobi Central'}</span>
                    </div>

                    {/* ACTIONS ROW */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {v.status === 'PENDING_APPROVAL' ? (
                        <div className="flex gap-1.5 flex-1">
                          <button
                            type="button"
                            onClick={() => setInspectingVehicle(v)}
                            className="btn-secondary !py-1.5 !px-2.5 text-xs flex items-center justify-center gap-1 font-bold shadow-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                            title="Inspect vehicle photos & specs"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveVehicle(v)}
                            className="btn-primary !py-1.5 !px-3 text-xs flex-1 flex items-center justify-center gap-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve Live
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isLive;
                            toggleVehicleLiveStatus(v.id, nextState);
                            setVehicles(prev => prev.map(item => item.id === v.id ? { ...item, isLive: nextState } : item));
                          }}
                          disabled={hireStatus.isHired}
                          className={`btn-secondary !py-1.5 !px-3 text-xs flex-1 flex items-center justify-center gap-1.5 font-bold transition shadow-xs ${
                            hireStatus.isHired
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : isLive
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {hireStatus.isHired ? (
                            <span className="flex items-center justify-center gap-1.5 font-bold">
                              <Lock className="h-3 w-3 text-slate-400" />
                              <span>Locked (On Trip)</span>
                            </span>
                          ) : isLive ? (
                            <><span>Pause Hire</span></>
                          ) : (
                            <><span>Push Live</span></>
                          )}
                        </button>
                      )}

                      {/* WHATSAPP ACCREDITATION ACTION */}
                      {(() => {
                        const { hostName, hostPhone } = resolveHostDetails(v);
                        const waUrl = getHostApprovalWhatsAppUrl({ hostName, hostPhone, vehicle: v });
                        return (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition shadow-xs flex items-center justify-center shrink-0"
                            title="Open WhatsApp accreditation notice for host"
                          >
                            <span className="text-xs">💬</span>
                          </a>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(v)}
                        disabled={hireStatus.isHired}
                        className={`p-1.5 rounded-lg border transition shadow-xs flex items-center justify-center ${
                          hireStatus.isHired
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800'
                        }`}
                        title={
                          hireStatus.isHired
                            ? 'Cannot remove vehicle while actively hired on a trip'
                            : 'Admin De-register / Remove vehicle from system'
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* ── BOOKINGS ── */}
      {!loading && activeTab === 'bookings' && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">All Platform Bookings ({bookings.length})</h2>
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <table className="w-full text-xs text-left text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  {['Booking Ref', 'Client / Tourist', 'Reserved Asset / Stay', 'Status', 'Location / Hub', 'Amount', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map(b => {
                  const canCancel = !['CANCELLED', 'REJECTED', 'COMPLETED'].includes(b.status);
                  const isDest = isTripBooking(b);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-amber-700 font-bold">
                        <div>{b.bookingRef}</div>
                        {isDest && (
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded mt-0.5">
                            <Palmtree className="h-2.5 w-2.5" /> DESTINATION
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div>{b.touristName}</div>
                        {b.touristPhone && <div className="text-[10px] text-slate-500 font-normal">{b.touristPhone}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {isDest ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md mb-0.5">
                              <Palmtree className="h-2.5 w-2.5" /> {b.destinationCategory === 'TOUR' ? 'GUIDED SAFARI TOUR' : 'HOLIDAY HOME / STAY'}
                            </span>
                            <div className="font-bold text-slate-900">{b.destinationTitle || b.vehicleName}</div>
                            {b.destinationBadge && <div className="text-[10px] text-amber-600 font-medium">{b.destinationBadge}</div>}
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900">{b.vehicleName}</div>
                            <div className="mt-1">
                              <ChauffeurServiceBadge method={b.pickupMethod} driverName={b.driverName} variant="badge" />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          b.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          b.status === 'IN_PROGRESS' ? 'text-teal-700 bg-teal-50 border-teal-200 animate-pulse' :
                          b.status === 'CANCELLED' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                          'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}>{isDest && (b.status === 'CONFIRMED' || b.status === 'PAID') ? 'Booking Placed' : b.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="font-medium text-slate-800 text-xs">
                            {isDest ? (b.destinationLocation || b.pickupLocation || 'Kenya Safari Destination') : (b.pickupLocation || 'Station Hub')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatPrice(b.totalAmount)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{new Date(b.createdAt).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isDest ? (
                            <button
                              onClick={() => setSelectedDestVoucher(b)}
                              className="flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-800 hover:bg-purple-100 transition shadow-xs"
                            >
                              <Palmtree className="h-3 w-3 text-purple-700" /> Facilitate &amp; View Details
                            </button>
                          ) : (
                            <>
                              {['CONFIRMED', 'PAID', 'ACCEPTED'].includes(b.status) && (
                                <button
                                  onClick={() => setSelectedBookingForHandover(b)}
                                  className="flex items-center gap-1.5 rounded-lg border border-amber-400/70 bg-gradient-to-r from-amber-50 via-amber-100/90 to-amber-200/50 px-2.5 py-1 text-[10px] font-extrabold text-amber-950 hover:from-amber-100 hover:to-amber-300 transition shadow-xs cursor-pointer"
                                >
                                  <Award className="h-3.5 w-3.5 text-amber-600 animate-pulse" /> 👑 Executive Handover
                                </button>
                              )}

                              {['IN_PROGRESS', 'ACTIVE'].includes(b.status) && (
                                <button
                                  onClick={() => setSelectedBookingForReturnInspection(b)}
                                  className="flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-900 hover:bg-indigo-100 transition shadow-xs"
                                >
                                  <CheckCircle className="h-3 w-3 text-indigo-700" /> Return Inspection
                                </button>
                              )}

                              {b.status === 'COMPLETED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  <Check className="h-3 w-3" /> Settled
                                </span>
                              )}
                            </>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => {
                                if (cancelConfirm === b.id) {
                                  updateBookingStatus(b.id, 'CANCELLED');
                                  window.dispatchEvent(new CustomEvent('mt_booking_status_changed'));
                                  setCancelConfirm(null);
                                  fetchAll();
                                } else {
                                  setCancelConfirm(b.id);
                                  setTimeout(() => setCancelConfirm(null), 4000);
                                }
                              }}
                              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                                cancelConfirm === b.id
                                  ? 'border-rose-400 bg-rose-100 text-rose-800 animate-pulse'
                                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              <XCircle className="h-3 w-3" />
                              {cancelConfirm === b.id ? 'Confirm?' : 'Cancel'}
                            </button>
                          )}
                          {['CANCELLED', 'REJECTED'].includes(b.status) && (
                            <button
                              onClick={() => {
                                updateBookingStatus(b.id, 'CANCELLED');
                                window.dispatchEvent(new CustomEvent('mt_booking_updated'));
                                fetchAll();
                              }}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {bookings.length === 0 && <p className="p-6 text-xs text-slate-500 font-medium text-center">No bookings on platform yet.</p>}
          </div>
        </div>
      )}

      {/* ── HOLIDAYS, SAFARIS & HOLIDAY HOMES (ADMIN MANAGEMENT) ── */}
      {!loading && activeTab === 'destinations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Palmtree className="h-4 w-4" /> Admin Catalog Management
              </div>
              <h2 className="text-2xl font-bold font-display text-slate-900">
                Holidays, Safaris & Holiday Homes
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Create, update, publish or take offline holiday packages, guided safari tours, and luxury villas. All live packages appear instantly on the traveler <strong>Holidays and Tours</strong> marketplace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/holidays-and-tours"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary !py-2.5 !px-4 text-xs font-bold text-slate-700 flex items-center gap-2 border-slate-300 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5 text-purple-600" /> View Traveler Page
              </a>
              <button
                type="button"
                onClick={handleOpenCreateDest}
                className="btn-primary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-md bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                <Plus className="h-4 w-4" /> Add New Package / Home
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Listings</span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{destinationsList.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Safari Tours</span>
              <p className="text-2xl font-bold font-mono text-purple-700 mt-1">
                {destinationsList.filter(d => d.category === 'TOUR').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-teal uppercase tracking-wider">Holiday Homes</span>
              <p className="text-2xl font-bold font-mono text-teal mt-1">
                {destinationsList.filter(d => d.category === 'HOLIDAY_HOME').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Live on Marketplace</span>
              <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {destinationsList.filter(d => d.isLive).length}
              </p>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {(['ALL', 'TOUR', 'HOLIDAY_HOME', 'DESTINATION'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setDestCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    destCategoryFilter === cat
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' && 'All Listings'}
                  {cat === 'TOUR' && 'Guided Safaris'}
                  {cat === 'HOLIDAY_HOME' && 'Holiday Homes'}
                  {cat === 'DESTINATION' && 'Destinations'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search packages or homes..."
                value={destSearch}
                onChange={e => setDestSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-3 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-hidden"
              />
              {destSearch && (
                <button
                  onClick={() => setDestSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Destinations Table */}
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3">Package / Property</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Pricing</th>
                  <th className="px-4 py-3 text-center">Marketplace Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDestinations.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-12 w-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-xs">{item.title}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{item.badge}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                            <span>★ {item.rating.toFixed(1)} ({item.reviews} reviews)</span>
                            {item.featured && <span className="bg-amber-100 text-amber-800 px-1.5 rounded font-bold">Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.category === 'TOUR'
                          ? 'bg-purple-100 text-purple-800'
                          : item.category === 'HOLIDAY_HOME'
                          ? 'bg-teal/10 text-teal'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.category === 'TOUR' ? 'Safari Tour' : item.category === 'HOLIDAY_HOME' ? 'Holiday Villa' : 'Destination'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-800 font-medium truncate max-w-[160px]">{item.location}</p>
                      <p className="text-[10px] text-slate-400">{item.region}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-bold text-purple-950 text-sm">{formatPrice(item.priceKES)}</p>
                      <p className="text-[10px] text-slate-400">{item.priceUnit}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDestLive(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          item.isLive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={item.isLive ? 'Click to take offline' : 'Click to make live on marketplace'}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.isLive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        {item.isLive ? 'Live on Site' : 'Offline / Hidden'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDest(item)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                        >
                          <Edit2 className="h-3 w-3 text-purple-600" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDest(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete this listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDestinations.length === 0 && (
              <div className="p-10 text-center text-slate-500">
                <Palmtree className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No holiday packages or homes match your filter.</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add New Package / Home" to publish a new package.</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── INCIDENTS & SAFETY SOS MANAGEMENT (LEVEL 2 SECURITY) ── */}
      {!loading && activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Fleet Incident Reports &amp; Roadside Assistance ({incidentsList.length})
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Real-time incident reports, emergency SOS alerts, breakdowns, and damage notifications filed by renters.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
              {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setIncidentFilter(f)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    incidentFilter === f
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'ALL'
                    ? `All (${incidentsList.length})`
                    : f === 'ACTIVE'
                    ? `Active (${incidentsList.filter(i => i.status !== 'RESOLVED').length})`
                    : `Resolved (${incidentsList.filter(i => i.status === 'RESOLVED').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Incidents List */}
          <div className="space-y-3">
            {incidentsList
              .filter(inc => {
                if (incidentFilter === 'ACTIVE') return inc.status !== 'RESOLVED';
                if (incidentFilter === 'RESOLVED') return inc.status === 'RESOLVED';
                return true;
              })
              .map(inc => {
                const isCritical = inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
                return (
                  <div
                    key={inc.id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm space-y-3 transition ${
                      inc.status === 'RESOLVED'
                        ? 'border-slate-200'
                        : isCritical
                        ? 'border-red-300 ring-1 ring-red-300/50'
                        : 'border-amber-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              inc.severity === 'CRITICAL'
                                ? 'bg-red-600 text-white animate-pulse'
                                : inc.severity === 'HIGH'
                                ? 'bg-rose-500 text-white'
                                : inc.severity === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inc.severity} SEVERITY
                          </span>

                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {inc.type.replace('_', ' ')}
                          </span>

                          <span className="font-mono text-xs text-amber-700 font-bold">
                            Ref: {inc.bookingRef}
                          </span>
                        </div>

                        <h3 className="mt-1 font-bold text-base text-slate-900">
                          {inc.vehicleName}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            inc.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : inc.status === 'INVESTIGATING'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : inc.status === 'ACTION_TAKEN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-red-100 text-red-800 border border-red-300 font-black'
                          }`}
                        >
                          {inc.status}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(inc.reportedAt).toLocaleString('en-KE')}
                        </span>
                      </div>
                    </div>

                    {/* Incident Details & Location */}
                    <div className="text-xs text-slate-700 space-y-1.5">
                      <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {inc.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Renter &amp; Contact
                          </span>
                          <span className="font-bold text-slate-900">{inc.travelerName}</span>
                          <span className="text-slate-600 block">{inc.travelerPhone}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Reported Location
                          </span>
                          <span className="font-semibold text-slate-900">
                            {inc.locationDescription}
                          </span>
                          {inc.latitude && inc.longitude && (
                            <a
                              href={`https://maps.google.com/?q=${inc.latitude},${inc.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-600 hover:underline text-[11px] block mt-0.5 font-bold"
                            >
                              📍 Open Coordinates on Google Maps ({inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)})
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photos */}
                    {inc.photos && inc.photos.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">
                          Evidence Attachments ({inc.photos.length})
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {inc.photos.map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt="Incident"
                              className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution Notes if resolved */}
                    {inc.status === 'RESOLVED' && inc.resolutionNotes && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-0.5">
                        <span className="font-bold block flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Resolution Recorded
                        </span>
                        <p>{inc.resolutionNotes}</p>
                        {inc.resolvedAt && (
                          <span className="text-[10px] text-emerald-700 block font-mono">
                            Resolved at: {new Date(inc.resolvedAt).toLocaleString('en-KE')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`https://wa.me/${(inc.travelerPhone || '254722374535').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${inc.travelerName}, M-TRAVEL Operations Lead Amos is following up regarding your incident on vehicle ${inc.vehicleName}. Are you safe?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal/40 bg-teal/10 text-xs font-bold text-teal hover:bg-teal/20 transition"
                      >
                        <span>💬 WhatsApp Renter</span>
                      </a>

                      {inc.status !== 'RESOLVED' && (
                        <div className="flex items-center gap-2">
                          {inc.status !== 'INVESTIGATING' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateIncidentStatus(inc.id, 'INVESTIGATING');
                                setIncidentsList(getAllIncidents());
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              Investigating
                            </button>
                          )}

                          {inc.status !== 'ACTION_TAKEN' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateIncidentStatus(inc.id, 'ACTION_TAKEN');
                                setIncidentsList(getAllIncidents());
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                            >
                              Dispatch Sent
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setResolvingIncident(inc);
                              setResolutionNotes('');
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            {incidentsList.length === 0 && (
              <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Zero Incident Reports</p>
                <p className="text-xs text-slate-400 mt-1">
                  All active rentals and safari tours are operating normally with no reported breakdowns or collisions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS TRAIL ── */}
      {!loading && activeTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-600" />
                Platform Lifecycle &amp; Security Audit Trail ({auditLogsList.length})
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Immutable, chronological activity log of all vehicle handovers, return inspections, deposit settlements, approvals, and emergency alerts.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Audit Table */}
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <table className="w-full text-xs text-left text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Action Event</th>
                  <th className="px-4 py-3 font-semibold">Target Entity</th>
                  <th className="px-4 py-3 font-semibold">Actor / Officer</th>
                  <th className="px-4 py-3 font-semibold">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogsList
                  .filter(log => {
                    if (!auditSearch) return true;
                    const q = auditSearch.toLowerCase();
                    return (
                      log.action.toLowerCase().includes(q) ||
                      log.entityId.toLowerCase().includes(q) ||
                      log.details.toLowerCase().includes(q) ||
                      log.actorName.toLowerCase().includes(q)
                    );
                  })
                  .map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-KE')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            log.action.includes('PRE_RENTAL')
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : log.action.includes('RETURN') || log.action.includes('SETTLEMENT')
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : log.action.includes('INCIDENT')
                              ? 'bg-red-100 text-red-900 border border-red-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {log.entityName}: {log.entityId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        <div>{log.actorName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-normal">
                        {log.details}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {auditLogsList.length === 0 && (
              <p className="p-8 text-center text-slate-400">No audit logs recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── TRAVELER CREDIT SCORES & RISK INTELLIGENCE TAB (ADMIN ONLY) ── */}
      {activeTab === 'credit_scores' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                Traveler Credit Ratings &amp; Risk Intelligence
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Admin-exclusive credit scoring engine based on executive handover inspections, return conditions, and fleet safety records.
              </p>
            </div>
            <button
              onClick={() => fetchAll()}
              className="btn-secondary !py-1.5 !px-3 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> Refresh Ratings
            </button>
          </div>

          {/* Credit Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Monitored Travelers</span>
              <p className="font-mono text-3xl font-bold text-slate-900 mt-2">{getStoredCreditProfiles().length}</p>
              <p className="text-xs text-slate-500 mt-1">Verified traveler accounts</p>
            </div>

            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-5 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">VIP Renters (A+)</span>
              <p className="font-mono text-3xl font-bold text-emerald-700 mt-2">
                {getStoredCreditProfiles().filter(p => p.score >= 750).length}
              </p>
              <p className="text-xs text-emerald-700 font-medium mt-1">Score 750 - 850 (Eligible for all vehicles)</p>
            </div>

            <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-5 shadow-sm">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Good Standing (B)</span>
              <p className="font-mono text-3xl font-bold text-amber-900 mt-2">
                {getStoredCreditProfiles().filter(p => p.score >= 650 && p.score < 750).length}
              </p>
              <p className="text-xs text-amber-800 font-medium mt-1">Score 650 - 749 (Standard Hire)</p>
            </div>

            <div className="rounded-2xl bg-rose-50/80 border border-rose-200 p-5 shadow-sm">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Restricted / Risk (D)</span>
              <p className="font-mono text-3xl font-bold text-rose-700 mt-2">
                {getStoredCreditProfiles().filter(p => p.isRestricted || p.score < 550).length}
              </p>
              <p className="text-xs text-rose-700 font-medium mt-1">Vehicle Hire Banned / Flagged</p>
            </div>
          </div>

          {/* Travelers Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900 text-sm">Traveler Credit Profiles</h3>
              <span className="text-xs text-slate-500 font-medium">Scores updated automatically on return inspections</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-display">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Traveler Details</th>
                    <th className="px-4 py-3">Credit Score</th>
                    <th className="px-4 py-3">Handover Record</th>
                    <th className="px-4 py-3">Document Check</th>
                    <th className="px-4 py-3">Rental Status</th>
                    <th className="px-4 py-3 text-right">Admin Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getStoredCreditProfiles().map((profile) => {
                    const isBanned = profile.isRestricted || profile.score < 550;
                    return (
                      <tr key={profile.userId} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 text-sm">{profile.touristName}</p>
                          <p className="text-slate-500 font-mono text-[11px]">{profile.touristEmail}</p>
                          <p className="text-slate-500 text-[11px]">{profile.touristPhone}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-slate-900">{profile.score}</span>
                            <span className="text-slate-400 text-xs">/ 850</span>
                          </div>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5 ${
                            profile.score >= 750 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            profile.score >= 650 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {profile.tier}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 space-y-0.5 text-slate-700">
                          <p>Completed Trips: <strong>{profile.completedTrips}</strong></p>
                          <p className="text-emerald-700 font-semibold">Clean Returns: {profile.cleanHandovers}</p>
                          {profile.lateReturns > 0 && <p className="text-amber-700 font-bold">Late Returns: {profile.lateReturns}</p>}
                          {profile.damagesCount > 0 && <p className="text-rose-700 font-bold">Damages Logged: {profile.damagesCount}</p>}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle className="h-3 w-3 text-emerald-600" /> National ID / Passport
                            </span>
                            <br />
                            <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                              <CheckCircle className="h-3 w-3 text-teal-600" /> Driving License Verified
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-[10px] font-bold border border-rose-300">
                              <XCircle className="h-3.5 w-3.5 text-rose-600" /> Restricted / Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] font-bold border border-emerald-300">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Eligible for Hire
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              toggleTravelerRestriction(profile.userId, !profile.isRestricted, 'Admin manual override');
                              fetchAll();
                            }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                              profile.isRestricted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            {profile.isRestricted ? 'Lift Restriction' : 'Restrict Rental'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ── ADMIN VEHICLE SMART INSPECTION & REJECTION MODAL ── */}
      {inspectingVehicle && (() => {
        const { hostName, hostPhone, hostEmail } = resolveHostDetails(inspectingVehicle);
        return (
          <VehicleInspectionModal
            vehicle={inspectingVehicle}
            hostName={hostName}
            hostPhone={hostPhone}
            hostEmail={hostEmail}
            onApprove={() => {
              const v = inspectingVehicle;
              setInspectingVehicle(null);
              handleApproveVehicle(v);
            }}
            onReject={(reasons, customFeedback) => {
              handleRejectVehicle(inspectingVehicle, reasons, customFeedback);
            }}
            onClose={() => setInspectingVehicle(null)}
          />
        );
      })()}

      {/* ── ADMIN VEHICLE REMOVAL / DE-REGISTRATION MODAL (Admin Exclusive) ── */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="rounded-xl bg-rose-100 p-2 text-rose-700 shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg">Remove Vehicle from Fleet</h3>
                  <p className="text-xs text-slate-500 font-medium">Platform Administration Exclusive Control</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Vehicle Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-3">
              <div className="h-14 w-20 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                <img
                  src={vehicleToDelete.images[0] || '/vehicles/prado-front.jpg'}
                  alt={vehicleToDelete.make}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-slate-900 text-sm">{vehicleToDelete.make} {vehicleToDelete.model} ({vehicleToDelete.year ?? 2024})</p>
                <p className="text-xs text-slate-500">Fleet Host: <strong className="text-slate-800">{vehicleToDelete.ownerName || 'Unknown'}</strong></p>
                <p className="text-[11px] font-mono text-amber-700 font-bold">{formatPrice(vehicleToDelete.pricePerDay)}/day</p>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Select Reason for De-Registration / Removal:
              </label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              >
                <option value="Failed quality or roadworthiness inspection">Failed quality or roadworthiness inspection</option>
                <option value="Fleet host requested removal from system">Fleet host requested removal from system</option>
                <option value="Expired insurance, road license or documentation">Expired insurance, road license or documentation</option>
                <option value="Customer complaint / safety standards violation">Customer complaint / safety standards violation</option>
                <option value="Duplicate or fraudulent vehicle registration">Duplicate or fraudulent vehicle registration</option>
                <option value="Vehicle retired or sold by host">Vehicle retired or sold by host</option>
                <option value="Other">Other reason (specify below)</option>
              </select>

              {deleteReason === 'Other' && (
                <textarea
                  value={deleteCustomReason}
                  onChange={(e) => setDeleteCustomReason(e.target.value)}
                  placeholder="Enter specific administrative reason for vehicle removal..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500 mt-2"
                />
              )}
            </div>

            {/* Warning Box */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900 leading-relaxed font-medium">
              ⚠️ <strong>Admin Notice:</strong> This vehicle will be completely de-registered and removed from the marketplace, host fleet, and tourist search feeds. The Fleet Host will be officially notified with your stated reason.
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                disabled={isDeletingVehicle}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVehicle}
                disabled={isDeletingVehicle}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeletingVehicle ? 'Removing Vehicle…' : 'Confirm Vehicle Removal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN CREATE / EDIT DESTINATION MODAL ── */}
      {isDestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-purple-700">
                <div className="rounded-xl bg-purple-100 p-2 text-purple-700 shrink-0">
                  <Palmtree className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg">
                    {editingDest ? 'Edit Destination / Tour' : 'Add New Destination, Safari or Villa'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Published directly to the M-TRAVEL Traveler "Holidays and Tours" marketplace
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDestModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDestForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Listing Category *</label>
                  <select
                    value={destForm.category}
                    onChange={e => setDestForm({ ...destForm, category: e.target.value as HolidayOrTourCategory })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-purple-600 focus:outline-hidden"
                  >
                    <option value="TOUR">Guided Safari & Tour</option>
                    <option value="HOLIDAY_HOME">Holiday Home & Villa</option>
                    <option value="DESTINATION">Travel Destination & Experience</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Badge / Tagline *</label>
                  <input
                    type="text"
                    required
                    value={destForm.badge}
                    onChange={e => setDestForm({ ...destForm, badge: e.target.value })}
                    placeholder="e.g. Premier Safari Tour, Luxury Beachfront"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={destForm.title}
                  onChange={e => setDestForm({ ...destForm, title: e.target.value })}
                  placeholder="e.g. 3-Day Maasai Mara Great Migration Safari"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Short Subtitle / Hook</label>
                <input
                  type="text"
                  value={destForm.subtitle}
                  onChange={e => setDestForm({ ...destForm, subtitle: e.target.value })}
                  placeholder="e.g. All-inclusive 4x4 Land Cruiser game drives, luxury lodge stay & park fees"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={destForm.location}
                    onChange={e => setDestForm({ ...destForm, location: e.target.value })}
                    placeholder="e.g. Maasai Mara National Reserve"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Region / County</label>
                  <input
                    type="text"
                    value={destForm.region}
                    onChange={e => setDestForm({ ...destForm, region: e.target.value })}
                    placeholder="e.g. Narok County, Kenya"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Price in KES *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={destForm.priceKES}
                    onChange={e => setDestForm({ ...destForm, priceKES: Number(e.target.value) })}
                    placeholder="e.g. 45000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Price Unit *</label>
                  <select
                    value={destForm.priceUnit}
                    onChange={e => setDestForm({ ...destForm, priceUnit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-purple-600 focus:outline-hidden"
                  >
                    <option value="/ person">/ person</option>
                    <option value="/ night">/ night</option>
                    <option value="/ package">/ package</option>
                    <option value="/ group">/ group</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Featured Image & Photo Gallery (Upload Multiple Destination Photos) *
                </label>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <label className="cursor-pointer rounded-xl bg-purple-50 border border-purple-200 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition flex items-center gap-2 shadow-2xs">
                    <Upload className="h-4 w-4" /> Upload Multiple Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleDestImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">Or paste image URL below</span>
                </div>
                <input
                  type="url"
                  value={destForm.imageUrl}
                  onChange={e => {
                    const val = e.target.value;
                    setDestForm(prev => ({
                      ...prev,
                      imageUrl: val,
                      images: prev.images?.length ? [val, ...prev.images.slice(1)] : [val]
                    }));
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                />

                {(destForm.images?.length > 0 || destForm.imageUrl) && (
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      Gallery Photos ({destForm.images?.length || (destForm.imageUrl ? 1 : 0)}) — First photo is primary cover:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(destForm.images?.length > 0 ? destForm.images : [destForm.imageUrl]).map((imgUrl, idx) => (
                        <div key={idx} className="relative group h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                          <img src={imgUrl} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDestImage(idx)}
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-xs"
                            title="Remove photo"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Specs / Badges (comma separated)</label>
                <input
                  type="text"
                  value={destForm.specs}
                  onChange={e => setDestForm({ ...destForm, specs: e.target.value })}
                  placeholder="3 Days / 2 Nights, Full Board, 4x4 Cruiser, Park Entry Included"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Detailed Overview / Description *</label>
                <textarea
                  required
                  rows={3}
                  value={destForm.overview}
                  onChange={e => setDestForm({ ...destForm, overview: e.target.value })}
                  placeholder="Describe the holiday experience, lodging, game drives, or villa amenities..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Highlights (comma separated)</label>
                <input
                  type="text"
                  value={destForm.highlights}
                  onChange={e => setDestForm({ ...destForm, highlights: e.target.value })}
                  placeholder="Big Five safari, Oceanfront infinity pool, Private chef, Sunset cruise"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Itinerary / Daily Schedule / Key Amenities (one per line)</label>
                <textarea
                  rows={3}
                  value={destForm.itinerary}
                  onChange={e => setDestForm({ ...destForm, itinerary: e.target.value })}
                  placeholder="Day 1: Transfer from Nairobi & afternoon safari&#10;Day 2: Full day wildlife safari with bush picnic&#10;Day 3: Sunrise game drive & return journey"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={destForm.isLive}
                    onChange={e => setDestForm({ ...destForm, isLive: e.target.checked })}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  Live on Marketplace (Visible to Travelers)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={destForm.featured}
                    onChange={e => setDestForm({ ...destForm, featured: e.target.checked })}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  Featured Listing
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDestModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingDest ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DESTINATION FACILITATION & VOUCHER MODAL (ADMIN) ────── */}
      {selectedDestVoucher && (
        <DestinationVoucherModal
          booking={selectedDestVoucher}
          onClose={() => setSelectedDestVoucher(null)}
        />
      )}

      {/* ── PRE-RENTAL HANDOVER MODAL ── */}
      {selectedBookingForHandover && (
        <VehicleHandoverModal
          booking={selectedBookingForHandover}
          vehicle={vehicles.find(v => v.id === selectedBookingForHandover.vehicleId)}
          onClose={() => setSelectedBookingForHandover(null)}
          onHandoverComplete={() => {
            setSelectedBookingForHandover(null);
            fetchAll();
          }}
        />
      )}

      {/* ── RETURN INSPECTION & SETTLEMENT MODAL ── */}
      {selectedBookingForReturnInspection && (
        <VehicleReturnInspectionModal
          booking={selectedBookingForReturnInspection}
          handover={getHandoverByBookingId(selectedBookingForReturnInspection.id)}
          onClose={() => setSelectedBookingForReturnInspection(null)}
          onInspectionComplete={() => {
            setSelectedBookingForReturnInspection(null);
            fetchAll();
          }}
        />
      )}

      {/* ── INCIDENT RESOLUTION MODAL ── */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Mark Incident as Resolved
              </h3>
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Incident:</strong> {resolvingIncident.type} on {resolvingIncident.vehicleName}</p>
              <p><strong>Renter:</strong> {resolvingIncident.travelerName} ({resolvingIncident.travelerPhone})</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Resolution Actions Taken &amp; Notes</label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="e.g. Mobile mechanics dispatched to Mai Mahiu; replacement tyre fitted. Traveler safely back on journey."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateIncidentStatus(resolvingIncident.id, 'RESOLVED', resolutionNotes || 'Resolved by operations');
                  setResolvingIncident(null);
                  fetchAll();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
