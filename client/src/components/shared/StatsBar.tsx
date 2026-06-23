'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';

function useCountUp(target: number, duration = 1800, inView: boolean) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [inView, target, duration]);

  return count;
}

const stats = [
  { raw: 15000, display: (n: number) => `${(n / 1000).toFixed(n >= 15000 ? 0 : 1)}K+`, label: 'ACTIVE FIGHTERS' },
  { raw: 987, display: (n: number) => `${(n / 10).toFixed(1)}%`, label: 'BOOKING ACCURACY' },
  { raw: 450, display: (n: number) => `${n}+`, label: 'TOURNAMENTS RUN' },
  { raw: 247, display: (n: number) => n >= 247 ? '24/7' : `${n}`, label: 'REAL-TIME ALERTS' },
];

function StatItem({ stat, index }: { stat: typeof stats[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const shouldReduce = useReducedMotion();
  const count = useCountUp(stat.raw, 1800, inView && !shouldReduce);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const displayValue = shouldReduce || !inView ? stat.display(stat.raw) : stat.display(count);

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center text-center px-4 py-4"
    >
      {index > 0 && (
        <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px bg-border" />
      )}
      <span className="text-4xl sm:text-6xl font-extrabold font-mono tracking-tight text-primary tabular-nums">
        {displayValue}
      </span>
      <p className="text-[10px] sm:text-xs font-bold tracking-widest text-text-secondary mt-2 uppercase font-sans">
        {stat.label}
      </p>
    </div>
  );
}

export default function StatsBar() {
  return (
    <section className="relative z-10 bg-secondary/30 border-t border-b border-border py-16 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} index={i} />
        ))}
      </div>
    </section>
  );
}
