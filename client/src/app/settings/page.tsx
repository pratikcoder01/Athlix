'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, Eye, User, Save, Sun, Moon } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [profileName, setProfileName] = useState(user?.name || 'Athlete Fighter');
  const [allowPublic, setAllowPublic] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings updated successfully!');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-border/60 pb-4 flex items-center gap-3">
          <SettingsIcon className="h-6.5 w-6.5 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">PLATFORM SETTINGS</h1>
            <p className="text-text-secondary text-xs mt-1">Configure profile visibility, credentials, and UI theme preferences</p>
          </div>
        </div>

        <SpotlightCard className="bg-secondary border border-border rounded-sm p-8 shadow-xl">
          <form onSubmit={handleSave} className="flex flex-col gap-8">
            
            {/* User credentials */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-text-primary">PROFILE CREDENTIALS</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-[10px] font-bold text-text-secondary">
                <div className="flex flex-col gap-2">
                  <label className="uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || 'name@example.com'}
                    disabled
                    className="bg-surface/50 border border-border rounded-sm px-4 py-3 text-xs text-text-tertiary focus:outline-none cursor-not-allowed font-sans"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border/40" />

            {/* Platform theme */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                {theme === 'dark' ? <Moon className="h-4.5 w-4.5 text-primary" /> : <Sun className="h-4.5 w-4.5 text-primary" />}
                <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-text-primary">THEME CONFIGURATION</h3>
              </div>
              <div className="flex justify-between items-center bg-surface p-4 border border-border rounded-sm">
                <div>
                  <h4 className="font-bold text-xs text-text-primary uppercase font-mono">Toggle platform theme</h4>
                  <p className="text-[10px] text-text-secondary mt-1">Switch between dark premium mode and clean light mode.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="bg-primary hover:bg-opacity-95 text-white font-bold py-2 px-4 rounded-sm text-[10px] font-mono tracking-wider cursor-pointer uppercase"
                >
                  {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
                </button>
              </div>
            </div>

            <hr className="border-border/40" />

            {/* Privacy */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-text-primary">PRIVACY & VISIBILITY</h3>
              </div>
              <div className="flex justify-between items-center bg-surface p-4 border border-border rounded-sm">
                <div>
                  <h4 className="font-bold text-xs text-text-primary uppercase font-mono">Public profile search visibility</h4>
                  <p className="text-[10px] text-text-secondary mt-1">Allow other athletes and coaches to search your rank logs and spars.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowPublic}
                  onChange={(e) => setAllowPublic(e.target.checked)}
                  className="h-4.5 w-4.5 accent-primary cursor-pointer border-border rounded-sm"
                />
              </div>
            </div>

            <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md">
              <Save className="h-4 w-4 mr-2 inline" /> SAVE ALL SETTINGS
            </MagneticButton>

          </form>
        </SpotlightCard>
      </div>

      <Footer />
    </div>
  );
}
