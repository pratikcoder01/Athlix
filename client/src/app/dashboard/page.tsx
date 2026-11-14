'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Building2, CalendarDays, RefreshCw, Trophy, UserRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { loadSessions, participantName, Session } from '../../lib/bookingApi';
import { AthleteProfile, entityId, loadProfile, loadWorkspaceEvents, WorkspaceEvent } from '../../lib/workspaceApi';
import WorkspaceShell, { SignInPrompt, workspaceButton, workspacePanel } from '../../components/shared/WorkspaceShell';

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [events, setEvents] = useState<WorkspaceEvent[] | null>(null);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setProfile(null); setSessions(null); setEvents(null); setErrors([]);
    if (!token || !user?.id) return;
    const controller = new AbortController();
    setLoading(true);
    Promise.allSettled([loadProfile(token, user.id, controller.signal), loadSessions(token, 1, controller.signal), loadWorkspaceEvents(token, controller.signal)])
      .then(([athlete, bookings, tournaments]) => {
        if (controller.signal.aborted) return;
        const failures: string[] = [];
        if (athlete.status === 'fulfilled') setProfile(athlete.value.profile);
        else failures.push(`Profile: ${athlete.reason instanceof Error ? athlete.reason.message : 'Unable to load.'}`);
        if (bookings.status === 'fulfilled') { setSessions(bookings.value.bookings); setHasMoreSessions(bookings.value.hasMore); }
        else failures.push(`Sessions: ${bookings.reason instanceof Error ? bookings.reason.message : 'Unable to load.'}`);
        if (tournaments.status === 'fulfilled') setEvents(tournaments.value.tournaments);
        else failures.push(`Tournaments: ${tournaments.reason instanceof Error ? tournaments.reason.message : 'Unable to load.'}`);
        setErrors(failures);
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, user?.id, reload]);

  const upcoming = (sessions || []).filter(session => ['pending', 'accepted'].includes(session.status) && new Date(session.scheduledTime).getTime() >= Date.now())
    .sort((a, b) => Date.parse(a.scheduledTime) - Date.parse(b.scheduledTime));
  const registered = (events || []).filter(event => event.registrations.some(registration => entityId(registration) === user?.id));
  const managed = (events || []).filter(event => entityId(event.organizerId) === user?.id);
  const professional = ['academy_owner', 'tournament_organizer', 'admin'].includes(user?.role || '');
  const actionLinks = [
    { href: '/profile', title: 'Build your profile', detail: 'Update your discipline, rank and personal achievements.', icon: UserRound },
    { href: user?.role === 'coach' ? '/coach-settings' : '/coaches', title: user?.role === 'coach' ? 'Manage coaching' : 'Find a coach', detail: user?.role === 'coach' ? 'Publish your rate and weekly UTC availability.' : 'Review published rates and request a session.', icon: CalendarDays },
    { href: '/tournaments', title: user?.role === 'tournament_organizer' ? 'Manage tournaments' : 'Explore tournaments', detail: 'View saved events, registrations and match results.', icon: Trophy },
    { href: '/academies', title: user?.role === 'academy_owner' ? 'Manage academy listings' : 'Find an academy', detail: 'Browse real directory records and training information.', icon: Building2 },
  ];

  return <WorkspaceShell eyebrow="Your training workspace" title={user ? `Welcome, ${user.name.split(' ')[0]}.` : 'Your next step starts here.'} description="See your saved profile, session requests and event records. Each panel reflects records returned by the API; refresh to check the latest state.">
    {!token || !user ? <SignInPrompt purpose="open your dashboard" /> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="text-sm capitalize text-text-secondary">Account role: {user.role.replaceAll('_', ' ')}</p><button disabled={loading} onClick={() => setReload(value => value + 1)} className={`${workspaceButton} py-2.5`}><RefreshCw className="h-4 w-4" />{loading ? 'Refreshing…' : 'Refresh records'}</button></div>
      {loading && <p role="status" className="mb-6 text-sm text-text-secondary">Loading your saved records…</p>}
      {errors.length > 0 && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4"><h2 className="font-semibold">Some records could not be loaded</h2><ul className="mt-2 space-y-1 text-sm">{errors.map(error => <li key={error}>{error}</li>)}</ul><p className="mt-3 text-sm">Use Refresh records to retry.</p></div>}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className={workspacePanel}><Award className="mb-4 h-5 w-5 text-accent" /><p className="text-3xl font-bold">{profile ? profile.achievements.length : '—'}</p><h2 className="mt-2 text-sm font-semibold">Personal achievements</h2><p className="mt-1 text-xs text-text-tertiary">Entries in your saved profile; self-reported.</p></div>
        <div className={workspacePanel}><CalendarDays className="mb-4 h-5 w-5 text-accent" /><p className="text-3xl font-bold">{sessions ? sessions.length : '—'}</p><h2 className="mt-2 text-sm font-semibold">Session records loaded</h2><p className="mt-1 text-xs text-text-tertiary">First page, up to 20 records.{hasMoreSessions ? ' More pages are available in My sessions.' : ''}</p></div>
        <div className={workspacePanel}><Trophy className="mb-4 h-5 w-5 text-accent" /><p className="text-3xl font-bold">{events ? (user.role === 'tournament_organizer' ? managed.length : registered.length) : '—'}</p><h2 className="mt-2 text-sm font-semibold">{user.role === 'tournament_organizer' ? 'Your events on this page' : 'Your registrations on this page'}</h2><p className="mt-1 text-xs text-text-tertiary">Among the first 24 events in the directory. This is not a lifetime total.</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={workspacePanel}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Next sessions in loaded records</h2><Link href="/bookings" className="shrink-0 text-sm text-accent underline">My sessions</Link></div>
          {sessions === null ? <p className="text-sm text-text-secondary">Session records are unavailable.</p> : upcoming.length === 0 ? <p className="text-sm text-text-secondary">No upcoming pending or accepted sessions in this page. Open My sessions to browse your history or make a new request.</p> : <ul className="space-y-3">{upcoming.slice(0, 4).map(session => <li className="rounded-xl border border-border p-4" key={session._id}><p className="font-semibold">{participantName(user.id === entityId(session.athleteId) ? session.coachId : session.athleteId)}</p><p className="mt-1 text-sm text-text-secondary">{new Date(session.scheduledTime).toLocaleString()} · {session.durationMinutes} minutes</p><p className="mt-2 text-xs capitalize text-accent">{session.status === 'pending' ? 'Awaiting coach acceptance' : 'Accepted'}</p></li>)}</ul>}
        </section>
        <section className={workspacePanel}><h2 className="mb-5 text-xl font-bold">Continue your training journey</h2><div className="space-y-3">{actionLinks.map(({ href, title, detail, icon: Icon }) => <Link href={href} key={href} className="flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div className="flex-1"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-text-secondary">{detail}</p></div><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" /></Link>)}</div></section>
      </div>
      {professional && <section className={`${workspacePanel} mt-6`}><h2 className="text-xl font-bold">Operations</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">Use academy listings and tournament management for current operations. Academy member management, billing and revenue reporting are not available yet.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/academies" className={workspaceButton}>Academy directory</Link><Link href="/tournaments" className={workspaceButton}>Tournament workspace</Link></div></section>}
    </>}
  </WorkspaceShell>;
}
