'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Star, Award, Calendar, DollarSign, Clock, Sparkles, RotateCcw, AlertTriangle, Filter, ChevronRight, User, ShieldCheck
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';

const coaches = [
  {
    id: 1,
    name: 'Prof. Thiago Valente',
    discipline: 'BJJ',
    rank: 'Black Belt · 3rd Degree',
    experience: '15 years',
    rate: '$90/hr',
    rating: 5.0,
    reviews: 88,
    certifications: ['IBJJF Certified', 'First Aid Certified'],
    availability: 'Mon, Wed, Fri · 09:00–17:00',
    avatar: '/images/avatars/thiago-valente.png',
    bio: 'Former IBJJF Pan-American champion. Specializes in competition preparation and submission mechanics.',
    students: 124,
  },
  {
    id: 2,
    name: 'Coach Kru Somchai',
    discipline: 'Muay Thai',
    rank: 'Lumpinee Stadium Veteran',
    experience: '12 years',
    rate: '$75/hr',
    rating: 4.9,
    reviews: 124,
    certifications: ['MTIA Certified Instructor'],
    availability: 'Tue, Thu, Sat · 10:00–18:00',
    avatar: '/images/avatars/somchai.png',
    bio: 'Competed in Lumpinee & MAX Muay Thai. Trains fighters from beginner to pro level.',
    students: 198,
  },
  {
    id: 3,
    name: 'Coach Elena Rostova',
    discipline: 'Wrestling',
    rank: 'Master of Sport (Russia)',
    experience: '8 years',
    rate: '$80/hr',
    rating: 4.8,
    reviews: 56,
    certifications: ['USA Wrestling Coach Card', 'SafeSport Certified'],
    availability: 'Mon, Tue, Thu · 12:00–19:00',
    avatar: '/images/avatars/elena-rostova.png',
    bio: 'Olympic trials qualifier. Focuses on takedown chains, and mat returns.',
    students: 87,
  },
  {
    id: 4,
    name: 'Coach Marcus Vance',
    discipline: 'Boxing',
    rank: 'Golden Gloves Champion',
    experience: '20 years',
    rate: '$100/hr',
    rating: 5.0,
    reviews: 95,
    certifications: ['AIBA Certified Coach', 'USA Boxing Certified'],
    availability: 'Wed, Thu, Fri · 08:00–15:00',
    avatar: '/images/avatars/marcus-vance.png',
    bio: 'Golden Gloves champion and professional corner man. Expert in defensive boxing and counterpunching.',
    students: 211,
  },
  {
    id: 5,
    name: 'Coach Sarah Jenkins',
    discipline: 'MMA',
    rank: 'UFC Veteran',
    experience: '10 years',
    rate: '$110/hr',
    rating: 4.9,
    reviews: 72,
    certifications: ['NAC Certified Referee', 'ISKA Trainer Certification'],
    availability: 'Mon, Wed, Sat · 11:00–18:00',
    avatar: '/images/avatars/sarah-jenkins.png',
    bio: '5 UFC bouts. Specializes in complete fighter development: striking integration with grappling.',
    students: 163,
  },
];

const disciplines = ['All', 'BJJ', 'Muay Thai', 'Wrestling', 'Boxing', 'MMA'];
const disciplineColors: Record<string, string> = {
  BJJ: 'text-accent bg-accent/10 border-accent/25',
  'Muay Thai': 'text-red-400 bg-red-400/10 border-red-400/25',
  Wrestling: 'text-green-400 bg-green-400/10 border-green-400/25',
  Boxing: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  MMA: 'text-purple-400 bg-purple-400/10 border-purple-400/25',
};

