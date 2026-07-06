'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, Shield, Building2, ChevronDown, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Link from 'next/link';
import { cn } from '../../lib/utils';

const tiers = [
  {
    name: 'Athlete',
    icon: Shield,
    priceMonthly: 0,
    priceAnnual: 0,
    period: 'forever free',
    desc: 'Track sparring milestones and log your personal belt promotions.',
    cta: 'Get Started Free',
    href: '/signup',
    popular: false,
    premium: false,
    accent: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
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
    href: '/signup',
    popular: true,
    premium: false,
    accent: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
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
    href: '/signup',
    popular: false,
    premium: true,
    accent: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
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
  { q: 'Can I switch plans at any time?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.' },
  { q: 'Is there a free trial for paid plans?', a: 'We offer a 14-day free trial on both the Coach and Academy tiers — no credit card required.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal through our Stripe-powered payment gateway.' },
  { q: 'Can multiple coaches share an Academy account?', a: 'Yes! Academy plans include up to 10 coach sub-accounts, each with their own booking calendar and client roster.' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } } };

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* ── Header ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/8 text-accent text-xs font-semibold mb-6">
            <Building2 className="w-3 h-3" /> Subscription Tiers
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold font-display tracking-tight text-text-primary mb-4">
            Plans Built for{' '}
            <span className="bg-gradient-to-r from-accent via-accent-light to-accent-gold bg-clip-text text-transparent">
              Fighters
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-text-secondary text-lg max-w-2xl mx-auto">
            Transparent tiers built for martial artists, private coach calendars, and multi-location school chains.
          </motion.p>

          {/* Toggle */}
          <motion.div variants={fadeUp} className="flex justify-center items-center gap-4 mt-8">
            <span className={cn('text-sm font-semibold transition-colors', !isAnnual ? 'text-text-primary' : 'text-text-tertiary')}>Monthly</span>
            <button
              onClick={() => setIsAnnual(v => !v)}
              aria-label="Toggle billing period"
              className={cn(
                'relative w-12 h-6 rounded-full border transition-colors duration-300',
                isAnnual ? 'bg-accent border-accent/50' : 'bg-surface border-border'
              )}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn('absolute top-1 w-4 h-4 rounded-full shadow-sm', isAnnual ? 'left-7 bg-white' : 'left-1 bg-text-tertiary')}
              />
            </button>
            <span className={cn('text-sm font-semibold flex items-center gap-2 transition-colors', isAnnual ? 'text-text-primary' : 'text-text-tertiary')}>
              Annual
              <span className="text-[10px] font-black bg-success/15 text-success border border-success/25 px-2 py-0.5 rounded-full">SAVE 20%</span>
            </span>
          </motion.div>
        </motion.div>

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {tiers.map((tier, i) => {
            const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            const Icon = tier.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5, ease: 'easeOut' }}
                className="relative"
              >
                {/* Badge */}
                {(tier.popular || tier.premium) && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
                    <span className={cn(
                      'text-xs font-extrabold px-4 py-1 rounded-full shadow-lg tracking-wide',
                      tier.popular
                        ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-accent/30'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black shadow-amber-400/30'
                    )}>
                      {tier.popular ? 'MOST POPULAR' : 'CHAMPION TIER'}
                    </span>
                  </div>
                )}

                <div className={cn(
                  'h-full flex flex-col p-7 rounded-2xl border bg-surface transition-all duration-300 hover:shadow-lg',
                  tier.popular
                    ? 'border-accent/40 ring-1 ring-accent/20 shadow-md shadow-accent/10'
                    : tier.premium
                      ? 'border-amber-400/30 ring-1 ring-amber-400/15'
                      : 'border-border hover:border-accent/25',
                  tier.popular && 'pt-9'
                )}>

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', tier.bg, tier.border)}>
                      <Icon className={cn('w-5 h-5', tier.accent)} />
                    </div>
                    <span className="font-extrabold font-display text-lg text-text-primary">{tier.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-end gap-1 mb-2">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={price}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="text-5xl font-extrabold font-display tracking-tight text-text-primary"
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

                  <div className="h-px bg-border my-5" />

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-7">
                    {tier.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-sm text-text-secondary">
                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border', tier.bg, tier.border)}>
                          <Check className={cn('w-3 h-3', tier.accent)} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={tier.href}>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full py-3 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer',
                        tier.popular
                          ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-md shadow-accent/25 hover:shadow-accent/40'
                          : tier.premium
                            ? 'border border-amber-400/50 text-amber-400 hover:bg-amber-400/10 bg-transparent'
                            : 'border border-border text-text-primary hover:border-accent/40 hover:bg-accent/5 bg-transparent'
                      )}
                    >
                      {tier.cta}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface text-text-tertiary text-xs font-semibold mb-4">
              FAQ
            </div>
            <h2 className="text-3xl font-extrabold font-display text-text-primary">Common Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.3 }}
                className="rounded-2xl border border-border bg-surface overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-hover transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-text-primary pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4.5 h-4.5 text-text-tertiary shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-text-secondary text-sm leading-relaxed border-t border-border pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Trust Strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <p className="text-xs text-text-tertiary uppercase tracking-widest font-medium">
              Secure payments powered by Stripe · PCI DSS Compliant · 256-bit SSL
            </p>
          </div>
          <div className="flex justify-center items-center gap-6 opacity-30">
            {['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL'].map(b => (
              <span key={b} className="font-extrabold text-sm text-text-primary">{b}</span>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
