'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  { raw: 18400, display: (n: number) => `${(n / 1000).toFixed(n >= 18000 ? 1 : 0)}K+`, label: 'Athlete profiles modeled' },
  { raw: 3120, display: (n: number) => `${(n / 1000).toFixed(1)}K+`, label: 'Coach sessions booked' },
  { raw: 912, display: (n: number) => `${n}+`, label: 'Brackets generated' },
  { raw: 42, display: (n: number) => `${n}`, label: 'Academy cities tracked' },
];

function StatItem({ stat }: { stat: typeof stats[number] }) {
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
      className="relative flex flex-col items-start text-left px-4 py-5 bg-background/45 border border-border rounded-sm"
    >
      <span className="text-3xl sm:text-5xl font-display font-black tracking-tight text-text-primary tabular-data leading-none">
        {displayValue}
      </span>
      <p className="text-[10px] font-bold text-text-secondary mt-3 font-mono uppercase tracking-widest leading-relaxed">
        {stat.label}
      </p>
    </div>
  );
}

export default function StatsBar() {
  return (
    <section className="relative z-10 border-y border-border/70 bg-secondary/35 py-10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}
