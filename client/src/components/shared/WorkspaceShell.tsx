import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';

export const workspaceControl = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50';
export const workspaceButton = 'inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
export const workspacePanel = 'rounded-2xl border border-border bg-surface p-6';

export default function WorkspaceShell({ title, eyebrow, description, children }: {
  title: string; eyebrow: string; description: string; children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-text-primary"><Navbar /><main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
    <header className="mb-8 border-b border-border pb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl leading-relaxed text-text-secondary">{description}</p></header>{children}
  </main><Footer /></div>;
}

export function SignInPrompt({ purpose }: { purpose: string }) {
  return <section className={`${workspacePanel} py-12 text-center`}><h2 className="text-xl font-bold">Sign in to {purpose}</h2><p className="mx-auto mt-3 max-w-md text-text-secondary">Your account connects this workspace to your saved records.</p><Link href="/login" className={`${workspaceButton} mt-6`}>Sign in</Link></section>;
}
