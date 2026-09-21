import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Bus, Palmtree, MapPin, ArrowRight, Search, Sparkles,
  CheckCircle, Calendar, ShieldCheck, X, Ticket, Star, Power, Lock, AlertTriangle, Navigation
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { MpesaStkPushModal } from '@/components/ui/MpesaStkPushModal';
import {
  saveBooking, getStoredVehicles, syncVehiclesFromSupabase, getVehicleHireStatus, toggleVehicleLiveStatus, isVehicleLive,
  type StoredVehicle
} from '@/lib/bookingStore';
import { supabase } from '@/lib/supabaseClient';
import { sendNotification } from '@/lib/notificationService';
import { sendTravelerBookingEmail } from '@/lib/communicationService';
import { VehicleStatusBadge } from '@/components/ui/LuxuryVehicleBadges';

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

const CATALOGUE_ITEMS: CatalogueItem[] = [
  // BUS RESERVATIONS ONLY (Tours & Holiday Homes moved to dedicated Holidays & Tours page)
  {
    id: 'b-1',
    category: 'buses',
    title: 'Scania Marco Polo VIP Coach',
    subtitle: 'Nairobi ⇄ Mombasa Highway Express (Reclining Leather Seats & Onboard WiFi)',
    badge: 'Luxury Highway Coach',
    priceKES: 2500,
    priceUnit: '/ seat',
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi CBD → Mombasa Stage',
    specs: ['49 Seats', 'AC & Outlets', 'Onboard Toilet', 'Live Tracking'],
    rating: 4.8,
    reviews: 210,
    details: {
      overview: 'Daily express luxury coach service between Nairobi and Mombasa. Non-stop highway service with onboard restroom, high-speed 5G WiFi, and USB ports.',
      highlights: ['Daily Departures at 07:00 AM & 10:30 PM', 'Reclining leather seats with leg rests', 'Onboard restroom & air conditioning', 'Instant SMS & QR E-Ticket'],
      scheduleOrItinerary: [
        '06:30 AM — Boarding at Nairobi CBD Stage',
        '07:00 AM — Departure via Mombasa Highway',
        '11:30 AM — Midpoint Refreshment Break (Mtito Andei)',
        '02:30 PM — Arrival at Mombasa Mwembe Tayari Stage',
      ],
    },
  },
  {
    id: 'b-2',
    category: 'buses',
    title: 'Executive Intercity Express Shuttle',
    subtitle: 'Nairobi ⇄ Nakuru / Kisumu VIP Express Van with dedicated luggage bay',
    badge: 'Intercity Express',
    priceKES: 1800,
    priceUnit: '/ seat',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi → Kisumu Express',
    specs: ['14 Seats', 'Free WiFi', 'Leather Recliners', 'Express Route'],
    rating: 4.75,
    reviews: 145,
    details: {
      overview: 'VIP intercity shuttle operating hourly departures between Nairobi, Nakuru, and Kisumu. Guaranteed seat reservation with no midway stops.',
      highlights: ['Hourly Departures from 06:00 AM to 06:00 PM', 'Maximum 14 passengers for speedy transit', 'Dedicated luggage compartment', 'Real-time route & schedule monitoring'],
      scheduleOrItinerary: [
        'Departure — Every hour on the hour',
        'Nairobi CBD → Nakuru (2 Hours Transit)',
        'Nakuru → Kisumu (3 Hours Transit)',
      ],
    },
  },
];

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const { formatPrice } = useCurrency();

  const categoryParam = searchParams.get('category');
  const [activeTab, setActiveTab] = useState<TabType>(
    categoryParam === 'buses' ? 'buses' : 'vehicles'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [storedVehicles, setStoredVehicles] = useState<StoredVehicle[]>(() => getStoredVehicles());
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [liveTick, setLiveTick] = useState(0);

  const refreshVehicles = () => {
    setStoredVehicles(getStoredVehicles());
    setLiveTick((t) => t + 1);
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
  const [selectedSeat, setSelectedSeat] = useState<number | null>(12);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat === 'tours' || cat === 'homes') {
      navigate(`/holidays-and-tours?tab=${cat === 'homes' ? 'homes' : 'tours'}`, { replace: true });
      return;
    }
    if (cat === 'buses' || cat === 'vehicles') {
      setActiveTab(cat);
      if (cat === 'vehicles') {
        syncVehiclesFromSupabase().then(() => refreshVehicles()).catch(() => {});
      }
    }
  }, [searchParams, navigate]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ category: tab });
    if (tab === 'vehicles') {
      syncVehiclesFromSupabase().then(() => refreshVehicles()).catch(() => {});
    }
  };

  const TABS: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'vehicles', label: 'Live Vehicle Hire', icon: Car, desc: 'Live Approved 4x4 Cruisers, SUVs & Executive Cars' },
    { id: 'buses',    label: 'Bus Reservations',  icon: Bus, desc: 'VIP Highway Coaches & Intercity Shuttles' },
  ];

  // Dynamic approved vehicles strictly from registered hosts that are currently LIVE
  const approvedHostVehicles: CatalogueItem[] = storedVehicles
    .filter((v) => v.status === 'APPROVED' && isVehicleLive(v.id))
    .map((v) => ({
      id: v.id,
      category: 'vehicles' as TabType,
      title: `${v.make} ${v.model}`,
      subtitle: `${v.year} • ${v.seats} Seats • ${v.fuelType} • ${v.transmission}`,
      badge: `${v.type} Vehicle`,
      priceKES: v.pricePerDay,
      priceUnit: '/ day',
      imageUrl: v.images[0] || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
      location: v.address || 'Nairobi & National Parks',
      specs: [`${v.seats} Seats`, v.fuelType, v.transmission, v.hasInsurance ? 'Verified & Insured' : 'Standard Insurance'],
      rating: v.ratingAverage || 4.9,
      reviews: v.ratingCount || 12,
      ownerId: v.ownerId,
      ownerName: v.ownerName,
      isLive: isVehicleLive(v.id),
      details: {
        overview: `${v.year} ${v.make} ${v.model} registered by host ${v.ownerName}. Inspected and approved by M-TRAVEL Fleet Administration for tourist hire.`,
        highlights: [
          'Certified roadworthiness & professional inspection',
          '24/7 M-TRAVEL Roadside Assistance',
          v.hasInsurance ? 'Comprehensive insurance included' : 'Standard third-party cover',
          `Pickup / Delivery: ${v.address || 'Nairobi Central Hub'}`,
        ],
      },
    }));

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
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
      {/* HEADER HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-8 md:p-12 shadow-card">
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> M-TRAVEL Verified Marketplace
          </span>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 shadow-sm">
              {activeTab === 'vehicles' && <Car className="h-6 w-6 stroke-[2]" />}
              {activeTab === 'buses' && <Bus className="h-6 w-6 stroke-[2]" />}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              {activeTab === 'buses' && 'Bus Reservations & Coach Routes'}
              {activeTab === 'vehicles' && 'Live Fleet Vehicles & Safari Hire'}
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            {activeTab === 'buses' && 'Book luxury highway coaches & intercity express shuttles with seat selection, onboard WiFi, and instant QR tickets.'}
            {activeTab === 'vehicles' && 'Explore live certified 4x4 safari cruisers, executive SUVs, and passenger vehicles registered by approved fleet hosts.'}
          </p>

          {/* HOLIDAYS AND TOURS PROMPT BANNER */}
          <div className="pt-2">
            <div className="rounded-2xl bg-white/80 border border-amber-300/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Palmtree className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="text-xs text-slate-700 font-medium">
                  Looking for Guided Safaris, Mara Packages, or Holiday Homes?
                </span>
              </div>
              <Link
                to="/holidays-and-tours"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
              >
                <span>Visit Holidays and Tours</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-amber-600" />
              <input
                type="text"
                placeholder={`Search ${TABS.find(t => t.id === activeTab)?.label} by name, location...`}
                className="input-field pl-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs md:text-sm focus:border-amber-500 shadow-sm"
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
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-sm'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <span className="block font-bold text-sm leading-none">{tab.label}</span>
                <span className="text-[10px] font-medium opacity-80 mt-0.5 block">{tab.desc}</span>
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
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${searchTerm}-${liveTick}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-2 items-stretch"
        >
          {filteredItems.length === 0 ? (
            activeTab === 'vehicles' ? (
              <div className="col-span-full rounded-3xl bg-white border border-slate-200/90 p-12 md:p-16 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                  <Car className="h-8 w-8 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-serif text-2xl font-bold text-slate-900">
                    No vehicles available at the moment
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                    {searchTerm
                      ? `No approved vehicles match "${searchTerm}". Try searching for another keyword or location.`
                      : 'There are currently no approved fleet vehicles listed for hire. Check back soon or register as a fleet host to list your vehicle.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="btn-secondary !py-2 !px-4 text-xs font-bold border-slate-200 text-slate-700"
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
              <div className="col-span-full text-center py-12 text-slate-400 font-mono">
                No listings found matching "{searchTerm}" under {TABS.find(t => t.id === activeTab)?.label}.
              </div>
            )
          ) : (
            filteredItems.map((item) => {
              const isVehicle = item.category === 'vehicles';
              const hireStatus = isVehicle ? getVehicleHireStatus(item.id) : { isHired: false };
              const isLive = isVehicle ? isVehicleLive(item.id) : true;
              const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

              return (
                <div
                  key={item.id}
                  className="card-luxe overflow-hidden rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 group flex flex-col sm:flex-row hover:-translate-y-1 h-full"
                >
                  {/* IMAGE */}
                  <div className="relative h-60 sm:h-auto sm:w-1/2 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur-md border border-amber-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 shadow-sm">
                      {item.badge}
                    </span>

                    {/* OPERATIONAL STATUS BADGE */}
                    {isVehicle && (
                      <div className="absolute top-3 right-3">
                        <VehicleStatusBadge
                          isHired={hireStatus.isHired}
                          isLive={isLive}
                          variant="overlay"
                          labelOverride={hireStatus.isHired ? 'In Use (Hired)' : undefined}
                        />
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-teal-700 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-teal-600" /> {item.location}
                        </span>
                        <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {item.rating} <span className="text-slate-400 font-normal">({item.reviews})</span>
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        {item.subtitle}
                      </p>

                      {/* ADMIN LIVE FLEET OVERRIDE BAR */}
                      {isAdmin && isVehicle && (
                        <div className="mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-purple-700 shrink-0" />
                            <div>
                              <span className="font-bold text-purple-900 block text-[11px]">Admin Fleet Controls</span>
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

                      {/* UNAVAILABILITY & HIRED NOTICES FOR TRAVELERS */}
                      {isVehicle && hireStatus.isHired && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-950 text-[11px] font-medium flex items-start gap-2 shadow-xs">
                          <div className="p-1 rounded-lg bg-amber-500/15 text-amber-800 shrink-0 mt-0.5">
                            <Navigation className="h-3.5 w-3.5 -rotate-45" />
                          </div>
                          <div className="leading-snug">
                            <span className="font-bold block text-amber-900">Active Passenger Journey</span>
                            Currently on an active trip with a traveler until {hireStatus.returnDate || 'return'}. Cannot be hired until returned.
                          </div>
                        </div>
                      )}

                      {isVehicle && !hireStatus.isHired && !isLive && (
                        <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-medium flex items-start gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Temporarily offline:</strong> This car is not available for hire at the moment upon host/admin request.
                          </span>
                        </div>
                      )}

                      {/* SPECS */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.specs.map((spec) => (
                          <span
                            key={spec}
                            className="rounded-lg bg-slate-100 border border-slate-200/60 px-2.5 py-1 text-[10px] font-medium text-slate-700"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Rate</span>
                        <span className="text-xl font-bold text-slate-900">
                          {formatPrice(item.priceKES)}
                          <span className="text-xs font-normal text-slate-500">{item.priceUnit}</span>
                        </span>
                      </div>

                      {isVehicle && hireStatus.isHired ? (
                        <button
                          disabled
                          className="rounded-xl bg-slate-100 border border-slate-200 text-slate-400 !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold cursor-not-allowed shadow-none"
                          title={`This vehicle is hired until ${hireStatus.returnDate || 'return'}`}
                        >
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                          Currently In Use
                        </button>
                      ) : isVehicle && !isLive ? (
                        <button
                          disabled
                          className="rounded-xl bg-slate-100 border border-slate-200 text-slate-400 !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold cursor-not-allowed shadow-none"
                          title="Vehicle is temporarily paused from hire"
                        >
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                          Unavailable
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="btn-primary !px-5 !py-2 text-xs flex items-center gap-1.5 font-bold shadow-sm"
                        >
                          {activeTab === 'buses' ? 'Reserve Bus Seat' : 'Book Vehicle'}
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
            className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 text-lg h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold px-3 py-1 uppercase shadow-sm">
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
                const isSelectedVehicle = selectedItem.category === 'vehicles';
                const selectedHireStatus = isSelectedVehicle ? getVehicleHireStatus(selectedItem.id) : { isHired: false };
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
                      {isSelectedVehicle && selectedHireStatus.isHired && (
                        <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            Vehicle Currently In Use / Hired
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            This vehicle is currently on an active trip with another traveler until <strong>{selectedHireStatus.returnDate || 'return'}</strong>. It is locked for booking until safely inspected and returned.
                          </p>
                        </div>
                      )}

                      {isSelectedVehicle && !selectedHireStatus.isHired && !selectedIsLive && (
                        <div className="mt-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 space-y-1">
                          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            Vehicle Temporarily Offline
                          </div>
                          <p className="text-xs text-rose-800 leading-relaxed font-medium">
                            This vehicle is temporarily paused from hire upon host/admin request. Please check back later or explore other available vehicles in the fleet.
                          </p>
                        </div>
                      )}

                      {/* BUS SEAT PICKER */}
                      {selectedItem.category === 'buses' && (
                        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-teal-800">
                            <span className="flex items-center gap-1"><Ticket className="h-4 w-4" /> Select Coach Seat</span>
                            <span className="font-mono">Seat #{selectedSeat}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 pt-1">
                            {Array.from({ length: 15 }, (_, i) => i + 1).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSelectedSeat(s)}
                                className={`rounded-lg py-1.5 text-[11px] font-mono font-bold transition ${selectedSeat === s ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-500'}`}
                              >
                                #{s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SAFARI ITINERARY */}
                      {selectedItem.details.scheduleOrItinerary && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                          <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1 uppercase">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" /> Program & Itinerary
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600">
                            {selectedItem.details.scheduleOrItinerary.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">•</span>
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

                      {isSelectedVehicle && selectedHireStatus.isHired ? (
                        <button
                          disabled
                          className="w-full font-bold !py-3 text-sm flex items-center justify-center gap-2 rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                        >
                          <Lock className="h-5 w-5 text-slate-400" /> Currently In Use (Returns {selectedHireStatus.returnDate})
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
                          <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-amber-700 shrink-0" />
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
                            setShowMpesaModal(true);
                          }}
                          className="btn-primary w-full font-bold !py-3 shadow-md text-sm flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="h-5 w-5" /> Confirm Reservation
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
          onSuccess={async (receipt) => {
            const bookingRef = `MT-${selectedItem.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

            // 1. Centralized Stored Booking (Real-time across all dashboards)
            const newBooking = saveBooking({
              bookingRef,
              bookingType: selectedItem.category === 'vehicles' ? 'VEHICLE' : 'VEHICLE',
              vehicleId: selectedItem.id,
              vehicleMake: selectedItem.title,
              vehicleModel: selectedItem.badge,
              vehicleName: selectedItem.title,
              vehicleImage: selectedItem.imageUrl,
              ownerId: selectedItem.ownerId || 'owner-safari-1',
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

            // 2. Persist in Supabase Postgres Database
            try {
              await supabase.from('bookings').insert({
                booking_ref: bookingRef,
                user_id: user?.id || 'a0000000-0000-0000-0000-000000000003',
                bookable_type: selectedItem.category === 'vehicles' ? 'VEHICLE' : 'BUS_SEAT',
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
                total_amount: selectedItem.priceKES,
                currency: 'KES',
                status: 'CONFIRMED',
              });
            } catch (e) {
              console.warn('Supabase DB booking sync error:', e);
            }

            // 3. Send system notifications (strictly isolated to respective recipients)
            if (selectedItem.ownerId) {
              sendNotification({
                recipientId: selectedItem.ownerId,
                role: 'VEHICLE_OWNER',
                type: 'NEW_BOOKING_HOST',
                title: `New Booking: ${selectedItem.title}`,
                message: `A tourist has booked your vehicle for KES ${selectedItem.priceKES.toLocaleString()}. Booking Ref: ${bookingRef}`,
                link: '/dashboard/owner?tab=bookings',
              });
            }

            if (user?.id) {
              sendNotification({
                recipientId: user.id,
                role: 'TOURIST',
                type: 'BOOKING_CONFIRMED_TOURIST',
                title: `Booking Confirmed: ${selectedItem.title}`,
                message: `Your booking ${bookingRef} has been confirmed. Total paid: KES ${selectedItem.priceKES.toLocaleString()}`,
                link: '/dashboard/tourist',
              });
            }

            sendNotification({
              role: 'ADMIN',
              type: 'BOOKING_CREATED_ADMIN',
              title: `System Alert: Booking ${bookingRef} Confirmed`,
              message: `New confirmed booking for ${selectedItem.title} (${selectedItem.category.toUpperCase()}) - KES ${selectedItem.priceKES.toLocaleString()} via M-Pesa.`,
              link: '/dashboard/admin',
            });

            setShowMpesaModal(false);
            setSelectedItem(null);
            navigate('/dashboard/tourist');
          }}
        />
      )}
    </div>
  );
}
