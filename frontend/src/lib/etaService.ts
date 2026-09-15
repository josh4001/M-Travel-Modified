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
