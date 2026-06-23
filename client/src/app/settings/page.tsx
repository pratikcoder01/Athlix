'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Eye, User, Save, Sun, Moon } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-4 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-wide uppercase">PLATFORM SETTINGS</h1>
            <p className="text-text-secondary text-sm">Manage profile credentials, privacy, and theme preferences</p>
          </div>
        </div>

        <SpotlightCard className="bg-secondary border border-border p-8 shadow-xl">
          <form onSubmit={handleSave} className="flex flex-col gap-8">
            
            {/* User credentials */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold font-display uppercase tracking-wide">profile credentials</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || 'name@example.com'}
                    disabled
                    className="bg-surface/50 border border-border rounded px-4 py-3 text-sm text-text-secondary focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Platform theme */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-secondary-accent" /> : <Sun className="h-5 w-5 text-primary" />}
                <h3 className="text-lg font-bold font-display uppercase tracking-wide">theme preferences</h3>
              </div>
              <div className="flex justify-between items-center bg-surface p-4 border border-border rounded">
                <div>
                  <h4 className="font-bold text-sm text-text-primary uppercase tracking-wide">Toggle Platform Theme</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Switch between dark premium mode and clean light mode.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="bg-primary hover:bg-opacity-95 text-white font-bold py-2 px-5 rounded text-xs font-mono tracking-wider cursor-pointer uppercase"
                >
                  {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
                </button>
              </div>
            </div>

            <hr className="border-border" />

            {/* Privacy */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-success" />
                <h3 className="text-lg font-bold font-display uppercase tracking-wide">privacy & visibility</h3>
              </div>
              <div className="flex justify-between items-center bg-surface p-4 border border-border rounded">
                <div>
                  <h4 className="font-bold text-sm text-text-primary uppercase tracking-wide">Public Profile Visibility</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Allow other platform users to discover and view your belt rank timeline.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowPublic}
                  onChange={(e) => setAllowPublic(e.target.checked)}
                  className="h-5 w-5 accent-primary cursor-pointer border-border rounded"
                />
              </div>
            </div>

            <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-md font-bebas tracking-widest text-sm shadow-md">
              <Save className="h-4 w-4 mr-2 inline" /> SAVE ALL SETTINGS
            </MagneticButton>

          </form>
        </SpotlightCard>
      </div>

      <Footer />
    </div>
  );
}
