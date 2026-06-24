'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const tiers = [
    {
      name: 'ATHLETE',
      priceMonthly: 0,
      priceAnnual: 0,
      period: 'forever',
      desc: 'Track sparring milestones and log your personal belt promotions.',
      features: [
        'Personal profile & belt tracker',
        'Upload sparring highlights to feed',
        'Discover nearby academies & coaches',
        'Register for live tournaments',
        '100MB media storage limits'
      ]
    },
    {
      name: 'COACH',
      priceMonthly: 29,
      priceAnnual: 23,
      period: 'per month',
      desc: 'List availability, confirm appointments, and collect payments directly.',
      features: [
        'Everything in Athlete tier',
        'Coaching calendar slot manager',
        'Automatic client booking flow',
        'Custom pricing structures',
        '5GB high-speed media storage',
        'Real-time booking alert channels'
      ],
      popular: true
    },
    {
      name: 'ACADEMY',
      priceMonthly: 99,
      priceAnnual: 79,
      period: 'per month',
      desc: 'Organize rosters, track class attendance, and generate tournaments.',
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
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Pricing Header */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5" /> SUBSCRIPTION MODULES
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase"
        >
          PLANS CONFIGURABLE FOR YOUR GYM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="mt-6 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Transparent tiers built specifically to scale martial artists, private coach calendars, and multi-location school chains.
        </motion.p>

        {/* Monthly/Annual Toggle */}
        <div className="mt-10 flex justify-center items-center gap-4">
          <span className={`text-xs font-bold font-mono uppercase ${!isAnnual ? 'text-primary' : 'text-text-secondary'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-surface border border-border flex items-center p-1 cursor-pointer transition-colors relative"
            aria-label="Toggle annual billing"
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`h-4 w-4 rounded-full bg-primary ${isAnnual ? 'ml-6' : ''}`}
            />
          </button>
          <span className={`text-xs font-bold font-mono uppercase ${isAnnual ? 'text-primary' : 'text-text-secondary'} flex items-center gap-1.5`}>
            Annual Billing <span className="bg-primary/10 border border-primary/20 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-sm">SAVE 20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-border/60 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => {
            const currentPrice = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            return (
              <SpotlightCard
                key={idx}
                className={`bg-secondary p-8 border rounded-sm flex flex-col justify-between h-[520px] ${
                  tier.popular ? 'border-primary shadow-lg shadow-primary/5' : 'border-border'
                }`}
                glowColor={tier.popular ? 'rgba(255, 90, 61, 0.2)' : undefined}
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold font-mono tracking-widest text-text-secondary uppercase">{tier.name}</span>
                    {tier.popular && (
                      <span className="bg-primary/10 border border-primary/25 text-primary text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        MOST POPULAR
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-text-primary">
                      ${currentPrice}
                    </span>
                    <span className="text-text-secondary text-xs font-bold font-mono ml-1.5 uppercase">
                      / {tier.priceMonthly === 0 ? 'forever' : isAnnual ? 'annual (monthly rate)' : 'month'}
                    </span>
                  </div>

                  <p className="text-text-secondary text-xs leading-relaxed mb-6 h-12">{tier.desc}</p>
                  <hr className="border-border/40 my-4" />

                  <ul className="flex flex-col gap-2.5 mb-8">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-text-secondary leading-snug">
                        <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <MagneticButton
                  className={`w-full py-3 rounded-sm font-bold font-mono tracking-wider text-xs uppercase ${
                    tier.popular ? 'bg-primary hover:bg-opacity-95 text-white' : 'bg-surface hover:bg-opacity-80 text-text-primary border border-border'
                  }`}
                >
                  SELECT {tier.name}
                </MagneticButton>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Payment Verification strip underneath cards */}
        <div className="mt-16 text-center">
          <p className="text-[10px] font-bold font-mono tracking-wider text-text-secondary uppercase mb-4">
            SECURE CREDIT CARD GATES POWERED BY STRIPE
          </p>
          <div className="flex justify-center items-center gap-4 text-text-tertiary">
            <svg className="h-6 w-10" viewBox="0 0 36 24" fill="currentColor">
              <rect width="36" height="24" rx="2" fill="currentColor" opacity="0.05" />
              <path d="M12 16h2l1.2-5h-2L12 16z M24 11c-0.6-0.3-1.3-0.5-2-0.5-2.2 0-3.8 1.2-3.8 2.9 0 1.2 1.1 1.9 2 2.3 0.9 0.4 1.2 0.7 1.2 1.1 0 0.6-0.7 0.9-1.3 0.9-1.7 0-2.4-0.3-3.2-0.7l-0.4 2.2c0.6 0.3 1.8 0.5 3 0.5 2.3 0 3.8-1.1 3.8-2.9 0-1-0.6-1.7-1.9-2.3-0.8-0.4-1.3-0.7-1.3-1.1 0-0.4 0.4-0.8 1.3-0.8 0.8 0 1.4 0.2 1.9 0.4l0.4-2.1z" />
            </svg>
            <svg className="h-6 w-10" viewBox="0 0 36 24" fill="currentColor">
              <rect width="36" height="24" rx="2" fill="currentColor" opacity="0.05" />
              <circle cx="15" cy="12" r="6" fill="currentColor" opacity="0.3" />
              <circle cx="21" cy="12" r="6" fill="currentColor" opacity="0.3" />
            </svg>
            <span className="text-[9px] font-bold font-mono tracking-widest bg-secondary border border-border px-2.5 py-1 rounded opacity-50 uppercase">
              PCI COMPLIANCE SECURED
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
