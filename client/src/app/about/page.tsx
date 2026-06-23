'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Zap, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function AboutPage() {
  const team = [
    { name: 'PRATIK', role: 'Project Lead & Full Stack Integration', desc: 'DevOps wizard, Cloudinary pipeline architect, git workflow manager, and chief product designer.' },
    { name: 'ANUJA', role: 'UI/UX Lead Designer', desc: 'Figma designer, design token manager, and orchestrator of modern dark sports-tech micro-animations.' },
    { name: 'KIRAT', role: 'Lead Frontend Developer', desc: 'React 19 engineer, forms builder, query hydration configurer, and responsive layouts dev.' },
    { name: 'SHRAVAN', role: 'Lead Backend Developer', desc: 'Node + Express TS API developer, Mongoose schema creator, rate limits builder, and Socket.io channel architect.' }
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
          <Sparkles className="h-3.5 w-3.5" /> BEHIND THE ENGINE
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-5xl sm:text-7xl font-black font-display tracking-tight uppercase"
        >
          WE ARE <span className="text-primary">ATHLIX</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
        >
          ATHLIX was founded with a singular purpose: to modernize the fragmented software powering martial arts. We combine calendar scheduling, digital tournament brackets, and athlete timelines into a unified engine.
        </motion.p>
      </section>

      {/* Grid Values */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Users className="h-6 w-6 text-primary" />,
              title: "Unified network",
              desc: "Connecting athletes, coaches, academies, and brackets under one robust system."
            },
            {
              icon: <Zap className="h-6 w-6 text-secondary-accent" />,
              title: "Real-time Booking",
              desc: "Book and confirm calendars instantly with WebSockets socket updates."
            },
            {
              icon: <Award className="h-6 w-6 text-gold" />,
              title: "Digital brackets",
              desc: "Single and double elimination brackets generated and updated in real-time."
            },
            {
              icon: <Shield className="h-6 w-6 text-success" />,
              title: "Premium security",
              desc: "JWT sessions, express-rate-limit gates, and Zod validator compliance."
            }
          ].map((item, idx) => (
            <SpotlightCard key={idx} className="bg-secondary p-6 rounded-lg border border-border">
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-text-primary mb-2 font-display tracking-wide uppercase">{item.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Founders Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black font-display uppercase">THE FOUNDING TEAM</h2>
          <p className="mt-4 text-text-secondary">The Silicon Valley staff engineers driving the ATHLIX platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {team.map((t, idx) => (
            <SpotlightCard key={idx} className="bg-secondary p-8 border border-border">
              <span className="text-xs font-bold text-primary font-mono tracking-widest uppercase">{t.role}</span>
              <h3 className="text-2xl font-black text-text-primary font-display mt-2 uppercase tracking-wide">{t.name}</h3>
              <p className="text-text-secondary text-sm mt-4 leading-relaxed">{t.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
