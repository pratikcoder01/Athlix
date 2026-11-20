'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import WorkspaceShell, { SignInPrompt, workspaceButton as button, workspaceControl as control, workspacePanel as panel } from '../../components/shared/WorkspaceShell';
import { useAuthStore } from '../../store/authStore';
import { disciplines } from '../../lib/workspaceApi';
import { archiveTrainingEntry, createTrainingEntry, loadTrainingEntries, loadTrainingPlans, updateTrainingEntry, TrainingDetails, TrainingEntry, SavedTrainingPlan } from '../../lib/trainingApi';

const blankDetails: TrainingDetails = { date: '', discipline: 'Karate', durationMinutes: 60, focus: '', notes: '' };
const errorText = (error: unknown) => error instanceof Error ? error.message : 'This training request could not be completed.';

export default function TrainingPage() {
  const { token, user } = useAuthStore();
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [plans, setPlans] = useState<SavedTrainingPlan[]>([]);
  const [details, setDetails] = useState<TrainingDetails>(blankDetails);
  const [editing, setEditing] = useState<TrainingEntry | null>(null);
  const [page, setPage] = useState(1); const [planPage, setPlanPage] = useState(1);
  const [hasMore, setHasMore] = useState(false); const [morePlans, setMorePlans] = useState(false);
  const [refresh, setRefresh] = useState(0); const [loading, setLoading] = useState(false); const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState(''); const [planError, setPlanError] = useState(''); const [formError, setFormError] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [today, setToday] = useState('');
  const draftId = useRef('');
  useEffect(() => { const now = new Date().toISOString().slice(0, 10); setToday(now); setDetails({ ...blankDetails, date: now }); }, [user?.id]);
  useEffect(() => { setEntries([]); setPlans([]); setEditing(null); setFormError(''); setMessage(''); draftId.current = ''; setPage(1); setPlanPage(1); }, [user?.id]);
  useEffect(() => {
    setEntries([]); if (!token) return;
    const controller = new AbortController(); setLoading(true); setError('');
    loadTrainingEntries(token, page, controller.signal).then(result => { setEntries(result.entries); setHasMore(result.hasMore); })
      .catch(reason => { if (!controller.signal.aborted) setError(errorText(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, refresh]);
  useEffect(() => {
    setPlans([]); if (!token) return;
    const controller = new AbortController(); setPlansLoading(true); setPlanError('');
    loadTrainingPlans(token, planPage, controller.signal).then(result => { setPlans(result.plans); setMorePlans(result.hasMore); })
      .catch(reason => { if (!controller.signal.aborted) setPlanError(errorText(reason)); }).finally(() => { if (!controller.signal.aborted) setPlansLoading(false); });
    return () => controller.abort();
  }, [token, planPage, refresh]);

  function resetDraft() { setEditing(null); setDetails({ ...blankDetails, date: today }); draftId.current = ''; setFormError(''); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!token) return; setBusy(true); setFormError(''); setMessage('');
    try {
      if (!draftId.current) draftId.current = crypto.randomUUID();
      const result = editing ? await updateTrainingEntry(token, editing._id, details, editing.version) : await createTrainingEntry(token, details, draftId.current);
      resetDraft(); setMessage(result.message); setPage(1); setRefresh(value => value + 1);
    } catch (reason) { setFormError(errorText(reason)); } finally { setBusy(false); }
  }
  async function archive(entry: TrainingEntry) {
    if (!token) return; setBusy(true); setFormError(''); setMessage('');
    try { const result = await archiveTrainingEntry(token, entry._id, entry.version); if (editing?._id === entry._id) resetDraft(); setMessage(result.message); setRefresh(value => value + 1); }
    catch (reason) { setFormError(errorText(reason)); } finally { setBusy(false); }
  }
  return <WorkspaceShell title="Your training record." eyebrow="Practice with intention" description="Record the work you completed and revisit plans you saved. Entries are self-reported and private to your account.">
    {!token ? <SignInPrompt purpose="view your training history" /> : <>
      {message && <p role="status" className={`${panel} mb-6 border-green-500/30`}>{message}</p>}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className={panel}><h2 className="text-xl font-bold">{editing ? 'Edit training entry' : 'Log completed training'}</h2><p className="mt-2 text-sm text-text-secondary">Use the date of practice. Dates are recorded without a time zone; today’s limit follows UTC.</p>
          <form onSubmit={save} className="mt-6 space-y-4">
            <div><label htmlFor="training-date" className="mb-2 block text-sm">Training date</label><input id="training-date" type="date" required max={today || undefined} min="1900-01-01" className={control} value={details.date} onChange={event => setDetails({ ...details, date: event.target.value })} /></div>
            <div><label htmlFor="training-discipline" className="mb-2 block text-sm">Discipline</label><select id="training-discipline" className={control} value={details.discipline} onChange={event => setDetails({ ...details, discipline: event.target.value })}>{disciplines.map(item => <option key={item}>{item}</option>)}</select></div>
            <div><label htmlFor="training-duration" className="mb-2 block text-sm">Duration in minutes</label><input id="training-duration" type="number" min={1} max={1440} required className={control} value={details.durationMinutes} onChange={event => setDetails({ ...details, durationMinutes: Number(event.target.value) })} /></div>
            <div><label htmlFor="training-focus" className="mb-2 block text-sm">Training focus</label><input id="training-focus" required maxLength={200} className={control} value={details.focus} onChange={event => setDetails({ ...details, focus: event.target.value })} placeholder="Footwork and technical drills" /></div>
            <div><label htmlFor="training-effort" className="mb-2 block text-sm">Perceived effort · optional</label><select id="training-effort" className={control} value={details.effort ?? ''} onChange={event => setDetails({ ...details, effort: event.target.value ? Number(event.target.value) : undefined })}><option value="">Not recorded</option>{Array.from({ length: 10 }, (_, index) => <option key={index} value={index + 1}>{index + 1} / 10</option>)}</select></div>
            <div><label htmlFor="training-notes" className="mb-2 block text-sm">Private training notes</label><textarea id="training-notes" rows={4} maxLength={3000} className={control} value={details.notes} onChange={event => setDetails({ ...details, notes: event.target.value })} /></div>
            {formError && <p role="alert" className="text-sm text-text-primary">{formError}</p>}
            <div className="flex flex-wrap gap-3"><button className={button} disabled={busy} type="submit">{busy ? 'Saving…' : editing ? 'Update training entry' : 'Save training entry'}</button>{editing && <button className="rounded-full border border-border px-5 py-3 text-sm" type="button" disabled={busy} onClick={resetDraft}>Cancel editing</button>}</div>
          </form>
        </section>
        <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Completed practice</h2><button className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh history</button></div>
          {loading && <p role="status" className={panel}>Loading your training history…</p>}{error && <p role="alert" className={panel}>{error}</p>}
          {!loading && !error && entries.length === 0 && <p className={`${panel} text-text-secondary`}>No training entries on this page. Log your first completed practice.</p>}
          <div className="space-y-4">{entries.map(entry => <article key={entry._id} className={panel}><p className="text-xs text-accent">{entry.date} · {entry.discipline}</p><h3 className="mt-2 break-words text-lg font-bold">{entry.focus}</h3><p className="mt-2 text-sm text-text-secondary">{entry.durationMinutes} minutes{entry.effort ? ` · perceived effort ${entry.effort}/10` : ''}</p>{entry.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-text-secondary">{entry.notes}</p>}<div className="mt-4 flex gap-4"><button className="text-sm text-accent underline disabled:opacity-50" disabled={busy} onClick={() => { setEditing(entry); setDetails({ date: entry.date, discipline: entry.discipline, durationMinutes: entry.durationMinutes, focus: entry.focus, notes: entry.notes, effort: entry.effort }); setFormError(''); setMessage(''); }}>Edit entry</button><button disabled={busy} className="text-sm text-text-secondary underline disabled:opacity-50" onClick={() => archive(entry)}>Archive entry</button></div></article>)}</div>
          <div className="mt-5 flex items-center justify-between gap-3"><button disabled={page === 1 || loading} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPage(value => value - 1)}>Previous entries</button><span className="text-sm">Page {page}</span><button disabled={!hasMore || loading || !!error} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPage(value => value + 1)}>Next entries</button></div>
        </section>
      </div>
      <section className="mt-12 border-t border-border pt-8"><h2 className="text-2xl font-bold">Saved training plans</h2><p className="mt-2 max-w-2xl text-sm text-text-secondary">Plans are suggestions for review with a coach. Saving a plan does not record completed training. Experimental plan generation may be unavailable.</p>
        {plansLoading && <p role="status" className="mt-5">Loading your saved plans…</p>}{planError && <p role="alert" className="mt-5">{planError}</p>}{!plansLoading && !planError && plans.length === 0 && <p className="mt-5 text-text-secondary">No saved plans on this page.</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-2">{plans.map(plan => <details key={plan._id} className={panel}><summary className="cursor-pointer break-words font-bold focus-visible:outline focus-visible:outline-accent">{plan.weekOverview}</summary><div className="mt-5 space-y-5">{plan.days.map(day => <div key={day.day}><h3 className="font-semibold">{day.day} · {day.focus}</h3><p className="mt-1 text-sm text-text-secondary">{day.duration} · {day.intensity} intensity</p><ul className="mt-2 list-inside list-disc text-sm text-text-secondary">{day.drills.map((drill, index) => <li key={index} className="break-words">{drill}</li>)}</ul></div>)}{plan.notes && <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{plan.notes}</p>}</div></details>)}</div>
        <div className="mt-5 flex items-center justify-between gap-3"><button disabled={planPage === 1 || plansLoading} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPlanPage(value => value - 1)}>Previous plans</button><span className="text-sm">Page {planPage}</span><button disabled={!morePlans || plansLoading || !!planError} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPlanPage(value => value + 1)}>Next plans</button></div>
      </section>
    </>}
  </WorkspaceShell>;
}
