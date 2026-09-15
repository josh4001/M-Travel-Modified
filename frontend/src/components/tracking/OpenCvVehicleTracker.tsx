import React, { useState, useEffect } from 'react';
import { Camera, Navigation, Car, Phone, Play, Pause, Radio, Compass, RefreshCw, X, Eye } from 'lucide-react';
import { MpesaLogo } from '../ui/MpesaLogo';

interface OpenCvVehicleTrackerProps {
  vehicleName?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  bookingRef?: string;
  bookingId?: string;
  touristName?: string;
  role?: 'tourist' | 'owner' | 'admin';
  pickup?: string;
  destination?: string;
  onClose?: () => void;
}

export const OpenCvVehicleTracker: React.FC<OpenCvVehicleTrackerProps> = ({
  vehicleName = 'Toyota Land Cruiser 4x4 V8 Safari',
  vehiclePlate = 'KDA 789X',
  driverName = 'John Kamau (Certified Safari Guide)',
  driverPhone = '0722 998 811',
  bookingRef = 'MT-884920',
  touristName: _touristName,
  role: _role = 'tourist',
  pickup = 'Nairobi JKIA Airport (Terminal 1A)',
  destination = 'Maasai Mara Sopa Lodge',
  onClose,
}) => {
  const [progress, setProgress] = useState(38); // percentage along route
  const [speed, setSpeed] = useState(68); // km/h
  const [fps, setFps] = useState(30);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'opencv' | 'uber_map' | 'split'>('split');

  // Simulate vehicle movement along route
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 98 ? 10 : prev + 1));
      setSpeed(60 + Math.floor(Math.random() * 15));
      setFps(29 + Math.floor(Math.random() * 3));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-mtravel-gold/40 bg-mtravel-obsidian p-5 shadow-3d-glow text-white font-display relative overflow-hidden">
      {/* TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400 border border-red-500/30">
              <Radio className="h-3 w-3 animate-ping" /> OpenCV Live Vision Stream
            </span>
            <span className="text-[10px] font-mono text-mtravel-lightGold font-bold">Ref: {bookingRef}</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-white mt-1 flex items-center gap-2">
            <Car className="h-5 w-5 text-mtravel-gold" /> {vehicleName} <span className="text-sm font-mono text-white/60">({vehiclePlate})</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <MpesaLogo variant="badge" />
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* VIEW SWITCHER TABS */}
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3 text-xs">
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
          {[
            { id: 'split', label: 'Split View (OpenCV + Uber Map)', icon: Eye },
            { id: 'opencv', label: 'OpenCV Road Camera Video', icon: Camera },
            { id: 'uber_map', label: 'Uber 2D/3D GPS Route', icon: Navigation },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  isActive
                    ? 'bg-mtravel-burgundy text-mtravel-lightGold border border-mtravel-gold/40 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 text-[11px] font-mono bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 text-mtravel-lightGold" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
          <span>{isPlaying ? 'Pause Feed' : 'Resume Feed'}</span>
        </button>
      </div>

      {/* TRACKING CANVAS & VIDEO FEED CONTAINER */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* OPENCV COMPUTER VISION SIMULATED CAMERA FEED */}
        {(viewMode === 'opencv' || viewMode === 'split') && (
          <div className="relative h-64 rounded-2xl bg-black border border-emerald-500/40 overflow-hidden shadow-inner font-mono">
            {/* BACKGROUND SIMULATED ROAD HIGHWAY CAMERA IMAGE */}
            <img
              src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80"
              alt="OpenCV Live Highway Feed"
              className="h-full w-full object-cover opacity-80"
            />

            {/* OPENCV HUD BOUNDING BOX OVERLAYS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 p-3 flex flex-col justify-between">
              {/* TOP OpenCV METADATA */}
              <div className="flex items-center justify-between text-[10px] text-emerald-400 bg-black/60 p-2 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>OPENCV_CORE_v4.8 :: STREAM_LIVE</span>
                </div>
                <span>FPS: {fps}.0 | VELOCITY: {speed} KM/H</span>
              </div>

              {/* BOUNDING BOX SIMULATION ON VEHICLE */}
              <div className="relative mx-auto w-48 h-24 border-2 border-emerald-400 rounded-lg p-1 bg-emerald-500/10 flex flex-col justify-between">
                <span className="text-[9px] bg-emerald-400 text-black font-extrabold px-1 py-0.5 rounded w-fit">
                  TARGET: {vehiclePlate} [CONF: 99.4%]
                </span>
                <div className="text-[9px] text-emerald-300 flex justify-between font-mono">
                  <span>LANE_KEEP: OK</span>
                  <span>DIST: 42M</span>
                </div>
              </div>

              {/* BOTTOM ROAD LOCATION */}
              <div className="flex items-center justify-between text-[10px] text-white/90 bg-black/60 p-2 rounded-lg backdrop-blur-sm border border-white/10 font-medium">
                <span>SEGMENT: A104 Highway - Naivasha Rift Valley Escarpment</span>
                <span className="text-mtravel-lightGold font-bold">MODE: OPENCV AI MOVEMENT</span>
              </div>
            </div>
          </div>
        )}

        {/* UBER-STYLE 2D/3D MAP GPS ROUTE SIMULATOR */}
        {(viewMode === 'uber_map' || viewMode === 'split') && (
          <div className="relative h-64 rounded-2xl bg-mtravel-obsidian border border-mtravel-gold/30 p-4 flex flex-col justify-between overflow-hidden">
            {/* GRID BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

            <div className="relative z-10 flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <span className="font-mono text-mtravel-lightGold flex items-center gap-1 font-bold">
                <Compass className="h-4 w-4 text-mtravel-gold" /> Uber GPS Live Route View
              </span>
              <span className="text-[10px] text-slate-300 font-mono font-medium">{progress}% Journey Complete</span>
            </div>

            {/* ROUTE LINE ANIMATION */}
            <div className="relative z-10 my-auto py-6">
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-gradient transition-all duration-700 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* MOVING CAR ICON */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
                style={{ left: `calc(${progress}% - 16px)` }}
              >
                <div className="h-8 w-8 rounded-full bg-mtravel-burgundy border-2 border-mtravel-gold flex items-center justify-center text-mtravel-lightGold shadow-gold-glow animate-bounce">
                  <Car className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* LOCATIONS SUMMARY */}
            <div className="relative z-10 grid grid-cols-2 gap-2 text-[11px] bg-black/50 p-2.5 rounded-xl border border-white/10">
              <div>
                <span className="text-white/60 text-[9px] uppercase font-mono block">Origin</span>
                <span className="font-bold text-white truncate block">{pickup}</span>
              </div>
              <div>
                <span className="text-white/60 text-[9px] uppercase font-mono block">Destination</span>
                <span className="font-bold text-emerald-400 truncate block">{destination}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHAUFFEUR DRIVER DETAILS & ACTION BAR */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-mtravel-burgundy border border-mtravel-gold flex items-center justify-center font-serif text-lg font-bold text-mtravel-lightGold">
            JK
          </div>
          <div>
            <p className="font-bold text-white flex items-center gap-1.5">
              {driverName}
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">
                Verified Chauffeur
              </span>
            </p>
            <p className="text-white/70 text-[11px] font-mono mt-0.5">
              Plate: <strong className="text-mtravel-lightGold">{vehiclePlate}</strong> | Rating: ★ 4.98 (210 Trips)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${driverPhone}`}
            className="btn-primary text-xs !py-2 !px-4 !bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-md"
          >
            <Phone className="h-3.5 w-3.5" /> Call Driver ({driverPhone})
          </a>
          <button
            onClick={() => alert('Sending priority ping to driver console...')}
            className="btn-ghost text-xs !py-2 !px-3 flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5 text-mtravel-gold" /> Ping Driver GPS
          </button>
        </div>
      </div>
    </div>
  );
};
