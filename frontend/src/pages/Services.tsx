import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Car, Bus, Home, Palmtree, Sparkles, ShieldCheck,
  CheckCircle2, ArrowRight, Award, Eye,
  Maximize2, X
} from 'lucide-react';

type ServiceCategory = 'all' | 'vehicles' | 'buses' | 'villas' | 'tours';

interface ShowcaseItem {
  id: string;
  category: 'vehicles' | 'buses' | 'villas' | 'tours';
  categoryLabel: string;
  categoryIcon: typeof Car;
  title: string;
  badge: string;
  image: string;
  altText: string;
  aspectClass: string; // Tailored aspect ratio for perfect fitting
  subtitle: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  targetLink: string;
  buttonLabel: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  // ── VEHICLES ──
  {
    id: 'veh-1',
    category: 'vehicles',
    categoryLabel: 'Vehicle Hire',
    categoryIcon: Car,
    title: 'Heavy-Duty Open-Top 4×4 Safari Cruiser',
    badge: 'Savannah Tier • Showcase',
    image: '/services/vehicle-safari-cruiser.jpg',
    altText: 'Heavy-duty open-top safari 4x4 cruiser in Kenya savannah',
    aspectClass: 'aspect-[4/3] sm:aspect-[16/11]',
    subtitle: 'Purpose-built for national game reserves and 360° unobstructed wildlife photography.',
    description:
      'Engineered specifically for rough savannah tracks and game viewing. Outfitted with all-terrain tires, elevated stadium seating, heavy steel roll-cage protection, and open-sided visibility for uncompromised big-game tracking.',
    highlights: [
      'Elevated multi-tier seating for panoramic 360° views',
      'Reinforced heavy-duty 4WD chassis with high ground clearance',
      'Dual spare all-terrain tires and emergency recovery bush gear',
      'Available with certified safari chauffeur or verified self-drive',
    ],
    specs: [
      { label: 'Drive', value: 'Full 4×4 Range' },
      { label: 'Capacity', value: 'Up to 7 Guests' },
      { label: 'Terrain', value: 'Bush, Sand & Rock' },
      { label: 'Safety', value: 'Roll-Cage & PSV Kit' },
    ],
    targetLink: '/catalogue?category=vehicles',
    buttonLabel: 'Explore Live Vehicle Fleet',
  },
  {
    id: 'veh-2',
    category: 'vehicles',
    categoryLabel: 'Vehicle Hire',
    categoryIcon: Car,
    title: 'Executive All-Terrain Nissan Patrol 4×4',
    badge: 'Expedition Tier • Showcase',
    image: '/services/vehicle-nissan-patrol.jpg',
    altText: 'Nissan Patrol 4x4 on off-road expedition and sand dunes',
    aspectClass: 'aspect-[4/3] sm:aspect-[16/11]',
    subtitle: 'High-torque expedition powerhouse for cross-country exploration and dunes.',
    description:
      'A legendary all-terrain platform designed for rugged reliability with executive comfort. Features high-flow snorkel induction for dust and water resistance, high-traction off-road tires, spacious cabin climate control, and supreme torque.',
    highlights: [
      'Heavy-duty raised air intake snorkel for dust & water wading',
      'High-traction off-road tires with beadlock-style wheels',
      'Heavy-duty roof rack for oversized expedition equipment',
      'Dual-zone climate control for long inter-county expeditions',
    ],
    specs: [
      { label: 'Drive', value: 'All-Mode 4×4' },
      { label: 'Capacity', value: '5 - 7 Passengers' },
      { label: 'Terrain', value: 'Dunes & Highway' },
      { label: 'Gear', value: 'Snorkel & Roof Rack' },
    ],
    targetLink: '/catalogue?category=vehicles',
    buttonLabel: 'Explore Live Vehicle Fleet',
  },

