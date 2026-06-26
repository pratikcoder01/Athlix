'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X, Shield, LogOut, User, Bell } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
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
      active ? "text-primary" : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
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
  const { user, logout, isAuthenticated } = useAuthStore();
  const { notifications, unreadCount, markAllRead } = useSocket();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  const handleLogout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    logout();
  };

  const navLinks = [
    { name: 'Product', href: '/features' },
    { name: 'Coaches', href: '/coaches' },
    { name: 'Find Gyms', href: '/gyms' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Academy Hub', href: '/organizer' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <motion.nav 
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled 
          ? "bg-background/70 backdrop-blur-xl border-border py-3 shadow-sm" 
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
              <img src="/logo.png" alt="Athlix Logo" className="w-full h-full object-contain" />
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
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface"
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
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) markAllRead(); }}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface relative"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,148,0.8)]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-background/90 backdrop-blur-xl border border-border rounded-2xl shadow-xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-border flex justify-between items-center">
                          <h4 className="text-sm font-semibold">Notifications</h4>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-text-tertiary">All caught up!</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className="p-3 mb-1 rounded-xl bg-surface/50 border border-border/50 text-sm">
                                {n.message}
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/dashboard">
                  <MagneticButton variant="outline" size="sm">
                    Console
                  </MagneticButton>
                </Link>
                <button onClick={handleLogout} className="p-2 text-text-tertiary hover:text-danger transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  Log in
                </Link>
                <Link href="/signup">
                  <MagneticButton variant="premium" size="sm">
                    Get Started
                  </MagneticButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-text-secondary">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={() => setIsOpen(true)} className="p-2 text-primary">
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-80 bg-background/95 backdrop-blur-2xl border-l border-border z-[100] flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-surface rounded-full">
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
                    "text-2xl font-bold py-4 border-b border-border/50 transition-colors",
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
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <MagneticButton variant="premium" className="w-full">Go to Console</MagneticButton>
                  </Link>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full py-4 text-danger font-medium">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)} className="text-center font-medium py-2">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <MagneticButton variant="premium" className="w-full">Get Started</MagneticButton>
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
