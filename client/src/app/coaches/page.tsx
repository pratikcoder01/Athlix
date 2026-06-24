'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Star, Award, Shield, Calendar, DollarSign, Clock } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';

export default function DiscoverCoachesPage() {
  const [discipline, setDiscipline] = useState('All');
  
  const coaches = [
    {
      id: 1,
      name: 'Prof. Renato Silva',
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

  const filteredCoaches = discipline === 'All'
    ? coaches
    : coaches.filter(c => c.discipline === discipline);

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-border/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">DISCOVER COACHES</h1>
          <p className="text-text-secondary text-xs mt-1">Book private sparring and review slots with verified instructors</p>
        </div>

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
      </div>

      <Footer />
    </div>
  );
}
