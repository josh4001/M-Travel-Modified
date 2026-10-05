import React from 'react';

interface AmbientTourismLinesProps {
  variant?: 'savannah' | 'contours' | 'safari-route';
  className?: string;
}

export const AmbientTourismLines: React.FC<AmbientTourismLinesProps> = ({
  variant = 'savannah',
  className = '',
}) => {
  if (variant === 'contours') {
    return (
      <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
        <svg
          viewBox="0 0 1200 240"
          fill="none"
          className="w-full h-auto stroke-slate-300/40 dark:stroke-slate-700/30"
          strokeWidth="0.8"
        >
          {/* Topographic elevation curves evoking Mount Kenya & Great Rift Valley */}
          <path d="M 0 180 C 150 140, 300 210, 480 170 C 650 130, 800 190, 1000 150 C 1100 130, 1150 160, 1200 140" />
          <path d="M 0 140 C 200 90, 350 160, 520 120 C 700 80, 850 140, 1020 100 C 1120 80, 1180 110, 1200 90" strokeDasharray="3 4" />
          <path d="M 0 210 C 220 170, 380 230, 560 190 C 750 150, 900 210, 1100 170 C 1160 150, 1190 180, 1200 170" />
          {/* Subtle geographic coordinates */}
          <text x="40" y="130" className="text-[8px] font-mono fill-slate-400/60 uppercase tracking-[0.2em]">ELEV. 5,199M · MT. KENYA SUMMIT TRANSECT</text>
        </svg>
      </div>
    );
  }

  if (variant === 'safari-route') {
    return (
      <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
        <svg
          viewBox="0 0 900 120"
          fill="none"
          className="w-full h-auto stroke-slate-300/50"
          strokeWidth="0.75"
        >
          {/* Subtle connecting expedition flight & overland trail */}
          <path
            d="M 50 80 Q 250 20, 450 70 T 850 40"
            strokeDasharray="4 6"
          />
          {/* Key landmark points */}
          <circle cx="50" cy="80" r="3" className="fill-slate-900 stroke-white" strokeWidth="1.5" />
          <text x="50" y="100" textAnchor="middle" className="text-[7px] font-mono fill-slate-500 font-bold uppercase tracking-wider">Nairobi</text>
          
          <circle cx="450" cy="70" r="3" className="fill-slate-900 stroke-white" strokeWidth="1.5" />
          <text x="450" y="90" textAnchor="middle" className="text-[7px] font-mono fill-slate-500 font-bold uppercase tracking-wider">Maasai Mara</text>

          <circle cx="850" cy="40" r="3" className="fill-slate-900 stroke-white" strokeWidth="1.5" />
          <text x="850" y="60" textAnchor="middle" className="text-[7px] font-mono fill-slate-500 font-bold uppercase tracking-wider">Diani Beach</text>
        </svg>
      </div>
    );
  }

  // Default: Savannah ambient landscape line sketch
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1000 160"
        fill="none"
        className="w-full h-auto stroke-slate-300/40"
        strokeWidth="0.75"
      >
        {/* Subtle horizon line */}
        <line x1="0" y1="130" x2="1000" y2="130" />
        
        {/* Distant Mount Kilimanjaro dome silhouette */}
        <path d="M 680 130 C 720 100, 760 70, 800 65 C 830 65, 870 95, 910 130" strokeWidth="0.85" />
        <path d="M 785 75 Q 800 70, 815 75" strokeWidth="0.5" />

        {/* Minimalist flat-top umbrella Acacia tree */}
        <path d="M 120 130 C 122 110, 120 90, 115 75 C 113 70, 110 65, 105 60" />
        <path d="M 115 75 C 120 70, 130 65, 135 60" />
        <ellipse cx="110" cy="55" rx="35" ry="6" strokeWidth="0.85" />
        <ellipse cx="125" cy="50" rx="25" ry="5" strokeWidth="0.65" />
        
        {/* Birds soaring in V-formation */}
        <path d="M 420 40 Q 425 35, 430 40 Q 435 35, 440 40" strokeWidth="0.7" />
        <path d="M 445 48 Q 450 43, 455 48 Q 460 43, 465 48" strokeWidth="0.6" />
        <path d="M 405 50 Q 410 46, 415 50 Q 420 46, 425 50" strokeWidth="0.6" />

        {/* Distant Hot Air Balloon */}
        <ellipse cx="580" cy="35" rx="7" ry="9" strokeWidth="0.75" />
        <line x1="578" y1="44" x2="578" y2="47" strokeWidth="0.5" />
        <line x1="582" y1="44" x2="582" y2="47" strokeWidth="0.5" />
        <rect x="577" y="47" width="6" height="3" strokeWidth="0.5" />
      </svg>
    </div>
  );
};
