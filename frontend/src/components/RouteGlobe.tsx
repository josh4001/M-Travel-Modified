import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Sparkles, 
  ShieldCheck, 
  Star, 
  ArrowRight,
  Car,
  Palmtree,
  Mountain,
  Sun
} from 'lucide-react';

interface RouteDestination {
  id: string;
  name: string;
  shortName: string;
  tag: string;
  icon: any;
  imageUrl: string;
  distance: string;
  duration: string;
  routePath: string;
  vehicleName: string;
  vehicleBadge: string;
  vehicleSpecs: string[];
  rate: string;
  rating: number;
  reviews: number;
  coordinates: string;
  region: string;
  highlights: string;
}

const SAFARI_ROUTES: RouteDestination[] = [
  {
    id: 'maasai-mara',
    name: 'Maasai Mara National Reserve',
    shortName: 'Maasai Mara',
    tag: 'Big Five & Great Migration',
    icon: Compass,
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    distance: '270 km',
    duration: '4h 30m Drive / 45m Flight',
    routePath: 'Nairobi (JKIA) ➔ Rift Escarpment ➔ Narok ➔ Mara Serena',
    vehicleName: 'Custom 4x4 Safari Land Cruiser Extended',
    vehicleBadge: 'Pop-Up Roof & 360° Game Viewing',
    vehicleSpecs: ['Starlink Onboard', 'Chilled Refreshments', 'Heavy-Duty 4WD Lock'],
    rate: 'KES 25,000 / day',
    rating: 4.99,
    reviews: 420,
    coordinates: '1.4927° S, 35.1438° E',
    region: 'Narok County, Kenya',
    highlights: 'World-famous savanna plains, lions, cheetahs & migration crossings.',
  },
  {
    id: 'amboseli',
    name: 'Amboseli National Park',
    shortName: 'Amboseli',
    tag: 'Mt. Kilimanjaro & Elephant Herds',
    icon: Sun,
    imageUrl: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
    distance: '240 km',
    duration: '3h 45m Scenic Highway',
    routePath: 'Nairobi Hub ➔ Athi River Plains ➔ Emali ➔ Amboseli Sanctuary',
    vehicleName: 'Executive 4x4 Prado V8 Safari Edition',
    vehicleBadge: 'High-Elevation Panoramic Sunroof',
    vehicleSpecs: ['All-Terrain Dampers', 'KWS Ranger Approved', 'Full AC Climate'],
    rate: 'KES 20,000 / day',
    rating: 4.98,
    reviews: 310,
    coordinates: '2.6527° S, 37.2606° E',
    region: 'Kajiado County, Kenya',
    highlights: 'Big-tusked elephant herds walking against Mount Kilimanjaro’s snowy peak.',
  },
  {
    id: 'diani-beach',
    name: 'Diani Beach & Swahili Coast',
    shortName: 'Diani Coast',
    tag: 'Turquoise Waters & Private Villas',
    icon: Palmtree,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    distance: '500 km',
    duration: '1h Direct Flight / VIP SGR',
    routePath: 'Nairobi ➔ Mombasa Coastline ➔ Likoni VIP Channel ➔ Diani Strip',
    vehicleName: 'Executive VIP Alphard Lounge & Chauffeur',
    vehicleBadge: 'First-Class Reclining Captain Seats',
    vehicleSpecs: ['Leather Captain Lounges', 'Complimentary WiFi', 'Chilled Towels'],
    rate: 'KES 18,000 / day',
    rating: 4.99,
    reviews: 580,
    coordinates: '4.3477° S, 39.5684° E',
    region: 'Kwale County, Kenya',
    highlights: 'Powdery white sands, coral reef marine safaris & beachfront luxury villas.',
  },
  {
    id: 'lake-naivasha',
    name: 'Great Rift Valley & Lake Naivasha',
    shortName: 'Great Rift',
    tag: 'Volcanic Canyons & Hell’s Gate',
    icon: Mountain,
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
    distance: '90 km',
    duration: '1h 30m Mountain Escarpment',
    routePath: 'Nairobi Capital ➔ Rift Valley Viewpoint ➔ Lake Naivasha Escarpment',
    vehicleName: 'All-Terrain Luxury 4x4 Expedition SUV',
    vehicleBadge: 'Extreme Ground Clearance',
    vehicleSpecs: ['Differential Lock', 'Panoramic Glass Roof', 'Luggage Roof Rack'],
    rate: 'KES 15,000 / day',
    rating: 4.96,
    reviews: 290,
    coordinates: '0.7172° S, 36.4310° E',
    region: 'Nakuru County, Kenya',
    highlights: 'Breathtaking escarpment vistas, geothermal spas & lakeside boat safaris.',
  },
];

