/**
 * M-TRAVEL Destinations, Guided Safaris & Holiday Homes Store
 * Centralized reactive store for travel destinations, tour packages, and holiday homes.
 * Admins can add, update, toggle live status, and delete items.
 * Travelers consume the live items on the "Holidays and Tours" page.
 * Default factory reset state: 0 tours/holidays until published by admin.
 */

import { supabase } from './supabaseClient';

export type HolidayOrTourCategory = 'TOUR' | 'HOLIDAY_HOME' | 'DESTINATION';

export interface TravelDestinationItem {
  id: string;
  category: HolidayOrTourCategory;
  title: string;
  subtitle: string;
  badge: string;
  priceKES: number;
  priceUnit: string; // e.g. '/ person', '/ night', '/ package'
  imageUrl: string;
  images?: string[]; // Multi-photo gallery support
  location: string;
  region: string;
  specs: string[];
  rating: number;
  reviews: number;
  isLive: boolean;
  featured?: boolean;
  featuredInServices?: boolean; // Display in Services page "Tourism Vibe & Experiences" (max 6)
  details: {
    overview: string;
    highlights: string[];
    scheduleOrItinerary?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'mt_shared_destinations_v1';

// Initial destinations default to empty array (factory reset clean state)
export const INITIAL_DESTINATIONS: TravelDestinationItem[] = [];

/**
 * Retrieve all travel destinations, tour packages, and holiday homes from persistent local store.
 */
export function getStoredDestinations(): TravelDestinationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

export async function syncDestinationsToSupabase() {
  try {
    const items = getStoredDestinations();
    if (items.length === 0) return;
    for (const d of items) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.id);
      const cleanHex = d.id.replace(/[^0-9a-f]/gi, '').padEnd(12, '0').slice(-12);
      const validId = isUuid ? d.id : `d0000000-0000-4000-8000-${cleanHex}`;

      await supabase.from('tours').upsert({
        id: validId,
        title: d.title,
        category: (d.category || 'TOUR').toUpperCase(),
        description: d.details?.overview || d.subtitle || d.title,
        price: Number(d.priceKES || 0),
        duration_days: 3,
        created_at: d.createdAt || new Date().toISOString(),
      }, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('syncDestinationsToSupabase notice:', err);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncDestinationsToSupabase().catch(() => {});
  }, 500);
}

/**
 * Save / Create a new destination or holiday package (Admin only)
 */
export function saveDestination(
  item: Omit<TravelDestinationItem, 'id' | 'createdAt' | 'updatedAt'> | TravelDestinationItem
): TravelDestinationItem {
  const all = getStoredDestinations();
  const now = new Date().toISOString();
  const id = 'id' in item && item.id ? item.id : `dest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newItem: TravelDestinationItem = {
    ...item,
    id,
    createdAt: 'createdAt' in item && item.createdAt ? item.createdAt : now,
    updatedAt: now,
  };

  const index = all.findIndex((d) => d.id === id);
  if (index >= 0) {
    all[index] = newItem;
  } else {
    all.unshift(newItem);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('mt_destinations_updated', { detail: { destination: newItem } }));
  syncDestinationsToSupabase().catch(() => {});
  return newItem;
}

/**
 * Update existing destination (Admin only)
 */
export function updateDestination(
  id: string,
  updates: Partial<TravelDestinationItem>
): TravelDestinationItem | null {
  const all = getStoredDestinations();
  const index = all.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const updated: TravelDestinationItem = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('mt_destinations_updated', { detail: { destination: updated } }));
  syncDestinationsToSupabase().catch(() => {});
  return updated;
}

/**
 * Toggle live / published status (Admin only)
 */
export function toggleDestinationLiveStatus(id: string): boolean {
  const all = getStoredDestinations();
  const target = all.find((d) => d.id === id);
  if (!target) return false;

  target.isLive = !target.isLive;
  target.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('mt_destinations_updated', { detail: { destination: target } }));
  syncDestinationsToSupabase().catch(() => {});
  return target.isLive;
}

/**
 * Delete destination or holiday home (Admin only)
 */
export function deleteDestination(id: string): boolean {
  const all = getStoredDestinations();
  const filtered = all.filter((d) => d.id !== id);
  if (filtered.length === all.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('mt_destinations_updated', { detail: { deletedId: id } }));
  syncDestinationsToSupabase().catch(() => {});
  return true;
}

/**
 * Toggle whether a destination or tour is featured in the Services page "Tourism Vibe & Experiences" section (Max 6)
 */
export function toggleDestinationServicesFeatured(id: string): { success: boolean; featured: boolean; count: number; error?: string } {
  const all = getStoredDestinations();
  const target = all.find((d) => d.id === id);
  if (!target) return { success: false, featured: false, count: 0, error: 'Destination not found' };

  const currentFeatured = all.filter((d) => d.featuredInServices);
  const currentlyFeatured = !!target.featuredInServices;

  if (!currentlyFeatured) {
    if (currentFeatured.length >= 6) {
      return {
        success: false,
        featured: false,
        count: currentFeatured.length,
        error: 'Maximum 6 packages can be featured in Tourism Vibe & Experiences on the Services page. Please unfeature another listing first.'
      };
    }
    target.featuredInServices = true;
  } else {
    target.featuredInServices = false;
  }

  target.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('mt_destinations_updated', { detail: { destination: target } }));
  syncDestinationsToSupabase().catch(() => {});

  const newCount = all.filter((d) => d.featuredInServices).length;
  return { success: true, featured: !!target.featuredInServices, count: newCount };
}

/**
 * Retrieve destinations to display in Services page "Tourism Vibe & Experiences"
 * If 0 admin destinations exist across the platform, returns [] (triggering fallback default vibes with no prices).
 * If admin packages exist:
 *  - returns explicitly featured ones (up to 6), or if none explicitly flagged, the first up to 6 live items.
 */
export function getServicesVibesDestinations(): TravelDestinationItem[] {
  const all = getStoredDestinations();
  if (all.length === 0) return [];

  const explicitlyFeatured = all.filter((d) => d.featuredInServices && d.isLive);
  if (explicitlyFeatured.length > 0) {
    return explicitlyFeatured.slice(0, 6);
  }

  // Fallback: If packages exist in admin catalog, display up to 6 live ones
  const liveItems = all.filter((d) => d.isLive);
  return liveItems.slice(0, 6);
}
