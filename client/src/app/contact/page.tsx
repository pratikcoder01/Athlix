'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Phone, MessageSquare, Clock, Globe } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import { GlassCard } from '../../components/shared/GlassCard';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';

const contactInfo = [
  { icon: MapPin, label: 'HQ Location', value: 'San Francisco, California', color: 'text-blue-400 bg-blue-400/10' },
  { icon: Mail, label: 'Email', value: 'support@athlix.com', color: 'text-accent bg-accent/10' },
  { icon: Phone, label: 'Phone', value: '+91 88799 81125', color: 'text-green-400 bg-green-400/10' },
  { icon: Clock, label: 'Response Time', value: 'Within 24 hours', color: 'text-amber-400 bg-amber-400/10' },
];

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message transmitted to the Athlix team.');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex">
            <AnimatedBadge variant="accent" glow>
              <MessageSquare className="w-3 h-3 mr-1.5" /> Get in Touch
            </AnimatedBadge>
          </motion.div>
          <AnimatedText
            text="Contact the Builders"
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-lg max-w-2xl mx-auto"
          >
            Connect directly with our team for school registrations, bracket configurations, or system onboarding.
          </motion.p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {contactInfo.map(({ icon: Icon, label, value, color }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 + 0.2 }}
            >
              <GlassCard padding="md" variant="interactive" className="text-center h-full">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Map placeholder */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard variant="glow" padding="none" className="h-full min-h-[400px] relative overflow-hidden">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-4"
                  >
                    <Globe className="w-7 h-7 text-accent" />
                  </motion.div>
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.4 + i * 0.2], opacity: [0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.3, ease: 'easeOut' }}
                      className="absolute w-14 h-14 rounded-full border border-accent/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                  ))}
                  <h3 className="font-black text-lg mb-2">Athlix HQ</h3>
                  <p className="text-text-secondary text-sm mb-1">San Francisco, CA</p>
                  <p className="text-text-tertiary text-xs">Remote-first team — global coverage</p>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Right: Contact form */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard padding="lg">
                <h3 className="font-black text-lg mb-6">Send a Message</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Full Name</label>
                      <input
                        type="text"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Email</label>
                      <input
                        type="email"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Subject</label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      placeholder="e.g. Gym onboarding request"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Message</label>
                    <textarea
                      rows={5}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                      placeholder="Tell us about your needs..."
                      required
                    />
                  </div>

                  <MagneticButton type="submit" variant="premium" className="w-full justify-center">
                    <Send className="w-4 h-4 mr-2" /> Send Message
                  </MagneticButton>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
