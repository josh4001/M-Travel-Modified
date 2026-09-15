import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { publishFleetHostLocation } from '@/lib/driverGpsService';
import type { DriverLiveLocation, TrackingStatus } from '@/types/tracking';

interface UseFleetHostLocationOptions {
  vehicleId?: string;
  tripId?: string;
  initialStatus?: TrackingStatus;
}

export type GpsSignalQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'LOST';

export function useFleetHostLocationTracking(options: UseFleetHostLocationOptions = {}) {
  const user = useSelector((s: RootState) => s.auth.user);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState<DriverLiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsQuality, setGpsQuality] = useState<GpsSignalQuality>('LOST');
  const [bufferedCount, setBufferedCount] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const lastPublishedAtRef = useRef<number>(0);
  const lastLocationRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const statusRef = useRef<TrackingStatus>(options.initialStatus || 'AVAILABLE');
  const vehicleIdRef = useRef<string | undefined>(options.vehicleId);
  const tripIdRef = useRef<string | undefined>(options.tripId);

  // Sync refs when options change
  useEffect(() => {
    if (options.vehicleId) vehicleIdRef.current = options.vehicleId;
    if (options.tripId) tripIdRef.current = options.tripId;
    if (options.initialStatus) statusRef.current = options.initialStatus;
  }, [options.vehicleId, options.tripId, options.initialStatus]);

  // Read battery level if Battery API is supported
  const getBatteryLevel = async (): Promise<number | undefined> => {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch {
      // Battery API not available or restricted
    }
    return undefined;
  };

  /**
   * Determine throttling interval (ms) based on trip status
   */
  const getThrottleIntervalMs = (status: TrackingStatus): number => {
    switch (status) {
      case 'TRIP_IN_PROGRESS':
        return 2000; // 2 seconds during active passenger transit
      case 'DRIVING_TO_PICKUP':
        return 4000; // 4 seconds when driving to pickup
      case 'WAITING_FOR_TOURIST':
      case 'AVAILABLE':
        return 10000; // 10 seconds when available / waiting
      case 'OFFLINE':
      default:
        return 30000; // 30 seconds idle
    }
  };

  /**
   * Evaluates signal quality from position accuracy (meters)
   */
  const evaluateQuality = (accuracyMeters: number): GpsSignalQuality => {
    if (accuracyMeters <= 8) return 'EXCELLENT';
    if (accuracyMeters <= 20) return 'GOOD';
    if (accuracyMeters <= 40) return 'FAIR';
    return 'POOR';
  };

  /**
   * Process and validate GPS position update from browser Geolocation API
   */
  const handlePositionUpdate = useCallback(async (pos: GeolocationPosition) => {
    const coords = pos.coords;
    const now = Date.now();
    const accuracy = Math.round(coords.accuracy);
    setGpsQuality(evaluateQuality(accuracy));

    // 1. Accuracy filter: Ignore updates with accuracy worse than 50 meters unless no fix yet
    if (accuracy > 50 && lastLocationRef.current !== null) {
      return;
    }

    // 2. Throttle checks based on trip phase
    const throttleMs = getThrottleIntervalMs(statusRef.current);
    if (now - lastPublishedAtRef.current < throttleMs) {
      return;
    }

    // 3. Speed & GPS Jump filter: Calculate displacement speed
    let calculatedSpeedKmH = coords.speed ? Math.round(coords.speed * 3.6) : 0;
    let heading = coords.heading ?? 0;

    if (lastLocationRef.current) {
      const dtHours = (now - lastLocationRef.current.time) / (1000 * 3600);
      if (dtHours > 0) {
        // Haversine distance
        const R = 6371;
        const dLat = ((coords.latitude - lastLocationRef.current.lat) * Math.PI) / 180;
        const dLon = ((coords.longitude - lastLocationRef.current.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lastLocationRef.current.lat * Math.PI) / 180) *
            Math.cos((coords.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;
        const jumpSpeedKmH = distanceKm / dtHours;

        // Reject impossible GPS teleportation (> 180 km/h)
        if (jumpSpeedKmH > 180) {
          console.warn(`GPS Jump filtered: impossible displacement of ${jumpSpeedKmH.toFixed(0)} km/h`);
          return;
        }

        if (!coords.speed) {
          calculatedSpeedKmH = Math.min(140, Math.round(jumpSpeedKmH));
        }

        // Calculate heading if browser returns null
        if (!coords.heading && distanceKm > 0.005) {
          const y = Math.sin(dLon) * Math.cos((coords.latitude * Math.PI) / 180);
          const x =
            Math.cos((lastLocationRef.current.lat * Math.PI) / 180) *
              Math.sin((coords.latitude * Math.PI) / 180) -
            Math.sin((lastLocationRef.current.lat * Math.PI) / 180) *
              Math.cos((coords.latitude * Math.PI) / 180) *
              Math.cos(dLon);
          heading = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
        }
      }
    }

    lastLocationRef.current = { lat: coords.latitude, lng: coords.longitude, time: now };
    lastPublishedAtRef.current = now;

    const batteryLevel = await getBatteryLevel();

    const telemetry: DriverLiveLocation = {
      driver_id: user?.id || 'host-001',
      trip_id: tripIdRef.current || 'TRIP-AVAILABLE',
      vehicle_id: vehicleIdRef.current || 'v-default',
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: calculatedSpeedKmH,
      heading,
      accuracy,
      status: statusRef.current,
      battery_level: batteryLevel,
      recorded_at: new Date(pos.timestamp).toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCurrentTelemetry(telemetry);

    // Upsert into Supabase driver_live_locations
    await publishFleetHostLocation(telemetry);

    // Update buffered count for offline awareness
    try {
      const raw = localStorage.getItem('mt_offline_gps_buffer');
      setBufferedCount(raw ? JSON.parse(raw).length : 0);
    } catch {}
  }, [user]);

  /**
   * Start live GPS publishing
   */
  const startTracking = useCallback(
    async (overrideVehicleId?: string, overrideTripId?: string): Promise<boolean> => {
      if (overrideVehicleId) vehicleIdRef.current = overrideVehicleId;
      if (overrideTripId) tripIdRef.current = overrideTripId;

      if (!('geolocation' in navigator)) {
        setError('Geolocation is not supported by your browser.');
        setGpsQuality('LOST');
        return false;
      }

      setError(null);
      setIsPublishing(true);

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => handlePositionUpdate(pos),
        (err) => {
          console.warn('Geolocation watch error:', err.message);
          setError(`GPS signal issue: ${err.message}`);
          setGpsQuality('LOST');
        },
        options
      );

      return true;
    },
    [handlePositionUpdate]
  );

  /**
   * Stop tracking and signal offline
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsPublishing(false);
    setGpsQuality('LOST');

    if (currentTelemetry) {
      const offlineTelemetry: DriverLiveLocation = {
        ...currentTelemetry,
        status: 'OFFLINE',
        speed: 0,
        updated_at: new Date().toISOString(),
      };
      publishFleetHostLocation(offlineTelemetry);
      setCurrentTelemetry(offlineTelemetry);
    }
  }, [currentTelemetry]);

  /**
   * Change host trip status (e.g. AVAILABLE -> DRIVING_TO_PICKUP -> TRIP_IN_PROGRESS)
   */
  const setTripStatus = useCallback((newStatus: TrackingStatus) => {
    statusRef.current = newStatus;
    if (currentTelemetry) {
      const updated: DriverLiveLocation = {
        ...currentTelemetry,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      setCurrentTelemetry(updated);
      publishFleetHostLocation(updated);
    }
  }, [currentTelemetry]);

  // Clean up geolocation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isPublishing,
    startTracking,
    stopTracking,
    setTripStatus,
    currentTelemetry,
    error,
    gpsQuality,
    bufferedCount,
  };
}
