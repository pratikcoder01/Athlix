'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Calendar, RefreshCw, Trophy, Users } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';

interface AnalyticsData {
  scope: 'platform' | 'account';
  totalAcademies: number;
  totalTournaments: number;
  registrationsShown: number;
  limit: number;
  paymentsAvailable: false;
  tournaments: Array<{ id: string; title: string; date: string; registrationsCount: number; status: string }>;
}

export default function OrganizerAnalyticsPage() {
  const { token, user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canView = Boolean(user && ['admin', 'academy_owner', 'tournament_organizer'].includes(user.role));

  const fetchAnalytics = useCallback(async (signal?: AbortSignal) => {
    if (!token || !canView) return;
    setLoading(true);
    setError('');
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${api}/api/academies/analytics`, { headers: { Authorization: `Bearer ${token}` }, signal });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load event overview.');
      if (!signal?.aborted) setData(result.analytics);
    } catch (cause) {
      if (!signal?.aborted) {
        setData(null);
        setError(cause instanceof Error ? cause.message : 'Unable to load event overview.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token, canView]);

  useEffect(() => {
    setData(null);
    setError('');
    const controller = new AbortController();
    void fetchAnalytics(controller.signal);
    return () => controller.abort();
  }, [fetchAnalytics, user?.id]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
          <div><p className="text-xs font-semibold text-accent mb-3">Operational overview</p><h1 className="text-4xl md:text-5xl font-bold font-display mb-3">Your events, clearly.</h1><p className="text-sm text-text-secondary">Account-scoped counts from saved records. Administrators can view platform totals.</p></div>
          {canView && <button onClick={() => void fetchAnalytics()} disabled={loading} className="inline-flex gap-2 items-center rounded-full border border-border px-5 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw className="w-4 h-4" />Refresh</button>}
        </div>
        {!token ? <div className="p-7 rounded-2xl border border-border bg-surface"><h2 className="text-xl font-bold mb-3">Sign in to view your events</h2><Link href="/login" className="text-accent underline">Sign in</Link></div> : !canView ? <div className="p-7 rounded-2xl border border-border bg-surface"><h2 className="text-xl font-bold mb-3">Organizer access required</h2><p className="text-text-secondary mb-4">Academy owners, organizers, and administrators can view this overview after approval.</p><Link href="/contact" className="text-accent underline">Contact the project team</Link></div> : loading ? <p role="status" className="py-12 text-text-secondary">Loading saved event records…</p> : error ? <div role="alert" className="p-7 border border-red-400/30 rounded-2xl bg-surface"><h2 className="font-bold mb-3">Overview unavailable</h2><p className="text-text-secondary mb-4">{error}</p><button onClick={() => void fetchAnalytics()} className="text-accent underline">Try again</button></div> : data ? <div className="space-y-8">
          <p className="text-sm text-text-secondary">Viewing {data.scope === 'platform' ? 'platform records (administrator access)' : 'records owned by your account'}. Up to {data.limit} most recent events are shown.</p>
          <div className="grid sm:grid-cols-3 gap-5">{[
            { icon: Building2, label: 'Saved academies', value: data.totalAcademies },
            { icon: Trophy, label: 'Saved tournaments', value: data.totalTournaments },
            { icon: Users, label: 'Registrations in events shown', value: data.registrationsShown },
          ].map(({ icon: Icon, label, value }) => <div key={label} className="p-6 rounded-2xl border border-border bg-surface"><Icon className="w-5 h-5 text-accent mb-4" /><p className="text-3xl font-bold font-mono mb-2">{value.toLocaleString()}</p><p className="text-sm text-text-secondary">{label}</p></div>)}</div>
          <section aria-labelledby="saved-events"><div className="flex flex-wrap justify-between items-center gap-3 mb-5"><h2 id="saved-events" className="text-2xl font-bold">Saved tournaments</h2><Link href="/tournaments" className="text-sm text-accent underline">Open tournaments</Link></div>{data.tournaments.length === 0 ? <p className="p-7 rounded-2xl bg-surface border border-border text-text-secondary">No tournaments are saved in this scope yet.</p> : <div className="grid gap-4">{data.tournaments.map((event) => <article key={event.id} className="p-6 border border-border rounded-2xl bg-surface flex flex-col sm:flex-row justify-between gap-5"><div><h3 className="text-lg font-bold mb-2">{event.title}</h3><p className="inline-flex items-center gap-2 text-sm text-text-secondary"><Calendar className="w-4 h-4" />{new Date(event.date).toLocaleDateString()} · {event.status}</p></div><p className="text-sm text-text-secondary"><strong className="text-text-primary text-2xl font-mono">{event.registrationsCount}</strong> registrations</p></article>)}</div>}</section>
          <aside className="p-6 border border-amber-400/25 rounded-2xl bg-surface"><h2 className="font-bold mb-2">Payment collection is unavailable</h2><p className="text-sm text-text-secondary leading-relaxed">A registration or listed entry fee does not establish that money was collected. This overview does not report revenue, settlement, commissions, or an assumed bracket capacity.</p></aside>
        </div> : null}
      </main>
      <Footer />
    </div>
  );
}
