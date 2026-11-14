'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, MapPin, Save, UserRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AthleteProfile, disciplines, loadProfile, saveProfile } from '../../lib/workspaceApi';
import WorkspaceShell, { SignInPrompt, workspaceButton, workspaceControl, workspacePanel } from '../../components/shared/WorkspaceShell';

const emptyProfile: AthleteProfile = { bio: '', discipline: 'Other', beltRank: '', achievements: [], location: '', profileImage: '' };

export default function ProfilePage() {
  const { token, user } = useAuthStore();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [draft, setDraft] = useState(emptyProfile);
  const [achievements, setAchievements] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setProfile(null); setNotice(''); setError('');
    if (!token || !user?.id) return;
    const controller = new AbortController();
    setLoading(true);
    loadProfile(token, user.id, controller.signal).then(data => {
      const saved = data.profile || emptyProfile;
      setName(data.user.name); setProfile(saved); setDraft(saved); setAchievements(saved.achievements.join('\n'));
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load your profile.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, user?.id, reload]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !profile) return;
    const entries = achievements.split('\n').map(value => value.trim()).filter(Boolean);
    if (entries.length > 30 || entries.some(value => value.length > 200)) { setError('Use up to 30 achievements, each 200 characters or less.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await saveProfile(token, { bio: draft.bio, discipline: draft.discipline, beltRank: draft.beltRank, location: draft.location, achievements: entries });
      setProfile(response.profile); setDraft(response.profile); setAchievements(response.profile.achievements.join('\n')); setNotice(response.message);
    } catch (error) { setError(error instanceof Error ? error.message : 'Your profile could not be saved.'); }
    finally { setSaving(false); }
  };

  return <WorkspaceShell eyebrow="Your athlete record" title="Make your progress yours." description="Keep your discipline, belt, location and achievements current. These details are supplied by you and are visible to signed-in members.">
    {!token || !user ? <SignInPrompt purpose="view your profile" /> : <>
      {loading && <p role="status" className="py-12 text-center text-text-secondary">Loading your saved profile…</p>}
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4"><p>{error}</p>{!profile && <button onClick={() => setReload(value => value + 1)} className="mt-3 underline focus-visible:outline focus-visible:outline-2">Try again</button>}</div>}
      {notice && <p role="status" className="mb-6 rounded-xl border border-success/30 bg-success/10 p-4">{notice}</p>}
      {!loading && profile && <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className={`${workspacePanel} h-fit`}>
          <div aria-hidden className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 text-3xl font-bold text-accent">{name.slice(0, 1).toUpperCase()}</div>
          <h2 className="break-words text-2xl font-bold">{name}</h2><p className="mt-1 text-sm capitalize text-accent">{user.role.replaceAll('_', ' ')}</p>
          <dl className="mt-6 space-y-4 text-sm"><div><dt className="text-text-tertiary">Discipline and belt · self-reported</dt><dd className="mt-1">{profile.discipline || 'Not added'}{profile.beltRank ? ` · ${profile.beltRank}` : ''}</dd></div><div><dt className="flex items-center gap-1.5 text-text-tertiary"><MapPin className="h-4 w-4" /> Location</dt><dd className="mt-1">{profile.location || 'Not added'}</dd></div></dl>
          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">{profile.bio || 'Add a short introduction about your training.'}</p>
          <h3 className="mb-3 mt-8 flex items-center gap-2 font-bold"><Award className="h-4 w-4 text-accent" /> Your achievements</h3>
          {profile.achievements.length ? <ul className="space-y-3 text-sm text-text-secondary">{profile.achievements.map((value, index) => <li className="break-words rounded-lg border border-border p-3" key={index}>{value}</li>)}</ul> : <p className="text-sm text-text-secondary">No achievements added yet.</p>}
          <p className="mt-4 text-xs leading-relaxed text-text-tertiary">Achievements are personal entries. ATHLIX has not independently verified them.</p>
          {user.role === 'coach' && <Link href="/coach-settings" className={`${workspaceButton} mt-6`}>Edit coaching rate & availability</Link>}
        </section>
        <form onSubmit={submit} className={workspacePanel}>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold"><UserRound className="h-5 w-5 text-accent" /> Edit profile</h2>
          <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Discipline<select required value={draft.discipline} onChange={event => setDraft(value => ({ ...value, discipline: event.target.value }))} className={`${workspaceControl} mt-2`}>{disciplines.map(value => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-medium">Belt or rank<input maxLength={80} value={draft.beltRank} onChange={event => setDraft(value => ({ ...value, beltRank: event.target.value }))} className={`${workspaceControl} mt-2`} placeholder="Your current rank, if applicable" /></label></div>
          <label className="mt-5 block text-sm font-medium">City or region<input maxLength={200} value={draft.location} onChange={event => setDraft(value => ({ ...value, location: event.target.value }))} className={`${workspaceControl} mt-2`} placeholder="Share only the location you want members to see" /></label>
          <label className="mt-5 block text-sm font-medium">About your training<textarea maxLength={2000} rows={5} value={draft.bio} onChange={event => setDraft(value => ({ ...value, bio: event.target.value }))} className={`${workspaceControl} mt-2 resize-y`} /></label>
          <label className="mt-5 block text-sm font-medium">Achievements · one per line<textarea maxLength={6030} rows={6} value={achievements} onChange={event => setAchievements(event.target.value)} className={`${workspaceControl} mt-2 resize-y`} aria-describedby="achievement-help" /></label><p id="achievement-help" className="mt-2 text-xs text-text-tertiary">Up to 30 personal entries, 200 characters per entry. Include context such as an event and year.</p>
          <button disabled={saving} className={`${workspaceButton} mt-6`} type="submit"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save profile'}</button>
        </form>
      </div>}
    </>}
  </WorkspaceShell>;
}
