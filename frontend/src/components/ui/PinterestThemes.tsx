import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, Sparkles, MapPin, Compass, ArrowUpRight,
  Info, X, MessageSquare, Check, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import {
  getServicesVibesDestinations,
  type TravelDestinationItem
} from '@/lib/destinationsStore';

export interface DefaultVibeItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  location: string;
  region: string;
  imageUrl: string;
  aspect: string;
  overview: string;
  highlights: string[];
  specs: string[];
}

export const DEFAULT_VIBES: DefaultVibeItem[] = [
  {
    id: 'vibe-mara',
    title: 'Wilderness Luxe & Big Five Safari',
    subtitle: 'Track lions and wildebeests across the golden savannah in a luxury 4x4 Safari Cruiser.',
    tag: 'Safari Vibe',
    location: 'Maasai Mara National Reserve',
    region: 'Narok County',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    aspect: 'aspect-[3/4]',
    overview: 'Experience the crown jewel of African wildlife safaris. Maasai Mara offers peerless big cat sightings, the world-famous Great Wildebeest Migration, and expansive savannah horizons tailored for discerning safari travelers.',
    highlights: [
      'Big Five game viewing (Lion, Leopard, Elephant, Buffalo, Rhino)',
      'World-famous Great Migration river crossing viewpoints (July – October)',
      'Sunrise hot air balloon safaris over the savannah plains',
      'Maasai cultural community visits and traditional beadwork',
      'Luxury tented camp and bush dining experiences'
    ],
    specs: ['4x4 Land Cruiser with Pop-Up Roof', 'Certified KPSGA Gold Safari Guide', 'High-Powered Spotting Scopes', 'Chilled Mineral Water & Field Refreshments'],
  },
  {
    id: 'vibe-diani',
    title: 'Swahili Coast Sunset & Beach Cruise',
    subtitle: 'Warm Indian Ocean breeze, white sands, palm trees and coastal seafood.',
    tag: 'Coastal Vibe',
    location: 'Diani Beach & Ukunda',
    region: 'Kwale County',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    aspect: 'aspect-[4/5]',
    overview: 'Unwind on Africa\'s leading beach destination with powder-white coral sands, crystal turquoise Indian Ocean shallows, and lush coastal palm canopies. Perfect for tropical tranquility, ocean watersports, and Swahili coastal heritage.',
    highlights: [
      'Pristine white sand beaches and warm Indian Ocean waters',
      'Traditional wooden dhow sunset cruises with Swahili seafood dinner',
      'Kisite-Mpunguti Marine National Park dolphin & turtle snorkeling',
      'Kite surfing, windsurfing, and glass-bottom reef boat tours',
      'Shimba Hills National Reserve day excursion for rare Sable antelopes'
    ],
    specs: ['Coastal All-Wheel Drive Vehicle', 'Beachfront Concierge Assistance', 'Complimentary Snorkeling Equipment', 'Private Airport Transfers (Ukunda/Mombasa)'],
  },
  {
    id: 'vibe-rift',
    title: 'Great Rift Valley Escarpment Drive',
    subtitle: 'Panoramic escarpment views, Lake Naivasha flamingos and Hell’s Gate biking.',
    tag: 'Adventure Vibe',
    location: 'Naivasha & Nakuru',
    region: 'Nakuru County',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
    aspect: 'aspect-[3/4]',
    overview: 'A picturesque expedition through Kenya\'s Great Rift Valley. Discover dramatic escarpments, freshwater lakes, geothermal steam gorges, and volcanic craters teeming with birdlife and wildlife.',
    highlights: [
      'Hell\'s Gate National Park canyon hiking and mountain biking',
      'Lake Naivasha boat safaris among resident hippopotamus pods',
      'Crescent Island wildlife sanctuary walking safaris alongside giraffes and zebras',
      'Lake Nakuru National Park flamingo spectacles and rhino sanctuary',
      'Natural geothermal hot spring spas at Olkaria'
    ],
    specs: ['Custom Safari Tour Van with Open Roof', 'Adventure Mountain Bike Racks', 'Experienced Naturalist & Birding Guide', 'All Park Entry Facilitation'],
  },
  {
    id: 'vibe-amboseli',
    title: 'Amboseli Kilimanjaro Elephant Trail',
    subtitle: 'Capture iconic photos of giant elephant herds under Mount Kilimanjaro peak.',
    tag: 'Wildlife Vibe',
    location: 'Amboseli National Park',
    region: 'Kajiado County',
    imageUrl: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80',
    aspect: 'aspect-[3/4]',
    overview: 'Witness iconic herds of free-ranging African elephants wandering under the snow-capped peak of Mount Kilimanjaro (Africa\'s highest summit). Amboseli\'s unique wetland marshes create extraordinary photographic backdrops.',
    highlights: [
      'Legendary close-up encounters with giant "Super Tusker" elephants',
      'Iconic, unobstructed photography of Mount Kilimanjaro summit',
      'Panoramic 360-degree vistas from Observation Hill (Normatior)',
      'Over 400 species of resident and migratory water birds in Enkongo Narok marshes',
      'Rich Maasai pastoralist cultural heritage interactions'
    ],
    specs: ['Custom 4x4 Safari Cruiser', 'Individual Photography Window Seats', 'High-Definition Binoculars Provided', 'Panoramic Viewing Roof Hatch'],
  },
];

