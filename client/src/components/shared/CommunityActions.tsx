'use client';

import { FormEvent, useState } from 'react';
import { editCommunityContent, removeCommunityContent, reportCommunityContent } from '../../lib/communityApi';
import { workspaceButton, workspaceControl } from './WorkspaceShell';

export default function CommunityActions({ token, mine, postId, commentId, content, version, changed, failure, notify }: {
  token: string; mine: boolean; postId: string; commentId?: string; content: string; version: number;
  changed: () => void; failure: (message: string) => void; notify: (message: string) => void;
}) {
  const [mode, setMode] = useState<'edit' | 'remove' | 'report' | null>(null);
  const [draft, setDraft] = useState(content);
  const [busy, setBusy] = useState(false);
  const kind = commentId ? 'comment' : 'post';
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); failure('');
    try {
      const result = mode === 'edit' ? await editCommunityContent(token, postId, version, draft.trim(), commentId)
        : mode === 'remove' ? await removeCommunityContent(token, postId, version, commentId)
        : await reportCommunityContent(token, postId, String(fields.get('reason')), String(fields.get('details') || ''), commentId);
      notify(result.message); setMode(null); if (mode !== 'report') changed();
    } catch (error) { failure(error instanceof Error ? error.message : 'The community change could not be saved.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 border-t border-border pt-3">
    <div className="flex flex-wrap gap-4 text-xs">{mine && <><button type="button" disabled={busy} onClick={() => { setDraft(content); setMode(mode === 'edit' ? null : 'edit'); }} className="underline">Edit {kind}</button><button type="button" disabled={busy} onClick={() => setMode(mode === 'remove' ? null : 'remove')} className="underline">Remove {kind}</button></>}<button type="button" disabled={busy} onClick={() => setMode(mode === 'report' ? null : 'report')} className="underline">Report {kind}</button></div>
    {mode && <form onSubmit={save} className="mt-4"><fieldset disabled={busy} className="space-y-4"><legend className="sr-only">{mode} {kind}</legend>
      {mode === 'edit' && <label className="block text-sm">Edit {kind} text<textarea value={draft} onChange={event => setDraft(event.target.value)} required maxLength={commentId ? 2000 : 5000} rows={3} className={`${workspaceControl} mt-2`} /></label>}
      {mode === 'remove' && <p className="text-sm text-text-secondary">Remove your {kind} from community views? Moderation records may be retained. This does not erase all stored copies.</p>}
      {mode === 'report' && <><p className="text-sm text-text-secondary">Save a concern for an ATHLIX administrator to review. Response times are not guaranteed. For urgent danger, use appropriate local emergency services.</p><label className="block text-sm">Report reason<select name="reason" className={`${workspaceControl} mt-2`}><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="safety">Safety concern</option><option value="privacy">Privacy concern</option><option value="other">Other · add details</option></select></label><label className="block text-sm">Report details<textarea name="details" rows={3} maxLength={1000} className={`${workspaceControl} mt-2`} placeholder="Describe the concern without adding unnecessary private information." /></label></>}
      <div className="flex flex-wrap gap-3"><button type="submit" className={workspaceButton}>{busy ? 'Saving…' : mode === 'edit' ? `Save ${kind} changes` : mode === 'remove' ? `Confirm remove ${kind}` : 'Save report'}</button><button type="button" disabled={busy} onClick={() => setMode(null)} className="text-sm underline">Cancel</button></div>
    </fieldset></form>}
  </div>;
}
