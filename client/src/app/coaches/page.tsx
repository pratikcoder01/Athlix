'use client';

import React, { useState } from 'react';
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
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold font-display tracking-wide uppercase">DISCOVER COACHES</h1>
          <p className="text-text-secondary text-sm">Schedule private instruction with verified combat sports specialists</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-3 mb-8 bg-secondary p-4 rounded-lg border border-border">
          {['All', 'BJJ', 'Muay Thai', 'MMA', 'Boxing'].map((disc) => (
            <button
              key={disc}
              onClick={() => setDiscipline(disc)}
              className={`px-4 py-1.5 rounded text-xs font-bold font-mono cursor-pointer transition-all ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCoaches.map((coach) => (
            <SpotlightCard key={coach.id} className="bg-secondary border border-border p-6 flex flex-col justify-between h-96">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black font-display uppercase tracking-wide">{coach.name}</h3>
                    <span className="text-xs text-text-secondary font-mono mt-0.5 block">{coach.rank} • {coach.discipline}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded text-xs font-mono font-bold text-gold">
                    <Star className="h-3.5 w-3.5 fill-gold stroke-gold" /> {coach.rating}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-text-secondary mb-6 bg-surface/50 p-3 rounded border border-border/30">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {coach.experience} Experience</span>
                  <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-success" /> {coach.rate} rate</span>
                  <span className="flex items-center gap-1.5 md:col-span-2"><Calendar className="h-4 w-4 text-secondary-accent" /> {coach.availability}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {coach.certifications.map((c, idx) => (
                    <span key={idx} className="bg-surface border border-border/60 text-[10px] font-bold font-mono px-2 py-0.5 rounded text-text-secondary">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <MagneticButton className="w-full bg-primary hover:bg-opacity-95 text-white py-3 rounded text-xs font-bebas tracking-widest">
                BOOK APPOINTMENT
              </MagneticButton>
            </SpotlightCard>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
