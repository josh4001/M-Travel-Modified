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
  OFFLINE: 'bg-slate-100 text-slate-500 border-slate-300',
  ONLINE: 'bg-blue-50 text-blue-700 border-blue-300',
  AVAILABLE: 'bg-teal/10 text-teal border-teal/30',
  BOOKING_ASSIGNED: 'bg-amber-50 text-amber-800 border-amber-300',
  DRIVING_TO_PICKUP: 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse',
  WAITING_FOR_TOURIST: 'bg-amber-100/70 text-amber-800 border-amber-300',
  TRIP_STARTED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  TRIP_IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse',
  TRIP_COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
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
          { label: 'Fleet Online', value: `${onlineCount}/${fleet.length}`, icon: Wifi, color: 'text-emerald-700' },
          { label: 'Active Trips', value: activeTrips, icon: Activity, color: 'text-teal' },
          { label: 'Available', value: fleet.filter(v => v.status === 'AVAILABLE').length, icon: Car, color: 'text-amber-700' },
          { label: 'Alerts', value: '2', icon: AlertTriangle, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card-luxe bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver, vehicle, tourist, plate..."
            className="input-field text-xs !py-2.5 !pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {['ALL', 'TRIP_IN_PROGRESS', 'DRIVING_TO_PICKUP', 'AVAILABLE', 'OFFLINE'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold border transition ${
                statusFilter === s
                  ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
            className={`card-luxe bg-white rounded-2xl p-4 cursor-pointer transition border border-slate-200 shadow-sm hover:border-amber-400 ${
              selectedVehicle?.id === v.id ? 'border-amber-500 ring-2 ring-amber-400/20 shadow-md' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
                  v.isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  <Car className={`h-5 w-5 ${v.isOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {v.isOnline && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white animate-ping" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold text-slate-900 text-sm">{v.make} {v.model}</p>
                  <p className="text-[10px] text-amber-700 font-bold font-mono">{v.plateNumber}</p>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[v.status]}`}>
                {STATUS_LABELS[v.status]}
              </span>
            </div>

            {/* DRIVER & TOURIST INFO */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Driver</span>
                <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-teal" /> {v.driverName}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Tourist</span>
                <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-amber-600" /> {v.touristName}
                </span>
              </div>
            </div>

            {/* TELEMETRY ROW */}
            <div className="mt-3 flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Speed</span>
                <span className="font-mono font-bold text-teal">{v.speed} km/h</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-[10px] text-slate-500 font-bold block">ETA</span>
                <span className="font-mono font-bold text-amber-700">{v.eta}</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-[10px] text-slate-500 font-bold block">Distance</span>
                <span className="font-mono font-bold text-slate-900">{v.distance}</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-[10px] text-slate-500 font-bold block">GPS</span>
                <span className="font-mono text-[11px] text-slate-700 font-semibold">
                  {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* TRIP PROGRESS BAR */}
            {v.tripProgress > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                  <span>Trip Progress</span>
                  <span className="font-mono">{Math.round(v.tripProgress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal via-emerald-500 to-amber-500 transition-all duration-1000"
                    style={{ width: `${v.tripProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600" /> Start
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-amber-600" /> {v.destination}
                  </span>
                </div>
              </div>
            )}

            {/* EXPANDED: TOUR TIMELINE */}
            {selectedVehicle?.id === v.id && (
              <div className="mt-4 border-t border-slate-200 pt-4">
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
        <div className="card-luxe bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Car className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-600 font-semibold">No vehicles match your search criteria</p>
        </div>
      )}
    </div>
  );
}
