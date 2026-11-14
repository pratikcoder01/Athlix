'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Users, RefreshCw } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';

interface Match { p1: string; p2: string; score: string; winner?: string; }
interface Bracket { seeds: { fighterId: string; seed: number; rationale: string }[]; rounds: { round: string; matches: Match[] }[]; }
interface Tournament {
  _id: string; __v: number; title: string; description: string; date: string; registrationDeadline: string;
  location: string; entryFee: number; disciplines: string[]; status: 'upcoming' | 'ongoing' | 'completed';
  organizerId: string | { _id: string; name: string };
  registrations: (string | { _id: string; name: string })[]; brackets?: Bracket;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const inputClass = 'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent';
const buttonClass = 'rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';
const idOf = (value: string | { _id: string }) => typeof value === 'string' ? value : value._id;

// Update downstream participants after selecting a winner, clearing dependent results.
function selectWinner(bracket: Bracket, roundIndex: number, matchIndex: number, winner: string): Bracket {
  const next: Bracket = JSON.parse(JSON.stringify(bracket));
  next.rounds[roundIndex].matches[matchIndex].winner = winner;
  next.rounds[roundIndex].matches[matchIndex].score = 'Winner recorded';
  for (let r = roundIndex + 1; r < next.rounds.length; r++) {
    next.rounds[r].matches.forEach((match, m) => {
      const p1 = next.rounds[r - 1].matches[m * 2].winner || 'TBD';
      const p2 = next.rounds[r - 1].matches[m * 2 + 1].winner || 'TBD';
      if (match.p1 !== p1 || match.p2 !== p2) { match.winner = ''; match.score = 'Pending'; }
      match.p1 = p1; match.p2 = p2;
      if (p1 === 'BYE' && p2 !== 'TBD') match.winner = p2;
      if (p2 === 'BYE' && p1 !== 'TBD') match.winner = p1;
    });
  }
  return next;
}
function cleanBracket(bracket: Bracket): Bracket {
  return { seeds: bracket.seeds.map(({ fighterId, seed, rationale }) => ({ fighterId, seed, rationale })),
    rounds: bracket.rounds.map(({ round, matches }) => ({ round, matches: matches.map(({ p1, p2, score, winner }) => ({ p1, p2, score, winner })) })) };
}

export default function TournamentsPage() {
  const { token, user, isAuthenticated } = useAuthStore();
  const { socket } = useSocket();
  const [events, setEvents] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const isOrganizer = user?.role === 'tournament_organizer' || user?.role === 'admin';
  const ownsSelected = !!selected && (user?.role === 'admin' || (user?.role === 'tournament_organizer' && idOf(selected.organizerId) === user.id));

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_URL}/api/tournaments${path}`, { ...init, headers: {
      'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers,
    } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
    return body;
  }, [token]);
  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { const body = await request(`?search=${encodeURIComponent(search)}&page=${page}&limit=24`); setEvents(body.tournaments); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load tournaments'); }
    finally { setLoading(false); }
  }, [token, request, search, page]);
  useEffect(() => { void loadEvents(); }, [loadEvents]);
  const loadDetails = useCallback(async (id: string) => {
    const body = await request(`/${id}`); setSelected(body.tournament);
  }, [request]);
  useEffect(() => {
    if (!socket || !selected?._id) return;
    const id = selected._id;
    const subscribe = () => socket.emit('join_tournament_room', id, (reply: { success: boolean; message?: string }) => {
      if (!reply.success) setError(reply.message || 'Live updates unavailable. Use Refresh to check results.');
    });
    const refresh = (update: { tournamentId: string }) => {
      if (update.tournamentId === id) void loadDetails(id).catch(err => setError(err.message));
    };
    if (socket.connected) subscribe();
    socket.on('connect', subscribe); socket.on('bracket_update', refresh);
    return () => { socket.emit('leave_tournament_room', id); socket.off('connect', subscribe); socket.off('bracket_update', refresh); };
  }, [socket, selected?._id, loadDetails]);

  const mutate = async (path: string, method: string, payload?: unknown) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const body = await request(path, { method, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
      setNotice(body.message || 'Saved');
      if (body.tournament) { await loadDetails(body.tournament._id); }
      await loadEvents(); return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save. Reload and try again.'); return false; }
    finally { setBusy(false); }
  };
  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
    const saved = await mutate('', 'POST', { title: fields.get('title'), description: fields.get('description'),
      date: new Date(String(fields.get('date'))).toISOString(), registrationDeadline: new Date(String(fields.get('deadline'))).toISOString(),
      location: fields.get('location'), entryFee: Number(fields.get('fee')), disciplines: [fields.get('discipline')] });
    if (saved) { form.reset(); setShowCreate(false); }
  };
  const update = (brackets?: Bracket, status?: Tournament['status']) => {
    if (selected) void mutate(`/${selected._id}/brackets`, 'PUT', { version: selected.__v || 0,
      ...(brackets ? { brackets: cleanBracket(brackets) } : {}), ...(status ? { status } : {}) });
  };
  const participantName = (id: string) => {
    if (id === 'BYE') return 'Bye'; if (id === 'TBD') return 'Awaiting previous result';
    const athlete = selected?.registrations.find(value => idOf(value) === id);
    return athlete && typeof athlete !== 'string' ? athlete.name : `Athlete ${id.slice(-6)}`;
  };

  return <div className="min-h-screen bg-background text-text-primary"><Navbar />
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-3 flex items-center gap-2 text-sm text-accent"><Trophy size={18} /> Competition hub</p>
          <h1 className="text-4xl font-extrabold font-display">Tournaments</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">Find published events, register as an athlete, and follow recorded match results. Entry fees are set by organizers; ATHLIX does not collect payments.</p></div>
        {isOrganizer && <button className={buttonClass} onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Close form' : 'Create tournament'}</button>}
      </div>
      {!isAuthenticated ? <section className="rounded-2xl border border-border bg-surface p-8"><h2 className="text-xl font-bold">Sign in to discover events</h2><p className="my-3 text-text-secondary">Tournament access requires an athlete account. Organizer access is approved separately.</p><Link href="/login" className={buttonClass}>Sign in</Link></section> : <>
        {error && <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error} <button onClick={() => { void loadEvents(); if (selected) void loadDetails(selected._id).catch(err => setError(err.message)); }} className="ml-2 underline">Reload data</button></div>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">{notice}</p>}
        {showCreate && <form onSubmit={create} className="mb-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
          <h2 className="text-xl font-bold sm:col-span-2">Publish an event</h2>
          <label className="text-sm">Title<input name="title" required maxLength={150} className={inputClass} /></label>
          <label className="text-sm">Location<input name="location" required maxLength={250} className={inputClass} /></label>
          <label className="text-sm">Event date (your local time)<input name="date" type="datetime-local" required className={inputClass} /></label>
          <label className="text-sm">Registration deadline (your local time)<input name="deadline" type="datetime-local" required className={inputClass} /></label>
          <label className="text-sm">Discipline<select name="discipline" className={inputClass}>{['Karate','BJJ','Judo','Muay Thai','Taekwondo','Boxing','MMA','Wrestling','Other'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="text-sm">Entry fee (USD, arranged outside ATHLIX)<input name="fee" type="number" min="0" max="100000" step="0.01" defaultValue="0" required className={inputClass} /></label>
          <label className="text-sm sm:col-span-2">Description<textarea name="description" required maxLength={5000} className={inputClass} /></label>
          <p className="text-xs text-text-secondary sm:col-span-2">Single-elimination events support 2–256 athletes. Generating the bracket closes registration and locks seed order.</p>
          <button disabled={busy} className={buttonClass}>Publish tournament</button>
        </form>}
        <div className="mb-6 flex items-center gap-3"><label className="flex-1"><span className="sr-only">Search tournaments</span><input className={inputClass} placeholder="Search event titles" value={search} maxLength={100} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><button aria-label="Refresh tournaments" className="rounded-full border border-border p-3" onClick={() => void loadEvents()}><RefreshCw size={18} /></button></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <section aria-label="Tournament directory" aria-busy={loading}>
            {loading ? <p role="status" className="p-6 text-text-secondary">Loading events…</p> : events.length === 0 ? <div className="rounded-2xl border border-border p-8"><h2 className="font-bold">No published events found</h2><p className="mt-2 text-sm text-text-secondary">Try another search or return when an approved organizer publishes an event.</p></div> : <div className="space-y-3">{events.map(event => <button key={event._id} onClick={() => { setError(''); void loadDetails(event._id).catch(err => setError(err.message)); }} className={`w-full rounded-2xl border bg-surface p-5 text-left transition-colors hover:border-accent ${selected?._id === event._id ? 'border-accent' : 'border-border'}`}>
              <div className="flex items-center justify-between gap-3"><h2 className="font-bold">{event.title}</h2><span className="text-xs capitalize text-accent">{event.status}</span></div>
              <p className="mt-3 flex items-center gap-2 text-xs text-text-secondary"><Calendar size={14} />{new Date(event.date).toLocaleString()}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary"><MapPin size={14} />{event.location}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary"><Users size={14} />{event.registrations.length} registered · {event.disciplines.join(', ')}</p>
            </button>)}</div>}
            <div className="mt-4 flex items-center justify-between text-sm"><button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="rounded-full border border-border px-4 py-2 disabled:opacity-40">Previous</button><span>Page {page}</span><button disabled={events.length < 24 || loading} onClick={() => setPage(page + 1)} className="rounded-full border border-border px-4 py-2 disabled:opacity-40">Next</button></div>
          </section>
          <section aria-label="Tournament details" className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-7">
            {!selected ? <p className="py-10 text-center text-text-secondary">Select an event to see registration and brackets.</p> : <>
              <h2 className="text-2xl font-extrabold">{selected.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm text-text-secondary">{selected.description}</p>
              <p className="mt-4 text-xs text-text-secondary">Registration deadline: {new Date(selected.registrationDeadline).toLocaleString()} · Entry fee: ${selected.entryFee.toFixed(2)} USD, paid outside ATHLIX</p>
              {user?.role === 'athlete' && <button disabled={busy || selected.status !== 'upcoming' || new Date(selected.registrationDeadline) < new Date() || !!selected.brackets?.rounds?.length || selected.registrations.some(value => idOf(value) === user.id)} onClick={() => void mutate(`/${selected._id}/register`, 'POST')} className={`${buttonClass} mt-5`}>{selected.registrations.some(value => idOf(value) === user.id) ? 'You are registered' : 'Register for event'}</button>}
              {ownsSelected && <div className="mt-5 flex flex-wrap gap-2">
                {!selected.brackets?.rounds?.length && <button disabled={busy || selected.registrations.length < 2 || selected.status !== 'upcoming'} className={buttonClass} onClick={() => void mutate(`/${selected._id}/brackets/generate`, 'POST', { version: selected.__v || 0 })}>Generate bracket & close registration</button>}
                {!!selected.brackets?.rounds?.length && selected.status === 'upcoming' && <button disabled={busy} className={buttonClass} onClick={() => update(undefined, 'ongoing')}>Start tournament</button>}
                {selected.status === 'ongoing' && <button disabled={busy || !selected.brackets?.rounds.at(-1)?.matches[0]?.winner} className={buttonClass} onClick={() => update(undefined, 'completed')}>Complete tournament</button>}
              </div>}
              <h3 className="mt-8 font-bold">Single-elimination bracket</h3><p className="mt-2 text-xs text-text-secondary">Seeds follow registration order. Byes advance automatically. Results are recorded by the event owner.</p>
              {!selected.brackets?.rounds?.length ? <p className="mt-5 text-sm text-text-secondary">The organizer has not generated a bracket yet.</p> : <div className="mt-5 space-y-6">{selected.brackets.rounds.map((round, r) => <div key={r}><h4 className="mb-2 text-sm font-bold text-accent">{round.round}</h4><div className="grid gap-3 sm:grid-cols-2">{round.matches.map((match, m) => <div key={m} className="rounded-xl border border-border p-3">{[match.p1, match.p2].map((id, p) => <div key={p} className="flex items-center justify-between gap-2 py-2 text-sm"><span className={match.winner === id ? 'font-bold text-success' : ''}>{participantName(id)}{match.winner === id ? ' · Winner' : ''}</span>{ownsSelected && selected.status === 'ongoing' && id !== 'TBD' && id !== 'BYE' && !['TBD','BYE'].includes(match.p1) && !['TBD','BYE'].includes(match.p2) && <button disabled={busy || match.winner === id} aria-label={`Record ${participantName(id)} as winner`} onClick={() => update(selectWinner(selected.brackets!, r, m, id))} className="rounded-md border border-accent/40 px-2 py-1 text-xs text-accent disabled:opacity-40">Wins</button>}</div>)}<p className="mt-2 text-xs text-text-tertiary">{match.score}</p></div>)}</div></div>)}</div>}
            </>}
          </section>
        </div>
      </>}
    </main><Footer /></div>;
}
