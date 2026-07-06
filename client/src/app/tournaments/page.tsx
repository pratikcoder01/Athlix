'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Calendar, MapPin, Search, Users, Check, Sparkles, Filter, Trophy
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import Link from 'next/link';

interface Match {
  p1: string;
  p1_rationale: string;
  p2: string;
  p2_rationale: string;
  score: string;
  winner: string;
}

interface Round {
  round: string;
  matches: Match[];
}

const disciplineColors: Record<string, string> = {
  BJJ: 'bg-purple-400/15 text-purple-400 border-purple-400/25',
  'Muay Thai': 'bg-red-400/15 text-red-400 border-red-400/25',
  Wrestling: 'bg-blue-400/15 text-blue-400 border-blue-400/25',
  MMA: 'bg-orange-400/15 text-orange-400 border-orange-400/25',
};

const statusColors: Record<string, string> = {
  'Registration Open': 'bg-success/15 text-success border-success/25',
  'Early Bird': 'bg-accent/15 text-accent border-accent/25',
  'Almost Full': 'bg-warning/15 text-warning border-warning/25',
  Waitlist: 'bg-danger/15 text-danger border-danger/25',
};

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'brackets'>('discover');
  const { socket } = useSocket();

  const tournaments = [
    { id: 1, title: 'Grappling Championship 2026', date: 'July 15, 2026', location: 'Las Vegas, NV', fee: '$50', discipline: 'BJJ', entries: '184 fighters', status: 'Registration Open' },
    { id: 2, title: 'Muay Thai Stadium Cup', date: 'August 20, 2026', location: 'Bangkok, TH', fee: '$45', discipline: 'Muay Thai', entries: '96 fighters', status: 'Early Bird' },
    { id: 3, title: 'Wrestling Nationals 2026', date: 'September 5, 2026', location: 'Denver, CO', fee: '$35', discipline: 'Wrestling', entries: '128 fighters', status: 'Registration Open' },
    { id: 4, title: 'Pan-American Open Circuit', date: 'October 12, 2026', location: 'Miami, FL', fee: '$60', discipline: 'BJJ', entries: '220 fighters', status: 'Almost Full' },
    { id: 5, title: 'MMA Striker Showdown', date: 'November 8, 2026', location: 'Los Angeles, CA', fee: '$75', discipline: 'MMA', entries: '64 fighters', status: 'Waitlist' },
  ];

  const [bracketMatches, setBracketMatches] = useState<Round[]>([
    {
      round: 'SEMIFINALS',
      matches: [
        { p1: '1. Pratik', p1_rationale: 'Top seed based on recent IBJJF wins', p2: '4. John Doe', p2_rationale: 'Qualified via regional opens', score: '3 - 0 (Armbar)', winner: '1. Pratik' },
        { p1: '2. Mike Smith', p1_rationale: 'Returning champion', p2: '3. Thiago Valente', p2_rationale: 'High submission rate', score: '0 - 2 (Points)', winner: '3. Thiago Valente' },
      ],
    },
    {
      round: 'FINALS',
      matches: [
        { p1: '1. Pratik', p1_rationale: '', p2: '3. Thiago Valente', p2_rationale: '', score: 'Pending...', winner: '' },
      ],
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (!socket) return;
    socket.emit('join_user_room', 'tournament_1');
    const handleBracketUpdate = (update: { brackets?: string | Round[] | { rounds: Round[] } }) => {
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
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 pt-32 pb-24 sm:px-6 lg:px-8 w-full">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface text-text-tertiary text-xs font-semibold mb-4"
            >
              <Trophy className="w-3 h-3 text-amber-400" /> Competition Hub
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-text-primary mb-2"
            >
              Tournament Portal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-text-secondary text-lg"
            >
              Discover premier events and track live brackets globally.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex bg-surface border border-border rounded-full p-1 shadow-sm"
          >
            {[
              { id: 'discover', label: 'Events' },
              { id: 'brackets', label: 'Live Brackets' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'discover' | 'brackets')}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'discover' ? (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search by city, discipline, or tournament name..."
                    className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-tertiary"
                  />
                </div>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-border bg-surface text-sm font-semibold text-text-primary hover:border-accent/40 transition-all"
                >
                  <Filter className="w-4 h-4" /> Filters
                </motion.button>
              </div>

              {/* Tournament Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tournaments.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                    className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    {/* Color banner (replaces broken images) */}
                    <div className={cn(
                      'h-36 relative overflow-hidden flex-shrink-0',
                      ['bg-gradient-to-br from-purple-500/30 to-blue-500/20',
                        'bg-gradient-to-br from-red-500/30 to-orange-500/20',
                        'bg-gradient-to-br from-blue-500/30 to-indigo-500/20',
                        'bg-gradient-to-br from-accent/30 to-purple-500/20',
                        'bg-gradient-to-br from-orange-500/30 to-red-500/20',
                      ][i % 5]
                    )}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-white/20" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                      {/* Badges */}
                      <div className="absolute top-3 left-3">
                        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', disciplineColors[t.discipline] || 'bg-surface text-text-secondary border-border')}>
                          {t.discipline}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', statusColors[t.status] || 'bg-surface text-text-secondary border-border')}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-text-primary mb-3 group-hover:text-accent transition-colors leading-tight">{t.title}</h3>
                      <div className="space-y-2 text-xs text-text-secondary flex-1 mb-4">
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-text-tertiary shrink-0" />{t.date}</div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />{t.location}</div>
                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-text-tertiary shrink-0" />{t.entries}</div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="font-extrabold text-text-primary">{t.fee} <span className="text-text-tertiary text-xs font-normal">entry</span></span>
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-accent to-accent-light text-white text-xs font-bold shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all cursor-pointer"
                        >
                          Register
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="brackets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 relative overflow-hidden min-h-[600px]">
                {/* Background grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-border pb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold font-display text-text-primary mb-2">Submission Division: 77kg</h3>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live Now
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-elevated text-text-secondary border border-border">
                        Round of 4
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent to-accent-light text-white text-sm font-bold shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                  >
                    {isGenerating
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Sparkles className="w-4 h-4" />
                    }
                    {isGenerating ? 'Analyzing...' : 'AI Seeding Generator'}
                  </motion.button>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-center gap-12 md:gap-16 items-stretch w-full max-w-4xl mx-auto">

                  {/* Semifinals */}
                  <div className="flex flex-col gap-10 justify-center flex-1">
                    <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase text-center">Semifinals</span>
                    {bracketMatches[0].matches.map((match: Match, mIdx: number) => (
                      <div key={mIdx} className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm hover:shadow-md transition-shadow">
                        {[{ name: match.p1, rationale: match.p1_rationale, winner: match.winner === match.p1 },
                          { name: match.p2, rationale: match.p2_rationale, winner: match.winner === match.p2 }].map((fighter, fi) => (
                          <React.Fragment key={fi}>
                            {fi === 1 && <div className="h-px bg-border my-3" />}
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className={cn('font-semibold', fighter.winner ? 'text-text-primary' : 'text-text-secondary')}>
                                  {fighter.name}
                                </span>
                                {fighter.rationale && (
                                  <div className="relative group/tip cursor-help">
                                    <span className="text-accent text-xs bg-accent/10 border border-accent/20 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">?</span>
                                    <div className="absolute left-6 top-0 hidden group-hover/tip:block w-48 bg-surface border border-border p-3 rounded-xl text-xs shadow-xl z-50 pointer-events-none">
                                      {fighter.rationale}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {fighter.winner && <Check className="h-4 w-4 text-success shrink-0" />}
                            </div>
                          </React.Fragment>
                        ))}
                        <div className="text-xs text-text-tertiary bg-background py-1.5 rounded-lg text-center font-mono mt-3 border border-border">
                          {match.score}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SVG connectors */}
                  <div className="hidden md:block w-16 relative flex-shrink-0">
                    <svg className="absolute inset-0 h-full w-full pointer-events-none" fill="none">
                      <path d="M 0 115 L 32 115 L 32 180 L 64 180" className="stroke-border stroke-2 opacity-50" />
                      <path d="M 0 315 L 32 315 L 32 250 L 64 250" className="stroke-border stroke-2 opacity-50" />
                    </svg>
                  </div>

                  {/* Finals */}
                  <div className="flex flex-col justify-center flex-1 gap-6">
                    <div>
                      <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase text-center mb-4 block">Finals</span>
                      <div className="rounded-2xl border border-accent/30 bg-surface-elevated p-4 ring-1 ring-accent/15 shadow-md shadow-accent/10 relative group">
                        <div className="absolute -inset-1 bg-accent/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          {[bracketMatches[1].matches[0].p1 || 'TBD', bracketMatches[1].matches[0].p2 || 'TBD'].map((name, fi) => (
                            <React.Fragment key={fi}>
                              {fi === 1 && <div className="h-px bg-border my-3" />}
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-text-primary">{name}</span>
                              </div>
                            </React.Fragment>
                          ))}
                          <div className="text-xs text-accent bg-accent/10 py-1.5 rounded-lg text-center font-mono mt-3 border border-accent/20 animate-pulse">
                            {bracketMatches[1].matches[0].score}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Champion Card */}
                    <AnimatePresence>
                      {bracketMatches[1].matches[0].winner && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col gap-4"
                        >
                          <div id="champion-share-card" className="p-5 bg-gradient-to-br from-accent/10 via-background to-purple-500/5 border border-accent/30 rounded-2xl text-center relative overflow-hidden shadow-lg">
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 blur-2xl rounded-full" />
                            <Award className="w-9 h-9 text-accent mx-auto mb-2 animate-bounce" />
                            <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium">Division Champion</p>
                            <h4 className="text-lg font-extrabold font-display text-text-primary mt-1">{bracketMatches[1].matches[0].winner}</h4>
                            <p className="text-xs text-text-secondary mt-0.5">77kg Submission Division</p>
                          </div>
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              const text = `🏆 Congratulations to ${bracketMatches[1].matches[0].winner} for winning the 77kg Submission Division at Athlix!`;
                              navigator.clipboard.writeText(text);
                              alert('Champion share card data copied to clipboard!');
                            }}
                            className="w-full py-2.5 rounded-full bg-gradient-to-r from-accent to-accent-light text-white text-sm font-bold cursor-pointer hover:shadow-lg shadow-accent/25 transition-all"
                          >
                            Share Result Card
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
