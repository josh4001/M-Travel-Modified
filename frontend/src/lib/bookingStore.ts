import { supabase, getVehicleFallbackImage } from './supabaseClient';
import { logAuditEvent } from './rentalLifecycleStore';

// Centralized persistent store for M-TRAVEL bookings, vehicle registration, and notifications
export interface StoredBooking {
  id: string;
  bookingRef: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  /** Convenience shorthand: `${vehicleMake} ${vehicleModel}` */
  vehicleName: string;
  vehicleImage: string;
  ownerId?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  touristId: string;
  touristName: string;
  touristPhone: string;
  touristEmail?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  mpesaReceipt?: string;
  status:
    | 'PENDING'
    | 'PAID'
    | 'CONFIRMED'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | string;
  pickupMethod?: 'SELF_COLLECT' | string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  hasDriver?: boolean;
  bookingType?: 'VEHICLE' | 'DESTINATION' | 'HOLIDAY' | 'TOUR' | 'BUS_SEAT' | string;
  destinationCategory?: 'TOUR' | 'HOLIDAY_HOME' | 'DESTINATION' | string;
  destinationTitle?: string;
  destinationBadge?: string;
  destinationLocation?: string;
  destinationSpecs?: string[];
  rating?: number;
  reviewComment?: string;
  reviewTags?: string[];
  ratedAt?: string;
  createdAt: string;
}

/**
 * Determines whether a booking is for a trip, tour, holiday stay, or destination package
 * rather than a rented fleet vehicle.
 */
export const isTripBooking = (booking?: Partial<StoredBooking> | null | any): boolean => {
  if (!booking) return false;
  const type = String(booking.bookingType || booking.raw?.bookingType || '').toUpperCase();
  if (['DESTINATION', 'HOLIDAY', 'TOUR', 'BUS_SEAT', 'TRIP', 'PACKAGE', 'STAY'].includes(type)) {
    return true;
  }
  const bookableType = String(booking.raw?.bookable_type || booking.bookable_type || '').toUpperCase();
  if (['TOUR', 'HOLIDAY_HOME', 'DESTINATION', 'STAY'].includes(bookableType)) {
    return true;
  }
  if (booking.destinationCategory || booking.destinationTitle) {
    return true;
  }
  const ref = String(booking.bookingRef || booking.ref || '');
  if (ref.startsWith('MT-HOL-') || ref.startsWith('MT-TOUR-') || ref.startsWith('MT-DEST-') || ref.startsWith('MT-TRIP-')) {
    return true;
  }
  const vId = String(booking.vehicleId || booking.vehicle_id || '');
  if (vId.startsWith('dest-') || vId.startsWith('tour-') || vId.startsWith('trip-')) {
    return true;
  }
  const bId = String(booking.id || '');
  if (bId.startsWith('dest-') || bId.startsWith('tour-') || bId.startsWith('trip-')) {
    return true;
  }
  return false;
};

/**
 * Determines whether a booking is specifically for a fleet vehicle rental.
 */
export const isVehicleBooking = (booking?: Partial<StoredBooking> | null | any): boolean => {
  if (!booking) return false;
  return !isTripBooking(booking);
};

export interface VehicleDocument {
  id: string;
  name: string;
  type: 'LOGBOOK' | 'INSURANCE' | 'INSPECTION_CERT' | 'OTHER';
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
}

export interface StoredVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  pricePerDay: number;
  seats: number;
  fuelType: string;
  transmission: string;
  address: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  isSelfDriveAvailable?: boolean;
  isWithDriverAvailable?: boolean;
  images: string[];
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isLive?: boolean;
  ratingAverage: number;
  ratingCount: number;
  hasInsurance: boolean;
  plateNumber?: string;
  latitude?: number;
  longitude?: number;
  documents?: VehicleDocument[];
  rejectionReasons?: string[];
  rejectionNotes?: string;
  rejectedAt?: string;
  updatedAt?: string;
  createdAt: string;
}

const BOOKINGS_KEY = 'mt_shared_bookings_v2';
const VEHICLES_KEY = 'mt_shared_vehicles_v2';
const LIVE_OVERRIDES_KEY = 'mt_vehicle_live_overrides';

