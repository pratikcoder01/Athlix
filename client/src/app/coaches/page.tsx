'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, Award, Shield, Calendar, DollarSign, Clock, Sparkles, RotateCcw, AlertTriangle } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';

export default function DiscoverCoachesPage() {
  const [discipline, setDiscipline] = useState('All');
  
  // AI Matchmaker states
  const [matchQuery, setMatchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [stagedMessage, setStagedMessage] = useState('Understanding your goals...');
  const [aiMatches, setAiMatches] = useState<any[] | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const coaches = [
    {
      id: 1,
      name: 'Prof. Thiago Valente',
      discipline: 'BJJ',
      rank: 'Black Belt 3rd Degree',
      experience: '15 years',
      rate: '$90/hr',
      rating: '5.0',
      reviews: 88,
      certifications: ['IBJJF Certified', 'First Aid Certified'],
      availability: 'Mon, Wed, Fri (09:00 - 17:00)'
    },
    {
      id: 2,
      name: 'Coach Kru Somchai',
      discipline: 'Muay Thai',
      rank: 'Lumpinee Stadium Vet',
      experience: '12 years',
      rate: '$75/hr',
      rating: '4.9',
      reviews: 124,
      certifications: ['MTIA Certified Instructor'],
      availability: 'Tue, Thu, Sat (10:00 - 18:00)'
    }
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const formatAvailability = (availability: any) => {
    if (typeof availability === 'string') return availability;
    if (!Array.isArray(availability) || availability.length === 0) return 'BY APPOINTMENT';
    return availability.map((av: any) => {
      const dayAbbrev = av.dayOfWeek ? av.dayOfWeek.slice(0, 3) : '';
      return `${dayAbbrev} (${av.startTime}-${av.endTime})`;
    }).join(', ');
  };

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
      "Matching location preferences...",
      "Ranking the best fits..."
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: matchQuery })
      });

      if (!response.ok) {
        throw new Error('Failed to find matches');
      }

      const data = await response.json();
      if (data.skipAI) {
        setAiMessage(data.message || 'Broaden your search criteria to discover more matches.');
        setAiMatches([]);
      } else {
        setAiMatches(data.coaches || []);
      }
    } catch (err) {
      console.error(err);
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

  const filteredCoaches = discipline === 'All'
    ? coaches
    : coaches.filter(c => c.discipline === discipline);

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-border/60 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">DISCOVER COACHES</h1>
            <p className="text-text-secondary text-xs mt-1">Book private sparring and review slots with verified instructors</p>
          </div>
          {aiMatches !== null && (
            <button 
              onClick={resetSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-surface border border-border text-xs font-mono font-bold rounded-sm cursor-pointer transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" /> RESET SEARCH
            </button>
          )}
        </div>

        {/* AI Matchmaker — prominent differentiator */}
        <div className="mb-10 p-6 sm:p-8 bg-secondary border-2 border-primary/30 rounded-sm relative overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.06)]">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Powered by AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-wide text-text-primary display-skew inline-block mb-4">
              <span>Athlix AI Matchmaker</span>
            </h2>
            <p className="text-xs text-text-secondary mb-5 max-w-2xl">
              Describe your goals in plain language — discipline, schedule, budget — and we rank the best coach fits for you.
            </p>
          </div>
          <form onSubmit={handleAiMatch} className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={matchQuery}
                onChange={(e) => setMatchQuery(e.target.value)}
                placeholder="Describe what you're looking for (e.g. Muay Thai coach for weekends under $50)..."
                className="w-full bg-surface border border-border text-text-primary px-4 py-3.5 rounded-sm text-xs font-mono focus:outline-none focus:border-primary/80 pr-10"
              />
              <Search className="absolute right-3 top-3.5 h-4 w-4 text-text-secondary" />
            </div>
            <MagneticButton type="submit" className="bg-primary hover:bg-opacity-95 text-white px-6 py-3.5 rounded-sm text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 min-w-[140px]">
              <Sparkles className="h-4 w-4" /> MATCH ME
            </MagneticButton>
          </form>
        </div>

        {/* Loading state */}
        {aiLoading && (
          <div className="mb-12 flex flex-col items-center justify-center py-16 bg-secondary border border-border rounded-sm">
            <div className="w-full max-w-md h-12 skeleton rounded-sm mb-6" />
            <div className="w-48 h-3 skeleton rounded-sm mb-4" />
            <p className="text-xs font-mono text-text-primary font-bold uppercase tracking-wider">
              {stagedMessage}
            </p>
          </div>
        )}

        {/* AI Matches or Message */}
        {!aiLoading && aiMessage && (
          <div className="mb-8 p-6 bg-secondary border border-primary/20 rounded-sm flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-mono font-bold text-primary uppercase mb-1">Matchmaker Alert</h3>
              <p className="text-[11px] font-mono text-text-secondary font-bold uppercase">{aiMessage}</p>
            </div>
          </div>
        )}

        {/* Dynamic Coach Grid */}
        {!aiLoading && (
          <>
            {aiMatches !== null ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-display font-black uppercase tracking-wide">AI Matchmaker Recommendations</h2>
                  <span className="text-[10px] font-mono font-bold text-text-secondary bg-surface px-2.5 py-1 border border-border rounded-sm">
                    {aiMatches.length} FIT{aiMatches.length !== 1 ? 'S' : ''} FOUND
                  </span>
                </div>

                {aiMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiMatches.map((coach) => (
                      <SpotlightCard key={coach.id} className="bg-secondary border border-primary/30 rounded-sm p-6 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary/10 border-l border-b border-primary/35 px-3.5 py-1 text-[10px] font-mono font-black text-primary tracking-widest uppercase animate-pulse">
                          {coach.matchScore}% MATCH
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-start mb-4 pr-24">
                            <div>
                              <h3 className="text-xl font-display font-black uppercase tracking-wide">{coach.name}</h3>
                              <span className="text-[10px] text-text-secondary font-mono mt-1 block uppercase font-bold">{coach.beltRank} • {coach.discipline}</span>
                            </div>
                          </div>

                          {/* Highlighted AI Reason Callout */}
                          <div className="mb-5 p-3.5 bg-primary/5 border-l-2 border-primary rounded-sm text-[10px] font-mono text-text-primary/95 leading-relaxed font-bold">
                            <span className="text-primary mr-1">★ AI FIT RATIONALE:</span>
                            {coach.reason}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[10px] font-mono text-text-secondary mb-6 bg-surface/50 p-3.5 rounded-sm border border-border/30 font-bold uppercase">
                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {coach.experienceYears} YEARS EXP</span>
                            <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-primary" /> ${coach.pricingPerHour}/HR RATE</span>
                            <span className="flex items-center gap-1.5 sm:col-span-2"><Calendar className="h-4 w-4 text-primary" /> {formatAvailability(coach.availability).toUpperCase()}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {coach.certifications.map((c: string, idx: number) => (
                              <span key={idx} className="bg-surface border border-border text-[9px] font-bold font-mono px-2 py-0.5 rounded-sm text-text-secondary">
                                {c.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Link href="/bookings" className="w-full">
                          <MagneticButton className="w-full bg-primary hover:bg-opacity-95 text-white py-3 rounded-sm text-xs font-mono font-bold tracking-wider uppercase">
                            BOOK INSTRUCTION SLOT
                          </MagneticButton>
                        </Link>
                      </SpotlightCard>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-secondary font-mono text-xs font-bold uppercase">
                    Use the reset button to view our default verified roster.
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Filter controls */}
                <div className="flex flex-wrap gap-2.5 mb-8 bg-secondary p-4 rounded-sm border border-border">
                  {['All', 'BJJ', 'Muay Thai', 'MMA', 'Boxing'].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => setDiscipline(disc)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-bold font-mono cursor-pointer transition-all ${
                        discipline === disc
                          ? 'bg-primary text-white'
                          : 'bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {disc.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* List of coaches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCoaches.map((coach) => (
                    <SpotlightCard key={coach.id} className="bg-secondary border border-border rounded-sm p-6 flex flex-col justify-between h-[360px]">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-display font-black uppercase tracking-wide">{coach.name}</h3>
                            <span className="text-[10px] text-text-secondary font-mono mt-1 block uppercase font-bold">{coach.rank} • {coach.discipline}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold text-primary border border-border/40">
                            <Star className="h-3.5 w-3.5 fill-primary stroke-primary" /> {coach.rating}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[10px] font-mono text-text-secondary mb-6 bg-surface/50 p-3.5 rounded-sm border border-border/30 font-bold uppercase">
                          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {coach.experience.toUpperCase()} EXP</span>
                          <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-primary" /> {coach.rate} RATE</span>
                          <span className="flex items-center gap-1.5 sm:col-span-2"><Calendar className="h-4 w-4 text-primary" /> {coach.availability.toUpperCase()}</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {coach.certifications.map((c, idx) => (
                            <span key={idx} className="bg-surface border border-border text-[9px] font-bold font-mono px-2 py-0.5 rounded-sm text-text-secondary">
                              {c.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link href="/bookings" className="w-full">
                        <MagneticButton className="w-full bg-primary hover:bg-opacity-95 text-white py-3 rounded-sm text-xs font-mono font-bold tracking-wider uppercase">
                          BOOK INSTRUCTION SLOT
                        </MagneticButton>
                      </Link>
                    </SpotlightCard>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
