'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Eye, Heart, Share2, MapPin, Edit3, Trophy,
  Flame, Shield, CheckCircle, Calendar, Star
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const achievements = [
  { title: 'Gold Medal', subtitle: 'Las Vegas Sub Open 2026', icon: '🏆', color: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/20' },
  { title: 'Iron Lungs', subtitle: '50 logged sparring hours', icon: '⚡', color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/20' },
  { title: 'Fast Submission', subtitle: 'Tap under 30 seconds', icon: '🥋', color: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/20' },
  { title: 'Bracket Climber', subtitle: '5 tournament wins', icon: '🎯', color: 'from-red-500/20 to-orange-500/10', border: 'border-red-500/20' },
  { title: 'Gi Master', subtitle: 'Complete Gi syllabus', icon: '🔵', color: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/20' },
  { title: 'Street Ready', subtitle: '200+ live rolling reps', icon: '💪', color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20' },
];

const galleryItems = [
  { type: 'video', views: '1.2K', likes: '142', label: 'Gi Guard Passing Drills' },
  { type: 'image', views: '840', likes: '96', label: 'Vegas Open Podium Photo' },
  { type: 'video', views: '2.4K', likes: '310', label: 'Armbar Finish from Spar' },
];

const timelineLogs = [
  { title: 'Promoted to Purple Belt (3 Stripes)', date: 'June 10, 2026', desc: 'Promoted by Prof. Thiago Valente after successful submission matches at open mat.', icon: '🎖️' },
  { title: 'Gold Medal at Vegas Grappling Open', date: 'May 15, 2026', desc: 'Finished 3 opponents by armbar inside the light-heavyweight division.', icon: '🥇' },
  { title: 'Completed 50 Sparring Hours Milestone', date: 'April 2, 2026', desc: 'Logged 50 cumulative hours of live sparring across 3 academies, earning the IRON LUNGS badge.', icon: '⚡' },
  { title: 'Enrolled: Advanced Guard Retention', date: 'March 1, 2026', desc: 'Started 8-week intensive module with Coach Kru Somchai focusing on closed guard and lasso systems.', icon: '📚' },
];

const profileStats = [
  { label: 'Sparring Hrs', value: '42.5', icon: Flame, color: 'text-orange-400' },
  { label: 'Wins', value: '31', icon: Trophy, color: 'text-amber-400' },
  { label: 'Submissions', value: '184', icon: Shield, color: 'text-purple-400' },
  { label: 'Rating', value: '4.9', icon: Star, color: 'text-yellow-400' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');

  const displayName = user?.name || 'Athlix Fighter';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* ── Cover Banner ── */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {/* Gradient cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-purple-500/20 to-blue-500/20" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.04
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />

        {/* Floating orbs */}
        <div className="absolute top-[-20%] right-[10%] w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[20%] w-48 h-48 bg-purple-500/15 rounded-full blur-3xl" />

        {/* Actions */}
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border border-border bg-background/60 backdrop-blur-sm text-text-primary hover:border-accent/40 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="w-8 h-8 rounded-full border border-border bg-background/60 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-background shadow-2xl shadow-black/30 shrink-0 bg-gradient-to-br from-accent to-accent-light flex items-center justify-center"
          >
            <span className="text-white font-extrabold text-3xl">{initials}</span>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex-1 pb-2"
          >
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight">{displayName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/25">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary text-sm mb-4">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400" />Purple Belt · BJJ</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent" />San Francisco, CA</span>
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" />IBJJF Competitor</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />Member since 2024</span>
            </div>
            <div className="flex flex-wrap gap-5">
              {profileStats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', color)} />
                  <span className="font-extrabold text-text-primary">{value}</span>
                  <span className="text-text-tertiary text-sm">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-accent to-accent-light text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300"
            >
              Book Private Session
            </motion.button>
          </motion.div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">

          {/* Achievements */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-text-primary">
                  <Trophy className="w-4.5 h-4.5 text-amber-400" /> Achievements
                </h3>
                <div className="space-y-2.5">
                  {achievements.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.3 }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] cursor-default',
                        item.color, item.border
                      )}
                    >
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary">{item.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Timeline & Gallery */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              {/* Tabs */}
              <div className="flex bg-surface border border-border rounded-2xl p-1 mb-5 w-fit">
                {[
                  { id: 'timeline', label: 'Timeline' },
                  { id: 'gallery', label: 'Sparring Gallery' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'timeline' | 'gallery')}
                    className={cn(
                      'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                      activeTab === tab.id
                        ? 'bg-accent text-white shadow-md shadow-accent/30'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'timeline' ? (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {timelineLogs.map((log, i) => (
                      <div key={i} className="relative flex gap-4 p-5 rounded-2xl border border-border bg-surface hover:border-accent/30 transition-all duration-200">
                        <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-xl shrink-0">
                          {log.icon}
                        </div>
                        {i < timelineLogs.length - 1 && (
                          <div className="absolute left-[2.375rem] top-[4.25rem] bottom-[-0.75rem] w-px bg-border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-3 mb-1.5">
                            <h4 className="font-bold text-sm text-text-primary leading-tight">{log.title}</h4>
                            <span className="text-xs text-text-tertiary shrink-0">{log.date}</span>
                          </div>
                          <p className="text-text-secondary text-xs leading-relaxed">{log.desc}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {galleryItems.map((item, i) => (
                      <div key={i} className="group cursor-pointer rounded-2xl border border-border bg-surface p-4 hover:border-accent/30 transition-all duration-200 hover:shadow-md">
                        <div className="h-28 bg-surface-elevated rounded-xl mb-3 flex items-center justify-center border border-border group-hover:border-accent/20 transition-colors overflow-hidden">
                          <span className="text-3xl">{item.type === 'video' ? '▶️' : '📸'}</span>
                        </div>
                        <p className="font-semibold text-sm text-text-primary mb-3 group-hover:text-accent transition-colors leading-tight">{item.label}</p>
                        <div className="flex justify-between text-xs text-text-tertiary border-t border-border pt-2.5">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{item.likes}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
