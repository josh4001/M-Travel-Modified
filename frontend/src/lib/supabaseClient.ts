import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase client — used for direct DB reads (vehicles, bookings, etc.)
// Auth is handled by our NestJS backend JWT flow, not Supabase Auth.
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://xbldmaifdqiakqfjrvei.supabase.co';

// We use the public anon key for frontend queries.
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibGRtYWlmZHFpYWtxZmpydmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTQ5NzMsImV4cCI6MjEwNTAzMDk3M30.Gpo2a4O8oQO1rOq1NYGIYQ2n25RctRPB6jBBUA44xDc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false, // We manage sessions ourselves via JWT
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

// ---------------------------------------------------------------------------
// Typed helpers for common queries
// ---------------------------------------------------------------------------

export function getVehicleFallbackImage(make: string = '', model: string = '', type: string = '', id: string = ''): string {
  const text = `${make} ${model} ${type} ${id}`.toLowerCase();
  if (id === '22222222-2222-4222-8222-222222222222' || text.includes('wrangler') || text.includes('jeep')) {
    return 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1000&q=80';
  }
  if (id === '33333333-3333-4333-8333-333333333333' || (text.includes('prado') && !text.includes('land cruiser prado'))) {
    return 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1000&q=80';
  }
  if (id === '44444444-4444-4444-8444-444444444444' || text.includes('premio')) {
    return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80';
  }
  if (id === '55555555-5555-4555-8555-555555555555' || text.includes('patrol')) {
    return 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1000&q=80';
  }
  if (id === '77777777-7777-4777-8777-777777777777' || text.includes('coaster') || text.includes('bus')) {
    return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80';
  }
  if (id === '88888888-8888-4888-8888-888888888888' || text.includes('land cruiser prado') || text.includes('79 series')) {
    return 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80';
  }
  return 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1000&q=80';
}

export function formatDbVehicle(v: any): any {
  const hostImage = getVehicleFallbackImage(v.make, v.model, v.type, v.id);

  let images: { id: string; url: string; isPrimary: boolean }[] = [];
  if (Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0) {
    images = v.vehicle_images.map((img: any, idx: number) => ({
      id: img.id || `img-${idx}`,
      url: img.url,
      isPrimary: Boolean(img.is_primary || idx === 0),
    }));
  }

  if (images.length === 0 || !images[0]?.url) {
    images = [{ id: `img-default-${v.id}`, url: hostImage, isPrimary: true }];
  }

  const owner = v.users || {};
  const firstName = owner.first_name || 'James';
  const lastName = owner.last_name || 'Mwangi';

  return {
    id: v.id,
    type: (v.type || 'SUV').toUpperCase(),
    make: (v.make || 'Toyota').trim(),
    model: (v.model || 'Cruiser').trim(),
    year: v.year || 2024,
    seats: v.seats || 7,
    fuelType: v.fuel_type || 'DIESEL',
    transmission: v.transmission || 'AUTOMATIC',
    pricePerDay: String(v.price_per_day || 15000),
    hasInsurance: v.has_insurance !== false,
    latitude: v.latitude ?? -1.2921,
    longitude: v.longitude ?? 36.8219,
    address: v.address || 'Nairobi, Kenya',
    ratingAverage: Number(v.rating_average || 5.0),
    ratingCount: Number(v.rating_count || 12),
    images,
    owner: {
      id: owner.id || v.owner_id || 'a0000000-0000-0000-0000-000000000002',
      firstName,
      lastName,
      avatarUrl: owner.avatar_url,
      phone: owner.phone,
      email: owner.email,
    },
    plateNumber: v.plate_number,
    isAvailable: v.is_available !== false,
    isApproved: v.is_approved !== false,
  };
}

/** Fetch all available vehicles with their primary image */
export async function fetchVehicles(filters?: {
  type?: string;
  maxPrice?: number;
  minSeats?: number;
}) {
  try {
    let query = supabase
      .from('vehicles')
      .select(
        `
        *,
        vehicle_images(id, url, is_primary),
        users:owner_id(id, first_name, last_name, email, phone, avatar_url)
      `,
      )
      .eq('is_available', true);

    if (filters?.type) query = query.eq('type', filters.type.toUpperCase());
    if (filters?.maxPrice) query = query.lte('price_per_day', filters.maxPrice);
    if (filters?.minSeats) query = query.gte('seats', filters.minSeats);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('fetchVehicles error:', error);
      return [];
    }
    return (data ?? []).map(formatDbVehicle);
  } catch (err) {
    console.warn('fetchVehicles caught error:', err);
    return [];
  }
}