export const getVehicleLiveOverrides = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(LIVE_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Checks if a vehicle is currently marked "Live" for tourist hire.
 * Priority:
 * 1. Admin override in `mt_vehicle_live_overrides` (covers all items including static catalogue items v-1, v-2, etc.)
 * 2. `isLive` flag on `StoredVehicle`
 * 3. Default `true` (live)
 */
export const isVehicleLive = (vehicleId: string): boolean => {
  const overrides = getVehicleLiveOverrides();
  if (overrides[vehicleId] !== undefined) {
    return overrides[vehicleId];
  }
  const vehicles = getStoredVehicles();
  const found = vehicles.find((v) => v.id === vehicleId);
  if (found && found.isLive !== undefined) {
    return found.isLive !== false;
  }
  return true;
};

// --- INITIAL DEFAULT SEED DATA (STRICTLY EMPTY: ONLY HOST-REGISTERED CARS ALLOWED) ---
const DEMO_VEHICLE_IDS = new Set([
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  'ab0dd85b-15bc-45d9-8fb8-1b3f7908b904',
  '35d3ca61-971e-434c-ae2f-cb6601fd7376',
  'c53e7096-a526-4101-8c8c-10838d828545',
  'e3aedb74-5c0a-4932-b33b-94430fe5edf1',
  'v-safari-1',
  'v-alphard-2',
  'v-rav4-1',
  'v-1',
  'v-2',
  'v-3',
  'mv-001',
  'mv-002',
  'mv-003',
  'mv-004',
  'mv-005',
]);

export const isValidUUID = (str?: string): boolean =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const ensureUUID = (str?: string): string => {
  if (isValidUUID(str)) return str!;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'b' + Math.random().toString(36).substring(2, 9) + '-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
};

export const isDemoVehicle = (v: any): boolean => {
  if (!v) return false;
  if (v.id && (DEMO_VEHICLE_IDS.has(v.id) || String(v.id).startsWith('v-host-') || String(v.id).startsWith('mv-') || String(v.id).startsWith('00000000-'))) {
    return true;
  }
  const name = `${v.make || ''} ${v.model || ''} ${v.vehicleName || ''} ${v.title || ''}`.toLowerCase();
  if (
    name.includes('toyota land cruiser prado v8 4x4') ||
    name.includes('toyota hiace custom safari van') ||
    name.includes('toyota alphard executive lounge') ||
    name.includes('prado v8') ||
    name.includes('hiace safari van 4wd') ||
    name.includes('alphard executive lounge') ||
    name.includes('g-wagon amg') ||
    name.includes('g-wagon g63') ||
    name.includes('g-wagon v8') ||
    name.includes('coaster vip bus') ||
    name.includes('rav4 awd') ||
    name.includes('premio executive')
  ) {
    if (!v.id || DEMO_VEHICLE_IDS.has(v.id) || String(v.id).startsWith('v-host-') || String(v.id).startsWith('00000000-') || v.id === 'v-safari-1' || v.id === 'v-alphard-2' || v.ownerId === 'a0000000-0000-0000-0000-000000000002') {
      return true;
    }
  }
  return false;
};

// Helper Functions
export const getStoredBookings = (): StoredBooking[] => {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
      return [];
    }
    const sanitized = parsed.filter((b: StoredBooking) => {
      if (['b-101', 'b-102', 'b-103'].includes(b.id)) return false;
      if (b.vehicleId && DEMO_VEHICLE_IDS.has(b.vehicleId)) return false;
      if (isDemoVehicle(b)) return false;
      return true;
    });
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return [];
  }
};

export const saveBooking = (booking: Omit<StoredBooking, 'id' | 'createdAt'>): StoredBooking => {
  const existing = getStoredBookings();
  const bookingId = ensureUUID();
  const newBooking: StoredBooking = {
    ...booking,
    pickupMethod: booking.pickupMethod || 'SELF_COLLECT',
    vehicleName: booking.vehicleName || `${booking.vehicleMake} ${booking.vehicleModel}`,
    id: bookingId,
    createdAt: new Date().toISOString(),
  };
  const updated = [newBooking, ...existing];
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: newBooking }));

  // Real-time Supabase push
  (async () => {
    try {
      const validUserId = isValidUUID(booking.touristId) ? booking.touristId : null;
      const validVehicleId = isValidUUID(booking.vehicleId) ? booking.vehicleId : null;
      await supabase.from('bookings').insert({
        id: bookingId,
        booking_ref: booking.bookingRef || `MT-${bookingId.slice(0, 8).toUpperCase()}`,
        user_id: validUserId,
        vehicle_id: validVehicleId,
        start_date: booking.startDate ? new Date(booking.startDate).toISOString() : new Date().toISOString(),
        end_date: booking.endDate ? new Date(booking.endDate).toISOString() : new Date().toISOString(),
        total_amount: Number(booking.totalAmount || 0),
        currency: 'KES',
        status: (booking.status || 'PENDING').toUpperCase(),
        pickup_method: booking.pickupMethod || 'SELF_COLLECT',
        created_at: newBooking.createdAt,
      });

      if (['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes((booking.status || '').toUpperCase())) {
        await supabase.from('payments').insert({
          booking_id: bookingId,
          provider: 'MPESA',
          amount: Number(booking.totalAmount || 0),
          currency: 'KES',
          status: 'SUCCEEDED',
          provider_ref: booking.mpesaReceipt || `QK${Math.floor(100000 + Math.random() * 900000)}`,
        });
      }

      // Also persist real-time audit log
      logAuditEvent(
        'BOOKING_CREATED',
        'Booking',
        newBooking.bookingRef,
        `New reservation for ${newBooking.vehicleName} (KES ${newBooking.totalAmount.toLocaleString()})`,
        newBooking.touristName,
        'TOURIST'
      );
    } catch (err) {
      console.warn('Supabase real-time booking/payment insert notice:', err);
    }
  })();

  return newBooking;
};

