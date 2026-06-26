'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Activity, Shield, Trophy, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import { AnimatedText } from '../components/shared/AnimatedText';
import { AnimatedBadge } from '../components/shared/AnimatedBadge';
import { GlassCard } from '../components/shared/GlassCard';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <main className="min-h-screen bg-background relative selection:bg-accent selection:text-text-inverse">
      <Navbar />

      {/* 
        HERO SECTION 
        Apple / Linear inspired ultra-premium hero. 
      */}
      <section 
        ref={containerRef}
        className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center min-h-[90vh]"
      >
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-accent/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] md:w-[300px] md:h-[300px] bg-accent-gold/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-float" />

        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-4 z-10 flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8"
          >
            <AnimatedBadge variant="accent" glow>
              <Zap className="w-3 h-3 mr-2" /> Athlix v2.0 is now live
            </AnimatedBadge>
          </motion.div>

          <AnimatedText 
            text="The Operating System for Elite Athletes."
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter max-w-5xl mx-auto leading-[1.1] mb-8"
            delay={0.1}
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The operating system for elite combat sports athletes. Schedule training, track progress, and compete at the highest level.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <MagneticButton size="lg" variant="premium" className="w-full">
                Start for free <ArrowRight className="ml-2 w-4 h-4" />
              </MagneticButton>
            </Link>
            <Link href="/features" className="w-full sm:w-auto">
              <MagneticButton size="lg" variant="outline" className="w-full">
                Explore Platform
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating App Preview Dashboard Graphic */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, type: 'spring', damping: 20 }}
          className="w-full max-w-6xl mx-auto px-4 mt-20 relative z-20"
        >
          <div className="relative rounded-2xl md:rounded-[2rem] border border-border glass-panel p-2 md:p-4 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent rounded-[2rem] -z-10" />
            <img 
              src="/images/covers/blog-bracket-mechanics.svg" 
              alt="Athlix Dashboard Preview" 
              className="w-full h-auto rounded-xl md:rounded-2xl border border-border-strong opacity-90 object-cover aspect-video"
            />
          </div>
        </motion.div>
      </section>

      {/* 
        TRUST MARQUEE 
      */}
      <section className="py-20 border-y border-border overflow-hidden bg-secondary">
        <div className="container mx-auto px-4 text-center mb-8">
          <p className="text-sm font-semibold tracking-widest text-text-tertiary uppercase">
            Trusted by World Champions & Academies
          </p>
        </div>
        <div className="flex flex-nowrap w-max animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 px-8">
              {['Gracie Barra', 'Alliance BJJ', 'American Top Team', '10th Planet', 'Evolve MMA', 'Sanford MMA'].map((logo, j) => (
                <span key={`${i}-${j}`} className="text-2xl font-bold text-text-tertiary">
                  {logo}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 
        BENTO BOX FEATURES 
      */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4">
          <div className="mb-16 md:mb-24">
            <AnimatedText 
              text="Everything you need to scale your athletic career."
              className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl"
              as="h2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="glow" className="md:col-span-2 min-h-[400px] flex flex-col justify-between group">
              <div>
                <Trophy className="w-10 h-10 text-accent mb-6" />
                <h3 className="text-2xl font-bold mb-3 group-hover:text-accent transition-colors">Tournament Management</h3>
                <p className="text-text-secondary max-w-md leading-relaxed">
                  Generate live, interactive brackets. Manage weigh-ins, seedings, and real-time scoring updates instantly.
                </p>
              </div>
              <div className="mt-8 relative h-48 overflow-hidden rounded-xl border border-border bg-surface">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <img src="/images/covers/tourney-pan-am.svg" alt="Tournament" className="w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
              </div>
            </GlassCard>

            <GlassCard variant="interactive" className="min-h-[400px] flex flex-col justify-between group">
              <div>
                <Activity className="w-10 h-10 text-primary dark:text-white mb-6 group-hover:text-accent transition-colors" />
                <h3 className="text-2xl font-bold mb-3">Performance Tracking</h3>
                <p className="text-text-secondary leading-relaxed">
                  Log your rolls, track submission rates, and monitor weight cuts with precision analytics.
                </p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="w-full h-32 bg-surface rounded-t-xl border-x border-t border-border flex items-end p-4">
                  <div className="w-full flex justify-between items-end h-full gap-2">
                    {[40, 70, 45, 90, 65, 100].map((h, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="w-full bg-accent/20 rounded-t-sm"
                      >
                        <div className="w-full h-full bg-accent rounded-t-sm opacity-50 group-hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="interactive" className="min-h-[400px] flex flex-col justify-between group">
              <div>
                <Users className="w-10 h-10 text-primary dark:text-white mb-6 group-hover:text-accent transition-colors" />
                <h3 className="text-2xl font-bold mb-3">Coach Bookings</h3>
                <p className="text-text-secondary leading-relaxed">
                  Sync your calendar, set your rates, and accept direct private training bookings.
                </p>
              </div>
              <div className="mt-8 flex -space-x-4">
                {['thiago-valente.png', 'lucas-vianna.svg', 'rodrigo-santos.svg'].map((avatar, i) => (
                  <img key={i} src={`/images/avatars/${avatar}`} className="w-16 h-16 rounded-full border-4 border-surface z-10 relative group-hover:-translate-y-2 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="interactive" className="md:col-span-2 min-h-[400px] flex flex-col justify-between group">
              <div>
                <Shield className="w-10 h-10 text-primary dark:text-white mb-6 group-hover:text-accent transition-colors" />
                <h3 className="text-2xl font-bold mb-3">Verified Academy Network</h3>
                <p className="text-text-secondary max-w-md leading-relaxed">
                  Join a global directory of verified academies. Manage your roster, promotions, and affiliations securely.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-4 gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                 {['logo-alliance.svg', 'logo-apex.svg', 'logo-horizon.svg', 'logo-vanguard.svg'].map((logo, i) => (
                  <div key={i} className="aspect-square bg-surface rounded-xl border border-border flex items-center justify-center p-4">
                    <img src={`/images/academies/${logo}`} className="w-full h-full object-contain" />
                  </div>
                 ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 
        BOTTOM CTA 
      */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/5" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Ready to step on the mats?
            </h2>
            <p className="text-text-secondary text-lg mb-10">
              Join thousands of combat sports athletes managing their careers on Athlix.
            </p>
            <Link href="/signup">
              <MagneticButton size="lg" variant="premium">
                Create Free Account
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
