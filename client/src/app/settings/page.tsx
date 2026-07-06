'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Eye, User, Save, Sun, Moon, Bell, Shield, Palette } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../lib/utils';

function SettingsCard({ icon: Icon, iconColor, iconBg, title, desc, children }: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', iconBg)}>
          <Icon className={cn('w-4.5 h-4.5', iconColor)} />
        </div>
        <div>
          <h3 className="font-bold text-base text-text-primary">{title}</h3>
          <p className="text-text-tertiary text-xs">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={value}
      className={cn(
        'relative w-12 h-6 rounded-full border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
        value ? 'bg-accent border-accent/50' : 'bg-surface-elevated border-border'
      )}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn('absolute top-1 w-4 h-4 rounded-full shadow-sm', value ? 'left-7 bg-white' : 'left-1 bg-text-tertiary/60')}
      />
    </button>
  );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } } };

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [profileName, setProfileName] = useState(user?.name || 'Athlete Fighter');
  const [allowPublic, setAllowPublic] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface text-text-tertiary text-xs font-semibold mb-4">
            <SettingsIcon className="w-3 h-3" /> Configuration
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-text-primary mb-2">
            Platform Settings
          </motion.h1>
          <motion.p variants={fadeUp} className="text-text-secondary">
            Configure your profile, theme, notifications, and privacy preferences.
          </motion.p>
        </motion.div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SettingsCard icon={User} iconColor="text-blue-400" iconBg="bg-blue-400/10 border-blue-400/20" title="Profile" desc="Your display name and account email">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || 'name@example.com'}
                    disabled
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-tertiary cursor-not-allowed opacity-50"
                  />
                </div>
              </div>
            </SettingsCard>
          </motion.div>

          {/* Appearance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SettingsCard icon={Palette} iconColor="text-purple-400" iconBg="bg-purple-400/10 border-purple-400/20" title="Appearance" desc="Switch between dark and light themes">
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  {theme === 'dark'
                    ? <Moon className="w-4.5 h-4.5 text-accent" />
                    : <Sun className="w-4.5 h-4.5 text-amber-400" />
                  }
                  <div>
                    <p className="font-semibold text-sm text-text-primary">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    <p className="text-text-tertiary text-xs">Currently active</p>
                  </div>
                </div>
                <Toggle value={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </SettingsCard>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SettingsCard icon={Bell} iconColor="text-amber-400" iconBg="bg-amber-400/10 border-amber-400/20" title="Notifications" desc="Manage how you receive updates">
              <div className="space-y-3">
                {[
                  { label: 'Email notifications', desc: 'Booking confirmations and tournament updates', value: emailNotifs, set: setEmailNotifs },
                  { label: 'Push notifications', desc: 'Real-time alerts for live bracket updates', value: pushNotifs, set: setPushNotifs },
                ].map(({ label, desc, value, set }) => (
                  <div key={label} className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border">
                    <div>
                      <p className="font-semibold text-sm text-text-primary">{label}</p>
                      <p className="text-text-tertiary text-xs">{desc}</p>
                    </div>
                    <Toggle value={value} onChange={() => set(!value)} />
                  </div>
                ))}
              </div>
            </SettingsCard>
          </motion.div>

          {/* Privacy */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <SettingsCard icon={Shield} iconColor="text-green-400" iconBg="bg-green-400/10 border-green-400/20" title="Privacy" desc="Control your profile visibility">
              <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Eye className="w-4.5 h-4.5 text-text-tertiary" />
                  <div>
                    <p className="font-semibold text-sm text-text-primary">Public profile</p>
                    <p className="text-text-tertiary text-xs">Allow others to search and view your profile</p>
                  </div>
                </div>
                <Toggle value={allowPublic} onChange={() => setAllowPublic(!allowPublic)} />
              </div>
            </SettingsCard>
          </motion.div>

          {/* Save */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <motion.button
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2.5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer',
                saved
                  ? 'bg-success text-white shadow-lg shadow-success/25'
                  : 'bg-gradient-to-r from-accent via-accent-light to-accent-gold text-white shadow-lg shadow-accent/25 hover:shadow-accent/40'
              )}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Settings Saved!' : 'Save All Settings'}
            </motion.button>
          </motion.div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
