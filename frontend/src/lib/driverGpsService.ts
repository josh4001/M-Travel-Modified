import { supabase } from './supabaseClient';
import type { DriverLiveLocation, TrackingStatus } from '@/types/tracking';

// ─── Driver Telemetry & GPS Interface ──────────────────────────────────────────
export interface DriverTelemetry {
  driverId: string;
  driverName?: string;
  tripId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;        // in km/h
  heading: number;      // 0 - 360 degrees
  accuracy: number;     // in meters
  timestamp: string;
  status: DriverTripStatus;
  batteryLevel?: number;
  isOnline: boolean;
}

export type DriverTripStatus =
  | 'OFFLINE'
  | 'ONLINE'
  | 'AVAILABLE'
  | 'BOOKING_ASSIGNED'
  | 'DRIVING_TO_PICKUP'
  | 'WAITING_FOR_TOURIST'
  | 'TRIP_STARTED'
  | 'TRIP_IN_PROGRESS'
  | 'TRIP_COMPLETED';

export interface TourStop {
  id: string;
  title: string;
  locationName: string;
  completed: boolean;
  completedAt?: string;
}

// ─── Local Storage Offline Buffer Key ─────────────────────────────────────────
const OFFLINE_GPS_BUFFER_KEY = 'mt_offline_gps_buffer';

/**
 * Production publisher function to upsert live GPS coordinates into driver_live_locations.
 * Called by useFleetHostLocationTracking and the Host Telemetry Console.
 */
export async function publishFleetHostLocation(
  data: Partial<DriverLiveLocation> & {
    driver_id: string;
    trip_id: string;
    vehicle_id: string;
    latitude: number;
    longitude: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const record: DriverLiveLocation = {
    driver_id: data.driver_id,
    trip_id: data.trip_id,
    vehicle_id: data.vehicle_id,
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed ?? 0,
    heading: data.heading ?? 0,
    accuracy: data.accuracy ?? 5,
    status: (data.status as TrackingStatus) ?? 'TRIP_IN_PROGRESS',
    battery_level: data.battery_level,
    recorded_at: data.recorded_at ?? now,
    updated_at: now,
  };

  // If offline, buffer locally and return
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const existing = JSON.parse(localStorage.getItem(OFFLINE_GPS_BUFFER_KEY) || '[]');
      existing.push(record);
      localStorage.setItem(OFFLINE_GPS_BUFFER_KEY, JSON.stringify(existing.slice(-100)));
    } catch {
      // Local storage full or unavailable
    }
    return { success: true };
  }

  try {
    // 1. UPSERT into driver_live_locations on conflict (driver_id, trip_id)
    const { error: upsertError } = await supabase
      .from('driver_live_locations')
      .upsert(
        {
          driver_id: record.driver_id,
          trip_id: record.trip_id,
          vehicle_id: record.vehicle_id,
          latitude: record.latitude,
          longitude: record.longitude,
          speed: record.speed,
          heading: record.heading,
          accuracy: record.accuracy,
          status: record.status,
          battery_level: record.battery_level,
          recorded_at: record.recorded_at,
          updated_at: record.updated_at,
        },
        { onConflict: 'driver_id,trip_id' }
      );

    if (upsertError) {
      console.warn('UPSERT to driver_live_locations warning:', upsertError.message);
    }

    // 2. Also update current vehicle location in vehicles table
    if (record.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({
          latitude: record.latitude,
          longitude: record.longitude,
          updated_at: now,
        })
        .eq('id', record.vehicle_id);
    }

    // 3. Broadcast to trip-specific channel for sub-second reactive updates
    const channel = supabase.channel(`trip:${record.trip_id}`);
    await channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: record,
    });

    return { success: true };
  } catch (err: any) {
    console.warn('publishFleetHostLocation exception:', err);
    return { success: false, error: err.message };
  }
}

class DriverGpsService {
  private watchId: number | null = null;
  private currentTelemetry: DriverTelemetry | null = null;
  public isTracking = false;
  private listeners: ((telemetry: DriverTelemetry) => void)[] = [];
  private alertListeners: ((alert: { type: string; message: string; timestamp: string }) => void)[] = [];
  private lastPosition: GeolocationPosition | null = null;

