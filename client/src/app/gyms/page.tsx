'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Star, Navigation, Building2, ChevronRight, Activity, ArrowLeft, Navigation2 } from 'lucide-react';
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
  color: string;
}

const mockGyms: Gym[] = [
  {
    id: 1,
    name: 'Bangalore BJJ Academy',
    lat: 12.9348,
    lng: 77.6189,
    disciplines: ['BJJ', 'Wrestling'],
    rating: 4.92,
    reviews: 142,
    address: '45, 80 Feet Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034',
    description: 'Bengaluru\'s top school for Brazilian Jiu-Jitsu and submission grappling. Affiliated with international competition lineages.',
    color: 'purple',
  },
  {
    id: 2,
    name: 'Combat Kinetics Bangalore',
    lat: 12.9754,
    lng: 77.6410,
    disciplines: ['Muay Thai', 'MMA'],
    rating: 4.85,
    reviews: 96,
    address: '1202, 100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
    description: 'A premium combat sports lab specializing in Muay Thai striking, functional fitness, and amateur MMA preparation.',
    color: 'green',
  },
  {
    id: 3,
    name: 'Total Combat Club',
    lat: 12.9221,
    lng: 77.5855,
    disciplines: ['Boxing', 'MMA'],
    rating: 4.78,
    reviews: 118,
    address: '9th Main Rd, Jayanagar 3rd Block, Bengaluru, Karnataka 560011',
    description: 'Elite boxing rings, heavy bag racks, and dynamic conditioning circuits. Home of regional amateur pugilists.',
    color: 'blue',
  },
  {
    id: 4,
    name: 'Alliance Jiu-Jitsu India',
    lat: 13.0285,
    lng: 77.5896,
    disciplines: ['BJJ'],
    rating: 4.95,
    reviews: 82,
    address: '18, 80 Feet Rd, RT Nagar, Bengaluru, Karnataka 560032',
    description: 'First-generation BJJ academy in India, offering technical Gi and No-Gi training programs for beginners and competitors.',
    color: 'purple',
  },
  {
    id: 5,
    name: 'Deccan MMA & Wrestling',
    lat: 12.9592,
    lng: 77.6974,
    disciplines: ['MMA', 'Wrestling'],
    rating: 4.82,
    reviews: 64,
    address: 'Marathahalli Main Rd, opposite Innovative Multiplex, Bengaluru, Karnataka 560037',
    description: 'High-intensity wrestling drills and MMA cage combat sessions. Perfect for improving takedowns and submission defense.',
    color: 'amber',
  },
  {
    id: 6,
    name: 'Koramangala Boxing Ring',
    lat: 12.9301,
    lng: 77.6225,
    disciplines: ['Boxing'],
    rating: 4.7,
    reviews: 74,
    address: '14, 1st Cross Rd, Koramangala 5th Block, Bengaluru, Karnataka 560095',
    description: 'Traditional boxing training with active sparring leagues, focus mitt routines, and expert coaching.',
    color: 'red',
  },
  {
    id: 7,
    name: 'Absolute Muay Thai India',
    lat: 12.9815,
    lng: 77.5921,
    disciplines: ['Muay Thai'],
    rating: 4.88,
    reviews: 112,
    address: 'Cunningham Rd, Vasanth Nagar, Bengaluru, Karnataka 560051',
    description: 'Authentic training style with traditional Kru coaches. Focuses on elbow/knee clinches and high-cardio training.',
    color: 'green',
  },
  {
    id: 8,
    name: 'Indian Grappling Academy',
    lat: 12.9102,
    lng: 77.6321,
    disciplines: ['BJJ', 'Wrestling'],
    rating: 4.9,
    reviews: 90,
    address: 'L-142, Sector 6, HSR Layout, Bengaluru, Karnataka 560102',
    description: 'Technical BJJ and Olympic wrestling training. Modern mats, clean facility, and dedicated kids BJJ programs.',
    color: 'purple',
  },
  {
    id: 9,
    name: 'Striker Boxing Club',
    lat: 12.9632,
    lng: 77.5321,
    disciplines: ['Boxing'],
    rating: 4.65,
    reviews: 48,
    address: 'MC Layout, Vijayanagar, Bengaluru, Karnataka 560040',
    description: 'Community-focused boxing club offering amateur training, youth programs, and intense cardio sessions.',
    color: 'red',
  },
  {
    id: 10,
    name: 'Apex Combat Sports',
    lat: 13.0125,
    lng: 77.6712,
    disciplines: ['MMA', 'Muay Thai'],
    rating: 4.74,
    reviews: 104,
    address: '80 Feet Rd, HRBR Layout, Kalyan Nagar, Bengaluru, Karnataka 560043',
    description: 'A multidisciplinary combat gym with an indoor ring and crossfit cage. All levels welcome.',
    color: 'blue',
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

// Haversine formula helper to calculate physical distance in kilometers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

export default function GymsPage() {
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Live user location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Compute dynamic distance for gyms
  const getGymDistanceStr = (gym: Gym) => {
    if (userLocation) {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, gym.lat, gym.lng);
      return `${dist.toFixed(1)} km`;
    }
    // Static fallback default distance in Bengaluru (based on default center)
    const dist = calculateDistance(12.9716, 77.5946, gym.lat, gym.lng);
    return `${dist.toFixed(1)} km (from Center)`;
  };

  const filteredGyms = mockGyms
    .filter((gym) => {
      const matchesSearch =
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiscipline = selectedDiscipline === 'All' || gym.disciplines.includes(selectedDiscipline);
      return matchesSearch && matchesDiscipline;
    })
    .sort((a, b) => {
      if (userLocation) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      }
      return 0;
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

  // Initialize Map and Render Markers (Indian Center - Bengaluru)
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    // Center on Bengaluru, India
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([12.91, 77.58], 11);

    mapInstanceRef.current = map;

    // Render Dark-Theme Map Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
      position: 'bottomright',
    }).addTo(map);

    // Fly-in Zoom Animation on load (to Bengaluru core)
    setTimeout(() => {
      map.flyTo([12.9716, 77.5946], 12.5, {
        duration: 1.8,
        easeLinearity: 0.25,
      });
    }, 200);

    // Request browser live geolocation automatically on load
    requestLiveLocation(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Request browser geolocation handler
  const requestLiveLocation = (mapArg?: any) => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    const L = (window as any).L;
    const map = mapArg || mapInstanceRef.current;
    if (!L || !map) return;

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        setLocatingUser(false);

        // Remove old user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Pulse blue dot for real-time user location
        const userHtml = `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="w-4 h-4 rounded-full border-2 border-white shadow-lg bg-blue-500"></div>
          </div>
        `;
        const userIcon = L.divIcon({
          html: userHtml,
          className: 'user-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map);

        // Fly camera to user's real coordinates
        map.flyTo([lat, lng], 14, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      },
      (err) => {
        console.warn('Geolocation access denied/failed:', err.message);
        setLocatingUser(false);
      },
      { enableHighAccuracy: true }
    );
  };

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
  }, [mapLoaded, filteredGyms, searchQuery, selectedDiscipline, userLocation]);

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
                  <MapPin className="w-3 h-3 mr-1" /> Real-time Finder
                </AnimatedBadge>
              </motion.div>
              <h1 className="text-2xl font-black tracking-tight mb-1">Find Nearby Gyms</h1>
              <p className="text-text-secondary text-xs">Explore certified martial arts clubs near Bengaluru, India</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, district, or address..."
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
                      <span className="text-[10px] text-accent font-bold font-mono whitespace-nowrap">
                        {getGymDistanceStr(gym)}
                      </span>
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

          {/* Locate Me Floating Button */}
          <button
            onClick={() => requestLiveLocation()}
            disabled={locatingUser}
            className="absolute top-4 right-4 z-10 w-11 h-11 bg-surface border border-border hover:border-accent/40 rounded-xl flex items-center justify-center text-text-secondary hover:text-accent shadow-lg shadow-black/30 hover:bg-surface-hover transition-all pointer-events-auto"
            title="Locate My Live Location"
          >
            <Navigation className={`w-5 h-5 ${locatingUser ? 'animate-spin text-accent' : ''}`} />
          </button>

          {/* Floating Details slide-in Card */}
          <AnimatePresence>
            {selectedGym && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-6 left-4 right-4 md:left-1/2 md:ml-[-225px] md:w-[450px] z-20 pointer-events-auto"
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
                      Gym Details · {getGymDistanceStr(selectedGym)} Away
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

                    <div className="flex gap-2">
                      {/* Live google maps navigation directions */}
                      <a
                        href={
                          userLocation
                            ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedGym.lat},${selectedGym.lng}&travelmode=driving`
                            : `https://www.google.com/maps/dir/?api=1&destination=${selectedGym.lat},${selectedGym.lng}&travelmode=driving`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 text-text-primary font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5">
                          <Navigation2 className="w-3.5 h-3.5 text-accent" /> Get Directions
                        </button>
                      </a>
                    </div>
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
