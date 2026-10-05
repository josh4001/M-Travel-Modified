/**
 * M-TRAVEL Ambient Luxury Radiance & Minimalist Topographic Pattern.
 * Enriches the white background with subtle Savannah Gold and Kenyan Emerald radiance
 * plus whisper-delicate architectural expedition patterns that do not overwhelm.
 */
export function Hero3DCanvas() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* ── MINIMALIST ARCHITECTURAL EXPEDITION GRID PATTERN ── */}
      <div 
        className="absolute inset-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]"
        style={{
          backgroundImage: `
            radial-gradient(circle, #0f172a 1px, transparent 1px),
            linear-gradient(to right, #0f172a 0.5px, transparent 0.5px),
            linear-gradient(to bottom, #0f172a 0.5px, transparent 0.5px)
          `,
          backgroundSize: '32px 32px, 96px 96px, 96px 96px',
        }}
      />

      {/* ── SUBTLE WHISPER TOPOGRAPHIC ELEVATION LINES (KENYA TRANSECT) ── */}
      <svg
        viewBox="0 0 1440 600"
        fill="none"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-auto stroke-amber-900/[0.04] stroke-[0.75] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]"
      >
        <path d="M 0 120 Q 360 40, 720 100 T 1440 60" />
        <path d="M 0 160 Q 360 80, 720 140 T 1440 100" strokeDasharray="3 4" />
        <path d="M 0 220 Q 400 160, 720 200 T 1440 160" />
        <path d="M 0 300 Q 320 260, 720 280 T 1440 240" strokeDasharray="4 6" />
      </svg>

      {/* ── SAVANNAH GOLD AMBIENT RADIANCE (M-TRAVEL SIGNATURE GOLD) ── */}
      <div 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full bg-gradient-to-b from-amber-300/20 via-amber-200/10 to-transparent blur-3xl opacity-75 will-change-transform"
      />

      {/* ── KENYAN EMERALD OASIS ACCENT ORB ── */}
      <div 
        className="absolute top-[28%] right-[-5%] w-[480px] h-[480px] rounded-full bg-emerald-300/15 blur-3xl opacity-50 will-change-transform"
      />

      {/* ── GROUNDING CHAMPAGNE IVORY WARMTH ── */}
      <div 
        className="absolute bottom-[-5%] left-[-5%] w-[520px] h-[420px] rounded-full bg-amber-200/15 blur-3xl opacity-60 will-change-transform"
      />
    </div>
  );
}
