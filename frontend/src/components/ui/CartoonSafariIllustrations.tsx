import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

/**
 * M-TRAVEL BRAND ORANGE PALETTE SYSTEM:
 * Primary System Orange: #EA580C / #F97316 / #F59E0B / #D97706
 * Safari Gold Accents: #FBBF24 / #FCD34D / #FEF3C7
 * Deep Terracotta Shadows: #C2410C / #9A3412 / #7C2D12 / #78350F
 * Warm Skin Highlights: #FFEDD5 / #FED7AA / #FDBA74
 * All illustrations strictly follow M-Travel's luxury warm orange aesthetic.
 */

/**
 * 1. PEEKING SAFARI EXPLORER (SYSTEM ORANGE EDITION)
 * Excited cartoon traveler wearing the M-Travel orange explorer hat.
 * Designed to fit comfortably in headers or cards without ANY text overlap.
 */
export const PeekingExplorerIllustration: React.FC<IllustrationProps & { bubbleText?: string }> = ({
  className = '',
  bubbleText = "Jambo! We're here to help!"
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble in System Orange Theme */}
      {bubbleText && (
        <div className="mb-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-400 rounded-full shadow-sm text-xs font-black text-amber-950 tracking-wide flex items-center gap-1.5 z-20">
          <span className="text-orange-500 font-bold">✨</span>
          <span>{bubbleText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-50 border-r-2 border-b-2 border-orange-400 rotate-45" />
        </div>
      )}

      {/* SVG Cartoon Peeking Character in Orange System Tones */}
      <svg
        viewBox="0 0 280 180"
        className="w-40 sm:w-48 h-auto drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Excitement Orange Sparkles */}
        <g className="animate-pulse">
          <path d="M 45 45 L 48 55 L 58 58 L 48 61 L 45 71 L 42 61 L 32 58 L 42 55 Z" fill="#F59E0B" />
          <path d="M 235 40 L 237 47 L 244 49 L 237 51 L 235 58 L 233 51 L 226 49 L 233 47 Z" fill="#EA580C" />
          <path d="M 68 28 L 56 18" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
          <path d="M 212 28 L 224 18" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Safari Shirt in M-Travel Orange */}
        <path
          d="M 75 165 C 80 135, 200 135, 205 165 L 210 180 L 70 180 Z"
          fill="#EA580C"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Shirt Collar */}
        <path d="M 120 140 L 140 156 L 126 168 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="2.5" />
        <path d="M 160 140 L 140 156 L 154 168 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="2.5" />
        {/* Bandana in Deep Terracotta Orange */}
        <path d="M 132 142 L 148 142 L 140 155 Z" fill="#9A3412" stroke="#7C2D12" strokeWidth="2" />

        {/* Neck */}
        <rect x="126" y="122" width="28" height="22" rx="4" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />

        {/* Ears */}
        <circle cx="92" cy="108" r="11" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />
        <circle cx="188" cy="108" r="11" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />

        {/* Face Base */}
        <path
          d="M 94 92 C 94 142, 186 142, 186 92 Z"
          fill="#FED7AA"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Cheeks in Warm Peach/Orange */}
        <circle cx="112" cy="115" r="9" fill="#FB923C" opacity="0.5" />
        <circle cx="168" cy="115" r="9" fill="#FB923C" opacity="0.5" />

        {/* Eyes */}
        <ellipse cx="120" cy="104" rx="7.5" ry="9" fill="#431407" />
        <ellipse cx="160" cy="104" rx="7.5" ry="9" fill="#431407" />
        <circle cx="122.5" cy="101.5" r="2.8" fill="#FFFFFF" />
        <circle cx="162.5" cy="101.5" r="2.8" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M 111 88 Q 120 83 129 88" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M 151 88 Q 160 83 169 88" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        {/* Nose */}
        <path d="M 137 107 Q 140 112 143 107" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Smile */}
        <path
          d="M 121 118 Q 140 143 159 118 Z"
          fill="#9A3412"
          stroke="#7C2D12"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M 124 119 Q 140 126 156 119 Q 140 121 124 119" fill="#FFFFFF" />
        <ellipse cx="140" cy="132" rx="8" ry="4.5" fill="#F97316" />

        {/* ── SAFARI EXPLORER HAT (ORANGE & GOLD PALETTE) ── */}
        <path
          d="M 88 84 C 88 32, 192 32, 192 84 Z"
          fill="#F59E0B"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <ellipse cx="140" cy="35" rx="9" ry="4" fill="#D97706" stroke="#7C2D12" strokeWidth="2.5" />
        <path d="M 140 37 Q 140 60 140 76" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

        {/* Dark Terracotta Hatband */}
        <path
          d="M 89 74 C 110 77, 170 77, 191 74 L 192 85 C 170 88, 110 88, 88 85 Z"
          fill="#7C2D12"
          stroke="#431407"
          strokeWidth="2.5"
        />
        {/* Golden Buckle */}
        <rect x="133" y="73" width="14" height="13" rx="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
        <rect x="137" y="76" width="6" height="7" rx="1" fill="#7C2D12" />

        {/* Wide Explorer Hat Brim */}
        <path
          d="M 52 86 C 52 74, 228 74, 228 86 C 238 98, 42 98, 52 86 Z"
          fill="#D97706"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M 56 88 C 90 95, 190 95, 224 88" stroke="#B45309" strokeWidth="2" fill="none" />

        {/* ── HANDS (WARM PEACH/ORANGE KNUCKLES) ── */}
        <g transform="translate(68, 150)">
          <path
            d="M 0 16 C 0 8, 8 0, 18 0 C 28 0, 36 8, 36 16 L 36 28 L 0 28 Z"
            fill="#FED7AA"
            stroke="#7C2D12"
            strokeWidth="3"
          />
          <line x1="9" y1="8" x2="9" y2="20" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="6" x2="18" y2="20" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          <line x1="27" y1="8" x2="27" y2="20" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(176, 150)">
          <path
            d="M 0 16 C 0 8, 8 0, 18 0 C 28 0, 36 8, 36 16 L 36 28 L 0 28 Z"
            fill="#FED7AA"
            stroke="#7C2D12"
            strokeWidth="3"
          />
          <line x1="9" y1="8" x2="9" y2="20" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="6" x2="18" y2="20" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          <line x1="27" y1="8" x2="27" y2="20" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 2. SATISFIED CARTOON EXPLORER (SYSTEM ORANGE EDITION)
 * Indicating 100% satisfaction in M-Travel's signature orange/amber theme.
 */