export function RouteGlobe() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const current = SAFARI_ROUTES[activeIdx];

  // Smooth rotation every 6 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SAFARI_ROUTES.length);
      setProgress(0);
    }, 6000);

    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 2));
    }, 120);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isHovered, activeIdx]);

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-2xl group text-white font-display select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. CINEMATIC HERO BACKGROUND IMAGE WITH SMOOTH CROSS-FADE */}
      <div className="relative h-[430px] sm:h-[470px] w-full overflow-hidden">
        {SAFARI_ROUTES.map((dest, idx) => (
          <div
            key={dest.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeIdx ? 'opacity-100 scale-105 transition-transform duration-10000' : 'opacity-0 scale-100 pointer-events-none'
            }`}
          >
            <img
              src={dest.imageUrl}
              alt={dest.name}
              className="h-full w-full object-cover object-center"
            />
            {/* Cinematic Gradient Overlays for Razor-Sharp Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/25" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_20%,rgba(217,119,6,0.3),transparent_70%)]" />
          </div>
        ))}

        {/* 2. TOP VIP EXPEDITION BRAND STRIP */}
        <div className="relative z-10 p-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30">
              <Compass className="h-4 w-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                <Sparkles className="h-3 w-3" /> M-TRAVEL Expedition Network
              </span>
              <p className="text-[10px] text-slate-300 font-medium">Bespoke 4x4 Safari & Chauffeur Routes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Route Active
            </span>
          </div>
        </div>

        {/* 3. DESTINATION INTERACTIVE SELECTOR PILLS */}
        <div className="relative z-10 px-5 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SAFARI_ROUTES.map((dest, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={dest.id}
                  onClick={() => {
                    setActiveIdx(idx);
                    setProgress(0);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                      : 'border border-white/15 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md'
                  }`}
                >
                  <dest.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{dest.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. MAIN FLOATING SAFARI EXPEDITION CARD */}
        <div className="relative z-10 px-5 pt-4 flex flex-col justify-between h-[calc(100%-120px)]">
          {/* TOP METRICS & SANCTUARY TITLE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>{current.region}</span>
              <span className="text-white/40">•</span>
              <span className="font-mono text-[11px] text-slate-300">{current.coordinates}</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
              {current.name}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-md font-body leading-relaxed">
              {current.highlights}
            </p>
          </div>

          {/* DYNAMIC TELEMETRY & VEHICLE SPOTLIGHT */}
          <div className="space-y-3 pt-4">
            {/* EXPEDITION ROUTE BAR */}
            <div className="rounded-2xl border border-white/15 bg-slate-950/75 p-3.5 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Navigation className="h-3.5 w-3.5 text-amber-400" />
                  <span>Route Waypoint</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-amber-400 font-bold">{current.distance}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-emerald-400 font-semibold">{current.duration}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-300 font-mono flex items-center justify-between">
                <span className="truncate pr-2">{current.routePath}</span>
                <span className="shrink-0 text-amber-400 font-bold">{progress}%</span>
              </div>

              {/* LIVE ANIMATED ROUTE PROGRESS */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* RECOMMENDED LUXURY VEHICLE CHIP */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-3 backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400 shrink-0">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{current.vehicleName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                    <span className="text-amber-300 font-semibold">{current.vehicleBadge}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="h-3 w-3 fill-amber-400" /> {current.rating} ({current.reviews})
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/catalogue')}
                className="hidden sm:flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3 py-2 text-[11px] font-extrabold text-slate-950 transition shadow-md shadow-amber-500/25 shrink-0 uppercase tracking-wider"
              >
                Hire 4x4 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SAFARICOM M-PESA & TRUST STRIP */}
      <div className="border-t border-white/10 bg-slate-950 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-white">Kenya Wildlife Service Approved Fleet</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-[11px] text-slate-400">Chauffeured or Self-Drive Safaris</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400">Rate:</span>
          <span className="text-amber-400 font-bold">{current.rate}</span>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
            Instant M-PESA
          </span>
        </div>
      </div>
    </div>
  );
}