type VibeModalTarget = 
  | { type: 'DEFAULT'; data: DefaultVibeItem }
  | { type: 'ADMIN'; data: TravelDestinationItem };

export const PinterestThemes: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [savedPins, setSavedPins] = useState<Record<string, boolean>>({});
  const [adminDestinations, setAdminDestinations] = useState<TravelDestinationItem[]>(() => getServicesVibesDestinations());
  const [selectedVibe, setSelectedVibe] = useState<VibeModalTarget | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setAdminDestinations(getServicesVibesDestinations());
    };
    window.addEventListener('mt_destinations_updated', handleUpdate);
    return () => window.removeEventListener('mt_destinations_updated', handleUpdate);
  }, []);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSavedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasAdminPackages = adminDestinations.length > 0;

  return (
    <section className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
            <Compass className="h-4 w-4 text-amber-600" /> Curated Tourist Mood Boards
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl text-slate-950">
            Tourism Vibe &amp; Experiences
          </h2>
          <p className="mt-1 text-sm text-slate-600 font-normal">
            {hasAdminPackages
              ? 'Handpicked safari expeditions, guided tours, and holiday stays curated by our travel desk.'
              : 'Get inspired for your next Kenyan journey. Save your favorite vibes and explore immersive destination itineraries.'}
          </p>
        </div>
        <Link
          to="/holidays-and-tours"
          className="rounded-full bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-400 text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-xs transition"
        >
          View All Trips <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* TOURISM VIBES MASONRY GRID */}
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 space-y-6">
        {hasAdminPackages ? (
          // ── ADMIN PACKAGES DISPLAY (UP TO 6) ──
          adminDestinations.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="break-inside-avoid group relative overflow-hidden rounded-3xl bg-slate-900 border border-amber-900/40 shadow-xl hover:border-amber-500/50 hover:shadow-2xl transition-all duration-300"
            >
              {/* IMAGE */}
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-950">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                {/* TOP SAVE VIBE BUTTON */}
                <button
                  type="button"
                  onClick={(e) => togglePin(item.id, e)}
                  className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition shadow-md z-10 ${
                    savedPins[item.id]
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 border border-white/30'
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${savedPins[item.id] ? 'fill-slate-950 text-slate-950' : 'text-white'}`} />
                  {savedPins[item.id] ? 'Saved' : 'Save Vibe'}
                </button>

                {/* TOP BADGE */}
                <span className="absolute top-4 left-4 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-slate-950 uppercase tracking-wider shadow-md font-display inline-flex items-center gap-1.5 z-10">
                  <Sparkles className="h-3 w-3 text-slate-950" />
                  <span>{item.badge || (item.category === 'TOUR' ? 'Safari Package' : 'Holiday Home')}</span>
                </span>

                {/* BOTTOM CONTENT OVERLAY */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {item.location}
                  </div>

                  <h3 className="font-display text-xl font-bold text-white leading-snug group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-200 line-clamp-2 leading-relaxed font-normal">
                    {item.subtitle}
                  </p>

                  {/* PRICE & ACTION BUTTONS */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-300 uppercase tracking-widest block font-mono">From</span>
                      <span className="font-mono text-base font-bold text-amber-400 truncate block">
                        {formatPrice(item.priceKES)}
                        <span className="text-[10px] font-sans font-normal text-slate-300 ml-1">{item.priceUnit || '/ person'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedVibe({ type: 'ADMIN', data: item })}
                        className="rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Details
                      </button>
                      <Link
                        to={`/holidays-and-tours?book=${item.id}`}
                        className="flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition shadow-md"
                      >
                        <span>Book</span>
                        <Sparkles className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          // ── DEFAULT FALLBACK VIBES (NO PRICES · DETAILS BUTTON ONLY) ──
          DEFAULT_VIBES.map((pin, i) => (
            <motion.div
              key={pin.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="break-inside-avoid group relative overflow-hidden rounded-3xl bg-slate-900 border border-amber-900/40 shadow-xl hover:border-amber-500/50 hover:shadow-2xl transition-all duration-300"
            >
              {/* IMAGE WITH ASPECT RATIO */}
              <div className={`relative w-full ${pin.aspect} overflow-hidden bg-slate-950`}>
                <img
                  src={pin.imageUrl}
                  alt={pin.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                {/* TOP SAVE VIBE BUTTON */}
                <button
                  type="button"
                  onClick={(e) => togglePin(pin.id, e)}
                  className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition shadow-md z-10 ${
                    savedPins[pin.id]
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 border border-white/30'
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${savedPins[pin.id] ? 'fill-slate-950 text-slate-950' : 'text-white'}`} />
                  {savedPins[pin.id] ? 'Saved' : 'Save Vibe'}
                </button>

                {/* TOP TAG BADGE */}
                <span className="absolute top-4 left-4 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-slate-950 uppercase tracking-wider shadow-md font-display inline-flex items-center gap-1.5 z-10">
                  <Sparkles className="h-3 w-3 text-slate-950" />
                  <span>{pin.tag}</span>
                </span>

                {/* BOTTOM CONTENT OVERLAY */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {pin.location}
                  </div>

                  <h3 className="font-display text-xl font-bold text-white leading-snug group-hover:text-amber-400 transition-colors">
                    {pin.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-200 line-clamp-2 leading-relaxed font-normal">
                    {pin.subtitle}
                  </p>

                  {/* NO PRICE — BUTTON SHOWING JUST DETAILS OF DESTINATION */}
                  <div className="mt-4 border-t border-white/20 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedVibe({ type: 'DEFAULT', data: pin })}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-amber-500 hover:text-slate-950 border border-white/25 py-2.5 px-4 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                    >
                      <Info className="h-4 w-4" />
                      <span>View Destination Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── DESTINATION DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedVibe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-amber-900/60 p-6 md:p-8 shadow-2xl text-slate-100 font-display space-y-6"
            >
              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={() => setSelectedVibe(null)}
                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* MODAL HEADER */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  {selectedVibe.type === 'ADMIN'
                    ? selectedVibe.data.badge || 'Safari Tour'
                    : selectedVibe.data.tag}
                </span>

                <h2 className="text-2xl md:text-3xl font-bold font-serif text-white">
                  {selectedVibe.data.title}
                </h2>

                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedVibe.data.location}
                  {selectedVibe.data.region && (
                    <span className="text-slate-400 font-normal">· {selectedVibe.data.region}</span>
                  )}
                </div>
              </div>

              {/* HERO IMAGE */}
              <div className="relative h-64 md:h-72 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={selectedVibe.data.imageUrl}
                  alt={selectedVibe.data.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* OVERVIEW */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Destination Overview &amp; Experience
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {selectedVibe.type === 'ADMIN'
                    ? selectedVibe.data.details?.overview || selectedVibe.data.subtitle
                    : selectedVibe.data.overview}
                </p>
              </div>

              {/* HIGHLIGHTS */}
              {((selectedVibe.type === 'ADMIN' && selectedVibe.data.details?.highlights?.length) ||
                (selectedVibe.type === 'DEFAULT' && selectedVibe.data.highlights?.length)) && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Curated Highlights
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {(selectedVibe.type === 'ADMIN'
                      ? selectedVibe.data.details.highlights
                      : selectedVibe.data.highlights
                    ).map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SPECS & EXPEDITION GEAR */}
              {((selectedVibe.type === 'ADMIN' && selectedVibe.data.specs?.length) ||
                (selectedVibe.type === 'DEFAULT' && selectedVibe.data.specs?.length)) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Included Amenities &amp; Transport Setup
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedVibe.type === 'ADMIN'
                      ? selectedVibe.data.specs
                      : selectedVibe.data.specs
                    ).map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                {selectedVibe.type === 'ADMIN' ? (
                  // Admin Package Footer: Displays price and Book Now button
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
                        Published Rate
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-xl font-bold text-amber-400">
                          {formatPrice(selectedVibe.data.priceKES)}
                        </span>
                        <span className="text-xs text-slate-300">{selectedVibe.data.priceUnit || '/ person'}</span>
                      </div>
                    </div>
                    <Link
                      to={`/holidays-and-tours?book=${selectedVibe.data.id}`}
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Book Safari Package</span>
                    </Link>
                  </>
                ) : (
                  // Default Fallback Footer: No prices, just inquiry / close
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Verified Kenyan Tourist Mood Board &amp; Sanctuary</span>
                    </div>
                    <a
                      href={`https://wa.me/254722374535?text=${encodeURIComponent(`Hello M-TRAVEL Concierge! I am interested in learning more about the ${selectedVibe.data.title} experience in ${selectedVibe.data.location}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 text-xs font-bold transition shadow-sm flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4 fill-white" />
                      <span>Inquire with Travel Concierge</span>
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export const TourismVibes = PinterestThemes;