  // ── BUSES ──
  {
    id: 'bus-1',
    category: 'buses',
    categoryLabel: 'Bus Reservations',
    categoryIcon: Bus,
    title: 'Luxury Intercity Highway Express Coach',
    badge: 'Intercity Express • Showcase',
    image: '/services/bus-tahmeed-coach.jpg',
    altText: 'Tahmeed Coach luxury intercity passenger bus on highway',
    aspectClass: 'aspect-[16/9] sm:aspect-[2/1] lg:aspect-[16/9]',
    subtitle: 'Premium scheduled long-distance coach travel across major Kenyan cities.',
    description:
      'Seamless, dignified highway travel connecting Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret. Travelers enjoy generous legroom in plush reclining VIP seats, onboard high-speed WiFi, personal USB charging ports, climate-controlled cabins, and professional certified PSV captains.',
    highlights: [
      'Plush first-class VIP reclining passenger seats with footrests',
      'Continuous high-speed onboard WiFi and individual USB power',
      'Overhead climate vents, ambient reading illumination & wide luggage hold',
      'Strict safety telemetry, GPS tracking, and experienced vetted drivers',
    ],
    specs: [
      { label: 'Service', value: 'Intercity Express' },
      { label: 'Class', value: 'VIP 2×1 & 2×2 Classes' },
      { label: 'Luggage', value: 'Under-Deck Hold' },
      { label: 'Ticketing', value: 'Instant QR Boarding' },
    ],
    targetLink: '/catalogue?category=buses',
    buttonLabel: 'View Bus Routes & Schedules',
  },

  // ── HOLIDAY HOMES / VILLAS ──
  {
    id: 'vil-1',
    category: 'villas',
    categoryLabel: 'Holiday Villas',
    categoryIcon: Home,
    title: 'Private Oceanfront Beach Villa & Swimming Pool',
    badge: 'Coastal Haven • Showcase',
    image: '/services/villa-beachfront-resort.jpg',
    altText: 'Private beachfront luxury villa with swimming pool overlooking turquoise ocean',
    aspectClass: 'aspect-[3/2] sm:aspect-[16/10]',
    subtitle: 'Direct coral beach access, tropical palm gardens, and private infinity pool.',
    description:
      'A coastal sanctuary where tropical palm trees meet the turquoise Indian Ocean. Enjoy open-air makuti verandas, a private crystal-clear swimming pool overlooking the shoreline, cool ocean breezes, and on-site chef and housekeeping services.',
    highlights: [
      'Direct private access to powder-white sands and warm ocean waters',
      'Private oceanfront swimming pool with sunbeds and shaded parasols',
      'Private resident chef on request for fresh coastal Swahili seafood dining',
      'Spacious multi-bedroom suites with private en-suite bathrooms and verandas',
    ],
    specs: [
      { label: 'Type', value: 'Oceanfront Villa' },
      { label: 'Setting', value: 'Direct Beachfront' },
      { label: 'Amenities', value: 'Private Pool & Chef' },
      { label: 'Connectivity', value: 'High-Speed WiFi' },
    ],
    targetLink: '/holidays-and-tours',
    buttonLabel: 'Browse Verified Holiday Stays',
  },
  {
    id: 'vil-2',
    category: 'villas',
    categoryLabel: 'Holiday Villas',
    categoryIcon: Home,
    title: 'Contemporary Minimalist Resort Villa & Lap Pool',
    badge: 'Modern Architecture • Showcase',
    image: '/services/villa-contemporary-pool.jpg',
    altText: 'Contemporary white luxury villa with large lap swimming pool and sun terrace',
    aspectClass: 'aspect-[3/2] sm:aspect-[16/10]',
    subtitle: 'Chic whitewashed architecture, Olympic-style lap pool, and sun terraces.',
    description:
      'Designed for travelers who appreciate refined architectural luxury. Features crisp whitewashed facades, an elongated private lap pool, expansive floor-to-ceiling glass doors, minimalist decor, air-conditioned designer bedrooms, and private sun lounger decks.',
    highlights: [
      'Private elongated swimming pool surrounded by tropical vegetation',
      'Modern open-plan kitchen, dining, and indoor-outdoor entertainment lounge',
      'Air-conditioned bedrooms with luxury linens and walk-in showers',
      'High-security gated enclave with secure vehicle parking',
    ],
    specs: [
      { label: 'Type', value: 'Designer Villa' },
      { label: 'Setting', value: 'Gated Private Enclave' },
      { label: 'Comfort', value: 'Air-Conditioned' },
      { label: 'Features', value: 'Lap Pool & Deck' },
    ],
    targetLink: '/holidays-and-tours',
    buttonLabel: 'Browse Verified Holiday Stays',
  },

