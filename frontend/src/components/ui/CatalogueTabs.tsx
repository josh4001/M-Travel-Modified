import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bus, Palmtree, Home, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { getStoredVehicles, isVehicleLive, getVehicleHireStatus, isBusVehicle, type StoredVehicle } from '@/lib/bookingStore';

import { getStoredDestinations, type TravelDestinationItem } from '@/lib/destinationsStore';

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

export const CatalogueTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const { formatPrice } = useCurrency();

  const TABS: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'vehicles', label: 'Vehicle Hire',      icon: Car,      desc: 'Safari 4x4 SUVs, Vans & Pickups' },
    { id: 'buses',    label: 'Bus Reservations',  icon: Bus,      desc: 'Luxury Coaches & Intercity Express' },
    { id: 'tours',    label: 'Tours & Travel',    icon: Palmtree, desc: 'Guided Safaris & Beach Resorts' },
    { id: 'homes',    label: 'Holiday Homes',     icon: Home,     desc: 'Villas, Cottages & Stays' },
  ];

  const [storedVehicles, setStoredVehicles] = useState<StoredVehicle[]>(() => getStoredVehicles());
  const [storedDestinations, setStoredDestinations] = useState<TravelDestinationItem[]>(() => getStoredDestinations());

  useEffect(() => {
    const handleUpdate = () => {
      setStoredVehicles(getStoredVehicles());
      setStoredDestinations(getStoredDestinations());
    };
    window.addEventListener('mt_vehicle_updated', handleUpdate);
    window.addEventListener('mt_vehicle_approved', handleUpdate);
    window.addEventListener('mt_destinations_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('mt_vehicle_updated', handleUpdate);
      window.removeEventListener('mt_vehicle_approved', handleUpdate);
      window.removeEventListener('mt_destinations_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const rawVehicles = storedVehicles && storedVehicles.length > 0 ? storedVehicles : getStoredVehicles();

  const approvedVehicles: CatalogueItem[] = rawVehicles
    .filter((v) => v.status === 'APPROVED' && (isVehicleLive(v.id) || getVehicleHireStatus(v.id).isHired))
    .map((v) => {
      const isBus = isBusVehicle(v);
      return {
        id: v.id,
        category: (isBus ? 'buses' : 'vehicles') as TabType,
        title: `${v.make} ${v.model}`,
        subtitle: `${v.year} • ${v.seats} Seats • ${v.fuelType} • ${v.transmission}`,
        badge: isBus ? 'BUS VEHICLE' : `${v.type} Vehicle`,
        priceKES: v.pricePerDay,
        priceUnit: '/ day',
        imageUrl: (v.images[0] && !v.images[0].includes('prado')) ? v.images[0] : (isBus ? '/vehicles/isuzu-coach-front.jpg' : (v.images[0] || '/vehicles/prado-front.jpg')),
        location: v.address || 'Nairobi & National Parks',
        specs: [`${v.seats} Seats`, v.fuelType, v.transmission, v.hasInsurance ? 'Verified' : 'Standard Insurance'],
      };
    });

  const liveDestinations: CatalogueItem[] = storedDestinations
    .filter((d) => d.isLive)
    .map((d) => ({
      id: d.id,
      category: (d.category === 'HOLIDAY_HOME' ? 'homes' : 'tours') as TabType,
      title: d.title,
      subtitle: d.subtitle,
      badge: d.badge || (d.category === 'HOLIDAY_HOME' ? 'Holiday Home' : 'Guided Tour'),
      priceKES: d.priceKES,
      priceUnit: d.priceUnit || (d.category === 'HOLIDAY_HOME' ? '/ night' : '/ person'),
      imageUrl: d.imageUrl,
      location: d.location || d.region || 'Kenya',
      specs: d.specs || [],
    }));

  const currentItems = activeTab === 'vehicles' || activeTab === 'buses'
    ? approvedVehicles.filter((item) => item.category === activeTab)
    : liveDestinations.filter((item) => item.category === activeTab);

  return (
    <section className="py-10">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-slate-900" />
          <span>Catalogue &amp; Services</span>
        </span>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
          Explore Our Specialized Service Catalogues
        </h2>
        <p className="mt-2 text-sm text-slate-600 font-medium max-w-xl mx-auto">
          Switch tabs to preview dedicated vehicles, luxury bus coaches, safaris, and holiday stays.
        </p>
      </div>

      {/* CATALOGUE TABS BAR - EXECUTIVE BLACK & WHITE THEME */}
      <div className="mx-auto max-w-4xl flex flex-wrap gap-2 justify-center rounded-2xl border border-slate-200 bg-slate-50/90 backdrop-blur-md p-2 mb-8 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-slate-950 text-white shadow-sm border border-slate-950 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
              <div className="text-left">
                <span className="block font-bold leading-none">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CATALOGUE CARDS GRID */}
      <AnimatePresence initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 items-stretch"
        >
          {currentItems.length === 0 ? (
            <div className="col-span-full rounded-3xl bg-white border border-slate-200 p-10 md:p-14 text-center space-y-4 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mx-auto shadow-2xs">
                {activeTab === 'tours' && <Palmtree className="h-7 w-7 text-slate-900" />}
                {activeTab === 'homes' && <Home className="h-7 w-7 text-slate-900" />}
                {activeTab === 'buses' && <Bus className="h-7 w-7 text-slate-900" />}
                {activeTab === 'vehicles' && <Car className="h-7 w-7 text-slate-900" />}
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {activeTab === 'tours' && 'Tours & Travel Catalogue'}
                  {activeTab === 'homes' && 'Holiday Homes & Stays'}
                  {activeTab === 'buses' && 'Coach & Bus Routes'}
                  {activeTab === 'vehicles' && 'Vehicle Hire Fleet'}
                </span>
                <h3 className="font-serif text-2xl font-extrabold text-slate-950 tracking-tight">
                  {activeTab === 'tours' && 'No tours & travel available at the moment'}
                  {activeTab === 'homes' && 'No holiday homes available at the moment'}
                  {activeTab === 'buses' && 'No buses available at the moment'}
                  {activeTab === 'vehicles' && 'No vehicles available at the moment'}
                </h3>
              </div>

              <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                {activeTab === 'tours' &&
                  'There are currently no tours and travel packages available at the moment since none have been uploaded yet by the admin. Curated safari expeditions and guided tours will appear here once published.'}
                {activeTab === 'homes' &&
                  'There are currently no holiday homes available at the moment since none have been uploaded yet by the admin. Verified luxury villas, coastal cottages, and holiday stays will appear here once published.'}
                {activeTab === 'buses' &&
                  'There are currently no bus coaches registered into the system. Admin and fleet hosts can register buses under the fleet management portal.'}
                {activeTab === 'vehicles' &&
                  'Fleet hosts have not yet listed any approved vehicles for hire. Check back soon or register as a host.'}
              </p>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                {activeTab === 'tours' || activeTab === 'homes' ? (
                  <>
                    <Link
                      to="/catalogue?category=vehicles"
                      className="rounded-xl bg-slate-950 hover:bg-black text-white py-2.5 px-5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition border border-slate-900 cursor-pointer"
                    >
                      <Car className="h-4 w-4" /> Explore Available Vehicles
                    </Link>
                    <Link
                      to="/contact"
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-5 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                      Contact Concierge
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/register"
                    className="rounded-xl bg-slate-950 hover:bg-black text-white py-2.5 px-5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition border border-slate-900 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" /> Register as Fleet Host
                  </Link>
                )}
              </div>
            </div>
          ) : currentItems.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-slate-400 transition-all duration-300 group flex flex-col md:flex-row hover:-translate-y-1 h-full text-slate-900"
            >
              {/* SPECIFIC CATALOGUE IMAGE */}
              <div className="relative h-60 md:h-auto md:w-1/2 overflow-hidden bg-slate-100 shrink-0 border-b md:border-b-0 md:border-r border-slate-200">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-full bg-slate-950 text-white font-mono text-[10px] font-bold px-3 py-1 border border-slate-850 uppercase tracking-wider shadow-sm">
                  {item.badge}
                </span>
              </div>

              {/* DETAILS */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold mb-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-900" /> {item.location}
                  </span>
                  <h3 className="font-serif text-xl font-extrabold text-slate-950 group-hover:text-black transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                    {item.subtitle}
                  </p>

                  {/* SPECS TAGS */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.specs.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono font-bold">Rate</span>
                    <span className="text-xl font-extrabold text-slate-950">
                      {formatPrice(item.priceKES)}
                      <span className="text-xs font-normal text-slate-500 ml-1">{item.priceUnit}</span>
                    </span>
                  </div>

                  <Link
                    to={activeTab === 'tours' || activeTab === 'homes' ? '/holidays-and-tours' : `/catalogue?category=${activeTab}`}
                    className="rounded-xl bg-slate-950 hover:bg-black text-white px-4 py-2.5 text-xs flex items-center gap-1.5 font-bold shadow-sm transition active:scale-[0.99] border border-slate-900 cursor-pointer"
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
