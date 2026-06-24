'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Award, Target, Shield, Code, Sparkles, ChevronRight, Check } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Header Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5" /> Capabilities checklist
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase"
        >
          DEVELOPED FOR FIGHTING ACADEMIES
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="mt-6 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Our components are built specifically to handle the schedules, matchmaking logistics, and progression tracking requirements of modern martial arts schools.
        </motion.p>
      </section>

      {/* Stacked, Alternating Feature Showcases (No simple 3-card grid) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border/60 mb-24">
        <div className="flex flex-col gap-28">
          
          {/* Feature 1: Athlete Progression Timelines */}
          <div id="progression" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col items-start">
              <div className="h-8 w-8 rounded-sm bg-surface flex items-center justify-center border border-border/30 mb-4">
                <Layers className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase font-mono">01. CAREER TIMELINES</span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
                FIGHTER PROFILE & RANK stripe TRACKING
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-lg">
                Log weekly weights, archive rolling clips, and track progress toward your next stripe or belt. Instructors verify stripes directly from their console, updating student records instantly.
              </p>
            </div>
            
            <div className="lg:col-span-6">
              <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
                  <span>TIMELINE: MARCUS SILVA</span>
                  <span className="text-primary font-bold">STREAK: 12 WEEKS</span>
                </div>
                <div className="flex flex-col gap-4 pl-3 relative border-l border-border/60 ml-2">
                  <div className="relative">
                    <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-border-strong border border-background"></span>
                    <span className="font-bold text-text-primary">Gi Sparring Logs Submitted</span>
                    <span className="block text-[9px] text-text-tertiary mt-0.5">3 hours logged • Coach Renato</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-primary border border-background animate-pulse"></span>
                    <span className="font-bold text-primary">Stripe Added to Blue Belt</span>
                    <span className="block text-[9px] text-text-secondary mt-0.5">Verified by Prof. Renato Silva</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Coach Availability & Bookings */}
          <div id="bookings" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
                  <span>COACH AVAILABILITY GRID</span>
                  <span className="text-success font-bold">AUTOMATED</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center p-2 bg-background/50 border border-border/30 rounded-sm">
                    <span className="font-bold text-text-primary">Prof. Renato (BJJ)</span>
                    <span className="text-primary font-bold">$90/hr</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-background/50 border border-border/30 rounded-sm">
                    <span className="font-bold text-text-primary">Coach Kru Somchai (MT)</span>
                    <span className="text-primary font-bold">$75/hr</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6 flex flex-col items-start order-1 lg:order-2">
              <div className="h-8 w-8 rounded-sm bg-surface flex items-center justify-center border border-border/30 mb-4">
                <Zap className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase font-mono">02. PRIVATE INSTRUCTION</span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
                AUTOMATED CALENDARS & SLOT BOOKINGS
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-lg">
                Coaches post calendar availability and pricing rates. Students choose time slots, confirm payments directly, and schedule private sparring instructions without phone tag.
              </p>
            </div>
          </div>

          {/* Feature 3: Tournament Brackets */}
          <div id="brackets" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col items-start">
              <div className="h-8 w-8 rounded-sm bg-surface flex items-center justify-center border border-border/30 mb-4">
                <Award className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase font-mono">03. TOURNAMENT SYSTEMS</span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
                REAL-TIME MATCH MATCHMAKING BRACKETS
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-lg">
                Generate single or double elimination trees. Competitors track match status, view active mat schedules, and watch live bracket updates directly on their mobile viewports.
              </p>
            </div>
            
            <div className="lg:col-span-6">
              <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
                  <span>LIVE MATCH PORTAL</span>
                  <span className="text-primary font-bold">SEMIFINALS</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-2.5 bg-background/60 border border-border/40 rounded-sm flex justify-between items-center">
                    <span className="font-bold text-text-primary">Marcus Silva</span>
                    <span className="text-xs text-primary font-bold">W (Armbar)</span>
                  </div>
                  <div className="p-2.5 bg-background/30 border border-border/20 rounded-sm opacity-50 flex justify-between items-center">
                    <span>John Doe</span>
                    <span className="text-xs">L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Discovery, Security, and APIs */}
          <div id="coaches" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-secondary border border-border p-6 rounded-sm font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-3 mb-4">
                  <span>API SYSTEM SCHEMAS</span>
                  <span className="text-primary font-bold">HTTPS/REST</span>
                </div>
                <pre className="text-[10px] text-text-secondary overflow-x-auto">
{`{
  "athlete": "Marcus Silva",
  "belt": "Purple",
  "stripes": 3,
  "verified": true,
  "academy": "Renzo Gracie SF"
}`}
                </pre>
              </div>
            </div>
            
            <div className="lg:col-span-6 flex flex-col items-start order-1 lg:order-2">
              <div className="h-8 w-8 rounded-sm bg-surface flex items-center justify-center border border-border/30 mb-4">
                <Shield className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase font-mono">04. CLUBS & SECURITY</span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
                VERIFIED DIRECTORIES & STABLE APIS
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-lg">
                Discover academies by geographic coordinates map searches. Rest assured that student privacy, session ratings, and admin controls are backed by JWT sessions and validation parameters.
              </p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
