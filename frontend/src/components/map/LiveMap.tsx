import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Zap } from 'lucide-react';

interface MapVehicle {
  id: string;
  make: string;
  model: string;
  type: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  price_per_day: number;
  rating_average: number;
}

interface LiveMapProps {
  vehicles?: MapVehicle[];
  selectedId?: string;
  onSelectVehicle?: (v: MapVehicle) => void;
  height?: string;
  showUserLocation?: boolean;
  trackingMode?: boolean;
}

const TYPE_EMOJI: Record<string, string> = { CAR: '🚗', SUV: '🚙', VAN: '🚐', PICKUP: '🛻' };

export default function LiveMap({
  vehicles = [],
  selectedId,
  onSelectVehicle,
  height = '420px',
  showUserLocation = true,
  trackingMode = false,
}: LiveMapProps) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState('');

  // Dynamically load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, {
        center: [-1.2921, 36.8219], // Nairobi default (will be overridden by vehicle bounds)
        zoom: trackingMode ? 15 : 13, // tight zoom — vehicle area, not full Kenya
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | M-TRAVEL GPS',
        maxZoom: 19,
      }).addTo(map);

      mapInst.current = map;
      setMapReady(true);
    });

    return () => {
      mapInst.current?.remove();
      mapInst.current = null;
    };
  }, []);

  // Add vehicle markers
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    import('leaflet').then(L => {
      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      vehicles.forEach(v => {
        if (!v.latitude || !v.longitude) return;
        const isSelected = v.id === selectedId;
        const emoji = TYPE_EMOJI[v.type] ?? '🚗';
        const color = v.is_available ? (isSelected ? '#f59e0b' : '#14b8a6') : '#ef4444';

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              display:flex; align-items:center; justify-content:center;
              width:${isSelected ? '44px' : '36px'}; height:${isSelected ? '44px' : '36px'};
              border-radius:50%;
              background:${color}22;
              border:2px solid ${color};
              box-shadow:0 0 ${isSelected ? '12px' : '4px'} ${color}88;
              font-size:${isSelected ? '20px' : '16px'};
              transition:all 0.3s;
              cursor:pointer;
            ">${emoji}</div>`,
          iconSize: [isSelected ? 44 : 36, isSelected ? 44 : 36],
          iconAnchor: [isSelected ? 22 : 18, isSelected ? 22 : 18],
        });

        const marker = L.marker([v.latitude, v.longitude], { icon })
          .addTo(mapInst.current)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px;">
              <p style="font-weight:bold;font-size:14px;margin:0 0 4px">${emoji} ${v.make} ${v.model}</p>
              <p style="color:#888;font-size:11px;margin:0 0 6px">${v.type}</p>
              <p style="color:${v.is_available ? '#14b8a6' : '#ef4444'};font-size:12px;font-weight:bold;margin:0 0 4px">
                ${v.is_available ? '✅ Available' : '❌ Unavailable'}
              </p>
              <p style="font-size:12px;margin:0">⭐ ${v.rating_average?.toFixed(1)} &nbsp;|&nbsp; KES ${Number(v.price_per_day).toLocaleString()}/day</p>
            </div>
          `);

        if (onSelectVehicle) {
          marker.on('click', () => onSelectVehicle(v));
        }

        markersRef.current.push(marker);
      });

      // If tracking mode, animate one vehicle moving
      if (trackingMode && vehicles.length > 0) {
        const v = vehicles[0];
        let frame = 0;
        const animate = () => {
          if (!mapInst.current) return;
          frame++;
          const lat = v.latitude + Math.sin(frame / 20) * 0.002;
          const lng = v.longitude + Math.cos(frame / 20) * 0.002;
          markersRef.current[0]?.setLatLng([lat, lng]);
          setTimeout(animate, 1000);
        };
        setTimeout(animate, 2000);
      }

      // Fit bounds to vehicle locations — never show full Kenya
      if (vehicles.length > 1 && !trackingMode) {
        const validVehicles = vehicles.filter(v => v.latitude && v.longitude);
        if (validVehicles.length > 1) {
          const bounds = L.latLngBounds(
            validVehicles.map(v => [v.latitude, v.longitude] as [number, number])
          );
          mapInst.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        } else if (validVehicles.length === 1) {
          mapInst.current.setView([validVehicles[0].latitude, validVehicles[0].longitude], 15);
        }
      } else if (vehicles.length === 1) {
        // Single vehicle — zoom in tight to show road-level area
        mapInst.current.setView([vehicles[0].latitude, vehicles[0].longitude], 15);
      } else if (trackingMode && vehicles.length > 0) {
        // Tracking mode: center on first vehicle at street zoom
        mapInst.current.setView([vehicles[0].latitude, vehicles[0].longitude], 15);
      }
    });
  }, [mapReady, vehicles, selectedId, onSelectVehicle, trackingMode]);

  // User GPS location
  useEffect(() => {
    if (!showUserLocation || !mapReady || !mapInst.current) return;
    import('leaflet').then(L => {
      navigator.geolocation?.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;">
              <div style="
                width:16px; height:16px; border-radius:50%;
                background:#3b82f6; border:3px solid white;
                box-shadow:0 0 12px #3b82f688;
              "></div>
              <div style="
                position:absolute; top:-4px; left:-4px;
                width:24px; height:24px; border-radius:50%;
                background:#3b82f622; border:1px solid #3b82f655;
                animation: ping 1.5s ease-in-out infinite;
              "></div>
            </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        userMarkerRef.current?.remove();
        userMarkerRef.current = L.marker([latitude, longitude], { icon })
          .addTo(mapInst.current)
          .bindPopup('<b>📍 Your Location</b>');

        if (vehicles.length === 0) {
          mapInst.current.setView([latitude, longitude], 13);
        }
      }, () => setError('Location access denied'));
    });
  }, [showUserLocation, mapReady, vehicles.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      {/* Map header bar */}
      <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center justify-between bg-ink/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-bone/70">
          <Navigation className="h-3.5 w-3.5 text-teal animate-pulse" />
          <span>Live GPS Map — Kenya</span>
          {vehicles.length > 0 && (
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-teal font-mono font-bold">
              {vehicles.filter(v => v.is_available).length} Available
            </span>
          )}
        </div>
        {userPos && (
          <span className="flex items-center gap-1 text-[10px] text-blue-400">
            <MapPin className="h-3 w-3" /> Your location active
          </span>
        )}
        {trackingMode && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 animate-pulse">
            <Zap className="h-3 w-3" /> LIVE TRACKING
          </span>
        )}
      </div>

      {error && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-coral/20 border border-coral/30 px-3 py-2 text-xs text-coral">
          {error}
        </div>
      )}

      <div ref={mapRef} style={{ height, width: '100%', background: '#0d1117' }} />
    </div>
  );
}
