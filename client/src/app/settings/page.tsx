'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Eye, User, Save, Sun, Moon, Bell, Shield, Palette, ChevronRight } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [profileName, setProfileName] = useState(user?.name || 'Athlete Fighter');
  const [allowPublic, setAllowPublic] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings updated successfully!');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <AnimatedBadge variant="default">
              <SettingsIcon className="w-3 h-3 mr-1.5" /> Configuration
            </AnimatedBadge>
          </motion.div>
          <AnimatedText
            text="Platform Settings"
            className="text-3xl md:text-4xl font-black tracking-tight mb-2"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary"
          >
            Configure your profile, theme, notifications, and privacy preferences.
          </motion.p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-400/20 text-blue-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Profile</h3>
                  <p className="text-text-tertiary text-xs">Your display name and account email</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || 'name@example.com'}
                    disabled
                    className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm cursor-not-allowed opacity-50"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Theme Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-purple-400/20 text-purple-400 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Appearance</h3>
                  <p className="text-text-tertiary text-xs">Switch between dark and light themes</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-accent" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-text-tertiary text-xs">Currently active</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="relative w-14 h-7 rounded-full bg-background border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-1 h-5 w-5 rounded-full bg-accent shadow-lg shadow-accent/40 ${theme === 'dark' ? 'left-8' : 'left-1'}`}
                  />
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Notifications Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <GlassCard padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Notifications</h3>
                  <p className="text-text-tertiary text-xs">Manage how you receive updates</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Email notifications', desc: 'Booking confirmations and tournament updates', value: emailNotifs, set: setEmailNotifs },
                  { label: 'Push notifications', desc: 'Real-time alerts for live bracket updates', value: pushNotifs, set: setPushNotifs },
                ].map(({ label, desc, value, set }) => (
                  <div key={label} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-text-tertiary text-xs">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set(!value)}
                      className="relative w-14 h-7 rounded-full bg-background border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`absolute top-1 h-5 w-5 rounded-full shadow-lg ${value ? 'bg-accent shadow-accent/40 left-8' : 'bg-text-tertiary/60 left-1'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Privacy Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-green-400/20 text-green-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Privacy</h3>
                  <p className="text-text-tertiary text-xs">Control your profile visibility</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-text-tertiary" />
                  <div>
                    <p className="font-semibold text-sm">Public profile</p>
                    <p className="text-text-tertiary text-xs">Allow others to search and view your profile</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowPublic(!allowPublic)}
                  className="relative w-14 h-7 rounded-full bg-background border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-1 h-5 w-5 rounded-full shadow-lg ${allowPublic ? 'bg-accent shadow-accent/40 left-8' : 'bg-text-tertiary/60 left-1'}`}
                  />
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Save */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <MagneticButton type="submit" variant="premium" className="w-full justify-center">
              <Save className="w-4 h-4 mr-2" /> Save All Settings
            </MagneticButton>
          </motion.div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
