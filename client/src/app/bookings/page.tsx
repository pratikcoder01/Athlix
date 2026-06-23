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
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold font-display tracking-wide uppercase">BOOK A SESSION</h1>
          <p className="text-text-secondary text-sm">Schedule private instruction with a verified coach</p>
        </div>

        {step === 1 ? (
          <SpotlightCard className="bg-secondary border border-border p-8 shadow-xl">
            <form onSubmit={handleBooking} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Selected Instructor</label>
                <input
                  type="text"
                  value={coachName}
                  disabled
                  className="w-full bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Date Selection</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded pl-11 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Pricing / Duration */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Session Rate</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                    <input
                      type="text"
                      value="90.00 / 90 minutes"
                      disabled
                      className="w-full bg-surface border border-border rounded pl-11 pr-4 py-2.5 text-sm text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Available Time Slots</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 text-xs font-bold font-mono tracking-wider border rounded cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Clock className="h-4 w-4 mr-1.5 inline" /> {slot}
                    </button>
                  ))}
                </div>
              </div>

              <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-md font-bebas tracking-widest text-sm shadow-md">
                CONFIRM APPOINTMENT REQUEST <ChevronRight className="h-4 w-4 ml-1 inline" />
              </MagneticButton>
            </form>
          </SpotlightCard>
        ) : (
          <SpotlightCard className="bg-secondary border border-border p-8 text-center shadow-xl flex flex-col items-center">
            <CheckCircle2 className="h-16 w-16 text-success mb-6 animate-bounce" />
            <h2 className="text-3xl font-extrabold font-display uppercase tracking-wide">REQUEST TRANSMITTED</h2>
            <p className="text-text-secondary text-sm mt-3 max-w-md">
              Your training session request with **{coachName}** for **{selectedDate}** at **{selectedSlot}** has been sent.
            </p>
            <hr className="border-border w-full my-6" />
            <div className="flex gap-4">
              <Link href="/dashboard">
                <MagneticButton className="bg-primary hover:bg-opacity-95 text-white py-2.5 px-6 rounded text-xs font-bebas tracking-widest">
                  BACK TO DASHBOARD
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