export const getStoredVehicles = (): StoredVehicle[] => {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify([]));
      return [];
    }
    const sanitized = parsed.filter((v: StoredVehicle) => !isDemoVehicle(v));
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return [];
  }
};

/** Synchronize all vehicles registered by hosts from Supabase into localStorage */
export const syncVehiclesFromSupabase = async (): Promise<StoredVehicle[]> => {
  try {
    const queryPromise = supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images(id, url, is_primary),
        users:owner_id(id, first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Supabase sync timeout') }), 1500)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.warn('syncVehiclesFromSupabase notice/error:', error.message || error);
      return getStoredVehicles();
    }

    if (!data || data.length === 0) {
      return getStoredVehicles();
    }

    const currentLocal = getStoredVehicles();
    const localMap = new Map<string, StoredVehicle>();
    for (const v of currentLocal) {
      localMap.set(v.id, v);
    }

    const overrides = getVehicleLiveOverrides();

    // Map each Supabase vehicle into a StoredVehicle (strictly filter out demo seed records)
    const mappedSupabase: StoredVehicle[] = data
      .filter((v: any) => !isDemoVehicle(v))
      .map((v: any) => {
        const existing = localMap.get(v.id);
        const owner = v.users || {};
        const ownerName = [owner.first_name, owner.last_name].filter(Boolean).join(' ') || existing?.ownerName || 'Fleet Host';

        const images: string[] = (Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0)
          ? v.vehicle_images.map((img: any) => img.url).filter(Boolean)
          : (existing?.images && existing.images.length > 0)
            ? existing.images
            : [getVehicleFallbackImage(v.make, v.model, v.type)];

        const adminLiveOverride = overrides[v.id];
        const isLive = adminLiveOverride !== undefined
          ? adminLiveOverride
          : (existing?.isLive !== undefined ? existing.isLive : v.is_available !== false);

        return {
          id: v.id,
          make: (v.make || 'Toyota').trim(),
          model: (v.model || 'Cruiser').trim(),
          year: v.year || 2024,
          type: (v.type || 'SUV').toUpperCase(),
          pricePerDay: Number(v.price_per_day || 15000),
          seats: Number(v.seats || 7),
          fuelType: v.fuel_type || 'Diesel',
          transmission: v.transmission || 'Automatic',
          address: v.address || existing?.address || 'Nairobi, Kenya',
          ownerId: v.owner_id || existing?.ownerId || 'owner-host',
          ownerName,
          ownerEmail: owner.email || existing?.ownerEmail,
          images,
          status: (v.is_approved !== false ? 'APPROVED' : (existing?.status || 'PENDING_APPROVAL')) as any,
          isLive,
          ratingAverage: Number(v.rating_average || 4.9),
          ratingCount: Number(v.rating_count || 12),
          hasInsurance: v.has_insurance !== false,
          plateNumber: v.plate_number || existing?.plateNumber,
          isSelfDriveAvailable: true,
          isWithDriverAvailable: true,
          latitude: v.latitude ?? -1.2921,
          longitude: v.longitude ?? 36.8219,
          createdAt: v.created_at || existing?.createdAt || new Date().toISOString(),
        };
      });

    // Merge: Supabase vehicles take precedence, preserve local-only host additions
    const sbIds = new Set(mappedSupabase.map(v => v.id));
    const merged: StoredVehicle[] = [...mappedSupabase];
    for (const lv of currentLocal) {
      if (!sbIds.has(lv.id) && !isDemoVehicle(lv)) {
        merged.push(lv);
      }
    }

    try {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('LocalStorage quota warning in syncVehiclesFromSupabase:', e);
    }
    window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: merged }));
    return merged;
  } catch (err) {
    console.warn('syncVehiclesFromSupabase caught exception:', err);
    return getStoredVehicles();
  }
};

