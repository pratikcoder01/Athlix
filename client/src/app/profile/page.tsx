'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Eye, Heart, Share2, MapPin, Edit3, Trophy, Flame, Shield } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { useAuthStore } from '../../store/authStore';

const achievements = [
  { title: 'Gold Medal', subtitle: 'Las Vegas Sub Open 2026', icon: '🏆', color: 'amber' },
  { title: 'Iron Lungs', subtitle: '50 logged sparring hours', icon: '⚡', color: 'cyan' },
  { title: 'Fast Submission', subtitle: 'Tap under 30 seconds', icon: '🥋', color: 'purple' },
  { title: 'Bracket Climber', subtitle: '5 tournament wins', icon: '🎯', color: 'red' },
  { title: 'Gi Master', subtitle: 'Complete Gi syllabus', icon: '🔵', color: 'blue' },
  { title: 'Street Ready', subtitle: '200+ live rolling reps', icon: '💪', color: 'green' },
];

const galleryItems = [
  { type: 'video', views: '1.2K', likes: '142', label: 'Gi Guard Passing Drills' },
  { type: 'image', views: '840', likes: '96', label: 'Vegas Open Podium Photo' },
  { type: 'video', views: '2.4K', likes: '310', label: 'Armbar Finish from Spar' },
];

const timelineLogs = [
  {
    title: 'Promoted to Purple Belt (3 Stripes)',
    date: 'June 10, 2026',
    desc: 'Promoted by Prof. Thiago Valente after successful submission matches at open mat.',
    icon: '🎖️',
  },
  {
    title: 'Gold Medal at Vegas Grappling Open',
    date: 'May 15, 2026',
    desc: 'Finished 3 opponents by armbar inside the light-heavyweight division.',
    icon: '🥇',
  },
  {
    title: 'Completed 50 Sparring Hours Milestone',
    date: 'April 2, 2026',
    desc: 'Logged 50 cumulative hours of live sparring across 3 academies, earning the IRON LUNGS badge.',
    icon: '⚡',
  },
  {
    title: 'Enrolled: Advanced Guard Retention',
    date: 'March 1, 2026',
    desc: 'Started 8-week intensive module with Coach Kru Somchai focusing on closed guard and lasso systems.',
    icon: '📚',
  },
];

const profileStats = [
  { label: 'Sparring Hours', value: '42.5', icon: Flame },
  { label: 'Wins', value: '31', icon: Trophy },
  { label: 'Submissions', value: '184', icon: Shield },
];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* Cover Banner */}
      <div className="relative h-72 w-full overflow-hidden">
        <img
          src="/images/covers/tourney-vegas-open.svg"
          alt="Profile cover"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        {/* Actions in top right */}
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          <MagneticButton variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
          </MagneticButton>
          <MagneticButton variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
          </MagneticButton>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 mb-8">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-32 h-32 rounded-2xl border-4 border-background bg-surface overflow-hidden shadow-2xl shadow-black/50 shrink-0"
          >
            <img
              src="/images/avatars/athlete-1.svg"
              alt={user?.name || 'Athlete'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-accent/20 text-accent font-black text-4xl">${(user?.name || 'A')[0]}</div>`;
              }}
            />
          </motion.div>

          {/* Name & info */}
          <div className="flex-1">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {user?.name || 'Athlix Fighter'}
                </h1>
                <AnimatedBadge variant="success" glow>Verified Athlete</AnimatedBadge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-text-secondary text-sm mb-4">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-purple-400" />Purple Belt · BJJ</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" />San Francisco, CA</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" />IBJJF Competitor</span>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                {profileStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-text-tertiary" />
                    <span className="font-black">{value}</span>
                    <span className="text-text-tertiary text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <MagneticButton variant="premium">
              Book Private Session
            </MagneticButton>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Achievements */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard padding="lg">
                <h3 className="font-black text-base mb-5 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Achievements
                </h3>
                <div className="space-y-3">
                  {achievements.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 + 0.3 }}
                      className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-accent/30 transition-colors group"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-bold text-sm group-hover:text-accent transition-colors">{item.title}</p>
                        <p className="text-xs text-text-tertiary">{item.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Right: Timeline & Gallery tabs */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              {/* Tab selector */}
              <div className="flex bg-surface border border-border rounded-2xl p-1 mb-5 w-fit">
                {[
                  { id: 'timeline', label: 'Timeline' },
                  { id: 'gallery', label: 'Sparring Gallery' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'timeline' | 'gallery')}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-accent text-black shadow-lg shadow-accent/30'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'timeline' ? (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {timelineLogs.map((log, idx) => (
                      <GlassCard key={idx} padding="lg" variant="interactive" className="relative pl-14">
                        {/* Timeline indicator */}
                        <div className="absolute left-5 top-5 w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-lg">
                          {log.icon}
                        </div>
                        {idx < timelineLogs.length - 1 && (
                          <div className="absolute left-8.5 top-14 bottom-0 w-px bg-border" style={{ left: '2.125rem' }} />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-base leading-tight">{log.title}</h4>
                          <span className="text-xs text-text-tertiary shrink-0 ml-3">{log.date}</span>
                        </div>
                        <p className="text-text-secondary text-sm leading-relaxed">{log.desc}</p>
                      </GlassCard>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {galleryItems.map((item, idx) => (
                      <GlassCard key={idx} padding="md" variant="interactive" className="group cursor-pointer">
                        {/* Video/image placeholder */}
                        <div className="h-32 bg-surface rounded-xl mb-3 flex items-center justify-center border border-border group-hover:border-accent/30 transition-colors overflow-hidden">
                          <div className="text-4xl">{item.type === 'video' ? '▶️' : '📸'}</div>
                        </div>
                        <p className="font-semibold text-sm mb-3 group-hover:text-accent transition-colors">{item.label}</p>
                        <div className="flex justify-between items-center text-xs text-text-tertiary border-t border-border pt-3">
                          <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{item.views}</span>
                          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{item.likes}</span>
                        </div>
                      </GlassCard>
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
