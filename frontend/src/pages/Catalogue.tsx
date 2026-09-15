import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Bus, Palmtree, Home, MapPin, ArrowRight, Search, Sparkles,
  CheckCircle, Calendar, ShieldCheck, X, Ticket, Star, Power, Lock, AlertTriangle
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { MpesaStkPushModal } from '@/components/ui/MpesaStkPushModal';
import {
  saveBooking, getStoredVehicles, getVehicleHireStatus, toggleVehicleLiveStatus,
  type StoredVehicle
} from '@/lib/bookingStore';
import { supabase } from '@/lib/supabaseClient';
import { sendNotification } from '@/lib/notificationService';

type TabType = 'vehicles' | 'buses' | 'tours' | 'homes';

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
  // VEHICLES
  {
    id: 'v-1',
    category: 'vehicles',
    title: 'Toyota Land Cruiser Prado V8 4x4',
    subtitle: 'Full 4WD Capability, Pop-up Safari Roof, Professional Chauffeur Optional',
    badge: '4x4 Safari SUV',
    priceKES: 14000,
    priceUnit: '/ day',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi & National Parks',
    specs: ['7 Seats', 'Diesel 4.5L', 'Automatic', 'Pop-Up Roof'],
    rating: 4.9,
    reviews: 87,
    details: {
      overview: 'Heavy-duty 4x4 safari cruiser engineered for Kenya terrain. Features high clearance, twin tanks, pop-up roof for wildlife photography, and dual air-conditioning.',
      highlights: ['Pop-up safari roof for 360° game viewing', 'Free cooler box with ice', 'Experienced bush driver available', 'UN & Embassy clearance compliant'],
    },
  },
  {
    id: 'v-2',
    category: 'vehicles',
    title: 'Toyota Hiace Custom Safari Van',
    subtitle: 'Heavy-duty suspension, high-clearance 4WD for group game drives',
    badge: 'Safari Van',
    priceKES: 11500,
    priceUnit: '/ day',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    location: 'Westlands / Airport Pickup',
    specs: ['9 Seats', 'Diesel 3.0L', 'Manual 4WD', 'Cooler Box'],
    rating: 4.7,
    reviews: 134,
    details: {
      overview: 'Customized safari van equipped with 9 individual window seats, pop-up roof, long-range HF radio, and charging sockets for camera gear.',
      highlights: ['9 window seats for every traveler', 'Pop-up roof', 'HF radio connected to park rangers', 'Luggage roof rack'],
    },
  },
  {
    id: 'v-3',
    category: 'vehicles',
    title: 'Toyota Alphard Executive Lounge',
    subtitle: 'First-class captain seats, dual sunroof, ambient lighting & VIP privacy glass',
    badge: 'Luxury VIP Van',
    priceKES: 16500,
    priceUnit: '/ day',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi JKIA / Kilimani',
    specs: ['7 Seats', 'Hybrid 2.5L', 'Automatic', 'Leather Recliners'],
    rating: 4.95,
    reviews: 62,
    details: {
      overview: 'The pinnacle of executive road travel. Power Ottoman captain recliners, dual sunroofs, JBL surround audio, and whisper-quiet hybrid drivetrain.',
      highlights: ['Power Ottoman captain seats with massage', 'Dual sunroofs', 'Complimentary onboard refreshments', 'Airport VIP greeting service'],
    },
  },

  // BUS RESERVATIONS
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
      highlights: ['Hourly Departures from 06:00 AM to 06:00 PM', 'Maximum 14 passengers for speedy transit', 'Dedicated luggage compartment', 'GPS real-time route monitoring'],
      scheduleOrItinerary: [
        'Departure — Every hour on the hour',
        'Nairobi CBD → Nakuru (2 Hours Transit)',
        'Nakuru → Kisumu (3 Hours Transit)',
      ],
    },
  },

  // TOURS & TRAVEL
  {
    id: 't-1',
    category: 'tours',
    title: '3-Day Maasai Mara Great Migration Package',
    subtitle: 'All-inclusive 4x4 game drives, luxury safari lodge stay, park entry & meals',
    badge: 'Guided Safari Tour',
    priceKES: 45000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    location: 'Maasai Mara National Reserve',
    specs: ['3 Days / 2 Nights', 'Full Board Lodge', 'Expert Guide', 'Park Entry Included'],
    rating: 4.98,
    reviews: 320,
    details: {
      overview: 'Unforgettable 3-day safari in Africa’s highest-density wildlife haven. Witness the Big Five, Mara River crossings, and cultural Maasai village visits.',
      highlights: ['4x4 Land Cruiser game drives with KPSGA guide', 'Luxury safari tented lodge accommodation', 'All meals (Breakfast, Lunch & Gourmet Dinner)', 'Park entry fees & airport transfers included'],
      scheduleOrItinerary: [
        'Day 1: Departure from Nairobi, Great Rift Valley viewpoint stop, arrive Mara for evening sunset game drive.',
        'Day 2: Full-day Mara game drive with picnic lunch near Mara River crossing.',
        'Day 3: Sunrise game drive, Maasai cultural village visit, return transit to Nairobi.',
      ],
    },
  },
  {
    id: 't-2',
    category: 'tours',
    title: 'Swahili Diani Beach Luxury Getaway',
    subtitle: 'Return flights from Nairobi, beach resort stay, glass-bottom boat & seafood dining',
    badge: 'Beach Resort Package',
    priceKES: 38000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    location: 'Diani Beach, South Coast',
    specs: ['4 Days / 3 Nights', '5-Star Resort', 'Airport Transfers', 'Snorkeling'],
    rating: 4.9,
    reviews: 180,
    details: {
      overview: 'Unwind on the world-famous white sands of Diani Beach. Includes return flight tickets, oceanfront resort suite, private dhow cruise, and seafood dinner.',
      highlights: ['Return flights (Nairobi Wilson ⇄ Ukunda Airport)', 'Oceanfront Deluxe Suite at 5-Star Resort', 'Private glass-bottom boat & reef snorkeling', 'Daily buffet breakfast & seafood dinner'],
      scheduleOrItinerary: [
        'Day 1: Flight Wilson → Ukunda, airport transfer, resort check-in & evening sunset cocktail.',
        'Day 2: Wasini Island dhow safari, dolphin spotting & seafood lunch.',
        'Day 3: Leisure beach day, spa treatment & water sports.',
        'Day 4: Morning beach walk, souvenir shopping & flight back to Nairobi.',
      ],
    },
  },

  // HOLIDAY HOMES
  {
    id: 'h-1',
    category: 'homes',
    title: 'Mara River View Safari Lodge Villa',
    subtitle: 'Private infinity pool, personal chef service, and views of wildlife crossing the river',
    badge: 'Luxury Villa',
    priceKES: 32000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    location: 'Mara Triangle Edge',
    specs: ['4 Bedrooms', 'Private Pool', 'Personal Chef', 'High-Speed WiFi'],
    rating: 4.96,
    reviews: 48,
    details: {
      overview: 'Exclusive 4-bedroom villa perched on a ridge overlooking the Mara River. Comes with private infinity pool, dedicated chef, solar power, and 24/7 security.',
      highlights: ['4 Ensuite Master Bedrooms with king beds', 'Private infinity pool overlooking wildlife waterhole', 'Personal chef & butler service included', 'Solar power & satellite Starlink internet'],
    },
  },
  {
    id: 'h-2',
    category: 'homes',
    title: 'Diani Oceanfront Swahili Cottage',
    subtitle: 'Direct beach access, tropical palm garden, and open-air veranda for sunset dining',
    badge: 'Oceanfront Cottage',
    priceKES: 22000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    location: 'Galu Beach, Diani',
    specs: ['3 Bedrooms', 'Direct Ocean Access', 'Air-Conditioned', 'Housekeeping'],
    rating: 4.88,
    reviews: 76,
    details: {
      overview: 'Charming Swahili-style cottage with direct access to Galu Beach sand. Features open-air thatch roof veranda, lush private garden, and daily housekeeping.',
      highlights: ['3 Air-conditioned bedrooms with mosquito nets', 'Private gate leading straight onto Diani Beach', 'Daily housekeeping & laundry service', 'Outdoor Swahili barbecue pit'],
    },
  },
];

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const { formatPrice } = useCurrency();

  const categoryParam = (searchParams.get('category') as TabType) || 'vehicles';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['vehicles', 'buses', 'tours', 'homes'].includes(categoryParam) ? categoryParam : 'vehicles'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [storedVehicles, setStoredVehicles] = useState<StoredVehicle[]>([]);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const refreshVehicles = () => {
    setStoredVehicles(getStoredVehicles());
  };

  useEffect(() => {
    refreshVehicles();

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
    const cat = searchParams.get('category') as TabType;
    if (cat && ['vehicles', 'buses', 'tours', 'homes'].includes(cat)) {
      setActiveTab(cat);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ category: tab });
  };

  const TABS: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'vehicles', label: 'Vehicle Hire',     icon: Car,      desc: 'Safari 4x4 SUVs, Vans & Pickups' },
    { id: 'buses',    label: 'Bus Reservations', icon: Bus,      desc: 'Highway Coaches & Express Shuttles' },
    { id: 'tours',    label: 'Tours & Travel',   icon: Palmtree, desc: 'Maasai Mara Safaris & Beach Resorts' },
    { id: 'homes',    label: 'Holiday Homes',    icon: Home,     desc: 'Private Villas & Oceanfront Cottages' },
  ];

  // Dynamic approved vehicles from registered hosts
  const approvedHostVehicles: CatalogueItem[] = storedVehicles
    .filter((v) => v.status === 'APPROVED')
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
      isLive: v.isLive !== false,
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

  const allCatalogueItems: CatalogueItem[] = [
    ...approvedHostVehicles,
    ...CATALOGUE_ITEMS.filter((ci) => !approvedHostVehicles.some((hv) => hv.id === ci.id)),
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
              {activeTab === 'tours' && <Palmtree className="h-6 w-6 stroke-[2]" />}
              {activeTab === 'homes' && <Home className="h-6 w-6 stroke-[2]" />}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              {activeTab === 'buses' && 'Bus Reservations & Coach Routes'}
              {activeTab === 'tours' && 'Guided Safaris & Holiday Packages'}
              {activeTab === 'homes' && 'Private Safari Villas & Beach Cottages'}
              {activeTab === 'vehicles' && 'Safari 4x4 SUVs & Luxury Vehicle Hire'}
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            {activeTab === 'buses' && 'Book luxury highway coaches & intercity express shuttles with seat selection, onboard WiFi, and instant QR tickets.'}
            {activeTab === 'tours' && 'Explore all-inclusive Maasai Mara safari packages, Swahili Diani beach getaways, and mountain expeditions.'}
            {activeTab === 'homes' && 'Rent private holiday villas, Mara river lodges, and coastal cottages with personal chefs and private pools.'}
            {activeTab === 'vehicles' && 'Rent executive 4x4 Land Cruisers, safari vans, and luxury Alphard vans for self-drive or with professional drivers.'}
          </p>

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
      <div className="flex flex-wrap gap-3 justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-card">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-[170px] flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
          key={activeTab + searchTerm}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-2 items-stretch"
        >
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 font-mono">
              No listings found matching "{searchTerm}" under {TABS.find(t => t.id === activeTab)?.label}.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isVehicle = item.category === 'vehicles';
              const hireStatus = isVehicle ? getVehicleHireStatus(item.id) : { isHired: false };
              const isLive = isVehicle ? item.isLive !== false : true;
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
                      hireStatus.isHired ? (
                        <span className="absolute top-3 right-3 rounded-full bg-amber-500 text-slate-950 px-2.5 py-1 text-[10px] font-bold shadow-md animate-pulse">
                          🚗 In Use (Hired)
                        </span>
                      ) : !isLive ? (
                        <span className="absolute top-3 right-3 rounded-full bg-rose-600 text-white px-2.5 py-1 text-[10px] font-bold shadow-md">
                          ⏸️ Unavailable
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-bold shadow-md">
                          🟢 Live & Ready
                        </span>
                      )
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
                              <span className="text-[10px] text-purple-700 font-medium">
                                Status: <strong className="font-bold">{isLive ? '🟢 Live on Marketplace' : '⏸️ Offline (Paused)'}</strong>
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVehicleLiveStatus(item.id);
                              refreshVehicles();
                              setAdminNotice(`Admin toggled ${item.title} to ${!isLive ? 'LIVE' : 'OFFLINE'}.`);
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
                        <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-start gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Currently in use:</strong> On an active trip with a traveler until {hireStatus.returnDate || 'return'}. Cannot be hired until returned.
                          </span>
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
                          {activeTab === 'buses' && 'Reserve Bus Seat'}
                          {activeTab === 'tours' && 'Book Safari Tour'}
                          {activeTab === 'homes' && 'Reserve Villa'}
                          {activeTab === 'vehicles' && 'Book Vehicle'}
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
                const selectedIsLive = isSelectedVehicle ? selectedItem.isLive !== false : true;
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
                            <span className="text-[10px] text-purple-700 font-medium">
                              Live Status: <strong className="font-bold">{selectedIsLive ? '🟢 Live on Marketplace' : '⏸️ Offline (Paused)'}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              toggleVehicleLiveStatus(selectedItem.id);
                              refreshVehicles();
                              setSelectedItem((prev) => (prev ? { ...prev, isLive: !selectedIsLive } : null));
                              setAdminNotice(`Admin toggled ${selectedItem.title} to ${!selectedIsLive ? 'LIVE' : 'OFFLINE'}.`);
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
                      ) : (
                        <button
                          onClick={() => {
                            setShowMpesaModal(true);
                          }}
                          className="btn-primary w-full font-bold !py-3 shadow-md text-sm flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="h-5 w-5" /> Reserve via M-PESA
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
            saveBooking({
              bookingRef,
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

            // 2. Persist in Supabase Postgres Database
            try {
              await supabase.from('bookings').insert({
                booking_ref: bookingRef,
                user_id: user?.id || 'a0000000-0000-0000-0000-000000000003',
                bookable_type: selectedItem.category === 'vehicles' ? 'VEHICLE' : selectedItem.category === 'buses' ? 'BUS_SEAT' : selectedItem.category === 'tours' ? 'TOUR' : 'HOLIDAY_HOME',
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
