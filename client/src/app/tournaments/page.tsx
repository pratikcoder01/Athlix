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
interface Division { key: string; title: string; discipline: string; eligibilityNotes: string; capacity: number; registrations: string[]; brackets?: Bracket; status: Tournament['status']; }
interface Tournament {
  _id: string; __v: number; title: string; description: string; date: string; registrationDeadline: string;
  location: string; entryFee: number; disciplines: string[]; status: 'upcoming' | 'ongoing' | 'completed';
  organizerId: string | { _id: string; name: string };
  registrations: (string | { _id: string; name: string })[]; brackets?: Bracket;
  divisions?: Division[];
  divisionCancellations?: { key: string; title: string; reason: string; cancelledAt: string }[];
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const inputClass = 'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent';
const buttonClass = 'rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';
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
  const [divisionKey, setDivisionKey] = useState('');
  const activeDivision = selected?.divisions?.find(division => division.key === divisionKey) || selected?.divisions?.[0];
  const activeBracket = activeDivision?.brackets || (!selected?.divisions?.length ? selected?.brackets : undefined);
  const activeStatus = activeDivision?.status || selected?.status;
  const registrationLocked = !!selected?.brackets?.rounds?.length || !!selected?.divisions?.some(division => division.brackets?.rounds?.length);
  const registered = !!user && !!selected?.registrations.some(value => idOf(value) === user.id);
  const isOrganizer = user?.role === 'tournament_organizer' || user?.role === 'admin';
  const ownsSelected = !!selected && (user?.role === 'admin' || (user?.role === 'tournament_organizer' && idOf(selected.organizerId) === user.id));

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_URL}/api/tournaments${path}`, { ...init, headers: {
      'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers,
    }, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000) });
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
      if (body.tournament) setSelected(body.tournament);
      await loadEvents();
      if (body.tournament) {
        try { await loadDetails(body.tournament._id); }
        catch { setError('Your change was saved, but the latest details could not be loaded. Refresh the data before editing again.'); }
      }
      return true;
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
  const update = (brackets?: Bracket, status?: Tournament['status'], wholeEvent = false) => {
    if (selected) void mutate(`/${selected._id}${activeDivision && !wholeEvent ? `/divisions/${activeDivision.key}` : ''}/brackets`, 'PUT', { version: selected.__v || 0,
      ...(brackets ? { brackets: cleanBracket(brackets) } : {}), ...(status ? { status } : {}) });
  };
  const addDivision = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget; const fields = new FormData(form);
    if (await mutate(`/${selected._id}/divisions`, 'POST', { version: selected.__v || 0, key: fields.get('key'), title: fields.get('title'), discipline: fields.get('discipline'), eligibilityNotes: fields.get('eligibilityNotes'), capacity: Number(fields.get('capacity')) })) form.reset();
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
              {!!selected.divisions?.length && <div className="mt-5 rounded-xl border border-border p-4"><label className="text-sm font-semibold">Division<select value={activeDivision?.key || ''} onChange={event => setDivisionKey(event.target.value)} className={`${inputClass} mt-2`}>{selected.divisions.map(division => <option key={division.key} value={division.key}>{division.title} · {division.registrations.length}/{division.capacity} · {division.status}</option>)}</select></label><p className="mt-3 whitespace-pre-wrap text-xs text-text-secondary">{activeDivision?.discipline} · Organizer eligibility rules: {activeDivision?.eligibilityNotes || 'Contact the organizer before entering. No automated eligibility verification.'}</p></div>}
              {!!selected.divisionCancellations?.length && <section className="mt-5 rounded-xl border border-border p-4"><h3 className="font-semibold">Cancelled divisions</h3>{selected.divisionCancellations.map(division => <p key={division.key} className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{division.title}: {division.reason}</p>)}</section>}
              {ownsSelected && activeDivision && selected.status === 'upcoming' && !activeDivision.brackets?.rounds?.length && <form className="mt-5 rounded-xl border border-border p-4" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; const reason = new FormData(form).get('reason'); if (await mutate(`/${selected._id}/divisions/${activeDivision.key}/cancel`, 'POST', { version: selected.__v || 0, reason })) form.reset(); }}><label className="text-sm">Public division cancellation reason<input name="reason" minLength={5} maxLength={500} required className={`${inputClass} mt-2`} /></label><p className="mt-2 text-xs text-text-secondary">Cancels {activeDivision.title} and withdraws its {activeDivision.registrations.length} entrants. Published brackets are preserved. The reason is visible to event members; refunds and direct communication are arranged by the organizer.</p><button disabled={busy} className="mt-3 rounded-full border border-danger px-4 py-2 text-sm text-danger disabled:opacity-40">Cancel selected division and withdraw entrants</button></form>}
              {user?.role === 'athlete' && <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy || selected.status !== 'upcoming' || new Date(selected.registrationDeadline) < new Date() || registrationLocked || registered} onClick={() => void mutate(`/${selected._id}${activeDivision ? `/divisions/${activeDivision.key}` : ''}/register`, 'POST', activeDivision ? { version: selected.__v || 0 } : undefined)} className={buttonClass}>{registered ? 'You are registered' : activeDivision ? 'Register for division' : 'Register for event'}</button>{registered && <button disabled={busy || selected.status !== 'upcoming' || registrationLocked} onClick={() => void mutate(`/${selected._id}/withdraw`, 'POST', { version: selected.__v || 0 })} className="rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-40">Withdraw registration</button>}</div>}
              {ownsSelected && selected.status === 'upcoming' && !selected.registrations.length && !registrationLocked && <form onSubmit={addDivision} className="mt-6 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"><h3 className="font-bold sm:col-span-2">Configure a division</h3><p className="text-xs text-text-secondary sm:col-span-2">Add all divisions before registration begins. One athlete may enter one division per event; the event supports 256 athletes in total. Publishing any bracket locks all registrations and withdrawals.</p><label className="text-xs">Division title<input name="title" required maxLength={100} className={inputClass} /></label><label className="text-xs">Division key<input name="key" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={40} placeholder="adult-beginner" className={inputClass} /></label><label className="text-xs">Division discipline<select name="discipline" className={inputClass}>{selected.disciplines.map(discipline => <option key={discipline}>{discipline}</option>)}</select></label><label className="text-xs">Division capacity<input name="capacity" type="number" min={2} max={256} defaultValue={64} required className={inputClass} /></label><label className="text-xs sm:col-span-2">Eligibility rules<textarea name="eligibilityNotes" maxLength={1000} placeholder="State age, weight, belt and verification requirements. The organizer checks eligibility." className={inputClass} /></label><button className={buttonClass} disabled={busy || (selected.divisions?.length || 0) >= 16}>Add division</button></form>}
              {ownsSelected && <div className="mt-5 flex flex-wrap gap-2">
                {!activeBracket?.rounds?.length && <button disabled={busy || (activeDivision?.registrations.length ?? selected.registrations.length) < 2 || selected.status !== 'upcoming'} className={buttonClass} onClick={() => void mutate(`/${selected._id}${activeDivision ? `/divisions/${activeDivision.key}` : ''}/brackets/generate`, 'POST', { version: selected.__v || 0 })}>{activeDivision ? 'Generate division bracket' : 'Generate bracket & close registration'}</button>}
                {selected.status === 'upcoming' && (selected.divisions?.length ? selected.divisions.every(division => division.brackets?.rounds?.length) : !!selected.brackets?.rounds?.length) && <button disabled={busy} className={buttonClass} onClick={() => update(undefined, 'ongoing', true)}>Start tournament</button>}
                {activeDivision && selected.status === 'ongoing' && activeStatus === 'upcoming' && <button disabled={busy} className={buttonClass} onClick={() => update(undefined, 'ongoing')}>Start division</button>}
                {activeDivision && selected.status === 'ongoing' && activeStatus === 'ongoing' && <button disabled={busy || !activeBracket?.rounds.at(-1)?.matches[0]?.winner} className={buttonClass} onClick={() => update(undefined, 'completed')}>Complete division</button>}
                {selected.status === 'ongoing' && <button disabled={busy || (selected.divisions?.length ? !selected.divisions.every(division => division.status === 'completed') : !selected.brackets?.rounds.at(-1)?.matches[0]?.winner)} className={buttonClass} onClick={() => update(undefined, 'completed', true)}>Complete tournament</button>}
              </div>}
              <h3 className="mt-8 font-bold">Single-elimination bracket</h3><p className="mt-2 text-xs text-text-secondary">Seeds follow registration order. Byes advance automatically. Results are recorded by the event owner.</p>
              {!activeBracket?.rounds?.length ? <p className="mt-5 text-sm text-text-secondary">The organizer has not generated a bracket yet.</p> : <div className="mt-5 space-y-6">{activeBracket.rounds.map((round, r) => <div key={r}><h4 className="mb-2 text-sm font-bold text-accent">{round.round}</h4><div className="grid gap-3 sm:grid-cols-2">{round.matches.map((match, m) => <div key={m} className="rounded-xl border border-border p-3">{[match.p1, match.p2].map((id, p) => <div key={p} className="flex items-center justify-between gap-2 py-2 text-sm"><span className={match.winner === id ? 'font-bold text-success' : ''}>{participantName(id)}{match.winner === id ? ' · Winner' : ''}</span>{ownsSelected && selected.status === 'ongoing' && activeStatus === 'ongoing' && id !== 'TBD' && id !== 'BYE' && !['TBD','BYE'].includes(match.p1) && !['TBD','BYE'].includes(match.p2) && <button disabled={busy || match.winner === id} aria-label={`Record ${participantName(id)} as winner`} onClick={() => update(selectWinner(activeBracket, r, m, id))} className="rounded-md border border-accent/40 px-2 py-1 text-xs text-accent disabled:opacity-40">Wins</button>}</div>)}<p className="mt-2 text-xs text-text-tertiary">{match.score}</p></div>)}</div></div>)}</div>}
            </>}
          </section>
        </div>
      </>}
    </main><Footer /></div>;
}
