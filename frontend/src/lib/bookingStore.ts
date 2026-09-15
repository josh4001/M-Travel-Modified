import { supabase, getVehicleFallbackImage } from './supabaseClient';

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
  driverName?: string;
  touristId: string;
  touristName: string;
  touristPhone: string;
  touristEmail?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  mpesaReceipt?: string;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED';
  pickupLocation?: string;
  dropoffLocation?: string;
  createdAt: string;
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
  images: string[];
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isLive?: boolean;
  ratingAverage: number;
  ratingCount: number;
  hasInsurance: boolean;
  plateNumber?: string;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
  createdAt: string;
}

const BOOKINGS_KEY = 'mt_shared_bookings_v2';
const VEHICLES_KEY = 'mt_shared_vehicles_v2';

// --- INITIAL DEFAULT SEED DATA ---
const DEFAULT_BOOKINGS: StoredBooking[] = [
  {
    id: 'b-101',
    bookingRef: 'MT-884920',
    vehicleId: '00000000-0000-0000-0000-000000000001',
    vehicleMake: 'Toyota',
    vehicleModel: 'Land Cruiser Prado',
    vehicleName: 'Toyota Land Cruiser Prado',
    vehicleImage: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    driverName: 'Samuel Omondi',
    touristId: 'user-tourist-1',
    touristName: 'Sarah Ochieng',
    touristPhone: '0712345678',
    touristEmail: 'sarah.ochieng@gmail.com',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    totalAmount: 42000,
    paymentStatus: 'PAID',
    mpesaReceipt: 'QK89X201',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b-102',
    bookingRef: 'MT-221045',
    vehicleId: 'v-alphard-2',
    vehicleMake: 'Toyota',
    vehicleModel: 'Alphard Executive Lounge',
    vehicleName: 'Toyota Alphard Executive Lounge',
    vehicleImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    ownerId: 'owner-2',
    driverName: 'Grace Mutua',
    touristId: 'user-tourist-2',
    touristName: 'John Kamau',
    touristPhone: '0798765432',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    totalAmount: 24000,
    paymentStatus: 'PENDING',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_VEHICLES: StoredVehicle[] = [
  {
    id: 'ab0dd85b-15bc-45d9-8fb8-1b3f7908b904',
    make: 'Mercedes-Benz',
    model: 'G-Wagon AMG',
    year: 2024,
    type: 'SUV',
    pricePerDay: 35000,
    seats: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    address: 'Westlands / Karen, Nairobi',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 5.0,
    ratingCount: 18,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '35d3ca61-971e-434c-ae2f-cb6601fd7376',
    make: 'Mercedes-Benz',
    model: 'G-Wagon G63',
    year: 2024,
    type: 'SUV',
    pricePerDay: 20000,
    seats: 5,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    address: 'Kilimani, Nairobi',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.95,
    ratingCount: 14,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c53e7096-a526-4101-8c8c-10838d828545',
    make: 'Mercedes-Benz',
    model: 'G-Wagon V8',
    year: 2025,
    type: 'SUV',
    pricePerDay: 30000,
    seats: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    address: 'Lavington, Nairobi',
    ownerId: '6267558e-796a-46fa-bb68-53df294fdbed',
    ownerName: 'Martha Kane',
    ownerEmail: 'martha@gmail.com',
    images: ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.9,
    ratingCount: 9,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    make: 'Toyota',
    model: 'Land Cruiser Prado TX',
    year: 2022,
    type: 'SUV',
    pricePerDay: 14000,
    seats: 7,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    address: 'Nairobi JKIA / Westlands',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.9,
    ratingCount: 36,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e3aedb74-5c0a-4932-b33b-94430fe5edf1',
    make: 'Toyota',
    model: 'Coaster VIP Bus',
    year: 2020,
    type: 'VAN',
    pricePerDay: 9500,
    seats: 25,
    fuelType: 'Diesel',
    transmission: 'Manual',
    address: 'CBD / Wilson Airport, Nairobi',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.8,
    ratingCount: 22,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    make: 'Toyota',
    model: 'RAV4 AWD',
    year: 2023,
    type: 'SUV',
    pricePerDay: 9500,
    seats: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    address: 'Nairobi Central',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.85,
    ratingCount: 19,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    make: 'Toyota',
    model: 'Hiace Safari Van 4WD',
    year: 2021,
    type: 'VAN',
    pricePerDay: 11500,
    seats: 9,
    fuelType: 'Diesel',
    transmission: 'Manual',
    address: 'Nairobi & National Parks',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.75,
    ratingCount: 27,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    make: 'Toyota',
    model: 'Premio Executive',
    year: 2022,
    type: 'CAR',
    pricePerDay: 5500,
    seats: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    address: 'Mombasa / Diani Beach',
    ownerId: 'a0000000-0000-0000-0000-000000000002',
    ownerName: 'James Mwangi',
    ownerEmail: 'james.mwangi@mtravel.co.ke',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.8,
    ratingCount: 15,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-safari-1',
    make: 'Toyota',
    model: 'Land Cruiser 4x4 V8 Safari',
    year: 2023,
    type: '4x4',
    pricePerDay: 15000,
    seats: 7,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    address: 'Nairobi JKIA / Westlands',
    ownerId: 'owner-1',
    ownerName: 'Samuel Omondi',
    images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.9,
    ratingCount: 42,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-alphard-2',
    make: 'Toyota',
    model: 'Alphard Executive Lounge',
    year: 2022,
    type: 'VAN',
    pricePerDay: 12000,
    seats: 7,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    address: 'Mombasa / Diani Beach',
    ownerId: 'owner-2',
    ownerName: 'Grace Mutua',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    status: 'APPROVED',
    isLive: true,
    ratingAverage: 4.85,
    ratingCount: 38,
    hasInsurance: true,
    createdAt: new Date().toISOString(),
  },
];

// Helper Functions
export const getStoredBookings = (): StoredBooking[] => {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(DEFAULT_BOOKINGS));
      return DEFAULT_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BOOKINGS;
  }
};