export const SatisfiedExplorerIllustration: React.FC<IllustrationProps> = ({
  className = ''
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-44 sm:w-52 h-auto drop-shadow-lg overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow Sparkles */}
        <g className="animate-spin-slow origin-[120px_100px]">
          <circle cx="30" cy="50" r="3.5" fill="#F59E0B" />
          <circle cx="210" cy="70" r="4.5" fill="#EA580C" />
          <circle cx="25" cy="180" r="3.5" fill="#F59E0B" />
          <circle cx="215" cy="190" r="3.5" fill="#F97316" />
        </g>

        {/* Backpack Straps */}
        <path d="M 65 170 Q 55 210 65 260" stroke="#7C2D12" strokeWidth="12" strokeLinecap="round" />
        <path d="M 175 170 Q 185 210 175 260" stroke="#7C2D12" strokeWidth="12" strokeLinecap="round" />

        {/* Safari Vest in System Orange */}
        <path
          d="M 60 160 C 60 145, 180 145, 180 160 L 195 270 L 45 270 Z"
          fill="#EA580C"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Flap Pockets */}
        <rect x="65" y="195" width="30" height="28" rx="4" fill="#C2410C" stroke="#7C2D12" strokeWidth="2.5" />
        <circle cx="80" cy="202" r="3" fill="#FBBF24" stroke="#7C2D12" strokeWidth="1.5" />

        <rect x="145" y="195" width="30" height="28" rx="4" fill="#C2410C" stroke="#7C2D12" strokeWidth="2.5" />
        <circle cx="160" cy="202" r="3" fill="#FBBF24" stroke="#7C2D12" strokeWidth="1.5" />

        {/* Gold Certified Medal */}
        <circle cx="80" cy="165" r="10" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
        <path d="M 76 165 L 79 168 L 85 162" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Binoculars */}
        <g transform="translate(100, 165)">
          <path d="M -15 -25 Q 20 5 55 -25" stroke="#7C2D12" strokeWidth="3" fill="none" />
          <rect x="8" y="0" width="10" height="22" rx="3" fill="#7C2D12" stroke="#431407" strokeWidth="2" />
          <rect x="22" y="0" width="10" height="22" rx="3" fill="#7C2D12" stroke="#431407" strokeWidth="2" />
          <rect x="15" y="6" width="10" height="6" rx="1" fill="#9A3412" />
          <circle cx="13" cy="22" r="4.5" fill="#FBBF24" />
          <circle cx="27" cy="22" r="4.5" fill="#FBBF24" />
        </g>

        {/* Neck */}
        <rect x="108" y="120" width="24" height="24" rx="4" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />

        {/* Head */}
        <circle cx="120" cy="95" r="38" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3.5" />
        <circle cx="82" cy="98" r="9" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />
        <circle cx="158" cy="98" r="9" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />

        {/* Cheeks */}
        <circle cx="102" cy="106" r="7.5" fill="#FB923C" opacity="0.5" />
        <circle cx="138" cy="106" r="7.5" fill="#FB923C" opacity="0.5" />

        {/* Eyes (Happy closed smiling eyes) */}
        <path d="M 98 96 Q 106 88 114 96" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M 126 96 Q 134 88 142 96" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        {/* Eyebrows */}
        <path d="M 97 86 Q 106 81 115 86" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 125 86 Q 134 81 143 86" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Smile */}
        <path
          d="M 104 108 Q 120 130 136 108 Z"
          fill="#9A3412"
          stroke="#7C2D12"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M 106 109 Q 120 115 134 109 Q 120 111 106 109" fill="#FFFFFF" />
        <ellipse cx="120" cy="120" rx="6.5" ry="3.5" fill="#F97316" />

        {/* ── SAFARI EXPLORER HAT (ORANGE & GOLD) ── */}
        <path
          d="M 78 72 C 78 24, 162 24, 162 72 Z"
          fill="#F59E0B"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <ellipse cx="120" cy="27" rx="8" ry="3.5" fill="#D97706" stroke="#7C2D12" strokeWidth="2" />
        <path d="M 79 64 C 95 67, 145 67, 161 64 L 162 73 C 145 76, 95 76, 78 73 Z" fill="#7C2D12" stroke="#431407" strokeWidth="2" />
        <rect x="114" y="63" width="12" height="11" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
        <path
          d="M 48 74 C 48 64, 192 64, 192 74 C 200 84, 40 84, 48 74 Z"
          fill="#D97706"
          stroke="#7C2D12"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Thumbs Up Hand */}
        <g transform="translate(180, 160)">
          <path d="M -15 25 L 15 5 L 25 20 L -5 40 Z" fill="#EA580C" stroke="#7C2D12" strokeWidth="3" />
          <circle cx="24" cy="10" r="14" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />
          <path
            d="M 16 8 C 16 -12, 28 -12, 28 8 Z"
            fill="#FED7AA"
            stroke="#7C2D12"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="22" cy="-2" rx="3.5" ry="4" fill="#FFFFFF" opacity="0.6" />
          <path d="M 22 10 Q 32 12 30 18" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          <path d="M 18 16 Q 28 18 26 24" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Left Hand on Hip */}
        <g transform="translate(25, 175)">
          <path d="M 35 15 L 10 25 L 15 45 L 40 30 Z" fill="#EA580C" stroke="#7C2D12" strokeWidth="3" />
          <circle cx="10" cy="30" r="11" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 3. TROPICAL PALM TREE (SYSTEM ORANGE / AMBER EDITION)
 * Rendered in M-Travel's signature warm orange and golden sunset shades.
 * Zero green — 100% unified with the system brand color.
 */
