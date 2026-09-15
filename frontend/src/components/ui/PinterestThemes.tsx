import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Sparkles, MapPin, Compass, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';

interface ThemePin {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  location: string;
  pricePerDayKES: number;
  imageUrl: string;
  aspect: string; // for masonry aspect ratio feel
  likes: number;
  featuredVehicle: string;
}

const PINTEREST_PINS: ThemePin[] = [
  {
    id: 'pin-1',
    title: 'Wilderness Luxe & Big Five Safari',
    subtitle: 'Track lions and wildebeests across the golden savannah in a luxury 4x4 Prado.',
    tag: 'Safari Vibe',
    location: 'Maasai Mara National Reserve',
    pricePerDayKES: 14000,
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[3/4]',
    likes: 342,
    featuredVehicle: 'Toyota Land Cruiser Prado',
  },
  {
    id: 'pin-2',
    title: 'Swahili Coast Sunset & Beach Cruise',
    subtitle: 'Warm Indian Ocean breeze, white sands, palm trees and coastal seafood.',
    tag: 'Coastal Vibe',
    location: 'Diani Beach & Ukunda',
    pricePerDayKES: 9500,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[4/5]',
    likes: 512,
    featuredVehicle: 'Toyota RAV4 AWD',
  },
  {
    id: 'pin-3',
    title: 'Great Rift Valley Escarpment Drive',
    subtitle: 'Panoramic escarpment views, Lake Naivasha flamingos and Hell’s Gate biking.',
    tag: 'Adventure Vibe',
    location: 'Naivasha & Nakuru',
    pricePerDayKES: 11500,
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[3/4]',
    likes: 289,
    featuredVehicle: 'Toyota Hiace Safari Van',
  },
  {
    id: 'pin-4',
    title: 'Mount Kenya Alpine Cloud Forest',
    subtitle: 'Fresh mountain air, bamboo forest canopy drives, and high-altitude luxury lodges.',
    tag: 'Mountain Vibe',
    location: 'Nanyuki & Mt Kenya',
    pricePerDayKES: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[4/3]',
    likes: 418,
    featuredVehicle: 'Land Rover Defender 4x4',
  },
  {
    id: 'pin-5',
    title: 'Amboseli Kilimanjaro Elephant Trail',
    subtitle: 'Capture iconic photos of giant elephant herds under Mount Kilimanjaro peak.',
    tag: 'Wildlife Vibe',
    location: 'Amboseli National Park',
    pricePerDayKES: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[3/4]',
    likes: 670,
    featuredVehicle: 'Custom 4x4 Safari Cruiser',
  },
  {
    id: 'pin-6',
    title: 'Nairobi Executive City & Nightlife',
    subtitle: 'Chauffeur luxury sedans for business meetings, fine dining, and giraffe manor.',
    tag: 'Urban Luxe',
    location: 'Westlands & Karen, Nairobi',
    pricePerDayKES: 5500,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[4/3]',
    likes: 198,
    featuredVehicle: 'Toyota Premio Executive',
  },
];

export const PinterestThemes: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [savedPins, setSavedPins] = useState<Record<string, boolean>>({});

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSavedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-marigold font-display">
            <Compass className="h-4 w-4 text-marigold" /> Curated Tourist Mood Boards
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl text-bone">
            Pinterest Tourism Vibe & Experiences
          </h2>
          <p className="mt-1 text-sm text-bone/60">
            Get inspired for your next Kenyan journey. Save your favorite vibes and book matching vehicles.
          </p>
        </div>
        <Link
          to="/search"
          className="btn-ghost text-xs !px-4 !py-2 flex items-center gap-1.5 border border-white/15"
        >
          View All Trips <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* PINTEREST MASONRY GRID */}
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 space-y-6">
        {PINTEREST_PINS.map((pin, i) => (
          <motion.div
            key={pin.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="break-inside-avoid group relative overflow-hidden rounded-3xl bg-ink-100 border border-white/10 shadow-3d-md hover:border-marigold/40 transition-all duration-300"
          >
            {/* IMAGE WITH ASPECT RATIO */}
            <div className={`relative w-full ${pin.aspect} overflow-hidden bg-ink/80`}>
              <img
                src={pin.imageUrl}
                alt={pin.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* TOP PIN BUTTON */}
              <button
                onClick={(e) => togglePin(pin.id, e)}
                className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition shadow-md ${
                  savedPins[pin.id]
                    ? 'bg-red-600 text-white'
                    : 'bg-ink/70 text-bone hover:bg-red-600 hover:text-white border border-white/20'
                }`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${savedPins[pin.id] ? 'fill-white' : ''}`} />
                {savedPins[pin.id] ? 'Pinned' : 'Pin'}
              </button>

              {/* TOP TAG BADGE */}
              <span className="absolute top-4 left-4 rounded-full bg-marigold/90 px-3 py-1 text-[11px] font-bold text-ink uppercase tracking-wider shadow-sm font-display">
                ✨ {pin.tag}
              </span>

              {/* BOTTOM CONTENT OVERLAY */}
              <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-1.5 text-xs text-marigold font-semibold mb-1">
                  <MapPin className="h-3.5 w-3.5" /> {pin.location}
                </div>

                <h3 className="font-display text-xl font-bold text-bone leading-snug group-hover:text-marigold transition-colors">
                  {pin.title}
                </h3>
                <p className="mt-1 text-xs text-bone/70 line-clamp-2 leading-relaxed">
                  {pin.subtitle}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    <span className="text-[10px] text-bone/50 uppercase tracking-widest block font-mono">From</span>
                    <span className="font-mono text-base font-bold text-marigold">
                      {formatPrice(pin.pricePerDayKES)}
                      <span className="text-[10px] font-sans font-normal text-bone/50">/day</span>
                    </span>
                  </div>

                  <Link
                    to="/search"
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-bone backdrop-blur-md border border-white/15 hover:bg-marigold hover:text-ink hover:border-marigold transition-all"
                  >
                    <span>Book Ride</span>
                    <Sparkles className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
