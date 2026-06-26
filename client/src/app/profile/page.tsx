'use client';

import React, { useState } from 'react';
import { Award, Eye, Heart, Share2 } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');

  const achievements = [
    { title: 'GOLD MEDAL', subtitle: 'Las Vegas Sub Open 2026', icon: '🏆' },
    { title: 'IRON LUNGS', subtitle: '50 logged sparring hours', icon: '⚡' },
    { title: 'FAST SUBMISSION', subtitle: 'Tap under 30 seconds', icon: '🥋' }
  ];

  const galleryItems = [
    { type: 'video', views: '1.2K', likes: '142', label: 'Gi Guard Passing Drills' },
    { type: 'image', views: '840', likes: '96', label: 'Vegas Open Podium Photo' },
    { type: 'video', views: '2.4K', likes: '310', label: 'Armbar Finish from Spar' }
  ];

  const timelineLogs = [
    { title: 'PROMOTED TO PURPLE BELT (3 STRIPES)', date: 'June 10, 2026', desc: 'Promoted by Prof. Thiago Valente after successful submission matches at open mat.' },
    { title: 'GOLD MEDAL AT VEGAS GRAPPLING OPEN', date: 'May 15, 2026', desc: 'Finished 3 opponents by armbar inside the light-heavyweight division.' }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Cover Banner */}
      <div className="h-64 w-full bg-secondary border-b border-border relative overflow-hidden flex items-end">
        <div className="absolute inset-0 mat-grid opacity-30" />
        <div className="absolute bottom-6 right-6 z-10">
          <MagneticButton className="bg-surface hover:bg-opacity-95 text-text-primary px-4 py-2 rounded-sm border border-border text-xs font-mono font-bold flex items-center gap-1.5 uppercase">
            <Share2 className="h-3.5 w-3.5" /> Share profile
          </MagneticButton>
        </div>
      </div>

      {/* Profile Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-20 mb-16">
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Avatar - Sharp 4px */}
            <div className="h-32 w-32 rounded-sm border-4 border-background bg-secondary flex items-center justify-center font-bold text-primary text-5xl font-mono shadow-2xl">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-wide">{user?.name || 'ATHLIX FIGHTER'}</h2>
              <p className="text-xs text-text-secondary font-mono font-bold mt-1.5 flex items-center justify-center md:justify-start gap-2 uppercase">
                <span>Purple Belt • BJJ</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>San Francisco, CA</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <MagneticButton className="bg-primary hover:bg-opacity-95 text-white font-bold py-3 px-6 rounded-sm text-xs font-mono tracking-wider uppercase">
              BOOK PRIVATE SESSION
            </MagneticButton>
          </div>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Achievements */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <SpotlightCard className="bg-secondary p-6 border border-border rounded-sm">
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-text-primary mb-6">ACHIEVEMENTS LOG</h3>
              <div className="flex flex-col gap-4">
                {achievements.map((item, idx) => (
                  <div key={idx} className="bg-surface p-4 border border-border rounded-sm flex gap-4 items-center">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs uppercase font-mono text-text-primary">{item.title}</h4>
                      <p className="text-[10px] text-text-secondary mt-0.5 font-mono uppercase font-bold">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>

          {/* Right panel: Timeline & Tabs */}
          <div className="lg:col-span-2">
            {/* Tabs selector */}
            <div className="flex border-b border-border/60 mb-6 font-mono text-xs font-bold">
              {[
                { id: 'timeline', label: 'TIMELINE' },
                { id: 'gallery', label: 'SPARRING GALLERY' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'timeline' | 'gallery')}
                  className={`px-6 py-3 tracking-wider cursor-pointer border-b-2 transition-all ${
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
              <div className="flex flex-col gap-4">
                {timelineLogs.map((log, idx) => (
                  <SpotlightCard key={idx} className="bg-secondary p-6 border border-border rounded-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-display font-black text-sm text-text-primary uppercase tracking-wide">{log.title}</h4>
                      <span className="text-[9px] text-text-secondary font-mono font-bold">{log.date.toUpperCase()}</span>
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed font-sans">{log.desc}</p>
                  </SpotlightCard>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {galleryItems.map((item, idx) => (
                  <SpotlightCard key={idx} className="bg-secondary border border-border rounded-sm p-5 flex flex-col justify-between h-44">
                    <div className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">{item.label}</div>
                    <div className="flex justify-between items-center text-[10px] text-text-secondary pt-4 border-t border-border/40 font-mono font-bold uppercase">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-primary" /> {item.views}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-primary" /> {item.likes}</span>
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
