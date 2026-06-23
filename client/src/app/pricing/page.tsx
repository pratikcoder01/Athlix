'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function PricingPage() {
  const tiers = [
    {
      name: 'ATHLETE',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for combat sports practitioners tracking their progress.',
      features: [
        'Personal profile & belt tracker',
        'Upload sparring clips to feed',
        'Discover nearby academies & coaches',
        'Register for live tournaments',
        '100MB media storage limits'
      ]
    },
    {
      name: 'COACH',
      price: '$29',
      period: 'per month',
      desc: 'Designed for professional coaches managing private schedules.',
      features: [
        'Everything in Athlete tier',
        'Coaching calendar slot manager',
        'Automatic client booking flow',
        'Custom pricing structures',
        '5GB high-speed media storage',
        'Real-time WebSocket chat alerts'
      ],
      popular: true
    },
    {
      name: 'ACADEMY',
      price: '$99',
      period: 'per month',
      desc: 'Built for martial arts schools and gyms expanding directories.',
      features: [
        'Everything in Coach tier',
        'Academy directory map listing',
        'Geospatial search optimization',
        'Manage member registrations',
        'Create in-house local tournaments',
        'Unlimited image/video gallery upload'
      ]
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
          <Sparkles className="h-3.5 w-3.5" /> MEMBERSHIPS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-5xl sm:text-7xl font-black font-display tracking-tight uppercase"
        >
          ELITE SUBSCRIPTIONS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
        >
          Transparent pricing configured specifically to scale martial artists, private instruction calendars, and school networks.
        </motion.p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => (
            <SpotlightCard
              key={idx}
              className={`bg-secondary p-8 border ${
                tier.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
              } flex flex-col justify-between`}
              glowColor={tier.popular ? 'rgba(255, 90, 61, 0.25)' : undefined}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold font-mono tracking-widest text-text-secondary uppercase">{tier.name}</span>
                  {tier.popular && (
                    <span className="bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      MOST POPULAR
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-extrabold font-mono tracking-tight text-text-primary">{tier.price}</span>
                  <span className="text-text-secondary text-sm ml-2">/ {tier.period}</span>
                </div>

                <p className="text-text-secondary text-sm mb-6 leading-relaxed">{tier.desc}</p>
                <hr className="border-border my-6" />

                <ul className="flex flex-col gap-3.5 mb-8">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-sm text-text-secondary">
                      <Check className="h-4.5 w-4.5 text-success shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <MagneticButton
                className={`w-full py-3 rounded-md font-bebas tracking-widest text-sm ${
                  tier.popular ? 'bg-primary hover:bg-opacity-95 text-white' : 'bg-surface hover:bg-opacity-80 text-text-primary border border-border'
                }`}
              >
                SELECT {tier.name}
              </MagneticButton>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
