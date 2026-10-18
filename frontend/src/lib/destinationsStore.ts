/**
 * M-TRAVEL Destinations, Guided Safaris & Holiday Homes Store
 * Centralized reactive store for travel destinations, tour packages, and holiday homes.
 * Admins can add, update, toggle live status, and delete items.
 * Travelers consume the live items on the "Holidays and Tours" page.
 * Includes all 10 Official Regional Kenyan Tourist Circuits based on M-TRAVEL leadership documentation.
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

/**
 * 10 Official Kenyan Tourist Circuits curated from the CEO document:
 * 'Final jambo Key Attractions and Tourist Typologies'
 */
export const OFFICIAL_KENYAN_CIRCUITS: TravelDestinationItem[] = [
  {
    id: 'dest-circuit-01',
    category: 'DESTINATION',
    title: 'Southern Rift Valley & Maasai Mara Circuit',
    subtitle: 'Nairobi – Lake Naivasha – Hell’s Gate – Lake Nakuru – Maasai Mara',
    badge: 'Premier Wildlife & Migration Circuit',
    priceKES: 45000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-1-southern-rift-valley-maasai-mara.jpeg',
    images: ['/images/circuits/circuit-1-southern-rift-valley-maasai-mara.jpeg'],
    location: 'Rift Valley & Maasai Mara',
    region: 'South Rift',
    specs: ['Big Five Safari', 'Great Migration', 'Lake Nakuru Rhinos', 'Hell’s Gate Gorges'],
    rating: 4.98,
    reviews: 142,
    isLive: true,
    featured: true,
    featuredInServices: true,
    details: {
      overview: 'Kenya’s world-famous safari corridor linking the floor of the Great Rift Valley with the legendary Maasai Mara savannah. Experience dramatic geothermal canyons at Hell’s Gate, freshwater boat cruises alongside hippos on Lake Naivasha, rhino sanctuaries and birdlife at Lake Nakuru, and the unmatched Big Five savannah spectacle in the Maasai Mara.',
      highlights: [
        'Maasai Mara National Reserve: Big Five, wildebeest migration, open savannah game drives, and authentic Maasai cultural bomas.',
        'Lake Nakuru National Park: Sanctuary for endangered black and white rhinos, Rothschild giraffes, and vibrant lake birdlife.',
        'Lake Naivasha: Scenic freshwater boat rides, resident hippo pods, and exceptional birdwatching.',
        'Hell’s Gate National Park: Walking trails, cycling through volcanic towers, and dramatic geothermal gorges.',
        'Best-Suited Tourist Typologies: Wildlife enthusiasts, international safari tourists, photographers, birdwatchers, adventure tourists, honeymooners, and luxury travellers.'
      ],
      scheduleOrItinerary: [
        'Day 1: Nairobi to Lake Naivasha & Hell’s Gate (boat safari & cycling through towering gorges)',
        'Day 2: Lake Naivasha to Lake Nakuru National Park (rhino tracking and flamingo viewing)',
        'Day 3: Lake Nakuru to Maasai Mara National Reserve (afternoon savannah game drive)',
        'Day 4: Full Day Maasai Mara (Big Five tracking, Mara River crossing points & hot air balloon safari)',
        'Day 5: Maasai Cultural Village experience and scenic return flight/drive to Nairobi'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-02',
    category: 'DESTINATION',
    title: 'Southern Kenya & Amboseli Circuit',
    subtitle: 'Nairobi – Amboseli – Tsavo West – Tsavo East – Mombasa',
    badge: 'Iconic Kilimanjaro & Red Elephants',
    priceKES: 52000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-2-southern-kenya-amboseli.jpeg',
    images: ['/images/circuits/circuit-2-southern-kenya-amboseli.jpeg'],
    location: 'Amboseli & Tsavo Ecosystem',
    region: 'Southern Kenya',
    specs: ['Kilimanjaro Views', 'Red Elephants', 'Mzima Springs', 'Bush to Beach'],
    rating: 4.95,
    reviews: 118,
    isLive: true,
    featured: true,
    featuredInServices: true,
    details: {
      overview: 'A breathtaking southern safari route that combines postcard-perfect views of Mount Kilimanjaro with the raw wilderness of Tsavo, culminating in an effortless link to the Kenyan coast. Journey from the elephant-rich swamps of Amboseli through volcanic lava landscapes in Tsavo West to the red-dust savannah of Tsavo East.',
      highlights: [
        'Amboseli National Park: Tremendous free-ranging elephant herds and quintessential views of snow-capped Mount Kilimanjaro.',
        'Tsavo West National Park: Underwater hippo and fish viewing at Mzima Springs, Shetani lava flows, and rugged volcanic scenery.',
        'Tsavo East National Park: Renowned red dust-bathed elephants, expansive savannah wilderness, and the Galana River.',
        'Sheldrick Falls: An invigorating nature hike through pristine forest to tumbling cascades.',
        'Best-Suited Tourist Typologies: Wildlife tourists, photographers, families, nature lovers, safari enthusiasts, and tourists combining wildlife safaris with coastal beach holidays.'
      ],
      scheduleOrItinerary: [
        'Day 1: Nairobi to Amboseli National Park (afternoon game drive with Kilimanjaro backdrop)',
        'Day 2: Full day Amboseli marsh exploration, elephant herds & observation hill sundowner',
        'Day 3: Amboseli to Tsavo West (Mzima Springs underwater observatory & Shetani lava flow)',
        'Day 4: Tsavo West to Tsavo East National Park (tracking red-dusted lions and elephants)',
        'Day 5: Sheldrick Falls hike and onward transit to the Indian Ocean coast / Nairobi'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-03',
    category: 'DESTINATION',
    title: 'Coastal Kenya & Swahili Heritage Circuit',
    subtitle: 'Mombasa – Diani – Watamu – Malindi – Kilifi – Lamu',
    badge: 'Pristine Beaches & Coral Sanctuaries',
    priceKES: 48000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-3-coastal-kenya.jpeg',
    images: ['/images/circuits/circuit-3-coastal-kenya.jpeg'],
    location: 'Kenyan Coastline (Mombasa to Lamu)',
    region: 'Coast',
    specs: ['Diani Beach', 'Watamu Marine Park', 'Lamu Dhow Heritage', 'Fort Jesus UNESCO'],
    rating: 4.97,
    reviews: 164,
    isLive: true,
    featured: true,
    featuredInServices: true,
    details: {
      overview: 'An enchanting tropical journey spanning white sand beaches, azure coral lagoons, and centuries of rich Swahili history. Trace the Indian Ocean coastline from the cosmopolitan heritage of Mombasa and award-winning sands of Diani, through the marine parks of Watamu and Malindi, to the timeless UNESCO World Heritage dhow island of Lamu.',
      highlights: [
        'Fort Jesus (Mombasa): 16th-century Portuguese fortress and rich Swahili coastal maritime history.',
        'Diani Beach: Award-winning powder-white sands, deep-sea water sports, dolphin safaris, and beachside luxury.',
        'Watamu Marine National Park: Vibrant coral reefs, sea turtle sanctuaries, and world-class snorkeling.',
        'Malindi & Kilifi: Historic Vasco da Gama Pillar, ancient Gedi ruins, and tranquil Kilifi creek dhow sailing.',
        'Lamu Old Town: UNESCO World Heritage Swahili architecture, narrow car-free streets, and living dhow culture.',
        'Best-Suited Tourist Typologies: Leisure tourists, beach holidaymakers, honeymooners, families, divers, cultural heritage tourists, cruise visitors, and luxury travellers.'
      ],
      scheduleOrItinerary: [
        'Day 1: Arrival in Mombasa, Fort Jesus UNESCO tour & transfer to Diani Beach',
        'Day 2: Diani Beach relaxation, watersports, and dolphin ocean excursion',
        'Day 3: Scenic coastal drive to Watamu Marine Park & coral reef snorkeling',
        'Day 4: Malindi cultural exploration, Vasco da Gama pillar & ancient Gedi ruins',
        'Day 5: Flight to Lamu Old Town (dhow sunset cruise, Swahili gastronomy & island walk)'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-04',
    category: 'DESTINATION',
    title: 'Central Kenya & Mount Kenya Circuit',
    subtitle: 'Nairobi – Thika – Nyeri – Nanyuki – Meru',
    badge: 'Alpine Peaks & Mountain Wilderness',
    priceKES: 42000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-4-central-kenya-mount-kenya.jpeg',
    images: ['/images/circuits/circuit-4-central-kenya-mount-kenya.jpeg'],
    location: 'Central Highlands & Mount Kenya',
    region: 'Central Kenya',
    specs: ['Mt. Kenya Trekking', 'Ol Pejeta Rhinos', 'Aberdare Waterfalls', 'Coffee & Tea Tours'],
    rating: 4.91,
    reviews: 96,
    isLive: true,
    featured: true,
    featuredInServices: true,
    details: {
      overview: 'Ascend into Kenya’s fertile central highlands and rugged afro-alpine summits. This circuit combines the snow-capped crags of Mount Kenya with premier private conservation at Ol Pejeta, the mist-shrouded moorlands and dramatic waterfalls of the Aberdares, and the rich wilderness of Meru.',
      highlights: [
        'Mount Kenya National Park: UNESCO World Heritage peaks, alpine tarns, high-altitude trekking, and endemic afro-alpine flora.',
        'Ol Pejeta Conservancy: Largest black rhino sanctuary in East Africa, home to the last northern white rhinos and chimpanzee sanctuary.',
        'Aberdare National Park: Dramatic waterfalls (Karuru, Chania), deep bamboo forests, and nocturnal game viewing lodges.',
        'Meru National Park: Diverse wildlife and relatively less-crowded safari experiences along pristine riverine habitats.',
        'Best-Suited Tourist Typologies: Adventure tourists, mountaineers, ecotourists, conservationists, birdwatchers, domestic weekend travellers, and educational groups.'
      ],
      scheduleOrItinerary: [
        'Day 1: Nairobi to Nyeri & Aberdare National Park (waterfall treks and mountain lodge game viewing)',
        'Day 2: Aberdares to Ol Pejeta Conservancy, Nanyuki (rhino tracking and chimpanzee sanctuary)',
        'Day 3: Mount Kenya Day Hike (Sirimon Route through giant heather and alpine moorlands)',
        'Day 4: Nanyuki to Meru National Park (game drives through lush riverine wilderness)',
        'Day 5: Coffee and tea farm agro-tourism tour and return drive across the equator to Nairobi'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-05',
    category: 'DESTINATION',
    title: 'Northern Kenya & Samburu Wild Frontier Circuit',
    subtitle: 'Nanyuki – Isiolo – Samburu – Buffalo Springs – Marsabit – Lake Turkana',
    badge: 'Samburu Special Five & Desert Waters',
    priceKES: 58000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-5-northern-kenya.jpeg',
    images: ['/images/circuits/circuit-5-northern-kenya.jpeg'],
    location: 'Samburu, Marsabit & Turkana',
    region: 'Northern Kenya',
    specs: ['Samburu Special Five', 'Ewaso Ng’iro River', 'Marsabit Crater Oasis', 'Jade Sea Expeditions'],
    rating: 4.96,
    reviews: 84,
    isLive: true,
    featured: true,
    featuredInServices: true,
    details: {
      overview: 'Venture north across the equator into Kenya’s dramatic, sun-drenched northern frontier. Discover rare wildlife species found nowhere else south of the equator, riverine oases fed by the brown Ewaso Ng’iro River, misty volcanic crater lakes in Marsabit, and the shimmering turquoise waters of Lake Turkana.',
      highlights: [
        'Samburu National Reserve: Iconic home of the Grevy’s zebra, reticulated giraffe, Beisa oryx, Somali ostrich, and gerenuk (The Samburu Special 5).',
        'Buffalo Springs National Reserve: Natural crystalline springs, open acacia grasslands, and leopard tracking.',
        'Marsabit National Park: Heavily forested volcanic crater oasis rising from arid desert, home to legendary giant tuskers.',
        'Lake Turkana: The world’s largest permanent desert lake (‘The Jade Sea’), rich in prehistoric hominid archaeology and unique desert culture.',
        'Best-Suited Tourist Typologies: Cultural tourists, adventure travellers, specialist wildlife tourists, researchers, anthropologists, photographers, and off-the-beaten-track travellers.'
      ],
      scheduleOrItinerary: [
        'Day 1: Drive or fly from Nanyuki/Isiolo to Samburu National Reserve along the Ewaso Ng’iro',
        'Day 2: Full day Samburu Special 5 safari, lion and leopard tracking & Samburu cultural visit',
        'Day 3: Buffalo Springs nature walk and journey north to the cool cloud-forest oasis of Marsabit',
        'Day 4: Marsabit crater lakes exploration & expedition onward toward Lake Turkana (The Jade Sea)',
        'Day 5: Turkana desert lake boat excursion, desert sunset & expedition charter return'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-06',
    category: 'DESTINATION',
    title: 'Western Kenya & Lake Victoria Circuit',
    subtitle: 'Kisumu – Kakamega – Kakamega Forest – Kitale – Saiwa Swamp',
    badge: 'Rainforest Canopies & Inland Waters',
    priceKES: 39000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-6-western-kenya-lake-victoria.jpeg',
    images: ['/images/circuits/circuit-6-western-kenya-lake-victoria.jpeg'],
    location: 'Kisumu, Kakamega & Kitale',
    region: 'Western Kenya',
    specs: ['Kakamega Rainforest', 'Lake Victoria Sunset', 'Saiwa Swamp Sitatunga', 'Rich Birdwatching'],
    rating: 4.89,
    reviews: 73,
    isLive: true,
    featured: false,
    featuredInServices: false,
    details: {
      overview: 'Immerse yourself in western Kenya’s lush biodiversity and rich cultural tapestry. From Kenya’s sole remaining equatorial rainforest at Kakamega to the peaceful shores of Lake Victoria and the rare semi-aquatic Sitatunga antelopes of Saiwa Swamp, this circuit offers unmatched ecotourism.',
      highlights: [
        'Kakamega Forest: Tropical rainforest canopy, 400+ butterfly species, rare primates, and vibrant indigenous medicinal flora.',
        'Lake Victoria: Scenic boat trips, traditional fishing culture, fresh tilapia dining, and serene lakeside sunsets.',
        'Kisumu Impala Sanctuary: Peaceful wildlife viewing, lakefront trails, and nature walks near the city.',
        'Saiwa Swamp National Park: Boardwalk trails through tranquil wetlands dedicated to the elusive, webbed-foot Sitatunga antelope.',
        'Best-Suited Tourist Typologies: Ecotourists, birdwatchers, domestic tourists, cultural tourists, educational groups, researchers, and nature photographers.'
      ],
      scheduleOrItinerary: [
        'Day 1: Arrival in Kisumu, Lake Victoria boat excursion & Dunga Hill sunset',
        'Day 2: Kisumu Impala Sanctuary morning tour & scenic drive to Kakamega Forest',
        'Day 3: Guided sunrise rainforest walk, Colobus monkey tracking & nocturnal forest hike',
        'Day 4: Kakamega to Kitale & Saiwa Swamp boardwalk safari for Sitatunga antelopes',
        'Day 5: Western Kenya cultural heritage centre tour and return flight/drive to Nairobi'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-07',
    category: 'DESTINATION',
    title: 'Northern Rift Valley & Lakes Circuit',
    subtitle: 'Nakuru – Lake Bogoria – Lake Baringo – Iten – Kerio Valley',
    badge: 'Geothermal Springs & Athletics Capital',
    priceKES: 38000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-7-northern-rift-valley-lake.jpeg',
    images: ['/images/circuits/circuit-7-northern-rift-valley-lake.jpeg'],
    location: 'Baringo, Bogoria & Iten',
    region: 'North Rift',
    specs: ['Lake Bogoria Geysers', 'Lake Baringo Islands', 'Kerio Valley Escarpment', 'Iten Champion Run'],
    rating: 4.92,
    reviews: 68,
    isLive: true,
    featured: false,
    featuredInServices: false,
    details: {
      overview: 'A dramatic geological circuit renowned for bubbling geysers, Rift Valley freshwater lakes, paragliding cliffs, and world-class athletics heritage. Explore the natural hot springs of Lake Bogoria, island communities in Lake Baringo, and the ‘Home of Champions’ in high-altitude Iten perched atop the Kerio Valley.',
      highlights: [
        'Lake Bogoria: Hot springs, active natural geysers, and seasonal flamingo flocks against jagged escarpment walls.',
        'Lake Baringo: Birdwatching paradise with 470+ recorded species, boat trips, and indigenous Il Chamus island communities.',
        'Kerio Valley: Towering escarpments, panoramic viewpoints, and thrilling adventure sports like paragliding.',
        'Iten: Global distance-running culture, high-altitude athletic training camps, and scenic valley trails.',
        'Best-Suited Tourist Typologies: Birdwatchers, geo-tourists, adventure tourists, sports tourists, photographers, researchers, and domestic weekend visitors.'
      ],
      scheduleOrItinerary: [
        'Day 1: Nakuru to Lake Bogoria (geothermal geysers, hot spring boiling eggs, and bird photography)',
        'Day 2: Lake Bogoria to Lake Baringo (island boat trips, eagle feeding, and community cultural visits)',
        'Day 3: Ascend the Kerio Valley Escarpment to Iten (‘Home of Champions’) for sunset views',
        'Day 4: Morning running/jogging session with Kenyan champions & Kerio Valley escarpment hike',
        'Day 5: Scenic return drive via Kabarnet and the Great Rift Valley viewpoints'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-08',
    category: 'DESTINATION',
    title: 'Nairobi & Urban Tourism Circuit',
    subtitle: 'Nairobi CBD – Karen – Lang’ata – Kiambu',
    badge: 'Safari Capital & Urban Conservation',
    priceKES: 18500,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-8-nairobi-urban-tourism.jpeg',
    images: ['/images/circuits/circuit-8-nairobi-urban-tourism.jpeg'],
    location: 'Nairobi County & Kiambu',
    region: 'Nairobi',
    specs: ['City National Park', 'Elephant Orphanage', 'Giraffe Centre', 'Karen Blixen Museum'],
    rating: 4.94,
    reviews: 210,
    isLive: true,
    featured: true,
    featuredInServices: true,
    details: {
      overview: 'Nairobi stands as the world’s only capital city boasting a national park with free-ranging wildlife within sight of city skyscrapers. Discover world-leading wildlife orphanages, historic colonial estates, rich national museums, and tranquil coffee plantations just minutes from cosmopolitan dining.',
      highlights: [
        'Nairobi National Park: Wildlife viewing close to a major city, featuring lions, leopards, rhinos, and endangered Rothschild giraffes.',
        'David Sheldrick Wildlife Trust: World-renowned elephant conservation and rehabilitation orphanage experiences.',
        'Giraffe Centre: Endangered Rothschild giraffe conservation and environmental education feeding platforms.',
        'Karen Blixen Museum: Literary and colonial-era heritage situated at the foot of the Ngong Hills.',
        'Nairobi National Museum: Kenyan history, indigenous art, ethnographic displays, and early hominid fossils.',
        'Best-Suited Tourist Typologies: Business tourists, MICE delegates (Meetings, Incentives, Conferences & Exhibitions), transit visitors, educational groups, urban explorers, cultural tourists, and short-stay international visitors.'
      ],
      scheduleOrItinerary: [
        'Day 1 (Morning): Sunrise game drive in Nairobi National Park with rhino and lion sightings',
        'Day 1 (Midday): Visit the David Sheldrick Elephant Orphanage & Giraffe Centre for hands-on conservation',
        'Day 1 (Afternoon): Gourmet lunch in Karen, Karen Blixen Museum, and Kazuri Beads crafts tour',
        'Day 2 (Cultural): Nairobi National Museum, Snake Park & Maasai artisan market shopping',
        'Day 2 (Evening): Premium dining and rooftop lounge sunset overlooking the Nairobi skyline'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-09',
    category: 'DESTINATION',
    title: 'Eastern Kenya & Scenic Wilderness Circuit',
    subtitle: 'Makueni – Machakos – Kitui – Embu – Tharaka-Nithi – Meru',
    badge: 'Sacred Monoliths & Untamed Scrub',
    priceKES: 32000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-9-eastern-kenya.jpeg',
    images: ['/images/circuits/circuit-9-eastern-kenya.jpeg'],
    location: 'Machakos, Kitui, Embu & Tharaka-Nithi',
    region: 'Eastern Kenya',
    specs: ['Nzambani Rock Hike', 'Mwingi Reserve', 'Agro-Tourism Farms', 'Scenic Eastern Foothills'],
    rating: 4.88,
    reviews: 54,
    isLive: true,
    featured: false,
    featuredInServices: false,
    details: {
      overview: 'An authentic off-the-beaten-path circuit combining mythical granite monoliths, raw eastern wilderness reserves, and vibrant agro-pastoral communities. Explore legendary rock formations, untouched bushland reserves along the Tana River, and lush fruit and macadamia highlands.',
      highlights: [
        'Nzambani Rock: Prominent sheer stone outcrop with hiking stairs, panoramic views, and captivating local legends.',
        'Mwingi National Reserve: Untouched wilderness, dry-bush wildlife, and peaceful, remote nature experiences along the Tana River.',
        'Meru National Park (Eastern Access): Wildlife safaris and renowned big cat conservation.',
        'Embu and Tharaka-Nithi: Rich cultural heritage, agricultural tea and coffee experiences, and scenic mountain foothills.',
        'Best-Suited Tourist Typologies: Domestic tourists, cultural tourists, adventure seekers, educational groups, ecotourists, and agro-tourists.'
      ],
      scheduleOrItinerary: [
        'Day 1: Nairobi to Machakos & Kitui with climbing expedition at Nzambani Rock',
        'Day 2: Kitui to Mwingi National Reserve (game drives through dry-bush ecosystems along the Tana River)',
        'Day 3: Wilderness safari across eastern Meru conservation borders',
        'Day 4: Agro-tourism tour of Embu and Tharaka-Nithi highland farms and waterfalls',
        'Day 5: Cultural village visit, traditional wood carvings craft tour, and scenic return to Nairobi'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'dest-circuit-10',
    category: 'DESTINATION',
    title: 'North Eastern & Arid Lands Frontier Circuit',
    subtitle: 'Garissa – Wajir – Mandera – Sibiloi & Lake Turkana',
    badge: 'Cradle of Mankind & Desert Frontier',
    priceKES: 64000,
    priceUnit: '/ person',
    imageUrl: '/images/circuits/circuit-10-north-eastern-arid-lands.jpeg',
    images: ['/images/circuits/circuit-10-north-eastern-arid-lands.jpeg'],
    location: 'Garissa, Wajir, Mandera & Sibiloi',
    region: 'North Eastern',
    specs: ['Rare Hirola Antelope', 'Sibiloi Fossil Cradle', 'Somali Camel Culture', 'Desert Oasis Exploration'],
    rating: 4.93,
    reviews: 41,
    isLive: true,
    featured: false,
    featuredInServices: false,
    details: {
      overview: 'An extraordinary expedition into Kenya’s vast, untamed northern and north-eastern frontiers. From the critically endangered Hirola antelope sanctuary in Garissa to the ancient hominid fossil beds of Sibiloi National Park (‘The Cradle of Mankind’) on Lake Turkana, this frontier circuit offers pure unadulterated exploration.',
      highlights: [
        'Arawale National Reserve: Arid-land wildlife conservation protecting the critically endangered Hirola antelope.',
        'Sibiloi National Park: UNESCO World Heritage site known as the Cradle of Mankind, archaeological heritage, and fossil beds.',
        'Garissa & Wajir Landscapes: Somali cultural heritage, nomadic camel pastoral traditions, and scenic Tana River landscapes.',
        'Northern Desert Landscapes: Vast star-filled skies, specialist desert adventures, and off-the-beaten-track encounters.',
        'Best-Suited Tourist Typologies: Cultural tourists, archaeologists, researchers, specialist adventure travellers, photographers, and experienced off-the-beaten-track tourists.'
      ],
      scheduleOrItinerary: [
        'Day 1: Nairobi flight/drive to Garissa (Tana River birdwatching & Somali camel culture market)',
        'Day 2: Morning expedition to Arawale Sanctuary in search of the rare Hirola antelope',
        'Day 3: Scenic transit or charter flight north toward Wajir / Lake Turkana desert landscapes',
        'Day 4: Sibiloi National Park & Koobi Fora paleontological museum, petrified forest, and fossil dig sites',
        'Day 5: Desert stargazing breakfast, nomadic community cultural exchange, and flight back to Nairobi'
      ]
    },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z'
  }
];

export const INITIAL_DESTINATIONS: TravelDestinationItem[] = OFFICIAL_KENYAN_CIRCUITS;

/**
 * Retrieve all travel destinations, tour packages, and holiday homes from persistent local store.
 * Automatically guarantees all 10 Official Kenyan Circuits are loaded and accessible.
 */
export function getStoredDestinations(): TravelDestinationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: TravelDestinationItem[] = [];
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    }

    let modified = false;

    // If local storage is empty, initialize directly with all 10 official circuits
    if (items.length === 0) {
      items = [...OFFICIAL_KENYAN_CIRCUITS];
      modified = true;
    } else {
      // Ensure all 10 official circuits exist in the store without duplicating
      for (const circuit of OFFICIAL_KENYAN_CIRCUITS) {
        const index = items.findIndex((d) => d.id === circuit.id);
        if (index === -1) {
          items.push(circuit);
          modified = true;
        }
      }
    }

    if (modified || raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    return items;
  } catch {
    return OFFICIAL_KENYAN_CIRCUITS;
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
