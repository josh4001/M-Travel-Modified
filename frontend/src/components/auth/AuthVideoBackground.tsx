import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play, MapPin, Compass, Globe2 } from 'lucide-react';

interface VideoTheme {
  id: string;
  title: string;
  location: string;
  videoUrl: string;
  posterUrl: string;
  tagline: string;
  emoji: string;
}

const VIDEO_THEMES: VideoTheme[] = [
  {
    id: 'savanna',
    title: 'African Savanna Sunrise',
    location: 'East Africa',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-elephants-in-safari-5421/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Where the wilderness begins at dawn',
    emoji: '🦁',
  },
  {
    id: 'ocean',
    title: 'Indian Ocean Horizon',
    location: 'East African Coast',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-waves-crashing-on-the-beach-2654/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Powdery sands where the ocean meets sky',
    emoji: '🏝️',
  },
  {
    id: 'mountain',
    title: 'Mountain Peaks & Valleys',
    location: 'Great Rift Valley, Africa',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-elephants-walking-in-the-savannah-43306-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Majestic landscapes crafted by time itself',
    emoji: '⛰️',
  },
  {
    id: 'city',
    title: 'Nairobi City Lights',
    location: 'Nairobi, Kenya',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-a-timelapse-of-a-city-1753/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1600&q=80',
    tagline: 'The heartbeat of East Africa never sleeps',
    emoji: '🌃',
  },
];

interface AuthVideoBackgroundProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
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
    <div className="relative min-h-[calc(100vh-73px)] w-full overflow-hidden bg-ink">
      {/* BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          key={activeTheme.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster={activeTheme.posterUrl}
          className="h-full w-full object-cover scale-105"
        >
          <source src={activeTheme.videoUrl} type="video/mp4" />
          <img src={activeTheme.posterUrl} alt={activeTheme.title} className="h-full w-full object-cover" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-ink/20" />
      </div>

      {/* TOP BAR */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 flex flex-wrap items-center justify-between gap-4">
        {/* LOCATION BADGE */}
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-ink/60 px-4 py-1.5 backdrop-blur-md">
          <Globe2 className="h-4 w-4 text-marigold" />
          <span className="text-xs font-semibold text-bone">
            {activeTheme.emoji} {activeTheme.location}
          </span>
        </div>

        {/* SCENE SELECTOR */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-white/10 bg-ink/60 p-1 backdrop-blur-lg">
          {VIDEO_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => changeTheme(theme)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeTheme.id === theme.id
                  ? 'bg-marigold text-ink font-semibold'
                  : 'text-bone/70 hover:text-bone hover:bg-white/5'
              }`}
            >
              {theme.emoji} {theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT: SHOWCASE */}
        <div className="lg:col-span-6 text-bone space-y-6 hidden lg:block">
          <div className="space-y-3">
            <h2 className="font-display text-4xl xl:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
              {activeTheme.title}
            </h2>
            <p className="text-lg text-bone/80 font-body max-w-lg leading-relaxed">
              {activeTheme.tagline}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
              <MapPin className="h-4 w-4 text-marigold" />
              <span className="text-sm font-medium">{activeTheme.location}</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                className="p-1.5 text-bone hover:text-marigold transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 text-bone hover:text-marigold transition border-l border-white/10 pl-2"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
            <div className="rounded-xl border border-white/10 bg-ink/60 p-3 text-center backdrop-blur-md">
              <span className="block text-xs text-bone/50">Destinations</span>
              <span className="font-mono text-lg font-bold text-marigold">50+ Spots</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink/60 p-3 text-center backdrop-blur-md">
              <span className="block text-xs text-bone/50">Vehicles</span>
              <span className="font-mono text-lg font-bold text-teal">120+ Vehicles</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink/60 p-3 text-center backdrop-blur-md">
              <span className="block text-xs text-bone/50">Payment</span>
              <span className="font-mono text-lg font-bold text-white">M-Pesa</span>
            </div>
          </div>
        </div>

        {/* RIGHT: AUTH FORM */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:text-left">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-marigold to-coral shadow-glow mb-3">
                <Compass className="h-6 w-6 text-ink" />
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-bone">{title}</h1>
              <p className="mt-1 text-sm text-bone/70">{subtitle}</p>
            </div>

            <div className="relative">{children}</div>

            {/* MOBILE SCENE SELECTOR */}
            <div className="mt-6 flex md:hidden items-center justify-center gap-2 flex-wrap">
              {VIDEO_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => changeTheme(theme)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    activeTheme.id === theme.id
                      ? 'bg-marigold text-ink'
                      : 'bg-ink/70 text-bone/70 border border-white/10'
                  }`}
                >
                  {theme.emoji} {theme.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
