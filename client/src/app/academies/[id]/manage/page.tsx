'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { disciplines } from '../../../../lib/workspaceApi';
import { AcademyAttendance, AcademyMember, AcademySummary, ManagedAcademy, loadAcademyAttendance, loadAcademyMembers,
  loadAcademyOperations, saveAcademyAttendance, saveAcademyListing, saveAcademyMember } from '../../../../lib/academyOperationsApi';
import WorkspaceShell, { SignInPrompt, workspaceButton, workspaceControl, workspacePanel } from '../../../../components/shared/WorkspaceShell';

const today = () => new Date().toISOString().slice(0, 10);
const message = (error: unknown) => error instanceof Error ? error.message : 'The change could not be saved. Please try again.';

export default function AcademyManagementPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const allowed = user?.role === 'academy_owner' || user?.role === 'admin';
  const [academy, setAcademy] = useState<ManagedAcademy | null>(null);
  const [summary, setSummary] = useState<AcademySummary | null>(null);
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [selected, setSelected] = useState<AcademyMember | null>(null);
  const [records, setRecords] = useState<AcademyAttendance[]>([]);
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [attendanceMore, setAttendanceMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [showNewMember, setShowNewMember] = useState(false);

  useEffect(() => { setDate(today()); }, []);
  useEffect(() => {
    setAcademy(null); setSummary(null); setMembers([]); setRecords([]); setSelected(null);
    setError(''); setNotice(''); setShowNewMember(false);
  }, [user?.id, id]);
  useEffect(() => {
    if (!token || !allowed) { setAcademy(null); setMembers([]); return; }
    const controller = new AbortController();
    setLoading(true); setError('');
    const parameters = new URLSearchParams({ page: String(page), limit: '24', ...(query ? { search: query } : {}), ...(status ? { status } : {}) });
    Promise.all([loadAcademyOperations(token, id, controller.signal), loadAcademyMembers(token, id, parameters, controller.signal)])
      .then(([data, memberData]) => { setAcademy(data.academy); setSummary(data.summary); setMembers(memberData.members); setHasMore(memberData.hasMore);
        setSelected(value => value ? memberData.members.find(member => member._id === value._id) || null : null); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, allowed, id, page, query, status, reload]);

  useEffect(() => {
    if (!token || !allowed || !date) return;
    const controller = new AbortController();
    loadAcademyAttendance(token, id, date, attendancePage, controller.signal)
      .then(data => { setRecords(data.records); setAttendanceMore(data.hasMore); })
      .catch(error => { if (!controller.signal.aborted) { setRecords([]); setError(message(error)); } });
    return () => controller.abort();
  }, [token, allowed, id, date, attendancePage, reload]);

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token || !academy) return;
    const fields = new FormData(event.currentTarget); setBusy(true); setError(''); setNotice('');
    try {
      const result = await saveAcademyListing(token, id, { expectedVersion: academy.version, name: fields.get('name'), address: fields.get('address'),
        latitude: Number(fields.get('latitude')), longitude: Number(fields.get('longitude')), disciplines: fields.getAll('disciplines'),
        description: fields.get('description'), schedule: fields.get('schedule'), isPublished: fields.get('isPublished') === 'on' });
      setAcademy(result.academy); setNotice(result.message);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function archive() {
    if (!token || !academy) return; setBusy(true); setError(''); setNotice('');
    try { const result = await saveAcademyListing(token, id, { expectedVersion: academy.version, archived: !academy.archivedAt }); setAcademy(result.academy); setNotice(result.message); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function saveMember(event: FormEvent<HTMLFormElement>, member?: AcademyMember) {
    event.preventDefault(); if (!token) return;
    const form = event.currentTarget, fields = new FormData(form); setBusy(true); setError(''); setNotice('');
    const changes = { name: fields.get('name'), memberCode: fields.get('memberCode'), email: fields.get('email'), discipline: fields.get('discipline'),
      beltRank: fields.get('beltRank'), joinedOn: fields.get('joinedOn'), notes: fields.get('notes'),
      ...(member ? { expectedVersion: member.version, status: fields.get('status') } : { permissionConfirmed: fields.get('permissionConfirmed') === 'on' }) };
    try { const result = await saveAcademyMember(token, id, changes, member?._id); setNotice(result.message); if (!member) { form.reset(); setShowNewMember(false); } setReload(value => value + 1); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token) return;
    const fields = new FormData(event.currentTarget); setBusy(true); setError(''); setNotice('');
    try { const result = await saveAcademyAttendance(token, id, { memberId: fields.get('memberId'), date, status: fields.get('attendanceStatus') }); setNotice(result.message); setReload(value => value + 1); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }

  function memberFields(member?: AcademyMember) {
    return <>
      <label className="text-sm">Member name<input name="name" defaultValue={member?.name} required maxLength={150} className={`${workspaceControl} mt-2`} /></label>
      <label className="text-sm">Member code<input name="memberCode" defaultValue={member?.memberCode} required maxLength={40} pattern="[a-zA-Z0-9_-]+" placeholder="For example ATH-001" className={`${workspaceControl} mt-2`} /></label>
      <label className="text-sm">Contact email · optional<input name="email" type="email" defaultValue={member?.email} maxLength={254} className={`${workspaceControl} mt-2`} /></label>
      <label className="text-sm">Member discipline<select name="discipline" defaultValue={member?.discipline || academy?.disciplines[0]} className={`${workspaceControl} mt-2`}>{disciplines.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm">Belt or rank<input name="beltRank" defaultValue={member?.beltRank} maxLength={80} className={`${workspaceControl} mt-2`} /></label>
      <label className="text-sm">Joined on · UTC date<input name="joinedOn" type="date" defaultValue={member?.joinedOn || today()} required max={today()} className={`${workspaceControl} mt-2`} /></label>
      {member && <label className="text-sm">Membership status<select name="status" defaultValue={member.status} className={`${workspaceControl} mt-2`}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>}
      <label className="text-sm sm:col-span-2">Administrative notes · optional<textarea name="notes" defaultValue={member?.notes} rows={3} maxLength={1000} className={`${workspaceControl} mt-2`} /><span className="mt-1 block text-xs text-text-tertiary">Use only relevant training administration details. Do not store medical, financial or identity-document information.</span></label>
      {!member && <label className="flex items-start gap-3 text-sm sm:col-span-2"><input name="permissionConfirmed" type="checkbox" required className="mt-1" />I have permission to store this person’s member record, including guardian permission where required.</label>}
      <div className="sm:col-span-2"><button type="submit" disabled={busy || !!academy?.archivedAt} className={workspaceButton}>{busy ? 'Saving…' : member ? 'Save member changes' : 'Save member record'}</button></div>
    </>;
  }

  return <WorkspaceShell eyebrow="Academy operations" title={academy?.name || 'Manage your academy.'} description="Manage your own listing, permissioned member records and daily attendance. Member details are private to this academy’s owner and administrators.">
    <Link href="/academies" className="mb-6 inline-block text-sm text-accent underline">Back to academy directory</Link>
    {!token ? <SignInPrompt purpose="manage your academy" /> : !allowed ? <p role="alert" className={workspacePanel}>Approved academy owner access is required.</p> : <>
      {error && <div role="alert" className={`${workspacePanel} mb-6 border-red-400/50`}><p>{error}</p><button className="mt-3 underline" onClick={() => setReload(value => value + 1)}>Reload saved records</button></div>}
      {notice && <p role="status" className={`${workspacePanel} mb-6 border-success/40`}>{notice}</p>}
      {loading && <p role="status" className="mb-6 text-sm text-text-secondary">Loading academy records…</p>}
      {academy && summary && <>
        {academy.archivedAt && <p className={`${workspacePanel} mb-6 border-accent/50`}>This academy is archived. Its public listing is hidden and member/attendance changes are paused. Saved records remain available here.</p>}
        <dl className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Total members', summary.totalMembers], ['Active members', summary.activeMembers], ['Inactive members', summary.inactiveMembers], [`Present today · ${summary.date} UTC`, summary.attendance.present]].map(([label, value]) => <div key={label} className={workspacePanel}><dt className="text-sm text-text-secondary">{label}</dt><dd className="mt-3 text-3xl font-bold">{value}</dd></div>)}</dl>
        <section className={`${workspacePanel} mb-8`}><h2 className="mb-6 text-xl font-bold">Listing details</h2>
          <form key={academy.version} onSubmit={saveListing}><fieldset disabled={busy || !!academy.archivedAt} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">Edit academy listing</legend>
            <label className="text-sm">Academy name<input name="name" defaultValue={academy.name} required maxLength={150} className={`${workspaceControl} mt-2`} /></label>
            <label className="text-sm">Listing disciplines<select name="disciplines" multiple required defaultValue={academy.disciplines} className={`${workspaceControl} mt-2`}>{disciplines.map(value => <option key={value}>{value}</option>)}</select><span className="mt-1 block text-xs text-text-tertiary">Choose all disciplines offered.</span></label>
            <label className="text-sm sm:col-span-2">Street address<input name="address" defaultValue={academy.address} required maxLength={300} className={`${workspaceControl} mt-2`} /></label>
            <label className="text-sm">Latitude<input name="latitude" type="number" step="any" min={-90} max={90} defaultValue={academy.location.coordinates[1]} required className={`${workspaceControl} mt-2`} /></label>
            <label className="text-sm">Longitude<input name="longitude" type="number" step="any" min={-180} max={180} defaultValue={academy.location.coordinates[0]} required className={`${workspaceControl} mt-2`} /></label>
            <label className="text-sm sm:col-span-2">About the academy<textarea name="description" defaultValue={academy.description} rows={3} maxLength={2000} className={`${workspaceControl} mt-2`} /></label>
            <label className="text-sm sm:col-span-2">Training schedule<textarea name="schedule" defaultValue={academy.schedule} rows={3} maxLength={1000} className={`${workspaceControl} mt-2`} /></label>
            <label className="flex items-center gap-3 text-sm sm:col-span-2"><input name="isPublished" type="checkbox" defaultChecked={academy.isPublished} />Show this listing in the academy directory</label>
            <div className="sm:col-span-2"><button type="submit" className={workspaceButton}>Save listing changes</button></div>
          </fieldset></form>
          <div className="mt-6 border-t border-border pt-6"><p className="mb-3 text-sm text-text-secondary">Archiving hides the listing and pauses new records. You can restore it here; existing records are retained.</p><button disabled={busy} onClick={archive} className={`${workspaceButton} bg-surface text-text-primary ring-1 ring-border`}>{academy.archivedAt ? 'Restore academy' : 'Archive academy'}</button></div>
        </section>
        <section className={`${workspacePanel} mb-8`}><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-bold">Member records</h2><button disabled={!!academy.archivedAt || busy} onClick={() => { setShowNewMember(value => !value); setSelected(null); }} className={workspaceButton}>{showNewMember ? 'Close new member form' : 'Add member'}</button></div>
          {showNewMember && <form onSubmit={event => saveMember(event)} className="mt-6"><fieldset disabled={busy || !!academy.archivedAt} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">New member details</legend>{memberFields()}</fieldset></form>}
          <form className="mt-6 flex flex-wrap items-end gap-4" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }}>
            <label className="min-w-0 flex-1 text-sm">Member name or code<input maxLength={80} value={search} onChange={event => setSearch(event.target.value)} className={`${workspaceControl} mt-2`} /></label>
            <label className="text-sm">Filter membership status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className={`${workspaceControl} mt-2`}><option value="">All members</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label><button type="submit" className={workspaceButton}>Search members</button>
          </form>
          {!members.length && !loading && <p className="mt-6 text-sm text-text-secondary">No member records match this page. Add a permissioned record or change the search.</p>}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">{members.map(member => <li key={member._id}><button className="w-full rounded-xl border border-border p-4 text-left focus-visible:outline focus-visible:outline-accent" onClick={() => { setSelected(member); setShowNewMember(false); }} aria-pressed={selected?._id === member._id}><span className="break-words font-semibold">{member.name}</span><span className="mt-2 block text-sm text-text-secondary">{member.memberCode} · {member.discipline} · {member.status}</span></button></li>)}</ul>
          <div className="mt-6 flex flex-wrap items-center gap-4"><button disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)} className={workspaceButton}>Previous members</button><span className="text-sm">Page {page}</span><button disabled={!hasMore || loading} onClick={() => setPage(value => value + 1)} className={workspaceButton}>Next members</button></div>
          {selected && <form key={`${selected._id}-${selected.version}`} onSubmit={event => saveMember(event, selected)} className="mt-8 border-t border-border pt-6"><h3 className="mb-6 text-lg font-bold">Edit member record</h3><fieldset disabled={busy || !!academy.archivedAt} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">Edit member details</legend>{memberFields(selected)}</fieldset></form>}
        </section>
        <section className={workspacePanel}><h2 className="text-xl font-bold">Daily attendance</h2><p className="mt-3 text-sm text-text-secondary">One record per member per UTC date. Saving again replaces that day’s status. Only active members can receive attendance; use member search above to find the person.</p>
          <label className="mt-6 block max-w-xs text-sm">Attendance date · UTC<input type="date" value={date} max={today()} onChange={event => { setDate(event.target.value); setAttendancePage(1); }} className={`${workspaceControl} mt-2`} /></label>
          <form onSubmit={saveAttendance} className="mt-6"><fieldset disabled={busy || !!academy.archivedAt || !date} className="flex flex-wrap items-end gap-4"><legend className="sr-only">Record attendance</legend>
            <label className="min-w-0 flex-1 text-sm">Active member on this page<select name="memberId" required className={`${workspaceControl} mt-2`}><option value="">Select a member</option>{members.filter(member => member.status === 'active').map(member => <option key={member._id} value={member._id}>{member.name} · {member.memberCode}</option>)}</select></label>
            <label className="text-sm">Attendance status<select name="attendanceStatus" className={`${workspaceControl} mt-2`}><option value="present">Present</option><option value="absent">Absent</option><option value="excused">Excused</option></select></label><button type="submit" className={workspaceButton}>Save attendance</button>
          </fieldset></form>
          <ul className="mt-6 space-y-3">{records.map(record => <li key={record._id} className="rounded-xl border border-border p-4"><span className="break-words font-semibold">{record.memberId && typeof record.memberId !== 'string' ? `${record.memberId.name} · ${record.memberId.memberCode}` : 'Member record unavailable'}</span><span className="ml-3 text-sm text-accent">{record.status}</span></li>)}</ul>
          {!records.length && <p className="mt-6 text-sm text-text-secondary">No attendance records saved for this date.</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4"><button disabled={attendancePage === 1} onClick={() => setAttendancePage(value => value - 1)} className={workspaceButton}>Previous attendance</button><span className="text-sm">Page {attendancePage}</span><button disabled={!attendanceMore} onClick={() => setAttendancePage(value => value + 1)} className={workspaceButton}>Next attendance</button></div>
        </section>
        <p className="mt-8 text-sm text-text-tertiary">These are administrative records, not verified sporting credentials. Billing, payment collection and automated member messages are unavailable.</p>
      </>}
    </>}
  </WorkspaceShell>;
}
