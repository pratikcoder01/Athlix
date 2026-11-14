'use client';

import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import WorkspaceShell, { workspaceButton, workspacePanel } from '../../components/shared/WorkspaceShell';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  return <WorkspaceShell eyebrow="Account preferences" title="Your settings." description="Manage the preferences available in this build. Appearance is saved in this browser; account data is edited through its dedicated workflow.">
    <div className="mx-auto max-w-3xl space-y-6"><section className={workspacePanel}><h2 className="text-xl font-bold">Appearance</h2><p className="mt-3 text-sm text-text-secondary">Your theme preference stays in this browser and is not synchronized across devices.</p><button type="button" onClick={toggleTheme} aria-pressed={theme === 'dark'} className={`${workspaceButton} mt-5`}>{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}Switch to {theme === 'dark' ? 'light' : 'dark'} theme</button></section>
      <section className={workspacePanel}><h2 className="text-xl font-bold">Account and profile</h2><p className="mt-3 text-sm text-text-secondary">{user ? `Signed in as ${user.name}. Your account role is assigned by ATHLIX operators.` : 'Sign in to view and edit your saved profile.'}</p><div className="mt-5 flex flex-wrap gap-3"><Link href={user ? '/profile' : '/login'} className={workspaceButton}>{user ? 'Edit saved profile' : 'Sign in'}</Link><Link href="/forgot-password" className="rounded-full border border-border px-5 py-3 text-sm font-semibold">Recover a Firebase password</Link>{user?.role === 'coach' && <Link href="/coach-settings" className="rounded-full border border-border px-5 py-3 text-sm font-semibold">Coaching rate & availability</Link>}</div></section>
      <section className={workspacePanel}><h2 className="text-xl font-bold">Unavailable preferences</h2><p className="mt-3 text-sm leading-relaxed text-text-secondary">Email and push notification subscriptions, per-profile visibility controls, account deletion, and email-address changes are not implemented here. This page does not claim to save those settings. Profile details are currently visible to signed-in members.</p><Link href="/privacy" className="mt-5 inline-block text-sm text-accent underline">Read the current privacy notice</Link></section>
    </div>
  </WorkspaceShell>;
}
