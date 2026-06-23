'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Award, ChevronRight, Activity, Calendar, Sparkles,
  MapPin, Shield, BrainCircuit, Check, BarChart3, Clock,
  ArrowRight, Search, Star, User, Zap
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
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay, duration: 0.35, ease: EASE_OUT },
  },
});

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

/* ─────────────────────── animated grid mesh bg ─────────────────── */
function GridMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Dimmed radial glow blobs */}
      <motion.div
        className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/4 blur-[140px]"
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-border/20 blur-[120px]"
        animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      {/* Subtle grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.025]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" />
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
    <div className="relative min-h-screen bg-background text-text-primary transition-colors duration-300 overflow-x-hidden">
      {/* 3D Canvas Background */}
      <R3FBackground />

      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-40 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <GridMesh />

        {/* Small Eyebrow Badge */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp(0)}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-medium text-text-secondary tracking-wide uppercase mb-6 font-sans"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          The standard for combat athletes
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={shouldReduce ? {} : fadeUp(0.1)}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl font-sans text-text-primary"
        >
          Booking, brackets, and progress tracking for combat sports
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={shouldReduce ? {} : fadeUp(0.2)}
          initial="hidden"
          animate="visible"
          className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed"
        >
          Athlix helps academies, coaches, and athletes manage training schedules, schedule private sessions, and run tournaments on a single, clean workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp(0.3)}
          initial="hidden"
          animate="visible"
          className="mt-8 flex flex-wrap gap-3.5 justify-center"
        >
          <Link href="/signup">
            <MagneticButton
              variant="primary"
              className="py-2.5 px-6 rounded-md text-sm font-medium"
            >
              Get started
            </MagneticButton>
          </Link>
          <Link href="/about">
            <MagneticButton
              variant="ghost"
              className="py-2.5 px-6 rounded-md text-sm font-medium"
            >
              See how it works
            </MagneticButton>
          </Link>
        </motion.div>

        {/* Hero Product Mockup (Focal Point) */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp(0.4)}
          initial="hidden"
          animate="visible"
          className="mt-20 w-full max-w-5xl rounded-xl border border-border bg-secondary/40 backdrop-blur shadow-2xl overflow-hidden text-left"
        >
          {/* Browser Chrome Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/80 border-b border-border/80">
            {/* Window Controls */}
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-border-strong opacity-40"></span>
              <span className="w-3 h-3 rounded-full bg-border-strong opacity-40"></span>
              <span className="w-3 h-3 rounded-full bg-border-strong opacity-40"></span>
            </div>
            {/* URL bar */}
            <div className="w-72 h-6 rounded bg-background/50 border border-border/40 text-[10px] text-text-tertiary flex items-center justify-center font-sans tracking-wide">
              athlix.com/dashboard
            </div>
            <div className="w-12"></div> {/* Spacer */}
          </div>

          {/* Browser content area */}
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[440px] bg-background/30 text-text-primary text-xs">
            {/* Mock Sidebar */}
            <div className="border-r border-border/50 p-4 flex flex-col justify-between hidden md:flex">
              <div className="flex flex-col gap-4">
                <div className="font-semibold text-text-primary px-2 py-1 bg-secondary/60 rounded border border-border/30">Athlix Hub</div>
                <nav className="flex flex-col gap-1 text-text-secondary">
                  <div className="px-2 py-1.5 hover:text-text-primary transition-colors flex items-center gap-2 cursor-pointer"><User className="w-3.5 h-3.5" /> Athletes</div>
                  <div className="px-2 py-1.5 hover:text-text-primary transition-colors flex items-center gap-2 cursor-pointer text-text-primary font-medium bg-secondary/40 rounded"><Calendar className="w-3.5 h-3.5" /> Bookings</div>
                  <div className="px-2 py-1.5 hover:text-text-primary transition-colors flex items-center gap-2 cursor-pointer"><Award className="w-3.5 h-3.5" /> Brackets</div>
                  <div className="px-2 py-1.5 hover:text-text-primary transition-colors flex items-center gap-2 cursor-pointer"><Activity className="w-3.5 h-3.5" /> Progression</div>
                </nav>
              </div>

              {/* Sidebar Profile Card */}
              <div className="p-2 border border-border/40 rounded bg-secondary/20 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-[10px]">MS</div>
                <div>
                  <div className="font-medium text-text-primary">Marcus Silva</div>
                  <div className="text-[10px] text-text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span> Blue Belt
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Main Dashboard Area */}
            <div className="col-span-3 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Weekly training calendar */}
              <div className="md:col-span-1 bg-secondary/30 rounded-lg p-4 border border-border/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-text-secondary" /> Calendar</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">Active camp</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="p-2.5 rounded bg-background/50 border border-border/40 hover:border-border transition-colors">
                      <div className="font-medium text-text-primary">Private BJJ Sparring</div>
                      <div className="text-[10px] text-text-secondary mt-1 flex justify-between">
                        <span>Coach Leo</span>
                        <span className="text-primary font-medium">Mon 10:00 AM</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-background/50 border border-border/40 hover:border-border transition-colors">
                      <div className="font-medium text-text-primary">Wrestling Drills</div>
                      <div className="text-[10px] text-text-secondary mt-1 flex justify-between">
                        <span>Academy main mat</span>
                        <span>Wed 06:00 PM</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-background/50 border border-border/40 hover:border-border transition-colors">
                      <div className="font-medium text-text-primary">Open Mat Session</div>
                      <div className="text-[10px] text-text-secondary mt-1 flex justify-between">
                        <span>All levels welcome</span>
                        <span>Fri 04:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="w-full py-1.5 mt-4 rounded border border-border hover:bg-secondary text-[10px] font-medium text-text-primary transition-all text-center">
                  Book new session
                </button>
              </div>

              {/* Column 2: Tournament bracket */}
              <div className="md:col-span-1 bg-secondary/30 rounded-lg p-4 border border-border/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-text-secondary" /> Live bracket</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-text-secondary font-medium">Semifinals</span>
                  </div>
                  <div className="flex flex-col gap-4 py-2 relative">
                    {/* Semi Match 1 */}
                    <div className="flex flex-col gap-1 border-l-2 border-primary/40 pl-2">
                      <div className="p-1.5 bg-background/60 rounded border border-border/50 flex justify-between items-center">
                        <span className="font-medium text-text-primary">Marcus Silva</span>
                        <span className="text-[9px] text-primary font-bold">W (Armbar)</span>
                      </div>
                      <div className="p-1.5 bg-background/30 rounded border border-border/30 opacity-60 flex justify-between items-center">
                        <span>John Doe</span>
                        <span className="text-[9px] text-text-tertiary">L</span>
                      </div>
                    </div>

                    {/* Semi Match 2 */}
                    <div className="flex flex-col gap-1 border-l-2 border-border pl-2">
                      <div className="p-1.5 bg-background/60 rounded border border-border/50 flex justify-between items-center">
                        <span className="font-medium text-text-primary">Ryan Gracie</span>
                        <span className="text-[9px] text-text-secondary font-medium">W (Points)</span>
                      </div>
                      <div className="p-1.5 bg-background/30 rounded border border-border/30 opacity-60 flex justify-between items-center">
                        <span>Kevin Lee</span>
                        <span className="text-[9px] text-text-tertiary">L</span>
                      </div>
                    </div>

                    {/* Final Match Indicator */}
                    <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/20 flex justify-between items-center">
                      <div className="font-medium text-text-primary flex flex-col">
                        <span>Silva vs Gracie</span>
                        <span className="text-[9px] text-text-secondary font-normal mt-0.5">Final Match • Fri 10:00 AM</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-text-tertiary text-center italic mt-2">
                  Updates update in real-time
                </div>
              </div>

              {/* Column 3: Athlete progression timeline */}
              <div className="md:col-span-1 bg-secondary/30 rounded-lg p-4 border border-border/50 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary flex items-center gap-1.5 mb-4"><Activity className="w-3.5 h-3.5 text-text-secondary" /> Progress tracking</h3>
                  
                  {/* Vertical Progression Items */}
                  <div className="flex flex-col gap-3 pl-2.5 relative border-l border-border/60 ml-2">
                    <div className="relative">
                      <span className="absolute -left-[14.5px] top-1 w-2.5 h-2.5 rounded-full bg-border-strong border border-background"></span>
                      <div className="font-medium text-text-primary">Blue Belt promotion</div>
                      <div className="text-[9px] text-text-tertiary">6 months ago</div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[14.5px] top-1 w-2.5 h-2.5 rounded-full bg-border-strong border border-background"></span>
                      <div className="font-medium text-text-primary">First Stripe added</div>
                      <div className="text-[9px] text-text-tertiary">3 months ago</div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[14.5px] top-1 w-2.5 h-2.5 rounded-full bg-border-strong border border-background"></span>
                      <div className="font-medium text-text-primary">Second Stripe added</div>
                      <div className="text-[9px] text-text-tertiary">1 month ago</div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[14.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border border-background animate-pulse"></span>
                      <div className="font-medium text-text-primary flex items-center gap-1">Purple Belt target <span className="text-[9px] text-primary font-semibold">(65%)</span></div>
                      <div className="text-[9px] text-text-secondary">Expected camp: 3 months</div>
                    </div>
                  </div>
                </div>
                
                {/* Visual completion progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[9px] text-text-secondary mb-1">
                    <span>Rank progress tracker</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-border-strong overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats Section ──────────────────────────────────────────── */}
      <StatsBar />

      {/* ── Feature Cards Section (Show, Don't Just Tell) ───────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-36 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            variants={shouldReduce ? {} : fadeUp()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary"
          >
            Built for everyday training
          </motion.h2>
          <motion.p
            variants={shouldReduce ? {} : fadeUp(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-4 max-w-xl mx-auto text-text-secondary text-base leading-relaxed"
          >
            A cohesive workflow for academies, coaches, and athletes. Focus on performance instead of administration.
          </motion.p>
        </div>

        <motion.div
          variants={shouldReduce ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1: Athlete Progression */}
          <motion.div variants={shouldReduce ? {} : fadeUp()}>
            <Link href="/features#progression" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between p-6">
                <div>
                  {/* Feature Visual Mini-Preview */}
                  <div className="h-28 rounded-lg bg-background/50 border border-border/40 p-4 mb-6 flex flex-col justify-center">
                    <div className="flex flex-col gap-2.5 pl-2 relative border-l border-border/60">
                      <div className="text-[10px] text-text-primary font-medium flex justify-between">
                        <span>Blue Belt promotion</span>
                        <span className="text-text-tertiary">Completed</span>
                      </div>
                      <div className="text-[10px] text-text-primary font-medium flex justify-between relative">
                        <span className="absolute -left-[12px] top-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-primary font-semibold">Stripe evaluation</span>
                        <span className="text-primary">Next Week</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">
                    Athlete progression
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Follow your training timeline with rank milestones, sparring clips, and weight progress.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-text-primary gap-1">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Card 2: Real-Time Bookings */}
          <motion.div variants={shouldReduce ? {} : fadeUp()}>
            <Link href="/features#bookings" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between p-6">
                <div>
                  {/* Feature Visual Mini-Preview */}
                  <div className="h-28 rounded-lg bg-background/50 border border-border/40 p-3 mb-6 flex flex-col justify-center gap-1.5">
                    <div className="flex justify-between items-center text-[9px] text-text-secondary border-b border-border/30 pb-1.5 mb-1.5">
                      <span>Coach Leo Slots</span>
                      <span>Tomorrow</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
                      <span className="py-1 rounded bg-secondary/80 text-text-secondary cursor-not-allowed line-through">09:00 AM</span>
                      <span className="py-1 rounded bg-primary/10 text-primary border border-primary/20 font-medium cursor-pointer">10:30 AM</span>
                      <span className="py-1 rounded bg-secondary/80 border border-border/40 text-text-primary cursor-pointer hover:border-border">02:00 PM</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">
                    Real-time bookings
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Book sessions instantly with coaches based on real-time availability and custom pricing.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-text-primary gap-1">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Card 3: Tournament Brackets */}
          <motion.div variants={shouldReduce ? {} : fadeUp()}>
            <Link href="/features#brackets" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between p-6">
                <div>
                  {/* Feature Visual Mini-Preview */}
                  <div className="h-28 rounded-lg bg-background/50 border border-border/40 p-3 mb-6 flex flex-col justify-center gap-2">
                    <div className="flex items-center justify-between text-[9px] text-text-secondary">
                      <span>Matches</span>
                      <span>Single Elimination</span>
                    </div>
                    <div className="flex flex-col gap-1 pl-1.5 border-l border-primary/60 text-[9px]">
                      <div className="flex justify-between items-center text-text-primary">
                        <span>M. Silva</span>
                        <span className="font-semibold text-primary">Win</span>
                      </div>
                      <div className="flex justify-between items-center text-text-tertiary">
                        <span>J. Doe</span>
                        <span>Loss</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">
                    Tournament brackets
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Run single or double elimination tournaments with automatic seeding and live bracket updates.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-text-primary gap-1">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Card 4: Academy Finder */}
          <motion.div variants={shouldReduce ? {} : fadeUp()}>
            <Link href="/features#academies" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between p-6">
                <div>
                  {/* Feature Visual Mini-Preview */}
                  <div className="h-28 rounded-lg bg-background/50 border border-border/40 p-3 mb-6 flex flex-col justify-center gap-1.5">
                    <div className="font-semibold text-text-primary text-[10px]">Gracie Academy</div>
                    <div className="flex items-center gap-1 text-[9px] text-text-secondary">
                      <MapPin className="w-2.5 h-2.5 text-text-tertiary" /> 1.2 miles away
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-secondary/80 text-[8px] text-text-secondary font-medium">BJJ</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary/80 text-[8px] text-text-secondary font-medium">Judo</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary/80 text-[8px] text-text-secondary font-medium">No-Gi</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">
                    Academy discovery
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Find verified academies near you with style tags, member reviews, and direct sign-ups.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-text-primary gap-1">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Card 5: Coach Verification */}
          <motion.div variants={shouldReduce ? {} : fadeUp()}>
            <Link href="/features#coaches" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between p-6">
                <div>
                  {/* Feature Visual Mini-Preview */}
                  <div className="h-28 rounded-lg bg-background/50 border border-border/40 p-3 mb-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-text-secondary text-[10px]">LC</div>
                      <div>
                        <div className="font-semibold text-text-primary text-[10px] flex items-center gap-1">Leo Cavalcanti <Check className="w-3 h-3 text-primary" /></div>
                        <div className="text-[8px] text-text-secondary mt-0.5">3rd Degree Black Belt</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">
                    Verified credentials
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Train with confidence knowing every coach's rank and credentials are fully verified.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-text-primary gap-1">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>

          {/* Card 6: Smart Analytics */}
          <motion.div variants={shouldReduce ? {} : fadeUp()}>
            <Link href="/features#analytics" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between p-6">
                <div>
                  {/* Feature Visual Mini-Preview */}
                  <div className="h-28 rounded-lg bg-background/50 border border-border/40 p-3 mb-6 flex items-center justify-center gap-4">
                    {/* Win/Loss Pie representation */}
                    <div className="flex flex-col gap-1 text-[9px] w-full">
                      <div className="flex justify-between mb-1 text-text-secondary">
                        <span>Win ratio</span>
                        <span className="font-semibold text-text-primary">72%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-border-strong overflow-hidden flex">
                        <div className="h-full bg-primary" style={{ width: '72%' }}></div>
                        <div className="h-full bg-secondary/80" style={{ width: '28%' }}></div>
                      </div>
                      <div className="flex gap-2.5 mt-1.5 text-[8px] text-text-tertiary">
                        <span>Wins: 18</span>
                        <span>Losses: 7</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">
                    Training analytics
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Analyze your performance with automated sparring logs, win/loss stats, and volume tracking.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-text-primary gap-1">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-36 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={shouldReduce ? {} : fadeUp()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="bg-secondary/40 backdrop-blur border border-border rounded-2xl p-8 sm:p-16 relative overflow-hidden shadow-xl"
        >
          {/* Faint decorative blobs */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-primary/2 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-border/5 rounded-full blur-2xl pointer-events-none" />

          <Zap className="mx-auto h-8 w-8 text-primary mb-4 opacity-60" />
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Ready to start?
          </h2>
          <p className="mt-3 max-w-md mx-auto leading-relaxed text-sm text-text-secondary">
            Create your athlete profile, manage your academy schedule, or run your next tournament in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5 justify-center">
            <Link href="/signup">
              <MagneticButton variant="primary" className="py-2.5 px-6 rounded-md text-sm font-medium">
                Get started
              </MagneticButton>
            </Link>
            <Link href="/contact">
              <MagneticButton variant="ghost" className="py-2.5 px-6 rounded-md text-sm font-medium">
                Talk to founder
              </MagneticButton>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
