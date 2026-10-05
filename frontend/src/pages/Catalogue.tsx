import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Bus, Palmtree, MapPin, ArrowRight, Search, Sparkles,
  CheckCircle, Calendar, ShieldCheck, X, Power, Lock, AlertTriangle
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { MpesaStkPushModal } from '@/components/ui/MpesaStkPushModal';
import {
  saveBooking, getStoredVehicles, syncVehiclesFromSupabase, getVehicleHireStatus, toggleVehicleLiveStatus, isVehicleLive,
  isBusVehicle, type StoredVehicle, type VehicleHireStatus
} from '@/lib/bookingStore';
import { getVehicleFallbackImage } from '@/lib/supabaseClient';
import { sendNotification } from '@/lib/notificationService';
import { sendTravelerBookingEmail } from '@/lib/communicationService';

type TabType = 'vehicles' | 'buses';

interface CatalogueItem {
  id: string;
  category: TabType;
  title: string;
  subtitle: string;
  badge: string;
  priceKES: number;
  priceUnit: string;
  imageUrl: string;
  location: string;
  specs: string[];
  rating: number;
  reviews: number;
  ownerId?: string;
  ownerName?: string;
  isLive?: boolean;
  details: {
    overview: string;
    highlights: string[];
    scheduleOrItinerary?: string[];
  };
}

