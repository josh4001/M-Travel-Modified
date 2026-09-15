import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play, MapPin, Globe2, Sparkles, Compass, Palmtree, Mountain, Building2 } from 'lucide-react';

export interface VideoTheme {
  id: string;
  title: string;
  location: string;
  coordinates: string;
  videoUrl: string;
  posterUrl: string;
  tagline: string;
  editorial: string;
  icon: any;
  region: string;
}

export const VIDEO_THEMES: VideoTheme[] = [
  {
    id: 'savanna',
    title: 'Masai Mara Golden Sunrise',
    location: 'Masai Mara National Reserve',
    coordinates: '1.4927° S, 35.1438° E',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-elephants-in-safari-5421/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Where the wild plains awaken in golden morning light',
    editorial: 'Private game drives in custom overland Land Cruisers across the untamed Mara ecosystem.',
    icon: Compass,
    region: 'Narok County, Kenya',
  },
  {
    id: 'ocean',
    title: 'Indian Ocean Turquoise Horizon',
    location: 'Diani Beach & Galu Coast',
    coordinates: '4.3477° S, 39.5684° E',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-waves-crashing-on-the-beach-2654/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Powdery white sands where warm tropical waters meet sky',
    editorial: 'Executive airport transfers and luxury beachfront villa access along Kenya’s south coast.',
    icon: Palmtree,
    region: 'Kwale County, Kenya',
  },
  {
    id: 'mountain',
    title: 'Great Rift Valley Escarpment',
    location: 'Lake Naivasha & Hell’s Gate',
    coordinates: '0.7172° S, 36.4310° E',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-elephants-walking-in-the-savannah-43306-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Majestic volcanic pinnacles and geothermal gorges',
    editorial: 'Scenic highland safari routes and luxury lakeside lodges nestled in the Great Rift.',
    icon: Mountain,
    region: 'Nakuru County, Kenya',
  },
  {
    id: 'city',
    title: 'Nairobi Skyline & Expressway',
    location: 'Nairobi Metropolis & Westlands',
    coordinates: '1.2921° S, 36.8219° E',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-a-timelapse-of-a-city-1753/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1600&q=80',
    tagline: 'The vibrant cosmopolitan gateway where business meets wildlife',
    editorial: 'Chauffeured Mercedes, Alphard executive vans, and instant airport express shuttles.',
    icon: Building2,
    region: 'Nairobi Capital, Kenya',
  },
];

