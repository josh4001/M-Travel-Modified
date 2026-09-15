// ─── Real-Time GPS Tracking & Telemetry Types ─────────────────────────────────

export type TrackingStatus =
  | 'OFFLINE'
  | 'AVAILABLE'
  | 'DRIVING_TO_PICKUP'
  | 'WAITING_FOR_TOURIST'
  | 'TRIP_IN_PROGRESS'
  | 'TRIP_COMPLETED';

export interface DriverLiveLocation {
  id?: string;
  driver_id: string;
  trip_id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number;          // in km/h
  heading: number;        // 0 to 360 degrees
  accuracy: number;       // in meters
  status: TrackingStatus;
  battery_level?: number;
  recorded_at: string;
  updated_at: string;
  // Optional client-enriched fields for display
  driver_name?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
}

export interface TripHistoryRecord {
  id?: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  recorded_at: string;
  sequence_number: number;
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface EtaEstimate {
  distanceKm: number;
  durationMinutes: number;
  routeCoordinates: [number, number][]; // [lat, lng] tuples for Leaflet Polyline
  source: 'osrm' | 'haversine_estimate';
  lastCalculatedAt: number;
}

export interface FleetVehicleLocationSummary {
  vehicleId: string;
  driverId: string;
  tripId?: string;
  plateNumber: string;
  make: string;
  model: string;
  type: string;
  ownerName: string;
  ownerPhone?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  status: TrackingStatus;
  updatedAt: string;
  isStale: boolean;
  activeBookingRef?: string;
  activeTravellerName?: string;
}
