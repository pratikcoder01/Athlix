'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, DollarSign, Star, Shield } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';

const slots = [
  '09:00 AM – 10:30 AM',
  '10:00 AM – 11:30 AM',
  '02:00 PM – 03:30 PM',
  '04:30 PM – 06:00 PM',
];

export default function BookingsPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState('2026-06-25');
  const [selectedSlot, setSelectedSlot] = useState(slots[1]);
  const [coachName] = useState('Prof. Thiago Valente');
  const [bookingStatus, setBookingStatus] = useState('pending');
  const coachAvatar = '/images/avatars/thiago-valente.png';
  const coachRank = 'BJJ Black Belt · 3rd Degree';
  const coachRate = '$90';

  const { bookingUpdates, clearBookingUpdates } = useSocket();

  React.useEffect(() => {
    if (bookingUpdates && bookingUpdates.length > 0) {
      const latest = bookingUpdates[0];
      if (latest.type === 'status_changed') {
        setBookingStatus(latest.booking.status);
      }
      clearBookingUpdates();
    }
  }, [bookingUpdates, clearBookingUpdates]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = useAuthStore.getState().token;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          coachId: '6584282f1f5139c27b0c3a2f',
          scheduledTime: new Date(selectedDate),
          durationMinutes: 90,
          price: 90.00,
        }),
      });

      if (res.ok) {
        setBookingStatus('pending');
        setStep(2);
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex">
            <AnimatedBadge variant="accent" glow>
              <CalendarIcon className="w-3 h-3 mr-1.5" /> Private Session
            </AnimatedBadge>
          </motion.div>
          <AnimatedText
            text="Book a Session"
            className="text-3xl md:text-4xl font-black tracking-tight mb-2"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary"
          >
            Schedule private training with a verified instructor.
          </motion.p>
        </div>

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                step >= s ? 'bg-accent text-black border-accent' : 'border-border text-text-tertiary'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-semibold ${step >= s ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {s === 1 ? 'Select Slot' : 'Confirmed'}
              </span>
              {s === 1 && <div className={`w-12 h-0.5 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard variant="glow" padding="lg">
                <form onSubmit={handleBooking} className="flex flex-col gap-6">
                  {/* Coach info */}
                  <div>
                    <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-3">Selected Instructor</p>
                    <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-background border border-border shrink-0">
                        <img
                          src={coachAvatar}
                          alt={coachName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-accent/20 text-accent font-black text-xl">T</div>';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-base">{coachName}</p>
                        <p className="text-text-secondary text-xs mt-0.5">{coachRank}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold">5.0</span>
                          </div>
                          <span className="text-xs text-text-tertiary">(88 reviews)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-accent">{coachRate}</p>
                        <p className="text-[10px] text-text-tertiary">/ 90 min</p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Price row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-2">Date</p>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-2">Session Rate</p>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                          type="text"
                          value="90.00 / 90 minutes"
                          disabled
                          className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold cursor-default opacity-70"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-3">Available Time Slots</p>
                    <div className="grid grid-cols-2 gap-3">
                      {slots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                            selectedSlot === slot
                              ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent/30'
                              : 'border-border text-text-secondary hover:border-accent/40 hover:text-text-primary'
                          }`}
                        >
                          <Clock className="w-4 h-4" /> {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <MagneticButton type="submit" variant="premium" className="w-full justify-center mt-2">
                    Confirm Appointment <ChevronRight className="w-4 h-4 ml-1" />
                  </MagneticButton>
                </form>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard variant="glow" padding="lg" className="text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-success mb-6" />
                  </motion.div>

                  <h2 className="text-2xl font-black mb-2">Request Transmitted</h2>

                  <AnimatedBadge variant={bookingStatus === 'confirmed' ? 'success' : 'default'} className="mb-4">
                    <Shield className="w-3 h-3 mr-1" />
                    Status: {bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
                  </AnimatedBadge>

                  <p className="text-text-secondary mb-6 max-w-md">
                    Your session with <strong className="text-text-primary">{coachName}</strong> for{' '}
                    <strong className="text-text-primary">{selectedDate}</strong> at{' '}
                    <strong className="text-text-primary">{selectedSlot}</strong> has been sent.
                    Status updates live when the coach responds.
                  </p>

                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
                    {[
                      { label: 'Coach', value: coachName.split(' ').slice(-1)[0] },
                      { label: 'Date', value: new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                      { label: 'Rate', value: coachRate },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-surface rounded-xl p-3 text-center">
                        <p className="text-[10px] text-text-tertiary uppercase tracking-widest">{label}</p>
                        <p className="text-sm font-black mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  <Link href="/dashboard">
                    <MagneticButton variant="premium">
                      Back to Console <ChevronRight className="w-4 h-4 ml-1" />
                    </MagneticButton>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
