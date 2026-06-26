'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Star, Navigation, Building2, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';

interface Gym {
  id: number;
  name: string;
  lat: number;
  lng: number;
  disciplines: string[];
  rating: number;
  reviews: number;
  address: string;
  description: string;
  distance: string;
  color: string;
}

const mockGyms: Gym[] = [
  {
    id: 1,
    name: 'Apex Grappling Lab',
    lat: 37.7794,
    lng: -122.4132,
    disciplines: ['BJJ', 'Wrestling'],
    rating: 4.9,
    reviews: 142,
    address: '825 Market St, San Francisco, CA',
    description: 'San Francisco\'s premier institute for submission grappling and freestyle wrestling. World-class mats and coaching.',
    distance: '0.6 miles',
    color: 'purple',
  },
  {
    id: 2,
    name: 'Redline Striking Academy',
    lat: 37.7682,
    lng: -122.4211,
    disciplines: ['Muay Thai', 'Boxing'],
    rating: 4.85,
    reviews: 96,
    address: '1042 Valencia St, San Francisco, CA',
    description: 'Elite kickboxing and Muay Thai classes. Home of active professional Muay Thai competitors and trainers.',
    distance: '1.2 miles',
    color: 'green',
  },
  {
    id: 3,
    name: 'Golden Gate MMA',
    lat: 37.7853,
    lng: -122.4342,
    disciplines: ['MMA', 'BJJ', 'Boxing'],
    rating: 4.75,
    reviews: 118,
    address: '1980 Post St, San Francisco, CA',
    description: 'A complete combat sports center offering professional MMA fighter programs and beginner-friendly classes.',
    distance: '1.5 miles',
    color: 'blue',
  },
  {
    id: 4,
    name: 'Vanguard Wrestling Club',
    lat: 37.7561,
    lng: -122.4089,
    disciplines: ['Wrestling'],
    rating: 4.92,
    reviews: 82,
    address: '2450 17th St, San Francisco, CA',
    description: 'Specialized training in freestyle and Greco-Roman wrestling. Perfect for athletes looking to improve their takedowns.',
    distance: '2.0 miles',
    color: 'amber',
  },
  {
    id: 5,
    name: 'Apex Boxing Gym',
    lat: 37.7912,
    lng: -122.4012,
    disciplines: ['Boxing'],
    rating: 4.68,
    reviews: 64,
    address: '450 Sansome St, San Francisco, CA',
    description: 'Traditional sweet science training in the heart of the financial district. High-intensity sparring and mitt work.',
    distance: '1.4 miles',
    color: 'red',
  },
  {
    id: 6,
    name: 'Zenith Jiu-Jitsu SF',
    lat: 37.7621,
    lng: -122.4431,
    disciplines: ['BJJ'],
    rating: 4.8,
    reviews: 74,
    address: '1200 Stanyan St, San Francisco, CA',
    description: 'Technical BJJ instruction for all levels, focusing on self-defense, competition, and core fitness.',
    distance: 2.8 + ' miles',
    color: 'purple',
  },
  {
    id: 7,
    name: 'Pacific Muay Thai',
    lat: 37.7482,
    lng: -122.4182,
    disciplines: ['Muay Thai'],
    rating: 4.9,
    reviews: 112,
    address: '3150 Mission St, San Francisco, CA',
    description: 'Authentic Thai training and conditioning. Friendly community, certified Kru coaches, and junior programs.',
    distance: '2.2 miles',
    color: 'green',
  },
  {
    id: 8,
    name: 'Bay Area Combat Club',
    lat: 37.8021,
    lng: -122.4251,
    disciplines: ['MMA', 'Wrestling', 'BJJ'],
    rating: 4.72,
    reviews: 90,
    address: '750 Beach St, San Francisco, CA',
    description: 'Waterfront combat training facility providing conditioning, cage sparring, and cross-functional fitness.',
    distance: '2.5 miles',
    color: 'blue',
  },
  {
    id: 9,
    name: 'Iron Glove Boxing',
    lat: 37.7391,
    lng: -122.4392,
    disciplines: ['Boxing', 'MMA'],
    rating: 4.62,
    reviews: 48,
    address: '415 Ocean Ave, San Francisco, CA',
    description: 'Hardcore, old-school boxing club focusing on building mental toughness, stamina, and solid fundamentals.',
    distance: '3.6 miles',
    color: 'red',
  },
  {
    id: 10,
    name: 'Mission Submission BJJ',
    lat: 37.7594,
    lng: -122.4153,
    disciplines: ['BJJ', 'Wrestling'],
    rating: 4.88,
    reviews: 104,
    address: '2980 16th St, San Francisco, CA',
    description: 'High-level No-Gi grappling lab. Special focus on modern leglocks, back takes, and submission strategy.',
    distance: '1.6 miles',
    color: 'purple',
  },
];

