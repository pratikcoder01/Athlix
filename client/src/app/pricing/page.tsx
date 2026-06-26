'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, Shield, Building2, ChevronDown } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import MagneticButton from '../../components/shared/MagneticButton';
import { GlassCard } from '../../components/shared/GlassCard';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';

const tiers = [
  {
    name: 'Athlete',
    icon: Shield,
    priceMonthly: 0,
    priceAnnual: 0,
    period: 'forever free',
    desc: 'Track sparring milestones and log your personal belt promotions.',
    cta: 'Get Started Free',
    variant: 'default' as const,
    features: [
      'Personal profile & belt tracker',
      'Upload sparring highlights to feed',
      'Discover nearby academies & coaches',
      'Register for live tournaments',
      '100MB media storage',
    ],
  },
  {
    name: 'Coach',
    icon: Zap,
    priceMonthly: 29,
    priceAnnual: 23,
    period: 'per month',
    desc: 'List availability, confirm appointments, and collect payments directly.',
    cta: 'Start Coaching',
    popular: true,
    variant: 'glow' as const,
    features: [
      'Everything in Athlete',
      'Coaching calendar slot manager',
      'Automatic client booking flow',
      'Custom pricing structures',
      '5GB high-speed media storage',
      'Real-time booking alert channels',
    ],
  },
  {
    name: 'Academy',
    icon: Crown,
    priceMonthly: 99,
    priceAnnual: 79,
    period: 'per month',
    desc: 'Organize rosters, track class attendance, and generate tournaments.',
    cta: 'Launch Academy',
    premium: true,
    variant: 'interactive' as const,
    features: [
      'Everything in Coach',
      'Academy directory map listing',
      'Geospatial search optimization',
      'Manage member registrations',
      'Create in-house local tournaments',
      'Unlimited image/video gallery upload',
    ],
  },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'We offer a 14-day free trial on both the Coach and Academy tiers — no credit card required.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal through our Stripe-powered payment gateway.',
  },
  {
    q: 'Can multiple coaches share an Academy account?',
    a: 'Yes! Academy plans include up to 10 coach sub-accounts, each with their own booking calendar and client roster.',
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <AnimatedBadge variant="accent" glow>
              <Building2 className="w-3 h-3 mr-1.5" /> Subscription Tiers
            </AnimatedBadge>
          </motion.div>

          <AnimatedText
            text="Plans Built for Fighters"
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-lg max-w-2xl mx-auto"
          >
            Transparent tiers built for martial artists, private coach calendars, and multi-location school chains.
          </motion.p>

          {/* Monthly / Annual Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center items-center gap-4 mt-8"
          >
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-text-primary' : 'text-text-tertiary'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(v => !v)}
              aria-label="Toggle billing period"
              className="relative w-14 h-7 rounded-full bg-surface border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute top-1 h-5 w-5 rounded-full bg-accent shadow-lg shadow-accent/40 ${isAnnual ? 'left-8' : 'left-1'}`}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isAnnual ? 'text-text-primary' : 'text-text-tertiary'}`}>
              Annual
              <span className="text-[10px] font-black bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                SAVE 20%
              </span>
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {tiers.map((tier, idx) => {
            const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            const Icon = tier.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <span className="bg-accent text-black text-xs font-black px-4 py-1 rounded-full shadow-lg shadow-accent/30 tracking-wide">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {tier.premium && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-xs font-black px-4 py-1 rounded-full shadow-lg shadow-amber-400/30 tracking-wide">
                      CHAMPION TIER
                    </span>
                  </div>
                )}

                <GlassCard
                  variant={tier.popular ? 'glow' : 'interactive'}
                  padding="lg"
                  className={`h-full flex flex-col ${tier.popular ? 'ring-1 ring-accent/40' : tier.premium ? 'ring-1 ring-amber-400/40' : ''}`}
                >
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tier.popular ? 'bg-accent/20 text-accent' : tier.premium ? 'bg-amber-400/20 text-amber-400' : 'bg-surface text-text-secondary'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-black text-lg tracking-tight">{tier.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-end gap-1 mb-1">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={price}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="text-5xl font-black font-mono tracking-tight"
                        >
                          ${price}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-text-tertiary text-sm mb-2">
                        /{price === 0 ? 'forever' : isAnnual ? 'mo, billed annually' : 'month'}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{tier.desc}</p>
                  </div>

                  <div className="h-px bg-border my-6" />

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-8">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-sm text-text-secondary">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          tier.popular ? 'bg-accent/20 text-accent' : tier.premium ? 'bg-amber-400/20 text-amber-400' : 'bg-surface text-success'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <MagneticButton
                    variant={tier.popular ? 'premium' : 'outline'}
                    className={`w-full justify-center ${tier.premium ? 'border-amber-400/50 text-amber-400 hover:bg-amber-400/10' : ''}`}
                  >
                    {tier.cta}
                  </MagneticButton>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <AnimatedBadge variant="default" className="mb-4">FAQ</AnimatedBadge>
            <AnimatedText text="Common Questions" className="text-3xl font-black" delay={0} />
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 + 0.3 }}
              >
                <GlassCard padding="none" variant="interactive">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span className="font-semibold pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-text-tertiary shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-text-secondary text-sm leading-relaxed border-t border-border pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-text-tertiary text-xs font-mono"
        >
          <p className="mb-3 uppercase tracking-widest">Secure payments powered by Stripe · PCI DSS Compliant · 256-bit SSL Encryption</p>
          <div className="flex justify-center items-center gap-6 opacity-40">
            <span className="font-bold text-sm">VISA</span>
            <span className="font-bold text-sm">MASTERCARD</span>
            <span className="font-bold text-sm">AMEX</span>
            <span className="font-bold text-sm">PAYPAL</span>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
