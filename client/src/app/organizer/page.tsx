'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Calendar, Award, Building2, ShieldAlert, ArrowUpRight, DollarSign } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';
import { useAuthStore } from '../../store/authStore';

interface AnalyticsData {
  totalAthletes: number;
  totalCoaches: number;
  totalAcademies: number;
  totalBookings: number;
  bookingRevenue: number;
  tournamentRevenue: number;
  totalRevenue: number;
  averageFillRate: number;
  tournaments: Array<{
    id: string;
    title: string;
    date: string;
    registrationsCount: number;
    fillRate: number;
    revenue: number;
    status: string;
  }>;
}

export default function OrganizerAnalyticsPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const activeToken = token || useAuthStore.getState().token;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/academies/analytics`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load academy analytics (Status ${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json.analytics);
      } else {
        throw new Error(json.message || 'Analytics fetch failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch analytics from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 inline-flex">
              <AnimatedBadge variant="accent" glow>
                <TrendingUp className="w-3 h-3 mr-1.5" /> Marketplace Control
              </AnimatedBadge>
            </motion.div>
            <AnimatedText
              text="Academy Partner Hub"
              className="text-4xl md:text-5xl font-black tracking-tight mb-2"
              delay={0.1}
            />
            <p className="text-text-secondary text-sm">
              Real-time platform insights across the Athlix three-sided marketplace (Athletes · Coaches · Academies)
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="self-start px-4 py-2 bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
          >
            Refresh Dashboard
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary animate-pulse font-medium">Aggregating marketplace metrics...</span>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12">
            <GlassCard padding="lg" className="border-red-500/20 text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="font-black text-lg mb-2">Analytics Unavailable</h4>
              <p className="text-xs text-text-secondary mb-5 leading-relaxed">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-xs transition-colors"
              >
                Retry Request
              </button>
            </GlassCard>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue */}
              <GlassCard padding="md" variant="glow" className="relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Gross Platform Revenue</span>
                  <div className="w-8 h-8 bg-accent/15 border border-accent/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-accent" />
                  </div>
                </div>
                <h2 className="text-3xl font-black font-mono tracking-tight text-text-primary mb-1">
                  ${data.totalRevenue.toLocaleString()}
                </h2>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="text-success font-bold flex items-center">+$124.50 today</span>
                </div>
              </GlassCard>

              {/* Athletes */}
              <GlassCard padding="md" variant="interactive" className="relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Athletes</span>
                  <div className="w-8 h-8 bg-cyan-400/15 border border-cyan-400/20 rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <h2 className="text-3xl font-black font-mono tracking-tight text-text-primary mb-1">
                  {data.totalAthletes}
                </h2>
                <span className="text-xs text-text-secondary">Active users logged</span>
              </GlassCard>

              {/* Private Sessions / Bookings */}
              <GlassCard padding="md" variant="interactive" className="relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Coaching Bookings</span>
                  <div className="w-8 h-8 bg-purple-400/15 border border-purple-400/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <h2 className="text-3xl font-black font-mono tracking-tight text-text-primary mb-1">
                  {data.totalBookings}
                </h2>
                <span className="text-xs text-text-secondary">${data.bookingRevenue.toLocaleString()} volume</span>
              </GlassCard>

              {/* Tournament Fill Rates */}
              <GlassCard padding="md" variant="interactive" className="relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Avg Bracket Fill Rate</span>
                  <div className="w-8 h-8 bg-amber-400/15 border border-amber-400/20 rounded-xl flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <h2 className="text-3xl font-black font-mono tracking-tight text-text-primary mb-1">
                  {data.averageFillRate}%
                </h2>
                <span className="text-xs text-text-secondary">Across active events</span>
              </GlassCard>
            </div>

            {/* Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tournaments List & Fill Rates (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" /> Active Tournament Brackets
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {data.tournaments.map((t) => (
                    <GlassCard key={t.id} padding="md" className="border-border hover:border-accent/30 transition-all group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h4 className="font-bold text-base text-text-primary group-hover:text-accent transition-colors">
                            {t.title}
                          </h4>
                          <p className="text-text-tertiary text-xs mt-1">
                            Date: {new Date(t.date).toLocaleDateString()} · Status: <span className="capitalize text-accent font-semibold">{t.status}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-text-secondary">Revenue Generated</p>
                          <p className="text-base font-mono font-black text-text-primary">${t.revenue.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Fill rate progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                          <span>Registrations: {t.registrationsCount} / 16 athletes</span>
                          <span className="font-black text-accent">{t.fillRate}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                          <div
                            style={{ width: `${t.fillRate}%` }}
                            className="h-full bg-gradient-to-r from-accent/50 to-accent rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>

              {/* Partner Overview & Marketplace Breakdown (1/3 width) */}
              <div className="space-y-6">
                <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" /> Marketplace Breakdown
                </h3>

                <GlassCard padding="lg" className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Revenue Streams</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Coaching Commissions</span>
                        <span className="font-black font-mono">${data.bookingRevenue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Tournament Entry Fees</span>
                        <span className="font-black font-mono">${data.tournamentRevenue}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                        <span>Total platform gross</span>
                        <span className="text-accent font-mono font-black">${data.totalRevenue}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Network Size</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Verified Academies</span>
                        <span className="font-bold">{data.totalAcademies} gyms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Registered Instructors</span>
                        <span className="font-bold">{data.totalCoaches} coaches</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl text-xs leading-relaxed text-text-secondary">
                    🎓 <strong className="text-text-primary">Pitch Tip:</strong> This three-sided model captures coaching booking fees, tournament organizer fees, and premium athlete SaaS subscriptions, making Athlix the operating system for combat sports.
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
