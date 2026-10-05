import type { ReactNode } from 'react';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

/**
 * Ultra-fast GPU-accelerated Card.
 * Uses native CSS compositing to avoid synchronous mousemove reflows (getBoundingClientRect)
 * while maintaining the premium luxury hover lift and amber reflection.
 */
export function Card3D({ children, className = '', glare = true }: Card3DProps) {
  return (
    <div className="w-full h-full group">
      <div
        className={`card-luxe relative overflow-hidden transition-all duration-300 ease-out h-full flex flex-col justify-between group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.35)] group-hover:border-slate-900 group-hover:-translate-y-1.5 will-change-transform border-slate-200/80 ${className}`}
      >
        <div className="h-full flex flex-col justify-between relative z-10">
          {children}
        </div>

        {glare && (
          <div
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent"
          />
        )}
      </div>
    </div>
  );
}

