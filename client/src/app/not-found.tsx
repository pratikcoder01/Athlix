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

      <main className="flex-grow flex items-center justify-center px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-md w-full bg-secondary border border-border rounded-lg p-8 sm:p-12 relative overflow-hidden">

          
          <div className="h-12 w-12 rounded-md border border-border bg-surface flex items-center justify-center mx-auto mb-6 text-primary">
            <Compass className="h-8 w-8" />
          </div>

          <h1 className="text-7xl font-extrabold font-mono tracking-tight text-primary mb-2">404</h1>
          <h2 className="text-xl font-bold font-display uppercase tracking-wider mb-4">PAGE NOT FOUND</h2>
          
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            The training session or combat arena you are looking for does not exist or has been relocated.
          </p>

          <Link href="/">
            <MagneticButton as="span" className="w-full bg-accent hover:bg-accent-hover text-accent-ink font-bold py-3 rounded-md font-display tracking-widest text-sm">
              RETURN TO ARENA
            </MagneticButton>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
