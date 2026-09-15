import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCw, Eye, Sparkles } from 'lucide-react';

interface VehicleModelProps {
  color: string;
  autoRotate: boolean;
}

function StylizedVehicle({ color, autoRotate }: VehicleModelProps) {
  const group = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.4;
    }
    if (wheelsRef.current) {
      wheelsRef.current.children.forEach((w) => {
        w.rotation.x += delta * 2;
      });
    }
  });

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      {/* Vehicle Body / Chassis */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.6, 1.1]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Cabin / Roof */}
      <mesh position={[-0.1, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.45, 0.95]} />
        <meshStandardMaterial color="#141A30" roughness={0.1} metalness={0.9} transparent opacity={0.85} />
      </mesh>

      {/* Front Windshield */}
      <mesh position={[0.5, 0.82, 0]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.02, 0.9]} />
        <meshBasicMaterial color="#17A398" />
      </mesh>

      {/* Headlights */}
      <mesh position={[1.11, 0.4, 0.35]}>
        <boxGeometry args={[0.05, 0.15, 0.25]} />
        <meshStandardMaterial color="#FFF" emissive="#F5A623" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.11, 0.4, -0.35]}>
        <boxGeometry args={[0.05, 0.15, 0.25]} />
        <meshStandardMaterial color="#FFF" emissive="#F5A623" emissiveIntensity={2} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-1.11, 0.45, 0.35]}>
        <boxGeometry args={[0.05, 0.12, 0.22]} />
        <meshStandardMaterial color="#FF6B5E" emissive="#FF6B5E" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-1.11, 0.45, -0.35]}>
        <boxGeometry args={[0.05, 0.12, 0.22]} />
        <meshStandardMaterial color="#FF6B5E" emissive="#FF6B5E" emissiveIntensity={3} />
      </mesh>

      {/* Wheels */}
      <group ref={wheelsRef}>
        {[
          [0.65, 0.1, 0.6],
          [0.65, 0.1, -0.6],
          [-0.65, 0.1, 0.6],
          [-0.65, 0.1, -0.6],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.18, 24]} />
            <meshStandardMaterial color="#1B2340" roughness={0.4} metalness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Vehicle3DViewer({ make = 'Toyota', model = 'Prado TX' }: { make?: string; model?: string }) {
  const [color, setColor] = useState('#F5A623');
  const [autoRotate, setAutoRotate] = useState(true);

  const colors = [
    { name: 'Marigold Sunset', hex: '#F5A623' },
    { name: 'Teal Coast', hex: '#17A398' },
    { name: 'Obsidian Dusk', hex: '#1B2340' },
    { name: 'Coral Sunrise', hex: '#FF6B5E' },
    { name: 'Pure Pearl', hex: '#F6F3EC' },
  ];

  return (
    <div className="glass-card-3d overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-marigold">
            <Sparkles className="h-3.5 w-3.5" /> Interactive 3D Showcase
          </span>
          <h3 className="font-display text-xl font-medium">{make} {model}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              autoRotate ? 'border-marigold text-marigold bg-marigold/10' : 'border-white/15 text-bone/60'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            {autoRotate ? 'Auto Orbiting' : 'Paused'}
          </button>
        </div>
      </div>

      <div className="relative h-[300px] w-full sm:h-[360px]">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[3.5, 2, 4]} fov={45} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
          <pointLight position={[-5, 3, -5]} intensity={0.5} color="#17A398" />

          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
              <StylizedVehicle color={color} autoRotate={autoRotate} />
            </Float>
            <ContactShadows position={[0, -0.4, 0]} opacity={0.6} scale={8} blur={1.5} far={4} color="#000" />
          </Suspense>

          <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 6} />
        </Canvas>

        <div className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] text-bone/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
          <Eye className="h-3 w-3 text-marigold" /> Drag to rotate 360°
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <span className="text-xs text-bone/60">Choose Chassis Finish:</span>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => setColor(c.hex)}
              title={c.name}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c.hex ? 'border-white scale-110 shadow-glow' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
