'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Award, ChevronRight, Calendar, User, CheckCircle2,
  TrendingUp, MapPin, Activity, Shield, Sparkles, Trophy
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import SpotlightCard from '../components/shared/SpotlightCard';
import StatsBar from '../components/shared/StatsBar';

const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay, duration: 0.4, ease: EASE_OUT },
  },
});

/* ─────────────────────── Interactive Bracket Simulator Widget ─────────────────── */
function InteractiveBracketSimulator() {
  const [p1, setP1] = useState('Renato Silva');
  const [p2, setP2] = useState('Marcus Silva');
  const [p3, setP3] = useState('Ryan Gracie');
  const [p4, setP4] = useState('Kevin Lee');

  const [semi1Winner, setSemi1Winner] = useState<string | null>(null);
  const [semi2Winner, setSemi2Winner] = useState<string | null>(null);
  const [champion, setChampion] = useState<string | null>(null);

  const resetBracket = () => {
    setSemi1Winner(null);
    setSemi2Winner(null);
    setChampion(null);
  };

  return (
    <div className="w-full bg-secondary/80 border border-border rounded-sm p-6 sm:p-8 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bracket-dots pointer-events-none opacity-40" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">
            SIGNATURE INTERACTIVE PREVIEW
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black text-text-primary tracking-wide uppercase mt-1">
            TEST THE BRACKET SIMULATOR
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Edit fighter names below and click to advance seeds to the finals.
          </p>
        </div>
        <button
          onClick={resetBracket}
          className="text-xs font-mono font-bold tracking-wider text-text-secondary hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-sm bg-surface cursor-pointer"
        >
          RESET BRACKET
        </button>
      </div>

      {/* Grid Layout containing Rounds */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center min-h-[300px]">
        
        {/* Round 1: Semifinals */}
        <div className="flex flex-col gap-12 justify-center">
          <div className="text-center text-[10px] font-bold tracking-wider text-text-tertiary uppercase font-mono">
            Semifinals
          </div>
          
          {/* Match 1 */}
          <div className="flex flex-col gap-2">
            <div className="bg-surface/80 border border-border rounded-sm overflow-hidden shadow-sm">
              <input
                type="text"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:bg-background border-b border-border/30"
                placeholder="Fighter 1"
              />
              <button
                onClick={() => {
                  setSemi1Winner(p1);
                  if (champion && champion !== p1 && champion !== p2) setChampion(null);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold font-mono tracking-wide flex justify-between items-center cursor-pointer transition-colors ${
                  semi1Winner === p1 ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-secondary'
                }`}
              >
                <span>{p1 || 'Fighter 1'}</span>
                {semi1Winner === p1 && <span className="text-[9px] font-bold">WIN ➔</span>}
              </button>
              <button
                onClick={() => {
                  setSemi1Winner(p2);
                  if (champion && champion !== p1 && champion !== p2) setChampion(null);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold font-mono tracking-wide flex justify-between items-center cursor-pointer transition-colors ${
                  semi1Winner === p2 ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-secondary'
                }`}
              >
                <span>{p2 || 'Fighter 2'}</span>
                {semi1Winner === p2 && <span className="text-[9px] font-bold">WIN ➔</span>}
              </button>
            </div>
          </div>

          {/* Match 2 */}
          <div className="flex flex-col gap-2">
            <div className="bg-surface/80 border border-border rounded-sm overflow-hidden shadow-sm">
              <input
                type="text"
                value={p3}
                onChange={(e) => setP3(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:bg-background border-b border-border/30"
                placeholder="Fighter 3"
              />
              <button
                onClick={() => {
                  setSemi2Winner(p3);
                  if (champion && champion !== p3 && champion !== p4) setChampion(null);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold font-mono tracking-wide flex justify-between items-center cursor-pointer transition-colors ${
                  semi2Winner === p3 ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-secondary'
                }`}
              >
                <span>{p3 || 'Fighter 3'}</span>
                {semi2Winner === p3 && <span className="text-[9px] font-bold">WIN ➔</span>}
              </button>
              <button
                onClick={() => {
                  setSemi2Winner(p4);
                  if (champion && champion !== p3 && champion !== p4) setChampion(null);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold font-mono tracking-wide flex justify-between items-center cursor-pointer transition-colors ${
                  semi2Winner === p4 ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-secondary'
                }`}
              >
                <span>{p4 || 'Fighter 4'}</span>
                {semi2Winner === p4 && <span className="text-[9px] font-bold">WIN ➔</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Round 2: Finals */}
        <div className="flex flex-col gap-12 justify-center h-full relative">
          <div className="text-center text-[10px] font-bold tracking-wider text-text-tertiary uppercase font-mono">
            Finals
          </div>

          <div className="bg-surface/85 border border-border rounded-sm overflow-hidden shadow-md">
            {semi1Winner ? (
              <button
                onClick={() => setChampion(semi1Winner)}
                className={`w-full text-left px-4 py-3.5 text-xs font-bold font-mono tracking-wide flex justify-between items-center cursor-pointer transition-colors ${
                  champion === semi1Winner ? 'bg-primary/15 text-primary' : 'hover:bg-background text-text-primary'
                }`}
              >
                <span>{semi1Winner}</span>
                {champion === semi1Winner && <span className="text-[9px] font-bold">CHAMP 🏆</span>}
              </button>
            ) : (
              <div className="px-4 py-3.5 text-xs text-text-tertiary font-semibold text-center italic border-b border-border/20">
                Awaiting Match 1
              </div>
            )}

            {semi2Winner ? (
              <button
                onClick={() => setChampion(semi2Winner)}
                className={`w-full text-left px-4 py-3.5 text-xs font-bold font-mono tracking-wide flex justify-between items-center cursor-pointer transition-colors ${
                  champion === semi2Winner ? 'bg-primary/15 text-primary' : 'hover:bg-background text-text-primary'
                }`}
              >
                <span>{semi2Winner}</span>
                {champion === semi2Winner && <span className="text-[9px] font-bold">CHAMP 🏆</span>}
              </button>
            ) : (
              <div className="px-4 py-3.5 text-xs text-text-tertiary font-semibold text-center italic">
                Awaiting Match 2
              </div>
            )}
          </div>
        </div>

        {/* Round 3: Champion Display */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-center text-[10px] font-bold tracking-wider text-text-tertiary uppercase font-mono mb-4">
            Champion
          </div>

          <AnimatePresence mode="wait">
            {champion ? (
              <motion.div
                key={champion}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-primary/10 border border-primary/30 p-6 rounded-sm w-full max-w-[200px] flex flex-col items-center shadow-lg relative"
              >
                <Trophy className="h-8 w-8 text-primary mb-3 animate-pulse" />
                <span className="text-[10px] font-bold font-mono tracking-widest text-primary uppercase">
                  DIVISION GOLD
                </span>
                <span className="text-sm font-display font-black text-text-primary tracking-wide uppercase mt-1">
                  {champion}
                </span>
              </motion.div>
            ) : (
              <div className="h-32 flex items-center justify-center text-text-tertiary italic text-xs font-semibold">
                Tap winners to crown champion
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Main Page ─────────────────────────────── */
export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Hero Section - Asymmetric Grid Layout */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-32 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Text: Specific & Confident Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <motion.div
              variants={shouldReduce ? {} : fadeUp(0)}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Direct scheduling & live brackets
            </motion.div>

            <motion.h1
              variants={shouldReduce ? {} : fadeUp(0.08)}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-[1.05] text-text-primary uppercase"
            >
              SCHEDULE SPARRING & RUN BRACKETS
            </motion.h1>

            <motion.p
              variants={shouldReduce ? {} : fadeUp(0.16)}
              initial="hidden"
              animate="visible"
              className="mt-6 text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg"
            >
              BJJ, MMA, and wrestling academies use Athlix to manage private instruction availability, generate digital brackets, and log student rank stripes on shared timelines.
            </motion.p>

            <motion.div
              variants={shouldReduce ? {} : fadeUp(0.24)}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-wrap gap-3.5"
            >
              <Link href="/signup">
                <MagneticButton
                  variant="primary"
                  className="py-3 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase"
                >
                  Create free profile
                </MagneticButton>
              </Link>
              <Link href="/features">
                <MagneticButton
                  variant="ghost"
                  className="py-3 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase"
                >
                  Explore features
                </MagneticButton>
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Product Mockup */}
          <div className="lg:col-span-7 relative w-full">
            <motion.div
              variants={shouldReduce ? {} : fadeUp(0.32)}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              {/* Subtle orange accent glow behind mockup */}
              <div
                className="absolute -inset-2 bg-primary/5 rounded-sm blur-2xl pointer-events-none"
                style={{ clipPath: 'polygon(20% 0%, 100% 40%, 80% 100%, 0% 80%)' }}
              />

              <div className="relative rounded-sm border border-border bg-secondary/80 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-left">
                {/* Browser Frame Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border/80">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40"></span>
                  </div>
                  <div className="w-64 h-5 rounded-sm bg-background/50 border border-border/40 text-[9px] text-text-tertiary flex items-center justify-center font-mono tracking-wider uppercase">
                    dashboard.athlix.com
                  </div>
                  <div className="w-8"></div>
                </div>

                {/* Dashboard Area Mockup */}
                <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px] bg-background/40 text-xs font-mono">
                  {/* Sidebar mockup */}
                  <div className="border-r border-border/40 p-4 flex flex-col justify-between hidden md:flex">
                    <div className="flex flex-col gap-4">
                      <div className="font-bold text-text-primary px-2 py-1.5 bg-surface border border-border/40 rounded-sm">
                        CONSOLE HUB
                      </div>
                      <nav className="flex flex-col gap-1 text-[10px] text-text-secondary font-bold">
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <User className="w-3.5 h-3.5" /> ATHLETES
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer text-text-primary bg-surface/30 rounded-sm">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> BOOKINGS
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <Award className="w-3.5 h-3.5" /> BRACKETS
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <Activity className="w-3.5 h-3.5" /> PROGRESS
                        </div>
                      </nav>
                    </div>
                  </div>

                  {/* Main Dashboard Widget Mockups */}
                  <div className="col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Schedule block */}
                    <div className="bg-surface/40 p-4 border border-border rounded-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[10px] text-text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> WEEKLY CALENDAR
                        </h4>
                        <div className="flex flex-col gap-2 text-[10px]">
                          <div className="p-2 bg-background/60 border border-border/40 rounded-sm">
                            <span className="block font-bold text-text-primary">Gi Sparring Session</span>
                            <span className="text-text-secondary">Mon 10:00 AM • Prof. Renato Silva</span>
                          </div>
                          <div className="p-2 bg-background/60 border border-border/40 rounded-sm">
                            <span className="block font-bold text-text-primary">Wrestling Takedowns</span>
                            <span className="text-text-secondary">Wed 06:00 PM • Main Mat</span>
                          </div>
                        </div>
                      </div>
                      <span className="w-full text-center py-1.5 mt-4 rounded-sm border border-border/60 text-[9px] font-bold text-text-secondary hover:text-text-primary hover:border-border transition-colors block cursor-pointer">
                        BOOK PRIVATE SLOT
                      </span>
                    </div>

                    {/* Rank block */}
                    <div className="bg-surface/40 p-4 border border-border rounded-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[10px] text-text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5 text-primary" /> STRIPE MILESTONES
                        </h4>
                        <div className="flex flex-col gap-3 pl-2 border-l border-border/65 ml-1 text-[10px]">
                          <div>
                            <span className="block font-bold text-text-primary">Purple Belt Promotion</span>
                            <span className="text-text-tertiary">6 months ago</span>
                          </div>
                          <div>
                            <span className="block font-bold text-text-primary">1st Stripe Added</span>
                            <span className="text-text-tertiary">3 months ago</span>
                          </div>
                          <div>
                            <span className="block font-bold text-primary">2nd Stripe Evaluation</span>
                            <span className="text-text-secondary">Expected Next Week</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-[9px] text-text-secondary mb-1">
                          <span>Promotion target progress</span>
                          <span>65%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border-strong overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar Section */}
      <StatsBar />

      {/* Signature Design Moment Section: Live Bracket Simulator */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2
            variants={shouldReduce ? {} : fadeUp()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-3xl sm:text-4xl font-display font-black text-text-primary tracking-tight uppercase"
          >
            LIVE TOURNAMENT BRACKET RUNS
          </motion.h2>
          <motion.p
            variants={shouldReduce ? {} : fadeUp(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-4 text-sm text-text-secondary leading-relaxed"
          >
            Fighters register, seeds generate, and brackets update dynamically. Test our interactive simulation tool to see seed progression in action.
          </motion.p>
        </div>

        <motion.div
          variants={shouldReduce ? {} : fadeUp(0.18)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <InteractiveBracketSimulator />
        </motion.div>
      </section>

      {/* Alternating Asymmetric Feature Sections (Replaced 3-card grid) */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60">
        
        {/* Feature Row 1: Left Mockup, Right Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-28">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-secondary border border-border p-5 rounded-sm shadow-inner font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-2 mb-3">
                <span>COACH INSTRUCTION CALENDAR</span>
                <span className="text-primary font-bold">10:30 AM SLOT OPEN</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <span className="p-2 border border-border/40 rounded-sm bg-surface/50 text-text-tertiary line-through cursor-not-allowed">09:00 AM</span>
                <span className="p-2 border border-primary bg-primary/10 rounded-sm text-primary font-bold cursor-pointer">10:30 AM</span>
                <span className="p-2 border border-border/40 rounded-sm bg-surface text-text-primary cursor-pointer hover:border-border transition-colors">02:00 PM</span>
                <span className="p-2 border border-border/40 rounded-sm bg-surface text-text-primary cursor-pointer hover:border-border transition-colors">03:30 PM</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col items-start order-1 lg:order-2">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">01. AVAILABILITY CONTROLS</span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
              AUTO-CONFIRM PRIVATE WORKSHOPS
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-xl">
              Coaches customize hourly rates, specify sparring availability times, and approve student requests instantly, eliminating back-and-forth messaging.
            </p>
            <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-text-primary hover:text-primary gap-1 tracking-wider uppercase font-mono">
              Explore calendar details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Feature Row 2: Left Text, Right Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">02. MILESTONE PROGRESSION</span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
              RECORD SPARS & RANK stripe logs
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-xl">
              Create a permanent digital timeline of your combat career. Log sparring logs, attach video rolls, tag coaching instructors, and record belt rank advancements.
            </p>
            <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-text-primary hover:text-primary gap-1 tracking-wider uppercase font-mono">
              See rank metrics <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="lg:col-span-6">
            <div className="bg-secondary border border-border p-5 rounded-sm font-mono text-xs flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-2">
                <span>ATHLETE TIMELINE UPDATES</span>
                <span className="text-success font-bold">VERIFIED</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🥋</span>
                <div>
                  <span className="block font-bold text-text-primary">First Stripe on BJJ Blue Belt</span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Approved by Head Coach Renato Silva</span>
                  <span className="text-[9px] text-text-tertiary block mt-1">1 month ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section - Clean, Specific Story */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono mb-4">
            ACADEMY REVIEW
          </span>
          <p className="text-lg sm:text-xl text-text-primary italic leading-relaxed max-w-3xl">
            "We managed our entire 400-student summer tournament bracket inside Athlix. It saved our front desk 12 hours of manual registration sorting and kept our brackets updating in real-time."
          </p>
          <div className="flex items-center gap-3.5 mt-8">
            <div className="h-10 w-10 bg-primary/20 flex items-center justify-center font-bold text-primary text-xs rounded-full font-mono uppercase border border-primary/30">
              RS
            </div>
            <div className="text-left font-mono">
              <span className="block text-xs font-bold text-text-primary uppercase">Prof. Renato Silva</span>
              <span className="block text-[10px] text-text-secondary">Head Instructor, Renzo Gracie SF</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-28 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={shouldReduce ? {} : fadeUp()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-secondary border border-border rounded-sm p-8 sm:p-14 relative overflow-hidden"
        >
          <h2 className="text-2xl sm:text-4xl font-display font-black text-text-primary uppercase tracking-wide">
            Ready to track your career?
          </h2>
          <p className="mt-3 max-w-md mx-auto leading-relaxed text-xs text-text-secondary font-sans">
            Build your fighter profile, schedule calendar sessions, or coordinate brackets in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5 justify-center">
            <Link href="/signup">
              <MagneticButton variant="primary" className="py-2.5 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase">
                Create profile
              </MagneticButton>
            </Link>
            <Link href="/contact">
              <MagneticButton variant="ghost" className="py-2.5 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase">
                Email builders
              </MagneticButton>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
