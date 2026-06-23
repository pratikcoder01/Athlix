'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Award, ChevronRight, Activity, Calendar, Sparkles,
  MapPin, Shield, Zap, BrainCircuit,
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import SpotlightCard from '../components/shared/SpotlightCard';
import R3FBackground from '../components/shared/R3FBackground';
import StatsBar from '../components/shared/StatsBar';

/* ─────────────────────── animation helpers ─────────────────────── */
const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  hidden: { y: 32, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay, duration: 0.55, ease: EASE_OUT },
  },
});

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

/* ─────────────────────── feature card data ─────────────────────── */
const features = [
  {
    icon: Activity,
    title: 'Athlete Progression',
    desc: 'Track belt levels, sparring clips, weight categories, and workout performance analytics in an interactive timeline interface.',
    color: 'primary',
    glow: 'rgba(255, 90, 61, 0.15)',
    href: '/features#progression',
  },
  {
    icon: Calendar,
    title: 'Real-Time Bookings',
    desc: 'Schedule private training slots instantly. Coaches customize pricing structures and availability with automated alerts.',
    color: 'gold',
    glow: 'rgba(247, 181, 0, 0.15)',
    href: '/features#bookings',
  },
  {
    icon: Award,
    title: 'Tournament Brackets',
    desc: 'Generate digital single/double elimination brackets automatically. Organizers manage rules, entries, and publish live results.',
    color: 'success',
    glow: 'rgba(34, 197, 94, 0.15)',
    href: '/features#brackets',
  },
  {
    icon: MapPin,
    title: 'Academy Finder',
    desc: 'Discover top-rated martial arts academies near you with maps, review aggregates, style tags, and direct booking links.',
    color: 'primary',
    glow: 'rgba(255, 90, 61, 0.12)',
    href: '/features#academies',
  },
  {
    icon: Shield,
    title: 'Coach Verification',
    desc: 'Every listed coach goes through credential and rank verification — so athletes train with trusted professionals only.',
    color: 'gold',
    glow: 'rgba(247, 181, 0, 0.12)',
    href: '/features#coaches',
  },
  {
    icon: BrainCircuit,
    title: 'Smart Analytics',
    desc: 'AI-powered performance dashboards with win/loss trends, training load heatmaps, and auto-generated fight camp reports.',
    color: 'success',
    glow: 'rgba(34, 197, 94, 0.12)',
    href: '/features#analytics',
  },
];

const colorMap: Record<string, string> = {
  primary: 'text-primary',
  gold: 'text-gold',
  success: 'text-success',
};
const bgColorMap: Record<string, string> = {
  primary: 'bg-primary/10',
  gold: 'bg-gold/10',
  success: 'bg-success/10',
};

/* ─────────────────────── word-by-word headline ─────────────────── */
function SplitHeadline({ text, accent }: { text: string; accent?: string }) {
  const shouldReduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <span className="inline">
      {words.map((word, i) =>
        shouldReduce ? (
          <span key={i} className={accent && word === accent ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-accent to-gold' : ''}>
            {word}{' '}
          </span>
        ) : (
          <motion.span
            key={i}
            variants={fadeUp(i * 0.1)}
            className={`inline-block mr-[0.25em] ${
              accent && word === accent
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-accent to-gold'
                : ''
            }`}
          >
            {word}
          </motion.span>
        )
      )}
    </span>
  );
}

/* ─────────────────────── animated grid mesh bg ─────────────────── */
function GridMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Radial glow blobs */}
      <motion.div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/8 blur-[120px]"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-secondary-accent/6 blur-[100px]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      {/* Subtle grid lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ─────────────────────── main page ─────────────────────────────── */
