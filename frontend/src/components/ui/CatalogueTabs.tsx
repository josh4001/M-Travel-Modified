import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bus, Palmtree, Home, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';

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
}

const CATALOGUE_ITEMS: CatalogueItem[] = [
  // VEHICLES
  {
    id: 'v-1',
    category: 'vehicles',
    title: 'Toyota Land Cruiser Prado V8',
    subtitle: 'Full 4x4 Capability, Pop-up Safari Roof, Chauffeur Included',
    badge: '4x4 Safari SUV',
    priceKES: 14000,
    priceUnit: '/ day',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi & National Parks',
    specs: ['7 Seats', 'Diesel 4.5L', 'Automatic', 'Pop-Up Roof'],
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
  },

  // BUS RESERVATIONS
  {
    id: 'b-1',
    category: 'buses',
    title: 'Scania Marco Polo VIP Coach',
    subtitle: 'Nairobi ⇄ Mombasa Highway Express (Reclining Leather Seats & WiFi)',
    badge: 'Luxury Coach',
    priceKES: 2500,
    priceUnit: '/ seat',
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi CBD → Mombasa Stage',
    specs: ['49 Seats', 'AC & Power Outlets', 'Onboard Toilet', 'Live Tracking'],
  },
  {
    id: 'b-2',
    category: 'buses',
    title: 'Executive Intercity Shuttle',
    subtitle: 'Nairobi ⇄ Nakuru / Kisumu VIP Express Van with luggage bay',
    badge: 'Express Bus',
    priceKES: 1800,
    priceUnit: '/ seat',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    location: 'Nairobi → Kisumu Express',
    specs: ['14 Luxury Seats', 'Free WiFi', 'Leather Recliners', 'Express Route'],
  },

  // TOURS & TRAVEL
  {
    id: 't-1',
    category: 'tours',
    title: '3-Day Maasai Mara Great Migration Package',
    subtitle: 'All-inclusive 4x4 game drives, luxury lodge stay, park fees & full board meals',
    badge: 'Guided Tour',
    priceKES: 45000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    location: 'Maasai Mara National Reserve',
    specs: ['3 Days / 2 Nights', 'Full Board Lodge', 'Expert Guide', 'Park Entry Paid'],
  },
  {
    id: 't-2',
    category: 'tours',
    title: 'Swahili Diani Beach Luxury Getaway',
    subtitle: 'Return flights, beach resort stay, glass-bottom boat tour & seafood dining',
    badge: 'Beach Package',
    priceKES: 38000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    location: 'Diani Beach, South Coast',
    specs: ['4 Days / 3 Nights', '5-Star Resort', 'Airport Transfers', 'Snorkeling'],
  },

  // HOLIDAY HOMES
  {
    id: 'h-1',
    category: 'homes',
    title: 'Mara River View Safari Lodge Villa',
    subtitle: 'Private infinity pool, chef service, and views of wildlife crossing the river',
    badge: 'Luxury Villa',
    priceKES: 32000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    location: 'Mara Triangle Edge',
    specs: ['4 Bedrooms', 'Private Pool', 'Personal Chef', 'High-Speed WiFi'],
  },
  {
    id: 'h-2',
    category: 'homes',
    title: 'Diani Oceanfront Swahili Cottage',
    subtitle: 'Direct beach access, tropical palm garden, and open-air veranda',
    badge: 'Beach Cottage',
    priceKES: 22000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
    location: 'Galu Beach, Diani',
    specs: ['3 Bedrooms', 'Direct Ocean Access', 'Air-Conditioned', 'Housekeeping'],
  },
];

export const CatalogueTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const { formatPrice } = useCurrency();

  const TABS: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'vehicles', label: 'Vehicle Hire',      icon: Car,      desc: 'Safari 4x4 SUVs, Vans & Pickups' },
    { id: 'buses',    label: 'Bus Reservations',  icon: Bus,      desc: 'Luxury Coaches & Intercity Express' },
    { id: 'tours',    label: 'Tours & Travel',    icon: Palmtree, desc: 'Guided Safaris & Beach Resorts' },
    { id: 'homes',    label: 'Holiday Homes',     icon: Home,     desc: 'Villas, Cottages & Stays' },
  ];

  const currentItems = CATALOGUE_ITEMS.filter((item) => item.category === activeTab);

  return (
    <section className="py-10">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
          Catalogue & Services
        </span>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl font-bold text-slate-900">
          Explore Our Specialized Service Catalogues
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Switch tabs to preview dedicated vehicles, luxury bus coaches, safaris, and holiday stays.
        </p>
      </div>

      {/* CATALOGUE TABS BAR */}
      <div className="mx-auto max-w-4xl flex flex-wrap gap-2 justify-center rounded-2xl border border-slate-200/80 bg-white p-2 mb-8 shadow-card">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <span className="block font-bold leading-none">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CATALOGUE CARDS GRID */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 items-stretch"
        >
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="card-luxe overflow-hidden rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 group flex flex-col md:flex-row hover:-translate-y-1 h-full"
            >
              {/* SPECIFIC CATALOGUE IMAGE */}
              <div className="relative h-60 md:h-auto md:w-1/2 overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur-md border border-amber-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 shadow-sm">
                  {item.badge}
                </span>
              </div>

              {/* DETAILS */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <span className="flex items-center gap-1 text-xs text-teal-700 font-semibold mb-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" /> {item.location}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {item.subtitle}
                  </p>

                  {/* SPECS TAGS */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
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

                <div className="mt-6 flex items-center justify-between border-t border-slate-150 pt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Rate</span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatPrice(item.priceKES)}
                      <span className="text-xs font-normal text-slate-500">{item.priceUnit}</span>
                    </span>
                  </div>

                  <Link
                    to={`/catalogue?category=${activeTab}`}
                    className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5 font-bold shadow-sm"
                  >
                    Select Catalogue <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