export const PalmTreeCartoon: React.FC<IllustrationProps> = ({
  className = '',
  size = 180
}) => {
  return (
    <div className={`relative inline-block pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 160 220"
        style={{ width: size, height: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-sm"
      >
        {/* Ground Shadow */}
        <ellipse cx="80" cy="210" rx="30" ry="7" fill="#FED7AA" opacity="0.4" />

        {/* Segmented Amber-Orange Trunk */}
        <path
          d="M 75 210 Q 70 140 95 70 L 105 72 Q 80 140 85 210 Z"
          fill="#D97706"
          stroke="#78350F"
          strokeWidth="3"
        />
        <line x1="77" y1="185" x2="87" y2="187" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="76" y1="160" x2="86" y2="162" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="77" y1="135" x2="88" y2="137" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="81" y1="110" x2="92" y2="112" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="87" y1="88" x2="98" y2="90" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

        {/* Golden Orange Coconuts */}
        <circle cx="94" cy="74" r="7" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
        <circle cx="104" cy="76" r="6.5" fill="#EA580C" stroke="#78350F" strokeWidth="2" />
        <circle cx="98" cy="82" r="6" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />

        {/* ── TROPICAL PALM FRONDS IN SIGNATURE M-TRAVEL ORANGE ── */}
        {/* Left Bottom Frond */}
        <path
          d="M 98 70 C 60 70, 15 90, 5 125 C 25 110, 65 95, 98 70 Z"
          fill="#EA580C"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Left Top Frond */}
        <path
          d="M 98 70 C 60 40, 20 45, 10 75 C 30 65, 70 65, 98 70 Z"
          fill="#F59E0B"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Top Center Frond */}
        <path
          d="M 98 70 C 90 25, 98 5, 108 5 C 118 15, 115 45, 98 70 Z"
          fill="#FBBF24"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right Top Frond */}
        <path
          d="M 98 70 C 130 35, 160 45, 165 75 C 145 65, 120 65, 98 70 Z"
          fill="#F59E0B"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right Bottom Frond */}
        <path
          d="M 98 70 C 135 65, 175 90, 180 120 C 155 105, 125 95, 98 70 Z"
          fill="#EA580C"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/**
 * 4. SAVANNAH GRASS TUFT (SYSTEM ORANGE / GOLD EDITION)
 */
export const SavannahGrassTuft: React.FC<IllustrationProps> = ({
  className = '',
  size = 120
}) => {
  return (
    <div className={`relative inline-block pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 120 70"
        style={{ width: size, height: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 45 65 Q 20 40 10 20 Q 25 45 50 65 Z" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M 50 65 Q 35 25 30 5 Q 45 30 55 65 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M 55 65 Q 60 15 62 2 Q 68 20 62 65 Z" fill="#FBBF24" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M 60 65 Q 75 25 88 8 Q 78 35 65 65 Z" fill="#F59E0B" stroke="#9A3412" strokeWidth="1.5" />
        <path d="M 65 65 Q 90 40 110 25 Q 90 48 70 65 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" />
        <circle cx="85" cy="38" r="3.5" fill="#FBBF24" />
      </svg>
    </div>
  );
};

/**
 * 5. CARTOON ACACIA UMBRELLA TREE (SYSTEM ORANGE EDITION)
 */
export const AcaciaTreeCartoon: React.FC<IllustrationProps> = ({
  className = '',
  size = 180
}) => {
  return (
    <div className={`relative inline-block pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 200 160"
        style={{ width: size, height: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="100" cy="155" rx="35" ry="5" fill="#FED7AA" opacity="0.4" />
        <path
          d="M 95 155 Q 92 110 85 85 Q 70 70 45 55 L 50 50 Q 80 68 93 80 Q 110 65 145 50 L 150 55 Q 120 72 103 85 Q 106 110 105 155 Z"
          fill="#9A3412"
          stroke="#78350F"
          strokeWidth="2.5"
        />
        {/* Tiered Canopy in Warm Amber-Orange */}
        <ellipse cx="45" cy="48" rx="36" ry="12" fill="#D97706" stroke="#78350F" strokeWidth="2" />
        <ellipse cx="48" cy="45" rx="26" ry="8" fill="#F59E0B" />
        <ellipse cx="100" cy="35" rx="55" ry="14" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
        <ellipse cx="100" cy="31" rx="42" ry="9" fill="#F59E0B" />
        <ellipse cx="152" cy="50" rx="38" ry="12" fill="#D97706" stroke="#78350F" strokeWidth="2" />
        <ellipse cx="150" cy="46" rx="28" ry="8" fill="#F59E0B" />
      </svg>
    </div>
  );
};

/**
 * 6. HERO CARTOON SAFARI EXPLORER (SYSTEM ORANGE EDITION)
 */
export const HeroCartoonExplorer: React.FC<IllustrationProps> = ({
  className = '',
  size = 220
}) => {
  return (
    <div className={`relative inline-flex items-end justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 200 250"
        style={{ width: size, height: 'auto' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-md"
      >
        <ellipse cx="100" cy="242" rx="45" ry="8" fill="#FED7AA" opacity="0.5" />

        {/* Legs & Safari Boots */}
        <rect x="78" y="180" width="16" height="50" rx="4" fill="#EA580C" stroke="#7C2D12" strokeWidth="2.5" />
        <rect x="106" y="180" width="16" height="50" rx="4" fill="#EA580C" stroke="#7C2D12" strokeWidth="2.5" />
        <path d="M 72 230 L 96 230 L 98 245 L 68 245 Z" fill="#78350F" stroke="#431407" strokeWidth="2.5" />
        <path d="M 104 230 L 128 230 L 132 245 L 102 245 Z" fill="#78350F" stroke="#431407" strokeWidth="2.5" />

        {/* Shorts */}
        <path d="M 72 155 L 128 155 L 128 190 L 102 190 L 100 170 L 98 190 L 72 190 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="3" />
        <rect x="71" y="153" width="58" height="8" rx="1.5" fill="#78350F" />
        <rect x="96" y="151" width="8" height="12" rx="1" fill="#FBBF24" />

        {/* Orange Shirt */}
        <path
          d="M 68 100 C 68 85, 132 85, 132 100 L 128 158 L 72 158 Z"
          fill="#EA580C"
          stroke="#7C2D12"
          strokeWidth="3"
        />

        {/* Bandana */}
        <path d="M 94 92 L 106 92 L 100 104 Z" fill="#9A3412" stroke="#7C2D12" strokeWidth="1.5" />

        {/* Binoculars */}
        <rect x="92" y="112" width="7" height="18" rx="2" fill="#78350F" stroke="#431407" strokeWidth="1.5" />
        <rect x="101" y="112" width="7" height="18" rx="2" fill="#78350F" stroke="#431407" strokeWidth="1.5" />
        <rect x="96" y="116" width="8" height="4" fill="#B45309" />

        {/* Head */}
        <rect x="93" y="80" width="14" height="16" rx="2" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2.5" />
        <circle cx="100" cy="65" r="25" fill="#FED7AA" stroke="#7C2D12" strokeWidth="3" />
        <circle cx="75" cy="66" r="6" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2" />
        <circle cx="125" cy="66" r="6" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2" />
        <circle cx="88" cy="72" r="5" fill="#FB923C" opacity="0.5" />
        <circle cx="112" cy="72" r="5" fill="#FB923C" opacity="0.5" />
        <circle cx="92" cy="65" r="4" fill="#431407" />
        <circle cx="108" cy="65" r="4" fill="#431407" />
        <circle cx="93.5" cy="63.5" r="1.5" fill="#FFFFFF" />
        <circle cx="109.5" cy="63.5" r="1.5" fill="#FFFFFF" />
        <path d="M 94 74 Q 100 81 106 74" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Explorer Hat */}
        <path
          d="M 72 50 C 72 16, 128 16, 128 50 Z"
          fill="#F59E0B"
          stroke="#7C2D12"
          strokeWidth="3"
        />
        <ellipse cx="100" cy="18" rx="6" ry="2.5" fill="#D97706" stroke="#7C2D12" strokeWidth="1.5" />
        <path d="M 73 44 C 84 46, 116 46, 127 44 L 128 50 C 116 52, 84 52, 72 50 Z" fill="#78350F" stroke="#431407" strokeWidth="1.5" />
        <rect x="96" y="43" width="8" height="7" rx="1" fill="#FBBF24" />
        <path
          d="M 52 52 C 52 44, 148 44, 148 52 C 154 60, 46 60, 52 52 Z"
          fill="#D97706"
          stroke="#7C2D12"
          strokeWidth="3"
        />

        {/* Left Arm */}
        <path d="M 70 102 L 50 120 L 58 135 L 72 125" fill="#EA580C" stroke="#7C2D12" strokeWidth="2.5" />
        <circle cx="58" cy="135" r="7" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2.5" />

        {/* Right Arm: Waving */}
        <path d="M 130 102 L 152 75 L 164 82 L 140 114" fill="#EA580C" stroke="#7C2D12" strokeWidth="2.5" />
        <g transform="translate(152, 60)">
          <circle cx="8" cy="10" r="9" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2.5" />
          <path d="M 2 4 C 2 -4, 14 -4, 14 4 Z" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2" />
          <path d="M 10 4 C 10 -6, 20 -6, 20 4 Z" fill="#FED7AA" stroke="#7C2D12" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};
