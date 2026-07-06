'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Calendar, Award, TrendingUp, User, Users, Compass,
  Settings, Bell, CheckSquare, ChevronRight, Zap, Star, Sparkles,
  RefreshCw, BarChart3, Home, Trophy, Brain
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import TrainingPlanGenerator from '../../components/TrainingPlanGenerator';
import { cn } from '../../lib/utils';

// ─── Nav Links ────────────────────────────────────────────────────────────────
const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, active: true },
  { name: 'Feed', href: '/feed', icon: Users },
  { name: 'Tournaments', href: '/tournaments', icon: Trophy },
  { name: 'AI Coach', href: '/kata', icon: Brain },
  { name: 'Coaches', href: '/coaches', icon: User },
  { name: 'Academies', href: '/academies', icon: Compass },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, delay = 0
}: {
  label: string; value: string; sub: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="group relative rounded-2xl border border-border bg-surface p-5 overflow-hidden hover:border-accent/30 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">{label}</p>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-surface-elevated border border-border', color.replace('text-', 'bg-').replace('-400', '-400/10').replace('-500', '-500/10'))}>
            <Icon className={cn('w-4 h-4', color)} />
          </div>
        </div>
        <p className="text-3xl font-extrabold font-display tracking-tight text-text-primary mb-1">{value}</p>
        <p className="text-xs text-text-tertiary">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-base text-text-primary">{title}</h3>
      {action}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
      if (!res.ok) throw new Error('AI wellbeing nudge call failed or was blocked.');
      const data = await res.json();
      if (data.success) {
        setNudgeText(data.nudge);
      } else {
        throw new Error(data.message || 'Failed to fetch');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setNudgeError(e.message || 'AI nudge call failed or was blocked.');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exceedsThreshold]);

  const analytics = [
    { label: 'Sparring Hours', value: '42.5', sub: '+3.2 this week', icon: Activity, color: 'text-cyan-400' },
    { label: 'Submissions', value: '184', sub: 'All-time logged', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Win Rate', value: '78.3%', sub: 'Competition record', icon: BarChart3, color: 'text-amber-400' },
    { label: 'Calories Burned', value: '24.2K', sub: 'Past 30 days', icon: Zap, color: 'text-purple-400' },
  ];

  const upcomingEvents = [
    { title: 'Las Vegas Grappling Open', date: 'July 15, 2026', time: '09:00 AM', location: 'Las Vegas, NV', type: 'tournament' },
    { title: 'Open Sparring Review', date: 'June 28, 2026', time: '06:00 PM', location: 'Apex Grappling Lab', type: 'training' },
  ];

  const recommendedCoaches = [
    { name: 'Prof. Thiago Valente', rank: 'BJJ Black Belt 3rd Degree', rate: '$90/hr', rating: 5.0, reviews: 88, initials: 'TV', color: 'from-purple-500 to-violet-600' },
    { name: 'Coach Kru Somchai', rank: 'Muay Thai Kru', rate: '$75/hr', rating: 4.9, reviews: 124, initials: 'KS', color: 'from-orange-500 to-red-600' },
    { name: 'Coach Elena Rostova', rank: 'Wrestling Master of Sport', rate: '$80/hr', rating: 4.8, reviews: 56, initials: 'ER', color: 'from-blue-500 to-indigo-600' },
  ];

  const quickActions = [
    { label: 'Log Spar', icon: Activity, href: '/feed', color: 'text-cyan-400 bg-cyan-400/10' },
    { label: 'Book Coach', icon: Calendar, href: '/bookings', color: 'text-blue-400 bg-blue-400/10' },
    { label: 'Find Event', icon: Award, href: '/tournaments', color: 'text-amber-400 bg-amber-400/10' },
    { label: 'Browse Gyms', icon: Compass, href: '/academies', color: 'text-green-400 bg-green-400/10' },
  ];

  const displayName = user?.name || 'Champ';
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'A';

  return (
    <div className="min-h-screen bg-background text-text-primary flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-surface border-r border-border hidden md:flex flex-col justify-between py-6 shrink-0">
        {/* Logo */}
        <div className="flex flex-col gap-8 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold font-display tracking-tight text-text-primary">Athlix</span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5">
            {navLinks.map(({ name, href, icon: Icon, active }) => (
              <Link
                key={name}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-accent/10 text-accent border border-accent/20 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="px-4 border-t border-border pt-4">
          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-hover transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xs font-extrabold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-text-primary">{displayName}</p>
              <p className="text-xs text-text-tertiary capitalize">{user?.role?.replace('_', ' ') || 'Athlete'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-extrabold font-display tracking-tight text-text-primary">
              Athlete Console
            </h1>
            <p className="text-text-secondary text-xs mt-0.5">Welcome back, {displayName} 👊</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              className="relative w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:border-accent/40 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border-2 border-background" />
            </button>
            <Link href="/profile">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm bg-gradient-to-r from-accent to-accent-light text-white shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all duration-200 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </motion.button>
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

          {/* ── KPI Stats ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.map((stat, i) => (
              <StatCard key={i} {...stat} delay={i * 0.07} />
            ))}
          </section>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: 2/3 */}
            <div className="lg:col-span-2 space-y-6">

              {/* Belt Rank Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <SectionHeader
                  title="Belt Rank Progress"
                  action={
                    <span className="text-xs text-text-tertiary font-medium flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-accent" /> BJJ Purple · 3 Stripes
                    </span>
                  }
                />

                {/* Belt visual */}
                <div className="relative h-11 w-full rounded-xl overflow-hidden mb-5 shadow-inner"
                  style={{ background: 'linear-gradient(135deg, #581c87, #6d28d9)' }}>
                  <div className="absolute right-10 top-0 bottom-0 w-16 bg-zinc-950 flex justify-center items-center gap-1.5">
                    {[1, 2, 3].map(s => (
                      <div key={s} className="w-1 h-6 bg-white/90 rounded-full" />
                    ))}
                  </div>
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white font-black text-xs tracking-widest">
                    PURPLE BELT
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-text-secondary mb-2">
                    <span>Progress to Brown Belt</span>
                    <span className="font-extrabold text-accent">72%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '72%' }}
                      transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-purple-500 to-accent rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-tertiary mt-1.5">
                    {['Blue', 'Purple', 'Brown', 'Black'].map(b => (
                      <span key={b}>{b}</span>
                    ))}
                  </div>
                </div>

                {/* AI Readiness Insight */}
                <div className="mt-5 p-4 bg-accent/5 border-l-2 border-accent rounded-r-xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-accent font-bold uppercase tracking-wider mb-1">AI Readiness Insight</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Based on your logged <strong className="text-text-primary">42.5 sparring hours</strong> and exceptional{' '}
                      <strong className="text-text-primary">78.3% win rate</strong>, you are tracking 15% ahead of typical Purple belt promotion timelines. Focus on tightening guard retention to close your remaining technical gap.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Injury-Load & Wellbeing Advisor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <SectionHeader
                  title="Injury-Load & Wellbeing Advisor"
                  action={
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-teal-400" />
                    </div>
                  }
                />
                <p className="text-xs text-text-secondary mb-5 -mt-3">Monitor sparring volume vs. historic baseline to prevent overtraining</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-2">
                      <span>Current Period Sparring Hours</span>
                      <span className="font-bold text-text-primary">{currentHours} hrs</span>
                    </div>
                    <input
                      type="range" min="0" max="20" step="0.5"
                      value={currentHours}
                      onChange={(e) => setCurrentHours(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-surface-elevated rounded-full appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-2">
                      <span>Trailing Weekly Average</span>
                      <span className="font-bold text-text-primary">{trailingAverage} hrs</span>
                    </div>
                    <input
                      type="range" min="1" max="15" step="0.5"
                      value={trailingAverage}
                      onChange={(e) => setTrailingAverage(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-surface-elevated rounded-full appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {exceedsThreshold ? (
                    <motion.div
                      key="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-warning/10 border border-warning/25 rounded-xl flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                          <span className="text-xs font-bold text-warning uppercase tracking-wider">
                            High Load Detected ({Math.round(ratio * 100)}% of baseline)
                          </span>
                        </div>
                        <button
                          onClick={fetchWellbeingNudge}
                          disabled={isNudgeLoading}
                          className="text-text-tertiary hover:text-text-primary text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={cn('w-3 h-3', isNudgeLoading && 'animate-spin')} />
                          Recalculate
                        </button>
                      </div>
                      {isNudgeLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-text-secondary animate-pulse">DeepSeek V3.2 generating supportive nudge...</span>
                        </div>
                      ) : nudgeError ? (
                        <p className="text-xs text-danger font-medium">⚠️ {nudgeError}</p>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                          <p className="text-xs text-text-secondary leading-relaxed italic">
                            &ldquo;{nudgeText || 'No advice generated. Click recalculate.'}&rdquo;
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
                      className="p-4 bg-success/10 border border-success/25 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-success uppercase tracking-wider mb-0.5">
                          Optimal Load Level ({Math.round(ratio * 100)}%)
                        </p>
                        <p className="text-xs text-text-secondary">Your training volume is in a healthy range. Keep up the consistent work!</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <SectionHeader
                  title="Upcoming Events"
                  action={
                    <Link href="/tournaments" className="text-xs text-accent hover:text-accent-light font-semibold flex items-center gap-1 transition-colors">
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  }
                />
                <div className="space-y-3">
                  {upcomingEvents.map((evt, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 bg-surface-elevated rounded-xl border border-border hover:border-accent/30 transition-all duration-200 group">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        evt.type === 'tournament' ? 'bg-amber-400/15 text-amber-400' : 'bg-cyan-400/15 text-cyan-400'
                      )}>
                        {evt.type === 'tournament' ? <Award className="w-4.5 h-4.5" /> : <Activity className="w-4.5 h-4.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-text-primary truncate group-hover:text-accent transition-colors">{evt.title}</p>
                        <p className="text-text-tertiary text-xs mt-0.5">{evt.date} · {evt.time} · {evt.location}</p>
                      </div>
                      <CheckSquare className="w-4 h-4 text-text-tertiary group-hover:text-success transition-colors shrink-0 cursor-pointer" />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI Training Plan Generator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
              >
                <TrainingPlanGenerator />
              </motion.div>
            </div>

            {/* Right: 1/3 */}
            <div className="space-y-5">

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <h3 className="font-bold text-sm text-text-primary mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ label, icon: Icon, href, color }) => (
                    <Link key={label} href={href}>
                      <div className="flex flex-col items-center gap-2 p-3.5 bg-surface-elevated rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 cursor-pointer group text-center">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color.split(' ')[1])}>
                          <Icon className={cn('w-4 h-4', color.split(' ')[0])} />
                        </div>
                        <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Recommended Coaches */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <SectionHeader
                  title="Recommended Coaches"
                  action={
                    <Link href="/coaches" className="text-xs text-accent hover:text-accent-light font-semibold transition-colors">
                      View All
                    </Link>
                  }
                />
                <div className="space-y-3">
                  {recommendedCoaches.map((coach, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl border border-border hover:border-accent/30 transition-all duration-200 group">
                      <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-extrabold shrink-0', coach.color)}>
                        {coach.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{coach.name}</p>
                        <p className="text-xs text-text-tertiary truncate">{coach.rank}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-bold text-text-secondary">{coach.rating}</span>
                          <span className="text-[10px] text-text-tertiary">({coach.reviews})</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-accent">{coach.rate}</p>
                        <Link href="/bookings" className="text-[10px] text-text-tertiary hover:text-accent transition-colors flex items-center gap-0.5 justify-end">
                          Book <ChevronRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Platform Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <h3 className="font-bold text-sm text-text-primary mb-4">Explore Platform</h3>
                <div className="space-y-1.5">
                  {[
                    { label: 'AI Coach (Kata)', href: '/kata', icon: Brain, badge: 'AI' },
                    { label: 'Live Tournaments', href: '/tournaments', icon: Trophy, badge: 'New' },
                    { label: 'Community Feed', href: '/feed', icon: Users, badge: null },
                    { label: 'Find Gyms', href: '/gyms', icon: Compass, badge: null },
                  ].map(({ label, href, icon: Icon, badge }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors group"
                    >
                      <Icon className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors shrink-0" />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary flex-1 transition-colors font-medium">{label}</span>
                      {badge && (
                        <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
