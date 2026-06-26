'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers, Zap, Trophy, MapPin, Shield, Code2,
  Sparkles, ChevronRight, Check, Clock, Users, Star
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import SpotlightCard from '../../components/shared/SpotlightCard';
import Link from 'next/link';
import { fadeUp, EASE_OUT_EXPO } from '../../lib/motion';

/* ── Metadata is inherited from root layout.tsx
   Title = "ATHLIX | Combat Sports Schedules & Brackets"       ── */

/* ── Quick-scan capability grid at top ── */
const capabilities = [
  { icon: Layers,  label: 'Athlete Timelines' },
  { icon: Clock,   label: 'Coach Calendars' },
  { icon: Trophy,  label: 'Live Brackets' },
  { icon: MapPin,  label: 'Academy Finder' },
  { icon: Shield,  label: 'Role Security' },
  { icon: Code2,   label: 'REST APIs' },
  { icon: Sparkles, label: 'AI Assistants' },
];

/* ── Main alternating feature blocks ── */
const features = [
  {
    id: 'progression',
    num: '01',
    label: 'Career Timelines',
    icon: Layers,
    heading: 'FIGHTER PROFILE & BELT TRACKING',
    body: 'Log weekly weights, archive rolling clips, and track progress toward your next stripe or belt. Instructors verify promotions directly from their console — no spreadsheets, no lost records.',
    bullets: ['Weekly training logs', 'Belt & stripe history', 'Instructor-verified promotions'],
    visual: (
      <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
          <span>TIMELINE — LUCAS VIANNA</span>
          <span className="text-primary font-bold">12-WEEK STREAK</span>
        </div>
        <div className="flex flex-col gap-4 pl-3 relative border-l border-border/60 ml-2">
          <div className="relative">
            <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-border-strong border border-background" />
            <span className="font-bold text-text-primary">Gi Sparring Log Submitted</span>
            <span className="block text-[9px] text-text-tertiary mt-0.5">3 hrs logged · Coach Thiago</span>
          </div>
          <div className="relative">
            <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-border-strong border border-background" />
            <span className="font-bold text-text-primary">Weight Check: 77.2 kg</span>
            <span className="block text-[9px] text-text-tertiary mt-0.5">On target for competition</span>
          </div>
          <div className="relative">
            <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-primary border border-background animate-pulse" />
            <span className="font-bold text-primary">3rd Stripe — Blue Belt Awarded</span>
            <span className="block text-[9px] text-text-secondary mt-0.5">Verified by Prof. Thiago Valente</span>
          </div>
        </div>
      </div>
    ),
    flip: false,
  },
  {
    id: 'bookings',
    num: '02',
    label: 'Private Instruction',
    icon: Clock,
    heading: 'CALENDAR AVAILABILITY & SLOT BOOKINGS',
    body: 'Coaches set their available hours and rates. Students pick a slot, confirm payment, and schedule private sessions — no phone tag, no double-bookings.',
    bullets: ['Real-time slot availability', 'Direct payment confirmation', 'Automated session reminders'],
    visual: (
      <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
          <span>COACH AVAILABILITY GRID</span>
          <span className="text-success font-bold">LIVE</span>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { name: 'Prof. Renato (BJJ)', rate: '$90/hr', slots: '3 open' },
            { name: 'Kru Somchai (Muay Thai)', rate: '$75/hr', slots: '5 open' },
            { name: 'Coach Alex (Wrestling)', rate: '$65/hr', slots: '1 open' },
          ].map((c) => (
            <div key={c.name} className="flex justify-between items-center p-2.5 bg-background/50 border border-border/30 rounded-sm">
              <div>
                <span className="font-bold text-text-primary block">{c.name}</span>
                <span className="text-[9px] text-text-tertiary">{c.slots} this week</span>
              </div>
              <span className="text-primary font-bold">{c.rate}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    flip: true,
  },
  {
    id: 'brackets',
    num: '03',
    label: 'Tournament Systems',
    icon: Trophy,
    heading: 'REAL-TIME MATCH BRACKETS',
    body: 'Generate single or double-elimination draws in seconds. Competitors track match status on their phones. Brackets update live as results come in — no manual score entry.',
    bullets: ['Single & double elimination', 'Live result updates', 'Mobile-ready competitor view'],
    visual: (
      <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
          <span>LIVE MATCH PORTAL</span>
          <span className="text-primary font-bold">SEMIFINALS</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-sm flex justify-between items-center">
            <span className="font-bold text-text-primary">Lucas Vianna</span>
            <span className="text-xs text-primary font-bold">WIN — Armbar</span>
          </div>
          <div className="p-2.5 bg-background/30 border border-border/20 rounded-sm opacity-50 flex justify-between items-center">
            <span>John Doe</span>
            <span className="text-xs">LOSS</span>
          </div>
          <div className="mt-3 h-px w-full bg-border/40" />
          <div className="p-2.5 bg-background/50 border border-border/30 rounded-sm flex justify-between items-center">
            <span className="font-bold text-text-primary">Garrison Thorne</span>
            <span className="text-xs text-accent-gold font-bold">FINAL NEXT</span>
          </div>
        </div>
      </div>
    ),
    flip: false,
  },
  {
    id: 'discovery',
    num: '04',
    label: 'Clubs & Security',
    icon: Shield,
    heading: 'ACADEMY FINDER & STABLE APIS',
    body: 'Search gyms by location, discipline, and schedule. Student data, session ratings, and admin permissions are protected by JWT sessions and strict server-side validation.',
    bullets: ['Map-based academy search', 'JWT session management', 'Role-scoped admin controls'],
    visual: (
      <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
          <span>API RESPONSE — /athlete/:id</span>
          <span className="text-primary font-bold">HTTPS/REST</span>
        </div>
        <pre className="text-[10px] text-text-secondary leading-relaxed overflow-x-auto">
{`{
  "athlete": "Lucas Vianna",
  "belt": "Purple",
  "stripes": 3,
  "verified": true,
  "academy": "Apex Grappling Lab",
  "role": "athlete"
}`}
        </pre>
      </div>
    ),
    flip: true,
  },
  {
    id: 'ai-copilot',
    num: '05',
    label: 'Intelligent Systems',
    icon: Sparkles,
    heading: 'AI-DRIVEN TRAINING & SEEDING',
    body: 'Leverage our integrated machine intelligence layer to match with top coaching instructors, draft structured training routines tailored to your belt rank, and auto-seed tournament brackets based on fighter statistics.',
    bullets: ['Personalized drill plan generation', 'Contextual coach compatibility matching', 'Objective bracket seed scheduling'],
    visual: (
      <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
        <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
          <span>AI ENGINE METRICS</span>
          <span className="text-accent-gold font-bold">READY</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="p-2.5 bg-background/50 border border-border/30 rounded-sm">
            <span className="text-[9px] text-text-secondary block">COACH MATCH COMPATIBILITY</span>
            <span className="font-bold text-text-primary block mt-0.5">Thiago Valente: 94% Match Fit</span>
            <span className="text-[8px] text-text-tertiary block mt-0.5 font-bold">Fits availability, 77kg weight class, BJJ focus</span>
          </div>
          <div className="p-2.5 bg-background/50 border border-border/30 rounded-sm">
            <span className="text-[9px] text-text-secondary block">DRILL ROUTINE GENERATED</span>
            <span className="font-bold text-text-primary block mt-0.5">5 Guard Retention drills (Purple Belt BJJ)</span>
          </div>
        </div>
      </div>
    ),
    flip: false,
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* ── Hero — asymmetric, matches About/Home pattern ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: heading block */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
            >
              <Sparkles className="h-3.5 w-3.5" /> Capabilities
            </motion.div>

            <motion.h1
              variants={fadeUp(0.08)}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase text-text-primary"
            >
              BUILT FOR<br />
              <span className="text-primary">COMBAT SPORTS</span>
            </motion.h1>
          </div>

          {/* Right: description + CTA */}
          <div className="lg:col-span-6 lg:pt-14">
            <motion.p
              variants={fadeUp(0.16)}
              initial="hidden"
              animate="visible"
              className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg"
            >
              Every feature was designed around the actual workflows of martial arts schools — scheduling, belt tracking, tournament logistics, and coach payments. Nothing generic.
            </motion.p>

            <motion.div
              variants={fadeUp(0.24)}
              initial="hidden"
              animate="visible"
              className="mt-8 flex items-center gap-4"
            >
              <Link href="/pricing">
                <MagneticButton variant="primary" className="text-xs font-bold py-2.5 px-6 rounded-sm tracking-wider uppercase font-mono">
                  View pricing
                </MagneticButton>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-text-secondary hover:text-text-primary transition-colors uppercase font-mono"
              >
                Start free <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ── Quick-scan capability grid ── */}
        <motion.div
          variants={fadeUp(0.3)}
          initial="hidden"
          animate="visible"
          className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 border-t border-border/60 pt-10"
        >
          {capabilities.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 bg-secondary border border-border rounded-sm hover:border-primary/40 transition-colors"
            >
              <div className="h-8 w-8 rounded-sm bg-surface flex items-center justify-center border border-border/30">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase font-mono text-center">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Alternating feature showcases ── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 border-t border-border/60">
        <div className="flex flex-col gap-28 pt-20">
          {features.map(({ id, num, label, icon: Icon, heading, body, bullets, visual, flip }, i) => (
            <motion.div
              key={id}
              id={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              {/* Text block */}
              <div className={`lg:col-span-6 flex flex-col items-start ${flip ? 'order-1 lg:order-2' : ''}`}>
                <div className="h-9 w-9 rounded-sm bg-surface flex items-center justify-center border border-border/30 mb-4">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-[9px] font-bold tracking-widest text-primary uppercase font-mono">
                  {num}. {label}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
                  {heading}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-lg">
                  {body}
                </p>
                <ul className="mt-5 flex flex-col gap-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-text-secondary">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual block */}
              <div className={`lg:col-span-6 ${flip ? 'order-2 lg:order-1' : ''}`}>
                {visual}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA band — matches site-wide pattern ── */}
      <section className="border-t border-border/60 bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-8">
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase font-mono">
                Ready to run your gym on ATHLIX?
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-display font-black uppercase text-text-primary tracking-tight">
                YOUR FIRST BRACKET IS<br />
                <span className="text-primary">FREE TO GENERATE</span>
              </h2>
              <p className="mt-4 text-sm text-text-secondary max-w-xl">
                Create an account, add your athletes, and run a full tournament bracket in under five minutes. No credit card required.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link href="/signup">
                <MagneticButton variant="primary" className="w-full text-xs font-bold py-3 px-6 rounded-sm tracking-wider uppercase font-mono">
                  Get started free
                </MagneticButton>
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider text-text-secondary hover:text-text-primary transition-colors uppercase font-mono border border-border rounded-sm py-3 px-6"
              >
                Talk to us <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
