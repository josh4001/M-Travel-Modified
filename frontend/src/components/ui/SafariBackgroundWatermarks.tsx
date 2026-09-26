import React from 'react';

/**
 * M-TRAVEL Subtle Safari & Scenery Watermarks
 * -------------------------------------------
 * Non-intrusive, luxury vector silhouettes designed to evoke the African savannah,
 * wildlife (lions, elephants), safari 4x4 cruisers, and tropical coastal palm trees.
 * 
 * All elements strictly enforce:
 * - pointer-events-none (cannot block clicks or selection)
 * - select-none
 * - Low-opacity monochrome slate / charcoal / warm gold tones
 * - Responsive vector scaling
 */

interface WatermarkProps {
  className?: string;
  opacity?: string;
}

/**
 * Acacia Tree & Distant Savannah Horizon Silhouette
 */
export const SavannahHeroWatermark: React.FC<WatermarkProps> = ({
  className = '',
  opacity = 'opacity-[0.06] md:opacity-[0.08]'
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${opacity} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover text-slate-800"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Soft atmospheric gradient */}
        <defs>
          <linearGradient id="savannahSun" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="horizonFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Distant Mount Kilimanjaro silhouette dome */}
        <path
          d="M 650 320 Q 820 180 990 320 L 1150 420 L 520 420 Z"
          fill="currentColor"
          opacity="0.3"
        />
        {/* Snowcap highlight */}
        <path
          d="M 780 230 Q 820 200 860 230 Q 840 245 820 240 Z"
          fill="white"
          opacity="0.25"
        />

        {/* Rolling Savannah Hills */}
        <path
          d="M 0 460 Q 320 400 700 450 T 1440 430 L 1440 600 L 0 600 Z"
          fill="currentColor"
          opacity="0.4"
        />
        <path
          d="M 0 500 Q 420 460 900 510 T 1440 490 L 1440 600 L 0 600 Z"
          fill="currentColor"
          opacity="0.6"
        />

        {/* Iconic African Acacia Tree (Right Side) */}
        <g transform="translate(1080, 240) scale(0.9)" opacity="0.85">
          {/* Main Trunk & Branches */}
          <path
            d="M 120 220 Q 115 160 110 110 Q 90 85 50 65 Q 90 90 112 110 Q 130 90 170 60 Q 130 95 125 120 L 120 220 Z"
            fill="currentColor"
          />
          <path d="M 110 110 Q 60 70 20 55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M 115 125 Q 160 85 210 65" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <path d="M 112 140 Q 140 115 180 100" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          {/* Layered Umbrella Foliage */}
          <ellipse cx="20" cy="50" rx="35" ry="9" fill="currentColor" />
          <ellipse cx="50" cy="58" rx="42" ry="11" fill="currentColor" />
          <ellipse cx="105" cy="48" rx="55" ry="12" fill="currentColor" />
          <ellipse cx="165" cy="54" rx="48" ry="10" fill="currentColor" />
          <ellipse cx="210" cy="62" rx="38" ry="8" fill="currentColor" />
          <ellipse cx="110" cy="35" rx="65" ry="13" fill="currentColor" />
        </g>

        {/* Distant Acacia Tree (Left Side) */}
        <g transform="translate(140, 360) scale(0.55)" opacity="0.65">
          <path
            d="M 120 220 Q 115 160 110 110 Q 90 85 50 65 Q 90 90 112 110 Q 130 90 170 60 Q 130 95 125 120 L 120 220 Z"
            fill="currentColor"
          />
          <ellipse cx="30" cy="55" rx="40" ry="10" fill="currentColor" />
          <ellipse cx="110" cy="40" rx="65" ry="14" fill="currentColor" />
          <ellipse cx="190" cy="58" rx="45" ry="9" fill="currentColor" />
        </g>

        {/* Small Elephant Herd Silhouette Walking on Horizon */}
        <g transform="translate(480, 435) scale(0.28)" opacity="0.75" fill="currentColor">
          {/* Lead Big Bull Elephant */}
          <path d="M 40 40 Q 35 15 65 10 Q 95 5 110 30 Q 120 25 130 35 L 140 30 L 142 55 L 135 60 Q 130 80 120 110 L 105 110 L 105 75 L 85 75 L 80 110 L 65 110 L 70 70 Q 50 70 45 60 L 40 110 L 25 110 L 30 50 Z" />
          {/* Tusk */}
          <path d="M 135 55 Q 150 65 145 75 Q 140 70 135 60 Z" fill="white" opacity="0.3" />
          {/* Mother Elephant */}
          <g transform="translate(150, 8) scale(0.85)">
            <path d="M 40 40 Q 35 15 65 10 Q 95 5 110 30 Q 120 25 130 35 L 140 30 L 142 55 L 135 60 Q 130 80 120 110 L 105 110 L 105 75 L 85 75 L 80 110 L 65 110 L 70 70 Q 50 70 45 60 L 40 110 L 25 110 L 30 50 Z" />
          </g>
          {/* Baby Calf */}
          <g transform="translate(270, 35) scale(0.55)">
            <path d="M 40 40 Q 35 15 65 10 Q 95 5 110 30 Q 120 25 130 35 L 140 30 L 142 55 L 135 60 Q 130 80 120 110 L 105 110 L 105 75 L 85 75 L 80 110 L 65 110 L 70 70 Q 50 70 45 60 L 40 110 L 25 110 L 30 50 Z" />
          </g>
        </g>

        {/* Flying Safari Birds / Eagles in V-Formation */}
        <g opacity="0.5" stroke="currentColor" strokeWidth="2.5" fill="none">
          <path d="M 320 180 Q 328 172 336 180 Q 344 172 352 180" />
          <path d="M 355 195 Q 361 189 367 195 Q 373 189 379 195" />
          <path d="M 380 175 Q 386 169 392 175 Q 398 169 404 175" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Tropical Coastal Palm Tree Silhouette Watermark (Diani Beach & Coast tours)
 */
export const PalmFrondsWatermark: React.FC<WatermarkProps> = ({
  className = '',
  opacity = 'opacity-[0.05] md:opacity-[0.07]'
}) => {
  return (
    <div
      className={`absolute pointer-events-none select-none overflow-hidden ${opacity} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 400"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-800"
      >
        {/* Palm tree curved trunk */}
        <path d="M -20 420 Q 80 260 140 140 Q 150 145 135 270 Q 75 380 -10 420 Z" />
        {/* Tropical Palm Fronds Fan */}
        <g transform="translate(140, 140)">
          {/* Leaf 1 */}
          <path d="M 0 0 Q 80 -60 180 -40 Q 130 0 0 0 Z" />
          {/* Leaf 2 */}
          <path d="M 0 0 Q 120 -20 220 30 Q 140 45 0 0 Z" />
          {/* Leaf 3 */}
          <path d="M 0 0 Q 100 40 190 120 Q 120 110 0 0 Z" />
          {/* Leaf 4 */}
          <path d="M 0 0 Q 40 80 110 180 Q 60 140 0 0 Z" />
          {/* Leaf 5 */}
          <path d="M 0 0 Q -30 -80 30 -160 Q 20 -90 0 0 Z" />
          {/* Leaf 6 */}
          <path d="M 0 0 Q -80 -40 -150 -70 Q -90 -20 0 0 Z" />
          {/* Leaf 7 */}
          <path d="M 0 0 Q -100 10 -180 20 Q -110 30 0 0 Z" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Majestic African Lion Profile Watermark (King of the Maasai Mara)
 */
export const LionWatermark: React.FC<WatermarkProps> = ({
  className = '',
  opacity = 'opacity-[0.05] md:opacity-[0.07]'
}) => {
  return (
    <div
      className={`absolute pointer-events-none select-none overflow-hidden ${opacity} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 320 320"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-800"
      >
        {/* Majestic Lion Head & Flowing Mane Silhouette */}
        <path d="M 160 40 C 130 40 100 60 85 85 C 65 95 50 120 45 150 C 40 180 50 210 70 235 C 90 260 120 280 160 285 C 200 280 230 260 250 235 C 270 210 280 180 275 150 C 270 120 255 95 235 85 C 220 60 190 40 160 40 Z M 160 85 C 175 85 190 95 195 110 C 190 125 175 130 160 130 C 145 130 130 125 125 110 C 130 95 145 85 160 85 Z M 160 150 C 172 150 182 160 180 175 L 175 200 C 170 215 150 215 145 200 L 140 175 C 138 160 148 150 160 150 Z" />
        {/* Whiskers & Muzzle Contours */}
        <circle cx="160" cy="180" r="14" fill="white" opacity="0.1" />
      </svg>
    </div>
  );
};

/**
 * Rugged 4x4 Safari Land Cruiser Silhouette Watermark
 */
export const SafariCruiserWatermark: React.FC<WatermarkProps> = ({
  className = '',
  opacity = 'opacity-[0.05] md:opacity-[0.07]'
}) => {
  return (
    <div
      className={`absolute pointer-events-none select-none overflow-hidden ${opacity} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 240"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-800"
      >
        {/* Safari Land Cruiser with Pop-Up Game Viewing Roof */}
        {/* Pop-up Roof Canopy */}
        <path d="M 160 30 L 330 30 L 340 45 L 150 45 Z" />
        {/* Roof Pillars */}
        <rect x="175" y="45" width="8" height="25" />
        <rect x="245" y="45" width="8" height="25" />
        <rect x="315" y="45" width="8" height="25" />
        
        {/* Vehicle Body Cabin */}
        <path d="M 120 70 L 360 70 L 410 115 L 470 125 L 475 160 L 440 165 C 440 150 405 150 405 165 L 180 165 C 180 150 145 150 145 165 L 75 165 L 75 110 L 120 70 Z" />
        
        {/* Front Snorkel & Bullbar */}
        <path d="M 405 85 L 400 130 L 410 130 L 413 85 Z" />
        <path d="M 475 130 L 490 135 L 490 165 L 475 165 Z" />

        {/* Wheels (Big All-Terrain Off-Road Tires) */}
        <circle cx="162" cy="165" r="38" />
        <circle cx="162" cy="165" r="22" fill="white" opacity="0.2" />
        <circle cx="162" cy="165" r="10" fill="currentColor" />

        <circle cx="422" cy="165" r="38" />
        <circle cx="422" cy="165" r="22" fill="white" opacity="0.2" />
        <circle cx="422" cy="165" r="10" fill="currentColor" />

        {/* Spare Tire on Rear Door */}
        <path d="M 60 95 Q 50 135 60 150 L 75 150 L 75 95 Z" />

        {/* Ground Terrain / Track Shadow */}
        <ellipse cx="250" cy="205" rx="220" ry="8" opacity="0.4" />
      </svg>
    </div>
  );
};