// Automatic initial sync in browser environment
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncVehiclesFromSupabase().catch(() => {});
  }, 100);
}

export const saveVehicle = (vehicle: Omit<StoredVehicle, 'id' | 'createdAt' | 'ratingAverage' | 'ratingCount' | 'status'>): StoredVehicle => {
  const existing = getStoredVehicles();
  const vehicleId = ensureUUID();
  const newVehicle: StoredVehicle = {
    ...vehicle,
    id: vehicleId,
    status: 'PENDING_APPROVAL',
    isLive: false, // Starts offline; Admin must inspect, approve, and push live
    ratingAverage: 5.0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [newVehicle, ...existing];
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage quota warning in saveVehicle, saving with pruned images:', err);
    const sanitized = updated.map(v => ({
      ...v,
      images: v.images.map((img, i) => img.startsWith('data:') ? (i === 0 ? 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80') : img)
    }));
    try {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(sanitized));
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: newVehicle }));

  // Real-time Supabase push
  (async () => {
    try {
      const validOwnerId = isValidUUID(vehicle.ownerId) ? vehicle.ownerId : 'a0000000-0000-0000-0000-000000000002';
      const { error: vError } = await supabase.from('vehicles').insert({
        id: vehicleId,
        owner_id: validOwnerId,
        type: (vehicle.type || 'SUV').toUpperCase(),
        make: vehicle.make,
        model: vehicle.model,
        year: Number(vehicle.year || 2024),
        seats: Number(vehicle.seats || 7),
        fuel_type: (vehicle.fuelType || 'DIESEL').toUpperCase(),
        transmission: (vehicle.transmission || 'AUTOMATIC').toUpperCase(),
        price_per_day: Number(vehicle.pricePerDay || 15000),
        plate_number: vehicle.plateNumber || null,
        has_insurance: vehicle.hasInsurance !== false,
        latitude: vehicle.latitude ?? -1.2921,
        longitude: vehicle.longitude ?? 36.8219,
        address: vehicle.address || 'Nairobi, Kenya',
        is_available: false,
        is_approved: false,
        rating_average: 5.0,
        rating_count: 0,
        created_at: newVehicle.createdAt,
      });

      if (!vError && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
        const imageRows = vehicle.images.slice(0, 5).map((url, idx) => ({
          vehicle_id: vehicleId,
          url: url.startsWith('data:') ? 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' : url,
          is_primary: idx === 0,
        }));
        await supabase.from('vehicle_images').insert(imageRows);
      }

      logAuditEvent(
        'VEHICLE_REGISTERED',
        'Vehicle',
        vehicleId,
        `Host ${newVehicle.ownerName || 'Host'} submitted ${newVehicle.year} ${newVehicle.make} ${newVehicle.model} for fleet inspection`,
        newVehicle.ownerName || 'Fleet Host',
        'VEHICLE_OWNER'
      );
    } catch (err) {
      console.warn('Supabase real-time vehicle insert notice:', err);
    }
  })();

  return newVehicle;
};

export const deleteVehicle = (vehicleId: string): boolean => {
  const vehicles = getStoredVehicles();
  const filtered = vehicles.filter(v => v.id !== vehicleId);
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: { id: vehicleId, deleted: true } }));
  } catch {
    return false;
  }

  if (isValidUUID(vehicleId)) {
    (async () => {
      try {
        await supabase.from('vehicles').delete().eq('id', vehicleId);
      } catch (err) {
        console.warn('Supabase deleteVehicle notice:', err);
      }
    })();
  }
  return true;
};

export const approveVehicle = (vehicleId: string, pushLive = true): StoredVehicle | null => {
  const vehicles = getStoredVehicles();
  let updatedVehicle: StoredVehicle | null = null;
  const updated = vehicles.map((v) => {
    if (v.id === vehicleId) {
      updatedVehicle = { ...v, status: 'APPROVED' as const, isLive: pushLive };
      return updatedVehicle;
    }
    return v;
  });
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('mt_vehicle_approved', { detail: updatedVehicle }));
  window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: updatedVehicle }));

  if (isValidUUID(vehicleId)) {
    (async () => {
      try {
        await supabase
          .from('vehicles')
          .update({
            is_approved: true,
            is_available: pushLive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vehicleId);
      } catch (err) {
        console.warn('Supabase approveVehicle notice:', err);
      }
    })();
  }
  return updatedVehicle;
};

