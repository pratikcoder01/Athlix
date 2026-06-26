'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Calendar, MapPin, Search, Users, Check, Sparkles, Filter } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedText } from '../../components/shared/AnimatedText';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'brackets'>('discover');
  const { socket } = useSocket();
  
  const tournaments = [
    { id: 1, title: 'Grappling Championship 2026', date: 'July 15, 2026', location: 'Las Vegas, NV', fee: '$50', discipline: 'BJJ', entries: '184 fighters', banner: '/images/covers/tourney-vegas-open.svg', status: 'Registration Open' },
    { id: 2, title: 'Muay Thai Stadium Cup', date: 'August 20, 2026', location: 'Bangkok, TH', fee: '$45', discipline: 'Muay Thai', entries: '96 fighters', banner: '/images/covers/tourney-bangkok-cup.svg', status: 'Early Bird' },
    { id: 3, title: 'Wrestling Nationals 2026', date: 'September 5, 2026', location: 'Denver, CO', fee: '$35', discipline: 'Wrestling', entries: '128 fighters', banner: '/images/covers/tourney-wrestling-nationals.svg', status: 'Registration Open' },
    { id: 4, title: 'Pan-American Open Circuit', date: 'October 12, 2026', location: 'Miami, FL', fee: '$60', discipline: 'BJJ', entries: '220 fighters', banner: '/images/covers/tourney-pan-am.svg', status: 'Almost Full' },
    { id: 5, title: 'MMA Striker Showdown', date: 'November 8, 2026', location: 'Los Angeles, CA', fee: '$75', discipline: 'MMA', entries: '64 fighters', banner: '/images/covers/tourney-combat-fights.svg', status: 'Waitlist' }
  ];

  const [bracketMatches, setBracketMatches] = useState<any[]>([
    { round: 'SEMIFINALS', matches: [
      { p1: '1. Pratik', p1_rationale: 'Top seed based on recent IBJJF wins', p2: '4. John Doe', p2_rationale: 'Qualified via regional opens', score: '3 - 0 (Armbar)', winner: '1. Pratik' },
      { p1: '2. Mike Smith', p1_rationale: 'Returning champion', p2: '3. Thiago Valente', p2_rationale: 'High submission rate', score: '0 - 2 (Points)', winner: '3. Thiago Valente' }
    ]},
    { round: 'FINALS', matches: [
      { p1: '1. Pratik', p1_rationale: '', p2: '3. Thiago Valente', p2_rationale: '', score: 'Pending...', winner: '' }
    ]}
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (!socket) return;
    socket.emit('join_user_room', 'tournament_1');
    const handleBracketUpdate = (update: any) => {
      if (update.brackets) {
        try {
          const parsed = typeof update.brackets === 'string' ? JSON.parse(update.brackets) : update.brackets;
          setBracketMatches(parsed.rounds || parsed);
        } catch { }
      }
    };
    socket.on('bracket_update', handleBracketUpdate);
    return () => { socket.off('bracket_update', handleBracketUpdate); };
  }, [socket]);

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-accent selection:text-black flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 pt-32 pb-24 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <AnimatedText text="Tournament Portal" className="text-4xl md:text-5xl font-bold tracking-tight mb-2" delay={0} />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-text-secondary text-lg">
              Discover premier events and track live brackets globally.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex bg-surface border border-border rounded-full p-1 shadow-sm">
            {[
              { id: 'discover', label: 'Events' },
              { id: 'brackets', label: 'Live Brackets' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'discover' | 'brackets')}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-semibold transition-all',
                  activeTab === tab.id ? 'bg-primary text-background shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-background/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'discover' ? (
            <motion.div key="discover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-8">
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search by city, discipline, or tournament name..."
                    className="w-full bg-surface border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-text-primary"
                  />
                </div>
                <MagneticButton variant="outline" className="h-[54px] px-6 rounded-2xl hidden sm:flex">
                  <Filter className="w-5 h-5 mr-2" /> Filters
                </MagneticButton>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((t, i) => (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={t.id}>
                    <GlassCard padding="none" variant="interactive" className="h-full flex flex-col group">
                      <div className="relative h-48 overflow-hidden">
                        <img src={t.banner} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                        <div className="absolute top-4 left-4">
                          <AnimatedBadge variant="default" className="backdrop-blur-md bg-background/50 border-white/10">{t.discipline}</AnimatedBadge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <AnimatedBadge variant={t.status.includes('Full') ? 'warning' : 'success'} className="backdrop-blur-md bg-background/50">{t.status}</AnimatedBadge>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-bold mb-4 group-hover:text-accent transition-colors">{t.title}</h3>
                        <div className="space-y-3 text-sm text-text-secondary mb-8 flex-1">
                          <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-text-tertiary" /> {t.date}</div>
                          <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-text-tertiary" /> {t.location}</div>
                          <div className="flex items-center gap-3"><Users className="w-4 h-4 text-text-tertiary" /> {t.entries}</div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                          <span className="font-mono font-bold text-primary dark:text-white">{t.fee} <span className="text-text-tertiary text-xs font-sans font-normal">entry</span></span>
                          <MagneticButton variant="premium" size="sm">Register</MagneticButton>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="brackets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <GlassCard variant="glow" padding="lg" className="relative overflow-hidden min-h-[600px]">
                {/* Background Grid */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-border pb-8 gap-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Submission Division: 77kg</h3>
                    <div className="flex gap-2">
                      <AnimatedBadge variant="success" glow><span className="w-2 h-2 rounded-full bg-success animate-pulse mr-2" /> Live Now</AnimatedBadge>
                      <AnimatedBadge>Round of 4</AnimatedBadge>
                    </div>
                  </div>
                  
                  <MagneticButton
                    variant="premium"
                    disabled={isGenerating}
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        const token = useAuthStore.getState().token;
                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                        const res = await fetch(`${API_URL}/api/ai/seed-bracket`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ tournamentId: 'demo_tournament_1' }),
                        });
                        if (res.ok) {
                          const json = await res.json();
                          if (json.seeds && json.seeds.length >= 2) {
                            setBracketMatches(prev => {
                              const updated = [...prev];
                              updated[0].matches[0].p1 = `${json.seeds[0].seed}. ${json.seeds[0].name}`;
                              updated[0].matches[0].p1_rationale = json.seeds[0].rationale;
                              updated[0].matches[0].p2 = `${json.seeds[1].seed}. ${json.seeds[1].name}`;
                              updated[0].matches[0].p2_rationale = json.seeds[1].rationale;
                              return updated;
                            });
                          }
                        }
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                  >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? 'Analyzing...' : 'AI Seeding Generator'}
                  </MagneticButton>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-center gap-16 items-stretch w-full max-w-4xl mx-auto">
                  
                  {/* Semifinals */}
                  <div className="flex flex-col gap-12 justify-center flex-1">
                    <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase text-center mb-2 block">Semifinals</span>
                    {bracketMatches[0].matches.map((match: any, mIdx: number) => (
                      <GlassCard key={mIdx} padding="sm" variant="default" className="shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-center text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn('font-semibold', match.winner === match.p1 ? 'text-primary dark:text-white' : 'text-text-secondary')}>{match.p1}</span>
                            {match.p1_rationale && (
                              <div className="relative group/tooltip cursor-help">
                                <span className="text-accent text-xs bg-accent/10 w-4 h-4 rounded-full flex items-center justify-center">?</span>
                                <div className="absolute left-6 top-0 hidden group-hover/tooltip:block w-48 bg-surface border border-border p-3 rounded-lg text-xs shadow-xl z-50 pointer-events-none">
                                  {match.p1_rationale}
                                </div>
                              </div>
                            )}
                          </div>
                          {match.winner === match.p1 && <Check className="h-4 w-4 text-success" />}
                        </div>
                        <div className="h-px bg-border w-full mb-3" />
                        <div className="flex justify-between items-center text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn('font-semibold', match.winner === match.p2 ? 'text-primary dark:text-white' : 'text-text-secondary')}>{match.p2}</span>
                            {match.p2_rationale && (
                              <div className="relative group/tooltip cursor-help">
                                <span className="text-accent text-xs bg-accent/10 w-4 h-4 rounded-full flex items-center justify-center">?</span>
                                <div className="absolute left-6 top-0 hidden group-hover/tooltip:block w-48 bg-surface border border-border p-3 rounded-lg text-xs shadow-xl z-50 pointer-events-none">
                                  {match.p2_rationale}
                                </div>
                              </div>
                            )}
                          </div>
                          {match.winner === match.p2 && <Check className="h-4 w-4 text-success" />}
                        </div>
                        <div className="text-xs text-text-tertiary bg-background/50 py-1.5 rounded-md text-center font-mono">
                          {match.score}
                        </div>
                      </GlassCard>
                    ))}
                  </div>

                  {/* SVG Line Connections */}
                  <div className="hidden md:block w-16 relative flex-shrink-0">
                    <svg className="absolute inset-0 h-full w-full pointer-events-none text-border-strong" fill="none">
                      <path d="M 0 115 L 32 115 L 32 180 L 64 180" className="stroke-current stroke-2 opacity-50" />
                      <path d="M 0 315 L 32 315 L 32 250 L 64 250" className="stroke-current stroke-2 opacity-50" />
                    </svg>
                  </div>

                  {/* Finals */}
                  <div className="flex flex-col justify-center flex-1">
                    <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase text-center mb-4 block flex-[0] self-center">Finals</span>
                    <GlassCard padding="sm" variant="glow" className="relative group ring-1 ring-accent/20">
                      <div className="absolute -inset-1 bg-accent/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-center text-sm mb-3">
                        <span className="font-semibold text-text-primary">{bracketMatches[1].matches[0].p1 || 'TBD'}</span>
                      </div>
                      <div className="h-px bg-border w-full mb-3" />
                      <div className="flex justify-between items-center text-sm mb-3">
                        <span className="font-semibold text-text-primary">{bracketMatches[1].matches[0].p2 || 'TBD'}</span>
                      </div>
                      <div className="text-xs text-accent bg-accent/10 py-1.5 rounded-md text-center font-mono animate-pulse">
                        {bracketMatches[1].matches[0].score}
                      </div>
                    </GlassCard>
                  </div>

                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
