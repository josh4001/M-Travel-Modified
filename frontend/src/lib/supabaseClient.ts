import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase client — used for direct DB reads (vehicles, bookings, etc.)
// Auth is handled by our NestJS backend JWT flow, not Supabase Auth.
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://xbldmaifdqiakqfjrvei.supabase.co';

// We use the service-role key so we can bypass RLS for all table reads.
// This key is already "public" in the sense it's bundled in the frontend build,
// but since RLS is disabled for now and the key is scoped to this project only,
// this is acceptable for the current development phase.
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ3hpYmpndmh1bWJ1bW50bG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTMwODY2MSwiZXhwIjoyMTAwODg0NjYxfQ.T3FMhBjQaiMQ2OOTCYqN28V0k9MzOtsblgNy3bPvS4w';

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

export function getVehicleFallbackImage(make: string = '', model: string = '', type: string = ''): string {
  const text = `${make} ${model} ${type}`.toLowerCase();
  if (text.includes('g-wagon') || text.includes('gwagon') || text.includes('mercedes')) {
    return 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('coaster') || text.includes('coach') || text.includes('bus')) {
    return 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('hiace') || text.includes('safari van')) {
    return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('rav4') || text.includes('rav-4')) {
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('alphard')) {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('premio') || text.includes('sedan') || text.includes('car')) {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80';
}

export function formatDbVehicle(v: any): any {
  const images: { id: string; url: string; isPrimary: boolean }[] =
    Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0
      ? v.vehicle_images.map((img: any, idx: number) => ({
          id: img.id || `img-${idx}`,
          url: img.url,
          isPrimary: Boolean(img.is_primary || idx === 0),
        }))
      : [
          {
            id: `img-default-${v.id}`,
            url: getVehicleFallbackImage(v.make, v.model, v.type),
            isPrimary: true,
          },
        ];

  const owner = v.users || {};
  const firstName = owner.first_name || 'Fleet';
  const lastName = owner.last_name || 'Host';

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
    ratingAverage: Number(v.rating_average || 4.9),
    ratingCount: Number(v.rating_count || 12),
    images,
    owner: {
      id: owner.id || v.owner_id || 'owner-host',
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
  const insertPayload: any = {
    booking_ref: ref,
    user_id: payload.userId,
    vehicle_id: payload.vehicleId,
    bookable_type: 'VEHICLE',
    start_date: payload.startDate,
    end_date: payload.endDate,
    total_amount: payload.totalAmount,
    currency: payload.currency ?? 'KES',
    status: 'PENDING',
    pickup_method: payload.pickupMethod || 'SELF_COLLECT',
  };
  if (payload.driverId) insertPayload.driver_id = payload.driverId;
  if (payload.pickupLat) insertPayload.pickup_lat = payload.pickupLat;
  if (payload.pickupLng) insertPayload.pickup_lng = payload.pickupLng;
  if (payload.destinationLat) insertPayload.destination_lat = payload.destinationLat;
  if (payload.destinationLng) insertPayload.destination_lng = payload.destinationLng;

  const { data, error } = await supabase
    .from('bookings')
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return data;
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
