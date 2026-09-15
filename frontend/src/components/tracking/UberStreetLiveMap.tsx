import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronRight } from 'lucide-react';

interface UberStreetLiveMapProps {
  plateNumber?: string;
  vehicleModel?: string;
  speed?: number;
  progress?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  etaMinutes?: number;
}

export const UberStreetLiveMap: React.FC<UberStreetLiveMapProps> = ({
  plateNumber = 'KDA 182X',
  vehicleModel = 'Jeep Wrangler Rubicon',
  progress = 45,
  pickupLocation = 'Nelleon Center Kenyatta Ave',
  dropoffLocation = 'Maasai Mara National Reserve',
  etaMinutes = 3,
}) => {
  const [, setZoom] = useState(1);
  const [localProgress, setLocalProgress] = useState(progress);

  // Smooth live driving animation along SVG road path
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalProgress((prev) => (prev >= 98 ? 5 : prev + 0.8));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute position along the S-curve route (like Ruiru - Juja - Thika / Nairobi A2)
  // Bezier curve points matching user screenshot
  const t = localProgress / 100;
  // Route points: Start (bottom-left [80, 280]), P1 [140, 240], P2 [210, 180], P3 [320, 150], End (top-right [460, 60])
  const getRoutePoint = (progressT: number) => {
    // 4-point cubic bezier calculation
    const p0 = { x: 70, y: 280 };
    const p1 = { x: 190, y: 200 };
    const p2 = { x: 300, y: 160 };
    const p3 = { x: 470, y: 55 };

    const u = 1 - progressT;
    const tt = progressT * progressT;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * progressT;

    const x = uuu * p0.x + 3 * uu * progressT * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * progressT * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    // Angle/heading calculation for car rotation
    const dt = 0.02;
    const nextT = Math.min(1, progressT + dt);
    const uNext = 1 - nextT;
    const nextX = (uNext*uNext*uNext) * p0.x + 3 * (uNext*uNext) * nextT * p1.x + 3 * uNext * (nextT*nextT) * p2.x + (nextT*nextT*nextT) * p3.x;
    const nextY = (uNext*uNext*uNext) * p0.y + 3 * (uNext*uNext) * nextT * p1.y + 3 * uNext * (nextT*nextT) * p2.y + (nextT*nextT*nextT) * p3.y;

    const angle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);

    return { x, y, angle };
  };

  const carPoint = getRoutePoint(t);

  return (
    <div className="relative w-full h-80 sm:h-96 overflow-hidden rounded-3xl border border-slate-300 bg-[#e5e9ec] shadow-inner select-none font-sans">
      {/* 1. LIGHT GOOGLE/UBER MAP BACKGROUND TILES */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 340" preserveAspectRatio="xMidYMid slice">
        {/* Land Background */}
        <rect width="600" height="340" fill="#e8ecef" />

        {/* Rivers / Lakes (Light Blue) */}
        <path d="M 0,110 Q 120,130 180,80 T 360,60 T 600,10" fill="none" stroke="#bfe3f7" strokeWidth="12" opacity="0.8" />
        <path d="M 330,120 Q 360,200 420,260 T 560,340" fill="none" stroke="#cfe8fc" strokeWidth="8" opacity="0.7" />

        {/* Region Borders & Secondary Roads (Thin gray / blue lines) */}
        <g stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" fill="none">
          <path d="M 50,0 C 120,90 200,80 320,0" />
          <path d="M 280,340 C 350,220 480,180 600,160" />
          <path d="M 0,220 C 140,240 220,320 280,340" />
        </g>

        <g stroke="#ffffff" strokeWidth="3" fill="none">
          {/* Secondary streets */}
          <path d="M 0,60 L 260,60 L 320,180 L 600,240" />
          <path d="M 120,340 L 160,200 L 420,140 L 600,80" />
          <path d="M 20,300 L 300,100 L 500,20" />
          <path d="M 240,0 L 220,140 L 380,340" />
        </g>

        {/* Towns / Landmark Labels */}
        <g fill="#64748b" fontSize="10" fontWeight="600" fontFamily="sans-serif">
          <text x="32" y="45">Gatundu</text>
          <text x="140" y="24">Kereita</text>
          <text x="40" y="98">Ngenda</text>
          <text x="50" y="235">Kahawa</text>
          <text x="52" y="250" fontSize="8" fill="#94a3b8">KAHAWA SUKARI</text>
          <text x="110" y="210" fontSize="13" fontWeight="bold" fill="#334155">Ruiru</text>
          <text x="230" y="165" fontSize="11" fontWeight="bold" fill="#334155">Juja</text>
          <text x="210" y="180" fontSize="9" fill="#64748b">Kalimoni</text>
          <text x="450" y="65" fontSize="12" fontWeight="bold" fill="#334155">Thika</text>
          <text x="380" y="220" fill="#94a3b8">Juga</text>
          <text x="340" y="280" fill="#94a3b8">Kamulu</text>
          <text x="480" y="105" fontSize="8" letterSpacing="1" fill="#94a3b8">KIAMBU COUNTY</text>
          <text x="470" y="175" fontSize="8" letterSpacing="1" fill="#94a3b8" transform="rotate(-50 470,175)">MACHAKOS COUNTY</text>
        </g>

        {/* Highway Badges [A2], [C66], [A3] */}
        <g fontSize="7" fontWeight="bold" textAnchor="middle">
          {/* C66 Badge */}
          <rect x="74" y="18" width="18" height="11" rx="2" fill="#71a858" />
          <text x="83" y="26" fill="#fff">C66</text>

          {/* C65 Badge */}
          <rect x="25" y="152" width="18" height="11" rx="2" fill="#71a858" />
          <text x="34" y="160" fill="#fff">C65</text>

          {/* C63 Badge */}
          <rect x="88" y="210" width="18" height="11" rx="2" fill="#71a858" />
          <text x="97" y="218" fill="#fff">C63</text>

          {/* A2 Highway Badge */}
          <rect x="215" y="145" width="16" height="11" rx="2" fill="#65a30d" />
          <text x="223" y="153" fill="#fff">A2</text>

          <rect x="58" y="278" width="16" height="11" rx="2" fill="#65a30d" />
          <text x="66" y="286" fill="#fff">A2</text>

          {/* A3 Badge */}
          <rect x="282" y="100" width="16" height="11" rx="2" fill="#65a30d" />
          <text x="290" y="108" fill="#fff">A3</text>

          <rect x="345" y="112" width="16" height="11" rx="2" fill="#65a30d" />
          <text x="353" y="120" fill="#fff">A3</text>
        </g>

        {/* 2. THE MAIN UBER BLACK ROUTE POLYLINE */}
        {/* Outer casing */}
        <path
          d="M 40,310 L 70,280 Q 130,230 190,200 T 300,160 T 470,55 L 490,40"
          fill="none"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow / Core */}
        <path
          d="M 40,310 L 70,280 Q 130,230 190,200 T 300,160 T 470,55 L 490,40"
          fill="none"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Start Point Pin (Black Square like Uber) */}
        <rect x="36" y="306" width="9" height="9" fill="#000000" />

        {/* End Destination Pin (Flag/Dot) */}
        <circle cx="490" cy="40" r="5" fill="#000000" />
        <circle cx="490" cy="40" r="2.5" fill="#ffffff" />
      </svg>

      {/* 3. UBER FLOATING SPEECH BUBBLE BADGES */}

      {/* TOP FLOATING BADGE (VEHICLE / DRIVER ETA) */}
      <div
        className="absolute z-20 transition-all duration-700 ease-linear pointer-events-auto"
        style={{
          left: `${Math.min(68, Math.max(5, (carPoint.x / 600) * 100 - 15))}%`,
          top: `${Math.min(65, Math.max(8, (carPoint.y / 340) * 100 - 18))}%`,
        }}
      >
        <div className="flex items-stretch rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden text-xs cursor-pointer hover:shadow-2xl transition">
          {/* Black ETA square */}
          <div className="bg-black text-white font-black px-3 py-2 flex flex-col items-center justify-center leading-tight">
            <span className="text-base">{etaMinutes}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold">min</span>
          </div>

          {/* From Location text */}
          <div className="px-3 py-2 flex items-center justify-between gap-2 max-w-[190px]">
            <div className="truncate">
              <span className="block text-[11px] font-bold text-slate-900 leading-snug truncate">
                From {pickupLocation}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">
                {vehicleModel} • {plateNumber}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* SPEECH BUBBLE POINTER */}
        <div className="w-3 h-3 bg-white border-r border-b border-slate-200 transform rotate-45 mx-auto -mt-1.5 shadow-sm" />
      </div>

      {/* BOTTOM-LEFT FLOATING DESTINATION BADGE */}
      <div className="absolute bottom-5 left-4 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl bg-white shadow-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 hover:shadow-xl transition">
          <span className="truncate max-w-[200px]">To {dropoffLocation}</span>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* 4. REALISTIC TOP-DOWN MOVING UBER CAR SPRITE */}
      <div
        className="absolute z-10 transition-all duration-700 ease-linear pointer-events-none"
        style={{
          left: `${(carPoint.x / 600) * 100}%`,
          top: `${(carPoint.y / 340) * 100}%`,
          transform: `translate(-50%, -50%) rotate(${carPoint.angle}deg)`,
        }}
      >
        {/* Top-Down Vehicle Render */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Car shadow */}
          <div className="absolute w-12 h-6 bg-black/35 rounded-full filter blur-[2px] transform translate-y-1" />

          {/* Top-down SUV Body */}
          <div className="relative w-11 h-6 bg-slate-900 rounded-md border border-slate-700 shadow-md flex items-center justify-between px-1">
            {/* Windshield */}
            <div className="w-2.5 h-4 bg-sky-300/80 rounded-sm" />
            {/* Roof */}
            <div className="w-4 h-3 bg-slate-800 rounded-sm flex items-center justify-center">
              <div className="w-2 h-0.5 bg-amber-400 rounded-full" />
            </div>
            {/* Rear window */}
            <div className="w-2 h-4 bg-sky-400/80 rounded-sm" />
          </div>

          {/* Active GPS pulse dot */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white" />
          </span>
        </div>
      </div>

      {/* 5. GOOGLE MAPS CONTROLS (+ / - / Layers) */}
      <div className="absolute bottom-5 right-4 z-20 flex flex-col gap-1.5 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden text-slate-700">
        <button
          onClick={() => setZoom(z => Math.min(3, z + 0.2))}
          className="p-2.5 hover:bg-slate-100 transition border-b border-slate-100"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.8, z - 0.2))}
          className="p-2.5 hover:bg-slate-100 transition"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* 6. GOOGLE / MAP DATA WATERMARK FOOTER */}
      <div className="absolute bottom-1.5 left-4 right-16 flex items-center justify-between text-[9px] text-slate-400 font-sans pointer-events-none">
        <span className="font-bold text-slate-600 text-xs">Google</span>
        <div className="hidden sm:flex items-center gap-3">
          <span>Keyboard shortcuts</span>
          <span>Map Data ©2026</span>
          <span>Terms</span>
          <span>Report a map error</span>
        </div>
      </div>
    </div>
  );
};
