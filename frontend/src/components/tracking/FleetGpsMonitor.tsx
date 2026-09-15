import { useState, useEffect } from 'react';
import {
  Car, MapPin, Navigation, Activity, Search, Filter,
  Wifi, User, AlertTriangle
} from 'lucide-react';
import { type DriverTripStatus } from '@/lib/driverGpsService';
import { TourTimeline } from '@/components/tracking/TourTimeline';

interface FleetVehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  driverName: string;
  touristName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  eta: string;
  distance: string;
  status: DriverTripStatus;
  isOnline: boolean;
  destination: string;
  tripProgress: number;
}

// Simulated fleet data for demonstration
const DEMO_FLEET: FleetVehicle[] = [
  {
    id: 'v-001', make: 'Ford', model: 'F-150 Raptor', plateNumber: 'KDA 234X',
    driverName: 'James Mwangi', touristName: 'Sarah Williams',
    latitude: -1.2921, longitude: 36.8219, speed: 72, heading: 45,
    eta: '1h 45m', distance: '142 km', status: 'TRIP_IN_PROGRESS', isOnline: true,
    destination: 'Maasai Mara National Reserve', tripProgress: 55,
  },
  {
    id: 'v-002', make: 'Jeep', model: 'Wrangler Rubicon', plateNumber: 'KBZ 891M',
    driverName: 'Peter Ochieng', touristName: 'Michael Chen',
    latitude: -1.0417, longitude: 37.0742, speed: 65, heading: 180,
    eta: '2h 10m', distance: '185 km', status: 'DRIVING_TO_PICKUP', isOnline: true,
    destination: 'Amboseli National Park', tripProgress: 20,
  },
  {
    id: 'v-003', make: 'VW', model: 'T4 Camper Van', plateNumber: 'KCE 456P',
    driverName: 'David Kamau', touristName: 'Emily Johnson',
    latitude: -0.0917, longitude: 34.7680, speed: 0, heading: 0,
    eta: '—', distance: '0 km', status: 'WAITING_FOR_TOURIST', isOnline: true,
    destination: 'Lake Nakuru Lodge', tripProgress: 35,
  },
  {
    id: 'v-004', make: 'Toyota', model: 'Land Cruiser', plateNumber: 'KDA 789R',
    driverName: 'Samuel Njoroge', touristName: '—',
    latitude: -1.2833, longitude: 36.8167, speed: 0, heading: 0,
    eta: '—', distance: '—', status: 'AVAILABLE', isOnline: true,
    destination: 'Waiting for booking', tripProgress: 0,
  },
];

const STATUS_COLORS: Record<DriverTripStatus, string> = {
  OFFLINE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  ONLINE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  AVAILABLE: 'bg-teal/20 text-teal border-teal/30',
  BOOKING_ASSIGNED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DRIVING_TO_PICKUP: 'bg-blue-400/20 text-blue-400 border-blue-400/30 animate-pulse',
  WAITING_FOR_TOURIST: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
  TRIP_STARTED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  TRIP_IN_PROGRESS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse',
  TRIP_COMPLETED: 'bg-white/10 text-bone/60 border-white/20',
};

const STATUS_LABELS: Record<DriverTripStatus, string> = {
  OFFLINE: 'Offline',
  ONLINE: 'Online',
  AVAILABLE: 'Available',
  BOOKING_ASSIGNED: 'Assigned',
  DRIVING_TO_PICKUP: 'En Route to Pickup',
  WAITING_FOR_TOURIST: 'Waiting for Tourist',
  TRIP_STARTED: 'Trip Started',
  TRIP_IN_PROGRESS: 'On Safari',
  TRIP_COMPLETED: 'Trip Done',
};

interface FleetGpsMonitorProps {
  vehicles?: FleetVehicle[];
}

