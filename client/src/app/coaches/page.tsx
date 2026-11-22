'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Search, SlidersHorizontal, UserRound } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';
import { Coach, formatPrice, loadCoaches } from '../../lib/bookingApi';

const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other'];
const control = 'rounded-xl border border-border bg-surface px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export default function DiscoverCoachesPage() {
  const { token, user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [page, setPage] = useState(1);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setCoaches([]);
    if (!token) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    loadCoaches(token, { search: query, discipline, page }, controller.signal)
      .then(data => { setCoaches(data.coaches); setHasMore(data.hasMore); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load coaches'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, query, discipline, page, refresh]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-accent">Train with purpose</p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Find your next coach.</h1>
            <p className="mt-4 leading-relaxed text-text-secondary">Explore real published profiles, review weekly availability and request a private session. Qualifications and experience are supplied by each coach.</p>
          </div>
          <Link className={`${control} inline-flex items-center gap-2 hover:border-accent`} href={user?.role === 'coach' ? '/coach-settings' : '/bookings'}>
            {user?.role === 'coach' ? 'Manage coaching profile' : 'My sessions'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {!token ? (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center">
            <UserRound className="mx-auto mb-4 h-8 w-8 text-accent" />
            <h2 className="text-xl font-semibold">Sign in to discover coaches</h2>
            <p className="mt-2 text-text-secondary">Your account connects each session request to you.</p>
            <Link href="/login" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">Sign in</Link>
          </section>
        ) : (
          <>
            <form className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface/50 p-4 sm:flex-row sm:items-end" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }}>
              <div className="flex-1"><label className="mb-2 block text-sm font-medium" htmlFor="coach-search">Coach name</label><input id="coach-search" maxLength={80} value={search} onChange={event => setSearch(event.target.value)} className={`${control} w-full`} placeholder="Search by name" /></div>
              <div><label className="mb-2 block text-sm font-medium" htmlFor="coach-discipline">Discipline</label><select id="coach-discipline" value={discipline} onChange={event => { setDiscipline(event.target.value); setPage(1); }} className={`${control} w-full sm:w-48`}><option value="">All disciplines</option>{disciplines.map(value => <option key={value}>{value}</option>)}</select></div>
              <button type="submit" className={`${control} inline-flex items-center justify-center gap-2 border-accent text-accent hover:bg-accent/10`}><Search className="h-4 w-4" /> Search</button>
            </form>
            {loading && <p role="status" className="py-12 text-center text-text-secondary">Loading published coaches…</p>}
            {error && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-5"><p>{error}</p><button className="mt-3 underline focus-visible:outline focus-visible:outline-2" onClick={() => setRefresh(value => value + 1)}>Try again</button></div>}
            {!loading && !error && coaches.length === 0 && <section className="rounded-2xl border border-border bg-surface p-12 text-center"><SlidersHorizontal className="mx-auto mb-4 h-8 w-8 text-text-tertiary" /><h2 className="text-xl font-semibold">No published coaches found</h2><p className="mt-2 text-text-secondary">Try another filter. Coaches appear after publishing their rate and availability.</p></section>}
            {!loading && !error && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{coaches.map(coach => (
              <article key={coach.id} className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40">
                <div className="mb-5 flex items-center gap-4"><span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-xl font-bold text-accent">{coach.name.charAt(0)}</span><div className="min-w-0"><h2 className="break-words text-xl font-bold">{coach.name}</h2><p className="mt-1 text-sm text-accent">{coach.discipline}{coach.beltRank && ` · ${coach.beltRank}`}</p></div></div>
                <p className="mb-5 text-sm leading-relaxed text-text-secondary">{coach.bio || 'This coach has not added a bio.'}</p>
                <dl className="mb-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-background/60 p-3"><dt className="text-xs text-text-tertiary">Hourly rate</dt><dd className="mt-1 font-semibold">{formatPrice(coach.pricingPerHour, coach.currency)}</dd></div><div className="rounded-xl bg-background/60 p-3"><dt className="text-xs text-text-tertiary">Experience stated</dt><dd className="mt-1 font-semibold">{coach.experienceYears} years</dd></div></dl>
                <div className="mb-5"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-accent" /> Weekly availability · UTC</h3><ul className="space-y-1 text-sm text-text-secondary">{coach.availability.map((window, index) => <li key={index}>{window.dayOfWeek}: {window.startTime}–{window.endTime}</li>)}</ul></div>
                {coach.certifications.length > 0 && <p className="mb-5 text-xs leading-relaxed text-text-tertiary">Qualifications supplied by coach: {coach.certifications.join(' · ')}</p>}
                <Link href={`/bookings?coachId=${encodeURIComponent(coach.id)}`} className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">Request a session <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}</div>}
            <div className="mt-8 flex items-center justify-center gap-4"><button className={`${control} disabled:opacity-40`} disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</button><span className="text-sm text-text-secondary">Page {page}</span><button className={`${control} disabled:opacity-40`} disabled={!hasMore || loading || !!error} onClick={() => setPage(value => value + 1)}>Next</button></div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
