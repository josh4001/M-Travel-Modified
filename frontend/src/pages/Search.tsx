import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Fuel, Gauge, SlidersHorizontal, LayoutGrid, Box, Sparkles,
  MapPin, Car, Bus, Truck, Compass, Lock,
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { Card3D } from '@/components/ui/Card3D';
import { useCurrency } from '@/context/CurrencyContext';
import { getVehicleFallbackImage } from '@/lib/supabaseClient';
import {
  getStoredVehicles, syncVehiclesFromSupabase, isDemoVehicle,
  isVehicleLive, getVehicleHireStatus, type StoredVehicle
} from '@/lib/bookingStore';
import { VehicleStatusBadge } from '@/components/ui/LuxuryVehicleBadges';

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

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const mapStoredToVehicle = (v: StoredVehicle): Vehicle => {
  const hostImage = getVehicleFallbackImage(v.make, v.model, v.type, v.id);
  const primaryUrl = (Array.isArray(v.images) && v.images.length > 0 && v.images[0]) ? v.images[0] : hostImage;

  return {
    id: v.id,
    type: v.type as any,
    make: v.make,
    model: v.model,
    year: v.year,
    seats: v.seats,
    fuelType: v.fuelType as any,
    transmission: v.transmission as any,
    pricePerDay: String(v.pricePerDay),
    hasInsurance: v.hasInsurance,
    latitude: v.latitude ?? -1.2921,
    longitude: v.longitude ?? 36.8219,
    address: v.address,
    ratingAverage: v.ratingAverage,
    ratingCount: v.ratingCount,
    images: (Array.isArray(v.images) && v.images.length > 0)
      ? v.images.map((url, idx) => ({ id: `img-${v.id}-${idx}`, url, isPrimary: idx === 0 }))
      : [{ id: `img-${v.id}`, url: primaryUrl, isPrimary: true }],
    owner: {
      id: v.ownerId || 'a0000000-0000-0000-0000-000000000002',
      firstName: v.ownerName ? v.ownerName.split(' ')[0] : 'James',
      lastName: v.ownerName ? v.ownerName.split(' ').slice(1).join(' ') : 'Mwangi',
    },
    plateNumber: v.plateNumber,
  };
};

