'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Award,
  TrendingUp,
  User,
  Users,
  Compass,
  Settings,
  Bell,
  CheckSquare,
  ChevronRight,
  Plus
} from 'lucide-react';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { useAuthStore } from '../../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const mockAnalytics = [
    { label: 'SPARRING TIME', value: '42.5 hrs', icon: <Activity className="text-primary h-5 w-5" /> },
    { label: 'SUBMISSIONS LOGGED', value: '184', icon: <TrendingUp className="text-secondary-accent h-5 w-5" /> },
    { label: 'MATCH WIN RATE', value: '78.3%', icon: <Award className="text-gold h-5 w-5" /> },
    { label: 'CALORIES BURNED', value: '24.2K', icon: <Activity className="text-success h-5 w-5" /> }
  ];

  const upcomingEvents = [
    { title: 'Submision Grappling Open', date: 'July 15, 2026', time: '09:00 AM', location: 'Las Vegas, NV' },
    { title: 'Sparring Review Session', date: 'June 28, 2026', time: '06:00 PM', location: 'Renzo Gracie Academy' }
  ];

  const recommendedCoaches = [
    { name: 'Prof. Renato Silva', rank: 'BJJ Black Belt 3rd Degree', rate: '$90/hr', rating: '5.0 (88 reviews)' },
    { name: 'Coach Kru Somchai', rank: 'Muay Thai Kru', rate: '$75/hr', rating: '4.9 (124 reviews)' }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-secondary border-r border-border hidden md:flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="text-xl font-extrabold tracking-wider font-display text-primary uppercase">
            ATHLIX<span className="text-secondary-accent font-bebas">.</span>
          </Link>

          {/* Nav List */}
          <nav className="flex flex-col gap-2">
            {[
              { name: 'Dashboard', href: '/dashboard', icon: <Activity className="h-4.5 w-4.5" />, active: true },
              { name: 'Social Feed', href: '/feed', icon: <Users className="h-4.5 w-4.5" /> },
              { name: 'Tournaments', href: '/tournaments', icon: <Award className="h-4.5 w-4.5" /> },
              { name: 'Coaches', href: '/coaches', icon: <User className="h-4.5 w-4.5" /> },
              { name: 'Academies', href: '/academies', icon: <Compass className="h-4.5 w-4.5" /> },
              { name: 'Bookings', href: '/bookings', icon: <Calendar className="h-4.5 w-4.5" /> },
              { name: 'Settings', href: '/settings', icon: <Settings className="h-4.5 w-4.5" /> }
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  link.active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
              >
                {link.icon} {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User context info */}
        <div className="border-t border-border pt-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-sm uppercase">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-text-primary leading-none">{user?.name || 'ATHLETE'}</h4>
            <span className="text-[10px] font-bold text-text-secondary font-mono leading-none tracking-wider">{user?.role || 'Fighter'}</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 bg-background overflow-y-auto px-4 py-8 sm:px-8">
        {/* Header row */}
        <header className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-wide uppercase">
              ATHLETE CONSOLE
            </h1>
            <p className="text-text-secondary text-sm">Welcome back, {user?.name || 'Champ'}. Train hard, stay focused.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-secondary border border-border rounded-full hover:bg-surface text-text-secondary hover:text-text-primary cursor-pointer relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <Link href="/profile">
              <button className="bg-primary hover:bg-opacity-95 text-white font-bold py-2.5 px-5 rounded-md text-xs font-bebas tracking-widest cursor-pointer">
                VIEW PROFILE
              </button>
            </Link>
          </div>
        </header>

        {/* Analytics stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockAnalytics.map((stat, idx) => (
            <SpotlightCard key={idx} className="bg-secondary p-5 border border-border flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-widest text-text-secondary uppercase">{stat.label}</span>
                <h3 className="text-3xl font-extrabold font-mono tracking-tight text-text-primary mt-1">{stat.value}</h3>
              </div>
              <div className="h-10 w-10 bg-surface rounded-full flex items-center justify-center">{stat.icon}</div>
            </SpotlightCard>
          ))}
        </section>

        {/* Main Grid widgets layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Col 1 & 2: Belt Progress and Feed updates */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Belt Progression Widget */}
            <SpotlightCard className="bg-secondary border border-border p-6" glowColor="rgba(243, 156, 18, 0.15)">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold font-display uppercase tracking-wide">BELT rank progress</h3>
                  <p className="text-xs text-text-secondary">Current tier: BJJ Purple Belt (3 Stripes)</p>
                </div>
                <Award className="h-8 w-8 text-gold" />
              </div>

              {/* Belt rendering */}
              <div className="relative h-12 w-full bg-purple-900 border border-purple-950 rounded-md overflow-hidden flex justify-between items-center px-6 mb-6 shadow-inner">
                {/* Black stripe bar */}
                <div className="absolute right-12 top-0 bottom-0 w-24 bg-zinc-950 flex justify-center items-center gap-1.5 border-l border-r border-purple-950">
                  <div className="w-1.5 h-8 bg-white rounded-sm" />
                  <div className="w-1.5 h-8 bg-white rounded-sm" />
                  <div className="w-1.5 h-8 bg-white rounded-sm" />
                </div>
                <span className="text-sm font-bold font-mono text-white tracking-widest relative z-10">PURPLE BELT</span>
              </div>

              {/* Progress to next belt */}
              <div>
                <div className="flex justify-between items-center text-xs text-text-secondary mb-2 font-mono">
                  <span>PROGESS TO BROWN BELT</span>
                  <span>72%</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary-accent rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </SpotlightCard>

            {/* Upcoming Events Widget */}
            <SpotlightCard className="bg-secondary border border-border p-6">
              <h3 className="text-xl font-bold font-display uppercase tracking-wide mb-6">upcoming tournaments & spars</h3>
              <div className="flex flex-col gap-4">
                {upcomingEvents.map((evt, idx) => (
                  <div key={idx} className="bg-surface p-4 border border-border rounded flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-text-primary uppercase tracking-wide">{evt.title}</h4>
                      <p className="text-xs text-text-secondary mt-1">{evt.date} at {evt.time} • {evt.location}</p>
                    </div>
                    <CheckSquare className="h-5 w-5 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>

          {/* Col 3: recommendations and analytics */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Coach recommendations */}
            <SpotlightCard className="bg-secondary border border-border p-6">
              <h3 className="text-xl font-bold font-display uppercase tracking-wide mb-6">verified coaches</h3>
              <div className="flex flex-col gap-4">
                {recommendedCoaches.map((coach, idx) => (
                  <div key={idx} className="bg-surface p-4 border border-border rounded-lg flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-text-primary uppercase tracking-wide">{coach.name}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{coach.rank}</p>
                      </div>
                      <span className="text-xs font-bold text-gold font-mono">{coach.rate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-text-secondary">{coach.rating}</span>
                      <Link href="/coaches" className="text-xs font-bold text-primary flex items-center gap-1 font-bebas tracking-wider hover:translate-x-1 transition-transform">
                        BOOK NOW <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>
        </div>
      </main>
    </div>
  );
}
