'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Building, Shield, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold font-display tracking-wide uppercase">ACADEMY DIRECTORY</h1>
          <p className="text-text-secondary text-sm">Explore premium local training facilities and programs</p>
        </div>

        {/* Split screen: List and Interactive Map Mock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left panel: List */}
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search academies by name or location..."
                className="w-full bg-secondary border border-border rounded pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary text-text-primary"
              />
            </div>

            <div className="flex flex-col gap-6">
              {academies.map((academy) => (
                <SpotlightCard
                  key={academy.id}
                  onClick={() => setActiveAcademyId(academy.id)}
                  className={`bg-secondary border cursor-pointer transition-all p-6 ${
                    activeAcademyId === academy.id ? 'border-primary shadow-lg shadow-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold font-display uppercase tracking-wide">{academy.name}</h3>
                      <p className="text-xs text-text-secondary mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {academy.address}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded text-xs font-mono font-bold text-gold shrink-0">
                      <Star className="h-3.5 w-3.5 fill-gold stroke-gold" /> {academy.rating}
                    </div>
                  </div>

                  <hr className="border-border my-4" />

                  {/* Programs & Facilities list */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <span className="font-bold text-text-primary block mb-1">PROGRAMS</span>
                      <ul className="list-disc pl-4 text-text-secondary">
                        {academy.programs.map((prog, idx) => <li key={idx}>{prog}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-text-primary block mb-1">FACILITIES</span>
                      <ul className="list-disc pl-4 text-text-secondary">
                        {academy.facilities.map((fac, idx) => <li key={idx}>{fac}</li>)}
                      </ul>
                    </div>
                  </div>

                  <a
                    href={academy.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-primary tracking-widest font-bebas mt-2 hover:translate-x-1 transition-transform"
                  >
                    GET DIRECTIONS <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </a>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Right panel: Interactive Mockup Map */}
          <div className="hidden lg:block">
            <SpotlightCard className="bg-secondary border border-border h-full p-8 flex flex-col justify-between overflow-hidden relative min-h-[500px]">
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
                <Building className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold font-display uppercase tracking-wide">LOCATION MAP TRACKING</h3>
              </div>

              {/* Pin representation */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="h-12 w-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <MapPin className="h-6 w-6 text-primary" />
                </motion.div>
                <span className="text-xs font-bold text-text-primary font-mono bg-surface border border-border px-3 py-1 rounded-full mt-4">
                  {activeAcademyId ? academies.find(a => a.id === activeAcademyId)?.name : 'Select Academy'}
                </span>
              </div>

              <p className="relative z-10 text-xs text-text-secondary text-center leading-relaxed">
                Geospatial coordinates mapping coordinates automatically from user searches. WHitelist location permissions to enable proximity.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