const CATALOGUE_ITEMS: CatalogueItem[] = [];

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const { formatPrice } = useCurrency();

  const categoryParam = searchParams.get('category');
  const activeTab: TabType = categoryParam === 'buses' ? 'buses' : 'vehicles';
  const [searchTerm, setSearchTerm] = useState('');
  const [storedVehicles, setStoredVehicles] = useState<StoredVehicle[]>(() => getStoredVehicles());
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const refreshVehicles = () => {
    setStoredVehicles(getStoredVehicles());
  };

  useEffect(() => {
    refreshVehicles();
    syncVehiclesFromSupabase().then(() => refreshVehicles()).catch(() => {});

    const handleUpdate = () => refreshVehicles();
    window.addEventListener('mt_vehicle_updated', handleUpdate);
    window.addEventListener('mt_vehicle_approved', handleUpdate);
    window.addEventListener('mt_booking_updated', handleUpdate);
    window.addEventListener('mt_booking_status_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('mt_vehicle_updated', handleUpdate);
      window.removeEventListener('mt_vehicle_approved', handleUpdate);
      window.removeEventListener('mt_booking_updated', handleUpdate);
      window.removeEventListener('mt_booking_status_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const [selectedItem, setSelectedItem] = useState<CatalogueItem | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat === 'tours' || cat === 'homes') {
      navigate(`/holidays-and-tours?tab=${cat === 'homes' ? 'homes' : 'tours'}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ category: tab }, { replace: true });
  };

  const TABS: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'vehicles', label: 'Live Vehicle Hire', icon: Car, desc: 'Live Approved 4x4 Cruisers, SUVs & Executive Cars' },
    { id: 'buses',    label: 'Bus Reservations',  icon: Bus, desc: 'VIP Highway Coaches & Intercity Shuttles' },
  ];

  // Dynamic approved vehicles from registered hosts (only approved & live vehicles)
  const rawVehicles = storedVehicles && storedVehicles.length > 0 ? storedVehicles : getStoredVehicles();
  const approvedHostVehicles: CatalogueItem[] = rawVehicles
    .filter((v) => v.status === 'APPROVED' && (isVehicleLive(v.id) || getVehicleHireStatus(v.id).isHired))
    .map((v) => {
      const isBus = isBusVehicle(v);
      const text = `${v.make} ${v.model} ${v.type} ${v.id}`.toLowerCase();
      const fallback = getVehicleFallbackImage(v.make, v.model, isBus ? 'BUS' : v.type, v.id);
      let img = v.images?.[0];
      if (!img || (isBus && img.includes('prado')) || (img.includes('prado') && !text.includes('prado'))) {
        img = isBus ? '/vehicles/isuzu-coach-front.jpg' : fallback;
      }
      return {
        id: v.id,
        category: (isBus ? 'buses' : 'vehicles') as TabType,
        title: `${v.make} ${v.model}`,
        subtitle: `${v.year} • ${v.seats} Seats • ${v.fuelType} • ${v.transmission}`,
        badge: isBus ? 'BUS' : '',
        priceKES: v.pricePerDay,
        priceUnit: '/ day',
        imageUrl: img,
        location: v.address || 'Nairobi & National Parks',
        specs: [`${v.seats} Seats`, v.fuelType, v.transmission, v.hasInsurance ? 'Verified & Insured' : 'Standard Insurance'],
        rating: v.ratingAverage || 4.9,
        reviews: v.ratingCount || 12,
        ownerId: v.ownerId,
        ownerName: v.ownerName,
        isLive: true,
        details: {
          overview: `${v.year} ${v.make} ${v.model} registered by host ${v.ownerName}. Inspected and approved by M-TRAVEL Fleet Administration for tourist hire.`,
          highlights: [
            'Certified roadworthiness & professional inspection',
            '24/7 M-TRAVEL Roadside Assistance',
            v.hasInsurance ? 'Comprehensive insurance included' : 'Standard third-party cover',
            `Pickup / Delivery: ${v.address || 'Nairobi Central Hub'}`,
          ],
        },
      };
    });

  // Platform catalogue: Live Vehicles strictly from approved hosts; Bus reservations for intercity routes
  const allCatalogueItems: CatalogueItem[] = [
    ...approvedHostVehicles,
    ...CATALOGUE_ITEMS.filter((ci) => ci.category === 'buses'),
  ];

  const filteredItems = allCatalogueItems.filter((item) => {
    const matchesTab = item.category === activeTab;
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans">
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-10 relative z-10">
        {/* HEADER HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-8 md:p-12 shadow-2xl text-white">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-white" /> M-TRAVEL Verified Marketplace
            </span>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-sm">
                {activeTab === 'vehicles' && <Car className="h-6 w-6 stroke-[2]" />}
                {activeTab === 'buses' && <Bus className="h-6 w-6 stroke-[2]" />}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                {activeTab === 'buses' && 'Bus Reservations & Coach Routes'}
                {activeTab === 'vehicles' && 'Live Fleet Vehicles & Safari Hire'}
              </h1>
            </div>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              {activeTab === 'buses' && 'Book luxury highway coaches & intercity express shuttles with seat selection, onboard WiFi, and instant QR tickets.'}
              {activeTab === 'vehicles' && 'Explore live certified 4x4 safari cruisers, executive SUVs, and passenger vehicles registered by approved fleet hosts.'}
            </p>

            {/* HOLIDAYS AND TOURS PROMPT BANNER */}
            <div className="pt-2">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Palmtree className="h-5 w-5 text-slate-300 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium">
                    Looking for Guided Safaris, Mara Packages, or Holiday Homes?
                  </span>
                </div>
                <Link
                  to="/holidays-and-tours"
                  className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-slate-300 hover:underline"
                >
                  <span>Visit Holidays and Tours</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="pt-2 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${TABS.find(t => t.id === activeTab)?.label} by name, location...`}
                  className="input-field pl-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 text-xs md:text-sm focus:border-white shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY TABS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-[1.01]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-950 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                <div className="text-left">
                  <span className="block font-bold text-sm leading-none">{tab.label}</span>
                  <span className="text-[10px] font-medium opacity-75 mt-0.5 block">{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

      {/* ADMIN NOTIFICATION TOAST */}
      {adminNotice && (
        <div className="rounded-2xl border border-purple-300 bg-purple-50 p-3.5 text-xs text-purple-900 font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-700 shrink-0" />
            <span>{adminNotice}</span>
          </div>
          <button onClick={() => setAdminNotice(null)} className="text-purple-600 hover:text-purple-950 text-xs font-semibold">Dismiss</button>
        </div>
      )}

      {/* CATALOGUE CARDS GRID */}
      <AnimatePresence initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid gap-6 md:grid-cols-2 items-stretch"
        >
          {filteredItems.length === 0 ? (
            activeTab === 'vehicles' ? (
              <div className="col-span-full rounded-3xl bg-white border border-slate-200 p-12 md:p-16 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto">
                  <Car className="h-8 w-8 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-serif text-2xl font-bold text-slate-950">
                    No vehicles available at the moment
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                    {searchTerm
                      ? `No approved vehicles match "${searchTerm}". Try searching for another keyword or location.`
                      : 'There are currently no approved fleet vehicles listed for hire. Check back soon or register as a fleet host to list your vehicle.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="btn-secondary !bg-slate-100 !border-slate-300 !text-slate-800 hover:!bg-slate-200 !py-2 !px-4 text-xs font-bold"
                    >
                      Clear Search
                    </button>
                  )}
                  <Link
                    to="/register"
                    className="btn-primary !py-2.5 !px-5 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" /> Register as Fleet Host
                  </Link>
                </div>
              </div>
            ) : (
              <div className="col-span-full rounded-3xl bg-white border border-slate-200 p-12 md:p-16 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto">
                  <Bus className="h-8 w-8 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-serif text-2xl font-bold text-slate-950">
                    No buses at the moment
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                    {searchTerm
                      ? `No buses match "${searchTerm}". Try searching for another route or keyword.`
                      : 'There are currently no buses registered into the system. Admin and hosts can register buses under live fleet.'}
                  </p>
                </div>
                {searchTerm && (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="btn-secondary !bg-slate-100 !border-slate-300 !text-slate-800 hover:!bg-slate-200 !py-2 !px-4 text-xs font-bold"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            filteredItems.map((item) => {
              const isVehicle = item.category === 'vehicles' || item.category === 'buses';
              const isLive = isVehicle ? isVehicleLive(item.id) : true;
              const hireStatus = isVehicle ? getVehicleHireStatus(item.id) : { isHired: false, isOnTrip: false, isAwaitingHandover: false };
              const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-slate-900 transition-all duration-300 group flex flex-col sm:flex-row hover:-translate-y-1 h-full"
                >
                  {/* IMAGE */}
                  <div className="relative h-60 sm:h-auto sm:w-1/2 overflow-hidden bg-slate-950 shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {item.badge && item.badge !== 'VAN VEHICLE' && item.badge !== '4X4 VEHICLE' && !item.badge.toLowerCase().includes('vehicle') && (
                      <span className="absolute top-3 left-3 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    {hireStatus.isOnTrip && (
                      <span className="absolute top-3 right-3 rounded-full bg-black/90 backdrop-blur-md border border-slate-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
                        <Lock className="h-3 w-3 text-slate-300" /> Active On Trip
                      </span>
                    )}
                    {!hireStatus.isOnTrip && hireStatus.isAwaitingHandover && (
                      <span className="absolute top-3 right-3 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 shadow-md flex items-center gap-1">
                        <Lock className="h-3 w-3 text-slate-400" /> Booked &amp; Reserved
                      </span>
                    )}
                    {!isLive && isVehicle && !hireStatus.isHired && (
                      <span className="absolute top-3 right-3 rounded-full bg-slate-800/90 backdrop-blur-md border border-slate-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-md flex items-center gap-1">
                        Offline
                      </span>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div>
                      <div className="flex items-center text-xs text-slate-600 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-700" /> {item.location}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-slate-950 group-hover:text-slate-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                        {item.subtitle}
                      </p>

                      {/* TRIP / UNAVAILABILITY NOTICE BANNER */}
                      {isVehicle && hireStatus.isOnTrip && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-300 flex items-start gap-2 text-xs">
                          <AlertTriangle className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-950 block text-[11px]">Currently Unavailable &bull; On Active Trip</span>
                            <p className="text-[10px] text-slate-700 mt-0.5 leading-snug">
                              This vehicle is currently on a trip with a traveler{hireStatus.returnDate ? ` until ${hireStatus.returnDate}` : ''}. Booking and payment are disabled until return handover inspection is completed by Admin.
                            </p>
                          </div>
                        </div>
                      )}
                      {isVehicle && !hireStatus.isOnTrip && hireStatus.isAwaitingHandover && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-300 flex items-start gap-2 text-xs">
                          <Lock className="h-4 w-4 text-slate-800 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-950 block text-[11px]">Booked &bull; Awaiting Handover</span>
                            <p className="text-[10px] text-slate-700 mt-0.5 leading-snug">
                              This vehicle is reserved and scheduled for departure. Booking is locked until it completes its trip.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ADMIN LIVE FLEET OVERRIDE BAR */}
                      {isAdmin && isVehicle && (
                        <div className="mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-purple-700 shrink-0" />
                            <div>
                              <span className="font-bold text-purple-950 block text-[11px]">Admin Fleet Controls</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-purple-700 font-medium">Status:</span>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isLive ? 'text-emerald-700' : 'text-slate-600'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                  {isLive ? 'Live on Marketplace' : 'Offline (Paused)'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = toggleVehicleLiveStatus(item.id);
                              const nextLive = updated ? updated.isLive !== false : false;
                              refreshVehicles();
                              setAdminNotice(`Admin set "${item.title}" to ${nextLive ? 'LIVE' : 'OFFLINE'}.`);
                              setTimeout(() => setAdminNotice(null), 4000);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition flex items-center gap-1 shrink-0 ${
                              isLive
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                            title={isLive ? 'Take offline upon host request' : 'Turn live upon host request'}
                          >
                            <Power className="h-3 w-3" />
                            {isLive ? 'Take Offline' : 'Set Live'}
                          </button>
                        </div>
                      )}

                      {/* SPECS */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.specs.map((spec) => (
                          <span
                            key={spec}
                            className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-700"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Rate</span>
                        <span className="text-xl font-bold text-slate-950">
                          {formatPrice(item.priceKES)}
                          <span className="text-xs font-normal text-slate-500">{item.priceUnit}</span>
                        </span>
                      </div>

                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/vehicles/${item.id}`);
                          }}
                          className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold transition shadow-xs cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                          <span>View Description &amp; Specs</span>
                        </button>
                      ) : hireStatus.isOnTrip ? (
                        <button
                          disabled
                          className="rounded-xl bg-slate-200 border border-slate-300 text-slate-500 !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold cursor-not-allowed shadow-none"
                          title="Vehicle is currently on a trip and unavailable for hire"
                        >
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Unavailable (On Trip)</span>
                        </button>
                      ) : hireStatus.isAwaitingHandover ? (
                        <button
                          disabled
                          className="rounded-xl bg-slate-200 border border-slate-300 text-slate-500 !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold cursor-not-allowed shadow-none"
                          title="Vehicle is already booked and reserved"
                        >
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Booked &amp; Reserved</span>
                        </button>
                      ) : !isLive && isVehicle ? (
                        <button
                          disabled
                          className="rounded-xl bg-slate-200 border border-slate-300 text-slate-500 !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold cursor-not-allowed shadow-none"
                          title="Vehicle is currently paused from hire"
                        >
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Unavailable (Offline)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            navigate(`/vehicles/${item.id}`);
                          }}
                          className="btn-primary !px-5 !py-2 text-xs flex items-center gap-1.5 font-bold shadow-sm"
                        >
                          {activeTab === 'buses' ? 'Reserve Entire Bus' : 'Book Vehicle'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* CATEGORY-SPECIFIC DETAILS & BOOKING MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 md:p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto text-slate-900 my-auto"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 text-lg h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-950 text-white font-mono text-[10px] font-bold px-3 py-1 uppercase shadow-sm">
                {selectedItem.badge}
              </span>
              <span className="text-xs text-teal-700 font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-teal-600" /> {selectedItem.location}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* MODAL LEFT: IMAGE & SPECS */}
              <div className="space-y-4">
                <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200">
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} className="h-full w-full object-cover" />
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Service Specifications</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    {selectedItem.specs.map(s => (
                      <div key={s} className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MODAL RIGHT: CATEGORY SPECIFIC WORKFLOW */}
              {(() => {
                const isSelectedVehicle = selectedItem.category === 'vehicles' || selectedItem.category === 'buses';
                const selectedHireStatus: VehicleHireStatus = isSelectedVehicle ? getVehicleHireStatus(selectedItem.id) : { isHired: false, isOnTrip: false, isAwaitingHandover: false };
                const selectedIsLive = isSelectedVehicle ? isVehicleLive(selectedItem.id) : true;
                const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

                return (
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-slate-900">{selectedItem.title}</h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedItem.details.overview}</p>

                      {/* ADMIN MODAL FLEET CONTROLS */}
                      {isAdmin && isSelectedVehicle && (
                        <div className="mt-3 p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-purple-900 block text-[11px]">Admin Fleet Control</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-purple-700 font-medium">Live Status:</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${selectedIsLive ? 'text-emerald-700' : 'text-slate-600'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${selectedIsLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                {selectedIsLive ? 'Live on Marketplace' : 'Offline (Paused)'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = toggleVehicleLiveStatus(selectedItem.id);
                              const nextLive = updated ? updated.isLive !== false : false;
                              refreshVehicles();
                              setSelectedItem((prev) => (prev ? { ...prev, isLive: nextLive } : null));
                              setAdminNotice(`Admin set "${selectedItem.title}" to ${nextLive ? 'LIVE' : 'OFFLINE'}.`);
                              setTimeout(() => setAdminNotice(null), 4000);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 ${
                              selectedIsLive
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {selectedIsLive ? 'Take Offline' : 'Set Live'}
                          </button>
                        </div>
                      )}

                      {/* VEHICLE AVAILABILITY NOTICES */}
                      {isSelectedVehicle && selectedHireStatus.isOnTrip && (
                        <div className="mt-3 rounded-2xl border border-slate-300 bg-slate-100 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                            <AlertTriangle className="h-4 w-4 text-slate-900 shrink-0" />
                            Vehicle Currently Active On Trip
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            This vehicle is currently on an active trip with another traveler{selectedHireStatus.returnDate ? ` until ${selectedHireStatus.returnDate}` : ''}. It is locked for booking and payment until it returns from the trip and is successfully inspected and handed over back via the admin.
                          </p>
                        </div>
                      )}

                      {isSelectedVehicle && !selectedHireStatus.isOnTrip && selectedHireStatus.isAwaitingHandover && (
                        <div className="mt-3 rounded-2xl border border-slate-300 bg-slate-100 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                            <Lock className="h-4 w-4 text-slate-800 shrink-0" />
                            Vehicle Booked &amp; Reserved
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            This vehicle is currently booked and awaiting handover. Further bookings are locked.
                          </p>
                        </div>
                      )}

                      {isSelectedVehicle && !selectedHireStatus.isHired && !selectedIsLive && (
                        <div className="mt-3 rounded-2xl border border-slate-300 bg-slate-100 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                            <AlertTriangle className="h-4 w-4 text-slate-700 shrink-0" />
                            Vehicle Temporarily Offline
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            This vehicle is temporarily paused from hire upon host/admin request. Please check back later or explore other available vehicles in the fleet.
                          </p>
                        </div>
                      )}

                      {/* WHOLE BUS CHARTER NOTICE */}
                      {selectedItem.category === 'buses' && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Bus className="h-4 w-4 text-slate-700 shrink-0" />
                            <span>Whole Bus Charter (Per Day)</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            Booking covers the entire vehicle per day. Includes dedicated certified coach captain, passenger insurance, and full route flexibility.
                          </p>
                        </div>
                      )}

                      {/* SAFARI ITINERARY */}
                      {selectedItem.details.scheduleOrItinerary && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1 uppercase">
                            <Calendar className="h-3.5 w-3.5 text-slate-700" /> Program & Itinerary
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600">
                            {selectedItem.details.scheduleOrItinerary.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-slate-800 font-bold">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-150 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase font-bold">Total Rate</span>
                        <span className="text-2xl font-bold text-slate-900">
                          {formatPrice(selectedItem.priceKES)}
                          <span className="text-xs font-normal text-slate-500">{selectedItem.priceUnit}</span>
                        </span>
                      </div>

                      {isAdmin ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3.5 text-center space-y-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <ShieldCheck className="h-4 w-4 text-slate-700" />
                            Admin Fleet Monitoring View
                          </span>
                          <p className="text-[11px] text-slate-500">
                            You are viewing this fleet item with Administrator credentials. Booking and reservations are reserved exclusively for travelers.
                          </p>
                        </div>
                      ) : isSelectedVehicle && selectedHireStatus.isOnTrip ? (
                        <button
                          disabled
                          className="w-full font-bold !py-3 text-sm flex items-center justify-center gap-2 rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                        >
                          <Lock className="h-5 w-5 text-slate-500" /> Unavailable (Active On Trip{selectedHireStatus.returnDate ? ` - Returns ${selectedHireStatus.returnDate}` : ''})
                        </button>
                      ) : isSelectedVehicle && selectedHireStatus.isAwaitingHandover ? (
                        <button
                          disabled
                          className="w-full font-bold !py-3 text-sm flex items-center justify-center gap-2 rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                        >
                          <Lock className="h-5 w-5 text-slate-500" /> Currently Reserved (Returns {selectedHireStatus.returnDate || 'Soon'})
                        </button>
                      ) : isSelectedVehicle && !selectedIsLive ? (
                        <button
                          disabled
                          className="w-full font-bold !py-3 text-sm flex items-center justify-center gap-2 rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                        >
                          <Lock className="h-5 w-5 text-slate-400" /> Unavailable for Hire at the Moment
                        </button>
                      ) : !user ? (
                        <div className="space-y-2">
                          <div className="rounded-xl border border-slate-300 bg-slate-100 p-2.5 text-xs text-slate-900 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-slate-700 shrink-0" />
                            <span>Sign in or create an account to complete reservation</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const returnUrl = `/catalogue?category=${selectedItem.category}`;
                              navigate(`/login?redirect=${encodeURIComponent(returnUrl)}&reason=booking`, {
                                state: {
                                  message: `Please sign in or create an account to reserve ${selectedItem.title}.`,
                                  redirect: returnUrl,
                                },
                              });
                            }}
                            className="btn-primary w-full font-bold !py-3 shadow-md text-sm flex items-center justify-center gap-2"
                          >
                            <Lock className="h-5 w-5" /> Sign In / Create Account to Reserve
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (isSelectedVehicle) {
                              setSelectedItem(null);
                              navigate(`/vehicles/${selectedItem.id}`);
                            } else {
                              setShowMpesaModal(true);
                            }
                          }}
                          className="btn-primary w-full font-bold !py-3 shadow-md text-sm flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="h-5 w-5" /> {isSelectedVehicle ? 'Select Travel Dates & Driver Options' : 'Confirm Reservation'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* MPESA PAYMENT STK MODAL */}
      {showMpesaModal && selectedItem && (
        <MpesaStkPushModal
          onClose={() => {
            setShowMpesaModal(false);
            setSelectedItem(null);
          }}
          amount={selectedItem.priceKES}
          bookingRef={`MT-${selectedItem.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`}
          vehicleName={selectedItem.title}
          touristPhone={user?.phone || '0712345678'}
          onSuccess={(receipt) => {
            const bookingRef = `MT-${selectedItem.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

            // 1. Centralized Stored Booking (Saves locally & syncs to Supabase in background)
            const newBooking = saveBooking({
              bookingRef,
              bookingType: selectedItem.category === 'vehicles' ? 'VEHICLE' : 'VEHICLE',
              vehicleId: selectedItem.id,
              vehicleMake: selectedItem.title,
              vehicleModel: selectedItem.badge,
              vehicleName: selectedItem.title,
              vehicleImage: selectedItem.imageUrl,
              ownerId: selectedItem.ownerId || 'a0000000-0000-0000-0000-000000000002',
              driverName: 'Verified Guide / Driver',
              touristId: user?.id || 'guest-tourist',
              touristEmail: user?.email,
              touristName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Jane Wanjiru',
              touristPhone: user?.phone || '0712345678',
              startDate,
              endDate,
              totalAmount: selectedItem.priceKES,
              paymentStatus: 'PAID',
              mpesaReceipt: receipt || `QK${Math.floor(100000 + Math.random() * 900000)}`,
              status: 'CONFIRMED',
            });

            // Dispatch luxury confirmation email
            sendTravelerBookingEmail({
              booking: newBooking,
              isDestination: false,
            }).catch(() => {});

            // 2. Send system notifications (strictly isolated to respective recipients)
            if (selectedItem.ownerId) {
              sendNotification({
                recipientId: selectedItem.ownerId,
                role: 'VEHICLE_OWNER',
                type: 'NEW_BOOKING_HOST',
                title: `New Booking: ${selectedItem.title}`,
                message: `A tourist has booked your vehicle for KES ${selectedItem.priceKES.toLocaleString()}. Your 75% host share (KES ${(selectedItem.priceKES * 0.75).toLocaleString()}) is placed in escrow awaiting Admin handover verification. Ref: ${bookingRef}`,
                link: '/dashboard/owner?tab=bookings',
              });
            }

            sendNotification({
              role: 'ADMIN',
              type: 'NEW_BOOKING_ADMIN',
              title: `New Vehicle Booking: ${selectedItem.title}`,
              message: `Payment of KES ${selectedItem.priceKES.toLocaleString()} confirmed via M-Pesa. 25% platform fee (KES ${(selectedItem.priceKES * 0.25).toLocaleString()}) placed in escrow awaiting handover. Ref: ${bookingRef}`,
              link: '/dashboard/admin',
            });

            if (user?.id) {
              sendNotification({
                recipientId: user.id,
                role: 'TOURIST',
                type: 'BOOKING_CONFIRMED_TOURIST',
                title: `Booking Confirmed: ${selectedItem.title}`,
                message: `Your booking ${bookingRef} has been confirmed. Total paid: KES ${selectedItem.priceKES.toLocaleString()}`,
                link: '/dashboard/bookings',
              });
            }

            try {
              window.dispatchEvent(new CustomEvent('mt_wallet_updated'));
            } catch {}

            sendNotification({
              role: 'ADMIN',
              type: 'BOOKING_CREATED_ADMIN',
              title: `System Alert: Booking ${bookingRef} Confirmed`,
              message: `New confirmed booking for ${selectedItem.title} (${selectedItem.category.toUpperCase()}) - KES ${selectedItem.priceKES.toLocaleString()} via M-Pesa.`,
              link: '/dashboard/admin',
            });

            // 3. Immediately close modal & redirect traveler to My Bookings
            setShowMpesaModal(false);
            setSelectedItem(null);
            navigate('/dashboard/bookings');
          }}
        />
      )}
      </div>
    </div>
  );
}
