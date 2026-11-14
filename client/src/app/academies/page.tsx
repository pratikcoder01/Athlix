'use client';

import { FormEvent, useEffect, useState } from 'react';
import { z } from 'zod';
import { Building2, ExternalLink, MapPin, Plus, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AcademyListing, academySchema, disciplines, loadAcademies, workspaceRequest } from '../../lib/workspaceApi';
import WorkspaceShell, { SignInPrompt, workspaceButton, workspaceControl, workspacePanel } from '../../components/shared/WorkspaceShell';

export default function AcademiesPage() {
  const { token, user } = useAuthStore();
  const [academies, setAcademies] = useState<AcademyListing[]>([]);
  const [selected, setSelected] = useState<AcademyListing | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const canCreate = user?.role === 'academy_owner' || user?.role === 'admin';

  useEffect(() => {
    setAcademies([]); setSelected(null); setError('');
    if (!token) return;
    const controller = new AbortController();
    const parameters = new URLSearchParams({ page: String(page), limit: '24', ...(query ? { search: query } : {}), ...(discipline ? { discipline } : {}), ...(mine ? { mine: 'true' } : {}) });
    setLoading(true);
    loadAcademies(token, parameters, controller.signal).then(data => { setAcademies(data.academies); setSelected(data.academies[0] || null); setHasMore(data.hasMore); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the academy directory.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, query, discipline, mine, page, reload]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !canCreate) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await workspaceRequest(token, '/academies', z.object({ success: z.literal(true), message: z.string(), academy: academySchema }), {
        method: 'POST', body: JSON.stringify({ name: fields.get('name'), address: fields.get('address'), description: fields.get('description'),
          schedule: fields.get('schedule'), disciplines: [fields.get('discipline')], latitude: Number(fields.get('latitude')), longitude: Number(fields.get('longitude')) }),
      });
      setNotice(`${response.academy.name}: ${response.message}.`); form.reset(); setShowCreate(false); setMine(true); setQuery(''); setSearch(''); setDiscipline(''); setPage(1); setReload(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'The academy listing could not be saved.'); }
    finally { setSaving(false); }
  };

  return <WorkspaceShell eyebrow="Academy directory" title="Find a place to train." description="Browse academy records saved by approved academy owners. Addresses, schedules and disciplines are supplied by each listing owner; a listing is not an independent endorsement.">
    {!token ? <SignInPrompt purpose="browse academies" /> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-text-secondary">{loading ? 'Loading directory…' : `${academies.length} listings on this page`}</p>{canCreate && <button onClick={() => setShowCreate(value => !value)} className={workspaceButton}><Plus className="h-4 w-4" />{showCreate ? 'Close new listing' : 'Add academy listing'}</button>}</div>
      {notice && <p role="status" className="mb-6 rounded-xl border border-success/30 bg-success/10 p-4">{notice}</p>}
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4"><p>{error}</p><button className="mt-3 underline focus-visible:outline focus-visible:outline-2" onClick={() => setReload(value => value + 1)}>Reload directory</button></div>}
      {showCreate && canCreate && <form onSubmit={create} className={`${workspacePanel} mb-8`}>
        <h2 className="mb-2 text-xl font-bold">Register your academy</h2><p className="mb-6 text-sm text-text-secondary">Publish accurate location and training information. Do not add another organization without its permission.</p>
        <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">Academy listing details</legend>
          <label className="text-sm font-medium">Academy name<input name="name" required maxLength={150} className={`${workspaceControl} mt-2`} /></label>
          <label className="text-sm font-medium">Primary discipline<select name="discipline" required className={`${workspaceControl} mt-2`}>{disciplines.map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2">Street address<input name="address" required maxLength={300} className={`${workspaceControl} mt-2`} /></label>
          <label className="text-sm font-medium">Latitude<input name="latitude" type="number" required step="any" min={-90} max={90} placeholder="For example, 19.0760" className={`${workspaceControl} mt-2`} /></label>
          <label className="text-sm font-medium">Longitude<input name="longitude" type="number" required step="any" min={-180} max={180} placeholder="For example, 72.8777" className={`${workspaceControl} mt-2`} /></label>
          <label className="text-sm font-medium sm:col-span-2">About the academy<textarea name="description" rows={4} maxLength={2000} className={`${workspaceControl} mt-2 resize-y`} /></label>
          <label className="text-sm font-medium sm:col-span-2">Training schedule<textarea name="schedule" rows={3} maxLength={1000} placeholder="Include days, local times and the applicable timezone." className={`${workspaceControl} mt-2 resize-y`} /></label>
          <div className="sm:col-span-2"><button disabled={saving} type="submit" className={workspaceButton}>{saving ? 'Saving listing…' : 'Save academy listing'}</button></div>
        </fieldset>
      </form>}
      <form className={`${workspacePanel} mb-8 flex flex-col gap-4 sm:flex-row sm:items-end`} onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }}>
        <label className="flex-1 text-sm font-medium">Academy name<input maxLength={80} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search listings by name" className={`${workspaceControl} mt-2`} /></label>
        <label className="text-sm font-medium">Discipline<select value={discipline} onChange={event => { setDiscipline(event.target.value); setPage(1); }} className={`${workspaceControl} mt-2`}><option value="">All disciplines</option>{disciplines.map(value => <option key={value}>{value}</option>)}</select></label>
        {canCreate && <label className="flex items-center gap-2 py-3 text-sm"><input type="checkbox" checked={mine} onChange={event => { setMine(event.target.checked); setPage(1); }} />My listings</label>}
        <button type="submit" className={workspaceButton}><Search className="h-4 w-4" />Search</button>
      </form>
      {loading && <p role="status" className="py-12 text-center text-text-secondary">Loading saved academy listings…</p>}
      {!loading && !error && academies.length === 0 && <section className={`${workspacePanel} py-12 text-center`}><Building2 className="mx-auto mb-4 h-8 w-8 text-accent" /><h2 className="text-xl font-bold">No academy listings found</h2><p className="mx-auto mt-3 max-w-lg text-text-secondary">Try another name or discipline. Approved academy owners can add their own real listing.</p></section>}
      {!loading && !error && academies.length > 0 && <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section aria-label="Academy listings"><ul className="space-y-3">{academies.map(academy => <li key={academy._id}><button onClick={() => setSelected(academy)} aria-pressed={selected?._id === academy._id} className={`${workspacePanel} w-full text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selected?._id === academy._id ? 'border-accent/70' : 'hover:border-accent/40'}`}><span className="text-lg font-bold">{academy.name}</span><span className="mt-2 block text-sm text-text-secondary">{academy.address}</span><span className="mt-3 block text-xs text-accent">{academy.disciplines.join(' · ') || 'Discipline not provided'}</span></button></li>)}</ul></section>
        {selected && <article className={`${workspacePanel} h-fit`}><Building2 className="mb-5 h-8 w-8 text-accent" /><h2 className="break-words text-2xl font-bold">{selected.name}</h2><p className="mt-2 text-sm text-accent">{selected.disciplines.join(' · ')}</p><p className="mt-6 flex items-start gap-2 text-sm text-text-secondary"><MapPin className="h-4 w-4 shrink-0" />{selected.address}</p><p className="mt-6 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">{selected.description || 'The owner has not added a description.'}</p><h3 className="mb-2 mt-6 font-semibold">Training schedule</h3><p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{selected.schedule || 'No schedule has been provided. Confirm session times directly with the academy.'}</p><p className="mt-6 text-xs text-text-tertiary">Listing owner: {selected.ownerId && typeof selected.ownerId !== 'string' ? selected.ownerId.name : 'Name unavailable'}</p><a href={`https://www.google.com/maps/search/?api=1&query=${selected.location.coordinates[1]},${selected.location.coordinates[0]}`} target="_blank" rel="noopener noreferrer" className={`${workspaceButton} mt-6`}>Open location in maps <ExternalLink className="h-4 w-4" /></a></article>}
      </div>}
      <div className="mt-8 flex items-center justify-center gap-4"><button disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)} className={`${workspaceButton} bg-surface text-text-primary`}>Previous</button><span className="text-sm text-text-secondary">Page {page}</span><button disabled={!hasMore || loading || !!error} onClick={() => setPage(value => value + 1)} className={`${workspaceButton} bg-surface text-text-primary`}>Next</button></div>
      {canCreate && <p className="mt-8 text-sm text-text-tertiary">This workspace supports directory publication. Academy member records, listing editing, memberships and billing are not available yet.</p>}
    </>}
  </WorkspaceShell>;
}
