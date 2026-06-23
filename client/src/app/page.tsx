'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, ChevronRight, Activity, Calendar, Sparkles } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import SpotlightCard from '../components/shared/SpotlightCard';
import R3FBackground from '../components/shared/R3FBackground';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="relative min-h-screen bg-background text-text-primary transition-colors duration-300 overflow-hidden">
      {/* 3D Background Canvas */}
      <R3FBackground />

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase mb-6 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5 animate-spin" /> THE NEW STANDARD FOR COMBAT SPORTS
        </motion.div>

        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="text-5xl sm:text-8xl font-black font-display tracking-tight leading-[0.9] max-w-4xl"
        >
          THE COMBAT <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-accent to-gold">
            SPORTS ENGINE
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed"
        >
          ATHLIX is a premium next-gen tech ecosystem for martial artists, coaches, academies, and tournament organizers. Level up calendars, brackets, and social feed in one unified dark premium engine.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <Link href="/signup">
            <MagneticButton className="bg-primary hover:bg-opacity-95 text-white font-bold py-3.5 px-8 rounded-md font-bebas tracking-widest text-sm shadow-lg shadow-primary/20">
              CREATE ATHLETE PROFILE
            </MagneticButton>
          </Link>
          <Link href="/about">
            <MagneticButton className="bg-surface hover:bg-opacity-80 text-text-primary font-bold py-3.5 px-8 rounded-md font-bebas tracking-widest text-sm border border-border">
              EXPLORE PLATFORM
            </MagneticButton>
          </Link>
        </motion.div>
      </section>

      {/* Grid Features Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-wide uppercase">
            ENGINEERED TO BUILD CHAMPIONS
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
            Stripe-style visual cards highlighting all structural elements to level up combat academies and tournament registries.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-wide mb-3 uppercase">Athlete Progression</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Track belt levels, sparring clips, weight categories, and workout performance analytics in an interactive timeline interface.
                </p>
              </div>
              <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-primary tracking-widest hover:translate-x-1 transition-transform font-bebas">
                LEARN MORE <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </SpotlightCard>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between" glowColor="rgba(247, 181, 0, 0.15)">
              <div>
                <div className="h-12 w-12 rounded-lg bg-gold/10 flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-wide mb-3 uppercase">Real-Time Bookings</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Schedule private training slots instantly. Coaches customize pricing structures and availability, and automated alerts keep clients synced.
                </p>
              </div>
              <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-gold tracking-widest hover:translate-x-1 transition-transform font-bebas">
                LEARN MORE <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </SpotlightCard>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="h-full border border-border bg-secondary flex flex-col justify-between" glowColor="rgba(34, 197, 94, 0.15)">
              <div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-6">
                  <Award className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-wide mb-3 uppercase">Tournament Brackets</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Generate digital single/double elimination brackets automatically. Organizers manage rules, entries, and publish live results.
                </p>
              </div>
              <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-success tracking-widest hover:translate-x-1 transition-transform font-bebas">
                LEARN MORE <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </SpotlightCard>
          </motion.div>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 bg-secondary/30 border-t border-b border-border py-20 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "15K+", label: "ACTIVE FIGHTERS" },
            { value: "98.7%", label: "BOOKING ACCURACY" },
            { value: "450+", label: "TOURNAMENTS RUN" },
            { value: "24/7", label: "REAL-TIME ALERTS" }
          ].map((stat, idx) => (
            <div key={idx}>
              <span className="text-4xl sm:text-6xl font-extrabold font-mono tracking-tight text-primary">
                {stat.value}
              </span>
              <p className="text-xs font-bold tracking-widest text-text-secondary mt-2 uppercase font-sans">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <div className="bg-secondary border border-border rounded-2xl p-8 sm:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight uppercase leading-none">
            READY TO JOIN THE ARENA?
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
            Create your profile as an athlete, list your academy directory, or organize structural brackets in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/signup">
              <MagneticButton className="bg-primary hover:bg-opacity-95 text-white font-bold py-3 px-8 rounded-md font-bebas tracking-widest text-sm">
                GET STARTED NOW
              </MagneticButton>
            </Link>
            <Link href="/contact">
              <MagneticButton className="bg-surface hover:bg-opacity-80 text-text-primary font-bold py-3 px-8 rounded-md font-bebas tracking-widest text-sm border border-border">
                TALK TO FOUNDER
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