export const saveBooking = (booking: Omit<StoredBooking, 'id' | 'createdAt'>): StoredBooking => {
  const existing = getStoredBookings();
  const newBooking: StoredBooking = {
    ...booking,
    vehicleName: booking.vehicleName || `${booking.vehicleMake} ${booking.vehicleModel}`,
    id: `b-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newBooking, ...existing];
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mt_booking_updated', { detail: newBooking }));
  return newBooking;
};

export const getStoredVehicles = (): StoredVehicle[] => {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    }
    return parsed;
  } catch {
    return DEFAULT_VEHICLES;
  }
};

/** Synchronize all vehicles registered by hosts from Supabase into localStorage */
export const syncVehiclesFromSupabase = async (): Promise<StoredVehicle[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images(id, url, is_primary),
        users:owner_id(id, first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('syncVehiclesFromSupabase error:', error);
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

    // Map each Supabase vehicle into a StoredVehicle
    const mappedSupabase: StoredVehicle[] = data.map((v: any) => {
      const existing = localMap.get(v.id);
      const owner = v.users || {};
      const ownerName = [owner.first_name, owner.last_name].filter(Boolean).join(' ') || existing?.ownerName || 'Fleet Host';

      const images: string[] = (Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0)
        ? v.vehicle_images.map((img: any) => img.url).filter(Boolean)
        : (existing?.images && existing.images.length > 0)
          ? existing.images
          : [getVehicleFallbackImage(v.make, v.model, v.type)];

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
        isLive: v.is_available !== false,
        ratingAverage: Number(v.rating_average || 4.9),
        ratingCount: Number(v.rating_count || 12),
        hasInsurance: v.has_insurance !== false,
        plateNumber: v.plate_number || existing?.plateNumber,
        latitude: v.latitude ?? -1.2921,
        longitude: v.longitude ?? 36.8219,
        createdAt: v.created_at || existing?.createdAt || new Date().toISOString(),
      };
    });

    // Merge: Supabase vehicles take precedence, preserve local-only additions
    const sbIds = new Set(mappedSupabase.map(v => v.id));
    const merged: StoredVehicle[] = [...mappedSupabase];
    for (const lv of currentLocal) {
      if (!sbIds.has(lv.id)) {
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
  const newVehicle: StoredVehicle = {
    ...vehicle,
    id: `v-${Date.now()}`,
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
    // Fallback: If quota exceeded, sanitize images to standard fallback URLs
    const sanitized = updated.map(v => ({
      ...v,
      images: v.images.map((img, i) => img.startsWith('data:') ? (i === 0 ? 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80') : img)
    }));
    try {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(sanitized));
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: newVehicle }));
  return newVehicle;
};

export const deleteVehicle = (vehicleId: string): boolean => {
  const vehicles = getStoredVehicles();
  const filtered = vehicles.filter(v => v.id !== vehicleId);
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: { id: vehicleId, deleted: true } }));
    return true;
  } catch {
    return false;
  }
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
  return updatedVehicle;
};

/**
 * Toggles or explicitly sets whether an approved vehicle is "Live" on the marketplace for tourist hire.
 * Exclusively executed by Platform Admin upon host request or operational review.
 */
export const toggleVehicleLiveStatus = (vehicleId: string, forcedState?: boolean): StoredVehicle | null => {
  const vehicles = getStoredVehicles();
  let updatedVehicle: StoredVehicle | null = null;
  const updated = vehicles.map((v) => {
    if (v.id === vehicleId) {
      const currentLive = v.isLive !== false;
      const nextLive = forcedState !== undefined ? forcedState : !currentLive;
      updatedVehicle = { ...v, isLive: nextLive };
      return updatedVehicle;
    }
    return v;
  });
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: updatedVehicle }));
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
      vehicleId: 'v-safari-1',
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
  return true;
};

/**
 * Assigns demo starter vehicles to the current fleet host so they can test immediately.
 */
export const claimDemoFleetForHost = (hostId: string, hostName: string, hostEmail?: string): StoredVehicle[] => {
  const vehicles = getStoredVehicles();
  const existingForHost = vehicles.filter(v => v.ownerId === hostId);
  if (existingForHost.length > 0) return existingForHost;

  const starterCars: StoredVehicle[] = [
    {
      id: `v-host-safari-${Date.now()}`,
      make: 'Toyota',
      model: 'Land Cruiser 4x4 Prado VX',
      year: 2024,
      type: '4x4',
      pricePerDay: 16000,
      seats: 7,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      address: 'Nairobi JKIA / Westlands',
      ownerId: hostId,
      ownerName: hostName,
      ownerEmail: hostEmail,
      images: [
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'APPROVED',
      isLive: true,
      ratingAverage: 4.9,
      ratingCount: 18,
      hasInsurance: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `v-host-alphard-${Date.now() + 1}`,
      make: 'Toyota',
      model: 'Alphard Executive Lounge VIP',
      year: 2023,
      type: 'VAN',
      pricePerDay: 13500,
      seats: 7,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      address: 'Mombasa / Diani Beach Hub',
      ownerId: hostId,
      ownerName: hostName,
      ownerEmail: hostEmail,
      images: [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80'
      ],
      status: 'APPROVED',
      isLive: true,
      ratingAverage: 4.8,
      ratingCount: 12,
      hasInsurance: true,
      createdAt: new Date().toISOString(),
    }
  ];

  const updated = [...starterCars, ...vehicles];
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('mt_vehicle_updated', { detail: starterCars }));
  return starterCars;
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
