export interface Destination {
  id: string;
  name: string;
  category: 'National Park' | 'Beach & Coast' | 'Rift Valley' | 'Mountain' | 'Cultural';
  location: string;
  distanceFromNairobiKm: number;
  kwsAdultFeeKes: number;
  bestMonths: string;
  highlights: string[];
  recommendedTerrain: 'Extreme Off-Road 4x4' | 'Rugged SUV' | 'Comfort Van' | 'Highway Sedan';
  suggestedVehicleTypes: string[];
  vehicleReason: string;
  imageUrl: string;
  galleryUrls: string[];
  description: string;
}

export const KENYA_DESTINATIONS: Destination[] = [
  {
    id: 'maasai-mara',
    name: 'Maasai Mara National Reserve',
    category: 'National Park',
    location: 'Narok County, Kenya',
    distanceFromNairobiKm: 270,
    kwsAdultFeeKes: 13000, // Peak conservancy fee approx $100-200 / KES
    bestMonths: 'July – October (Great Wildebeest Migration)',
    highlights: ['Big Five Sightings', 'Great Wildebeest Migration', 'Hot Air Balloon Safaris', 'Maasai Cultural Villages'],
    recommendedTerrain: 'Extreme Off-Road 4x4',
    suggestedVehicleTypes: ['SUV', 'VAN', 'PICKUP'],
    vehicleReason: 'High ground clearance and 4x4 differential lock required for black cotton mud and river crossings.',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'World-renowned wilderness sanctuary famous for lions, cheetahs, leopards, and the annual Wildebeest Migration crossing the Mara River.',
  },
  {
    id: 'amboseli',
    name: 'Amboseli National Park',
    category: 'National Park',
    location: 'Kajiado County, Kenya',
    distanceFromNairobiKm: 240,
    kwsAdultFeeKes: 860, // KWS Citizen/Resident / Int'l rates
    bestMonths: 'June – October & January – February',
    highlights: ['Large Elephant Herds', 'Mount Kilimanjaro Views', 'Observation Hill Panorama', 'Swamp Birdlife'],
    recommendedTerrain: 'Rugged SUV',
    suggestedVehicleTypes: ['SUV', 'VAN'],
    vehicleReason: 'Dry dusty tracks with occasional swamp soil. A verified 4x4 Safari SUV offers smooth ride and pop-up roof for wildlife viewing.',
    imageUrl: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Home to majestic big-tusked elephant families set against the backdrop of snow-capped Mount Kilimanjaro.',
  },
  {
    id: 'diani-beach',
    name: 'Diani Beach & South Coast',
    category: 'Beach & Coast',
    location: 'Kwale County, Kenya',
    distanceFromNairobiKm: 500,
    kwsAdultFeeKes: 0,
    bestMonths: 'October – March (Calm turquoise waters)',
    highlights: ['Pristine White Sands', 'Kite Surfing & Scuba', 'Shimba Hills Safari Nearby', 'Wasini Dolphin Excursions'],
    recommendedTerrain: 'Highway Sedan',
    suggestedVehicleTypes: ['VAN', 'CAR', 'SUV'],
    vehicleReason: 'Smooth tarmac via Mombasa Highway & Diani coastal strip. An executive Van or luxury Sedan is perfect for family beach vacations.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Voted Africa’s leading beach destination with powdery white sands, coral reef diving, and tropical palm tree coastlines.',
  },
  {
    id: 'lake-naivasha',
    name: 'Lake Naivasha & Hell’s Gate',
    category: 'Rift Valley',
    location: 'Nakuru County, Kenya',
    distanceFromNairobiKm: 95,
    kwsAdultFeeKes: 600,
    bestMonths: 'All year round (Great weekend getaway)',
    highlights: ['Cycling among Wildlife in Hell’s Gate', 'Boat Safaris & Hippos', 'Crescent Island Game Sanctuary', 'Geothermal Spa Pools'],
    recommendedTerrain: 'Comfort Van',
    suggestedVehicleTypes: ['CAR', 'SUV', 'VAN'],
    vehicleReason: 'Easy 1.5-hour drive from Nairobi on tarmac road with gravel access tracks to lakeside lodges.',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Freshwater Rift Valley lake renowned for boat trips past hippos and cycling safaris through Hell’s Gate gorge.',
  },
  {
    id: 'mount-kenya',
    name: 'Mount Kenya National Park',
    category: 'Mountain',
    location: 'Nyeri / Meru / Laikipia, Kenya',
    distanceFromNairobiKm: 180,
    kwsAdultFeeKes: 800,
    bestMonths: 'December – March & July – September',
    highlights: ['Point Lenana Trekking', 'Bongo & Forest Wildlife', 'Trout Fishing Springs', 'Afro-Alpine Ecosystem'],
    recommendedTerrain: 'Rugged SUV',
    suggestedVehicleTypes: ['SUV', 'PICKUP'],
    vehicleReason: 'Steep mountain slopes and muddy forest tracks require reliable 4WD system and high torque.',
    imageUrl: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'UNESCO World Heritage Site with dramatic mountain peaks, equatorial glaciers, and unique alpine flora.',
  },
  {
    id: 'tsavo-national-parks',
    name: 'Tsavo West & Tsavo East',
    category: 'National Park',
    location: 'Taita-Taveta County, Kenya',
    distanceFromNairobiKm: 330,
    kwsAdultFeeKes: 860,
    bestMonths: 'June – October & January – February',
    highlights: ['Famous Red Elephants', 'Mzima Springs Crystal Waters', 'Shetani Lava Flows', 'Aruba Dam Wildlife'],
    recommendedTerrain: 'Extreme Off-Road 4x4',
    suggestedVehicleTypes: ['SUV', 'VAN', 'PICKUP'],
    vehicleReason: 'Vast wilderness spanning over 22,000 sq km with rugged red dirt roads. 4x4 required for park game drives.',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Kenya’s largest wildlife park, known for dust-red elephants wallowing in red clay and crystal-clear Mzima Springs.',
  },
];
