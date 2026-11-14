'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Users, Trophy, Brain, TrendingUp, Shield,
  Activity, Zap, Target, MessageSquare, CheckCircle, Play,
  ChevronDown, Flame, Globe, Lock, BarChart3, Sparkles,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import { cn } from '../lib/utils';

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Floating Orb ─────────────────────────────────────────────────────────────
function FloatingOrb({
  className,
  size = 400,
  delay = 0,
}: {
  className?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn('absolute rounded-full blur-3xl pointer-events-none', className)}
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
      transition={{ duration: 6 + delay, ease: 'easeInOut', repeat: Infinity, delay }}
    />
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon?: React.FC<React.SVGProps<SVGSVGElement>>; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface text-xs font-semibold tracking-widest text-text-secondary uppercase">
      {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
      {label}
    </div>
  );
}

// Product scope is explicit: these are development areas, not traction claims.
const features = [
  { icon: Brain, title: 'Kata analysis · experimental', description: '2D pose estimates and rule-based movement feedback. Camera angle and landmark confidence affect results; scores are not a validated measure of skill.', color: 'from-orange-500/20 to-red-500/10', iconColor: 'text-orange-400' },
  { icon: Trophy, title: 'Tournaments · pilot scope', description: 'Authenticated event registration and organizer-managed brackets. Real events require an approved organizer and configured backend.', color: 'from-yellow-500/20 to-amber-500/10', iconColor: 'text-yellow-400' },
  { icon: Users, title: 'Academies · in development', description: 'Academy listing APIs exist. Member records, attendance, and day-to-day school operations still need a complete workflow.', color: 'from-blue-500/20 to-indigo-500/10', iconColor: 'text-blue-400' },
  { icon: BarChart3, title: 'Progress · in development', description: 'Profile and analysis data are a starting point. Some dashboards are sample screens; they do not represent measured customer activity.', color: 'from-green-500/20 to-emerald-500/10', iconColor: 'text-green-400' },
  { icon: Target, title: 'Coaching · in development', description: 'Booking and coach-profile APIs are under review. Directory examples do not establish coach availability or credential verification.', color: 'from-purple-500/20 to-violet-500/10', iconColor: 'text-purple-400' },
  { icon: Shield, title: 'Professional access · reviewed', description: 'New public accounts start as athletes. Coach, academy owner, organizer, and administrator privileges require a trusted approval process.', color: 'from-cyan-500/20 to-teal-500/10', iconColor: 'text-cyan-400' },
];

const steps = [
  { n: '01', title: 'Start with an account', desc: 'Create an athlete account when the authentication services are configured.' },
  { n: '02', title: 'Know the product status', desc: 'Check which workflows are implemented, experimental, or still being developed.' },
  { n: '03', title: 'Set up a club pilot', desc: 'Discuss your karate club or local event needs with the project team.' },
  { n: '04', title: 'Review access', desc: 'Professional accounts need approval before managing athletes or events.' },
  { n: '05', title: 'Use real event data', desc: 'An approved organizer can create an event and receive athlete registrations.' },
  { n: '06', title: 'Share feedback', desc: 'Help test the workflow before it is offered for wider use.' },
];

const faqs = [
  { q: 'Who is ATHLIX being built for?', a: 'Our proposed first pilot is karate academies and local tournament organizers. The initial geography and customer demand still need validation; broader combat-sports support is a roadmap direction.' },
  { q: 'Is every screen ready for real customers?', a: 'No. This is a development build. Some directories, dashboards, and community screens contain sample content. Review the product status page before relying on a workflow.' },
  { q: 'What does the Kata Analyzer measure?', a: 'It estimates 2D body landmarks and calculates movement heuristics. It cannot measure physical force, diagnose injuries, or certify performance. No independently validated accuracy figure is available.' },
  { q: 'Are subscriptions or payments available?', a: 'No. Paid plans, checkout, and automated billing are not available. Pilot scope and commercial terms must be discussed with the team.' },
  { q: 'What should I know before sharing data?', a: 'Privacy and service terms are pending legal review. Avoid uploading sensitive or third-party information. Use only videos you have permission to share, and review the analyzer consent notice.' },
];

