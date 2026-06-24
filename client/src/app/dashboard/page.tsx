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
import TrainingPlanGenerator from '../../components/TrainingPlanGenerator';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const mockAnalytics = [
    { label: 'SPARRING HOURS', value: '42.5', icon: <Activity className="text-primary h-4.5 w-4.5" /> },
    { label: 'SUBMISSIONS LOGGED', value: '184', icon: <TrendingUp className="text-primary h-4.5 w-4.5" /> },
    { label: 'MATCH WIN RATE', value: '78.3%', icon: <Award className="text-primary h-4.5 w-4.5" /> },
    { label: 'CALORIES BURNED', value: '24.2K', icon: <Activity className="text-primary h-4.5 w-4.5" /> }
  ];

  const upcomingEvents = [
    { title: 'Las Vegas Grappling Open', date: 'July 15, 2026', time: '09:00 AM', location: 'Las Vegas, NV' },
    { title: 'Open Sparring Review', date: 'June 28, 2026', time: '06:00 PM', location: 'Renzo Gracie SF' }
  ];

  const recommendedCoaches = [
    { name: 'Prof. Renato Silva', rank: 'BJJ Black Belt 3rd Degree', rate: '$90/hr', rating: '5.0 (88 reviews)' },
    { name: 'Coach Kru Somchai', rank: 'Muay Thai Kru', rate: '$75/hr', rating: '4.9 (124 reviews)' }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex">
      
      {/* Sidebar Navigation - Sharp 4px aesthetics */}
      <aside className="w-64 bg-secondary border-r border-border hidden md:flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group focus-visible:outline-none">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="fill-none stroke-current stroke-2" />
              <polygon points="12 6 18 10 18 14 12 18 6 14 6 10" />
            </svg>
            <span className="text-md font-display font-black tracking-widest text-text-primary uppercase">
              ATHLIX<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {[
              { name: 'Console', href: '/dashboard', icon: <Activity className="h-4 w-4" />, active: true },
              { name: 'Social Feed', href: '/feed', icon: <Users className="h-4 w-4" /> },
              { name: 'Tournaments', href: '/tournaments', icon: <Award className="h-4 w-4" /> },
              { name: 'Coaches', href: '/coaches', icon: <User className="h-4 w-4" /> },
              { name: 'Academies', href: '/academies', icon: <Compass className="h-4 w-4" /> },
              { name: 'Bookings', href: '/bookings', icon: <Calendar className="h-4 w-4" /> },
              { name: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> }
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-bold tracking-wider font-mono uppercase transition-all ${
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

        {/* User Context Footer */}
        <div className="border-t border-border/60 pt-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-sm uppercase">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase text-text-primary leading-none font-mono">{user?.name || 'ATHLETE'}</h4>
            <span className="text-[9px] font-bold text-text-secondary font-mono leading-none tracking-wider uppercase block mt-1">{user?.role || 'Fighter'}</span>
          </div>
        </div>
      </aside>

      {/* Main console wrapper */}
      <main className="flex-1 bg-background overflow-y-auto px-4 py-8 sm:px-8">
        
        {/* Header toolbar */}
        <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">
              ATHLETE CONSOLE
            </h1>
            <p className="text-text-secondary text-xs mt-1">Welcome back, {user?.name || 'Champ'}. Log sparring and schedule training sessions.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 bg-secondary border border-border rounded-sm hover:bg-surface text-text-secondary hover:text-text-primary cursor-pointer relative min-h-[40px] min-w-[40px] flex items-center justify-center">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            </button>
            <Link href="/profile">
              <button className="bg-primary hover:bg-opacity-95 text-white font-bold py-2 px-4 rounded-sm text-xs font-mono tracking-wider cursor-pointer uppercase">
                Profile
              </button>
            </Link>
          </div>
        </header>

        {/* Technical stats boxes */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockAnalytics.map((stat, idx) => (
            <SpotlightCard key={idx} className="bg-secondary p-5 border border-border rounded-sm flex justify-between items-center h-24">
              <div>
                <span className="text-[9px] font-bold font-mono tracking-widest text-text-secondary uppercase">{stat.label}</span>
                <h3 className="text-2xl font-black font-mono tracking-tight text-text-primary mt-1">{stat.value}</h3>
              </div>
              <div className="h-8 w-8 bg-surface rounded-sm flex items-center justify-center border border-border/30">{stat.icon}</div>
            </SpotlightCard>
          ))}
        </section>

        {/* Dashboard widget layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main widgets (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Technical Belt Progression Widget */}
            <SpotlightCard className="bg-secondary border border-border rounded-sm p-6" glowColor="rgba(220, 38, 38, 0.15)">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-md font-display font-black uppercase tracking-wide">BELT RANK PROGRESS</h3>
                  <p className="text-[10px] font-bold font-mono text-text-secondary mt-1 uppercase">Current: BJJ Purple Belt (3 Stripes)</p>
                </div>
                <Award className="h-6 w-6 text-primary" />
              </div>

              {/* Belt Graphic Representation */}
              <div className="relative h-10 w-full bg-purple-900 border border-purple-950 rounded-sm overflow-hidden flex justify-between items-center px-4 mb-6 shadow-inner">
                {/* Black stripe bar */}
                <div className="absolute right-10 top-0 bottom-0 w-20 bg-zinc-950 flex justify-center items-center gap-1 border-l border-r border-purple-950">
                  <div className="w-1 h-6 bg-white rounded-sm" />
                  <div className="w-1 h-6 bg-white rounded-sm" />
                  <div className="w-1 h-6 bg-white rounded-sm" />
                </div>
                <span className="text-xs font-black font-mono text-white tracking-widest relative z-10">PURPLE BELT</span>
              </div>

              {/* Progress slider bar */}
              <div>
                <div className="flex justify-between items-center text-[10px] text-text-secondary mb-2 font-mono font-bold">
                  <span>PROGESS TO BROWN BELT</span>
                  <span>72%</span>
                </div>
                <div className="h-1.5 w-full bg-surface rounded-sm overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '72%' }} />
                </div>
              </div>
            </SpotlightCard>

            {/* Upcoming schedules/tournaments widget */}
            <SpotlightCard className="bg-secondary border border-border rounded-sm p-6">
              <h3 className="text-md font-display font-black uppercase tracking-wide mb-6">UPCOMING MATCHES & SPARS</h3>
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((evt, idx) => (
                  <div key={idx} className="bg-surface p-4 border border-border/60 rounded-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">{evt.title}</h4>
                      <p className="text-[10px] text-text-secondary mt-1 font-mono">{evt.date} AT {evt.time} • {evt.location.toUpperCase()}</p>
                    </div>
                    <CheckSquare className="h-4.5 w-4.5 text-text-tertiary hover:text-primary transition-colors cursor-pointer" />
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>

          {/* Side panel widget (1/3 width) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Recommended instructors */}
            <SpotlightCard className="bg-secondary border border-border rounded-sm p-6">
              <h3 className="text-md font-display font-black uppercase tracking-wide mb-6">VERIFIED COACHES</h3>
              <div className="flex flex-col gap-4">
                {recommendedCoaches.map((coach, idx) => (
                  <div key={idx} className="bg-surface p-4 border border-border/60 rounded-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">{coach.name}</h4>
                        <p className="text-[9px] text-text-secondary mt-0.5 uppercase font-mono">{coach.rank}</p>
                      </div>
                      <span className="text-xs font-bold text-primary font-mono">{coach.rate}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-text-secondary">{coach.rating}</span>
                      <Link href="/coaches" className="font-bold text-primary flex items-center gap-0.5 hover:translate-x-0.5 transition-transform uppercase">
                        BOOK NOW <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* AI Training Plan Generator widget wrapper */}
        <div className="mt-8">
          <TrainingPlanGenerator />
        </div>
      </main>
    </div>
  );
}
