'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { logoutSession } from '../../lib/authSession';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import { cn } from '../../lib/utils';

const links = [
  { name: 'Coaches', href: '/coaches' },
  { name: 'Academies', href: '/academies' },
  { name: 'Kata Analyzer', href: '/kata' },
  { name: 'Tournaments', href: '/tournaments' },
];
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';
const iconButton = `inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary ${focus}`;
const primaryLink = `inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[var(--accent-primary-hover)] ${focus}`;

export const Navbar: React.FC<{ announcement?: boolean }> = ({ announcement = false }) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount, notificationError } = useSocket();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const drawer = drawerRef.current;
    document.body.style.overflow = 'hidden';
    // The browser's modal top layer makes the rest of the document inert,
    // including the exposed strip beside the panel on wider mobile screens.
    if (drawer && !drawer.open) drawer.showModal();
    drawer?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setIsOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') || []);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      drawer?.close();
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setSigningOut(true); setLogoutError('');
    try { await logoutSession(); await signOut(auth); setIsOpen(false); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : 'Sign-out could not be confirmed. Please retry.'); }
    finally { setSigningOut(false); }
  };
  const closeMenu = () => setIsOpen(false);
  const notificationLabel = `Notifications${!notificationError && unreadCount ? `, ${unreadCount} unread` : ''}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {announcement && <div className="flex h-9 items-center justify-center gap-2 border-b border-border bg-surface px-3 font-mono text-[10px] font-medium tracking-[0.025em] text-text-secondary sm:text-[11px] lg:text-xs">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
        <span className="whitespace-nowrap">DEVELOPMENT BUILD<span className="sr-only sm:not-sr-only"> · KARATE PILOT IN PREPARATION</span> · CHECKOUT DISABLED</span>
      </div>}
      <nav aria-label="Main navigation" className="h-16 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <Link href="/" aria-label="ATHLIX home" className={cn('w-fit font-display text-xl font-extrabold tracking-[0.06em] text-text-primary', focus)}>ATHLIX<span aria-hidden="true" className="ml-1 text-text-tertiary">/</span></Link>
          <div className="hidden h-full items-center gap-7 lg:flex">
            {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} className={cn('inline-flex h-full items-center border-b-2 text-[13px] font-medium transition-colors', pathname === link.href ? 'border-accent text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary', focus)}>{link.name}</Link>)}
          </div>
          <div className="hidden items-center justify-self-end gap-2 lg:flex">
            <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className={iconButton}>{theme === 'dark' ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}</button>
            {isAuthenticated ? <>
              <Link href="/notifications" aria-label={notificationLabel} title={notificationError ? 'Notification count unavailable. Open inbox to retry.' : 'Open saved notifications'} className={cn(iconButton, 'relative')}>
                <Bell aria-hidden="true" className="h-4 w-4" />
                {!notificationError && unreadCount > 0 && <span aria-hidden="true" className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--status-active)]" />}
              </Link>
              <Link href="/dashboard" className={cn('inline-flex min-h-10 items-center rounded-md border border-border-strong px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover', focus)}>Console</Link>
              <button type="button" disabled={signingOut} onClick={() => { void handleLogout(); }} aria-label="Log out" className={cn(iconButton, 'disabled:cursor-wait disabled:opacity-40')}><LogOut aria-hidden="true" className="h-4 w-4" /></button>
            </> : <>
              <Link href="/login" className={cn('inline-flex min-h-10 items-center px-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary', focus)}>Log in</Link>
              <Link href="/signup" className={primaryLink}>Get Started</Link>
            </>}
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className={iconButton}>{theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}</button>
            <button type="button" ref={menuButtonRef} onClick={() => setIsOpen(true)} aria-expanded={isOpen} aria-controls="athlix-mobile-menu" aria-label="Open menu" className={iconButton}><Menu aria-hidden="true" className="h-5 w-5" /></button>
          </div>
        </div>
      </nav>
      {logoutError && !isOpen && <p role="alert" className="border-b border-danger/40 bg-background px-4 py-3 text-center text-sm text-danger">{logoutError}</p>}
      <AnimatePresence>
        {isOpen && <motion.dialog id="athlix-mobile-menu" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu"
          onCancel={event => { event.preventDefault(); closeMenu(); }}
          onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}
          initial={{ opacity: 0, x: reduceMotion ? 0 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduceMotion ? 0 : 12 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-text-primary backdrop:bg-black/60">
          <aside className="ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-border-strong bg-background p-6">
          <div className="mb-7 flex items-center justify-between border-b border-border pb-5"><span className="font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">Navigation</span><button type="button" onClick={closeMenu} aria-label="Close menu" className={iconButton}><X aria-hidden="true" className="h-5 w-5" /></button></div>
          <div className="mb-8 flex flex-col">{links.map(link => <Link key={link.href} href={link.href} onClick={closeMenu} aria-current={pathname === link.href ? 'page' : undefined} className={cn('border-b border-border py-4 font-display text-xl font-semibold', pathname === link.href ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary', focus)}>{link.name}</Link>)}</div>
          <div className="mt-auto flex flex-col gap-1">
            {logoutError && <p role="alert" className="rounded-md border border-danger/40 px-3 py-3 text-sm text-danger">{logoutError}</p>}
            {isAuthenticated ? <>
              {[['/training', 'Training history'], ['/bookings', 'My sessions'], ['/feed', 'Community'], ['/notifications', `Notifications${!notificationError && unreadCount > 0 ? ` (${unreadCount})` : ''}`], ...(user?.role === 'coach' ? [['/clients', 'My clients']] : [])].map(([href, label]) => <Link key={href} href={href} onClick={closeMenu} className={cn('rounded-md py-2 text-sm text-text-secondary hover:text-text-primary', focus)}>{label}</Link>)}
              <Link href="/dashboard" onClick={closeMenu} className={cn(primaryLink, 'mt-5')}>Go to Console</Link>
              <button type="button" disabled={signingOut} onClick={() => { void handleLogout(); }} className={cn('min-h-11 rounded-md border border-border px-4 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40', focus)}>Log out</button>
            </> : <><Link href="/login" onClick={closeMenu} className={cn('inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong text-sm font-medium text-text-primary', focus)}>Log in</Link><Link href="/signup" onClick={closeMenu} className={primaryLink}>Get Started</Link></>}
          </div>
          </aside>
        </motion.dialog>}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
