import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import WorkspaceNavigation from './WorkspaceNavigation';

export const workspaceControl = 'w-full rounded-md border border-border-strong bg-background px-4 py-3 text-sm text-text-primary transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50';
export const workspaceButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[var(--accent-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
export const workspacePanel = 'rounded-lg border border-border bg-surface p-5 sm:p-6';

export default function WorkspaceShell({ title, eyebrow, description, children }: {
  title: string; eyebrow: string; description: string; children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-text-primary"><Navbar /><main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <header className="mb-8 border-b border-border pb-8"><p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-[-0.025em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-text-secondary sm:text-base">{description}</p></header><WorkspaceNavigation />{children}
  </main><Footer /></div>;
}

export function SignInPrompt({ purpose }: { purpose: string }) {
  return <section className={`${workspacePanel} py-12 text-center`}><h2 className="text-xl font-bold">Sign in to {purpose}</h2><p className="mx-auto mt-3 max-w-md text-text-secondary">Your account connects this workspace to your saved records.</p><Link href="/login" className={`${workspaceButton} mt-6`}>Sign in</Link></section>;
}