const disciplineColors: Record<string, string> = {
  BJJ: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
  'Muay Thai': 'text-green-400 border-green-500/20 bg-green-500/10',
  MMA: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
  Boxing: 'text-red-400 border-red-500/20 bg-red-500/10',
  Wrestling: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
};

const mapColors: Record<string, string> = {
  purple: '#8b5cf6',
  green: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
};

export default function GymsPage() {
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const filteredGyms = mockGyms.filter((gym) => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'All' || gym.disciplines.includes(selectedDiscipline);
    return matchesSearch && matchesDiscipline;
  });

  // Client-side initialization of Leaflet
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Load Leaflet CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Initialize Map and Render Markers
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    // Create Map (Initial Zoom-out state for fly-in animation)
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([37.74, -122.43], 11);

    mapInstanceRef.current = map;

    // Render Dark-Theme Map Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Apply Leaflet Zoom Control to bottom-right
    L.control.zoom({
      position: 'bottomright',
    }).addTo(map);

    // Signature smooth Fly-in Zoom Animation on load
    setTimeout(() => {
      map.flyTo([37.7749, -122.4194], 13.5, {
        duration: 1.8,
        easeLinearity: 0.25,
      });
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update Markers when filters change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Render new markers
    filteredGyms.forEach((gym) => {
      const pinColor = mapColors[gym.color] || '#3b82f6';
      
      const customHtml = `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute w-6 h-6 rounded-full bg-[${pinColor}]/20 animate-ping"></div>
          <div class="w-4.5 h-4.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background-color: ${pinColor}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([gym.lat, gym.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedGym(gym);
        map.flyTo([gym.lat - 0.005, gym.lng], 15, {
          duration: 1.2,
          easeLinearity: 0.3,
        });
      });

      markersRef.current.push(marker);
    });
  }, [mapLoaded, filteredGyms, searchQuery, selectedDiscipline]);

  const handleGymSelect = (gym: Gym) => {
    setSelectedGym(gym);
    if (mapInstanceRef.current && typeof window !== 'undefined') {
      mapInstanceRef.current.flyTo([gym.lat - 0.005, gym.lng], 15, {
        duration: 1.2,
        easeLinearity: 0.3,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-24 pb-0 flex flex-col md:flex-row relative h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Side: Search & Gym List */}
        <section className="w-full md:w-[400px] border-r border-border bg-surface/50 backdrop-blur-xl flex flex-col justify-between shrink-0 z-10 h-1/2 md:h-full relative overflow-y-auto">
          <div className="p-5 flex-grow space-y-5">
            <div>
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
                <AnimatedBadge variant="accent" glow>
                  <MapPin className="w-3 h-3 mr-1" /> Gym Finder
                </AnimatedBadge>
              </motion.div>
              <h1 className="text-2xl font-black tracking-tight mb-1">Nearby Gyms & Clubs</h1>
              <p className="text-text-secondary text-xs">Discover verified martial arts training centers near San Francisco</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gyms by name or address..."
                className="w-full bg-surface-hover border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-text-primary"
              />
            </div>

            {/* Discipline Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {['All', 'BJJ', 'Muay Thai', 'MMA', 'Boxing', 'Wrestling'].map((disc) => (
                <button
                  key={disc}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${
                    selectedDiscipline === disc
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>

            {/* Gym List */}
            <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {filteredGyms.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-8">No matching gyms found.</p>
              ) : (
                filteredGyms.map((gym) => (
                  <div
                    key={gym.id}
                    onClick={() => handleGymSelect(gym)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left group ${
                      selectedGym?.id === gym.id
                        ? 'bg-accent/5 border-accent'
                        : 'bg-surface border-border hover:border-accent/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">
                        {gym.name}
                      </h4>
                      <span className="text-[10px] text-text-tertiary font-mono">{gym.distance}</span>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-bold text-text-secondary">{gym.rating}</span>
                      <span className="text-[10px] text-text-tertiary">({gym.reviews} reviews)</span>
                    </div>

                    <p className="text-[11px] text-text-secondary line-clamp-1 mb-3">{gym.address}</p>

                    <div className="flex gap-1.5 flex-wrap">
                      {gym.disciplines.map((d) => (
                        <span key={d} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${disciplineColors[d]}`}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Map & Floating Detail Panel */}
        <section className="flex-grow h-1/2 md:h-full relative w-full bg-surface">
          <div ref={mapContainerRef} className="w-full h-full relative z-0 leaflet-dark-mode-tiles" />

          {/* Custom CSS to invert tiles and create custom Dark Mode Map */}
          <style>{`
            .leaflet-dark-mode-tiles .leaflet-tile-container {
              filter: invert(90%) hue-rotate(200deg) brightness(85%) contrast(90%) !important;
            }
            .leaflet-container {
              background: #0d0d1a !important;
            }
            .leaflet-bar {
              border: 1px solid rgba(255,255,255,0.08) !important;
              box-shadow: none !important;
              border-radius: 12px !important;
              overflow: hidden;
            }
            .leaflet-bar a {
              background-color: #16162a !important;
              color: #a0aec0 !important;
              border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            }
            .leaflet-bar a:hover {
              color: #ff3b30 !important;
              background-color: #20203a !important;
            }
          `}</style>

          {/* Floating Details slide-in Card */}
          <AnimatePresence>
            {selectedGym && (
              <motion.div
                initial={{ opacity: 0, y: 100, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 100, x: '-50%' }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] sm:w-[450px] z-20 pointer-events-auto"
              >
                <GlassCard padding="lg" variant="glow" className="relative text-left border-accent/40">
                  <button
                    onClick={() => setSelectedGym(null)}
                    className="absolute top-4 right-4 w-7 h-7 bg-surface-hover hover:bg-accent/15 border border-border hover:border-accent/40 rounded-full flex items-center justify-center text-text-secondary hover:text-accent transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 rotate-45" />
                  </button>

                  <div className="mb-4">
                    <span className="text-[10px] text-accent font-bold uppercase tracking-wider block mb-1">
                      Gym Details · {selectedGym.distance} Away
                    </span>
                    <h3 className="font-black text-xl text-text-primary mb-1">{selectedGym.name}</h3>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-text-secondary">{selectedGym.rating}</span>
                      </div>
                      <span className="text-xs text-text-tertiary">({selectedGym.reviews} Reviews)</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4">{selectedGym.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                      <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{selectedGym.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1.5">
                      {selectedGym.disciplines.map((d) => (
                        <span key={d} className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${disciplineColors[d]}`}>
                          {d}
                        </span>
                      ))}
                    </div>

                    <Link href={`/bookings?gymId=${selectedGym.id}`}>
                      <button className="px-4 py-2 bg-accent text-white font-bold rounded-xl text-xs hover:bg-accent-hover transition-colors shadow-lg shadow-accent/25 flex items-center gap-1">
                        Book Session <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
