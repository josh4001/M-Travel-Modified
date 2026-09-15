import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Users, Fuel, Gauge, SlidersHorizontal, LayoutGrid, Box, Sparkles,
  MapPin, Search as SearchIcon, Car, Wifi,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Vehicle } from '@/types';
import { Card3D } from '@/components/ui/Card3D';
import { MOCK_VEHICLES } from '@/data/mockVehicles';
import { useCurrency } from '@/context/CurrencyContext';

const TYPES = ['CAR', 'SUV', 'VAN', 'PICKUP'];

const TYPE_ICONS: Record<string, string> = {
  CAR: '🚗',
  SUV: '🚙',
  VAN: '🚐',
  PICKUP: '🛻',
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

  // Fetch with mock-data fallback
  useEffect(() => {
    setIsLoading(true);
    api
      .get<Vehicle[]>('/vehicles', {
        params: Object.fromEntries(
          Object.entries({ type, maxPrice }).filter(([, v]) => v)
        ),
      })
      .then(({ data }) => {
        setVehicles(data);
      })
      .catch(() => {
        // Backend unavailable — fallback to rich mock data
        let filtered = MOCK_VEHICLES;
        if (type) filtered = filtered.filter((v) => v.type === type);
        if (maxPrice) filtered = filtered.filter((v) => Number(v.pricePerDay) <= Number(maxPrice));
        setVehicles(filtered);
      })
      .finally(() => setIsLoading(false));
  }, [type, maxPrice]);

  // Client-side location filter on mock data
  const displayed = location
    ? vehicles.filter(
        (v) =>
          v.address?.toLowerCase().includes(location.toLowerCase()) ||
          v.owner.firstName.toLowerCase().includes(location.toLowerCase())
      )
    : vehicles;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 font-display">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 px-5 py-3 text-sm text-teal">
        <Wifi className="h-4 w-4 shrink-0" />
        <span><strong>Live Vehicles</strong> — Real-time verified vehicles from M-TRAVEL Platform</span>
      </div>

      {/* HEADER & FILTERS */}
      <div className="glass-card-3d p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-marigold font-display">
              <SlidersHorizontal className="h-3.5 w-3.5" /> M-TRAVEL Vehicles
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl text-bone">Find Your Perfect Ride</h1>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur-md">
            <button
              onClick={() => setViewMode('card3d')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                viewMode === 'card3d' ? 'bg-marigold text-ink font-semibold' : 'text-bone/60 hover:text-bone'
              }`}
            >
              <Box className="h-3.5 w-3.5" /> Card View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                viewMode === 'grid' ? 'bg-marigold text-ink font-semibold' : 'text-bone/60 hover:text-bone'
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
            <label className="block text-xs text-bone/50 mb-1">Location / Area</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-marigold" />
              <input
                type="text"
                placeholder="e.g. Westlands, Karen, CBD…"
                className="input-field pl-10"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* VEHICLE TYPE */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-bone/50 mb-1">Vehicle Type</label>
            <div className="relative">
              <Car className="absolute left-3.5 top-3.5 h-4 w-4 text-teal" />
              <select className="input-field pl-10" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Vehicles ({MOCK_VEHICLES.length} available)</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MAX BUDGET */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-bone/50 mb-1">Max Budget (KES/day)</label>
            <input
              type="number"
              placeholder="e.g. 12,000"
              className="input-field"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {(type || maxPrice || location) && (
            <button
              onClick={() => { setType(''); setMaxPrice(''); setLocation(''); }}
              className="btn-ghost text-xs !px-4 !py-3"
            >
              Reset
            </button>
          )}
        </div>

        {/* VEHICLE TYPE QUICK PILLS */}
        <div className="mt-5 flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(type === t ? '' : t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                type === t
                  ? 'bg-marigold text-ink border-marigold'
                  : 'border-white/15 bg-white/5 text-bone/70 hover:border-marigold/40 hover:text-marigold'
              }`}
            >
              {TYPE_ICONS[t]} {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS */}
      <div className="mt-10">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-bone/60 gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-marigold border-t-transparent" />
            Loading vehicles…
          </div>
        )}

        {!isLoading && displayed.length === 0 && (
          <div className="glass-card-3d p-12 text-center text-bone/60">
            <SearchIcon className="mx-auto h-8 w-8 text-bone/30 mb-2" />
            No vehicles match your filters. Try adjusting the location, type, or budget.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((v) => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="block group">
              {viewMode === 'card3d' ? (
                <Card3D intensity={10} className="p-0 overflow-hidden">
                  <div className="relative flex h-52 items-center justify-center bg-ink-100/80 overflow-hidden">
                    {v.images[0]?.url ? (
                      <img
                        src={v.images[0].url}
                        alt={`${v.make} ${v.model}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="font-display text-lg text-bone/40">{v.make} {v.model}</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

                    {/* TOP BADGES */}
                    <span className="absolute top-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-marigold backdrop-blur-md border border-white/10 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-marigold" /> {v.ratingAverage.toFixed(1)}
                    </span>
                    <span className="absolute top-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] uppercase font-mono text-teal border border-white/10">
                      {TYPE_ICONS[v.type]} {v.type}
                    </span>

                    {/* BOTTOM LOCATION */}
                    {v.address && (
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] text-bone/80">
                        <MapPin className="h-3 w-3 text-marigold" /> {v.address}
                      </span>
                    )}

                    {v.hasInsurance && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-teal/20 px-2 py-0.5 text-[10px] text-teal border border-teal/30">
                        Insured
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-bone">
                      {v.make} {v.model}{' '}
                      <span className="text-bone/40 text-sm font-normal">'{String(v.year).slice(-2)}</span>
                    </h3>

                    <div className="mt-4 flex items-center gap-4 text-xs text-bone/60 border-t border-white/10 pt-3">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-teal" /> {v.seats} Seats</span>
                      <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5 text-teal" /> {v.fuelType}</span>
                      <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-teal" /> {v.transmission}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <p className="font-mono text-lg font-bold text-marigold">
                        {formatPrice(v.pricePerDay)}
                        <span className="text-xs text-bone/40 font-sans font-normal"> / day</span>
                      </p>
                      <span className="text-xs font-bold text-teal group-hover:translate-x-1 transition-transform flex items-center gap-1 font-display uppercase tracking-wider">
                        Book now <Sparkles className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Card3D>
              ) : (
                <div className="glass-card overflow-hidden p-5 transition hover:border-marigold/40">
                  <h3 className="font-display text-lg font-bold">{v.make} {v.model}</h3>
                  <p className="mt-1 text-xs text-bone/50">{v.address}</p>
                  <p className="mt-2 font-mono text-marigold font-bold">{formatPrice(v.pricePerDay)} / day</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
