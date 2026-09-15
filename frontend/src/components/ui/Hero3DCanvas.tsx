import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingOrbs() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate 120 random particles in 3D space
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 12;
    positions[i + 1] = (Math.random() - 0.5) * 12;
    positions[i + 2] = (Math.random() - 0.5) * 12;
  }

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Floating 3D Geometries */}
      <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
        <mesh position={[-3, 1.5, -2]}>
          <octahedronGeometry args={[0.9]} />
          <MeshWobbleMaterial color="#F5A623" factor={0.3} speed={1.5} wireframe transparent opacity={0.6} />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={2} floatIntensity={1.8}>
        <mesh position={[3.5, -1, -1]}>
          <torusGeometry args={[0.8, 0.25, 16, 32]} />
          <meshStandardMaterial color="#17A398" wireframe transparent opacity={0.4} />
        </mesh>
      </Float>

      <Float speed={2.5} rotationIntensity={1} floatIntensity={2.5}>
        <mesh position={[2, 2.2, -3]}>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#FF6B5E" wireframe transparent opacity={0.5} />
        </mesh>
      </Float>

      {/* Ambient Particle Cloud */}
      <Points ref={pointsRef} positions={positions} stride={3}>
        <PointMaterial color="#F5A623" size={0.05} sizeAttenuation depthWrite={false} transparent opacity={0.7} />
      </Points>
    </group>
  );
}

export function Hero3DCanvas() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none opacity-80" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <FloatingOrbs />
        </Suspense>
      </Canvas>
    </div>
  );
}
