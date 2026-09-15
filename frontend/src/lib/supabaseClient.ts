import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase client — used for direct DB reads (vehicles, bookings, etc.)
// Auth is handled by our NestJS backend JWT flow, not Supabase Auth.
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://rpgxibjgvhumbumntlms.supabase.co';

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

/** Fetch all available vehicles with their primary image */
export async function fetchVehicles(filters?: {
  type?: string;
  maxPrice?: number;
  minSeats?: number;
}) {
  let query = supabase
    .from('vehicles')
    .select(
      `
      *,
      vehicle_images!inner(url, is_primary)
    `,
    )
    .eq('is_available', true)
    .eq('vehicle_images.is_primary', true);

  if (filters?.type) query = query.eq('type', filters.type.toUpperCase());
  if (filters?.maxPrice) query = query.lte('price_per_day', filters.maxPrice);
  if (filters?.minSeats) query = query.gte('seats', filters.minSeats);

  const { data, error } = await query.order('rating_average', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single vehicle by ID with all images */
export async function fetchVehicleById(id: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(
      `
      *,
      vehicle_images(url, is_primary),
      users!vehicles_owner_id_fkey(first_name, last_name, phone, avatar_url)
    `,
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
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
}) {
  const ref = `MT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      booking_ref: ref,
      user_id: payload.userId,
      vehicle_id: payload.vehicleId,
      bookable_type: 'VEHICLE',
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_amount: payload.totalAmount,
      currency: payload.currency ?? 'KES',
      status: 'PENDING',
    })
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
