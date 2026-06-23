'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Calendar, MapPin, Search, ChevronRight, Users, Check } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'brackets'>('discover');
  
  const tournaments = [
    { id: 1, title: 'Grand Submission League 2026', date: 'July 15, 2026', location: 'Las Vegas, NV', fee: '$50', discipline: 'BJJ', entries: '184 fighters' },
    { id: 2, title: 'Iron Fist Muay Thai Cup', date: 'August 20, 2026', location: 'Bangkok, TH', fee: '$45', discipline: 'Muay Thai', entries: '96 fighters' }
  ];

  // Brackets mock tree
  const bracketMatches = [
    { round: 'SEMIFINALS', matches: [
      { p1: 'Pratik (ATHLIX)', p2: 'John Doe', score: '3 - 0 (Armbar)', winner: 'Pratik (ATHLIX)' },
      { p1: 'Mike Smith', p2: 'Renato Silva', score: '0 - 2 (Points)', winner: 'Renato Silva' }
    ]},
    { round: 'FINALS', matches: [
      { p1: 'Pratik (ATHLIX)', p2: 'Renato Silva', score: 'Pending...', winner: '' }
    ]}
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-wide uppercase">TOURNAMENT PORTAL</h1>
            <p className="text-text-secondary text-sm">Register for upcoming events or track digital match brackets</p>
          </div>

          <div className="flex border border-border rounded p-1 bg-secondary text-xs font-mono">
            {[
              { id: 'discover', label: 'DISCOVER EVENTS' },
              { id: 'brackets', label: 'LIVE BRACKETS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'discover' | 'brackets')}
                className={`px-4 py-2 font-bold cursor-pointer rounded transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'discover' ? (
          <div className="flex flex-col gap-6">
            {/* Search filter row */}
            <div className="flex gap-4 bg-secondary p-4 rounded-lg border border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search events by title..."
                  className="w-full bg-surface border border-border rounded pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tournaments.map(t => (
                <SpotlightCard key={t.id} className="bg-secondary border border-border p-6 flex flex-col justify-between h-64">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                        {t.discipline}
                      </span>
                      <span className="text-sm font-bold text-secondary-accent font-mono">{t.fee} Entry</span>
                    </div>
                    <h3 className="text-2xl font-black font-display uppercase tracking-wide mb-3">{t.title}</h3>
                    <div className="flex flex-col gap-1.5 text-xs text-text-secondary font-mono mb-4">
                      <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {t.date}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {t.location}</span>
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {t.entries} registered</span>
                    </div>
                  </div>
                  <MagneticButton className="w-full bg-primary hover:bg-opacity-95 text-white py-2.5 rounded text-xs font-bebas tracking-widest">
                    REGISTER FOR TOURNAMENT
                  </MagneticButton>
                </SpotlightCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-secondary border border-border rounded-xl p-8 shadow-xl">
            <h3 className="text-xl font-bold font-display uppercase tracking-wide mb-8 text-center">SUBMISSION DIVISION BRACKET</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {bracketMatches.map((roundGroup, rIdx) => (
                <div key={rIdx} className="flex flex-col gap-8 justify-center">
                  <span className="text-xs font-bold text-text-secondary tracking-widest font-mono text-center mb-2 block uppercase">{roundGroup.round}</span>
                  {roundGroup.matches.map((match, mIdx) => (
                    <div key={mIdx} className="bg-surface border border-border p-4 rounded-lg flex flex-col gap-2 shadow-inner">
                      <div className="flex justify-between items-center text-sm">
                        <span className={`font-semibold ${match.winner === match.p1 ? 'text-primary' : 'text-text-primary'}`}>{match.p1}</span>
                        {match.winner === match.p1 && <Check className="h-4 w-4 text-success" />}
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-1">
                        <span className={`font-semibold ${match.winner === match.p2 ? 'text-primary' : 'text-text-primary'}`}>{match.p2}</span>
                        {match.winner === match.p2 && <Check className="h-4 w-4 text-success" />}
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono text-center border-t border-border/40 pt-2 mt-1 uppercase">
                        {match.score}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
