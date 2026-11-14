'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { pageTransition } from '../../lib/motion';

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // The server cannot read the user's motion preference. Keep the same visible
  // wrapper on both sides of hydration, then animate later route changes only.
  const canAnimate = mounted && shouldReduce === false;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={canAnimate ? pageTransition.initial : false}
        animate={canAnimate ? pageTransition.animate : { opacity: 1, y: 0 }}
        exit={canAnimate ? pageTransition.exit : undefined}
        transition={canAnimate ? pageTransition.transition : { duration: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