export const rejectVehicle = (
  vehicleId: string,
  reasons: string[] = [],
  notes?: string
): StoredVehicle | null => {
  const vehicles = getStoredVehicles();
  let updatedVehicle: StoredVehicle | null = null;
  const updated = vehicles.map((v) => {
    if (v.id === vehicleId) {
      updatedVehicle = {
        ...v,
        status: 'REJECTED' as const,
        isLive: false,
        rejectionReasons: reasons,
        rejectionNotes: notes,
        rejectedAt: new Date().toISOString(),
      };
      return updatedVehicle;
    }
    return v;
  });
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mt_vehicle_rejected', { detail: updatedVehicle }));
    window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: updatedVehicle }));
  } catch {}

  if (isValidUUID(vehicleId)) {
    (async () => {
      try {
        await supabase
          .from('vehicles')
          .update({
            is_approved: false,
            is_available: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vehicleId);
      } catch (err) {
        console.warn('Supabase rejectVehicle notice:', err);
      }
    })();
  }
  return updatedVehicle;
};

/**
 * Toggles or explicitly sets whether an approved vehicle is "Live" on the marketplace for tourist hire.
 * Exclusively executed by Platform Admin upon host request or operational review.
 * Persists to both live overrides map and stored vehicles, syncs to Supabase if applicable,
 * and notifies all active components.
 */
export const toggleVehicleLiveStatus = (vehicleId: string, forcedState?: boolean): StoredVehicle | null => {
  const currentLive = isVehicleLive(vehicleId);
  const nextLive = forcedState !== undefined ? forcedState : !currentLive;

  // 1. Persist override for this vehicle ID (handles static v-1, v-2... AND registered host vehicles)
  const overrides = getVehicleLiveOverrides();
  overrides[vehicleId] = nextLive;
  try {
    localStorage.setItem(LIVE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {}

  // 2. Update in stored vehicles list if present
  const vehicles = getStoredVehicles();
  let updatedVehicle: StoredVehicle | null = null;
  const updated = vehicles.map((v) => {
    if (v.id === vehicleId) {
      updatedVehicle = { ...v, isLive: nextLive };
      return updatedVehicle;
    }
    return v;
  });

  if (updatedVehicle) {
    try {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
    } catch {}
  } else {
    // Synthetic vehicle representation so callers receive a valid StoredVehicle
    updatedVehicle = {
      id: vehicleId,
      make: 'Vehicle',
      model: vehicleId,
      year: 2024,
      type: 'SUV',
      pricePerDay: 15000,
      seats: 5,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      address: 'Nairobi',
      ownerId: 'admin',
      ownerName: 'Platform Host',
      images: [],
      status: 'APPROVED',
      isLive: nextLive,
      ratingAverage: 5.0,
      ratingCount: 1,
      hasInsurance: true,
      createdAt: new Date().toISOString(),
    };
  }

  // 3. If it's a Supabase vehicle (UUID), asynchronously update Supabase is_available column
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId)) {
    (async () => {
      try {
        const { error } = await supabase
          .from('vehicles')
          .update({ is_available: nextLive })
          .eq('id', vehicleId);
        if (error) console.warn('Could not sync is_available to Supabase:', error.message);
      } catch {}
    })();
  }

  // 4. Dispatch events for instant reactivity
  window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: { id: vehicleId, isLive: nextLive, vehicle: updatedVehicle } }));
  window.dispatchEvent(new Event('storage'));

  return updatedVehicle;
};

export interface VehicleHireStatus {
  isHired: boolean;
  activeBooking?: StoredBooking;
  returnDate?: string;
  touristName?: string;
}

/**
 * Checks if a vehicle is currently actively hired by a tourist.
 * A vehicle is hired when it has a booking in CONFIRMED, ACCEPTED, or IN_PROGRESS state.
 * When returned (COMPLETED) or cancelled, it is automatically released and no longer hired.
 */
export const getVehicleHireStatus = (vehicleId: string): VehicleHireStatus => {
  const bookings = getStoredBookings();
  const activeBooking = bookings.find(
    (b) => b.vehicleId === vehicleId && ['CONFIRMED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)
  );

  if (activeBooking) {
    return {
      isHired: true,
      activeBooking,
      returnDate: activeBooking.endDate,
      touristName: activeBooking.touristName,
    };
  }

  return {
    isHired: false,
  };
};

export const updateStoredBooking = (bookingId: string, partial: Partial<StoredBooking>): StoredBooking | null => {
  const bookings = getStoredBookings();
  let updatedBooking: StoredBooking | null = null;
  const updated = bookings.map(b => {
    if (b.id === bookingId || b.bookingRef === bookingId) {
      updatedBooking = { ...b, ...partial };
      return updatedBooking;
    }
    return b;
  });
  if (updatedBooking) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: updatedBooking }));
    } catch {}
  }
  return updatedBooking;
};

