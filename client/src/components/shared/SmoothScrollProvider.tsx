'use client';

import React from 'react';
import { ReactLenis } from 'lenis/react';
import { useReducedMotion } from 'framer-motion';

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    // Lenis initializes in an effect and renders children directly in root mode.
    // A fragment-to-provider switch would remount every page during hydration.
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: !reducedMotion }}>
      {children}
    </ReactLenis>
  );
}
