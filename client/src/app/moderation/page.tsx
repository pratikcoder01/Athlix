'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { CommunityReport, loadModerationReports, resolveModerationReport } from '../../lib/moderationApi';
import WorkspaceShell, { SignInPrompt, workspaceButton, workspaceControl, workspacePanel } from '../../components/shared/WorkspaceShell';

function ReviewCard({ report, token, saved, failed }: { report: CommunityReport; token: string; saved: (message: string) => void; failed: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); failed('');
    try { const result = await resolveModerationReport(token, report, fields.get('action') === 'hide' ? 'hide' : 'dismiss', String(fields.get('note') || '').trim()); saved(result.message); }
    catch (error) { failed(error instanceof Error ? error.message : 'The decision could not be saved.'); }
    finally { setBusy(false); }
  }
  return <article className={workspacePanel}>
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">{report.reason} · {report.targetType} report</h2><time className="text-xs text-text-tertiary" dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString()}</time></header>
    <p className="text-sm text-text-secondary">Reported by {report.reporterId?.name || 'Former member'}</p>
    <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm">{report.details || 'No additional details provided.'}</p>
    <section className="mt-5 rounded-xl border border-border bg-background p-4" aria-label="Reported content"><p className="mb-3 text-xs text-text-secondary">{report.target ? `${report.target.authorId?.name || 'Former member'} · ${report.target.visibility}` : 'The target record is unavailable.'}</p>{report.target && <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm">{report.target.content}</p>}</section>
    {report.status === 'resolved' ? <div className="mt-5 text-sm"><p className="font-semibold">Resolved: {report.action}</p><p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere] text-text-secondary">{report.resolutionNote}</p></div> : <form onSubmit={resolve} className="mt-5"><fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Moderation decision</legend>
      <label className="block text-sm">Decision<select name="action" className={`${workspaceControl} mt-2`}><option value="dismiss">Dismiss report · retain current visibility</option><option value="hide" disabled={!report.target || report.target.visibility !== 'visible'}>Hide reported content</option></select></label>
      <label className="block text-sm">Decision note<textarea name="note" rows={3} required maxLength={1000} className={`${workspaceControl} mt-2`} placeholder="Explain the decision for the private moderation audit." /></label>
      <button type="submit" className={workspaceButton}>{busy ? 'Saving decision…' : 'Save moderation decision'}</button>
    </fieldset></form>}
  </article>;
}

export default function CommunityModerationPage() {
  const { token, user } = useAuthStore();
  const [status, setStatus] = useState<'open' | 'resolved'>('open');
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    setReports([]); setError(''); if (!token || user?.role !== 'admin') return;
    const controller = new AbortController(); setLoading(true);
    loadModerationReports(token, status, page, controller.signal).then(result => { setReports(result.reports); setHasMore(result.hasMore); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'The moderation queue could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, user?.role, status, page, reload]);
  return <WorkspaceShell eyebrow="Administrator workspace" title="Community review." description="Review saved member reports and record an accountable moderation decision. Reports are concerns submitted by members; their claims require review.">
    <Link href="/feed" className="mb-6 inline-block text-sm text-accent underline">Back to community</Link>
    {!token ? <SignInPrompt purpose="review community reports" /> : user?.role !== 'admin' ? <p role="alert" className={workspacePanel}>Administrator access is required.</p> : <div className="mx-auto max-w-3xl space-y-6">
      {error && <div role="alert" className={`${workspacePanel} border-red-400/40`}>{error}</div>}
      {notice && <p role="status" className={`${workspacePanel} border-success/40`}>{notice}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4"><label className="text-sm">Report status<select value={status} onChange={event => { setStatus(event.target.value === 'resolved' ? 'resolved' : 'open'); setPage(1); }} className={`${workspaceControl} mt-2`}><option value="open">Open reports</option><option value="resolved">Resolved reports</option></select></label><button onClick={() => setReload(value => value + 1)} disabled={loading} className={workspaceButton}>Refresh queue</button></div>
      {loading ? <p role="status" className="py-8 text-center">Loading saved reports…</p> : !reports.length && !error ? <p className={`${workspacePanel} text-text-secondary`}>No {status} reports on this page.</p> : reports.map(report => <ReviewCard key={`${report._id}-${report.version}`} report={report} token={token} failed={setError} saved={message => { setNotice(message); setReload(value => value + 1); }} />)}
      <nav aria-label="Moderation pages" className="flex items-center justify-between gap-4"><button disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)} className={workspaceButton}>Previous reports</button><span className="text-sm">Page {page}</span><button disabled={!hasMore || loading} onClick={() => setPage(value => value + 1)} className={workspaceButton}>Next reports</button></nav>
      <p className="text-xs leading-relaxed text-text-tertiary">Hiding removes content from community views and saves the decision with the report in one transaction. Original records remain stored for review; this is not permanent erasure or automatic notification delivery. Assign a human operator and review policy before accepting public reports.</p>
    </div>}
  </WorkspaceShell>;
}
