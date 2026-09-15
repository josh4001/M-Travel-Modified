import { supabase } from '@/lib/supabaseClient';
import type { TripHistoryRecord } from '@/types/tracking';

export interface RawGpsPoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  recorded_at: string;
}

/**
 * Perpendicular distance from a point to a line segment defined by p1 and p2.
 */
function perpendicularDistance(
  p: { lat: number; lng: number },
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;

  if (dx === 0 && dy === 0) {
    const diffX = p.lng - p1.lng;
    const diffY = p.lat - p1.lat;
    return Math.sqrt(diffX * diffX + diffY * diffY);
  }

  const numerator = Math.abs(dy * p.lng - dx * p.lat + p2.lng * p1.lat - p2.lat * p1.lng);
  const denominator = Math.sqrt(dy * dy + dx * dx);
  return numerator / denominator;
}

/**
 * Ramer-Douglas-Peucker algorithm for simplifying a trajectory of GPS points.
 * Epsilon in degrees (~0.0001 is roughly 11 meters).
 */
export function douglasPeucker(points: RawGpsPoint[], epsilon = 0.0001): RawGpsPoint[] {
  if (points.length <= 2) return points;

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  const pFirst = { lat: points[0].latitude, lng: points[0].longitude };
  const pLast = { lat: points[end].latitude, lng: points[end].longitude };

  for (let i = 1; i < end; i++) {
    const p = { lat: points[i].latitude, lng: points[i].longitude };
    const d = perpendicularDistance(p, pFirst, pLast);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = douglasPeucker(points.slice(0, index + 1), epsilon);
    const recResults2 = douglasPeucker(points.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

/**
 * Archives a completed trip route into `trip_history`, removes the active record
 * from `driver_live_locations`, and clears local telemetry caches.
 */
export async function completeTripAndArchive(
  tripId: string,
  rawPoints: RawGpsPoint[]
): Promise<{ success: boolean; archivedCount: number; error?: string }> {
  try {
    let simplifiedPoints: RawGpsPoint[] = [];

    if (rawPoints.length > 0) {
      simplifiedPoints = douglasPeucker(rawPoints);
      
      const recordsToInsert = simplifiedPoints.map((pt, idx) => ({
        trip_id: tripId,
        latitude: pt.latitude,
        longitude: pt.longitude,
        speed: pt.speed,
        heading: pt.heading,
        recorded_at: pt.recorded_at,
        sequence_number: idx + 1,
      }));

      // Batch insert into trip_history in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
        const chunk = recordsToInsert.slice(i, i + chunkSize);
        const { error: insertErr } = await supabase.from('trip_history').insert(chunk);
        if (insertErr) {
          console.warn('Trip history insert chunk warning:', insertErr.message);
        }
      }
    }

    // Update status in driver_live_locations to TRIP_COMPLETED or remove row
    const { error: deleteErr } = await supabase
      .from('driver_live_locations')
      .update({ status: 'TRIP_COMPLETED', updated_at: new Date().toISOString() })
      .eq('trip_id', tripId);

    if (deleteErr) {
      console.warn('Update driver_live_locations warning on trip completion:', deleteErr.message);
    }

    // Clean any offline buffer for this trip
    try {
      const bufferKey = 'mt_offline_gps_buffer';
      const raw = localStorage.getItem(bufferKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter((item: any) => item.trip_id !== tripId && item.tripId !== tripId);
          localStorage.setItem(bufferKey, JSON.stringify(remaining));
        }
      }
    } catch {
      // Ignore local storage error
    }

    return {
      success: true,
      archivedCount: simplifiedPoints.length,
    };
  } catch (err: any) {
    console.error('Failed to complete and archive trip:', err);
    return {
      success: false,
      archivedCount: 0,
      error: err.message || 'Unknown error archiving trip',
    };
  }
}

/**
 * Fetch historical route breadcrumbs for a completed trip.
 */
export async function fetchTripHistory(tripId: string): Promise<TripHistoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from('trip_history')
      .select('*')
      .eq('trip_id', tripId)
      .order('sequence_number', { ascending: true });

    if (error) {
      console.warn('Error fetching trip history:', error.message);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}
