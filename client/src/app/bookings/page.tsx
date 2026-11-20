'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, RefreshCw } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';
import {
  Coach, Session, changeSessionStatus, formatPrice, loadCoaches, loadSessions,
  participantId, participantName, requestSession, sessionQuote,
} from '../../lib/bookingApi';

const control = 'rounded-xl border border-border bg-surface px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50';
const statusStyle: Record<Session['status'], string> = {
  pending: 'border-amber-400/30 text-text-primary', accepted: 'border-green-400/30 text-text-primary',
  rejected: 'border-red-400/30 text-text-primary', cancelled: 'border-border text-text-secondary', completed: 'border-blue-400/30 text-text-primary',
};
const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function BookingsPage() {
  const { token, user } = useAuthStore();
  const { bookingUpdates, clearBookingUpdates, socket } = useSocket();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState('');
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookings, setBookings] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [timezone, setTimezone] = useState('your device’s time zone');
  const coach = coaches.find(item => item.id === coachId);
  const quote = coach ? sessionQuote(coach.pricingPerHour, duration) : 0;
  const chosenStart = start ? new Date(start) : null;

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'your device’s time zone');
  }, []);

  useEffect(() => {
    setCoaches([]); setCoachId('');
    if (!token || user?.role !== 'athlete') return;
    const controller = new AbortController();
    const requested = new URLSearchParams(window.location.search).get('coachId') || '';
    if (requested && !/^[a-f\d]{24}$/i.test(requested)) { setCoachError('The selected coach link is invalid. Choose a coach from discovery.'); return; }
    setCoachLoading(true); setCoachError('');
    loadCoaches(token, requested ? { coachId: requested } : {}, controller.signal)
      .then(data => { setCoaches(data.coaches); setCoachId(requested || data.coaches[0]?.id || ''); })
      .catch(error => { if (!controller.signal.aborted) setCoachError(error instanceof Error ? error.message : 'Unable to load coaches'); })
      .finally(() => { if (!controller.signal.aborted) setCoachLoading(false); });
    return () => controller.abort();
  }, [token, user?.role]);

  useEffect(() => {
    setBookings([]);
    if (!token) return;
    const controller = new AbortController();
    setLoading(true); setListError('');
    loadSessions(token, page, controller.signal)
      .then(data => { setBookings(data.bookings); setHasMore(data.hasMore); })
      .catch(error => { if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : 'Unable to load sessions'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, refresh]);

  useEffect(() => {
    if (bookingUpdates.length > 0) { setRefresh(value => value + 1); clearBookingUpdates(); }
  }, [bookingUpdates, clearBookingUpdates]);

  useEffect(() => {
    const refreshList = () => setRefresh(value => value + 1);
    window.addEventListener('focus', refreshList);
    socket?.on('connect', refreshList);
    return () => { window.removeEventListener('focus', refreshList); socket?.off('connect', refreshList); };
  }, [socket]);

  async function book(event: FormEvent) {
    event.preventDefault(); setFormError(''); setSuccess('');
    if (!token || !coach || !start) { setFormError('Choose a published coach and session start time.'); return; }
    const scheduledTime = new Date(start);
    if (!Number.isFinite(scheduledTime.getTime())) { setFormError('Enter a valid session start time.'); return; }
    setSubmitting(true);
    try {
      const result = await requestSession(token, { coachId: coach.id, scheduledTime: scheduledTime.toISOString(), durationMinutes: duration, quotedPrice: quote, quotedCurrency: coach.currency });
      setSuccess(`${result.message}. ${dateLabel(result.booking.scheduledTime)} · ${formatPrice(result.booking.price, result.booking.currency || coach.currency)}`);
      setStart(''); setPage(1);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'We could not confirm the request. Refresh your sessions before retrying.'); }
    finally { setSubmitting(false); setRefresh(value => value + 1); }
  }

  async function updateStatus(booking: Session, status: Session['status']) {
    if (!token) return;
    setBusyId(booking._id); setActionError('');
    try {
      await changeSessionStatus(token, booking._id, status);
      setRefresh(value => value + 1);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to update this session'); setRefresh(value => value + 1); }
    finally { setBusyId(''); }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-accent">Make time for progress</p><h1 className="font-display text-4xl font-bold sm:text-5xl">Your training sessions.</h1><p className="mt-4 text-text-secondary">Request, manage and review sessions with real persisted booking status.</p></div><Link className={`${control} inline-flex items-center gap-2`} href={user?.role === 'coach' ? '/coach-settings' : '/coaches'}>{user?.role === 'coach' ? 'Coaching settings' : 'Discover coaches'} <ArrowRight className="h-4 w-4" /></Link></div>
        {!token ? <section className="rounded-2xl border border-border bg-surface p-8 text-center"><h2 className="text-xl font-semibold">Sign in to manage your sessions</h2><Link href="/login" className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Sign in</Link></section> : (
          <div className={`grid items-start gap-8 ${user?.role === 'athlete' ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : ''}`}>
            {user?.role === 'athlete' && <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7"><h2 className="flex items-center gap-2 text-xl font-bold"><CalendarDays className="h-5 w-5 text-accent" /> Request a session</h2><p className="mt-2 text-sm leading-relaxed text-text-secondary">Times below use {timezone}. The coach’s weekly schedule is published in UTC.</p>
              {coachLoading && <p role="status" className="mt-6">Loading coaches…</p>}
              {coachError && <p role="alert" className="mt-6 text-text-primary">{coachError}</p>}
              {!coachLoading && !coachError && coaches.length === 0 && <p className="mt-6 text-text-secondary">No published coach is available for this selection. <Link className="text-accent underline" href="/coaches">Browse coaches</Link>.</p>}
              {!coachLoading && coaches.length > 0 && <form onSubmit={book} className="mt-6 space-y-5">
                <div><label htmlFor="session-coach" className="mb-2 block text-sm font-medium">Coach</label><select id="session-coach" required className={`${control} w-full`} value={coachId} onChange={event => { setCoachId(event.target.value); setSuccess(''); }}>{coaches.map(item => <option key={item.id} value={item.id}>{item.name} · {item.discipline}</option>)}</select></div>
                {coach && <div className="rounded-xl border border-border bg-background/50 p-4"><p className="mb-2 text-sm font-semibold">Weekly availability · UTC</p><ul className="space-y-1 text-sm text-text-secondary">{coach.availability.map((window, index) => <li key={index}>{window.dayOfWeek} {window.startTime}–{window.endTime}</li>)}</ul><p className="mt-3 text-xs text-text-tertiary">Availability is checked when you submit. Pending requests also reserve time.</p></div>}
                <div><label htmlFor="session-start" className="mb-2 block text-sm font-medium">Start time · {timezone}</label><input id="session-start" className={`${control} w-full`} type="datetime-local" required step={900} value={start} onChange={event => setStart(event.target.value)} /><p className="mt-2 text-xs text-text-tertiary">Choose a 15-minute boundary within the next 90 days.</p>{chosenStart && Number.isFinite(chosenStart.getTime()) && <p className="mt-2 text-xs text-accent">UTC equivalent: {chosenStart.toISOString().replace('T', ' ').replace('.000Z', ' UTC')}</p>}</div>
                <div><label htmlFor="session-duration" className="mb-2 block text-sm font-medium">Duration</label><select id="session-duration" className={`${control} w-full`} value={duration} onChange={event => setDuration(Number(event.target.value))}>{[15, 30, 45, 60, 90, 120, 180, 240].map(value => <option key={value} value={value}>{value} minutes</option>)}</select></div>
                {coach && <div className="border-t border-border pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-text-secondary">Session price</span><strong className="text-xl text-accent">{formatPrice(quote, coach.currency)}</strong></div><p className="mt-2 text-xs text-text-tertiary">{formatPrice(coach.pricingPerHour, coach.currency)} per hour. Scheduling only; no online payment is collected.</p></div>}
                {formError && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-text-primary">{formError}</p>}
                <button disabled={submitting || !coach} type="submit" className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50">{submitting ? 'Submitting…' : coach?.autoConfirm ? 'Book session' : 'Send session request'}</button>
              </form>}
              {success && <p role="status" className="mt-5 rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-text-primary">{success}</p>}
            </section>}
            <section aria-labelledby="sessions-heading"><div className="mb-5 flex items-center justify-between gap-4"><h2 id="sessions-heading" className="text-xl font-bold">Session history</h2><button disabled={loading} className={`${control} inline-flex items-center gap-2`} onClick={() => setRefresh(value => value + 1)}><RefreshCw aria-hidden className="h-4 w-4" /> Refresh</button></div><p className="mb-5 text-xs text-text-tertiary">Newest scheduled date first. Dates and times use {timezone}.</p>
              {loading && <p role="status" className="rounded-xl border border-border p-6 text-text-secondary">Loading your sessions…</p>}
              {listError && <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-text-primary">{listError}</p>}
              {actionError && <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-text-primary">{actionError}</p>}
              {!loading && !listError && bookings.length === 0 && <div className="rounded-2xl border border-border bg-surface p-8"><h3 className="font-semibold">No sessions on this page</h3><p className="mt-2 text-sm text-text-secondary">Your session requests and status history will appear here.</p></div>}
              <div className="space-y-4">{bookings.map(booking => {
                const ownsCoach = user?.id === participantId(booking.coachId);
                const future = Date.parse(booking.scheduledTime) > Date.now();
                const ended = Date.parse(booking.scheduledTime) + booking.durationMinutes * 60000 <= Date.now();
                const mutable = booking.status === 'pending' || booking.status === 'accepted';
                return <article key={booking._id} className="rounded-2xl border border-border bg-surface p-5"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{ownsCoach ? `Athlete: ${participantName(booking.athleteId)}` : `Coach: ${participantName(booking.coachId)}`}</h3><p className="mt-1 text-sm text-text-secondary">{dateLabel(booking.scheduledTime)} · {booking.durationMinutes} min</p></div><span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyle[booking.status]}`}>{booking.status}</span></div><p className="text-sm">{booking.currency ? formatPrice(booking.price, booking.currency) : `${booking.price.toFixed(2)} · currency not recorded`}</p><p className="mt-2 break-words text-xs text-text-tertiary">UTC: {new Date(booking.scheduledTime).toISOString().replace('T', ' ').replace('.000Z', '')}</p>
                  {mutable && <div className="mt-4 flex flex-wrap gap-2">{ownsCoach && user?.role === 'coach' && booking.status === 'pending' && <>{future && <button className={`${control} border-green-400/30 text-text-primary`} disabled={!!busyId} onClick={() => updateStatus(booking, 'accepted')}>Accept</button>}<button className={`${control} text-text-primary`} disabled={!!busyId} onClick={() => updateStatus(booking, 'rejected')}>Decline</button></>}{ownsCoach && user?.role === 'coach' && booking.status === 'accepted' && ended && <button className={control} disabled={!!busyId} onClick={() => updateStatus(booking, 'completed')}>Mark completed</button>}{future && <button className={control} disabled={!!busyId} onClick={() => updateStatus(booking, 'cancelled')}>Cancel session</button>}</div>}
                  {busyId === booking._id && <p role="status" className="mt-3 text-sm text-text-secondary">Updating session…</p>}
                </article>;
              })}</div>
              <div className="mt-6 flex items-center justify-between gap-3"><button className={control} disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</button><span className="text-sm text-text-secondary">Page {page}</span><button className={control} disabled={!hasMore || loading || !!listError} onClick={() => setPage(value => value + 1)}>Next</button></div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
