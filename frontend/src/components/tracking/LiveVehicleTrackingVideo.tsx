import React, { useState, useEffect, useRef } from 'react';
import {
  Compass, Play, Pause, Sun, Moon, Gauge
} from 'lucide-react';

interface LiveVehicleTrackingVideoProps {
  vehicleModel?: string;
  plateNumber?: string;
  speed?: number;
  progress?: number;
  pickup?: string;
  destination?: string;
  driverName?: string;
}

export const LiveVehicleTrackingVideo: React.FC<LiveVehicleTrackingVideoProps> = ({
  plateNumber = 'KDA 789X',
  speed = 68,
  progress = 42,
  driverName = 'James Mwangi',
}) => {
  const [viewMode, setViewMode] = useState<'3d_drive' | 'satellite_radar' | 'ai_dashcam'>('3d_drive');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isNight, setIsNight] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 60FPS Parallax 3D Highway Canvas Driving Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    let carBob = 0;

    const render = () => {
      if (isPlaying) {
        offset += (speed || 65) * 0.12;
        carBob = Math.sin(Date.now() * 0.008) * 2;
      }

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (viewMode === '3d_drive') {
        // 1. SKY GRADIENT (Sunset / Day / Night)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        if (isNight) {
          skyGrad.addColorStop(0, '#020617');
          skyGrad.addColorStop(1, '#0f172a');
        } else {
          skyGrad.addColorStop(0, '#0c4a6e');
          skyGrad.addColorStop(0.5, '#ea580c');
          skyGrad.addColorStop(1, '#fde047');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.55);

        // Sun / Moon
        ctx.save();
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.22, isNight ? 18 : 26, 0, Math.PI * 2);
        ctx.fillStyle = isNight ? '#e2e8f0' : '#ffedd5';
        ctx.shadowColor = isNight ? '#94a3b8' : '#f97316';
        ctx.shadowBlur = isNight ? 15 : 35;
        ctx.fill();
        ctx.restore();

        // Distant Mountains silhouette
        ctx.fillStyle = isNight ? '#090d16' : '#451a03';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.55);
        ctx.lineTo(w * 0.2, h * 0.35);
        ctx.lineTo(w * 0.35, h * 0.42);
        ctx.lineTo(w * 0.55, h * 0.28);
        ctx.lineTo(w * 0.75, h * 0.48);
        ctx.lineTo(w * 0.9, h * 0.38);
        ctx.lineTo(w, h * 0.55);
        ctx.closePath();
        ctx.fill();

        // Savannah Ground
        const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
        groundGrad.addColorStop(0, isNight ? '#091317' : '#713f12');
        groundGrad.addColorStop(1, isNight ? '#030712' : '#292524');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);

        // Distant Acacia Trees
        for (let i = 0; i < 4; i++) {
          const treeX = ((i * 240 - (offset * 0.15)) % (w + 100) + (w + 100)) % (w + 100) - 50;
          ctx.fillStyle = isNight ? '#030712' : '#291807';
          ctx.fillRect(treeX + 18, h * 0.45, 4, 30);
          ctx.beginPath();
          ctx.ellipse(treeX + 20, h * 0.45, 24, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. 3D HIGHWAY PERSPECTIVE
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(w * 0.48, h * 0.55);
        ctx.lineTo(w * 0.52, h * 0.55);
        ctx.lineTo(w * 0.95, h);
        ctx.lineTo(w * 0.05, h);
        ctx.closePath();
        ctx.fill();

        // Borders
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.48, h * 0.55);
        ctx.lineTo(w * 0.05, h);
        ctx.moveTo(w * 0.52, h * 0.55);
        ctx.lineTo(w * 0.95, h);
        ctx.stroke();

        // Moving Center Dashes
        for (let i = 0; i < 8; i++) {
          const progressY = ((i * 45 + (offset * 1.5)) % 300) / 300;
          if (progressY < 0.05) continue;
          const lineY = h * 0.55 + Math.pow(progressY, 2) * (h * 0.45);
          const lineW = 2 + progressY * 12;
          const lineH = 4 + progressY * 35;
          const lineX = w * 0.5 - lineW / 2;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(lineX, lineY, lineW, lineH);
        }

        // 3. ANIMATED 4x4 SAFARI SUV VEHICLE
        const carX = w * 0.5;
        const carY = h * 0.78 + carBob;
        const carScale = 1.05;

        ctx.save();
        ctx.translate(carX, carY);
        ctx.scale(carScale, carScale);

        // Headlight Beams projected onto road
        const lightGrad = ctx.createLinearGradient(0, 0, 0, 140);
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(-35, 10);
        ctx.lineTo(-75, 120);
        ctx.lineTo(75, 120);
        ctx.lineTo(35, 10);
        ctx.closePath();
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 28, 55, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rear Bumper & Main Body (Safari Emerald)
        ctx.fillStyle = '#0f766e';
        ctx.beginPath();
        ctx.roundRect(-42, -22, 84, 44, 8);
        ctx.fill();
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cabin & Roof
        ctx.fillStyle = '#042f2e';
        ctx.beginPath();
        ctx.roundRect(-34, -42, 68, 24, 6);
        ctx.fill();

        // Rear Windshield
        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.roundRect(-28, -38, 56, 16, 4);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Roof Safari Rack with Extra Tire
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.strokeRect(-32, -48, 64, 6);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-8, -48, 7, 0, Math.PI * 2);
        ctx.fill();

        // Tail Lights (Active Glow)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 12;
        ctx.fillRect(-38, -6, 12, 8);
        ctx.fillRect(26, -6, 12, 8);
        ctx.shadowBlur = 0;

        // Kenya License Plate
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-18, 6, 36, 10);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(plateNumber, 0, 14);

        // Tires Left & Right
        ctx.fillStyle = '#020617';
        ctx.fillRect(-46, 0, 10, 24);
        ctx.fillRect(36, 0, 10, 24);

        // Chrome Snorkel
        ctx.fillStyle = '#64748b';
        ctx.fillRect(32, -44, 4, 28);
        ctx.beginPath();
        ctx.arc(34, -44, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

      } else if (viewMode === 'satellite_radar') {
        // SATELLITE RADAR VIEW
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, w, h);

        // Radar grid circles
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
        ctx.lineWidth = 1;
        for (let r = 40; r < w * 0.7; r += 40) {
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Radar sweep
        const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
        ctx.save();
        ctx.translate(w * 0.5, h * 0.5);
        ctx.rotate(sweepAngle);
        const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.5);
        sweepGrad.addColorStop(0, 'rgba(45, 212, 191, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, w * 0.5, 0, Math.PI * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Route Line
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * 0.75);
        ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.85, h * 0.35);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Beacon Pin along route
        const t = (progress / 100);
        const bx = (1 - t) * (1 - t) * (w * 0.15) + 2 * (1 - t) * t * (w * 0.5) + t * t * (w * 0.85);
        const by = (1 - t) * (1 - t) * (h * 0.75) + 2 * (1 - t) * t * (h * 0.2) + t * t * (h * 0.35);

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by, 16 + Math.sin(Date.now() * 0.005) * 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`LIVE GPS: ${plateNumber}`, bx + 16, by - 6);

      } else {
        // AI COMPUTER VISION DASHCAM
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Scanlines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 2);
        }

        // Wireframe road
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.4);
        ctx.lineTo(w * 0.1, h);
        ctx.moveTo(w * 0.5, h * 0.4);
        ctx.lineTo(w * 0.9, h);
        ctx.stroke();

        // AI Bounding Box Tracker
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        const boxX = w * 0.38 + Math.sin(Date.now() * 0.002) * 20;
        const boxY = h * 0.48;
        ctx.strokeRect(boxX, boxY, 110, 75);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(boxX, boxY - 18, 110, 18);
        ctx.fillStyle = '#022c22';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`TARGET: 4x4 [${speed} KM/H]`, boxX + 4, boxY - 5);

        // Telemetry lines
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(boxX + 55, boxY + 75);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, isPlaying, isNight, speed, progress, plateNumber]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-2xl">
      {/* 1. TOP VIDEO STATUS OVERLAY BAR */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600/85 px-2.5 py-1 text-[11px] font-mono font-bold text-white shadow-lg backdrop-blur-md animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            LIVE VIDEO MOTION FEED
          </span>
          <span className="hidden sm:flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-mono text-teal border border-white/10 backdrop-blur-md">
            <Compass className="h-3 w-3 text-teal" /> NE 42° • Highway Live
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-black/70 p-1 border border-white/15 backdrop-blur-md">
          <button
            onClick={() => setViewMode('3d_drive')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              viewMode === '3d_drive' ? 'bg-marigold text-ink shadow-md' : 'text-bone/70 hover:text-white'
            }`}
          >
            🚗 3D Drive
          </button>
          <button
            onClick={() => setViewMode('satellite_radar')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              viewMode === 'satellite_radar' ? 'bg-teal text-ink shadow-md' : 'text-bone/70 hover:text-white'
            }`}
          >
            🛰️ Radar
          </button>
          <button
            onClick={() => setViewMode('ai_dashcam')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              viewMode === 'ai_dashcam' ? 'bg-emerald-500 text-ink shadow-md' : 'text-bone/70 hover:text-white'
            }`}
          >
            🤖 AI Cam
          </button>
        </div>
      </div>

      {/* 2. THE RENDERED HIGHWAY / TRACKING CANVAS */}
      <canvas
        ref={canvasRef}
        width={760}
        height={300}
        className="h-64 sm:h-72 w-full object-cover block"
      />

      {/* 3. BOTTOM TELEMETRY HUD STRIP */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/75 p-3 backdrop-blur-md">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-teal" />
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-bone/50">Speed</span>
              <span className="font-mono font-bold text-teal text-sm">{speed} km/h</span>
            </div>
          </div>

          <div className="border-l border-white/10 pl-3">
            <span className="block text-[9px] uppercase tracking-wider text-bone/50">Live Coordinates</span>
            <span className="font-mono text-xs text-marigold">-1.2921° S, 36.8219° E</span>
          </div>

          <div className="hidden sm:block border-l border-white/10 pl-3">
            <span className="block text-[9px] uppercase tracking-wider text-bone/50">Driver Onboard</span>
            <span className="font-medium text-xs text-bone">{driverName}</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNight(!isNight)}
            className="rounded-lg bg-white/10 p-1.5 text-bone hover:bg-white/20 transition"
            title={isNight ? 'Switch to Sunset/Day' : 'Switch to Night'}
          >
            {isNight ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-blue-300" />}
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-lg bg-marigold px-3 py-1.5 text-xs font-bold text-ink hover:bg-marigold/90 transition shadow-glow"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Live Motion' : 'Paused'}
          </button>
        </div>
      </div>
    </div>
  );
};
