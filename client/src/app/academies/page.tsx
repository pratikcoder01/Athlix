'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Building, ChevronRight } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';

export default function DiscoverAcademiesPage() {
  const [activeAcademyId, setActiveAcademyId] = useState<number | null>(1);
  
  const academies = [
    {
      id: 1,
      name: 'Renzo Gracie Academy SF',
      address: '123 Mission St, San Francisco, CA',
      rating: '4.9',
      reviews: 142,
      programs: ['Brazilian Jiu-Jitsu', 'Muay Thai', 'MMA Conditioning'],
      facilities: ['Mat Area 3000 sqft', 'Showers & Locker Rooms', 'Sauna'],
      locationLink: 'https://maps.google.com'
    },
    {
      id: 2,
      name: 'Alliance Jiu-Jitsu Silicon Valley',
      address: '456 University Ave, Palo Alto, CA',
      rating: '4.8',
      reviews: 96,
      programs: ['BJJ Gi & No-Gi', 'Wrestling', 'Kids Self Defense'],
      facilities: ['Mat Area 2500 sqft', 'Strength Equipment', 'Air Conditioned'],
      locationLink: 'https://maps.google.com'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-border/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">ACADEMY DIRECTORY</h1>
          <p className="text-text-secondary text-xs mt-1">Explore verified local training facilities and programs</p>
        </div>

        {/* Split screen: Directory List and Interactive Map Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left panel: List */}
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search academies by name or location..."
                className="w-full bg-secondary border border-border rounded-sm pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary text-text-primary font-sans"
              />
            </div>

            <div className="flex flex-col gap-6">
              {academies.map((academy) => (
                <SpotlightCard
                  key={academy.id}
                  onClick={() => setActiveAcademyId(academy.id)}
                  className={`bg-secondary border cursor-pointer rounded-sm transition-all p-6 ${
                    activeAcademyId === academy.id ? 'border-primary shadow-lg shadow-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-display font-black uppercase tracking-wide">{academy.name}</h3>
                      <p className="text-xs text-text-secondary mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {academy.address}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold text-primary border border-border/40 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-primary stroke-primary" /> {academy.rating}
                    </div>
                  </div>

                  <hr className="border-border/40 my-4" />

                  {/* Programs & Facilities list */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono font-bold text-text-secondary mb-4 uppercase">
                    <div>
                      <span className="text-text-primary block mb-1.5">PROGRAMS</span>
                      <ul className="list-disc pl-4 flex flex-col gap-1">
                        {academy.programs.map((prog, idx) => <li key={idx}>{prog}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-text-primary block mb-1.5">FACILITIES</span>
                      <ul className="list-disc pl-4 flex flex-col gap-1">
                        {academy.facilities.map((fac, idx) => <li key={idx}>{fac}</li>)}
                      </ul>
                    </div>
                  </div>

                  <a
                    href={academy.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-primary tracking-wider font-mono mt-2 hover:translate-x-0.5 transition-transform uppercase"
                  >
                    GET DIRECTIONS <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </a>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Right panel: Interactive Mockup Map */}
          <div className="hidden lg:block">
            <SpotlightCard className="bg-secondary border border-border rounded-sm h-full p-8 flex flex-col justify-between overflow-hidden relative min-h-[500px]">
              
              {/* Map grid lines mockup */}
              <div className="absolute inset-0 bg-surface/30 flex flex-col justify-around select-none pointer-events-none opacity-20 z-0">
                <div className="h-px w-full bg-border" />
                <div className="h-px w-full bg-border" />
                <div className="h-px w-full bg-border" />
                <div className="h-px w-full bg-border" />
              </div>
              <div className="absolute inset-0 bg-surface/30 flex justify-around select-none pointer-events-none opacity-20 z-0">
                <div className="w-px h-full bg-border" />
                <div className="w-px h-full bg-border" />
                <div className="w-px h-full bg-border" />
                <div className="w-px h-full bg-border" />
              </div>

              <div className="relative z-10 flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-text-primary">COORDINATE RADAR MOCKUP</h3>
              </div>

              {/* Pin representation */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="h-11 w-11 rounded-sm bg-primary/20 border border-primary flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <Building className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="text-[10px] font-bold text-text-primary font-mono bg-surface border border-border px-3.5 py-1.5 rounded-sm mt-4 uppercase">
                  {activeAcademyId ? academies.find(a => a.id === activeAcademyId)?.name : 'Select Academy'}
                </span>
              </div>

              <p className="relative z-10 text-[10px] font-mono text-text-secondary text-center leading-relaxed uppercase font-bold">
                GEOSPATIAL COORDINATES RADAR INTEGRATION
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
