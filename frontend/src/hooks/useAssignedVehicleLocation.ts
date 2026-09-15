import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { DriverLiveLocation } from '@/types/tracking';

interface UseAssignedVehicleLocationOptions {
  tripId?: string;
  fallbackLocation?: { lat: number; lng: number };
  staleThresholdSeconds?: number;
}

export function useAssignedVehicleLocation({
  tripId,
  fallbackLocation,
  staleThresholdSeconds = 40,
}: UseAssignedVehicleLocationOptions) {
  const [location, setLocation] = useState<DriverLiveLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const staleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset and reset stale countdown timer
  const touchStaleTimer = () => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
    }
    setIsStale(false);
    staleTimerRef.current = setTimeout(() => {
      setIsStale(true);
    }, staleThresholdSeconds * 1000);
  };

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    // 1. Initial snapshot fetch from driver_live_locations
    const fetchSnapshot = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_live_locations')
          .select('*')
          .eq('trip_id', tripId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.warn('Could not fetch initial live location:', error.message);
        } else if (data) {
          const loc: DriverLiveLocation = {
            id: data.id,
            driver_id: data.driver_id,
            trip_id: data.trip_id,
            vehicle_id: data.vehicle_id,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed || 0,
            heading: data.heading || 0,
            accuracy: data.accuracy || 5,
            status: data.status || 'TRIP_IN_PROGRESS',
            battery_level: data.battery_level,
            recorded_at: data.recorded_at,
            updated_at: data.updated_at,
          };
          setLocation(loc);
          setLastUpdatedAt(new Date(data.updated_at));

          // Check if initial snapshot is already older than stale threshold
          const ageMs = Date.now() - new Date(data.updated_at).getTime();
          if (ageMs > staleThresholdSeconds * 1000) {
            setIsStale(true);
          } else {
            touchStaleTimer();
          }
        } else if (fallbackLocation) {
          // If no live record in DB yet, display fallback initial vehicle coordinate
          setLocation({
            driver_id: 'pending',
            trip_id: tripId,
            vehicle_id: 'pending',
            latitude: fallbackLocation.lat,
            longitude: fallbackLocation.lng,
            speed: 0,
            heading: 0,
            accuracy: 10,
            status: 'AVAILABLE',
            recorded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setLastUpdatedAt(new Date());
          touchStaleTimer();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSnapshot();

    // 2. Real-time subscription strictly to this trip
    // Listen for postgres_changes on driver_live_locations for this trip_id
    const channelName = `live-trip-${tripId}`;
    const tripChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_live_locations',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const row = payload.new as any;
          if (row && row.latitude && row.longitude) {
            const updated: DriverLiveLocation = {
              id: row.id,
              driver_id: row.driver_id,
              trip_id: row.trip_id,
              vehicle_id: row.vehicle_id,
              latitude: row.latitude,
              longitude: row.longitude,
              speed: row.speed || 0,
              heading: row.heading || 0,
              accuracy: row.accuracy || 5,
              status: row.status || 'TRIP_IN_PROGRESS',
              battery_level: row.battery_level,
              recorded_at: row.recorded_at,
              updated_at: row.updated_at || new Date().toISOString(),
            };
            setLocation(updated);
            setLastUpdatedAt(new Date());
            touchStaleTimer();
          }
        }
      )
      // Also listen to direct broadcast on trip channel for sub-second reactive latency
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        if (!isMounted) return;
        if (payload && payload.latitude && payload.longitude) {
          setLocation(payload as DriverLiveLocation);
          setLastUpdatedAt(new Date());
          touchStaleTimer();
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (staleTimerRef.current) {
        clearTimeout(staleTimerRef.current);
      }
      supabase.removeChannel(tripChannel);
    };
  }, [tripId, staleThresholdSeconds]);

  const statusText = isStale
    ? 'Vehicle location temporarily unavailable'
    : location?.status === 'DRIVING_TO_PICKUP'
    ? 'Driver en route to pickup'
    : location?.status === 'WAITING_FOR_TOURIST'
    ? 'Driver arrived at pickup'
    : location?.status === 'TRIP_IN_PROGRESS'
    ? 'Trip in progress'
    : location?.status === 'TRIP_COMPLETED'
    ? 'Trip completed'
    : 'Vehicle on standby';

  return {
    location,
    isLoading,
    isStale,
    statusText,
    lastUpdatedAt,
  };
}