const focusAreas = [
  { value: 'Karate', label: 'Proposed first discipline', icon: Target },
  { value: 'Clubs', label: 'Proposed pilot customers', icon: Users },
  { value: 'Events', label: 'First workflow to validate', icon: Trophy },
  { value: 'Feedback', label: 'Learning before scale', icon: MessageSquare },
];
const disciplines = ['Karate', 'BJJ', 'Judo', 'Taekwondo', 'Boxing', 'Muay Thai'];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <FloatingOrb className="bg-accent/20 top-[-10%] left-[10%]" size={600} delay={0} />
          <FloatingOrb className="bg-blue-500/10 bottom-[10%] right-[5%]" size={500} delay={2} />
          <FloatingOrb className="bg-purple-500/10 top-[40%] left-[60%]" size={300} delay={4} />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Radial fade */}
          <div className="absolute inset-0 bg-radial-[ellipse_80%_60%_at_50%_50%] from-transparent to-background" />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto relative z-10 flex flex-col items-center gap-6"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-surface/80 backdrop-blur-sm text-sm font-medium text-text-secondary shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Development build · Karate pilot in preparation
              <ChevronRight className="w-3.5 h-3.5 text-accent" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold font-display tracking-tight leading-[1.05] text-text-primary"
          >
            More time
            <br />
            <span className="relative inline-block">
              <span className="text-gradient-accent">on the mat</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-accent via-accent-light to-accent-gold"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: 'easeOut' as const }}
              />
            </span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl leading-relaxed font-light"
          >
            Athlete accounts, local tournaments, and experimental kata feedback.
            Built around the needs of a focused club pilot, with product limits made clear.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base bg-gradient-to-r from-accent via-accent-light to-accent-gold text-white shadow-xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                Create Athlete Account
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/features">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-base border border-border bg-surface/60 backdrop-blur-sm text-text-primary hover:border-accent/40 hover:bg-surface transition-all duration-300 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                See How It Works
              </motion.button>
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="max-w-xl text-sm text-text-secondary pt-4">
            Early development. Some screens contain sample data. No paid subscriptions or measured traction are claimed.
          </motion.p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-text-tertiary tracking-widest uppercase font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-text-tertiary" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── DISCIPLINES ─────────────────────────────────────────────────── */}
      <section className="relative py-10 border-y border-border overflow-hidden">
        <div className="absolute inset-0 bg-surface/40" />
        <div className="relative max-w-7xl mx-auto px-4">
          <p className="text-center text-xs tracking-widest text-text-tertiary uppercase font-semibold mb-6">
            Combat-sports direction · availability varies by workflow
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
            {disciplines.map((logo, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-xl md:text-2xl font-black font-display text-text-tertiary/50 hover:text-text-secondary transition-colors duration-300 cursor-default tracking-tight"
              >
                {logo}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {focusAreas.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative rounded-2xl border border-border bg-surface/60 p-6 text-center hover:border-accent/30 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-3xl md:text-4xl font-extrabold font-display text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary font-medium">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 px-4 relative">
        <div className="absolute inset-0 bg-surface/30 -z-10" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <SectionLabel icon={Zap} label="Platform Overview" />
            <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-text-primary">
              A focused foundation for
              <br className="hidden md:block" />
              clubs and local events
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Implemented APIs, experimental analysis, and work in progress. Explore the status of each area before using it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.09 }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-border bg-surface overflow-hidden cursor-default transition-colors duration-300 hover:border-accent/30"
              >
                {/* Gradient top band */}
                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', f.color)} />
                <div className="p-8">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5', f.color)}>
                    <f.icon className={cn('w-6 h-6', f.iconColor)} />
                  </div>
                  <h3 className="text-xl font-bold font-display text-text-primary mb-2">{f.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{f.description}</p>
                </div>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10', f.color)} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" className="py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <SectionLabel icon={Activity} label="The Workflow" />
            <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-text-primary">
              From first look to
              <br className="hidden md:block" />
              a useful pilot
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-border bg-surface p-8 hover:border-accent/30 transition-all duration-300 hover:shadow-md"
              >
                <div className="text-5xl font-black font-display text-accent/20 group-hover:text-accent/40 transition-colors duration-300 leading-none mb-4">
                  {step.n}
                </div>
                <h4 className="text-lg font-bold font-display text-text-primary mb-1.5">{step.title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHT BENTO ───────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <SectionLabel icon={Flame} label="Why Athlix" />
            <h2 className="mt-6 text-4xl md:text-5xl font-extrabold font-display tracking-tight text-text-primary">
              Built around the mat,
              <br className="hidden md:block" />
              <span className="text-gradient-accent">improved through feedback</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Lock, title: 'Access controls', desc: 'Authentication and ownership checks are being hardened with regression tests. No security certification is claimed.', badge: 'Engineering' },
              { icon: Zap, title: 'Event updates', desc: 'Authenticated realtime channels support event updates when the backend is configured.', badge: 'Pilot' },
              { icon: Globe, title: 'A narrow first market', desc: 'Karate clubs and local organizers are the proposed starting point. Demand still needs to be tested.', badge: 'Focus' },
              { icon: TrendingUp, title: 'Evidence before numbers', desc: 'Customer counts, retention, and revenue will be reported only after they have been measured.', badge: 'Evidence' },
              { icon: CheckCircle, title: 'Reviewed privileges', desc: 'Professional access needs approval. A platform role is not proof of sporting qualifications.', badge: 'Trust' },
              { icon: Sparkles, title: 'Explainable feedback', desc: 'Kata scores describe pose-based heuristics, with limits that a coach should review.', badge: 'Experimental' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                className="rounded-2xl border border-border bg-surface p-6 hover:border-accent/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-accent/70 border border-accent/20 rounded-full px-2.5 py-1 bg-accent/5">
                    {item.badge}
                  </span>
                </div>
                <h4 className="font-bold text-text-primary mb-1.5">{item.title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-4 relative">
        <div className="absolute inset-0 bg-surface/30 -z-10" />
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <SectionLabel icon={MessageSquare} label="FAQ" />
            <h2 className="mt-6 text-4xl md:text-5xl font-extrabold font-display tracking-tight text-text-primary">
              Questions answered
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <button
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left rounded-2xl border border-border bg-surface px-6 py-5 hover:border-accent/30 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-text-primary">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-7 h-7 rounded-full border border-border bg-surface-elevated flex items-center justify-center shrink-0"
                    >
                      <svg className="w-3.5 h-3.5 text-text-secondary" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 1v12M1 7h12" />
                      </svg>
                    </motion.div>
                  </div>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-3xl overflow-hidden border border-border bg-surface text-center p-12 md:p-20"
          >
            {/* Background */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-xs font-semibold tracking-widest text-accent uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Ready to begin?
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-text-primary mb-5">
                Help shape a better
                <br className="hidden md:block" />
                <span className="text-gradient-accent">club workflow.</span>
              </h2>
              <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
                Bring a real club workflow, try the development build, and help us understand
                what athletes and organizers need next.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base bg-gradient-to-r from-accent via-accent-light to-accent-gold text-white shadow-xl shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    Create Athlete Account
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/features">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-base border border-border bg-surface/60 backdrop-blur-sm text-text-primary hover:border-accent/40 hover:bg-surface transition-all duration-300 cursor-pointer"
                  >
                    View Product Status
                  </motion.button>
                </Link>
              </div>

              <p className="mt-6 text-xs text-text-tertiary">
                Development access · No checkout or automatic billing
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
