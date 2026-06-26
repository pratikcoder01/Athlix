'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300 flex flex-col justify-between">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-md w-full bg-secondary border border-border rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
            <Compass className="h-8 w-8 animate-pulse" />
          </div>

          <h1 className="text-7xl font-extrabold font-mono tracking-tight text-primary mb-2">404</h1>
          <h2 className="text-xl font-bold font-display uppercase tracking-wider mb-4">PAGE NOT FOUND</h2>
          
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            The training session or combat arena you are looking for does not exist or has been relocated.
          </p>

          <Link href="/">
            <MagneticButton as="span" className="w-full bg-primary hover:bg-opacity-95 text-white font-bold py-3 rounded-md font-bebas tracking-widest text-sm">
              RETURN TO ARENA
            </MagneticButton>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
