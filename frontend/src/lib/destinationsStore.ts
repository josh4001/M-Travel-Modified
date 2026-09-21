/**
 * M-TRAVEL Destinations, Guided Safaris & Holiday Homes Store
 * Centralized reactive store for travel destinations, tour packages, and holiday homes.
 * Admins can add, update, toggle live status, and delete items.
 * Travelers consume the live items on the "Holidays and Tours" page.
 */

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
  location: string;
  region: string;
  specs: string[];
  rating: number;
  reviews: number;
  isLive: boolean;
  featured?: boolean;
  details: {
    overview: string;
    highlights: string[];
    scheduleOrItinerary?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'mt_shared_destinations_v1';

export const INITIAL_DESTINATIONS: TravelDestinationItem[] = [
  // ── GUIDED TOURS & SAFARIS ──────────────────────────────────────────
  {
    id: 'dest-tour-1',
    category: 'TOUR',
    title: '3-Day Maasai Mara Great Migration Safari',
    subtitle: 'All-inclusive 4x4 Land Cruiser game drives, luxury safari lodge stay, park entry & gourmet meals',
    badge: 'Premier Safari Tour',
    priceKES: 45000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    location: 'Maasai Mara National Reserve',
    region: 'Narok County, Kenya',
    specs: ['3 Days / 2 Nights', 'Full Board Lodge', 'KPSGA Expert Guide', 'Park Entry Included'],
    rating: 4.98,
    reviews: 320,
    isLive: true,
    featured: true,
    details: {
      overview: 'Experience the legendary Great Migration across the untamed Mara ecosystem. Witness the Big Five, dramatic Mara River crossings, and authentic Maasai cultural visits with private 4x4 Land Cruiser transit.',
      highlights: [
        'Custom 4x4 pop-up roof Land Cruiser with binoculars & charging ports',
        'Luxury tented safari camp accommodation along the Talek River',
        'All gourmet meals, bush breakfast & sundowner cocktails included',
        'All national park conservation fees and professional guide fees covered',
      ],
      scheduleOrItinerary: [
        'Day 1: Departure from Nairobi, Great Rift Valley viewpoint stop, arrive Mara for sunset game drive.',
        'Day 2: Full-day Mara game drive with picnic lunch near Mara River crossing points.',
        'Day 3: Sunrise game drive, Maasai cultural boma visit, return transit to Nairobi.',
      ],
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'dest-tour-2',
    category: 'TOUR',
    title: 'Amboseli Kilimanjaro Giant Tusker Expedition',
    subtitle: 'Close-up elephant herd encounters against the majestic backdrop of snow-capped Mt. Kilimanjaro',
    badge: 'Iconic Wildlife Tour',
    priceKES: 36000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
    location: 'Amboseli National Park',
    region: 'Kajiado County, Kenya',
    specs: ['2 Days / 1 Night', 'Luxury Safari Lodge', 'Mt. Kilimanjaro Views', 'All Meals Included'],
    rating: 4.92,
    reviews: 195,
    isLive: true,
    featured: true,
    details: {
      overview: 'Amboseli is globally celebrated as the best place in Africa to get up close to free-ranging elephants with iconic views of Mount Kilimanjaro towering in the background.',
      highlights: [
        'Observation Hill lookout offering 360-degree views of the Amboseli swamps',
        'Encounter the famous large-tusked elephant bull dynasties',
        'Luxury lodge stay with infinity pool overlooking the watering hole',
        'Observation of hippos, cheetahs, lions, and over 400 bird species',
      ],
      scheduleOrItinerary: [
        'Day 1: Morning departure from Nairobi, check-in at lodge, afternoon game drive at Enkongo Narok swamp.',
        'Day 2: Early dawn game drive for clear Kilimanjaro peaks photography, breakfast, and return journey.',
      ],
    },
    createdAt: '2026-01-20T09:00:00.000Z',
    updatedAt: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'dest-tour-3',
    category: 'TOUR',
    title: 'Swahili Diani Beach Luxury Ocean Getaway',
    subtitle: 'Return flights from Nairobi, oceanfront resort suite, private glass-bottom dhow & seafood dining',
    badge: 'Coastal Beach Package',
    priceKES: 38000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    location: 'Diani Beach & Galu Coast',
    region: 'Kwale County, Kenya',
    specs: ['4 Days / 3 Nights', '5-Star Beach Resort', 'Return Flights Included', 'Coral Reef Snorkeling'],
    rating: 4.9,
    reviews: 180,
    isLive: true,
    featured: false,
    details: {
      overview: 'Unwind on the world-famous white sands of Diani Beach. Includes return flight tickets from Nairobi Wilson to Ukunda, beachfront resort suite, private dhow cruise, and fresh seafood dinner.',
      highlights: [
        'Return flights (Nairobi Wilson ⇄ Ukunda Diani Airstrip)',
        'Deluxe oceanfront suite at 5-star resort with private balcony',
        'Wasini Island dhow cruise with dolphin spotting and coral reef snorkeling',
        'Daily buffet breakfast and multi-course coastal seafood dinners',
      ],
      scheduleOrItinerary: [
        'Day 1: Flight Wilson → Ukunda, VIP airport transfer, resort check-in & sunset cocktail.',
        'Day 2: Wasini Island marine park safari, dolphin cruise & seafood lunch.',
        'Day 3: Leisure beach day, spa therapy & water sports.',
        'Day 4: Morning shoreline walk, souvenir shopping & flight back to Nairobi.',
      ],
    },
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'dest-tour-4',
    category: 'TOUR',
    title: 'Lake Nakuru & Hell’s Gate Adventure',
    subtitle: 'Pink flamingo spectacles, endangered black rhino sanctuary, and cycling gorges in Hell’s Gate',
    badge: 'Rift Valley Expedition',
    priceKES: 24000,
    priceUnit: '/ person',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    location: 'Lake Nakuru & Naivasha',
    region: 'Nakuru County, Kenya',
    specs: ['2 Days / 1 Night', 'Rhino Sanctuary', 'Geothermal Spa Access', 'Hell’s Gate Hiking'],
    rating: 4.88,
    reviews: 142,
    isLive: true,
    featured: false,
    details: {
      overview: 'Explore the Great Rift Valley’s finest treasures. Tour Lake Nakuru National Park to observe Rothschild giraffes and rhinos, followed by outdoor biking and canyon walks in Hell’s Gate.',
      highlights: [
        'Guaranteed sightings in the Lake Nakuru Rhino Sanctuary',
        'Biking through Hell’s Gate National Park among zebra and gazelle herds',
        'Warm geothermal plunge pool experience at Olkaria Geothermal Spa',
        'Boat ride on freshwater Lake Naivasha to view resident hippos',
      ],
      scheduleOrItinerary: [
        'Day 1: Nairobi to Lake Nakuru game drive, cliff viewpoints, overnight at Lake Nakuru Lodge.',
        'Day 2: Morning transit to Naivasha, Hell’s Gate gorge hike, boat safari, return to Nairobi.',
      ],
    },
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-02-10T11:00:00.000Z',
  },

  // ── HOLIDAY HOMES & LUXURY VILLAS ──────────────────────────────────
  {
    id: 'dest-home-1',
    category: 'HOLIDAY_HOME',
    title: 'Mara River View Safari Lodge Villa',
    subtitle: 'Private infinity pool, personal chef service, and panoramic ridge views of crossing wildebeest',
    badge: 'Ultra-Luxury Villa',
    priceKES: 32000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    location: 'Mara Triangle Edge',
    region: 'Narok County, Kenya',
    specs: ['4 Ensuite Bedrooms', 'Private Infinity Pool', 'Personal Chef & Butler', 'Starlink 5G WiFi'],
    rating: 4.96,
    reviews: 58,
    isLive: true,
    featured: true,
    details: {
      overview: 'Exclusive 4-bedroom villa perched on a private ridge overlooking the Mara River. Comes with private infinity pool, dedicated resident chef, solar eco-power, and 24/7 Maasai security.',
      highlights: [
        '4 King-bed ensuite master bedrooms with panoramic veranda decks',
        'Private heated infinity pool facing wildlife watering holes',
        'Personal private chef and discreet butler service included',
        'Full solar power backup and high-speed satellite Starlink internet',
      ],
      scheduleOrItinerary: [
        'Check-in: 02:00 PM — Welcome glass of sparkling juice & villa orientation',
        'Dining: Customizable three-course menus prepared by personal chef',
        'Check-out: 11:00 AM — Departure assistance and luggage transfer',
      ],
    },
    createdAt: '2026-02-14T12:00:00.000Z',
    updatedAt: '2026-02-14T12:00:00.000Z',
  },
  {
    id: 'dest-home-2',
    category: 'HOLIDAY_HOME',
    title: 'Diani Coral Bay Oceanfront Beach Villa',
    subtitle: 'Direct private beach access, tropical palm gardens, lagoon pool, and private seafood barbecue',
    badge: 'Beachfront Haven',
    priceKES: 28000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    location: 'Galu Kinondo, South Coast',
    region: 'Kwale County, Kenya',
    specs: ['5 Bedrooms', 'Direct Beach Access', 'Private Pool', 'Air Conditioning & Chef'],
    rating: 4.94,
    reviews: 74,
    isLive: true,
    featured: true,
    details: {
      overview: 'Step straight from your private patio onto the powdery white sand of Galu Beach. Features 5 Swahili-architecture bedrooms, huge private courtyard pool, and a private chef.',
      highlights: [
        'Unobstructed turquoise Indian Ocean views from every suite',
        'Expansive 18-meter swimming pool surrounded by tropical bougainvillea',
        'In-house chef specializing in fresh lobster, prawns, and Swahili curries',
        'Daily housekeeping, laundry services, and round-the-clock security',
      ],
      scheduleOrItinerary: [
        'Check-in: 01:00 PM',
        'Concierge: Airport transfers from Ukunda or Mombasa arranged on request',
        'Check-out: 10:00 AM',
      ],
    },
    createdAt: '2026-02-20T14:00:00.000Z',
    updatedAt: '2026-02-20T14:00:00.000Z',
  },
  {
    id: 'dest-home-3',
    category: 'HOLIDAY_HOME',
    title: 'Great Rift Valley Naivasha Acacia Sanctuary Cottage',
    subtitle: 'Charming stone cottage nestled in wildlife corridor with zebra and giraffe roaming the garden',
    badge: 'Highland Retreat',
    priceKES: 19500,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    location: 'Moi South Lake Road, Naivasha',
    region: 'Nakuru County, Kenya',
    specs: ['3 Bedrooms', 'Cozy Fireplace', 'Private Garden Sanctuary', 'Lake Naivasha Views'],
    rating: 4.89,
    reviews: 62,
    isLive: true,
    featured: false,
    details: {
      overview: 'Peaceful stone cottage located inside a private wildlife sanctuary along Lake Naivasha. Enjoy morning coffee on the lawn as harmless zebras and waterbucks graze right by your patio.',
      highlights: [
        'Spacious living room with stone wood-burning fireplace for cool highland nights',
        'Full kitchen with chef on request or self-catering options',
        'Direct lake access with private boat jetty for morning birdwatching',
        'Outdoor stone barbecue and covered dining pavilion',
      ],
      scheduleOrItinerary: [
        'Check-in: 02:00 PM',
        'Wildlife curfew: Gate locked at 10:00 PM for animal safety',
        'Check-out: 11:00 AM',
      ],
    },
    createdAt: '2026-02-25T15:00:00.000Z',
    updatedAt: '2026-02-25T15:00:00.000Z',
  },
  {
    id: 'dest-home-4',
    category: 'HOLIDAY_HOME',
    title: 'Mount Kenya Alpine Forest Canopy Lodge',
    subtitle: 'Crisp mountain air, trout fishing stream, cedar fireplaces, and private heli-pad access',
    badge: 'Alpine Mountain Lodge',
    priceKES: 26000,
    priceUnit: '/ night',
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    location: 'Nanyuki Mount Kenya Foothills',
    region: 'Laikipia County, Kenya',
    specs: ['4 Bedrooms', 'Cedar Wood Fireplaces', 'Fly-Fishing Stream', 'Mountain Guides Available'],
    rating: 4.93,
    reviews: 39,
    isLive: true,
    featured: false,
    details: {
      overview: 'Perched on the equatorial slopes of Mount Kenya, this hand-crafted cedar lodge provides serene seclusion with crackling fires, pure glacial mountain streams, and proximity to Ol Pejeta conservancy.',
      highlights: [
        'Views of the snow-crested Batian and Nelion peaks of Mount Kenya',
        'Private trout stream on property with fly-fishing equipment available',
        'Close proximity to Ol Pejeta Conservancy for Northern White Rhino tracking',
        'Full butler service, wood supply for fireplaces, and mountain guides',
      ],
      scheduleOrItinerary: [
        'Check-in: 02:00 PM',
        'Activities: Guided morning mountain forest walk & birding included',
        'Check-out: 11:00 AM',
      ],
    },
    createdAt: '2026-03-01T16:00:00.000Z',
    updatedAt: '2026-03-01T16:00:00.000Z',
  },
];

/**
 * Retrieve all travel destinations, tour packages, and holiday homes from persistent local store.
 */
export function getStoredDestinations(): TravelDestinationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DESTINATIONS));
      return INITIAL_DESTINATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DESTINATIONS));
    return INITIAL_DESTINATIONS;
  } catch {
    return INITIAL_DESTINATIONS;
  }
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
  return true;
}