export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background text-text-primary transition-colors duration-300 overflow-hidden">
      {/* 3D WebGL Background */}
      <R3FBackground />

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-28 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center min-h-[85vh]">
        <GridMesh />

        {/* Badge */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp(0)}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase mb-8 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5 animate-spin" />
          THE NEW STANDARD FOR COMBAT SPORTS
        </motion.div>

        {/* Word-by-word animated headline */}
        <motion.h1
          variants={shouldReduce ? {} : containerVariants}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-8xl font-black font-display tracking-tight leading-[0.9] max-w-4xl"
        >
          <SplitHeadline text="THE COMBAT" />
          <br />
          <SplitHeadline text="SPORTS ENGINE" accent="ENGINE" />
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={shouldReduce ? {} : fadeUp(0.6)}
          initial="hidden"
          animate="visible"
          className="mt-7 text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed"
          style={{ color: 'rgba(220, 225, 240, 0.85)' }}
        >
          ATHLIX is a premium next-gen tech ecosystem for martial artists, coaches, academies, and
          tournament organizers. Level up calendars, brackets, and social feed in one unified dark
          premium engine.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp(0.75)}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <Link href="/signup">
            <MagneticButton
              variant="primary"
              className="py-3.5 px-8 rounded-md font-bebas tracking-widest text-sm"
            >
              CREATE ATHLETE PROFILE
            </MagneticButton>
          </Link>
          <Link href="/about">
            <MagneticButton
              variant="ghost"
              className="py-3.5 px-8 rounded-md font-bebas tracking-widest text-sm"
            >
              EXPLORE PLATFORM
            </MagneticButton>
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp(1.0)}
          initial="hidden"
          animate="visible"
          className="mt-16"
        >
          <motion.div
            animate={shouldReduce ? {} : { y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="mx-auto h-8 w-5 rounded-full border border-border flex items-start justify-center pt-1.5"
          >
            <div className="h-1.5 w-1 rounded-full bg-primary/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <StatsBar />

      {/* ── Feature Cards ──────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
        <div className="text-center mb-16">
          <motion.h2
            variants={shouldReduce ? {} : fadeUp()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-wide uppercase"
          >
            ENGINEERED TO BUILD CHAMPIONS
          </motion.h2>
          <motion.p
            variants={shouldReduce ? {} : fadeUp(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-4 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(220, 225, 240, 0.75)' }}
          >
            Six core pillars that power every combat sports academy, coach, and fighter on the ATHLIX platform.
          </motion.p>
        </div>

        <motion.div
          variants={shouldReduce ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={shouldReduce ? {} : cardVariants}>
                <Link href={feature.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                  <SpotlightCard
                    className={`h-full border border-border bg-secondary flex flex-col justify-between`}
                    glowColor={feature.glow}
                  >
                    <div>
                      <div className={`h-12 w-12 rounded-lg ${bgColorMap[feature.color]} flex items-center justify-center mb-6`}>
                        <Icon className={`h-6 w-6 ${colorMap[feature.color]}`} />
                      </div>
                      <h3 className="text-xl font-bold font-display tracking-wide mb-3 uppercase text-text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(220, 225, 240, 0.7)' }}>
                        {feature.desc}
                      </p>
                    </div>
                    <div className={`mt-6 inline-flex items-center text-xs font-bold ${colorMap[feature.color]} tracking-widest font-bebas`}>
                      LEARN MORE <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  </SpotlightCard>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={shouldReduce ? {} : fadeUp()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="bg-secondary border border-border rounded-2xl p-8 sm:p-16 relative overflow-hidden shadow-2xl"
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-secondary-accent/8 rounded-full blur-2xl pointer-events-none" />

          <Zap className="mx-auto h-10 w-10 text-primary mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight uppercase leading-none">
            READY TO JOIN THE ARENA?
          </h2>
          <p className="mt-4 max-w-xl mx-auto leading-relaxed text-sm sm:text-base" style={{ color: 'rgba(220, 225, 240, 0.75)' }}>
            Create your profile as an athlete, list your academy directory, or organize structural brackets in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/signup">
              <MagneticButton variant="primary" className="py-3 px-8 rounded-md font-bebas tracking-widest text-sm">
                GET STARTED NOW
              </MagneticButton>
            </Link>
            <Link href="/contact">
              <MagneticButton variant="ghost" className="py-3 px-8 rounded-md font-bebas tracking-widest text-sm">
                TALK TO FOUNDER
              </MagneticButton>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
