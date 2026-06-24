'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, Shield, CheckCircle2, ChevronRight, DollarSign } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';

export default function BookingsPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState('2026-06-25');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 11:30 AM');
  const [coachName] = useState('Prof. Renato Silva');

  const slots = [
    '09:00 AM - 10:30 AM',
    '10:00 AM - 11:30 AM',
    '02:00 PM - 03:30 PM',
    '04:30 PM - 06:00 PM'
  ];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-border/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">BOOK A SESSION</h1>
          <p className="text-text-secondary text-xs mt-1">Schedule private training with a verified instructor</p>
        </div>

        {step === 1 ? (
          <SpotlightCard className="bg-secondary border border-border rounded-sm p-8 shadow-xl">
            <form onSubmit={handleBooking} className="flex flex-col gap-6">
              
              {/* Instructor display */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">SELECTED INSTRUCTOR</label>
                <input
                  type="text"
                  value={coachName}
                  disabled
                  className="w-full bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none cursor-default font-semibold"
                />
              </div>

              {/* Date selection & Pricing rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Date Selection - Touch targets are minimum 44px height */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">DATE SELECTION</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary font-mono min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Session Rate */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">SESSION RATE</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
                    <input
                      type="text"
                      value="90.00 / 90 minutes"
                      disabled
                      className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-3 text-xs text-text-primary focus:outline-none cursor-default font-mono min-h-[44px] font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">AVAILABLE TIME SLOTS</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3.5 text-xs font-bold font-mono tracking-wider border rounded-sm cursor-pointer transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                        selectedSlot === slot
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Clock className="h-4 w-4" /> {slot.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md mt-2">
                CONFIRM APPOINTMENT REQUEST <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
              </MagneticButton>
            </form>
          </SpotlightCard>
        ) : (
          <SpotlightCard className="bg-secondary border border-border rounded-sm p-8 text-center shadow-xl flex flex-col items-center">
            <CheckCircle2 className="h-14 w-14 text-success mb-6 animate-bounce" />
            <h2 className="text-2xl font-display font-black uppercase tracking-wide">REQUEST TRANSMITTED</h2>
            <p className="text-text-secondary text-xs mt-3 max-w-md font-sans leading-relaxed">
              Your training session request with **{coachName}** for **{selectedDate}** at **{selectedSlot}** has been sent.
            </p>
            
            <hr className="border-border/40 w-full my-6" />
            
            <div className="flex gap-4">
              <Link href="/dashboard">
                <MagneticButton className="bg-primary hover:bg-opacity-95 text-white py-2.5 px-6 rounded-sm text-xs font-mono font-bold tracking-wider uppercase">
                  BACK TO CONSOLE
                </MagneticButton>
              </Link>
            </div>
          </SpotlightCard>
        )}
      </div>

      <Footer />
    </div>
  );
}