export default function Search() {
  const { formatPrice } = useCurrency();
  const [type, setType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [hireMode, setHireMode] = useState<'ALL' | 'WITH_DRIVER' | 'SELF_DRIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'card3d'>('card3d');
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    return getStoredVehicles()
      .filter((v) => v.status === 'APPROVED' && (isVehicleLive(v.id) || getVehicleHireStatus(v.id).isHired) && !isDemoVehicle(v))
      .map(mapStoredToVehicle);
  });
  const [isLoading, setIsLoading] = useState(false);

  // Traveler GPS Location
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locPermissionError, setLocPermissionError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocPermissionError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
        setLocPermissionError(null);
      },
      (_err) => {
        setIsLocating(false);
        // Fallback default coordinates (Nairobi CBD)
        setUserCoords([-1.2864, 36.8172]);
        setLocPermissionError('Location permission was denied. Using central Nairobi as default pickup point.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    // Try to restore saved location or auto-request
    const saved = localStorage.getItem('mt_traveler_coords');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lng) setUserCoords([parsed.lat, parsed.lng]);
      } catch {}
    } else {
      requestLocation();
    }

    const handleLocUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ lat: number; lng: number }>;
      if (customEvt.detail?.lat && customEvt.detail?.lng) {
        setUserCoords([customEvt.detail.lat, customEvt.detail.lng]);
        setLocPermissionError(null);
      }
    };

    window.addEventListener('mt_location_updated', handleLocUpdate);
    return () => {
      window.removeEventListener('mt_location_updated', handleLocUpdate);
    };
  }, []);

  useEffect(() => {
    if (userCoords) {
      try {
        localStorage.setItem('mt_traveler_coords', JSON.stringify({ lat: userCoords[0], lng: userCoords[1] }));
      } catch {}
    }
  }, [userCoords]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      try {
        // Sync latest vehicles from Supabase in background
        await syncVehiclesFromSupabase().catch(() => {});

        // Read synchronized stored vehicles (strict host fleet parity with Catalogue)
        const stored = getStoredVehicles()
          .filter((v) => v.status === 'APPROVED' && (isVehicleLive(v.id) || getVehicleHireStatus(v.id).isHired) && !isDemoVehicle(v))
          .map(mapStoredToVehicle);

        let combined = stored;

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
        const fallbackStored = getStoredVehicles()
          .filter((v) => v.status === 'APPROVED' && (isVehicleLive(v.id) || getVehicleHireStatus(v.id).isHired) && !isDemoVehicle(v))
          .map(mapStoredToVehicle);
        let filtered = fallbackStored;
        if (type) filtered = filtered.filter((v) => v.type?.toUpperCase() === type.toUpperCase());
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

  // Client-side search, location, and hire mode filter
  let displayed = location
    ? vehicles.filter(
        (v) =>
          v.address?.toLowerCase().includes(location.toLowerCase()) ||
          v.owner?.firstName?.toLowerCase().includes(location.toLowerCase()) ||
          v.owner?.lastName?.toLowerCase().includes(location.toLowerCase()) ||
          `${v.make} ${v.model}`.toLowerCase().includes(location.toLowerCase())
      )
    : vehicles;

  // All approved vehicles support both Self-Drive and With Driver/Chauffeur options
  // Traveler can choose their preference on any vehicle detail page

  // Sort by distance if userCoords available
  if (userCoords) {
    displayed = [...displayed].sort((a, b) => {
      const distA = calculateDistanceKm(userCoords[0], userCoords[1], a.latitude || -1.2921, a.longitude || 36.8219);
      const distB = calculateDistanceKm(userCoords[0], userCoords[1], b.latitude || -1.2921, b.longitude || 36.8219);
      return distA - distB;
    });
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans py-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* ── TRAVELER GPS LOCATION BANNER (UBER-STYLE PROXIMITY) ── */}
        <div className="mb-6 rounded-3xl bg-slate-950 text-white p-5 sm:p-6 border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>Find Vehicles Near You</span>
              {userCoords && (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  LOCATION ACTIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              {userCoords
                ? `Location active (${userCoords[0].toFixed(3)}, ${userCoords[1].toFixed(3)}). Vehicles sorted by road proximity.`
                : 'Grant location permission to see vehicles near your pickup location (e.g. Nairobi CBD).'}
            </p>
            {locPermissionError && (
              <p className="text-[11px] text-slate-300 font-medium mt-1">{locPermissionError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {!userCoords ? (
            <button
              onClick={requestLocation}
              disabled={isLocating}
              className="btn-primary !px-5 !py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 shadow-sm"
            >
              <Compass className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting Location…' : 'Allow Location'}</span>
            </button>
          ) : (
            <button
              onClick={requestLocation}
              className="rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-bold text-white flex items-center gap-1.5 transition"
            >
              <Compass className="h-3.5 w-3.5 text-white" /> Refresh Location
            </button>
          )}
        </div>
      </div>

      {/* HEADER & FILTERS */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm text-slate-900 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 font-sans">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Tourism Vehicle Fleet
            </span>
            <h1 className="mt-1 font-serif text-3xl font-bold md:text-4xl text-slate-950">Browse Available Vehicles</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* HIRE MODE TOGGLE: WITH DRIVER VS SELF-DRIVE */}
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setHireMode('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${
                  hireMode === 'ALL' ? 'bg-slate-950 text-white font-extrabold shadow-xs' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHireMode('WITH_DRIVER')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${
                  hireMode === 'WITH_DRIVER' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                With Driver
              </button>
              <button
                onClick={() => setHireMode('SELF_DRIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${
                  hireMode === 'SELF_DRIVE' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Self-Drive
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setViewMode('card3d')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'card3d' ? 'bg-slate-950 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Box className="h-3.5 w-3.5" /> Card View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'grid' ? 'bg-slate-950 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
            </div>
          </div>
        </div>

        {/* FILTERS ROW */}
        <div className="mt-6 flex flex-wrap items-end gap-4">
          {/* LOCATION SEARCH */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Location / Area</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Westlands, Karen, CBD…"
                className="input-field pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-950 shadow-inner"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* VEHICLE TYPE */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Vehicle Type</label>
            <div className="relative">
              <Car className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <select className="input-field pl-10 bg-slate-50 border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-slate-950" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="" className="bg-white text-slate-900">All Vehicles ({vehicles.length} available)</option>
                {TYPES.map((t) => (
                  <option key={t} value={t} className="bg-white text-slate-900">
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MAX BUDGET */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Max Budget (KES/day)</label>
            <input
              type="number"
              placeholder="e.g. 12,000"
              className="input-field bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-950 shadow-inner"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {(type || maxPrice || location) && (
            <button
              onClick={() => { setType(''); setMaxPrice(''); setLocation(''); }}
              className="btn-secondary text-xs !px-4 !py-3 font-bold border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950"
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
                    ? 'bg-slate-950 text-white border-slate-950 font-extrabold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-950 hover:bg-slate-50'
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
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            Loading vehicles…
          </div>
        )}

        {!isLoading && displayed.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 md:p-16 text-center shadow-sm space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto">
              <Car className="h-8 w-8 stroke-[1.75]" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-serif text-2xl font-bold text-slate-950">
                {vehicles.length === 0 ? 'No vehicles available at the moment' : 'No vehicles match your filters'}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                {vehicles.length === 0
                  ? 'There are currently no approved fleet vehicles listed for hire. Check back soon or register as a fleet host to list your vehicle.'
                  : 'Try adjusting your vehicle type, budget, or location filters to see more results.'}
              </p>
            </div>
            {vehicles.length === 0 ? (
              <div className="pt-2">
                <Link to="/register" className="btn-primary !py-2.5 !px-5 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Register as Fleet Host
                </Link>
              </div>
            ) : (
              (type || maxPrice || location) && (
                <div className="pt-2">
                  <button
                    onClick={() => { setType(''); setMaxPrice(''); setLocation(''); }}
                    className="btn-secondary !py-2 !px-4 text-xs font-bold border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950"
                  >
                    Reset All Filters
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {!isLoading && displayed.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((v) => {
              const distKm = userCoords
                ? calculateDistanceKm(userCoords[0], userCoords[1], v.latitude || -1.2921, v.longitude || 36.8219)
                : null;
              const hireStatus = getVehicleHireStatus(v.id);
              const isLive = isVehicleLive(v.id);

              return (
                <Link key={v.id} to={`/vehicles/${v.id}`} className="block group h-full">
                  {viewMode === 'card3d' ? (
                    <Card3D intensity={10} className="p-0 overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-900 transition-all duration-300 h-full flex flex-col justify-between rounded-3xl">
                      <div className="relative flex h-52 items-center justify-center bg-slate-950 overflow-hidden shrink-0">
                        {v.images[0]?.url ? (
                          <img
                            src={v.images[0].url}
                            alt={`${v.make} ${v.model}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="font-display text-lg text-white/50">{v.make} {v.model}</span>
                        )}

                        {/* TOP BADGES */}
                        <span className="absolute top-3 left-3 rounded-full bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase font-mono font-bold text-white border border-white/20 flex items-center gap-1 shadow-sm">
                          <Car className="h-3 w-3 text-slate-300" /> {v.type}
                        </span>

                        {/* OPERATIONAL STATUS BADGE */}
                        <div className="absolute top-3 right-3">
                          <VehicleStatusBadge
                            isHired={hireStatus.isOnTrip}
                            isOnTrip={hireStatus.isOnTrip}
                            isAwaitingHandover={hireStatus.isAwaitingHandover}
                            isLive={isLive}
                            variant="overlay"
                            labelOverride={
                              hireStatus.isOnTrip
                                ? 'On Trip'
                                : hireStatus.isAwaitingHandover
                                ? 'Booked & Reserved'
                                : undefined
                            }
                          />
                        </div>

                        {/* BOTTOM DISTANCE & LOCATION */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                          {v.address && (
                            <span className="flex items-center gap-1 text-[11px] text-white font-medium truncate drop-shadow-sm">
                              <MapPin className="h-3 w-3 text-slate-300 shrink-0" /> {v.address}
                            </span>
                          )}
                          {distKm !== null && (
                            <span className="shrink-0 rounded-full bg-white text-slate-950 px-2.5 py-0.5 text-[10px] font-mono font-bold shadow-md">
                              {distKm} km away
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-serif text-xl font-bold text-slate-950 group-hover:text-slate-700 transition-colors truncate">
                              {v.make} {v.model}{' '}
                              <span className="text-slate-400 text-sm font-normal">'{String(v.year).slice(-2)}</span>
                            </h3>
                          </div>

                          {/* HIRE TYPE BADGE */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200 shadow-xs">
                              ✓ Self-Drive or With Driver
                            </span>
                            {v.hasInsurance && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Insured
                              </span>
                            )}
                          </div>

                          {/* UNAVAILABILITY & HIRED NOTICES */}
                          {hireStatus.isHired && (
                            <div className="mt-2 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-[11px] font-medium leading-snug">
                              <strong className="text-slate-950 block">Active Passenger Journey</strong>
                              On trip with traveler until {hireStatus.returnDate || 'return'}. Cannot be hired until returned.
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3">
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-700" /> {v.seats} Seats</span>
                          <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5 text-slate-700" /> {v.fuelType}</span>
                          <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-slate-700" /> {v.transmission}</span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <p className="font-mono text-lg font-bold text-slate-950">
                            {formatPrice(v.pricePerDay)}
                            <span className="text-xs text-slate-500 font-sans font-normal"> / day</span>
                          </p>
                          {hireStatus.isHired ? (
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-none">
                              <Lock className="h-3 w-3 text-slate-400" />
                              Currently In Use
                            </span>
                          ) : !isLive ? (
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-none">
                              <Lock className="h-3 w-3 text-slate-400" />
                              Unavailable
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-950 group-hover:text-slate-700 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-sans uppercase tracking-wider">
                              Book now <Sparkles className="h-3 w-3 text-slate-900" />
                            </span>
                          )}
                        </div>
                      </div>
                    </Card3D>
                  ) : (
                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden p-5 transition hover:border-slate-900 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-bold text-slate-950">{v.make} {v.model}</h3>
                        {distKm !== null && (
                          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {distKm} km away
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 font-medium">{v.address}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-mono text-slate-950 font-bold">{formatPrice(v.pricePerDay)} / day</p>
                        {hireStatus.isHired ? (
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> In Use
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-950 flex items-center gap-1">
                            Available <Sparkles className="h-3 w-3 text-slate-900" />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
