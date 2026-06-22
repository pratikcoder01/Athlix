import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Swords, Calendar, Award, Users, Trophy } from 'lucide-react';

const Landing = () => {
  return (
    <div className="bg-dojo-dark text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block bg-dojo-primary bg-opacity-10 border border-dojo-primary border-opacity-30 rounded-full px-4 py-1.5 text-xs font-bold text-dojo-primary uppercase tracking-widest mb-6"
        >
          LinkedIn meets Strava for Martial Arts 🥋
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-8xl font-bebas tracking-tight text-white mb-6"
        >
          ELEVATE YOUR <span className="text-dojo-primary">MARTIAL ARTS</span> JOURNEY
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl text-dojo-muted text-base md:text-lg mb-10 leading-relaxed"
        >
          DojoPro is the premium networking, tracking, and discovery app for combat sports athletes and coaches. Streamline progression, share sparring clips, and coordinate training sessions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link
            to="/signup"
            className="rounded-md bg-dojo-primary px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-glow-red hover:bg-opacity-90 transition duration-200"
          >
            Claim Your Profile
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-dojo-border bg-dojo-card px-8 py-4 text-sm font-bold uppercase tracking-wider text-white hover:border-dojo-primary transition duration-200"
          >
            Sign In
          </Link>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-dojo-border bg-dojo-card bg-opacity-40 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-4xl font-bebas text-dojo-primary">12K+</h4>
            <p className="text-xs text-dojo-muted uppercase tracking-wider mt-1">Active Athletes</p>
          </div>
          <div>
            <h4 className="text-4xl font-bebas text-dojo-primary">850+</h4>
            <p className="text-xs text-dojo-muted uppercase tracking-wider mt-1">Verified Senseis</p>
          </div>
          <div>
            <h4 className="text-4xl font-bebas text-dojo-primary">2.4M</h4>
            <p className="text-xs text-dojo-muted uppercase tracking-wider mt-1">Mat Hours Logged</p>
          </div>
          <div>
            <h4 className="text-4xl font-bebas text-dojo-primary">150+</h4>
            <p className="text-xs text-dojo-muted uppercase tracking-wider mt-1">Dojo Gyms Registered</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bebas text-white">THE DOJO PRO CORE FEATS</h2>
          <p className="mt-2 text-dojo-muted">Engineered to take you from White Belt to Black Belt.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-10 text-dojo-primary mb-4">
              <Award size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Strava-style Progressions</h3>
            <p className="text-sm text-dojo-muted">
              Record training mat hours, log sparring rounds, and visually display rank progressions in your specialized disciplines.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-10 text-dojo-primary mb-4">
              <Swords size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sensei Scheduler</h3>
            <p className="text-sm text-dojo-muted">
              Connect directly with elite trainers and book 1-on-1 private lesson slots, managing booking approvals automatically.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-10 text-dojo-primary mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">LinkedIn-style Networking</h3>
            <p className="text-sm text-dojo-muted">
              Share training footage, post technique breakdowns, interact on the feed, and build your digital martial arts brand.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 bg-dojo-card bg-opacity-30 border-t border-dojo-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bebas text-white font-bold">TESTIMONIALS</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="glass-panel p-6 rounded-lg">
              <p className="text-dojo-muted text-sm italic">
                "DojoPro solved our booking scheduling and let me discover new BJJ training partners locally. It has completely modernized how I trace my training."
              </p>
              <h5 className="mt-4 font-bold text-white text-sm">Marcus Vance</h5>
              <p className="text-xs text-dojo-muted">Brown Belt, Brazilian Jiu-Jitsu</p>
            </div>
            <div className="glass-panel p-6 rounded-lg">
              <p className="text-dojo-muted text-sm italic">
                "As a Muay Thai coach, DojoPro let me manage student requests easily and upload technical reviews directly to my profile."
              </p>
              <h5 className="mt-4 font-bold text-white text-sm">Kru Somchai</h5>
              <p className="text-xs text-dojo-muted">Striking Head Coach, MMA Dojo</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bebas text-white mb-4">READY TO LOG YOUR FIRST ROUND?</h2>
        <p className="text-dojo-muted mb-8 max-w-lg mx-auto">
          Join thousands of combat athletes and senseis level up. Claim your digital belt badge today.
        </p>
        <Link
          to="/signup"
          className="rounded-md bg-dojo-primary px-10 py-4 text-base font-bold uppercase tracking-wider text-white shadow-glow-red hover:bg-opacity-95 transition duration-200"
        >
          Register Free Profile
        </Link>
      </section>
    </div>
  );
};

export default Landing;
