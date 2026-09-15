import React, { useEffect, useRef, useState } from 'react';
import {
  Compass, ZoomIn, ZoomOut, Locate, ChevronRight, Layers
} from 'lucide-react';

interface NavigableKenyaUberMapProps {
  vehicleModel?: string;
  plateNumber?: string;
  driverName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  speed?: number;
  progress?: number;
  height?: string;
}

// Real Kenyan GPS Waypoints along major highways (Nairobi Westlands -> A2 Thika Superhighway / Maasai Mara Corridor)
const KENYA_ROUTE_COORDS: [number, number][] = [
  [-1.2650, 36.8050], // Westlands / Nairobi CBD
  [-1.2720, 36.8180], // Museum Hill / University Way
  [-1.2680, 36.8350], // Pangani Interchange
  [-1.2530, 36.8580], // Muthaiga / Survey of Kenya
  [-1.2380, 36.8790], // Garden City / Roysambu
  [-1.2180, 36.8970], // Kahawa Sukari / KU
  [-1.1480, 36.9600], // Ruiru Bypass Interchange
  [-1.1020, 37.0140], // Juja / JKUAT
  [-1.0390, 37.0760], // Thika Town / Blue Post
  [-1.0250, 37.0850], // Chania Falls Gateway
];

export const NavigableKenyaUberMap: React.FC<NavigableKenyaUberMapProps> = ({
  vehicleModel = 'Toyota Land Cruiser 4x4',
  plateNumber = 'KDA 182X',
  driverName = 'James Mwangi',
  pickupLocation = 'Westlands, Nairobi',
  dropoffLocation = 'Maasai Mara National Reserve',
  speed = 68,
  height = '380px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [mapTheme, setMapTheme] = useState<'streets' | 'satellite'>('streets');
  const [etaMinutes, setEtaMinutes] = useState(4);

  // 1. Dynamically ensure Leaflet CSS is loaded
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // 2. Initialize Leaflet Map centered on Kenya
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      // Fix Leaflet default icon path issues
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current!, {
        center: [-1.2200, 36.8900], // Nairobi / Central Kenya
        zoom: 11,
        zoomControl: false, // Custom styled controls
        scrollWheelZoom: true,
      });

      // CartoDB Voyager / OpenStreetMap Clean Tiles
      const tileUrl = mapTheme === 'streets'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '© OpenStreetMap contributors | M-TRAVEL GPS Kenya',
        maxZoom: 19,
      }).addTo(map);

      // --- Draw Bold Black Uber Route Line ---
      // Outer border
      L.polyline(KENYA_ROUTE_COORDS, {
        color: '#0f172a',
        weight: 7,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Inner route
      const routeLine = L.polyline(KENYA_ROUTE_COORDS, {
        color: '#10b981',
        weight: 4,
        opacity: 1,
        lineCap: 'round',
      }).addTo(map);
      routeLineRef.current = routeLine;

      // --- Start Pin (Pickup) ---
      const startIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background:#0f172a; width:28px; height:28px;
            border-radius:50%; display:flex; align-items:center; justify-content:center;
            border:2.5px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.35);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(KENYA_ROUTE_COORDS[0], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup Location:</b><br/>${pickupLocation}`);

      // --- Destination Pin ---
      const endIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background:#d97706; width:28px; height:28px;
            border-radius:50%; display:flex; align-items:center; justify-content:center;
            border:2.5px solid #ffffff; box-shadow:0 4px 12px rgba(217,119,6,0.4);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(KENYA_ROUTE_COORDS[KENYA_ROUTE_COORDS.length - 1], { icon: endIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b><br/>${dropoffLocation}`);

      // --- Animated Moving Car Marker ---
      const carIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="
              width:40px; height:40px; border-radius:50%; background:#0f172a;
              border:2.5px solid #ffffff; box-shadow:0 4px 14px rgba(0,0,0,0.4);
              display:flex; align-items:center; justify-content:center;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <span style="
              position:absolute; top:-2px; right:-2px; width:12px; height:12px;
              border-radius:50%; background:#10b981; border:2px solid #ffffff;
            "></span>
            <div style="
              background:#000000; color:#fef08a; font-family:monospace; font-weight:bold;
              font-size:9px; padding:1px 5px; border-radius:4px; margin-top:2px; white-space:nowrap;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            ">${plateNumber}</div>
          </div>
        `,
        iconSize: [40, 56],
        iconAnchor: [20, 28],
      });

      const carMarker = L.marker(KENYA_ROUTE_COORDS[0], { icon: carIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui,-apple-system,sans-serif; min-width:160px; padding:2px;">
            <p style="margin:0; font-weight:700; font-size:13px; color:#0f172a;">${vehicleModel}</p>
            <p style="margin:2px 0; color:#64748b; font-size:11px; font-weight:600; text-transform:uppercase;">Plate: ${plateNumber}</p>
            <p style="margin:4px 0; color:#059669; font-weight:600; font-size:11px;">Speed: ${speed} km/h • On Route</p>
            <p style="margin:0; font-size:11px; color:#475569;">Driver: ${driverName}</p>
          </div>
        `);
      carMarkerRef.current = carMarker;

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [mapTheme]);

  // 3. Smooth vehicle animation stepping along the Kenyan highway
  useEffect(() => {
    if (!mapReady || !carMarkerRef.current || !mapInstanceRef.current) return;

    const interval = setInterval(() => {
      setCurrentCoordIndex((prev) => {
        const nextIndex = (prev + 1) % KENYA_ROUTE_COORDS.length;
        const nextCoord = KENYA_ROUTE_COORDS[nextIndex];
        carMarkerRef.current.setLatLng(nextCoord);

        // Update ETA countdown based on progress
        const remaining = Math.max(1, Math.round((KENYA_ROUTE_COORDS.length - nextIndex) * 0.8));
        setEtaMinutes(remaining);

        return nextIndex;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [mapReady]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterOnCar = () => {
    if (!mapInstanceRef.current) return;
    const currentCoord = KENYA_ROUTE_COORDS[currentCoordIndex];
    mapInstanceRef.current.setView(currentCoord, 14, { animate: true });
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then(L => {
      const bounds = L.latLngBounds(KENYA_ROUTE_COORDS);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    });
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-300 shadow-xl bg-slate-950 font-sans">
      {/* 1. TOP FLOATING UBER ETA PILL (Exact Uber Style) */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto max-w-[280px]">
        <div className="flex items-stretch rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-xs cursor-pointer hover:shadow-3xl transition">
          {/* Black ETA square */}
          <div className="bg-black text-white font-black px-3.5 py-2.5 flex flex-col items-center justify-center leading-tight">
            <span className="text-lg font-mono">{etaMinutes}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold">min</span>
          </div>

          {/* Location info */}
          <div className="px-3.5 py-2 flex items-center justify-between gap-2 flex-1 min-w-0">
            <div className="truncate">
              <span className="block text-[11px] font-bold text-slate-900 leading-snug truncate">
                From {pickupLocation}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium truncate">
                {vehicleModel} • {plateNumber}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* 2. TOP RIGHT CONTROLS (Layer & Re-center) */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleCenterOnCar}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800 shadow-lg border border-slate-200 hover:bg-slate-50 transition"
          title="Center on Vehicle GPS"
        >
          <Locate className="h-5 w-5 text-emerald-600" />
        </button>

        <button
          onClick={handleFitBounds}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800 shadow-lg border border-slate-200 hover:bg-slate-50 transition"
          title="Fit Full Route"
        >
          <Compass className="h-5 w-5 text-teal" />
        </button>

        <button
          onClick={() => setMapTheme(t => t === 'streets' ? 'satellite' : 'streets')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800 shadow-lg border border-slate-200 hover:bg-slate-50 transition"
          title="Toggle Map Style"
        >
          <Layers className="h-5 w-5 text-amber-600" />
        </button>
      </div>

      {/* 3. BOTTOM-RIGHT ZOOM BUTTONS */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden text-slate-700 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="p-2.5 hover:bg-slate-100 transition border-b border-slate-100"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 hover:bg-slate-100 transition"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* 4. BOTTOM-LEFT DESTINATION BADGE */}
      <div className="absolute bottom-6 left-4 z-[1000] pointer-events-auto max-w-[260px]">
        <div className="flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span className="truncate">To {dropoffLocation}</span>
        </div>
      </div>

      {/* 5. THE LEAFLET MAP CONTAINER (KENYA) */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
    </div>
  );
};
