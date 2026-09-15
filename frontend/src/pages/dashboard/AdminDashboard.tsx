import { useEffect, useState } from 'react';
import {
  Users, Car, Shield, DollarSign, Activity, CheckCircle,
  RefreshCw, BarChart3, TrendingUp, AlertTriangle, ArrowDownLeft, ArrowUpRight, FileCheck, Landmark, Video,
  XCircle, Trash2, Server, Wifi, HardDrive, Clock, MapPin, Power
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useCurrency } from '@/context/CurrencyContext';
import { sendNotification } from '@/lib/notificationService';
import {
  getStoredBookings, getStoredVehicles, syncVehiclesFromSupabase,
  approveVehicle as approveVehicleInStore, updateBookingStatus,
  toggleVehicleLiveStatus, getVehicleHireStatus, deleteVehicle,
  type StoredBooking, type StoredVehicle
} from '@/lib/bookingStore';
import { OpenCvVehicleTracker } from '@/components/tracking/OpenCvVehicleTracker';
import { AdminFleetMap } from '@/components/tracking/AdminFleetMap';

interface DBUser {
  id: string; email: string; first_name: string; last_name: string;
  role: string; is_active: boolean; created_at: string; phone?: string;
}

interface DBTransaction {
  id: string; type: string; amount: number; status: string;
  reference?: string; description?: string; created_at: string;
  wallets?: { user_id: string; users?: { first_name: string; last_name: string; role: string } };
}

type Tab = 'overview' | 'approvals' | 'accounting' | 'users' | 'fleet' | 'bookings' | 'map';

