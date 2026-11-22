'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import { AlertOctagon } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('🔥 ATHLIX Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300 flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-md w-full bg-secondary border border-border rounded-lg p-8 sm:p-12 relative overflow-hidden">

          
          <div className="h-12 w-12 rounded-md border border-border bg-surface flex items-center justify-center mx-auto mb-6 text-primary">
            <AlertOctagon className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-xl font-bold font-display uppercase tracking-wider mb-2">SYSTEM ERROR</h1>
          <p className="text-xs font-mono text-primary/80 mb-6 bg-primary/5 p-2.5 rounded border border-primary/10 overflow-x-auto">
            {error.message || 'An unexpected error occurred during execution.'}
          </p>

          <div className="flex flex-col gap-3">
            <MagneticButton 
              onClick={() => reset()}
              className="w-full bg-accent hover:bg-accent-hover text-accent-ink font-bold py-3 rounded-md font-display tracking-widest text-sm"
            >
              RETRY OPERATION
            </MagneticButton>
            <Link href="/" className="text-xs font-bold text-text-secondary hover:text-text-primary tracking-wide font-mono mt-2 transition-colors">
              OR GO BACK HOME
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
