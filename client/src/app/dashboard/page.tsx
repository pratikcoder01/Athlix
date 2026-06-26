'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Calendar, Award, TrendingUp, User, Users, Compass,
  Settings, Bell, CheckSquare, ChevronRight, Plus, Zap, Star, Sparkles, RefreshCw
} from 'lucide-react';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { useAuthStore } from '../../store/authStore';
import TrainingPlanGenerator from '../../components/TrainingPlanGenerator';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: Activity, active: true },
  { name: 'Feed', href: '/feed', icon: Users },
  { name: 'Tournaments', href: '/tournaments', icon: Award },
  { name: 'Coaches', href: '/coaches', icon: User },
  { name: 'Academies', href: '/academies', icon: Compass },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [currentHours, setCurrentHours] = React.useState(4.5);
  const [trailingAverage, setTrailingAverage] = React.useState(3.0);
  const [nudgeText, setNudgeText] = React.useState('');
  const [isNudgeLoading, setIsNudgeLoading] = React.useState(false);
  const [nudgeError, setNudgeError] = React.useState('');

  const ratio = currentHours / trailingAverage;
  const exceedsThreshold = ratio >= 1.3;

  const fetchWellbeingNudge = async () => {
    setIsNudgeLoading(true);
    setNudgeError('');
    try {
      const token = useAuthStore.getState().token;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/ai/wellbeing-nudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPeriodHours: currentHours,
          trailingAverageHours: trailingAverage,
        }),
      });

      if (!res.ok) {
        throw new Error('AI wellbeing nudge call failed or was blocked.');
      }
      const data = await res.json();
      if (data.success) {
        setNudgeText(data.nudge);
      } else {
        throw new Error(data.message || 'Failed to fetch');
      }
    } catch (err: any) {
      console.error(err);
      setNudgeError(err.message || 'AI nudge call failed or was blocked.');
      setNudgeText('');
    } finally {
      setIsNudgeLoading(false);
    }
  };

  React.useEffect(() => {
    if (exceedsThreshold) {
      fetchWellbeingNudge();
    } else {
      setNudgeText('');
      setNudgeError('');
    }
  }, [exceedsThreshold]);

  const analytics = [
    { label: 'Sparring Hours', value: '42.5', sub: '+3.2 this week', icon: Activity, color: 'text-cyan-400' },
    { label: 'Submissions', value: '184', sub: 'All-time logged', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Win Rate', value: '78.3%', sub: 'Competition record', icon: Award, color: 'text-amber-400' },
    { label: 'Calories Burned', value: '24.2K', sub: 'Past 30 days', icon: Zap, color: 'text-purple-400' },
  ];

  const upcomingEvents = [
    { title: 'Las Vegas Grappling Open', date: 'July 15, 2026', time: '09:00 AM', location: 'Las Vegas, NV', type: 'tournament' },
    { title: 'Open Sparring Review', date: 'June 28, 2026', time: '06:00 PM', location: 'Apex Grappling Lab', type: 'training' },
  ];

  const recommendedCoaches = [
    { name: 'Prof. Thiago Valente', rank: 'BJJ Black Belt 3rd Degree', rate: '$90/hr', rating: 5.0, reviews: 88, avatar: '/images/avatars/thiago-valente.png' },
    { name: 'Coach Kru Somchai', rank: 'Muay Thai Kru', rate: '$75/hr', rating: 4.9, reviews: 124, avatar: '/images/avatars/somchai.png' },
    { name: 'Coach Elena Rostova', rank: 'Wrestling Master of Sport', rate: '$80/hr', rating: 4.8, reviews: 56, avatar: '/images/avatars/elena-rostova.png' },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex">

      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col justify-between p-5 shrink-0">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              </svg>
            </div>
            <span className="font-black text-base tracking-widest">
              ATHLIX<span className="text-accent">.</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ name, href, icon: Icon, active }) => (
              <Link
                key={name}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="border-t border-border pt-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center font-black text-accent text-sm">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black truncate">{user?.name || 'Athlete'}</p>
            <p className="text-xs text-text-tertiary capitalize">{user?.role || 'Fighter'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass-panel border-b border-border px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tight">Athlete Console</h1>
            <p className="text-text-secondary text-sm">Welcome back, {user?.name || 'Champ'} 👊</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center hover:border-accent/50 transition-colors" aria-label="Notifications">
              <Bell className="w-4 h-4 text-text-secondary" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </button>
            <Link href="/profile">
              <MagneticButton variant="premium" size="sm">
                <User className="w-4 h-4 mr-2" /> Profile
              </MagneticButton>
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Analytics Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <GlassCard padding="md" variant="interactive" className="relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
                      <div className={`w-8 h-8 rounded-xl bg-surface flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-black font-mono tracking-tight mb-1">{stat.value}</p>
                    <p className="text-text-tertiary text-xs">{stat.sub}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </section>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: 2/3 */}
            <div className="lg:col-span-2 space-y-6">

              {/* Belt Rank Progress */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard variant="glow" padding="lg">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-black text-base mb-1">Belt Rank Progress</h3>
                      <p className="text-text-secondary text-sm">BJJ Purple Belt · 3 Stripes</p>
                    </div>
                    <Award className="w-6 h-6 text-accent" />
                  </div>

                  {/* Belt visual */}
                  <div className="relative h-12 w-full rounded-xl overflow-hidden mb-5 shadow-inner" style={{ background: 'linear-gradient(135deg, #581c87, #6d28d9)' }}>
                    <div className="absolute right-12 top-0 bottom-0 w-20 bg-zinc-950 flex justify-center items-center gap-1.5">
                      {[1,2,3].map(s => (
                        <div key={s} className="w-1 h-7 bg-white/90 rounded-full" />
                      ))}
                    </div>
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white font-black text-sm tracking-widest">PURPLE BELT</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-2">
                      <span>Progress to Brown Belt</span>
                      <span className="font-black text-accent">72%</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '72%' }}
                        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 to-accent rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-tertiary mt-2">
                      <span>Blue Belt</span>
                      <span>Purple</span>
                      <span>Brown</span>
                      <span>Black</span>
                    </div>
                  </div>

                  {/* Feature 3: Belt Promotion Readiness Insight */}
                  <div className="mt-6 p-4 bg-accent/5 border-l-2 border-accent rounded-r-xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-accent font-black uppercase tracking-wider">AI Readiness Insight</p>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        Based on your logged <strong className="text-text-primary">42.5 sparring hours</strong> and exceptional <strong className="text-text-primary">78.3% win rate</strong>, you are tracking 15% ahead of typical Purple belt promotion timelines. Focus on tightening guard retention to close your remaining technical gap.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Feature 5: Injury-load Wellbeing Advisor */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <GlassCard padding="lg">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-black text-base mb-1">Injury-Load & Wellbeing Advisor</h3>
                      <p className="text-text-secondary text-sm">Monitor sparring volume vs. historic baseline to prevent overtraining</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                      <Activity className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Logged Sparring Hours Slider */}
                    <div>
                      <div className="flex justify-between text-xs text-text-secondary mb-2">
                        <span>Current Period Sparring Hours</span>
                        <span className="font-bold text-text-primary">{currentHours} hrs</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        value={currentHours}
                        onChange={(e) => setCurrentHours(parseFloat(e.target.value))}
                        className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>

                    {/* Trailing Average Slider */}
                    <div>
                      <div className="flex justify-between text-xs text-text-secondary mb-2">
                        <span>Trailing Weekly Average</span>
                        <span className="font-bold text-text-primary">{trailingAverage} hrs</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="0.5"
                        value={trailingAverage}
                        onChange={(e) => setTrailingAverage(parseFloat(e.target.value))}
                        className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  </div>

                  {/* Wellbeing nudge output */}
                  <AnimatePresence mode="wait">
                    {exceedsThreshold ? (
                      <motion.div
                        key="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                            <span className="text-xs font-black text-warning uppercase tracking-wider">High Training Load detected ({Math.round(ratio * 100)}% of baseline)</span>
                          </div>
                          <button
                            onClick={fetchWellbeingNudge}
                            disabled={isNudgeLoading}
                            className="text-text-tertiary hover:text-text-primary text-xs flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isNudgeLoading ? 'animate-spin' : ''}`} />
                            Recalculate Nudge
                          </button>
                        </div>
                        {isNudgeLoading ? (
                          <div className="h-6 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-text-secondary animate-pulse">DeepSeek V3.2 generating supportive nudge...</span>
                          </div>
                        ) : nudgeError ? (
                          <p className="text-xs text-danger font-medium leading-relaxed">
                            ⚠️ {nudgeError}
                          </p>
                        ) : (
                          <div className="flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                            <p className="text-xs text-text-secondary leading-relaxed italic">
                              "{nudgeText || 'No advice generated. Click recalculate.'}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="optimal"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center gap-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <div className="flex-1">
                          <p className="text-xs font-black text-success uppercase tracking-wider mb-0.5">Optimal Load Level ({Math.round(ratio * 100)}%)</p>
                          <p className="text-xs text-text-secondary">Your training volume is currently in a healthy range relative to your trailing average. Keep up the consistent work!</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <GlassCard padding="lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-base">Upcoming Events</h3>
                    <Link href="/tournaments">
                      <AnimatedBadge variant="accent" className="cursor-pointer hover:opacity-80 transition-opacity">
                        View All <ChevronRight className="w-3 h-3 ml-1" />
                      </AnimatedBadge>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {upcomingEvents.map((evt, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border hover:border-accent/30 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${evt.type === 'tournament' ? 'bg-amber-400/20 text-amber-400' : 'bg-cyan-400/20 text-cyan-400'}`}>
                          {evt.type === 'tournament' ? <Award className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-accent transition-colors">{evt.title}</p>
                          <p className="text-text-tertiary text-xs mt-0.5">{evt.date} · {evt.time} · {evt.location}</p>
                        </div>
                        <CheckSquare className="w-5 h-5 text-text-tertiary group-hover:text-success transition-colors shrink-0 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* AI Training Plan Generator */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <TrainingPlanGenerator />
              </motion.div>
            </div>

            {/* Right: 1/3 */}
            <div className="space-y-6">

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <GlassCard padding="md">
                  <h3 className="font-black text-sm mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Log Spar', icon: Activity, href: '/feed' },
                      { label: 'Book Coach', icon: Calendar, href: '/bookings' },
                      { label: 'Find Event', icon: Award, href: '/tournaments' },
                      { label: 'Browse Gyms', icon: Compass, href: '/academies' },
                    ].map(({ label, icon: Icon, href }) => (
                      <Link key={label} href={href}>
                        <div className="flex flex-col items-center gap-2 p-3 bg-surface rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group text-center">
                          <Icon className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
                          <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Recommended Coaches */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                <GlassCard padding="md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-sm">Recommended Coaches</h3>
                    <Link href="/coaches" className="text-accent text-xs font-semibold hover:opacity-80 transition-opacity">View All</Link>
                  </div>
                  <div className="space-y-3">
                    {recommendedCoaches.map((coach, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-accent/30 transition-colors group">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface border border-border shrink-0">
                          <img
                            src={coach.avatar}
                            alt={coach.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-accent/20 text-accent font-black text-sm">${coach.name[0]}</div>`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{coach.name}</p>
                          <p className="text-xs text-text-tertiary truncate">{coach.rank}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-bold text-text-secondary">{coach.rating}</span>
                            </div>
                            <span className="text-[10px] text-text-tertiary">({coach.reviews})</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-accent">{coach.rate}</p>
                          <Link href="/bookings" className="text-[10px] text-text-tertiary hover:text-accent transition-colors flex items-center gap-0.5">
                            Book <ChevronRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