export default function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers]         = useState<DBUser[]>([]);
  const [vehicles, setVehicles]   = useState<StoredVehicle[]>([]);
  const [bookings, setBookings]   = useState<StoredBooking[]>([]);
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [approvalMsg, setApprovalMsg] = useState('');
  const [showOpenCvTracker, setShowOpenCvTracker] = useState(false);
  const [selectedBookingForTrack, setSelectedBookingForTrack] = useState<StoredBooking | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  // De-registration / Vehicle Deletion Modal (Admin Exclusive)
  const [vehicleToDelete, setVehicleToDelete] = useState<StoredVehicle | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Violation of vehicle safety or roadworthiness standards');
  const [deleteCustomReason, setDeleteCustomReason] = useState<string>('');
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  const [alerts] = useState([
    { type: 'SPEEDING', message: 'Vehicle (Toyota Land Cruiser 4x4) traveling at 92 km/h on Nairobi-Nakuru Highway', timestamp: '2 mins ago' },
    { type: 'ROUTE_DEVIATION', message: 'Vehicle (Toyota Alphard) taking scenic route near Rift Valley Viewpoint', timestamp: '5 mins ago' },
  ]);

  const fetchAll = async () => {
    setLoading(true);
    await syncVehiclesFromSupabase().catch(() => {});
    const storeVehicles = getStoredVehicles();
    const storeBookings = getStoredBookings();

    const [uRes, txRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('transactions')
        .select('*, wallets(user_id, users(first_name, last_name, role))')
        .order('created_at', { ascending: false }).limit(50),
    ]);

    setUsers(uRes.data ?? []);
    setVehicles(storeVehicles);
    setBookings(storeBookings);
    setTransactions((txRes.data ?? []) as DBTransaction[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const handleUpdate = () => fetchAll();
    window.addEventListener('mt_vehicle_updated', handleUpdate);
    window.addEventListener('mt_booking_updated', handleUpdate);
    window.addEventListener('mt_booking_status_changed', handleUpdate);
    window.addEventListener('mt_vehicle_approved', handleUpdate);
    return () => {
      window.removeEventListener('mt_vehicle_updated', handleUpdate);
      window.removeEventListener('mt_booking_updated', handleUpdate);
      window.removeEventListener('mt_booking_status_changed', handleUpdate);
      window.removeEventListener('mt_vehicle_approved', handleUpdate);
    };
  }, []);

  const toggleUserActive = async (id: string, val: boolean) => {
    await supabase.from('users').update({ is_active: val }).eq('id', id);
    setUsers(us => us.map(u => u.id === id ? { ...u, is_active: val } : u));
  };

  const handleApproveVehicle = async (vehicle: StoredVehicle) => {
    approveVehicleInStore(vehicle.id);
    try {
      await supabase.from('vehicles').update({ is_approved: true, is_available: true }).eq('id', vehicle.id);
    } catch { /* Supabase may not have this record yet, store already updated */ }

    sendNotification({
      recipientId: vehicle.ownerId,
      role: 'VEHICLE_OWNER',
      type: 'VEHICLE_APPROVED_OWNER',
      title: 'Vehicle Approved & Registered',
      message: `Your ${vehicle.make} ${vehicle.model} has been inspected & approved by M-TRAVEL Admin. It is now live in tourist searches!`,
      link: '/dashboard/owner',
    });

    setApprovalMsg(`${vehicle.make} ${vehicle.model} approved and live. Car owner has been notified.`);
    fetchAll();
    setTimeout(() => setApprovalMsg(''), 5000);
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
        u.last_name?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview',   label: 'Overview', icon: BarChart3 },
    { id: 'approvals',  label: `Approvals (${pendingVehicles.length})`, icon: FileCheck },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'users',      label: 'Accounts', icon: Users },
    { id: 'fleet',      label: 'Vehicles', icon: Car },
    { id: 'bookings',   label: 'Bookings', icon: Clock },
    { id: 'map',        label: 'GPS Map', icon: MapPin },
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
        <button onClick={fetchAll} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2 font-bold text-slate-800 border-slate-200 hover:text-slate-950">
          <RefreshCw className="h-4 w-4 text-purple-600" /> Sync Live Data
        </button>
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

          {/* GPS ALERTS */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" /> Smart Route GPS Alerts
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
                { label: 'GPS Network',   value: 'Online',  sub: `${bookings.filter(b => b.status === 'IN_PROGRESS').length} active`,  icon: Wifi,      color: 'text-teal-800',    bg: 'border-teal-200 bg-teal-50' },
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
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
              {approvalMsg}
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
                        src={v.images[0] || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600'}
                        alt="Front View"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-1 left-1 rounded bg-amber-500 text-slate-950 px-1.5 py-0.5 text-[9px] font-mono font-bold">
                        Front View
                      </span>
                    </div>
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={v.images[1] || v.images[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600'}
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

                  <div className="border-t border-slate-100 pt-3 flex gap-2">
                    <button
                      onClick={() => handleApproveVehicle(v)}
                      className="btn-primary flex-1 text-xs !py-2.5 font-bold shadow-sm flex items-center justify-center gap-1.5 text-white"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve Live
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(v)}
                      className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1 shrink-0"
                      title="Reject & remove vehicle from system"
                    >
                      <Trash2 className="h-4 w-4" /> Reject &amp; Remove
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
            <h2 className="font-display text-xl font-bold text-slate-900">All Registered Accounts ({filtered.length})</h2>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field max-w-xs text-xs text-slate-900 placeholder:text-slate-400 border-slate-300"
            />
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <table className="w-full text-xs text-left text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'text-purple-800 bg-purple-50 border-purple-200' :
                        u.role === 'VEHICLE_OWNER' ? 'text-amber-800 bg-amber-50 border-amber-200' :
                        'text-teal-800 bg-teal-50 border-teal-200'
                      }`}>{u.role}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FLEET ── */}
      {!loading && activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">All Platform Vehicles ({vehicles.length})</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Toggle live marketplace status upon host request or oversee vehicle availability.</p>
            </div>
            <a
              href="/catalogue?category=vehicles"
              className="btn-secondary !py-2 !px-3 text-xs font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 flex items-center gap-1.5"
            >
              <Car className="h-3.5 w-3.5" /> View Live Fleet Marketplace
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(v => {
              const hireStatus = getVehicleHireStatus(v.id);
              const isLive = v.isLive !== false;

              return (
                <div key={v.id} className="rounded-2xl bg-white border border-slate-200/90 p-4 space-y-2.5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-amber-700 font-bold">{v.type}</span>
                    <div className="flex items-center gap-1.5">
                      {v.status === 'PENDING_APPROVAL' ? (
                        <span className="text-[10px] font-bold rounded-full border px-2 py-0.5 text-yellow-700 border-yellow-200 bg-yellow-50">
                          Pending Approval
                        </span>
                      ) : hireStatus.isHired ? (
                        <span className="text-[10px] font-bold rounded-full border px-2 py-0.5 text-amber-700 border-amber-200 bg-amber-50 animate-pulse">
                          🚗 On Trip
                        </span>
                      ) : isLive ? (
                        <span className="text-[10px] font-bold rounded-full border px-2 py-0.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                          🟢 Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold rounded-full border px-2 py-0.5 text-rose-700 border-rose-200 bg-rose-50">
                          ⏸️ Offline
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={v.images[0] || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400'}
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
                    <p className="text-xs text-slate-600 font-medium">Host: <span className="text-slate-900 font-semibold">{v.ownerName}</span></p>
                  </div>

                  {/* Status description */}
                  {v.status === 'APPROVED' && (
                    <div className="text-[11px] rounded-lg p-2 bg-slate-50 border border-slate-200">
                      {hireStatus.isHired ? (
                        <p className="text-amber-800 font-medium">
                          🚗 Hired by <strong>{hireStatus.touristName || 'Traveler'}</strong> until <strong>{hireStatus.returnDate}</strong>.
                        </p>
                      ) : isLive ? (
                        <p className="text-emerald-800 font-medium">
                          🟢 Live on marketplace. Ready for tourist bookings.
                        </p>
                      ) : (
                        <p className="text-rose-800 font-medium">
                          ⏸️ Paused / Offline. Hidden from tourist bookings.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 text-xs">
                    <span className="font-mono text-amber-700 font-bold">{formatPrice(v.pricePerDay)}/day</span>

                    <div className="flex items-center gap-1.5">
                      {v.status === 'PENDING_APPROVAL' ? (
                        <button
                          onClick={() => handleApproveVehicle(v)}
                          className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1 hover:bg-emerald-100 transition shadow-sm"
                        >
                          Approve Live
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            toggleVehicleLiveStatus(v.id);
                            fetchAll();
                          }}
                          disabled={hireStatus.isHired}
                          className={`text-[10px] font-bold rounded-lg px-2.5 py-1 transition shadow-sm flex items-center gap-1 ${
                            hireStatus.isHired
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : isLive
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                          title={
                            hireStatus.isHired
                              ? 'Cannot toggle while vehicle is actively hired'
                              : isLive
                              ? 'Take vehicle offline upon host request'
                              : 'Turn vehicle live upon host request'
                          }
                        >
                          <Power className="h-3 w-3" />
                          {hireStatus.isHired ? 'Locked (On Trip)' : isLive ? 'Take Offline' : 'Set Live'}
                        </button>
                      )}

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
                </div>
              );
            })}
            {vehicles.length === 0 && <p className="col-span-3 text-center text-slate-500 font-medium text-sm py-10">No vehicles registered yet.</p>}
          </div>
        </div>
      )}

      {/* ── BOOKINGS ── */}
      {!loading && activeTab === 'bookings' && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">All Platform Bookings ({bookings.length})</h2>
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <table className="w-full text-xs text-left text-slate-800">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  {['Booking Ref', 'Tourist', 'Vehicle', 'Status', 'Amount', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map(b => {
                  const canCancel = !['CANCELLED', 'REJECTED', 'COMPLETED'].includes(b.status);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-amber-700 font-bold">{b.bookingRef}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{b.touristName}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{b.vehicleName}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          b.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          b.status === 'IN_PROGRESS' ? 'text-teal-700 bg-teal-50 border-teal-200 animate-pulse' :
                          b.status === 'CANCELLED' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                          'text-yellow-700 bg-yellow-50 border-yellow-200'
                        }`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatPrice(b.totalAmount)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{new Date(b.createdAt).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['IN_PROGRESS', 'CONFIRMED', 'PAID', 'ACCEPTED'].includes(b.status) && (
                            <button
                              onClick={() => { setSelectedBookingForTrack(b); setShowOpenCvTracker(true); }}
                              className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-800 hover:bg-teal-100 transition"
                            >
                              <Video className="h-3 w-3 text-teal-700" /> Track
                            </button>
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

      {/* ── MAP / LIVE FLEET COMMAND CENTER ── */}
      {!loading && activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600 animate-pulse" /> Live Fleet GPS Command Center
            </h2>
            <span className="text-xs text-slate-500 font-medium">Real-time GPS telemetry from all registered Fleet Hosts</span>
          </div>
          <AdminFleetMap />
        </div>
      )}

      {/* OPENCV LIVE TRACKER MODAL */}
      {showOpenCvTracker && selectedBookingForTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white border border-slate-200 w-full max-w-4xl space-y-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video className="h-5 w-5 text-teal-600 animate-pulse" />
                Live Vehicle Feed — {selectedBookingForTrack.vehicleName}
              </h3>
              <button
                onClick={() => { setShowOpenCvTracker(false); setSelectedBookingForTrack(null); }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                ✕ Close
              </button>
            </div>
            <OpenCvVehicleTracker
              bookingId={selectedBookingForTrack.id}
              vehicleName={selectedBookingForTrack.vehicleName}
              touristName={selectedBookingForTrack.touristName}
              driverName={selectedBookingForTrack.driverName}
              role="admin"
            />
          </div>
        </div>
      )}

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
                  src={vehicleToDelete.images[0] || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200'}
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
    </div>
  );
}
