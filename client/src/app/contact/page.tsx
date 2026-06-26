'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Phone, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message transmitted to the Athlix team.');
  };

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
          <Sparkles className="h-3.5 w-3.5" /> Direct lines
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase"
        >
          CONTACT THE BUILDERS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="mt-6 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Connect directly with our engineering team for school registrations, bracket configurations, or system onboarding.
        </motion.p>
      </section>

      {/* Info details & form layout */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border/60 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SpotlightCard className="bg-secondary p-6 border border-border rounded-sm">
              <div className="flex gap-4 items-center">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-text-primary">HQ LOCATION</h4>
                  <p className="text-text-secondary text-xs mt-1 font-sans">San Francisco, California</p>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bg-secondary p-6 border border-border rounded-sm">
              <div className="flex gap-4 items-center">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-text-primary">DIRECT EMAIL</h4>
                  <p className="text-text-secondary text-xs mt-1 font-sans">support@athlix.com</p>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bg-secondary p-6 border border-border rounded-sm">
              <div className="flex gap-4 items-center">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-text-primary">CONTACT TELEPHONE</h4>
                  <p className="text-text-secondary text-xs mt-1 font-sans">+1 (415) 555-1234</p>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Right panel: Contact Form */}
          <div className="lg:col-span-2">
            <SpotlightCard className="bg-secondary p-8 border border-border rounded-sm">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Full name</label>
                    <input
                      type="text"
                      className="bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                      placeholder="Lucas Vianna"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Email address</label>
                    <input
                      type="email"
                      className="bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                      placeholder="marcus@graciesf.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Subject</label>
                  <input
                    type="text"
                    className="bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                    placeholder="e.g. Gym onboarding request"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Message details</label>
                  <textarea
                    rows={5}
                    className="bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                    placeholder="Provide details..."
                    required
                  />
                </div>

                <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase">
                  <Send className="h-4.5 w-4.5 mr-2 inline" /> TRANSMIT INQUIRY
                </MagneticButton>
              </form>
            </SpotlightCard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
