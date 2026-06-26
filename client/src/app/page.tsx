'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Award, ChevronRight, Calendar, User, CheckCircle2,
  TrendingUp, MapPin, Activity, Shield, Sparkles, Trophy
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import SpotlightCard from '../components/shared/SpotlightCard';
import StatsBar from '../components/shared/StatsBar';
import InteractiveBracketSimulator from '../components/bracket/InteractiveBracketSimulator';
import { fadeUp } from '../lib/motion';

export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 mat-grid opacity-[0.6] pointer-events-none -z-10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <motion.div
              variants={shouldReduce ? {} : fadeUp(0)}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Direct scheduling & live brackets
            </motion.div>

            <motion.div
              variants={shouldReduce ? {} : fadeUp(0.08)}
              initial="hidden"
              animate="visible"
              className="display-skew"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-[0.95] text-text-primary uppercase">
                Schedule Sparring & Run Brackets
              </h1>
            </motion.div>

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
              <div
                className="absolute -inset-2 bg-primary/5 rounded-sm blur-2xl pointer-events-none"
                style={{ clipPath: 'polygon(20% 0%, 100% 40%, 80% 100%, 0% 80%)' }}
              />

              <div className="relative rounded-sm border border-border bg-secondary/80 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-left">
                <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border/80">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40" />
                  </div>
                  <div className="w-64 h-5 rounded-sm bg-background/50 border border-border/40 text-[9px] text-text-tertiary flex items-center justify-center font-mono tracking-wider uppercase">
                    dashboard.athlix.com
                  </div>
                  <div className="w-8" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px] bg-background/40 text-xs font-mono">
                  <div className="border-r border-border/40 p-4 flex flex-col justify-between hidden md:flex">
                    <div className="flex flex-col gap-4">
                      <div className="font-bold text-text-primary px-2 py-1.5 bg-surface border border-border/40 rounded-sm">
                        CONSOLE HUB
                      </div>
                      <nav className="flex flex-col gap-1 text-[10px] text-text-secondary font-bold">
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <User className="w-3.5 h-3.5" aria-hidden="true" /> ATHLETES
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer text-text-primary bg-surface/30 rounded-sm">
                          <Calendar className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> BOOKINGS
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <Award className="w-3.5 h-3.5" aria-hidden="true" /> BRACKETS
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <Activity className="w-3.5 h-3.5" aria-hidden="true" /> PROGRESS
                        </div>
                      </nav>
                    </div>
                  </div>

                  <div className="col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface/40 p-4 border border-border rounded-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[10px] text-text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Weekly Calendar
                        </h4>
                        <div className="flex flex-col gap-2 text-[10px]">
                          <div className="p-2 bg-background/60 border border-border/40 rounded-sm">
                            <span className="block font-bold text-text-primary">Gi Sparring Session</span>
                            <span className="text-text-secondary">Mon 10:00 AM • Prof. Thiago Valente</span>
                          </div>
                          <div className="p-2 bg-background/60 border border-border/40 rounded-sm">
                            <span className="block font-bold text-text-primary">Wrestling Takedowns</span>
                            <span className="text-text-secondary">Wed 06:00 PM • Main Mat</span>
                          </div>
                        </div>
                      </div>
                      <span className="w-full text-center py-1.5 mt-4 rounded-sm border border-border/60 text-[9px] font-bold text-text-secondary hover:text-text-primary hover:border-border transition-colors block cursor-pointer">
                        Book Private Slot
                      </span>
                    </div>

                    <div className="bg-surface/40 p-4 border border-border rounded-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[10px] text-text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Stripe Milestones
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
                        <div className="flex justify-between text-[9px] text-text-secondary mb-1 tabular-data">
                          <span>Promotion target progress</span>
                          <span>65%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border-strong overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '65%' }} />
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

      <StatsBar />

      {/* Bracket Simulator */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2
            variants={shouldReduce ? {} : fadeUp()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-3xl sm:text-4xl font-display font-black text-text-primary tracking-tight uppercase display-skew inline-block"
          >
            <span>Live Tournament Bracket Runs</span>
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

      {/* Feature Sections */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60">
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
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">01. Availability Controls</span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
              Auto-Confirm Private Workshops
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-xl">
              Coaches customize hourly rates, specify sparring availability times, and approve student requests instantly, eliminating back-and-forth messaging.
            </p>
            <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-text-primary hover:text-primary gap-1 tracking-wider uppercase font-mono">
              Explore calendar details <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">02. Milestone Progression</span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
              Record Spars & Rank Stripe Logs
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-xl">
              Create a permanent digital timeline of your combat career. Log sparring logs, attach video rolls, tag coaching instructors, and record belt rank advancements.
            </p>
            <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-text-primary hover:text-primary gap-1 tracking-wider uppercase font-mono">
              See rank metrics <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
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
                  <span className="text-[10px] text-text-secondary block mt-0.5">Approved by Head Coach Thiago Valente</span>
                  <span className="text-[9px] text-text-tertiary block mt-1">1 month ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Intelligent co-pilot layer
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-text-primary tracking-tight uppercase">
            AI-Assisted Combat Performance
          </h2>
          <p className="mt-4 text-sm text-text-secondary leading-relaxed">
            Athlix features built-in, secure assistant modules designed to optimize training schedules, pair you with optimal coaches, and structure competitive draws.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpotlightCard className="bg-secondary border border-border rounded-sm p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
            <div>
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center mb-6">
                <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-display font-black uppercase tracking-wide mb-3">Training Plan Generator</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                Draft customized drills and weekly scheduling routines. The assistant parses your belt rank, discipline history, and time constraints to generate target mat work and technical guidelines.
              </p>
            </div>
            <div className="bg-surface border border-border/40 p-4 rounded-sm font-mono text-[9px] text-text-secondary">
              <div className="flex justify-between border-b border-border/30 pb-1.5 mb-2 font-bold uppercase text-[8px]">
                <span>DRILLS GENERATOR</span>
                <span className="text-primary font-bold">COMPILING...</span>
              </div>
              <span className="block font-bold text-text-primary">5 Guard Retention Reps</span>
              <span className="block text-text-tertiary">30 mins mat work • Tuesday</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="bg-secondary border border-border rounded-sm p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
            <div>
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center mb-6">
                <User className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-display font-black uppercase tracking-wide mb-3">Coach Matchmaker</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                Find the perfect training partner. The matching engine evaluates coach certifications, availability slots, locations, and pricing to calculate compatibility and present logical fit rationales.
              </p>
            </div>
            <div className="bg-surface border border-border/40 p-4 rounded-sm font-mono text-[9px] text-text-secondary">
              <div className="flex justify-between border-b border-border/30 pb-1.5 mb-2 font-bold uppercase text-[8px]">
                <span>COMPATIBILITY FIT</span>
                <span className="text-accent-gold font-bold tabular-data">94% MATCH</span>
              </div>
              <span className="block font-bold text-text-primary">Prof. Thiago Valente</span>
              <span className="block text-text-tertiary">BJJ • 10:30 AM Slot Available</span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="bg-secondary border border-border rounded-sm p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
            <div>
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center mb-6">
                <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-display font-black uppercase tracking-wide mb-3">Bracket Seeding</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                Run objective and balanced tournament matchups. The seeding utility computes student rank statistics and records to automate the bracket seeding process, minimizing manual grouping errors.
              </p>
            </div>
            <div className="bg-surface border border-border/40 p-4 rounded-sm font-mono text-[9px] text-text-secondary">
              <div className="flex justify-between border-b border-border/30 pb-1.5 mb-2 font-bold uppercase text-[8px]">
                <span>SEEDING LOG</span>
                <span className="text-success font-bold">COMPLETE</span>
              </div>
              <span className="block font-bold text-text-primary">Seed 1: Thiago Valente</span>
              <span className="block text-text-tertiary">Based on tournament history</span>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono mb-4">
            Academy Review
          </span>
          <p className="text-lg sm:text-xl text-text-primary italic leading-relaxed max-w-3xl">
            &ldquo;We managed our entire 400-student summer tournament bracket inside Athlix. It saved our front desk 12 hours of manual registration sorting and kept our brackets updating in real-time.&rdquo;
          </p>
          <div className="flex items-center gap-3.5 mt-8">
            <div className="h-10 w-10 bg-primary/20 flex items-center justify-center font-bold text-primary text-xs rounded-full font-mono uppercase border border-primary/30">
              TV
            </div>
            <div className="text-left font-mono">
              <span className="block text-xs font-bold text-text-primary uppercase">Prof. Thiago Valente</span>
              <span className="block text-[10px] text-text-secondary">Head Instructor, Apex Grappling Lab</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-28 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={shouldReduce ? {} : fadeUp()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-secondary border border-border rounded-sm p-8 sm:p-14 relative overflow-hidden"
        >
          <h2 className="text-2xl sm:text-4xl font-display font-black text-text-primary uppercase tracking-wide">
            Ready to Track Your Career?
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
