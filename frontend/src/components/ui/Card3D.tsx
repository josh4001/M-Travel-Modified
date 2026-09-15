import { useRef, useState, ReactNode, MouseEvent } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export function Card3D({ children, className = '', intensity = 15, glare = true }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useSpring(0, { stiffness: 300, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]);
  
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const x = (e.clientX - rect.left) / width - 0.5;
    const y = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="perspective-1000 w-full h-full" ref={cardRef}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        className={`card-luxe relative overflow-hidden transition-all duration-300 h-full flex flex-col justify-between ${
          isHovered ? 'shadow-card-hover border-amber-500/40 -translate-y-1' : 'border-slate-200/80'
        } ${className}`}
      >
        <div className="h-full flex flex-col justify-between" style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
          {children}
        </div>

        {glare && isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-40"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(245, 158, 11, 0.15) 0%, transparent 65%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