export function FleetGpsMonitor({ vehicles: propVehicles }: FleetGpsMonitorProps) {
  const [fleet, setFleet] = useState<FleetVehicle[]>(propVehicles ?? DEMO_FLEET);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Simulate live GPS movement
  useEffect(() => {
    const interval = setInterval(() => {
      setFleet(prev =>
        prev.map(v => {
          if (!v.isOnline || v.speed === 0) return v;
          const jitter = (Math.random() - 0.5) * 0.002;
          return {
            ...v,
            latitude: v.latitude + jitter,
            longitude: v.longitude + jitter * 1.2,
            speed: Math.max(0, v.speed + Math.floor((Math.random() - 0.5) * 10)),
            tripProgress: Math.min(100, v.tripProgress + 0.5),
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = fleet.filter(v => {
    const matchSearch =
      searchQuery === '' ||
      `${v.make} ${v.model} ${v.driverName} ${v.touristName} ${v.plateNumber}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const onlineCount = fleet.filter(v => v.isOnline).length;
  const activeTrips = fleet.filter(v => ['TRIP_IN_PROGRESS', 'TRIP_STARTED', 'DRIVING_TO_PICKUP'].includes(v.status)).length;

  return (
    <div className="space-y-6">
      {/* FLEET STATS BAR */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Fleet Online', value: `${onlineCount}/${fleet.length}`, icon: Wifi, color: 'text-emerald-400' },
          { label: 'Active Trips', value: activeTrips, icon: Activity, color: 'text-teal' },
          { label: 'Available', value: fleet.filter(v => v.status === 'AVAILABLE').length, icon: Car, color: 'text-marigold' },
          { label: 'Alerts', value: '2', icon: AlertTriangle, color: 'text-coral' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-bone/50">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-bone/40" />
          <input
            type="text"
            placeholder="Search by driver, vehicle, tourist, plate..."
            className="w-full rounded-xl bg-ink-100 border border-white/10 px-3 py-2 pl-9 text-sm text-bone placeholder:text-bone/30 focus:border-purple-400/50 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-bone/40" />
          {['ALL', 'TRIP_IN_PROGRESS', 'DRIVING_TO_PICKUP', 'AVAILABLE', 'OFFLINE'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold border transition ${
                statusFilter === s
                  ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                  : 'border-white/10 text-bone/50 hover:text-bone'
              }`}
            >
              {s === 'ALL' ? 'All' : STATUS_LABELS[s as DriverTripStatus] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* FLEET VEHICLE CARDS */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(v => (
          <div
            key={v.id}
            onClick={() => setSelectedVehicle(selectedVehicle?.id === v.id ? null : v)}
            className={`glass-card-3d rounded-2xl p-4 cursor-pointer transition hover:border-white/25 ${
              selectedVehicle?.id === v.id ? 'border-purple-400/50 ring-1 ring-purple-400/30' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
                  v.isOnline ? 'bg-emerald-500/20' : 'bg-gray-500/20'
                }`}>
                  <Car className={`h-5 w-5 ${v.isOnline ? 'text-emerald-400' : 'text-gray-400'}`} />
                  {v.isOnline && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-ink animate-ping" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold text-bone text-sm">{v.make} {v.model}</p>
                  <p className="text-[10px] text-marigold font-mono">{v.plateNumber}</p>
                </div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[v.status]}`}>
                {STATUS_LABELS[v.status]}
              </span>
            </div>

            {/* DRIVER & TOURIST INFO */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white/5 p-2">
                <span className="text-[10px] text-bone/40 block">Driver</span>
                <span className="font-semibold text-bone flex items-center gap-1">
                  <User className="h-3 w-3 text-teal" /> {v.driverName}
                </span>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <span className="text-[10px] text-bone/40 block">Tourist</span>
                <span className="font-semibold text-bone flex items-center gap-1">
                  <User className="h-3 w-3 text-marigold" /> {v.touristName}
                </span>
              </div>
            </div>

            {/* TELEMETRY ROW */}
            <div className="mt-3 flex items-center gap-4 rounded-xl bg-ink-100/50 p-2.5 text-xs">
              <div>
                <span className="text-[10px] text-bone/40 block">Speed</span>
                <span className="font-mono font-bold text-teal">{v.speed} km/h</span>
              </div>
              <div className="border-l border-white/10 pl-3">
                <span className="text-[10px] text-bone/40 block">ETA</span>
                <span className="font-mono font-bold text-marigold">{v.eta}</span>
              </div>
              <div className="border-l border-white/10 pl-3">
                <span className="text-[10px] text-bone/40 block">Distance</span>
                <span className="font-mono font-bold text-bone">{v.distance}</span>
              </div>
              <div className="border-l border-white/10 pl-3">
                <span className="text-[10px] text-bone/40 block">GPS</span>
                <span className="font-mono text-[11px] text-bone/60">
                  {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* TRIP PROGRESS BAR */}
            {v.tripProgress > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-bone/50">
                  <span>Trip Progress</span>
                  <span className="font-mono">{Math.round(v.tripProgress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal via-emerald-400 to-marigold transition-all duration-1000"
                    style={{ width: `${v.tripProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-bone/40">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-400" /> Start
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-marigold" /> {v.destination}
                  </span>
                </div>
              </div>
            )}

            {/* EXPANDED: TOUR TIMELINE */}
            {selectedVehicle?.id === v.id && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <TourTimeline
                  currentStatus={v.status}
                  pickupLocation="Nairobi CBD"
                  destinationLocation={v.destination}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Car className="mx-auto h-12 w-12 text-bone/20" />
          <p className="mt-4 text-sm text-bone/60">No vehicles match your search criteria</p>
        </div>
      )}
    </div>
  );
}
