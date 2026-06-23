'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Target, Calendar, Shield, Share2, Eye, Heart, MessageCircle } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery' | 'stats'>('timeline');

  const achievements = [
    { title: 'Gold Medal', subtitle: 'Las Vegas Sub Open 2026', icon: '🏆' },
    { title: 'Iron lungs', subtitle: '50 logged sparring hours', icon: '🫁' },
    { title: 'Fast Tap', subtitle: 'Sub under 30 seconds', icon: '⚡' }
  ];

  const galleryItems = [
    { type: 'video', views: '1.2K', likes: '142', emoji: '🥋 Sparring Review' },
    { type: 'image', views: '840', likes: '96', emoji: '🏆 Podium Photo' },
    { type: 'video', views: '2.4K', likes: '310', emoji: '⚡ Armbar Finish' }
  ];

  const timelineLogs = [
    { title: 'Promoted to Purple Belt 3rd Stripe', date: 'June 10, 2026', desc: 'Promoted by Prof. Renato Silva after submission matches.' },
    { title: 'Won Gold at Vegas Grappling Open', date: 'May 15, 2026', desc: 'Finished 3 opponents by armbar inside the light-heavy division.' }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      {/* Cover Banner */}
      <div className="h-64 w-full bg-gradient-to-r from-primary via-secondary-accent to-gold relative overflow-hidden">
        <div className="absolute inset-0 bg-black/35 backdrop-blur-xs" />
        <div className="absolute bottom-6 right-6 z-10">
          <MagneticButton className="bg-surface hover:bg-opacity-95 text-text-primary px-4 py-2 rounded border border-border text-xs font-bold font-mono flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> SHARE PROFILE
          </MagneticButton>
        </div>
      </div>

      {/* Profile Header & Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-20 mb-16">
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Avatar */}
            <div className="h-36 w-36 rounded-full border-4 border-background bg-secondary flex items-center justify-center font-bold text-primary text-5xl font-mono shadow-2xl">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <div>
              <h2 className="text-4xl font-extrabold font-display uppercase tracking-wide">{user?.name || 'ATHLIX FIGHTER'}</h2>
              <p className="text-text-secondary text-sm font-semibold mt-1 flex items-center justify-center md:justify-start gap-2">
                <span>Purple Belt • BJJ</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Silicon Valley, CA</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <MagneticButton className="bg-primary hover:bg-opacity-95 text-white font-bold py-3 px-6 rounded-md text-xs font-bebas tracking-widest">
              BOOK PRIVATE SESSION
            </MagneticButton>
          </div>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Achievements and belt status */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <SpotlightCard className="bg-secondary p-6 border border-border">
              <h3 className="text-lg font-bold font-display uppercase tracking-wide mb-6">achievement system</h3>
              <div className="flex flex-col gap-4">
                {achievements.map((item, idx) => (
                  <div key={idx} className="bg-surface p-4 border border-border rounded flex gap-4 items-center">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">{item.title}</h4>
                      <p className="text-xs text-text-secondary">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>

          {/* Right panel: Timeline & Tabs */}
          <div className="lg:col-span-2">
            {/* Tabs selector */}
            <div className="flex border-b border-border mb-6">
              {[
                { id: 'timeline', label: 'TIMELINE' },
                { id: 'gallery', label: 'SPARRING GALLERY' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'timeline' | 'gallery')}
                  className={`px-6 py-3 text-sm font-bold font-mono tracking-wider cursor-pointer border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'timeline' ? (
              <div className="flex flex-col gap-6">
                {timelineLogs.map((log, idx) => (
                  <SpotlightCard key={idx} className="bg-secondary p-6 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-text-primary uppercase tracking-wide">{log.title}</h4>
                      <span className="text-xs text-text-secondary font-mono">{log.date}</span>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{log.desc}</p>
                  </SpotlightCard>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {galleryItems.map((item, idx) => (
                  <SpotlightCard key={idx} className="bg-secondary border border-border p-5 flex flex-col justify-between h-48">
                    <div className="text-lg font-bold uppercase tracking-wide text-text-primary">{item.emoji}</div>
                    <div className="flex justify-between items-center text-xs text-text-secondary pt-4 border-t border-border font-mono">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {item.views}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {item.likes}</span>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
