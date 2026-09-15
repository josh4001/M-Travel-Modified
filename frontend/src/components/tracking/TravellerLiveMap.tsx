import React, { useEffect, useRef, useState } from 'react';
import {
  Navigation, Locate, AlertTriangle, Battery, Gauge,
  Clock, ZoomIn, ZoomOut, Shield
} from 'lucide-react';
import { useAssignedVehicleLocation } from '@/hooks/useAssignedVehicleLocation';
import { calculateRoadEta } from '@/lib/etaService';
import { createAssignedVehicleIcon } from './AssignedVehicleMarker';
import type { EtaEstimate } from '@/types/tracking';

interface TravellerLiveMapProps {
  tripId: string;
  vehicleModel?: string;
  plateNumber?: string;
  driverName?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupCoords?: [number, number];
  dropoffCoords?: [number, number];
  height?: string;
  userCoords?: [number, number] | null;
  driverLiveCoords?: [number, number] | null;
  driverSpeed?: number;
  driverHeading?: number;
}

export const TravellerLiveMap: React.FC<TravellerLiveMapProps> = ({
  tripId,
  vehicleModel = 'Toyota Land Cruiser Prado',
  plateNumber = 'KDA 182X',
  driverName = 'James Mwangi',
  vehicleType = 'SUV',
  pickupLocation = 'Westlands, Nairobi',
  dropoffLocation = 'Karen, Nairobi',
  pickupCoords = [-1.2650, 36.8050],
  dropoffCoords = [-1.3200, 36.7100],
  height = '420px',
  userCoords = null,
  driverLiveCoords = null,
  driverSpeed,
  driverHeading,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routePolylineBorderRef = useRef<any>(null);
  const leafletModuleRef = useRef<typeof import('leaflet') | null>(null);

  const [followVehicle, setFollowVehicle] = useState(true);
  const [eta, setEta] = useState<EtaEstimate | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Real-time hook subscribing strictly to this assigned trip
  const { location, isStale, statusText, lastUpdatedAt } = useAssignedVehicleLocation({
    tripId,
    fallbackLocation: { lat: pickupCoords[0], lng: pickupCoords[1] },
    staleThresholdSeconds: 40,
  });

  // Current effective vehicle coordinates (driver live GPS takes priority over fallback)
  const currentLat = driverLiveCoords ? driverLiveCoords[0] : (location?.latitude ?? pickupCoords[0]);
  const currentLng = driverLiveCoords ? driverLiveCoords[1] : (location?.longitude ?? pickupCoords[1]);
  const currentHeading = driverHeading !== undefined ? driverHeading : (location?.heading ?? 0);
  const currentSpeed = driverSpeed !== undefined ? driverSpeed : (location?.speed ?? 0);

  // 1. Ensure Leaflet CSS is present in head
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isSubscribed = true;

    import('leaflet').then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager luxury clean tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Pickup Marker Pin (Green Dot)
      const pickupIcon = L.divIcon({
        className: 'pickup-pin',
        html: `
          <div style="background:#0f172a; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.35);">
            <div style="width:10px; height:10px; border-radius:50%; background:#10b981;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(pickupCoords, { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup:</b> ${pickupLocation}`);

      // Dropoff Marker Pin (Red Destination Flag)
      const dropoffIcon = L.divIcon({
        className: 'dropoff-pin',
        html: `
          <div style="background:#ef4444; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.35);">
            <div style="width:8px; height:8px; background:#ffffff; border-radius:1px;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(dropoffCoords, { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${dropoffLocation}`);

      // Initial Vehicle Marker
      const vehicleIcon = createAssignedVehicleIcon(L, {
        heading: currentHeading,
        speed: currentSpeed,
        vehicleType,
        isStale,
        plateNumber,
      });

      const marker = L.marker([currentLat, currentLng], {
        icon: vehicleIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      vehicleMarkerRef.current = marker;
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

  // 3. Update Vehicle Marker Position & Heading Reactively
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !vehicleMarkerRef.current || !leafletModuleRef.current) {
      return;
    }

    const L = leafletModuleRef.current;
    const marker = vehicleMarkerRef.current;
    const map = mapInstanceRef.current;

    // Update position
    marker.setLatLng([currentLat, currentLng]);

    // Update icon with new heading, speed, and stale state
    const updatedIcon = createAssignedVehicleIcon(L, {
      heading: currentHeading,
      speed: currentSpeed,
      vehicleType,
      isStale,
      plateNumber,
    });
    marker.setIcon(updatedIcon);

    // Follow camera if enabled
    if (followVehicle) {
      map.panTo([currentLat, currentLng], { animate: true, duration: 1.0 });
    }
  }, [currentLat, currentLng, currentHeading, currentSpeed, isStale, followVehicle, isMapReady, vehicleType, plateNumber]);

  // 3.1 Update User (Traveler) Live Location Marker Pin
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !leafletModuleRef.current) return;
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;

    if (userCoords && userCoords.length === 2 && !isNaN(userCoords[0]) && !isNaN(userCoords[1])) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userCoords);
      } else {
        const userIcon = L.divIcon({
          className: 'user-live-pin',
          html: `
            <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; inset:0; border-radius:50%; background:rgba(37,99,235,0.3); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="width:20px; height:20px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;">
                <div style="width:6px; height:6px; background:#ffffff; border-radius:50%;"></div>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const uMarker = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1200 })
          .addTo(map)
          .bindPopup(`<b>You (Traveler / Passenger)</b><br/><span style="color:#2563eb;font-weight:bold;">● Live GPS Active</span>`);
        userMarkerRef.current = uMarker;
      }
    } else if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  }, [userCoords, isMapReady]);

  // 4. Calculate Road ETA & Polyline via OSRM
  useEffect(() => {
    let isCancelled = false;

    const targetDestination = location?.status === 'DRIVING_TO_PICKUP'
      ? { lat: pickupCoords[0], lng: pickupCoords[1] }
      : { lat: dropoffCoords[0], lng: dropoffCoords[1] };

    calculateRoadEta(
      { lat: currentLat, lng: currentLng },
      targetDestination,
      currentSpeed
    ).then((result) => {
      if (isCancelled) return;
      setEta(result);

      // Render or update polyline on map
      if (mapInstanceRef.current && leafletModuleRef.current) {
        const L = leafletModuleRef.current;
        const map = mapInstanceRef.current;

        // Remove old lines if exist
        if (routePolylineBorderRef.current) {
          map.removeLayer(routePolylineBorderRef.current);
        }
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }

        // Dark navy border line
        routePolylineBorderRef.current = L.polyline(result.routeCoordinates, {
          color: '#0f172a',
          weight: 7,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        // Vibrant emerald route core line
        routePolylineRef.current = L.polyline(result.routeCoordinates, {
          color: '#10b981',
          weight: 4,
          opacity: 1.0,
          lineCap: 'round',
        }).addTo(map);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentLat, currentLng, pickupCoords, dropoffCoords, location?.status, isMapReady]);

  // Map control helpers
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLat, currentLng], 15, { animate: true });
      setFollowVehicle(true);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />

      {/* TOP FLOATING HUD: STATUS & ETA */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Badge: Status + Plate */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-white shadow-xl border border-slate-700/60">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isStale ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isStale ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>{statusText}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
              <span className="text-amber-400 font-bold">{plateNumber}</span>
              <span>•</span>
              <span>{vehicleModel}</span>
              <span>•</span>
              <span className="text-slate-200">{driverName}</span>
            </div>
          </div>
        </div>

        {/* User GPS Active Badge */}
        {userCoords && (
          <div className="flex items-center gap-1.5 pointer-events-auto bg-blue-600/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-white shadow-xl border border-blue-400/40 text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>Your GPS Live (Uber Mode)</span>
          </div>
        )}

        {/* Right Badge: Live Road ETA & Distance */}
        {eta && (
          <div className="flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Clock className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-xs font-black text-slate-900">
                  {eta.durationMinutes} min
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {eta.distanceKm} km away
                </div>
              </div>
            </div>

            {currentSpeed > 0 && (
              <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-3 text-slate-700">
                <Gauge className="h-4 w-4 text-teal" />
                <span className="text-xs font-bold font-mono">{currentSpeed} km/h</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STALE LOCATION WARNING TOAST */}
      {isStale && (
        <div className="absolute bottom-16 left-4 right-4 z-10 pointer-events-auto flex items-center justify-between rounded-xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-white shadow-2xl text-xs font-semibold animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Vehicle location temporarily unavailable. Retrying GPS connection...</span>
          </div>
          {lastUpdatedAt && (
            <span className="text-[10px] opacity-80 font-mono">
              Last: {lastUpdatedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* FLOATING ACTION BUTTONS (BOTTOM RIGHT) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Follow Vehicle Toggle */}
        <button
          onClick={() => setFollowVehicle(!followVehicle)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg backdrop-blur-md transition ${
            followVehicle
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30'
              : 'bg-white/95 border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          title={followVehicle ? 'Camera following vehicle' : 'Follow vehicle off'}
        >
          <Navigation className={`h-4 w-4 ${followVehicle ? 'animate-pulse' : ''}`} />
        </button>

        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md hover:bg-slate-100 transition"
          title="Recenter on Vehicle"
        >
          <Locate className="h-4 w-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl border border-slate-300 bg-white/95 shadow-lg overflow-hidden backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="flex h-9 w-10 items-center justify-center border-b border-slate-200 text-slate-700 hover:bg-slate-100 transition"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-9 w-10 items-center justify-center text-slate-700 hover:bg-slate-100 transition"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM LEFT: SATELLITE TELEMETRY BADGE */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-2 rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] text-slate-300 font-mono border border-slate-800">
        <Shield className="h-3 w-3 text-emerald-400" />
        <span>Encrypted Trip Telemetry</span>
        {location?.battery_level !== undefined && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Battery className="h-3 w-3 text-amber-400" /> {location.battery_level}%
            </span>
          </>
        )}
      </div>
    </div>
  );
};