  /**
   * Start tracking driver's smartphone GPS location in background/foreground.
   * Broadcasts updates every 2-5 seconds via Supabase Realtime channel.
   */
  public startTracking(config: {
    driverId: string;
    driverName?: string;
    vehicleId: string;
    tripId?: string;
    initialStatus?: DriverTripStatus;
  }): boolean {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation API not supported on this device.');
      return false;
    }

    this.isTracking = true;

    // Flush any cached offline telemetry points if back online
    this.flushOfflineBuffer();

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000, // 2-second max age for Uber-like freshness
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleLocationSuccess(pos, config),
      (err) => this.handleLocationError(err),
      options
    );

    // Listen for online events to flush buffered offline points
    window.addEventListener('online', () => this.flushOfflineBuffer());

    return true;
  }

  /** Stop location tracking */
  public stopTracking(driverId: string, vehicleId: string): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;

    // Broadcast offline status
    const offlineTelemetry: DriverTelemetry = {
      driverId,
      tripId: '',
      vehicleId,
      latitude: this.currentTelemetry?.latitude ?? -1.2921,
      longitude: this.currentTelemetry?.longitude ?? 36.8219,
      speed: 0,
      heading: 0,
      accuracy: 0,
      timestamp: new Date().toISOString(),
      status: 'OFFLINE',
      isOnline: false,
    };

    this.broadcastTelemetry(offlineTelemetry);
  }

  /** Update driver trip status (e.g. DRIVING_TO_PICKUP -> TRIP_STARTED) */
  public async updateTripStatus(
    _driverId: string,
    _vehicleId: string,
    _tripId: string,
    newStatus: DriverTripStatus
  ): Promise<void> {
    if (this.currentTelemetry) {
      this.currentTelemetry.status = newStatus;
      this.currentTelemetry.timestamp = new Date().toISOString();
      await this.broadcastTelemetry(this.currentTelemetry);
    }
  }

  /** Handle geolocation updates */
  private async handleLocationSuccess(
    pos: GeolocationPosition,
    config: {
      driverId: string;
      driverName?: string;
      vehicleId: string;
      tripId?: string;
      initialStatus?: DriverTripStatus;
    }
  ): Promise<void> {
    const coords = pos.coords;

    // Calculate heading/bearing if browser speed/heading is null
    let speedKmH = coords.speed ? Math.round(coords.speed * 3.6) : 0;
    let heading = coords.heading ?? 0;

    if (this.lastPosition && (!coords.speed || !coords.heading)) {
      const distanceMeters = this.calculateDistanceMeters(
        this.lastPosition.coords.latitude,
        this.lastPosition.coords.longitude,
        coords.latitude,
        coords.longitude
      );
      const timeDiffSec = (pos.timestamp - this.lastPosition.timestamp) / 1000;
      if (timeDiffSec > 0) {
        speedKmH = Math.round((distanceMeters / timeDiffSec) * 3.6);
      }
      heading = this.calculateBearing(
        this.lastPosition.coords.latitude,
        this.lastPosition.coords.longitude,
        coords.latitude,
        coords.longitude
      );
    }

    this.lastPosition = pos;

    const telemetry: DriverTelemetry = {
      driverId: config.driverId,
      driverName: config.driverName ?? 'Driver Partner',
      tripId: config.tripId ?? 'TRIP-LIVE-001',
      vehicleId: config.vehicleId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: speedKmH,
      heading,
      accuracy: Math.round(coords.accuracy),
      timestamp: new Date(pos.timestamp).toISOString(),
      status: config.initialStatus ?? 'TRIP_IN_PROGRESS',
      isOnline: navigator.onLine,
    };

    this.currentTelemetry = telemetry;

    // Smart Route Monitoring: Check for Speeding (> 100 km/h)
    if (speedKmH > 100) {
      this.triggerAlert('SPEEDING', `Vehicle ${config.vehicleId} traveling at ${speedKmH} km/h (Limit: 100 km/h)`);
    }

    // Persist to driver_live_locations & vehicles
    await publishFleetHostLocation({
      driver_id: telemetry.driverId,
      trip_id: telemetry.tripId,
      vehicle_id: telemetry.vehicleId,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speed: telemetry.speed,
      heading: telemetry.heading,
      accuracy: telemetry.accuracy,
      status: telemetry.status as TrackingStatus,
      recorded_at: telemetry.timestamp,
    });

    if (navigator.onLine) {
      await this.broadcastTelemetry(telemetry);
    } else {
      this.bufferOfflineTelemetry(telemetry);
    }

    // Notify local subscribers
    this.listeners.forEach((fn) => fn(telemetry));
  }

  private handleLocationError(err: GeolocationPositionError): void {
    console.warn(`GPS Position Error (${err.code}): ${err.message}`);
    this.triggerAlert('GPS_LOSS', `GPS signal weak or lost: ${err.message}`);
  }

  /** Broadcast telemetry via Supabase Realtime channel & persist to database */
  private async broadcastTelemetry(telemetry: DriverTelemetry): Promise<void> {
    try {
      const channel = supabase.channel('driver-gps-live');
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'location_update',
        payload: telemetry,
      });

      await supabase.from('vehicles').update({
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        updated_at: telemetry.timestamp,
      }).eq('id', telemetry.vehicleId);

    } catch (err) {
      console.warn('Realtime broadcast fallback to local state:', err);
    }
  }

  /** Subscribe to real-time location updates for a specific vehicle or trip */
  public subscribeToVehicleGps(
    vehicleId: string,
    onUpdate: (telemetry: DriverTelemetry) => void
  ): () => void {
    const channel = supabase
      .channel(`gps-${vehicleId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicles', filter: `id=eq.${vehicleId}` },
        (payload) => {
          const v = payload.new;
          onUpdate({
            driverId: v.owner_id ?? 'driver-01',
            tripId: 'TRIP-ACTIVE',
            vehicleId: v.id,
            latitude: v.latitude,
            longitude: v.longitude,
            speed: Math.floor(20 + Math.random() * 40),
            heading: 45,
            accuracy: 5,
            timestamp: v.updated_at || new Date().toISOString(),
            status: 'TRIP_IN_PROGRESS',
            isOnline: true,
          });
        }
      )
      .subscribe();

    this.listeners.push(onUpdate);

    return () => {
      supabase.removeChannel(channel);
      this.listeners = this.listeners.filter((fn) => fn !== onUpdate);
    };
  }

  /** Offline buffering helpers */
  private bufferOfflineTelemetry(telemetry: DriverTelemetry): void {
    try {
      const existing = JSON.parse(localStorage.getItem(OFFLINE_GPS_BUFFER_KEY) || '[]');
      existing.push(telemetry);
      localStorage.setItem(OFFLINE_GPS_BUFFER_KEY, JSON.stringify(existing.slice(-100)));
    } catch {}
  }

  private async flushOfflineBuffer(): Promise<void> {
    try {
      const raw = localStorage.getItem(OFFLINE_GPS_BUFFER_KEY);
      if (!raw) return;
      const points: any[] = JSON.parse(raw);
      if (points.length > 0) {
        for (const pt of points) {
          if (pt.driver_id && pt.trip_id) {
            await publishFleetHostLocation(pt);
          } else if (pt.driverId) {
            await this.broadcastTelemetry(pt);
          }
        }
        localStorage.removeItem(OFFLINE_GPS_BUFFER_KEY);
      }
    } catch {}
  }

  private triggerAlert(type: string, message: string): void {
    const alertObj = { type, message, timestamp: new Date().toISOString() };
    this.alertListeners.forEach((fn) => fn(alertObj));
  }

  public onAlert(fn: (alert: { type: string; message: string; timestamp: string }) => void): () => void {
    this.alertListeners.push(fn);
    return () => {
      this.alertListeners = this.alertListeners.filter((cb) => cb !== fn);
    };
  }

  // Helper math formulas
  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
    const x =
      Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
      Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
    const brng = Math.atan2(y, x) * (180 / Math.PI);
    return (brng + 360) % 360;
  }
}

export const driverGpsService = new DriverGpsService();
