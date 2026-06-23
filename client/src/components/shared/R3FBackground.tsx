'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// An animated floating cage (octahedron wireframe)
const FloatingCage = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.03;
    meshRef.current.rotation.y = t * 0.04;
    meshRef.current.position.y = Math.sin(t) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[2.2, 1]} />
      <meshBasicMaterial 
        color="#fafafa" 
        wireframe 
        transparent 
        opacity={0.03} 
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Animated floating dust particles
const FloatingStars = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);

  // Distribute particles in space
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 8;
  }

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.08}
      />
    </points>
  );
};

export const R3FBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-background" />
    );
  }

  return (
    <div className="absolute inset-0 z-0 h-full w-full pointer-events-none select-none overflow-hidden">
      {/* Premium glow spot - extremely dimmed */}
      <div className="absolute -top-1/4 -right-1/4 h-[50%] w-[50%] bg-primary/3 blur-[140px] rounded-full z-0" />
      <div className="absolute -bottom-1/4 -left-1/4 h-[50%] w-[50%] bg-border/20 blur-[140px] rounded-full z-0" />
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <FloatingCage />
        <FloatingStars />
      </Canvas>
    </div>
  );
};

export default R3FBackground;
