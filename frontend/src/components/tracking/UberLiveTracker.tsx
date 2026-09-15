import { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Phone, MessageSquare, Shield, Navigation,
  CheckCircle2, Star, X, Radio, Locate, Play, Pause, AlertCircle, RotateCcw
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { TourTimeline } from '@/components/tracking/TourTimeline';
import { TravellerLiveMap } from '@/components/tracking/TravellerLiveMap';
import { calculateRoadEta, interpolateAlongRoute } from '@/lib/etaService';

export interface TrackingVehicle {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  type?: string;
  seats?: number;
  seatingCapacity?: number;
  pricePerDay?: number | string;
  dailyRate?: number | string;
  plateNumber?: string;
  images?: any[];
  owner?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    avatar?: string;
    email?: string;
    [key: string]: any;
  } | any;
  driverName?: string;
  [key: string]: any;
}

interface UberLiveTrackerProps {
  vehicle: TrackingVehicle | Vehicle | any;
  bookingRef: string;
  tripId?: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupCoords?: [number, number];
  dropoffCoords?: [number, number];
  viewerRole?: 'TOURIST' | 'DRIVER' | 'ADMIN';
  onClose?: () => void;
}

export function UberLiveTracker({
  vehicle,
  bookingRef,
  tripId,
  pickupLocation = 'Westlands, Nairobi',
  dropoffLocation = 'Maasai Mara National Reserve',
  pickupCoords = [-1.2650, 36.8050],
  dropoffCoords = [-1.3200, 36.7100],
  viewerRole = 'TOURIST',
  onClose,
}: UberLiveTrackerProps) {
  const effectiveTripId = tripId || bookingRef;

  // Uber-style Role Selection & GPS state
  const [myRole, setMyRole] = useState<'TOURIST' | 'DRIVER' | 'ADMIN'>(viewerRole);
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Live coordinates
  const [travelerCoords, setTravelerCoords] = useState<[number, number] | null>(null);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  const [driverSpeed, setDriverSpeed] = useState<number>(58);
  const [driverHeading, setDriverHeading] = useState<number>(45);

  // Simulation mode for testing drive without moving physically
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [simMultiplier, setSimMultiplier] = useState<number>(2);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const simFractionRef = useRef(0);
  const simRafIdRef = useRef<number | null>(null);
  const simLastTimeRef = useRef(0);
  const simLastBroadcastRef = useRef(0);
  const smoothedHeadingRef = useRef(0);

  // Fetch full turn-by-turn road route
  useEffect(() => {
    let isMounted = true;
    calculateRoadEta(
      { lat: pickupCoords[0], lng: pickupCoords[1] },
      { lat: dropoffCoords[0], lng: dropoffCoords[1] }
    ).then((res) => {
      if (isMounted && res.routeCoordinates?.length > 1) {
        setRouteCoords(res.routeCoordinates);
      }
    });
    return () => { isMounted = false; };
  }, [pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]]);

  // Trip progress indicator
  const [progress, setProgress] = useState(35);

  // Geolocation watch ID
  const watchIdRef = useRef<number | null>(null);

  // 1. Check local storage on mount for existing broadcasted coordinates for this trip
  useEffect(() => {
    try {
      const savedTraveler = localStorage.getItem(`mt_gps_traveler_${effectiveTripId}`);
      if (savedTraveler) {
        const parsed = JSON.parse(savedTraveler);
        if (parsed?.lat && parsed?.lng) {
          setTravelerCoords([parsed.lat, parsed.lng]);
        }
      }

      const savedDriver = localStorage.getItem(`mt_gps_driver_${effectiveTripId}`);
      if (savedDriver) {
        const parsed = JSON.parse(savedDriver);
        if (parsed?.lat && parsed?.lng) {
          setDriverCoords([parsed.lat, parsed.lng]);
          if (parsed.speed) setDriverSpeed(parsed.speed);
          if (parsed.heading) setDriverHeading(parsed.heading);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [effectiveTripId]);

  // 2. Listen for cross-tab or cross-component GPS broadcast events
  useEffect(() => {
    const handleBroadcast = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (!data || data.tripId !== effectiveTripId) return;

      if (data.type === 'TOURIST' && data.lat && data.lng) {
        setTravelerCoords([data.lat, data.lng]);
      } else if (data.type === 'DRIVER' && data.lat && data.lng) {
        if (isSimulatingDrive) return; // Prevent local simulation feedback loop
        setDriverCoords([data.lat, data.lng]);
        if (data.speed !== undefined) setDriverSpeed(data.speed);
        if (data.heading !== undefined) setDriverHeading(data.heading);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `mt_gps_traveler_${effectiveTripId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.lat && parsed?.lng) setTravelerCoords([parsed.lat, parsed.lng]);
        } catch { /* empty */ }
      }
      if (e.key === `mt_gps_driver_${effectiveTripId}` && e.newValue) {
        if (isSimulatingDrive) return; // Prevent local simulation feedback loop
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.lat && parsed?.lng) {
            setDriverCoords([parsed.lat, parsed.lng]);
            if (parsed.speed) setDriverSpeed(parsed.speed);
            if (parsed.heading) setDriverHeading(parsed.heading);
          }
        } catch { /* empty */ }
      }
    };

    window.addEventListener('mt_live_gps_broadcast', handleBroadcast);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('mt_live_gps_broadcast', handleBroadcast);
      window.removeEventListener('storage', handleStorage);
    };
  }, [effectiveTripId]);

  // 3. Handle device GPS Toggle (Uber style)
  useEffect(() => {
    if (!isGpsEnabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsGpsEnabled(false);
      return;
    }

    setGpsError(null);

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : (myRole === 'DRIVER' ? 45 : 0);
        const headingDeg = pos.coords.heading || 0;

        if (myRole === 'TOURIST') {
          setTravelerCoords([lat, lng]);
          const payload = { lat, lng, timestamp: Date.now() };
          try {
            localStorage.setItem(`mt_gps_traveler_${effectiveTripId}`, JSON.stringify(payload));
          } catch { /* empty */ }
          window.dispatchEvent(new CustomEvent('mt_live_gps_broadcast', {
            detail: { tripId: effectiveTripId, type: 'TOURIST', lat, lng }
          }));
        } else if (myRole === 'DRIVER') {
          setDriverCoords([lat, lng]);
          setDriverSpeed(speedKmh);
          setDriverHeading(headingDeg);
          const payload = { lat, lng, speed: speedKmh, heading: headingDeg, timestamp: Date.now() };
          try {
            localStorage.setItem(`mt_gps_driver_${effectiveTripId}`, JSON.stringify(payload));
          } catch { /* empty */ }
          window.dispatchEvent(new CustomEvent('mt_live_gps_broadcast', {
            detail: { tripId: effectiveTripId, type: 'DRIVER', lat, lng, speed: speedKmh, heading: headingDeg }
          }));
        }
      },
      (err) => {
        setGpsError(err.message || 'Unable to retrieve your location. Check browser permissions.');
        setIsGpsEnabled(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isGpsEnabled, myRole, effectiveTripId]);

function smoothAngle(current: number, target: number, factor = 0.2): number {
  let diff = (target - current) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (current + diff * factor + 360) % 360;
}

  // 4. Smooth 60 FPS Road-Tracking Drive Simulation
  useEffect(() => {
    if (!isSimulatingDrive) {
      if (simRafIdRef.current !== null) {
        cancelAnimationFrame(simRafIdRef.current);
        simRafIdRef.current = null;
      }
      return;
    }

    const points = routeCoords.length > 1
      ? routeCoords
      : [pickupCoords, dropoffCoords];

    if (smoothedHeadingRef.current === 0 && points.length > 1) {
      smoothedHeadingRef.current = interpolateAlongRoute(points, 0).heading;
    }

    simLastTimeRef.current = performance.now();
    simLastBroadcastRef.current = performance.now();

    const animate = (now: number) => {
      const deltaSec = Math.min((now - simLastTimeRef.current) / 1000, 0.05); // cap delta to 50ms
      simLastTimeRef.current = now;

      // Realistic preview pacing:
      // ~36 seconds for the entire route at 1x, ~18 seconds at 2x, ~9 seconds at 4x
      const targetDurationSec = 36 / (simMultiplier || 2);
      simFractionRef.current += (deltaSec / targetDurationSec);

      if (simFractionRef.current >= 1) {
        simFractionRef.current = 0; // seamless loop
      }

      const fraction = simFractionRef.current;
      const interp = interpolateAlongRoute(points, fraction);

      // Smooth heading with shortest-arc slerp to eliminate any micro-segment twitch
      smoothedHeadingRef.current = smoothAngle(smoothedHeadingRef.current, interp.heading, 0.22);
      const finalHeading = Math.round(smoothedHeadingRef.current);
      const displaySpeed = interp.isCurving ? 42 : 68;

      setDriverCoords([interp.lat, interp.lng]);
      setDriverHeading(finalHeading);
      setDriverSpeed(displaySpeed);

      const newProgress = Math.round(fraction * 100);
      setProgress((prev) => (prev !== newProgress ? newProgress : prev));

      // Throttled cross-tab broadcast (every 400ms)
      if (now - simLastBroadcastRef.current > 400) {
        simLastBroadcastRef.current = now;
        const payload = {
          lat: interp.lat,
          lng: interp.lng,
          speed: displaySpeed,
          heading: finalHeading,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem(`mt_gps_driver_${effectiveTripId}`, JSON.stringify(payload));
        } catch { /* empty */ }
        window.dispatchEvent(new CustomEvent('mt_live_gps_broadcast', {
          detail: {
            tripId: effectiveTripId,
            type: 'DRIVER',
            lat: interp.lat,
            lng: interp.lng,
            speed: displaySpeed,
            heading: finalHeading,
          }
        }));
      }

      simRafIdRef.current = requestAnimationFrame(animate);
    };

    simRafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (simRafIdRef.current !== null) {
        cancelAnimationFrame(simRafIdRef.current);
        simRafIdRef.current = null;
      }
    };
  }, [isSimulatingDrive, routeCoords, simMultiplier, effectiveTripId, pickupCoords, dropoffCoords]);

  const handleRestartSim = () => {
    simFractionRef.current = 0;
    setProgress(0);
    const points = routeCoords.length > 1 ? routeCoords : [pickupCoords, dropoffCoords];
    if (points.length > 0) {
      setDriverCoords([points[0][0], points[0][1]]);
      const initialInterp = interpolateAlongRoute(points, 0);
      smoothedHeadingRef.current = initialInterp.heading;
      setDriverHeading(Math.round(initialInterp.heading));
    }
  };

  const driverName = (vehicle?.owner?.firstName || vehicle?.owner?.lastName)
    ? `${vehicle.owner?.firstName || ''} ${vehicle.owner?.lastName || ''}`.trim()
    : (vehicle?.driverName || 'Safari Host');
  const driverPhone = vehicle?.owner?.phone || '+254 712 345 678';
  const plateNumber = vehicle?.plateNumber || `KDA ${Math.floor(100 + Math.random() * 899)}X`;

  return (
    <div className="glass-card-3d overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal via-emerald-500 to-amber-500 shadow-glow">
            <Car className="h-5 w-5 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-900 text-base">Uber-Style Live Ride GPS Monitor</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-600 border border-emerald-500/30 font-bold animate-pulse">
                ● Live Kenya GPS
              </span>
            </div>
            <p className="text-xs text-slate-500">Booking #{bookingRef} · Vehicle: {vehicle.make} {vehicle.model} ({plateNumber})</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
              title="Close Tracker"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* UBER GPS CONTROLS BAR: TURN ON GPS AS USER, DRIVER, OR ADMIN MONITOR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 border-b border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Identity Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Role:</span>
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setMyRole('TOURIST')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  myRole === 'TOURIST' ? 'bg-teal text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                👤 Traveler / Passenger
              </button>
              <button
                type="button"
                onClick={() => setMyRole('DRIVER')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  myRole === 'DRIVER' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🚗 Driver / Host
              </button>
              <button
                type="button"
                onClick={() => setMyRole('ADMIN')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  myRole === 'ADMIN' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Admin Radar
              </button>
            </div>
          </div>

          {/* GPS Toggle & Drive Simulator */}
          <div className="flex items-center gap-2">
            {myRole !== 'ADMIN' && (
              <button
                type="button"
                onClick={() => setIsGpsEnabled(!isGpsEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                  isGpsEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                }`}
              >
                <Locate className="h-4 w-4" />
                {isGpsEnabled ? '● Your GPS is ON (Broadcasting Live)' : 'Turn On My GPS Location'}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                  isSimulatingDrive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Test vehicle movement along road polyline"
              >
                {isSimulatingDrive ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5" />}
                {isSimulatingDrive ? 'Pause Drive' : 'Simulate Drive'}
              </button>

              {/* Speed Multiplier & Restart Controls */}
              {isSimulatingDrive && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-[11px] font-mono">
                    {([1, 2, 4] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSimMultiplier(m)}
                        className={`px-2 py-0.5 rounded-lg transition ${
                          simMultiplier === m
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={`${m}x Simulation Speed`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleRestartSim}
                    className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
                    title="Restart from Pick-up"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicators row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${travelerCoords ? 'bg-blue-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-slate-300">
                Traveler GPS: {travelerCoords ? <strong className="text-blue-400 font-mono">Live ({travelerCoords[0].toFixed(4)}, {travelerCoords[1].toFixed(4)})</strong> : 'Waiting for location'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${driverCoords ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-slate-300">
                Driver GPS: {driverCoords ? <strong className="text-emerald-400 font-mono">Live ({driverCoords[0].toFixed(4)}, {driverCoords[1].toFixed(4)}) · {driverSpeed} km/h</strong> : 'Stationary / En Route'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Radio className="h-3 w-3 text-teal" />
            <span>Encrypted M-TRAVEL Uber Telemetry Active</span>
          </div>
        </div>

        {gpsError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-300 bg-red-950/50 border border-red-800 rounded-lg p-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* MODIFIED UBER REAL-TIME LEAFLET GPS MAP (ONLY MODIFIED GPS MAP) */}
      <div className="p-4 pb-0">
        <TravellerLiveMap
          tripId={effectiveTripId}
          vehicleModel={`${vehicle?.make || 'Toyota'} ${vehicle?.model || 'Land Cruiser'}`}
          plateNumber={plateNumber}
          driverName={driverName}
          vehicleType={vehicle?.type || 'SUV'}
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          userCoords={travelerCoords}
          driverLiveCoords={driverCoords}
          driverSpeed={driverSpeed}
          driverHeading={driverHeading}
          routeCoordinates={routeCoords}
          height="420px"
        />
      </div>

      {/* TRIP STATUS PROGRESS BAR */}
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-900">
            <span className="flex items-center gap-1 text-teal">
              <CheckCircle2 className="h-3.5 w-3.5" /> Driver Assigned
            </span>
            <span className={progress >= 30 ? 'text-teal font-bold' : 'text-slate-400'}>En Route</span>
            <span className={progress >= 70 ? 'text-teal font-bold' : 'text-slate-400'}>On Trip</span>
            <span className={progress >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Arrived</span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal via-amber-500 to-emerald-500 transition-all duration-700 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* DRIVER & VEHICLE DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-amber-400 to-teal p-0.5">
              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-amber-400 text-lg">
                {driverName.charAt(0)}
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-slate-900 text-sm">{driverName}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center text-amber-600 gap-0.5 font-semibold">
                  <Star className="h-3 w-3 fill-amber-500" /> 4.9
                </span>
                <span>• 340 Trips</span>
                <span className="rounded bg-teal/20 px-1.5 py-0.5 text-[10px] font-mono text-teal font-semibold">Verified Driver</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div>
              <span className="block text-[10px] text-slate-500">Vehicle</span>
              <span className="font-display font-semibold text-slate-900 text-sm">
                {vehicle.make} {vehicle.model}
              </span>
              <span className="block font-mono text-xs text-amber-600 font-bold">{plateNumber}</span>
            </div>

            <div className="flex gap-2">
              <a
                href={`tel:${driverPhone}`}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a
                href={`https://wa.me/${driverPhone.replace(/\+/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-teal/40 bg-teal/10 px-3 py-2 text-xs font-semibold text-teal hover:bg-teal/20 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </a>
            </div>
          </div>
        </div>

        {/* TRIP ROUTE INFORMATION */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-500 mb-1">Pick-up Location</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{pickupLocation}</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-500 mb-1">Destination</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Navigation className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{dropoffLocation}</span>
            </div>
          </div>
        </div>

        {/* TOUR TIMELINE WITH MULTI-STOP PROGRESS */}
        <TourTimeline
          currentStatus={progress >= 100 ? 'TRIP_COMPLETED' : progress >= 30 ? 'TRIP_IN_PROGRESS' : 'DRIVING_TO_PICKUP'}
          pickupLocation={pickupLocation}
          destinationLocation={dropoffLocation}
        />

        {/* SAFETY & SOS */}
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-50 p-3 text-xs text-red-700">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-red-600" />
            <span>24/7 M-TRAVEL Emergency Roadside & Trip Safety active</span>
          </div>
          <button
            onClick={() => alert('Emergency SOS Alert sent to M-TRAVEL Support and local authorities!')}
            className="rounded-lg bg-red-600 px-3 py-1 text-white font-bold text-[11px] hover:bg-red-700 transition shadow-sm"
          >
            SOS
          </button>
        </div>
      </div>
    </div>
  );
}
