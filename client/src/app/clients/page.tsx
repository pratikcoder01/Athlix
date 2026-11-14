'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import WorkspaceShell, { SignInPrompt, workspaceButton as button, workspaceControl as control, workspacePanel as panel } from '../../components/shared/WorkspaceShell';
import { useAuthStore } from '../../store/authStore';
import { CoachingClient, CoachingClientDetails, loadCoachingClient, loadCoachingClients, saveCoachingNotes } from '../../lib/trainingApi';
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Unable to complete this client request.';

export default function ClientsPage() {
  const { token, user } = useAuthStore();
  const [clients, setClients] = useState<CoachingClient[]>([]); const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState<CoachingClientDetails | null>(null); const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1); const [sessionPage, setSessionPage] = useState(1); const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0); const [loading, setLoading] = useState(false); const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(''); const [detailError, setDetailError] = useState(''); const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { setClients([]); setDetails(null); setSelectedId(''); setNotes(''); setPage(1); setSessionPage(1); setMessage(''); setSaveError(''); }, [user?.id]);
  useEffect(() => {
    setClients([]); if (!token || user?.role !== 'coach') return;
    const controller = new AbortController(); setLoading(true); setError('');
    loadCoachingClients(token, page, controller.signal).then(result => { setClients(result.clients); setHasMore(result.hasMore); })
      .catch(reason => { if (!controller.signal.aborted) setError(errorText(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, user?.role, page, refresh]);
  useEffect(() => {
    setDetails(null); setNotes(''); setSaveError(''); setMessage('');
    if (!token || user?.role !== 'coach' || !selectedId) return;
    const controller = new AbortController(); setDetailLoading(true); setDetailError('');
    loadCoachingClient(token, selectedId, sessionPage, controller.signal).then(result => { setDetails(result); setNotes(result.notes.text); })
      .catch(reason => { if (!controller.signal.aborted) setDetailError(errorText(reason)); }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [token, user?.role, selectedId, sessionPage, refresh]);
  async function save(event: FormEvent) {
    event.preventDefault(); if (!token || !details) return; setSaving(true); setSaveError(''); setMessage('');
    try { const result = await saveCoachingNotes(token, details.client.id, notes, details.notes.version); setDetails({ ...details, notes: result.notes }); setMessage(result.message); }
    catch (reason) { setSaveError(errorText(reason)); } finally { setSaving(false); }
  }
  return <WorkspaceShell title="Your coaching clients." eyebrow="Know the people you coach" description="Review athletes with accepted or completed sessions, see your shared booking history, and maintain private coaching notes.">
    {!token ? <SignInPrompt purpose="manage your coaching clients" /> : user?.role !== 'coach' ? <section className={panel}><h2 className="text-xl font-bold">Approved coach account required</h2><p className="mt-3 text-text-secondary">Client records are scoped to the assigned coach. <Link href="/bookings" className="text-accent underline">View your sessions</Link>.</p></section> : <>
      <div className="mb-6 flex flex-wrap items-center gap-4"><Link href="/bookings" className="text-sm text-accent underline">Manage session bookings</Link><button disabled={loading || saving} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setRefresh(value => value + 1)}>Reload client records</button></div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <section><h2 className="mb-5 text-xl font-bold">Assigned athletes</h2>{loading && <p role="status" className={panel}>Loading your clients…</p>}{error && <p role="alert" className={panel}>{error}</p>}{!loading && !error && clients.length === 0 && <p className={`${panel} text-text-secondary`}>No clients on this page. An accepted or completed booking creates the coaching relationship.</p>}
          <div className="space-y-4">{clients.map(client => <article key={client._id} className={panel}><h3 className="break-words text-lg font-bold">{client.name}</h3><p className="mt-2 text-sm text-text-secondary">{[client.discipline, client.beltRank].filter(Boolean).join(' · ') || 'Training profile not completed'}</p><p className="mt-2 text-sm">{client.sessions} accepted/completed sessions · {client.completedSessions} completed</p><button disabled={saving} className={`${button} mt-4`} onClick={() => { setSelectedId(client._id); setSessionPage(1); }} aria-pressed={selectedId === client._id}>Open client record</button></article>)}</div>
          <div className="mt-5 flex items-center justify-between gap-3"><button className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)}>Previous clients</button><span className="text-sm">Page {page}</span><button className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" disabled={!hasMore || loading || !!error} onClick={() => setPage(value => value + 1)}>Next clients</button></div>
        </section>
        <section className={panel} aria-live="polite">{!selectedId && <p className="text-text-secondary">Select an athlete to open their coaching record.</p>}{detailLoading && <p role="status">Loading client record…</p>}{detailError && <p role="alert">{detailError}</p>}{details && <>
          <h2 className="break-words text-2xl font-bold">{details.client.name}</h2><p className="mt-2 text-sm text-text-secondary">Only sessions assigned to your account appear here. The athlete’s private training journal is not shared.</p>
          <form className="mt-7 space-y-4" onSubmit={save}><div><label htmlFor="client-notes" className="mb-2 block font-semibold">Private coaching notes</label><textarea id="client-notes" rows={6} maxLength={5000} value={notes} onChange={event => setNotes(event.target.value)} className={control} /><p className="mt-2 text-xs text-text-tertiary">Visible to your coach account. Keep notes relevant to coaching; avoid sensitive third-party information.</p></div>{saveError && <p role="alert" className="text-sm">{saveError} Your current draft remains in the field.</p>}{message && <p role="status" className="text-sm text-accent">{message}</p>}<button disabled={saving} className={button}>{saving ? 'Saving…' : 'Save coaching notes'}</button></form>
          <h3 className="mt-8 text-lg font-bold">Shared session history</h3><div className="mt-4 space-y-3">{details.sessions.map(session => <article key={session._id} className="rounded-xl border border-border p-4"><p className="text-sm">{new Date(session.scheduledTime).toLocaleString()} · {session.durationMinutes} minutes</p><p className="mt-1 text-xs capitalize text-text-secondary">{session.status}</p></article>)}</div>
          <div className="mt-5 flex items-center justify-between gap-3"><button disabled={sessionPage === 1 || detailLoading || saving} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setSessionPage(value => value - 1)}>Previous sessions</button><span className="text-sm">Page {sessionPage}</span><button disabled={!details.hasMore || detailLoading || saving} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setSessionPage(value => value + 1)}>Next sessions</button></div>
        </>}</section>
      </div>
    </>}
  </WorkspaceShell>;
}
