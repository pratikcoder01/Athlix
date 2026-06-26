'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Building2, ChevronRight, Users, Dumbbell, Shield, ExternalLink } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';

const academies = [
  {
    id: 1,
    name: 'Renzo Gracie Academy SF',
    address: '123 Mission St, San Francisco, CA',
    rating: 4.9,
    reviews: 142,
    students: 320,
    programs: ['Brazilian Jiu-Jitsu', 'Muay Thai', 'MMA Conditioning'],
    facilities: ['Mat Area 3,000 sqft', 'Showers & Locker Rooms', 'Sauna', 'Strength Room'],
    locationLink: 'https://maps.google.com',
    logo: '/images/academies/renzo-gracie-sf.png',
    founded: 2009,
    headCoach: 'Prof. Renzo Gracie',
    color: 'blue',
  },
  {
    id: 2,
    name: 'Alliance Jiu-Jitsu Silicon Valley',
    address: '456 University Ave, Palo Alto, CA',
    rating: 4.8,
    reviews: 96,
    students: 210,
    programs: ['BJJ Gi & No-Gi', 'Wrestling', 'Kids Self Defense'],
    facilities: ['Mat Area 2,500 sqft', 'Strength Equipment', 'Air Conditioned', 'Pro Shop'],
    locationLink: 'https://maps.google.com',
    logo: '/images/academies/alliance-sv.png',
    founded: 2014,
    headCoach: 'Prof. Marcus Santos',
    color: 'green',
  },
  {
    id: 3,
    name: 'Tiger Muay Thai Phuket',
    address: '789 Chalong Rd, Phuket, Thailand',
    rating: 4.95,
    reviews: 381,
    students: 500,
    programs: ['Muay Thai', 'Boxing', 'MMA', 'BJJ'],
    facilities: ['8 Full-Size Rings', 'Pool Recovery Area', 'Weight Room', 'Nutrition Bar'],
    locationLink: 'https://maps.google.com',
    logo: '/images/academies/tiger-muay-thai.png',
    founded: 2003,
    headCoach: 'Kru Tiger',
    color: 'amber',
  },
  {
    id: 4,
    name: 'American Kickboxing Academy',
    address: '321 Tully Rd, San Jose, CA',
    rating: 5.0,
    reviews: 214,
    students: 280,
    programs: ['Wrestling', 'MMA', 'Boxing', 'BJJ'],
    facilities: ['Competition Cage', 'Elevated Mat Platform', 'Video Review Suite', 'Recovery Lab'],
    locationLink: 'https://maps.google.com',
    logo: '/images/academies/aka.png',
    founded: 1996,
    headCoach: 'Javier Mendez',
    color: 'red',
  },
];

const colorMap: Record<string, { badge: string; glow: string }> = {
  blue: { badge: 'text-blue-400 border-blue-400/30 bg-blue-400/10', glow: 'shadow-blue-400/20' },
  green: { badge: 'text-green-400 border-green-400/30 bg-green-400/10', glow: 'shadow-green-400/20' },
  amber: { badge: 'text-amber-400 border-amber-400/30 bg-amber-400/10', glow: 'shadow-amber-400/20' },
  red: { badge: 'text-red-400 border-red-400/30 bg-red-400/10', glow: 'shadow-red-400/20' },
};

export default function DiscoverAcademiesPage() {
  const [activeId, setActiveId] = useState<number>(1);
  const [query, setQuery] = useState('');

  const filtered = academies.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.address.toLowerCase().includes(query.toLowerCase())
  );

  const active = academies.find(a => a.id === activeId) || academies[0];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <AnimatedBadge variant="accent" glow>
              <Building2 className="w-3 h-3 mr-1.5" /> Academy Directory
            </AnimatedBadge>
          </motion.div>
          <AnimatedText
            text="World-Class Training Facilities"
            className="text-4xl md:text-5xl font-black tracking-tight mb-3"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-lg max-w-2xl"
          >
            Explore verified academies across disciplines. Find the perfect training home.
          </motion.p>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by academy name or location..."
              className="w-full bg-surface border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Academy List */}
          <div className="lg:col-span-2 space-y-4">
            {filtered.map((academy, idx) => {
              const colors = colorMap[academy.color] || colorMap.blue;
              const isActive = activeId === academy.id;

              return (
                <motion.div
                  key={academy.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <GlassCard
                    padding="md"
                    variant={isActive ? 'glow' : 'interactive'}
                    className={`cursor-pointer transition-all ${isActive ? 'ring-1 ring-accent/40' : ''}`}
                    onClick={() => setActiveId(academy.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Logo placeholder */}
                      <div className={`w-12 h-12 rounded-xl border ${colors.badge} flex items-center justify-center shrink-0 overflow-hidden`}>
                        <img
                          src={academy.logo}
                          alt={academy.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            el.parentElement!.innerHTML = `<span class="text-xl font-black">${academy.name[0]}</span>`;
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-black text-sm leading-tight ${isActive ? 'text-accent' : ''}`}>
                            {academy.name}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold">{academy.rating}</span>
                          </div>
                        </div>
                        <p className="text-text-tertiary text-xs flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3 shrink-0" /> {academy.address}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{academy.students} members</span>
                          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {academy.programs[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-text-secondary">
                <Building2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No academies match your search.</p>
              </div>
            )}
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <GlassCard variant="glow" padding="none" className="overflow-hidden">
                  {/* Map mockup */}
                  <div className="relative h-52 bg-surface flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />

                    {/* Animated pin */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="relative z-10 flex flex-col items-center"
                    >
                      <div className={`w-12 h-12 rounded-2xl border ${colorMap[active.color]?.badge || ''} flex items-center justify-center shadow-xl bg-surface`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="mt-2 text-xs font-black bg-background border border-border px-3 py-1 rounded-full shadow-lg">
                        {active.name}
                      </div>
                    </motion.div>

                    {/* Ripple circles */}
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2 + i * 0.5, delay: i * 0.4, ease: 'easeOut' }}
                        className="absolute w-12 h-12 rounded-full border border-accent/40"
                      />
                    ))}
                  </div>

                  {/* Academy details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-black mb-1">{active.name}</h2>
                        <p className="text-text-secondary text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-accent" /> {active.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(active.rating) ? 'fill-amber-400 text-amber-400' : 'text-border fill-border'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-text-tertiary">{active.reviews} reviews</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { icon: Users, label: 'Members', value: `${active.students}+` },
                        { icon: Shield, label: 'Head Coach', value: active.headCoach.split(' ').slice(-1)[0] },
                        { icon: Dumbbell, label: 'Founded', value: `${active.founded}` },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-surface rounded-xl p-3 text-center">
                          <Icon className="w-4 h-4 mx-auto mb-1 text-accent" />
                          <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
                          <p className="text-sm font-black">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Programs & Facilities */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-3">Programs</p>
                        <ul className="space-y-2">
                          {active.programs.map((p, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-3">Facilities</p>
                        <ul className="space-y-2">
                          {active.facilities.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                              <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <MagneticButton variant="premium" className="flex-1 justify-center">
                        View Schedule <ChevronRight className="w-4 h-4 ml-1" />
                      </MagneticButton>
                      <a href={active.locationLink} target="_blank" rel="noopener noreferrer">
                        <MagneticButton variant="outline" className="px-4">
                          <ExternalLink className="w-4 h-4" />
                        </MagneticButton>
                      </a>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