export const updateStoredVehicle = (vehicleId: string, partial: Partial<StoredVehicle>): StoredVehicle | null => {
  const vehicles = getStoredVehicles();
  let updatedVehicle: StoredVehicle | null = null;
  const updated = vehicles.map(v => {
    if (v.id === vehicleId) {
      updatedVehicle = { ...v, ...partial };
      return updatedVehicle;
    }
    return v;
  });
  if (updatedVehicle) {
    try {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: updatedVehicle }));
    } catch {}
  }
  return updatedVehicle;
};

export const updateBookingStatus = (
  bookingIdOrRef: string,
  status: StoredBooking['status'],
  mpesaReceipt?: string
): StoredBooking | null => {
  if (!bookingIdOrRef) return null;
  const bookings = getStoredBookings();
  let updatedBooking: StoredBooking | null = null;
  const cleanKey = bookingIdOrRef.trim().toLowerCase();

  const updated = bookings.map((b) => {
    const matchId = b.id && b.id.trim().toLowerCase() === cleanKey;
    const matchRef = b.bookingRef && b.bookingRef.trim().toLowerCase() === cleanKey;
    if (matchId || matchRef) {
      updatedBooking = {
        ...b,
        status,
        paymentStatus: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? 'PAID' : (status === 'CANCELLED' ? 'PENDING' : b.paymentStatus),
        ...(mpesaReceipt ? { mpesaReceipt } : {}),
      };
      return updatedBooking;
    }
    return b;
  });

  if (!updatedBooking) {
    const fallbackBooking: StoredBooking = {
      id: bookingIdOrRef,
      bookingRef: bookingIdOrRef.toUpperCase().startsWith('MT-') ? bookingIdOrRef.toUpperCase() : `MT-${bookingIdOrRef.slice(0, 8).toUpperCase()}`,
      vehicleId: 'active-safari-vehicle',
      vehicleMake: 'Safari Fleet',
      vehicleModel: 'Vehicle',
      vehicleName: 'Safari Fleet Vehicle',
      vehicleImage: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
      touristId: 'tourist',
      touristName: 'Traveler',
      touristPhone: '0712345678',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalAmount: 0,
      paymentStatus: 'PENDING',
      status,
      createdAt: new Date().toISOString(),
      ...(mpesaReceipt ? { mpesaReceipt } : {}),
    };
    updatedBooking = fallbackBooking;
    updated.unshift(fallbackBooking);
  }

  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: updatedBooking }));
  window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: updatedBooking }));

  if (updatedBooking && isValidUUID((updatedBooking as StoredBooking).id)) {
    (async () => {
      try {
        await supabase
          .from('bookings')
          .update({
            status: status.toUpperCase(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', (updatedBooking as StoredBooking).id);
      } catch (err) {
        console.warn('Supabase updateBookingStatus notice:', err);
      }
    })();
  }

  return updatedBooking;
};

export const deleteBooking = (bookingId: string): boolean => {
  const bookings = getStoredBookings();
  const filtered = bookings.filter(b => b.id !== bookingId && b.bookingRef !== bookingId);
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
  } catch {}
  window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: { id: bookingId, deleted: true } }));
  window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: { id: bookingId, deleted: true } }));

  if (isValidUUID(bookingId)) {
    (async () => {
      try {
        await supabase.from('bookings').delete().eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase deleteBooking notice:', err);
      }
    })();
  }
  return true;
};

/**
 * Rates a completed booking (1 to 5 stars) and recalculates the vehicle or destination average rating.
 */