  // ── TOURS & TRAVEL ──
  {
    id: 'tour-1',
    category: 'tours',
    categoryLabel: 'Tours & Safaris',
    categoryIcon: Palmtree,
    title: 'Maasai Mara Big Five Wildlife Expedition',
    badge: 'Savannah Classic • Showcase',
    image: '/services/tour-mara-wildlife-lion.jpg',
    altText: 'Safari Land Cruiser with pop-up roof watching a male lion in Maasai Mara',
    aspectClass: 'aspect-[3/2] sm:aspect-[16/10]',
    subtitle: 'Immersive guided game drives alongside Africa’s iconic apex predators.',
    description:
      'Witness the timeless drama of the African savannah firsthand. Accompanied by certified professional safari guides, you will traverse vast plains in pop-up roof 4×4 cruisers to track prides of lions, leopards, cheetahs, and massive elephant herds across world-renowned wildlife reserves.',
    highlights: [
      'Dedicated pop-up roof 4×4 safari cruiser for 360° unobstructed photography',
      'Accompanied by KPSGA certified professional driver-naturalist',
      'All reserve permits, park entry clearances, and logistics fully arranged',
      'Comprehensive itinerary balancing morning, afternoon, and twilight game drives',
    ],
    specs: [
      { label: 'Experience', value: 'Big Cat Wildlife Safari' },
      { label: 'Vehicle', value: 'Pop-Up 4×4 Cruiser' },
      { label: 'Guide', value: 'KPSGA Naturalist' },
      { label: 'Inclusions', value: 'Game Drives & Permits' },
    ],
    targetLink: '/holidays-and-tours',
    buttonLabel: 'Explore Guided Safari Packages',
  },
  {
    id: 'tour-2',
    category: 'tours',
    categoryLabel: 'Tours & Safaris',
    categoryIcon: Palmtree,
    title: 'Diani White Sands Beach & Camel Safari Tour',
    badge: 'Coastal Discovery • Showcase',
    image: '/services/tour-coastal-camel-safari.jpg',
    altText: 'Diani beach camel safari along powder white sand and turquoise ocean',
    aspectClass: 'aspect-[3/2] sm:aspect-[16/10]',
    subtitle: 'Gentle shoreline camel rides, coral marine parks, and Swahili coastal heritage.',
    description:
      'Unwind along Africa’s premier coastline with an unforgettable camel trek along powder-white sands. Discover hidden sandbars, vibrant coral reefs through glass-bottom marine excursions, and authentic Swahili culture, creating a serene beach escape for all travelers.',
    highlights: [
      'Guided coastal camel rides along the scenic shoreline at sunrise or sunset',
      'Marine park boat excursions for snorkeling and dolphin encounters',
      'Complimentary hotel pickup and drop-off in air-conditioned transport',
      'Curated experiences suitable for solo travelers, couples, and family groups',
    ],
    specs: [
      { label: 'Experience', value: 'Beach & Marine Adventure' },
      { label: 'Setting', value: 'Diani Coral Coast' },
      { label: 'Activities', value: 'Camel Trek & Snorkeling' },
      { label: 'Transfers', value: 'Hotel Shuttles Included' },
    ],
    targetLink: '/holidays-and-tours',
    buttonLabel: 'Explore Guided Safari Packages',
  },
];

