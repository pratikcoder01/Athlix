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
    { id: 1, title: 'Grappling Championship 2026', date: 'July 15, 2026', location: 'Las Vegas, NV', fee: '$50', discipline: 'BJJ', entries: '184 fighters' },
    { id: 2, title: 'Muay Thai Stadium Cup', date: 'August 20, 2026', location: 'Bangkok, TH', fee: '$45', discipline: 'Muay Thai', entries: '96 fighters' }
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
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-border/60 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">TOURNAMENT PORTAL</h1>
            <p className="text-text-secondary text-xs mt-1">Register for tournaments or track match bracket progression</p>
          </div>

          <div className="flex border border-border rounded-sm p-1 bg-secondary text-[10px] font-mono font-bold">
            {[
              { id: 'discover', label: 'DISCOVER EVENTS' },
              { id: 'brackets', label: 'LIVE BRACKETS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'discover' | 'brackets')}
                className={`px-3 py-1.5 cursor-pointer rounded-sm transition-all ${
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
            <div className="flex gap-4 bg-secondary p-4 rounded-sm border border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search events by title..."
                  className="w-full bg-surface border border-border rounded-sm pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary text-text-primary font-sans"
                />
              </div>
            </div>

            {/* List grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map(t => (
                <SpotlightCard key={t.id} className="bg-secondary border border-border rounded-sm p-6 flex flex-col justify-between h-64">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-bold text-primary font-mono tracking-widest uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm">
                        {t.discipline}
                      </span>
                      <span className="text-xs font-bold text-primary font-mono">{t.fee} ENTRY</span>
                    </div>
                    
                    <h3 className="text-xl font-display font-black uppercase tracking-wide mb-3">{t.title}</h3>
                    
                    <div className="flex flex-col gap-1.5 text-[10px] text-text-secondary font-mono mb-4">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {t.date.toUpperCase()}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t.location.toUpperCase()}</span>
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {t.entries.toUpperCase()}</span>
                    </div>
                  </div>
                  
                  <MagneticButton className="w-full bg-primary hover:bg-opacity-95 text-white py-2.5 rounded-sm text-xs font-mono font-bold tracking-wider uppercase">
                    REGISTER FOR TOURNAMENT
                  </MagneticButton>
                </SpotlightCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-secondary border border-border rounded-sm p-6 sm:p-8 relative overflow-hidden shadow-xl">
            {/* Background Texture */}
            <div className="absolute inset-0 bracket-dots pointer-events-none opacity-40" />

            <h3 className="relative z-10 text-md font-display font-black uppercase tracking-wider mb-8 text-center">
              SUBMISSION DIVISION MATCH BRACKET
            </h3>
            
            {/* Responsive Tree columns with SVG connection lines */}
            <div className="relative z-10 flex flex-col md:flex-row justify-center gap-12 items-stretch">
              
              {/* Semifinals Round */}
              <div className="flex flex-col gap-8 justify-center flex-1">
                <span className="text-[10px] font-bold text-text-secondary tracking-widest font-mono text-center mb-1 block uppercase">
                  SEMIFINALS
                </span>
                
                {bracketMatches[0].matches.map((match, mIdx) => (
                  <div key={mIdx} className="bg-surface border border-border p-4 rounded-sm flex flex-col gap-2 relative shadow-inner">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={`font-bold ${match.winner === match.p1 ? 'text-primary' : 'text-text-primary'}`}>{match.p1}</span>
                      {match.winner === match.p1 && <Check className="h-3.5 w-3.5 text-success" />}
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono border-t border-border/40 pt-2 mt-1">
                      <span className={`font-bold ${match.winner === match.p2 ? 'text-primary' : 'text-text-primary'}`}>{match.p2}</span>
                      {match.winner === match.p2 && <Check className="h-3.5 w-3.5 text-success" />}
                    </div>
                    <div className="text-[9px] text-text-secondary font-mono text-center border-t border-border/20 pt-1.5 mt-1 uppercase font-bold">
                      {match.score}
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG Connectors Container (Hidden on mobile for responsive layout integrity) */}
              <div className="hidden md:block w-8 relative flex-shrink-0">
                <svg className="absolute inset-0 h-full w-full pointer-events-none text-border-strong" fill="none">
                  {/* Top Connector */}
                  <path d="M 0 95 L 16 95 L 16 160 L 32 160" className="stroke-current stroke-2 opacity-30 bracket-line-draw" />
                  {/* Bottom Connector */}
                  <path d="M 0 255 L 16 255 L 16 190 L 32 190" className="stroke-current stroke-2 opacity-30 bracket-line-draw" />
                </svg>
              </div>

              {/* Finals Round */}
              <div className="flex flex-col gap-8 justify-center flex-1">
                <span className="text-[10px] font-bold text-text-secondary tracking-widest font-mono text-center mb-1 block uppercase">
                  FINALS
                </span>
                
                {bracketMatches[1].matches.map((match, mIdx) => (
                  <div key={mIdx} className="bg-surface border border-border p-4 rounded-sm flex flex-col gap-2 relative shadow-inner">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-text-primary font-bold">{match.p1 || 'Awaiting winner'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono border-t border-border/40 pt-2 mt-1">
                      <span className="text-text-primary font-bold">{match.p2 || 'Awaiting winner'}</span>
                    </div>
                    <div className="text-[9px] text-text-secondary font-mono text-center border-t border-border/20 pt-1.5 mt-1 uppercase font-bold">
                      {match.score}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
