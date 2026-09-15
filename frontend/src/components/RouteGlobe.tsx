import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Generates points roughly on a sphere surface (fibonacci sphere) so the
// "network" reads as a globe of connected destinations, not a random cloud.
function fibonacciSphere(count: number, radius: number) {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return points;
}

function RouteNetwork() {
  const group = useRef<THREE.Group>(null);
  const nodeCount = 22;
  const nodes = fibonacciSphere(nodeCount, 2.1);

  // A handful of "flight routes" connecting nearby nodes.
  const routes: [number, number][] = [
    [0, 4], [4, 9], [9, 2], [2, 15], [15, 7], [7, 0],
    [3, 11], [11, 18], [18, 6], [6, 3], [1, 13], [13, 20],
  ];

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
  });

  const pointsArray = new Float32Array(nodes.flat());

  return (
    <group ref={group}>
      {/* Wireframe globe shell */}
      <mesh>
        <icosahedronGeometry args={[2.1, 2]} />
        <meshBasicMaterial color="#17A398" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Destination nodes */}
      <Points positions={pointsArray} stride={3}>
        <PointMaterial color="#F5A623" size={0.06} sizeAttenuation depthWrite={false} transparent opacity={0.9} />
      </Points>

      {/* Route lines between select nodes */}
      {routes.map(([a, b], i) => (
        <Line
          key={i}
          points={[nodes[a], nodes[b]]}
          color="#FF6B5E"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
    </group>
  );
}

export function RouteGlobe() {
  return (
    <div className="h-[320px] w-full sm:h-[420px]" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <RouteNetwork />
        </Suspense>
      </Canvas>
    </div>
  );
}
