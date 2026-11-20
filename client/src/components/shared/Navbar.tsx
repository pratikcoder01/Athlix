'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X, LogOut, Bell } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { logoutSession } from '../../lib/authSession';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import MagneticButton from './MagneticButton';
import { cn } from '../../lib/utils';

const NavLink = ({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full",
      active ? "text-primary" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
    )}
  >
    <span className="relative z-10">{children}</span>
    {active && (
      <motion.span
        layoutId="activeNavBackground"
        className="absolute inset-0 z-0 bg-surface rounded-full border border-border"
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    )}
  </Link>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount, notificationError } = useSocket();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') || []);
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; menuButton?.focus(); };
  }, [isOpen]);

  const handleLogout = async () => {
    setSigningOut(true); setLogoutError('');
    try { await logoutSession(); await signOut(auth); setIsOpen(false); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : 'Sign-out could not be confirmed. Please retry.'); }
    finally { setSigningOut(false); }
  };

  const navLinks = [
    { name: 'Coaches', href: '/coaches' },
    { name: 'Academies', href: '/academies' },
    { name: 'Kata Analyzer', href: '/kata' },
    { name: 'Tournaments', href: '/tournaments' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <motion.nav 
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled 
          ? "glass-panel border-border py-3 shadow-sm" 
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2.5 group outline-none shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-white/20 skew-x-12 z-10"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
              <Image src="/logo.png" alt="Athlix Logo" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
              Athlix
            </span>
          </Link>

          {/* Desktop Nav - Centered Floating Pill */}
          <div className="hidden lg:flex items-center p-1 bg-background/50 backdrop-blur-md border border-border rounded-full shadow-sm">
            {navLinks.map((link) => (
              <NavLink key={link.name} href={link.href} active={isActive(link.href)}>
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-hover"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/notifications"
                    aria-label={`Notifications${!notificationError && unreadCount ? `, ${unreadCount} unread` : ''}`}
                    title={notificationError ? 'Notification count unavailable. Open inbox to retry.' : 'Open saved notifications'}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface relative"
                  >
                    <Bell className="h-4 w-4" />
                    {!notificationError && unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,148,0.8)]" />
                    )}
                </Link>

                <Link href="/dashboard">
                  <MagneticButton as="span" variant="outline" size="sm">
                    Console
                  </MagneticButton>
                </Link>
                <button disabled={signingOut} onClick={() => { void handleLogout(); }} className="p-2 text-text-tertiary hover:text-danger transition-colors disabled:opacity-40" aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  Log in
                </Link>
                <Link href="/signup">
                  <MagneticButton as="span" variant="premium" size="sm">
                    Get Started
                  </MagneticButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-text-secondary" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button ref={menuButtonRef} onClick={() => setIsOpen(true)} aria-expanded={isOpen} aria-controls="athlix-mobile-menu" className="p-2 text-primary" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>
      {logoutError && <p role="alert" className="mx-auto max-w-7xl border border-danger/40 bg-background px-4 py-3 text-sm text-danger">{logoutError}</p>}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="athlix-mobile-menu" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-80 glass-panel-strong border-l border-border z-[100] flex flex-col overflow-y-auto p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-surface rounded-full" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-2xl font-bold py-4 border-b border-border transition-colors",
                    isActive(link.href) ? "text-accent" : "text-text-secondary hover:text-primary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-8 flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/training" onClick={() => setIsOpen(false)}>Training history</Link>
                  <Link href="/bookings" onClick={() => setIsOpen(false)}>My sessions</Link>
                  <Link href="/feed" onClick={() => setIsOpen(false)}>Community</Link>
                  <Link href="/notifications" onClick={() => setIsOpen(false)}>Notifications{!notificationError && unreadCount > 0 ? ` (${unreadCount})` : ''}</Link>
                  {user?.role === 'coach' && <Link href="/clients" onClick={() => setIsOpen(false)}>My clients</Link>}
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <MagneticButton as="span" variant="premium" className="w-full">Go to Console</MagneticButton>
                  </Link>
                  <button disabled={signingOut} onClick={() => { void handleLogout(); }} className="w-full py-4 text-danger font-medium disabled:opacity-40">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)} className="text-center font-medium py-2">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <MagneticButton as="span" variant="premium" className="w-full">Get Started</MagneticButton>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
