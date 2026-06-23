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
    alert('Message sent successfully to the ATHLIX engineering team!');
  };

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
          <Sparkles className="h-3.5 w-3.5" /> ENGAGE
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-5xl sm:text-7xl font-black font-display tracking-tight uppercase"
        >
          TALK TO FOUNDERS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
        >
          Reach out to the ATHLIX core engineering team or founders for custom enterprise sponsorships, tournament registrations, and onboarding support.
        </motion.p>
      </section>

      {/* Grid of details and form */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SpotlightCard className="bg-secondary p-6 border border-border">
              <div className="flex gap-4 items-center">
                <MapPin className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h4 className="font-bold font-display uppercase tracking-wide">HQ Location</h4>
                  <p className="text-text-secondary text-sm">Silicon Valley, San Francisco, CA</p>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bg-secondary p-6 border border-border">
              <div className="flex gap-4 items-center">
                <Mail className="h-6 w-6 text-secondary-accent shrink-0" />
                <div>
                  <h4 className="font-bold font-display uppercase tracking-wide">Developer Support</h4>
                  <p className="text-text-secondary text-sm">support@athlix.com</p>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bg-secondary p-6 border border-border">
              <div className="flex gap-4 items-center">
                <Phone className="h-6 w-6 text-success shrink-0" />
                <div>
                  <h4 className="font-bold font-display uppercase tracking-wide">Phone Direct</h4>
                  <p className="text-text-secondary text-sm">+1 (555) 480-1234</p>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Right panel: Contact Form */}
          <div className="lg:col-span-2">
            <SpotlightCard className="bg-secondary p-8 border border-border">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Full Name</label>
                    <input
                      type="text"
                      className="bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Email Address</label>
                    <input
                      type="email"
                      className="bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Subject Scope</label>
                  <input
                    type="text"
                    className="bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Academy onboarding request"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Your Message</label>
                  <textarea
                    rows={5}
                    className="bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                    placeholder="Type details..."
                    required
                  />
                </div>

                <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-md font-bebas tracking-widest text-sm">
                  <Send className="h-4 w-4 mr-2 inline" /> TRANSMIT MESSAGE
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
