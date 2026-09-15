import type { EtaEstimate } from '@/types/tracking';

// In-memory cache to prevent excessive OSRM routing requests
interface CacheEntry {
  estimate: EtaEstimate;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15 seconds
const MIN_DISTANCE_DELTA_KM = 0.05; // 50 meters

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a cache key based on 3-decimal rounded coordinates (~110m bucket)
 */
function getCacheKey(lat1: number, lng1: number, lat2: number, lng2: number): string {
  return `${lat1.toFixed(3)},${lng1.toFixed(3)}->${lat2.toFixed(3)},${lng2.toFixed(3)}`;
}

/**
 * Calculates real road routing ETA, distance, and polyline coordinates using OSRM,
 * falling back to Haversine route geometry when offline or rate-limited.
 */
export async function calculateRoadEta(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  currentSpeedKmH = 0
): Promise<EtaEstimate> {
  const cacheKey = getCacheKey(origin.lat, origin.lng, destination.lat, destination.lng);
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // Check cache validity and position delta
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const deltaKm = calculateHaversineDistanceKm(
      origin.lat,
      origin.lng,
      cached.originLat,
      cached.originLng
    );
    if (deltaKm < MIN_DISTANCE_DELTA_KM) {
      return cached.estimate;
    }
  }

  // Attempt real road routing via OSRM public service
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = +(route.distance / 1000).toFixed(1);
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        // GeoJSON coordinates come in [lng, lat], convert to [lat, lng] for Leaflet
        const routeCoordinates: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const estimate: EtaEstimate = {
          distanceKm,
          durationMinutes,
          routeCoordinates,
          source: 'osrm',
          lastCalculatedAt: now,
        };

        cache.set(cacheKey, {
          estimate,
          originLat: origin.lat,
          originLng: origin.lng,
          destLat: destination.lat,
          destLng: destination.lng,
          timestamp: now,
        });

        return estimate;
      }
    }
  } catch {
    // Network error, timeout, or OSRM unavailable: fall back to smooth Haversine interpolation
  }

  // Fallback calculation: straight line with road curvature factor (1.3x)
  const straightDistKm = calculateHaversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );
  const roadDistKm = +(straightDistKm * 1.3).toFixed(1);

  // Speed estimation: use vehicle's current speed if > 15 km/h, else urban average of 40 km/h
  const effectiveSpeed = currentSpeedKmH > 15 ? currentSpeedKmH : 40;
  const durationMinutes = Math.max(1, Math.round((roadDistKm / effectiveSpeed) * 60));

  // Build a simple 5-point interpolated road polyline
  const routeCoordinates: [number, number][] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + (destination.lat - origin.lat) * t;
    const lng = origin.lng + (destination.lng - origin.lng) * t;
    routeCoordinates.push([lat, lng]);
  }

  const fallbackEstimate: EtaEstimate = {
    distanceKm: roadDistKm,
    durationMinutes,
    routeCoordinates,
    source: 'haversine_estimate',
    lastCalculatedAt: now,
  };

  cache.set(cacheKey, {
    estimate: fallbackEstimate,
    originLat: origin.lat,
    originLng: origin.lng,
    destLat: destination.lat,
    destLng: destination.lng,
    timestamp: now,
  });

  return fallbackEstimate;
}

/**
 * Calculates geographic bearing in degrees (0° to 360°) from point 1 to point 2.
 * 0° = North, 90° = East, 180° = South, 270° = West.
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

export interface RouteInterpolationResult {
  lat: number;
  lng: number;
  heading: number;
  segmentIndex: number;
  totalDistanceKm: number;
  distanceCoveredKm: number;
  isCurving: boolean;
}

/**
 * Accurately interpolates a position along a multi-point road polyline at a fractional progress (0.0 to 1.0).
 * Calculates exact road coordinates, tangential heading, and curve detection for natural vehicle dynamics.
 */
export function interpolateAlongRoute(
  coords: [number, number][],
  fraction: number
): RouteInterpolationResult {
  if (!coords || coords.length === 0) {
    return { lat: 0, lng: 0, heading: 0, segmentIndex: 0, totalDistanceKm: 0, distanceCoveredKm: 0, isCurving: false };
  }
  if (coords.length === 1 || fraction <= 0) {
    const nextPt = coords[1] || coords[0];
    const heading = coords.length > 1 ? calculateBearing(coords[0][0], coords[0][1], nextPt[0], nextPt[1]) : 0;
    return { lat: coords[0][0], lng: coords[0][1], heading, segmentIndex: 0, totalDistanceKm: 0, distanceCoveredKm: 0, isCurving: false };
  }
  if (fraction >= 1) {
    const last = coords[coords.length - 1];
    const prev = coords[coords.length - 2] || last;
    const heading = calculateBearing(prev[0], prev[1], last[0], last[1]);
    return { lat: last[0], lng: last[1], heading, segmentIndex: coords.length - 2, totalDistanceKm: 0, distanceCoveredKm: 0, isCurving: false };
  }

  // Pre-calculate cumulative distances
  const segmentDists: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = calculateHaversineDistanceKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    totalDist += d;
    segmentDists.push(totalDist);
  }

  const targetDist = Math.max(0, Math.min(fraction * totalDist, totalDist));
  let segIdx = 0;
  while (segIdx < segmentDists.length - 1 && segmentDists[segIdx] < targetDist) {
    segIdx++;
  }

  const prevCumDist = segIdx === 0 ? 0 : segmentDists[segIdx - 1];
  const segDist = segmentDists[segIdx] - prevCumDist;
  const segT = segDist > 0 ? Math.min(1, Math.max(0, (targetDist - prevCumDist) / segDist)) : 0;

  const p0 = coords[segIdx];
  const p1 = coords[segIdx + 1];

  const lat = p0[0] + (p1[0] - p0[0]) * segT;
  const lng = p0[1] + (p1[1] - p0[1]) * segT;
  const currentHeading = calculateBearing(p0[0], p0[1], p1[0], p1[1]);

  // Check if upcoming segment has a sharp curve
  let isCurving = false;
  if (segIdx < coords.length - 2) {
    const nextHeading = calculateBearing(coords[segIdx + 1][0], coords[segIdx + 1][1], coords[segIdx + 2][0], coords[segIdx + 2][1]);
    const diff = Math.abs(currentHeading - nextHeading);
    const angleDiff = diff > 180 ? 360 - diff : diff;
    if (angleDiff > 25) {
      isCurving = true;
    }
  }

  return {
    lat,
    lng,
    heading: currentHeading,
    segmentIndex: segIdx,
    totalDistanceKm: totalDist,
    distanceCoveredKm: targetDist,
    isCurving,
  };
}

/**
 * Retrieve turn-by-turn road polyline between origin and destination coordinates.
 */
export async function getRouteCoordinates(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<[number, number][]> {
  const eta = await calculateRoadEta(origin, destination);
  return eta.routeCoordinates;
}

