import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Users, Fuel, Gauge, SlidersHorizontal, LayoutGrid, Box, Sparkles,
  MapPin, Search as SearchIcon, Car, Wifi, Bus, Truck, Compass,
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { Card3D } from '@/components/ui/Card3D';
import { MOCK_VEHICLES } from '@/data/mockVehicles';
import { useCurrency } from '@/context/CurrencyContext';
import { fetchVehicles } from '@/lib/supabaseClient';
import { getStoredVehicles, syncVehiclesFromSupabase } from '@/lib/bookingStore';

const TYPES = ['CAR', 'SUV', 'VAN', 'PICKUP'];

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CAR: Car,
  SUV: Compass,
  VAN: Bus,
  PICKUP: Truck,
};

const TYPE_LABELS: Record<string, string> = {
  CAR: 'Executive Car',
  SUV: '4×4 Safari SUV',
  VAN: 'Safari Van',
  PICKUP: 'Pickup Truck',
};

export default function Search() {
  const { formatPrice } = useCurrency();
  const [type, setType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'card3d'>('card3d');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadVehicles = async () => {
      try {
        // Sync latest vehicles from Supabase in background
        await syncVehiclesFromSupabase().catch(() => {});

        // 1. Fetch from Supabase
        const sbVehicles = await fetchVehicles({
          type: type || undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });

        // 2. Read stored vehicles (synced from host registrations)
        const stored = getStoredVehicles()
          .filter((v) => v.status === 'APPROVED' && v.isLive !== false)
          .map(
            (v) =>
              ({
                id: v.id,
                type: v.type,
                make: v.make,
                model: v.model,
                year: v.year,
                seats: v.seats,
                fuelType: v.fuelType,
                transmission: v.transmission,
                pricePerDay: String(v.pricePerDay),
                hasInsurance: v.hasInsurance,
                latitude: v.latitude ?? -1.2921,
                longitude: v.longitude ?? 36.8219,
                address: v.address,
                ratingAverage: v.ratingAverage,
                ratingCount: v.ratingCount,
                images: (v.images || []).map((url, i) => ({ id: `img-${i}`, url, isPrimary: i === 0 })),
                owner: {
                  id: v.ownerId,
                  firstName: v.ownerName.split(' ')[0] || 'Fleet',
                  lastName: v.ownerName.split(' ').slice(1).join(' ') || 'Host',
                  email: v.ownerEmail,
                },
                plateNumber: v.plateNumber,
              } as Vehicle)
          );

        // Merge Supabase vehicles with stored vehicles (Supabase takes precedence by ID)
        const map = new Map<string, Vehicle>();
        for (const v of stored) {
          map.set(v.id, v);
        }
        for (const v of sbVehicles) {
          map.set(v.id, v);
        }

        // Add mock vehicles if not already in map
        for (const mv of MOCK_VEHICLES) {
          if (!map.has(mv.id)) {
            map.set(mv.id, mv);
          }
        }

        let combined = Array.from(map.values());

        // Apply filters
        if (type) {
          combined = combined.filter((v) => v.type?.toUpperCase() === type.toUpperCase());
        }
        if (maxPrice) {
          combined = combined.filter((v) => Number(v.pricePerDay) <= Number(maxPrice));
        }

        if (isMounted) {
          setVehicles(combined);
        }
      } catch (err) {
        console.warn('Error loading search vehicles:', err);
        let filtered = MOCK_VEHICLES;
        if (type) filtered = filtered.filter((v) => v.type === type);
        if (maxPrice) filtered = filtered.filter((v) => Number(v.pricePerDay) <= Number(maxPrice));
        if (isMounted) setVehicles(filtered);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadVehicles();

    const handleUpdate = () => {
      loadVehicles();
    };
    window.addEventListener('mt_vehicle_updated', handleUpdate);
    window.addEventListener('mt_vehicle_approved', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('mt_vehicle_updated', handleUpdate);
      window.removeEventListener('mt_vehicle_approved', handleUpdate);
    };
  }, [type, maxPrice]);

  // Client-side search and location filter
  const displayed = location
    ? vehicles.filter(
        (v) =>
          v.address?.toLowerCase().includes(location.toLowerCase()) ||
          v.owner?.firstName?.toLowerCase().includes(location.toLowerCase()) ||
          v.owner?.lastName?.toLowerCase().includes(location.toLowerCase()) ||
          `${v.make} ${v.model}`.toLowerCase().includes(location.toLowerCase())
      )
    : vehicles;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 font-display">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 px-5 py-3 text-sm text-teal">
        <Wifi className="h-4 w-4 shrink-0" />
        <span><strong>Live Vehicles</strong> — Real-time verified vehicles from M-TRAVEL Platform</span>
      </div>

      {/* HEADER & FILTERS */}
      <div className="card-luxe bg-white border border-slate-200/90 p-6 md:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 font-display">
              <SlidersHorizontal className="h-3.5 w-3.5" /> M-TRAVEL Vehicles
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl text-slate-900">Find Your Perfect Ride</h1>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setViewMode('card3d')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'card3d' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Box className="h-3.5 w-3.5" /> Card View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
          </div>
        </div>

        {/* FILTERS ROW */}
        <div className="mt-6 flex flex-wrap items-end gap-4">
          {/* LOCATION SEARCH */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Location / Area</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-600" />
              <input
                type="text"
                placeholder="e.g. Westlands, Karen, CBD…"
                className="input-field pl-10 text-slate-900 placeholder:text-slate-400 border-slate-300"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* VEHICLE TYPE */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Vehicle Type</label>
            <div className="relative">
              <Car className="absolute left-3.5 top-3.5 h-4 w-4 text-teal-600" />
              <select className="input-field pl-10 text-slate-900 border-slate-300 font-medium" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Vehicles ({MOCK_VEHICLES.length} available)</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MAX BUDGET */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">Max Budget (KES/day)</label>
            <input
              type="number"
              placeholder="e.g. 12,000"
              className="input-field text-slate-900 placeholder:text-slate-400 border-slate-300"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {(type || maxPrice || location) && (
            <button
              onClick={() => { setType(''); setMaxPrice(''); setLocation(''); }}
              className="btn-secondary text-xs !px-4 !py-3 font-bold border-slate-200 text-slate-700 hover:text-slate-900"
            >
              Reset
            </button>
          )}
        </div>

        {/* VEHICLE TYPE QUICK PILLS */}
        <div className="mt-5 flex gap-2 flex-wrap">
          {TYPES.map((t) => {
            const Icon = TYPE_ICONS[t] || Car;
            return (
              <button
                key={t}
                onClick={() => setType(type === t ? '' : t)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                  type === t
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-500 hover:text-amber-800 hover:bg-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{TYPE_LABELS[t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RESULTS */}
      <div className="mt-10">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-600 gap-3 font-medium">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            Loading vehicles…
          </div>
        )}

        {!isLoading && displayed.length === 0 && (
          <div className="card-luxe bg-white border border-slate-200/90 p-12 text-center text-slate-500 rounded-3xl shadow-sm">
            <SearchIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            No vehicles match your filters. Try adjusting the location, type, or budget.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {displayed.map((v) => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="block group h-full">
              {viewMode === 'card3d' ? (
                <Card3D intensity={10} className="p-0 overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition h-full flex flex-col justify-between">
                  <div className="relative flex h-52 items-center justify-center bg-slate-900 overflow-hidden shrink-0">
                    {v.images[0]?.url ? (
                      <img
                        src={v.images[0].url}
                        alt={`${v.make} ${v.model}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="font-display text-lg text-white/50">{v.make} {v.model}</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* TOP BADGES */}
                    <span className="absolute top-3 right-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md border border-white/20 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400" /> {v.ratingAverage.toFixed(1)}
                    </span>
                    <span className="absolute top-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] uppercase font-mono font-bold text-teal-300 border border-white/20 flex items-center gap-1">
                      <Car className="h-3 w-3 text-teal-400" /> {v.type}
                    </span>

                    {/* BOTTOM LOCATION */}
                    {v.address && (
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] text-white font-medium">
                        <MapPin className="h-3 w-3 text-amber-400" /> {v.address}
                      </span>
                    )}

                    {v.hasInsurance && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] text-white font-bold border border-white/20">
                        Insured
                      </span>
                    )}
                  </div>

                  <div className="p-5 bg-white flex-1 flex flex-col justify-between">
                    <h3 className="font-display text-xl font-bold text-slate-900">
                      {v.make} {v.model}{' '}
                      <span className="text-slate-400 text-sm font-normal">'{String(v.year).slice(-2)}</span>
                    </h3>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-teal-600" /> {v.seats} Seats</span>
                      <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5 text-teal-600" /> {v.fuelType}</span>
                      <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-teal-600" /> {v.transmission}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <p className="font-mono text-lg font-bold text-amber-700">
                        {formatPrice(v.pricePerDay)}
                        <span className="text-xs text-slate-500 font-sans font-normal"> / day</span>
                      </p>
                      <span className="text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-display uppercase tracking-wider">
                        Book now <Sparkles className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Card3D>
              ) : (
                <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden p-5 transition hover:border-amber-500/50 shadow-sm hover:shadow-md">
                  <h3 className="font-display text-lg font-bold text-slate-900">{v.make} {v.model}</h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium">{v.address}</p>
                  <p className="mt-2 font-mono text-amber-700 font-bold">{formatPrice(v.pricePerDay)} / day</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