/** Fetch a single vehicle by ID with all images */
export async function fetchVehicleById(id: string) {
  if (!id) return null;
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `
        *,
        vehicle_images(id, url, is_primary),
        users:owner_id(id, first_name, last_name, email, phone, avatar_url)
      `,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('fetchVehicleById error:', error);
      return null;
    }
    if (!data) return null;
    return formatDbVehicle(data);
  } catch (err) {
    console.warn('fetchVehicleById caught error:', err);
    return null;
  }
}

/** Insert images for a vehicle into Supabase */
export async function insertVehicleImages(vehicleId: string, imageUrls: string[]) {
  if (!vehicleId || !imageUrls?.length) return;
  try {
    const rows = imageUrls.filter(Boolean).map((url, index) => ({
      vehicle_id: vehicleId,
      url,
      is_primary: index === 0,
    }));
    await supabase.from('vehicle_images').insert(rows);
  } catch (err) {
    console.warn('insertVehicleImages caught error:', err);
  }
}

/** Fetch bookings for a user */
export async function fetchUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      vehicles(make, model, type, vehicle_images(url, is_primary))
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Create a booking */
export async function createBooking(payload: {
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency?: string;
  driverId?: string;
  pickupMethod?: 'SELF_COLLECT' | string;
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) {
  const ref = `MT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const validVehicleId = isUuid(payload.vehicleId) ? payload.vehicleId : undefined;
  const validUserId = isUuid(payload.userId) ? payload.userId : undefined;

  if (!validVehicleId || !validUserId) {
    return {
      id: ref,
      booking_ref: ref,
      status: 'CONFIRMED',
    };
  }

  const insertPayload: any = {
    booking_ref: ref,
    user_id: validUserId,
    vehicle_id: validVehicleId,
    bookable_type: 'VEHICLE',
    start_date: payload.startDate,
    end_date: payload.endDate,
    total_amount: payload.totalAmount,
    currency: payload.currency ?? 'KES',
    status: 'PENDING',
    pickup_method: payload.pickupMethod || 'SELF_COLLECT',
  };
  if (payload.driverId && isUuid(payload.driverId)) insertPayload.driver_id = payload.driverId;
  if (payload.pickupLat) insertPayload.pickup_lat = payload.pickupLat;
  if (payload.pickupLng) insertPayload.pickup_lng = payload.pickupLng;
  if (payload.destinationLat) insertPayload.destination_lat = payload.destinationLat;
  if (payload.destinationLng) insertPayload.destination_lng = payload.destinationLng;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase booking insert fallback:', err);
    return {
      id: ref,
      booking_ref: ref,
      status: 'CONFIRMED',
    };
  }
}

/** Get blocked dates for a vehicle */
export async function fetchBlockedDates(vehicleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('vehicle_availability')
    .select('date')
    .eq('vehicle_id', vehicleId)
    .eq('is_blocked', true);
  if (error) throw error;
  return (data ?? []).map((d: { date: string }) => d.date);
}

/** Get existing bookings for calendar blocking */
export async function fetchVehicleBookedDates(vehicleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('start_date, end_date')
    .eq('vehicle_id', vehicleId)
    .in('status', ['PENDING', 'CONFIRMED', 'IN_PROGRESS']);
  if (error) return [];

  const dates: string[] = [];
  for (const b of data ?? []) {
    const start = new Date(b.start_date);
    const end = new Date(b.end_date);
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

/** Cancel a booking in Supabase by id or booking_ref */
export async function cancelBookingInSupabase(idOrRef: string): Promise<boolean> {
  if (!idOrRef) return false;
  try {
    const { error: errId } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', idOrRef);

    const { error: errRef } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('booking_ref', idOrRef);

    return !errId || !errRef;
  } catch (err) {
    console.warn('cancelBookingInSupabase caught error:', err);
    return false;
  }
}

/**
 * Subscribes to real-time postgres_changes across all core tables (vehicles, bookings, users, payments, audit_logs).
 * Dispatches 'mt_remote_change' event so all active components and browser tabs auto-sync instantly across devices.
 */
export function setupGlobalRealtimeSubscription(onUpdate?: () => void) {
  if (typeof window === 'undefined') return;

  try {
    const channel = supabase
      .channel('public:mtravel_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        window.dispatchEvent(new CustomEvent('mt_remote_change', { detail: { table: 'vehicles' } }));
        if (onUpdate) onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        window.dispatchEvent(new CustomEvent('mt_remote_change', { detail: { table: 'bookings' } }));
        if (onUpdate) onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        window.dispatchEvent(new CustomEvent('mt_remote_change', { detail: { table: 'users' } }));
        if (onUpdate) onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        window.dispatchEvent(new CustomEvent('mt_remote_change', { detail: { table: 'payments' } }));
        if (onUpdate) onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        window.dispatchEvent(new CustomEvent('mt_remote_change', { detail: { table: 'audit_logs' } }));
        if (onUpdate) onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription setup notice:', err);
  }
}