export const rateBooking = (
  bookingIdOrRef: string,
  rating: number,
  comment?: string,
  tags?: string[]
): { booking: StoredBooking | null; vehicle: StoredVehicle | null } => {
  const bookings = getStoredBookings();
  let updatedBooking: StoredBooking | null = null;
  const cleanKey = bookingIdOrRef.trim().toLowerCase();

  const updatedBookings = bookings.map((b) => {
    const matchId = b.id && b.id.trim().toLowerCase() === cleanKey;
    const matchRef = b.bookingRef && b.bookingRef.trim().toLowerCase() === cleanKey;
    if (matchId || matchRef) {
      updatedBooking = {
        ...b,
        rating,
        reviewComment: comment,
        reviewTags: tags,
        ratedAt: new Date().toISOString(),
      };
      return updatedBooking;
    }
    return b;
  });

  if (updatedBooking) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updatedBookings));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: updatedBooking }));
  }

  // Update corresponding vehicle rating average and count
  let updatedVehicle: StoredVehicle | null = null;
  const vId = updatedBooking ? (updatedBooking as StoredBooking).vehicleId : null;
  if (vId) {
    const vehicles = getStoredVehicles();
    const updatedVehicles = vehicles.map((v) => {
      if (v.id === vId) {
        const prevCount = v.ratingCount || 0;
        const prevAvg = v.ratingAverage || 4.8;
        const newCount = prevCount + 1;
        const newAvg = Number(((prevAvg * prevCount + rating) / newCount).toFixed(1));
        updatedVehicle = {
          ...v,
          ratingCount: newCount,
          ratingAverage: newAvg,
        };
        return updatedVehicle;
      }
      return v;
    });

    if (updatedVehicle) {
      try {
        localStorage.setItem(VEHICLES_KEY, JSON.stringify(updatedVehicles));
      } catch {}
      window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: updatedVehicle }));

      if (isValidUUID(vId)) {
        (async () => {
          try {
            await supabase
              .from('vehicles')
              .update({
                rating_average: (updatedVehicle as StoredVehicle).ratingAverage,
                rating_count: (updatedVehicle as StoredVehicle).ratingCount,
              })
              .eq('id', vId);
          } catch (err) {
            console.warn('Supabase rateBooking vehicle rating notice:', err);
          }
        })();
      }
    }
  }

  // Insert review row to Supabase `reviews` table
  if (updatedBooking && isValidUUID((updatedBooking as StoredBooking).id)) {
    (async () => {
      try {
        const ub = updatedBooking as StoredBooking;
        await supabase.from('reviews').insert({
          author_id: isValidUUID(ub.touristId) ? ub.touristId : null,
          vehicle_id: isValidUUID(ub.vehicleId) ? ub.vehicleId : null,
          booking_id: ub.id,
          rating,
          comment: comment || null,
        });
      } catch (err) {
        console.warn('Supabase review insert notice:', err);
      }
    })();
  }

  return { booking: updatedBooking, vehicle: updatedVehicle };
};

/**
 * Retrieves registered vehicles for the fleet host.
 * Demo starter vehicle injection is disabled per specification (strictly host-registered & admin-approved vehicles only).
 */
export const claimDemoFleetForHost = (hostId: string, _hostName?: string, _hostEmail?: string): StoredVehicle[] => {
  const vehicles = getStoredVehicles();
  return vehicles.filter(v => v.ownerId === hostId);
};

/**
 * Generates a realistic sample tourist booking request for a host's vehicle.
 */
