import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Search, Activity, Locate, Battery, Gauge, Compass, User, X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getStoredVehicles, getStoredBookings, type StoredVehicle, type StoredBooking } from '@/lib/bookingStore';
import { createAssignedVehicleIcon } from './AssignedVehicleMarker';
import type { DriverLiveLocation, TrackingStatus } from '@/types/tracking';

type FleetFilter = 'ALL' | 'ACTIVE' | 'AVAILABLE' | 'OFFLINE';

export const AdminFleetMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const leafletModuleRef = useRef<typeof import('leaflet') | null>(null);

  const [liveLocations, setLiveLocations] = useState<Map<string, DriverLiveLocation>>(new Map());
  const [vehicles, setVehicles] = useState<StoredVehicle[]>([]);
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [filter, setFilter] = useState<FleetFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [followSelected, setFollowSelected] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // 1. Load initial store vehicles and bookings
  useEffect(() => {
    setVehicles(getStoredVehicles());
    setBookings(getStoredBookings());
  }, []);

  // 2. Fetch initial live locations snapshot and subscribe to real-time updates
  useEffect(() => {
    let isMounted = true;

    const fetchLiveLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_live_locations')
          .select('*');

        if (!isMounted) return;
        if (!error && data) {
          const map = new Map<string, DriverLiveLocation>();
          data.forEach((row: any) => {
            map.set(row.vehicle_id || row.driver_id, {
              id: row.id,
              driver_id: row.driver_id,
              trip_id: row.trip_id,
              vehicle_id: row.vehicle_id,
              latitude: row.latitude,
              longitude: row.longitude,
              speed: row.speed || 0,
              heading: row.heading || 0,
              accuracy: row.accuracy || 5,
              status: row.status || 'AVAILABLE',
              battery_level: row.battery_level,
              recorded_at: row.recorded_at,
              updated_at: row.updated_at,
            });
          });
          setLiveLocations(map);
        }
      } catch (err) {
        console.warn('Initial admin fleet fetch error:', err);
      }
    };

    fetchLiveLocations();

    // Supabase Realtime channel monitoring the entire fleet
    const fleetChannel = supabase
      .channel('admin-fleet-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_live_locations' },
        (payload) => {
          if (!isMounted) return;
          const row = payload.new as any;
          if (row && (row.vehicle_id || row.driver_id)) {
            const key = row.vehicle_id || row.driver_id;
            setLiveLocations((prev) => {
              const next = new Map(prev);
              next.set(key, {
                id: row.id,
                driver_id: row.driver_id,
                trip_id: row.trip_id,
                vehicle_id: row.vehicle_id,
                latitude: row.latitude,
                longitude: row.longitude,
                speed: row.speed || 0,
                heading: row.heading || 0,
                accuracy: row.accuracy || 5,
                status: row.status || 'AVAILABLE',
                battery_level: row.battery_level,
                recorded_at: row.recorded_at,
                updated_at: row.updated_at || new Date().toISOString(),
              });
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(fleetChannel);
    };
  }, []);

  // 3. Ensure Leaflet CSS and Initialize Map
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isSubscribed = true;

    import('leaflet').then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [-1.286389, 36.817223], // Nairobi CBD center
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors | M-TRAVEL Admin Telemetry',
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 4. Combine Stored Vehicles with Live Locations & Booking Info
  const enrichedFleet = useMemo(() => {
    return vehicles.map((v) => {
      const live = liveLocations.get(v.id);
      const activeBooking = bookings.find(
        (b) => b.vehicleId === v.id && ['IN_PROGRESS', 'CONFIRMED', 'ACCEPTED'].includes(b.status)
      );

      // Default fallback coordinates if no live GPS yet
      const lat = live?.latitude ?? (v.latitude || -1.286389 + ((v.id.charCodeAt(0) % 10) - 5) * 0.02);
      const lng = live?.longitude ?? (v.longitude || 36.817223 + ((v.id.charCodeAt(1) % 10) - 5) * 0.02);
      const speed = live?.speed ?? (activeBooking?.status === 'IN_PROGRESS' ? 45 : 0);
      const heading = live?.heading ?? 0;
      const status: TrackingStatus = live?.status ?? (activeBooking ? 'TRIP_IN_PROGRESS' : 'AVAILABLE');

      const isStale = live?.updated_at
        ? Date.now() - new Date(live.updated_at).getTime() > 60000
        : false;

      return {
        vehicle: v,
        latitude: lat,
        longitude: lng,
        speed,
        heading,
        status,
        isStale,
        battery: live?.battery_level,
        updatedAt: live?.updated_at || v.updatedAt,
        activeBooking,
      };
    });
  }, [vehicles, liveLocations, bookings]);

  // 5. Filter & Search Fleet
  const filteredFleet = useMemo(() => {
    return enrichedFleet.filter((item) => {
      // Filter by status
      if (filter === 'ACTIVE') {
        if (!['TRIP_IN_PROGRESS', 'DRIVING_TO_PICKUP'].includes(item.status)) return false;
      } else if (filter === 'AVAILABLE') {
        if (item.status !== 'AVAILABLE') return false;
      } else if (filter === 'OFFLINE') {
        if (item.status !== 'OFFLINE' && !item.isStale) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const plate = (item.vehicle.plateNumber || '').toLowerCase();
        const model = `${item.vehicle.make} ${item.vehicle.model}`.toLowerCase();
        const host = (item.vehicle.ownerName || '').toLowerCase();
        if (!plate.includes(q) && !model.includes(q) && !host.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedFleet, filter, searchQuery]);

  // 6. Update Map Markers when filteredFleet changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !leafletModuleRef.current) return;

    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    const markersMap = markersMapRef.current;

    // Remove markers that are no longer in filteredFleet
    const activeIds = new Set(filteredFleet.map((f) => f.vehicle.id));
    markersMap.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        markersMap.delete(id);
      }
    });

    // Add or update markers
    filteredFleet.forEach((item) => {
      const vId = item.vehicle.id;
      const icon = createAssignedVehicleIcon(L, {
        heading: item.heading,
        speed: item.speed,
        vehicleType: item.vehicle.type,
        isStale: item.isStale,
        plateNumber: item.vehicle.plateNumber,
      });

      if (markersMap.has(vId)) {
        const marker = markersMap.get(vId);
        marker.setLatLng([item.latitude, item.longitude]);
        marker.setIcon(icon);
      } else {
        const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(map);
        marker.on('click', () => {
          setSelectedVehicleId(vId);
          map.panTo([item.latitude, item.longitude], { animate: true });
        });
        markersMap.set(vId, marker);
      }
    });

    // Follow selected vehicle camera
    if (selectedVehicleId && followSelected) {
      const sel = enrichedFleet.find((f) => f.vehicle.id === selectedVehicleId);
      if (sel) {
        map.panTo([sel.latitude, sel.longitude], { animate: true });
      }
    }
  }, [filteredFleet, isMapReady, selectedVehicleId, followSelected, enrichedFleet]);

  const selectedVehicleData = enrichedFleet.find((f) => f.vehicle.id === selectedVehicleId);

  // Statistics
  const stats = useMemo(() => {
    const total = enrichedFleet.length;
    const active = enrichedFleet.filter((f) => ['TRIP_IN_PROGRESS', 'DRIVING_TO_PICKUP'].includes(f.status)).length;
    const available = enrichedFleet.filter((f) => f.status === 'AVAILABLE').length;
    const offline = enrichedFleet.filter((f) => f.status === 'OFFLINE' || f.isStale).length;
    return { total, active, available, offline };
  }, [enrichedFleet]);

  return (
    <div className="flex flex-col lg:flex-row h-[700px] w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl">
      {/* SIDEBAR: SEARCH, FILTERS & VEHICLE LIST */}
      <div className="w-full lg:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50">
        {/* Header & Stats Bar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
              Live Fleet Telemetry
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-bold border border-emerald-500/30">
              ● {stats.total} Vehicles
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`p-2 rounded-xl text-center border transition ${
                filter === 'ACTIVE'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm font-black text-emerald-600">{stats.active}</div>
              <div className="text-[10px] uppercase font-bold">On Trip</div>
            </button>

            <button
              onClick={() => setFilter('AVAILABLE')}
              className={`p-2 rounded-xl text-center border transition ${
                filter === 'AVAILABLE'
                  ? 'bg-sky-50 border-sky-300 text-sky-800 font-bold shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm font-black text-sky-600">{stats.available}</div>
              <div className="text-[10px] uppercase font-bold">Available</div>
            </button>

            <button
              onClick={() => setFilter('OFFLINE')}
              className={`p-2 rounded-xl text-center border transition ${
                filter === 'OFFLINE'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm font-black text-amber-600">{stats.offline}</div>
              <div className="text-[10px] uppercase font-bold">Offline</div>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate, model, host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredFleet.map((item) => {
            const isSelected = item.vehicle.id === selectedVehicleId;
            return (
              <div
                key={item.vehicle.id}
                onClick={() => {
                  setSelectedVehicleId(item.vehicle.id);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo([item.latitude, item.longitude], { animate: true });
                  }
                }}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={item.vehicle.images[0] || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200'}
                      alt={item.vehicle.model}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1 left-1 flex h-2 w-2">
                      <span className={`h-2 w-2 rounded-full ${
                        item.status === 'TRIP_IN_PROGRESS' ? 'bg-emerald-500 animate-ping' : 'bg-sky-500'
                      }`} />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.vehicle.make} {item.vehicle.model}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-mono font-bold text-amber-600">
                        {item.vehicle.plateNumber || 'KDA 100X'}
                      </span>
                      <span>•</span>
                      <span>{item.vehicle.ownerName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {item.speed > 0 ? (
                    <span className="text-xs font-mono font-extrabold text-emerald-600">
                      {item.speed} km/h
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">Idle</span>
                  )}
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {item.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFleet.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No vehicles found matching current filter.
            </div>
          )}
        </div>
      </div>

      {/* MAP AREA & FLOATING INSPECT DRAWER */}
      <div className="relative flex-1 h-full bg-slate-100">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* FLOATING TELEMETRY INSPECTOR CARD */}
        {selectedVehicleData && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-10 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-white bg-slate-900 px-2 py-0.5 rounded-md">
                  {selectedVehicleData.vehicle.plateNumber || 'KDA 182X'}
                </span>
                <span className="font-display font-bold text-sm text-slate-900">
                  {selectedVehicleData.vehicle.make} {selectedVehicleData.vehicle.model}
                </span>
              </div>
              <button
                onClick={() => setSelectedVehicleId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                  <Gauge className="h-3 w-3 text-teal" /> Speed
                </div>
                <div className="font-mono font-black text-sm text-slate-900">
                  {selectedVehicleData.speed} km/h
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                  <Compass className="h-3 w-3 text-amber-500" /> Heading
                </div>
                <div className="font-mono font-black text-sm text-slate-900">
                  {selectedVehicleData.heading}°
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                  <Battery className="h-3 w-3 text-emerald-500" /> Battery
                </div>
                <div className="font-mono font-black text-sm text-slate-900">
                  {selectedVehicleData.battery !== undefined ? `${selectedVehicleData.battery}%` : '100%'}
                </div>
              </div>
            </div>

            {/* Host & Active Trip Details */}
            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <User className="h-3 w-3" /> Fleet Host:
                </span>
                <span className="font-bold text-slate-900">{selectedVehicleData.vehicle.ownerName}</span>
              </div>

              {selectedVehicleData.activeBooking && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-emerald-700 font-medium">
                  <span>Active Booking:</span>
                  <span className="font-mono font-bold">#{selectedVehicleData.activeBooking.bookingRef}</span>
                </div>
              )}
            </div>

            {/* Follow Button */}
            <button
              onClick={() => setFollowSelected(!followSelected)}
              className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                followSelected
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 shadow-md'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Locate className="h-3.5 w-3.5" />
              {followSelected ? 'Camera Locked to Vehicle (Tap to Release)' : 'Follow Vehicle Camera'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