export default function DiscoverCoachesPage() {
  const [discipline, setDiscipline] = useState('All');
  const [matchQuery, setMatchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [stagedMessage, setStagedMessage] = useState('Understanding your goals...');
  const [aiMatches, setAiMatches] = useState<any[] | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const filteredCoaches = discipline === 'All' ? coaches : coaches.filter(c => c.discipline === discipline);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleAiMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchQuery.trim()) return;

    setAiLoading(true);
    setAiMessage(null);
    setAiMatches(null);

    const messages = [
      "Understanding your goals...",
      "Analyzing coach profiles...",
      "Comparing availability schedules...",
      "Comparing budget profiles...",
      "Ranking matches...",
    ];
    let msgIdx = 0;
    setStagedMessage(messages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setStagedMessage(messages[msgIdx]);
    }, 1500);

    try {
      const authData = localStorage.getItem('athlix-auth');
      const token = authData ? JSON.parse(authData).state?.token : '';

      const response = await fetch(`${API_URL}/api/ai/match-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query: matchQuery }),
      });

      if (!response.ok) throw new Error('Failed to find matches');

      const data = await response.json();
      if (data.skipAI) {
        setAiMessage(data.message || 'Broaden your search to discover more matches.');
        setAiMatches([]);
      } else {
        setAiMatches(data.coaches || []);
      }
    } catch {
      setAiMessage('Failed to connect to the matchmaking service. Please try again.');
    } finally {
      clearInterval(interval);
      setAiLoading(false);
    }
  };

  const resetSearch = () => {
    setMatchQuery('');
    setAiMatches(null);
    setAiMessage(null);
  };

  const displayCoaches = aiMatches !== null ? aiMatches : filteredCoaches;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 pb-6 border-b border-border">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 inline-flex">
              <AnimatedBadge variant="accent" glow>
                <Award className="w-3 h-3 mr-1.5" /> Verified Instructors
              </AnimatedBadge>
            </motion.div>
            <AnimatedText
              text="Discover Coaches"
              className="text-4xl md:text-5xl font-black tracking-tight mb-2"
              delay={0.1}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary text-sm"
            >
              Book private sessions with verified elite combat sports instructors.
            </motion.p>
          </div>

          {aiMatches !== null && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={resetSearch}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:border-accent transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset Search
            </motion.button>
          )}
        </div>

        {/* AI Matchmaker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <GlassCard variant="glow" padding="lg" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <span className="text-accent text-xs font-black uppercase tracking-widest">Powered by AI</span>
              </div>
              <h2 className="text-xl font-black mb-1">Athlix AI Matchmaker</h2>
              <p className="text-text-secondary text-sm mb-5 max-w-2xl">
                Describe your goals in plain language — discipline, schedule, budget — and we rank the best coach fits for you.
              </p>

              <form onSubmit={handleAiMatch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    value={matchQuery}
                    onChange={e => setMatchQuery(e.target.value)}
                    placeholder="E.g. BJJ coach available on weekends, under $80/hr..."
                    className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
                <MagneticButton
                  variant="premium"
                  type="submit"
                  disabled={aiLoading}
                  className="min-w-[140px] justify-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {aiLoading ? 'Matching...' : 'Match Me'}
                </MagneticButton>
              </form>
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Loading */}
        <AnimatePresence>
          {aiLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-10"
            >
              <GlassCard padding="lg" className="text-center">
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-accent text-sm font-semibold animate-pulse">{stagedMessage}</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Message */}
        {!aiLoading && aiMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <GlassCard padding="md" className="flex items-start gap-4 border-warning/30">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning text-sm mb-1">Matchmaker Alert</p>
                <p className="text-text-secondary text-sm">{aiMessage}</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Discipline Filter (only when not in AI mode) */}
        {!aiLoading && aiMatches === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 bg-surface p-1 border border-border rounded-xl w-max mb-8 max-w-full"
          >
            {disciplines.map(d => (
              <button
                key={d}
                onClick={() => setDiscipline(d)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  discipline === d
                    ? 'bg-accent text-black font-black shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {d}
              </button>
            ))}
          </motion.div>
        )}

        {/* AI Match Header */}
        {aiMatches !== null && !aiLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-6"
          >
            <h2 className="text-xl font-black">AI Matchmaker Results</h2>
            <AnimatedBadge variant="accent">
              {aiMatches.length} {aiMatches.length === 1 ? 'match' : 'matches'} found
            </AnimatedBadge>
          </motion.div>
        )}

        {/* Coach Grid */}
        {!aiLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {displayCoaches.map((coach: any, idx: number) => {
                const isAiMatch = aiMatches !== null;
                const matchScore = coach.matchScore;
                const discColor = disciplineColors[coach.discipline] || 'text-text-secondary bg-surface border-border';

                return (
                  <motion.div
                    key={coach.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    layout
                  >
                    <GlassCard padding="none" variant="interactive" className="h-full flex flex-col group overflow-hidden">
                      {/* Header */}
                      <div className="p-6 pb-4 flex items-start gap-4 border-b border-border">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface border border-border">
                            <img
                              src={coach.avatar}
                              alt={coach.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-surface text-xl font-black text-accent">${coach.name[0]}</div>`;
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-black text-base leading-tight truncate group-hover:text-accent transition-colors">
                              {coach.name}
                            </h3>
                            {isAiMatch && matchScore && (
                              <span className="text-accent text-[10px] font-black bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full shrink-0">
                                {matchScore}%
                              </span>
                            )}
                          </div>
                          <p className="text-text-secondary text-xs mb-2 truncate flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-accent inline" /> {coach.rank || coach.beltRank || 'Verified'}
                          </p>
                          <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${discColor}`}>
                            {coach.discipline}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="p-6 flex-1 flex flex-col">
                        {(coach.bio) && (
                          <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2">
                            {coach.bio}
                          </p>
                        )}

                        {isAiMatch && coach.reason && (
                          <div className="bg-accent/5 border-l-2 border-accent rounded-r-xl p-3 mb-4">
                            <p className="text-xs text-accent font-semibold">★ AI Rationale</p>
                            <p className="text-xs text-text-secondary mt-1">{coach.reason}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-surface rounded-xl p-3 border border-border flex items-center gap-2">
                            <Clock className="w-4 h-4 text-text-tertiary shrink-0" />
                            <div>
                              <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-mono">Experience</p>
                              <p className="text-xs font-bold mt-0.5">{coach.experience || `${coach.experienceYears} yrs`}</p>
                            </div>
                          </div>
                          <div className="bg-surface rounded-xl p-3 border border-border flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-text-tertiary shrink-0" />
                            <div>
                              <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-mono">Rate</p>
                              <p className="text-xs font-bold mt-0.5">{coach.rate || `$${coach.pricingPerHour}/hr`}</p>
                            </div>
                          </div>
                        </div>

                        {/* Rating */}
                        {coach.rating && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(coach.rating) ? 'fill-amber-400 text-amber-400' : 'text-border fill-border'}`} />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-text-primary">{coach.rating}</span>
                            <span className="text-xs text-text-tertiary">({coach.reviews} reviews)</span>
                          </div>
                        )}

                        {coach.availability && (
                          <div className="flex items-center gap-2 mb-4 text-xs text-text-tertiary">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{coach.availability}</span>
                          </div>
                        )}

                        {/* Certs */}
                        {coach.certifications && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {coach.certifications.map((c: string, i: number) => (
                              <span key={i} className="text-[10px] font-semibold border border-border rounded-full px-2 py-0.5 text-text-tertiary bg-surface/50">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="mt-auto">
                          <Link href="/bookings" className="block">
                            <MagneticButton variant="premium" className="w-full justify-center">
                              Book Session <ChevronRight className="w-4 h-4 ml-1" />
                            </MagneticButton>
                          </Link>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {displayCoaches.length === 0 && !aiLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16 text-text-secondary"
              >
                <Filter className="w-10 h-10 mx-auto mb-4 opacity-30" />
                <p className="font-semibold mb-2">No coaches found</p>
                <p className="text-sm">Try adjusting your filters or search criteria.</p>
              </motion.div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
