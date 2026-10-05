import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Compass } from 'lucide-react';

interface MinimalistTravelerGreetingProps {
  className?: string;
}

export const MinimalistTravelerGreeting: React.FC<MinimalistTravelerGreetingProps> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* ── AMBIENT BACKGROUND GLOW (SAVANNAH GOLD & EMERALD OASIS) ── */}
      <div 
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-amber-200/40 via-amber-100/20 to-emerald-100/20 blur-3xl opacity-80 pointer-events-none scale-90"
        aria-hidden="true"
      />

      {/* ── BACKGROUND ARCHITECTURAL COMPASS & TOURISM CONTOUR LINES ── */}
      <div className="absolute -top-6 -right-6 w-36 h-36 opacity-40 pointer-events-none hidden sm:block" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-amber-700/40 fill-none" strokeWidth="0.75">
          <circle cx="50" cy="50" r="45" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="32" strokeWidth="0.5" />
          <line x1="50" y1="2" x2="50" y2="98" strokeWidth="0.5" />
          <line x1="2" y1="50" x2="98" y2="50" strokeWidth="0.5" />
          <path d="M 50 15 L 53 47 L 85 50 L 53 53 L 50 85 L 47 53 L 15 50 L 47 47 Z" fill="currentColor" className="fill-amber-500/15 stroke-amber-600" strokeWidth="0.75" />
          <text x="50" y="10" textAnchor="middle" className="text-[7px] font-mono fill-amber-700 font-bold">N</text>
        </svg>
      </div>

      {/* ── MAIN ILLUSTRATION CONTAINER ── */}
      <div className="relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] aspect-square flex items-center justify-center">
        {/* Soft Feathered Edge Masking for Organic Blending */}
        <div 
          className="relative w-full h-full overflow-hidden flex items-center justify-center"
          style={{
            maskImage: 'radial-gradient(ellipse at 50% 50%, black 58%, rgba(0, 0, 0, 0.85) 75%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 58%, rgba(0, 0, 0, 0.85) 75%, transparent 100%)',
          }}
        >
          <img
            src="/hero-minimalist-travelers.jpg"
            alt="M-TRAVEL luxury safari travelers greeting guests in Kenya"
            className="w-full h-full object-contain mix-blend-multiply filter contrast-[1.03] brightness-[1.01] transition-transform duration-700 hover:scale-[1.02]"
            loading="eager"
          />
        </div>

        {/* ── FLOATING GREETING SPEECH CHIP (GREETING NEW USERS) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          className="absolute top-4 sm:top-6 right-2 sm:right-6 z-20"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="group flex items-center gap-2.5 rounded-2xl border border-amber-200/90 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md transition-all hover:border-amber-400 hover:shadow-xl"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-950 flex items-center gap-1">
                <span>Jambo &amp; Karibu Kenya!</span>
                <Sparkles className="h-3 w-3 text-amber-500 inline" />
              </p>
              <p className="text-[10px] font-mono text-amber-700 font-semibold uppercase tracking-wider">
                VIP Concierge Desk
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── EXPEDITION DESTINATIONS CHIP (BOTTOM ACCENT) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute -bottom-2 sm:bottom-2 left-2 sm:left-6 z-20 hidden xs:flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 px-3.5 shadow-md backdrop-blur-md"
        >
          <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-xs border border-amber-500/30">
            <Compass className="h-4 w-4 text-amber-400" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-slate-950">Curated Safari Routes</p>
            <p className="text-[10px] text-slate-600 font-mono flex items-center gap-1 font-medium">
              <MapPin className="h-2.5 w-2.5 text-emerald-600" />
              <span>Mara · Amboseli · Diani Beach</span>
            </p>
          </div>
        </motion.div>

        {/* ── VERTICAL HAILINE COORDINATES STRIP (EDITORIAL BILLION-DOLLAR TOUCH) ── */}
        <div 
          className="absolute -right-6 top-1/2 -translate-y-1/2 rotate-90 text-[8px] font-mono tracking-[0.25em] text-slate-400 uppercase select-none pointer-events-none hidden xl:block"
          aria-hidden="true"
        >
          <span>LAT 01° 17' S · LON 36° 49' E — NAIROBI</span>
        </div>
      </div>
    </div>
  );
};