interface AuthVideoBackgroundProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthVideoBackground({ children, title, subtitle }: AuthVideoBackgroundProps) {
  const [activeTheme, setActiveTheme] = useState<VideoTheme>(VIDEO_THEMES[0]);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeTheme = (theme: VideoTheme) => {
    setActiveTheme(theme);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] w-full overflow-hidden bg-slate-950 font-display flex flex-col justify-between">
      {/* 1. CINEMATIC BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          key={activeTheme.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster={activeTheme.posterUrl}
          className="h-full w-full object-cover scale-105 transition-transform duration-1000 ease-out"
        >
          <source src={activeTheme.videoUrl} type="video/mp4" />
          <img src={activeTheme.posterUrl} alt={activeTheme.title} className="h-full w-full object-cover" />
        </video>

        {/* MULTI-LAYERED AMBIENT LIGHTING OVERLAYS */}
        {/* Layer A: Warm Amber Sunrise / Sunset Radiance */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_25%_25%,rgba(245,158,11,0.24),transparent_70%)] pointer-events-none" />
        
        {/* Layer B: Deep Imperial Garnet Horizon Radiance */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_80%,rgba(131,24,67,0.22),transparent_70%)] pointer-events-none" />
        
        {/* Layer C: Cinematic Film Vignette & Contrast Guard */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(15,23,42,0.88)_100%)] pointer-events-none" />
        
        {/* Layer D: Bottom & Top Soft Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-slate-950/70 pointer-events-none" />
      </div>

      {/* 2. LUXURY TOP AMBIENT BAR */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-6 flex flex-wrap items-center justify-between gap-4">
        {/* LOCATION & GPS BEACON */}
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-slate-950/65 px-4 py-2 backdrop-blur-xl shadow-lg">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-2">
            <activeTheme.icon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-400">{activeTheme.location}</span>
            <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">({activeTheme.coordinates})</span>
          </span>
        </div>

        {/* INTERACTIVE SCENE SELECTOR */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/70 p-1.5 backdrop-blur-2xl shadow-2xl">
          {VIDEO_THEMES.map((theme) => {
            const isActive = activeTheme.id === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => changeTheme(theme)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <theme.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 md:py-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* LEFT COLUMN: EDITORIAL SHOWCASE */}
        <div className="lg:col-span-6 text-white space-y-6 hidden lg:block">
          {/* OVERLINE PILL */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
              East Africa’s Bespoke Luxury Mobility
            </span>
          </div>

          {/* EDITORIAL HEADLINE */}
          <div className="space-y-3">
            <h1 className="font-serif text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.18] drop-shadow-2xl">
              {activeTheme.title}
            </h1>
            <p className="font-display text-lg text-amber-200/90 font-medium max-w-xl italic leading-relaxed">
              "{activeTheme.tagline}"
            </p>
            <p className="text-sm text-slate-300 font-body max-w-lg leading-relaxed pt-1">
              {activeTheme.editorial}
            </p>
          </div>

          {/* CONTROLS & TELEMETRY */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 backdrop-blur-xl">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-white">{activeTheme.region}</span>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 backdrop-blur-xl">
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pause Experience' : 'Play Experience'}
                className="p-1 text-slate-300 hover:text-amber-400 transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="h-4 w-[1px] bg-white/20 mx-1" />
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute Ambient Wildlife Audio' : 'Mute Ambient Audio'}
                className="p-1 text-slate-300 hover:text-amber-400 transition flex items-center gap-1.5"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse" />
                      <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
                      <span className="w-0.5 h-2 bg-emerald-400 animate-pulse delay-150" />
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* AMBIENT HIGHLIGHT STATS */}
          <div className="grid grid-cols-3 gap-3 max-w-lg pt-2">
            <div className="rounded-2xl border border-white/15 bg-slate-950/60 p-3.5 text-left backdrop-blur-xl shadow-lg hover:border-amber-400/40 transition">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Sanctuaries</span>
              <span className="font-serif text-2xl font-bold text-amber-400">50+</span>
              <span className="block text-[11px] text-slate-300 font-medium">Iconic Reserves</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-slate-950/60 p-3.5 text-left backdrop-blur-xl shadow-lg hover:border-amber-400/40 transition">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Safari Fleet</span>
              <span className="font-serif text-2xl font-bold text-teal">120+</span>
              <span className="block text-[11px] text-slate-300 font-medium">Custom Cruisers</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-slate-950/60 p-3.5 text-left backdrop-blur-xl shadow-lg hover:border-amber-400/40 transition">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Instant Pay</span>
              <span className="font-serif text-2xl font-bold text-emerald-400">M-Pesa</span>
              <span className="block text-[11px] text-slate-300 font-medium">Safaricom Direct</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTH CARD CONTAINER */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-md">
            {title && (
              <div className="mb-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 backdrop-blur-md mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    M-TRAVEL Signature Concierge
                  </span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-sm text-slate-300 font-medium">{subtitle}</p>}
              </div>
            )}

            <div className="relative">{children}</div>

            {/* MOBILE SCENE SELECTOR */}
            <div className="mt-6 flex sm:hidden items-center justify-center gap-2 flex-wrap">
              {VIDEO_THEMES.map((theme) => {
                const isActive = activeTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-900/80 text-white/80 border border-white/15'
                    }`}
                  >
                    <theme.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. LUXURY BOTTOM BRAND ACCENT */}
      <div className="relative z-10 w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-2.5 px-6">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Globe2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-medium">M-TRAVEL Luxury African Mobility & Expeditions</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hidden sm:inline">Nairobi · Mombasa · Masai Mara · Diani · Amboseli</span>
            <span className="text-amber-400 font-semibold">24/7 Concierge: 0722 374 535</span>
          </div>
        </div>
      </div>
    </div>
  );
}