export const generateSampleBookingForVehicle = (
  vehicleId: string,
  hostId: string,
  vehicleMake: string,
  vehicleModel: string,
  pricePerDay: number
): StoredBooking => {
  const tourists = [
    { name: 'Dr. Clara Schmidt', phone: '0722 849 201' },
    { name: 'Michael Thorne', phone: '0711 902 445' },
    { name: 'Dr. Amani Kiprono', phone: '0733 410 882' },
  ];
  const tourist = tourists[Math.floor(Math.random() * tourists.length)];
  const days = 3;
  const totalAmount = pricePerDay * days;
  const now = Date.now();
  const startDate = new Date(now + 86400000).toISOString().split('T')[0];
  const endDate = new Date(now + 86400000 * (1 + days)).toISOString().split('T')[0];

  const booking = saveBooking({
    bookingRef: `MT-HST-${Math.floor(100000 + Math.random() * 900000)}`,
    vehicleId,
    vehicleMake,
    vehicleModel,
    vehicleName: `${vehicleMake} ${vehicleModel}`,
    vehicleImage: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    ownerId: hostId,
    driverName: 'Host Assigned Certified Driver',
    touristId: `usr-tourist-${Date.now()}`,
    touristName: tourist.name,
    touristPhone: tourist.phone,
    startDate,
    endDate,
    totalAmount,
    paymentStatus: 'PAID',
    mpesaReceipt: `QK${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'PENDING',
  });

  return booking;
};

/**
 * Assign a driver to a booking
 */
export const assignDriverToBooking = (
  bookingId: string,
  driverId: string,
  driverName: string,
  driverPhone?: string
): StoredBooking | null => {
  const bookings = getStoredBookings();
  let updatedBooking: StoredBooking | null = null;
  const updated = bookings.map((b) => {
    if (b.id === bookingId || b.bookingRef === bookingId) {
      updatedBooking = {
        ...b,
        driverId,
        driverName,
        driverPhone: driverPhone || b.driverPhone || '0799887766',
        status: b.status === 'PENDING' ? 'CONFIRMED' : 'DRIVER_ASSIGNED',
      };
      return updatedBooking;
    }
    return b;
  });

  if (updatedBooking) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: updatedBooking }));
    window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: updatedBooking }));
  }
  return updatedBooking;
};

/**
 * Assign a certified driver to a fleet vehicle
 */
export const assignDriverToVehicle = (
  vehicleId: string,
  driverId: string,
  driverName: string,
  driverPhone?: string
): StoredVehicle | null => {
  const vehicles = getStoredVehicles();
  let updatedVehicle: StoredVehicle | null = null;
  const updated = vehicles.map((v) => {
    if (v.id === vehicleId) {
      updatedVehicle = {
        ...v,
        driverId,
        driverName,
        driverPhone: driverPhone || '0799887766',
        updatedAt: new Date().toISOString(),
      };
      return updatedVehicle;
    }
    return v;
  });

  if (updatedVehicle) {
    try {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: updatedVehicle }));
  }
  return updatedVehicle;
};

/**
 * Mark that the driver has reached the traveler's pickup location
 */
export const markDriverArrived = (bookingId: string): StoredBooking | null => {
  const bookings = getStoredBookings();
  let target: StoredBooking | null = null;
  const updated = bookings.map((b) => {
    if (b.id === bookingId || b.bookingRef === bookingId) {
      target = {
        ...b,
        status: 'DRIVER_ARRIVED',
      };
      return target;
    }
    return b;
  });

  if (target) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: target }));
    window.dispatchEvent(new CustomEvent('mt_driver_arrived', { detail: target }));
  }
  return target;
};

/**
 * Start the road trip (status -> IN_PROGRESS)
 */
export const startTripForBooking = (bookingId: string): StoredBooking | null => {
  const bookings = getStoredBookings();
  let target: StoredBooking | null = null;
  const updated = bookings.map((b) => {
    if (b.id === bookingId || b.bookingRef === bookingId) {
      target = {
        ...b,
        status: 'IN_PROGRESS',
      };
      return target;
    }
    return b;
  });

  if (target) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: target }));
  }
  return target;
};

/**
 * Complete the trip (status -> COMPLETED)
 */
export const completeTripForBooking = (bookingId: string): StoredBooking | null => {
  const bookings = getStoredBookings();
  let target: StoredBooking | null = null;
  const updated = bookings.map((b) => {
    if (b.id === bookingId || b.bookingRef === bookingId) {
      target = {
        ...b,
        status: 'COMPLETED',
      };
      return target;
    }
    return b;
  });

  if (target) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_booking_status_changed', { detail: target }));
    window.dispatchEvent(new CustomEvent('mt_trip_completed', { detail: target }));
  }
  return target;
};

/**
 * Fetch bookings assigned to a specific driver or available for assignment
 */
export const getDriverBookings = (driverId?: string): StoredBooking[] => {
  const all = getStoredBookings();
  if (!driverId) return all;
  return all.filter(
    (b) =>
      b.driverId === driverId ||
      b.driverName?.toLowerCase().includes('samuel') ||
      b.status === 'DRIVER_ASSIGNED' ||
      b.status === 'DRIVER_ARRIVED' ||
      b.status === 'IN_PROGRESS' ||
      b.status === 'CONFIRMED'
  );
};

/**
 * Update the pickup method ('DRIVER_DELIVER' vs 'SELF_COLLECT')
 */
export const updateBookingPickupMethod = (
  bookingId: string,
  pickupMethod: 'SELF_COLLECT' | string = 'SELF_COLLECT',
  coords?: { pickupLat?: number; pickupLng?: number; destLat?: number; destLng?: number }
): StoredBooking | null => {
  const bookings = getStoredBookings();
  let target: StoredBooking | null = null;
  const updated = bookings.map((b) => {
    if (b.id === bookingId || b.bookingRef === bookingId) {
      target = {
        ...b,
        pickupMethod,
        ...(coords?.pickupLat !== undefined ? { pickupLat: coords.pickupLat } : {}),
        ...(coords?.pickupLng !== undefined ? { pickupLng: coords.pickupLng } : {}),
        ...(coords?.destLat !== undefined ? { destinationLat: coords.destLat } : {}),
        ...(coords?.destLng !== undefined ? { destinationLng: coords.destLng } : {}),
      };
      return target;
    }
    return b;
  });

  if (target) {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: target }));
  }
  return target;
};
