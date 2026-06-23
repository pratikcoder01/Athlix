'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Award, Target, Eye, Code, Layers, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function FeaturesPage() {
  const featuresList = [
    {
      icon: <Layers className="h-6 w-6 text-primary" />,
      title: "Athlete Timelines",
      desc: "Post sparring highlights, tag coaches, log weight checks, and track belt rank achievements on a dedicated digital timeline."
    },
    {
      icon: <Zap className="h-6 w-6 text-secondary-accent" />,
      title: "Coaching Availability",
      desc: "Customize pricing structures, schedule weekly time slots, auto-confirm private bookings, and handle requests instantly."
    },
    {
      icon: <Award className="h-6 w-6 text-gold" />,
      title: "Bracket Generation",
      desc: "Generate tournament trees. Supports single and double elimination styles, direct registration signups, and live results updates."
    },
    {
      icon: <Target className="h-6 w-6 text-success" />,
      title: "Geospatial Discovery",
      desc: "Locate nearby academies or coaches using dynamic coordinates maps with distance, discipline, and user rating filters."
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Role Security Control",
      desc: "Guarded routes for Coaches, Athletes, Academy Owners, and Tournament Organizers powered by JWT and Zod verification."
    },
    {
      icon: <Code className="h-6 w-6 text-text-secondary" />,
      title: "Clean APIs & Webhook Gates",
      desc: "Built on typescript interfaces, express rate limiters, and MongoDB Atlas database index configurations for speed."
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase mb-6 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5" /> PLATFORM CAPABILITIES
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-5xl sm:text-7xl font-black font-display tracking-tight uppercase"
        >
          ENGINE FEATURES
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
        >
          ATHLIX packs features built specifically for combat sports to coordinate training, events, and community feed workflows.
        </motion.p>
      </section>

      {/* Grid of features */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((f, idx) => (
            <SpotlightCard key={idx} className="bg-secondary p-8 border border-border flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold font-display uppercase tracking-wide mb-3">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
