'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Zap, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function AboutPage() {
  const team = [
    { name: 'PRATIK', role: 'Project Lead', desc: 'Project lead working across application development, deployment setup, and integration.' },
    { name: 'ANUJA', role: 'UI/UX Design', desc: 'Lead designer responsible for visual theme systems, layout spacing tokens, and clean athletic style systems.' },
    { name: 'KIRAT', role: 'Frontend Architect', desc: 'React engineer managing responsive grid layouts, calendar scheduling components, and form validators.' },
    { name: 'SHRAVAN', role: 'Backend Developer', desc: 'Backend contributor working on database models, API validation, and tournament workflows.' }
  ];

  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Asymmetric Header Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
            >
              <Sparkles className="h-3.5 w-3.5" /> Core objective
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase text-text-primary"
            >
              WE BUILD FOR <br />
              <span className="text-primary">FIGHTERS & GYMS</span>
            </motion.h1>
          </div>

          <div className="lg:col-span-6 lg:pt-14">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.35 }}
              className="text-sm sm:text-base text-text-secondary leading-relaxed"
            >
              ATHLIX is a development project exploring a simpler way to coordinate combat-sports clubs and local events. Our proposed first pilot focuses on karate academies and tournament organizers. Customer demand, geography, and the pilot scope still need validation.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Asymmetric Core Values Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border/60">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Users className="h-5 w-5 text-primary" />,
              title: "Unified Profile",
              desc: "Athlete accounts and profiles form the foundation. Full training timelines remain in development."
            },
            {
              icon: <Zap className="h-5 w-5 text-primary" />,
              title: "Direct Bookings",
              desc: "Booking APIs are being hardened. Directory examples do not establish live availability or verified credentials."
            },
            {
              icon: <Award className="h-5 w-5 text-primary" />,
              title: "Digital Brackets",
              desc: "Event registration and organizer-managed brackets are the first workflow to validate with real club data."
            },
            {
              icon: <Shield className="h-5 w-5 text-primary" />,
              title: "Data Verification",
              desc: "Professional privileges require approval. Roles do not certify sporting credentials or safeguarding checks."
            }
          ].map((item, idx) => (
            <SpotlightCard key={idx} className="bg-secondary p-6 rounded-sm border border-border flex flex-col justify-between h-56">
              <div>
                <div className="mb-4 bg-background/50 w-8 h-8 rounded-sm flex items-center justify-center border border-border/30">{item.icon}</div>
                <h3 className="text-sm font-bold text-text-primary mb-2 font-mono uppercase tracking-wide">{item.title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{item.desc}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Asymmetric Team Grid */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-display font-black uppercase tracking-wide">PROJECT CONTRIBUTORS</h2>
            <p className="mt-3 text-text-secondary text-xs leading-relaxed max-w-xs font-mono uppercase">
              Contributors listed in the project repository. No corporate incorporation or external partnership is implied.
            </p>
          </div>
          
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {team.map((t, idx) => (
              <SpotlightCard key={idx} className="bg-secondary p-6 border border-border flex flex-col justify-between h-52">
                <div>
                  <span className="text-[9px] font-bold text-primary font-mono tracking-widest uppercase">{t.role}</span>
                  <h3 className="text-lg font-display font-black text-text-primary mt-1 uppercase tracking-wide">{t.name}</h3>
                  <p className="text-text-secondary text-xs mt-3 leading-relaxed">{t.desc}</p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