export default function Services() {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; badge: string } | null>(null);

  const filteredItems =
    selectedCategory === 'all'
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-slate-900 selection:text-white">
      {/* ── HERO BANNER (EXECUTIVE BLACK & WHITE THEME) ── */}
      <section className="relative overflow-hidden bg-white text-slate-950 border-b border-slate-200 pt-16 pb-16 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-slate-900" />
              M-TRAVEL Services Portfolio
            </span>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
              Specialized Mobility, Executive Coaches &amp; Luxury Stays.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
              Experience the pinnacle of travel across Kenya. Explore our specialized services across
              safari 4×4s, luxury intercity coaches, oceanfront holiday villas, and guided wildlife safaris.
            </p>
          </div>

          {/* INFORMATIVE REPRESENTATIVE SHOWCASE NOTICE */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 max-w-3xl text-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
              <Eye className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="text-slate-950 font-bold block mb-0.5">
                Representative Service Overviews
              </strong>
              The imagery and specifications below showcase our service tiers, equipment standards, and travel comforts.
              Real-time available fleet vehicles, live bus coach seat maps, and bookable holiday packages are selected inside the traveler portal.
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY CATEGORY FILTER BAR ── */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3.5 px-6 shadow-2xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Services', icon: Sparkles, count: 7 },
              { id: 'vehicles', label: 'Vehicle Hire', icon: Car, count: 2 },
              { id: 'buses', label: 'Bus Reservations', icon: Bus, count: 1 },
              { id: 'villas', label: 'Holiday Villas', icon: Home, count: 2 },
              { id: 'tours', label: 'Tours & Safaris', icon: Palmtree, count: 2 },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ServiceCategory)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm border border-slate-950 scale-[1.01]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono font-medium text-slate-500">
            <span>Showing {filteredItems.length} Curated Showcases</span>
          </div>
        </div>
      </section>

      {/* ── SHOWCASE GRID (NATURAL RATIO & PERFECT IMAGE FITTING) ── */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
            >
              {filteredItems.map((item) => {
                const Icon = item.categoryIcon;
                // For the single bus item, give it full width on md+ when viewing buses specifically or in grid
                const isBusFullWidth = item.category === 'buses' && selectedCategory === 'buses';

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group ${
                      isBusFullWidth ? 'md:col-span-2 max-w-4xl mx-auto' : ''
                    }`}
                  >
                    <div>
                      {/* ── PROPORTIONALLY FITTED HD IMAGE CONTAINER ── */}
                      <div className="relative w-full overflow-hidden bg-slate-950 p-2 sm:p-2.5">
                        <div
                          className={`relative w-full ${item.aspectClass} overflow-hidden rounded-2xl bg-slate-900 shadow-inner group/img cursor-pointer`}
                          onClick={() => setPreviewImage({ src: item.image, title: item.title, badge: item.badge })}
                        >
                          <img
                            src={item.image}
                            alt={item.altText}
                            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover/img:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/img:opacity-20 transition-opacity" />

                          {/* OVERLAY BADGES */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 text-white font-mono text-[10px] sm:text-[11px] font-bold px-3 py-1 border border-white/20 backdrop-blur-md shadow-md uppercase tracking-wider">
                              {item.badge}
                            </span>
                          </div>

                          {/* EXPAND PREVIEW ICON */}
                          <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-black/80 text-white text-[11px] font-medium px-2.5 py-1 backdrop-blur-md border border-white/20 shadow">
                              <Maximize2 className="h-3 w-3" /> Full HD View
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── CONTENT BODY ── */}
                      <div className="p-6 sm:p-8 space-y-5">
                        {/* CATEGORY & TITLE */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            <Icon className="h-3.5 w-3.5 text-slate-950" />
                            <span>{item.categoryLabel}</span>
                          </div>

                          <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-snug group-hover:text-black transition-colors">
                            {item.title}
                          </h2>

                          <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* DESCRIPTION */}
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                          {item.description}
                        </p>

                        {/* HIGHLIGHTS CHECKLIST */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900 block">
                            Key Standards &amp; Inclusions:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.highlights.map((highlight, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs text-slate-800"
                              >
                                <CheckCircle2 className="h-4 w-4 text-slate-950 shrink-0 mt-0.5" />
                                <span className="leading-snug">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SPECIFICATION PILLS (NO PRICES) */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {item.specs.map((spec, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs"
                              >
                                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                                  {spec.label}
                                </span>
                                <span className="mt-0.5 block text-xs font-bold text-slate-950 truncate">
                                  {spec.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── CARD FOOTER WITH ACTION BUTTON ── */}
                    <div className="p-6 sm:p-8 pt-0">
                      <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500 font-mono font-medium">
                          * Live inventory available in portal
                        </span>

                        <Link
                          to={item.targetLink}
                          className="rounded-xl bg-slate-950 hover:bg-black text-white px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center justify-center gap-1.5 transition active:scale-[0.99] border border-slate-900 cursor-pointer"
                        >
                          <span>{item.buttonLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── FULL-SCREEN HD IMAGE LIGHTBOX MODAL ── */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-8 flex flex-col items-center justify-center cursor-zoom-out"
          >
            <div
              className="relative max-w-5xl max-h-[90vh] flex flex-col items-center bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between p-3 text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                    {previewImage.badge}
                  </span>
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {previewImage.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="rounded-full bg-white/10 hover:bg-white/20 p-1.5 text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl bg-black max-h-[75vh] flex items-center justify-center">
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  className="max-h-[75vh] w-auto object-contain rounded-2xl"
                />
              </div>

              <div className="w-full text-center py-2.5 text-[11px] text-slate-400 font-mono">
                High-Definition Preview • Click anywhere to close
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXECUTIVE SERVICE GUARANTEES & STANDARDS ── */}
      <section className="py-16 px-6 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-950" />
              <span>Trust &amp; Operational Excellence</span>
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
              Built on Transparency, Safety and Verified Quality
            </h2>
            <p className="text-sm text-slate-600 font-normal leading-relaxed">
              Every vehicle, bus seat, villa, and safari package across our ecosystem undergoes rigorous verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: 'Rigorous Physical Inspections',
                desc: 'Every 4×4, safari cruiser, and highway coach is mechanically inspected and verified before entering live service.',
              },
              {
                icon: Award,
                title: 'Certified Operators & Guides',
                desc: 'Travel with KPSGA-licensed safari naturalists and professional PSV captains with clean national road records.',
              },
              {
                icon: Home,
                title: 'Vetted Luxury Properties',
                desc: 'Each private villa and holiday cottage is vetted for hygiene, security, high-speed amenities, and true hospitality.',
              },
              {
                icon: CheckCircle2,
                title: 'Instant Transparent Booking',
                desc: 'Automated digital boarding passes, electronic vehicle vouchers, and instant M-Pesa receipts with zero hidden fees.',
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between space-y-4 hover:border-slate-400 hover:bg-slate-100/70 transition shadow-2xs"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-950 flex items-center justify-center shadow-xs">
                    <Icon className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 mb-1.5">{card.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PORTAL ACCESS CALL TO ACTION (EXECUTIVE BLACK & WHITE THEME) ── */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-slate-900" />
              <span>Ready to Travel Kenya?</span>
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
              Step Into the Verified Traveler Marketplace
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Sign in or create your traveler account to explore real-time availability, select your specific coach seats, book verified 4×4 cruisers, and reserve private holiday villas.
            </p>
          </div>

          <div className="relative z-10 pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="rounded-xl bg-slate-950 hover:bg-black text-white px-7 py-3.5 text-xs font-bold shadow-sm transition active:scale-[0.99] border border-slate-900 cursor-pointer"
            >
              Sign In to View Live Inventory
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-7 py-3.5 text-xs font-bold transition active:scale-[0.99] border border-slate-200 shadow-2xs cursor-pointer"
            >
              Create Free Traveler Account
            </Link>
          </div>

          <div className="relative z-10 pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-900" /> 100% Vetted Fleet &amp; Stays
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-900" /> Instant M-Pesa Confirmations
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-slate-900" /> 24/7 Roadside Concierge
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
