'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';
import { AvailabilityWindow, daysOfWeek, loadCoachSettings, saveCoachSettings } from '../../lib/bookingApi';

const control = 'rounded-xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50';

export default function CoachSettingsPage() {
  const { token, user } = useAuthStore();
  const [rate, setRate] = useState('0');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [experience, setExperience] = useState('0');
  const [certifications, setCertifications] = useState('');
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [active, setActive] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [confirmedUtc, setConfirmedUtc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!token || user?.role !== 'coach') return;
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    loadCoachSettings(token, user.id, controller.signal)
      .then(data => {
        const profile = data.coachProfile;
        setRate(String(profile?.pricingPerHour || 0)); setCurrency(profile?.currency || 'INR');
        setExperience(String(profile?.experienceYears || 0)); setCertifications(profile?.certifications.join('\n') || '');
        setAvailability(profile?.availability || []); setAutoConfirm(profile?.autoConfirm || false);
        setConfirmedUtc(profile?.availabilityTimezone === 'UTC'); setActive(profile?.active || false);
      })
      .catch(error => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load coaching settings'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, user?.id, user?.role, refresh]);

  function changeWindow(index: number, change: Partial<AvailabilityWindow>) {
    setAvailability(current => current.map((window, row) => row === index ? { ...window, ...change } : window));
    setSuccess('');
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!token || user?.role !== 'coach') return;
    if (active && (!confirmedUtc || availability.length === 0)) { setError('Confirm the UTC timezone and add at least one weekly window before publishing.'); return; }
    setSaving(true);
    try {
      const result = await saveCoachSettings(token, {
        pricingPerHour: Number(rate), currency, experienceYears: Number(experience),
        certifications: certifications.split('\n').map(value => value.trim()).filter(Boolean),
        availability, active, autoConfirm, ...(confirmedUtc ? { availabilityTimezone: 'UTC' as const } : {}),
      });
      setSuccess(result.coachProfile.active ? 'Coaching profile published. New requests use this rate and UTC availability.' : 'Settings saved. Your coaching profile is hidden from session discovery.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save coaching settings'); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-32 sm:px-6">
        <div className="mb-10 border-b border-border pb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-accent">Your coaching practice</p><h1 className="font-display text-4xl font-bold">Rates and availability.</h1><p className="mt-4 max-w-2xl leading-relaxed text-text-secondary">Publish weekly hours in UTC and manage how session requests are accepted. Existing bookings keep their agreed price when you edit these settings.</p><Link className="mt-5 inline-flex items-center gap-2 text-sm text-accent underline" href="/bookings">Manage session requests <ArrowRight className="h-4 w-4" /></Link></div>
        {!token ? <p className="rounded-2xl border border-border bg-surface p-8"><Link href="/login" className="text-accent underline">Sign in</Link> to manage your coaching profile.</p> : user?.role !== 'coach' ? <section className="rounded-2xl border border-border bg-surface p-8"><h2 className="text-xl font-semibold">Coach approval required</h2><p className="mt-3 text-text-secondary">A trusted ATHLIX operator must approve coaching access before you can publish a rate or accept sessions.</p></section> : loading ? <p role="status" className="rounded-xl border border-border p-8">Loading coaching settings…</p> : loadError ? <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-6"><p>{loadError}</p><button className="mt-4 underline" onClick={() => setRefresh(value => value + 1)}>Try again</button></div> : (
          <form onSubmit={save} className="space-y-8 rounded-2xl border border-border bg-surface p-5 sm:p-8">
            <fieldset disabled={saving} className="space-y-5"><legend className="mb-5 text-xl font-semibold">Session pricing</legend><div className="grid gap-4 sm:grid-cols-3"><div className="sm:col-span-2"><label htmlFor="coach-rate" className="mb-2 block text-sm font-medium">Hourly rate</label><input id="coach-rate" required type="number" min={0} max={1000000} step="0.01" value={rate} onChange={event => { setRate(event.target.value); setSuccess(''); }} className={`${control} w-full`} /></div><div><label htmlFor="coach-currency" className="mb-2 block text-sm font-medium">Currency</label><select id="coach-currency" value={currency} onChange={event => { setCurrency(event.target.value as 'INR' | 'USD'); setSuccess(''); }} className={`${control} w-full`}><option value="INR">INR · Indian rupee</option><option value="USD">USD · US dollar</option></select></div></div><p className="text-sm leading-relaxed text-text-tertiary">Prices are prorated by session length and rounded to two decimal places. Zero means a free session. ATHLIX does not collect online payments.</p></fieldset>
            <fieldset disabled={saving} className="space-y-5 border-t border-border pt-7"><legend className="pr-3 text-xl font-semibold">Weekly availability · UTC</legend><p className="text-sm leading-relaxed text-text-secondary">Convert your local hours to UTC before publishing. Each window must start and end on the same UTC day. Overlapping windows are rejected.</p>
              {availability.map((window, index) => <div key={index} className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1.3fr_1fr_1fr_auto]"><div className="col-span-2 sm:col-span-1"><label htmlFor={`coach-day-${index}`} className="mb-2 block text-xs font-medium">Day</label><select id={`coach-day-${index}`} className={`${control} w-full`} value={window.dayOfWeek} onChange={event => changeWindow(index, { dayOfWeek: event.target.value as AvailabilityWindow['dayOfWeek'] })}>{daysOfWeek.map(day => <option key={day}>{day}</option>)}</select></div><div><label htmlFor={`coach-start-${index}`} className="mb-2 block text-xs font-medium">Start · UTC</label><input id={`coach-start-${index}`} type="time" required className={`${control} w-full`} value={window.startTime} onChange={event => changeWindow(index, { startTime: event.target.value })} /></div><div><label htmlFor={`coach-end-${index}`} className="mb-2 block text-xs font-medium">End · UTC</label><input id={`coach-end-${index}`} type="time" required className={`${control} w-full`} value={window.endTime} onChange={event => changeWindow(index, { endTime: event.target.value })} /></div><button aria-label={`Remove availability window ${index + 1}`} type="button" className={`${control} col-span-2 self-end text-text-primary sm:col-span-1`} onClick={() => { setAvailability(current => current.filter((_, row) => row !== index)); setSuccess(''); }}><Trash2 className="mx-auto h-4 w-4" /></button></div>)}
              {availability.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-text-tertiary">No weekly windows configured.</p>}
              <button disabled={availability.length >= 21} type="button" className={`${control} inline-flex items-center gap-2 text-accent`} onClick={() => { setAvailability(current => [...current, { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }]); setSuccess(''); }}><Plus className="h-4 w-4" /> Add weekly window</button>
              <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-4 w-4 accent-orange-500" checked={confirmedUtc} onChange={event => { setConfirmedUtc(event.target.checked); setSuccess(''); }} />I have reviewed these hours in UTC. They do not automatically adjust for daylight saving time.</label>
            </fieldset>
            <fieldset disabled={saving} className="space-y-5 border-t border-border pt-7"><legend className="pr-3 text-xl font-semibold">Coaching details</legend><div><label htmlFor="coach-experience" className="mb-2 block text-sm font-medium">Years of experience</label><input id="coach-experience" type="number" min={0} max={80} step={1} required value={experience} onChange={event => { setExperience(event.target.value); setSuccess(''); }} className={`${control} w-full sm:w-40`} /></div><div><label htmlFor="coach-certifications" className="mb-2 block text-sm font-medium">Qualifications · one per line, up to 10</label><textarea id="coach-certifications" rows={4} maxLength={1500} value={certifications} onChange={event => { setCertifications(event.target.value); setSuccess(''); }} className={`${control} w-full`} /><p className="mt-2 text-xs text-text-tertiary">Only list credentials you can substantiate. These display as supplied by you.</p></div></fieldset>
            <fieldset disabled={saving} className="space-y-4 border-t border-border pt-7"><legend className="pr-3 text-xl font-semibold">Publishing</legend><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-4 w-4 accent-orange-500" checked={autoConfirm} onChange={event => { setAutoConfirm(event.target.checked); setSuccess(''); }} />Automatically accept valid session requests. Turn this off to review each request.</label><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-4 w-4 accent-orange-500" checked={active} onChange={event => { setActive(event.target.checked); setSuccess(''); }} />Publish my profile in coach discovery and accept new requests. Turning this off keeps existing bookings.</label></fieldset>
            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-text-primary">{error}</p>}
            {success && <p role="status" className="rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-text-primary">{success}</p>}
            <button disabled={saving} type="submit" className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50">{saving ? 'Saving…' : 'Save coaching settings'}</button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
