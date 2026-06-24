'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X, Shield, LogOut, User, Bell } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import MagneticButton from './MagneticButton';

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
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative text-xs font-semibold tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2.5 py-1.5 ${
        active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="activeNav"
          className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-primary"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { notifications, unreadCount, markAllRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  // Close notif dropdown on outside click
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
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo with Combat tech styling */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded group">
              <svg className="h-6 w-6 text-primary transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="fill-none stroke-current stroke-2" />
                <polygon points="12 6 18 10 18 14 12 18 6 14 6 10" />
              </svg>
              <span className="text-md font-display font-black tracking-widest text-text-primary uppercase">
                ATHLIX<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <NavLink key={link.name} href={link.href} active={isActive(link.href)}>
                {link.name.toUpperCase()}
              </NavLink>
            ))}
          </div>

          {/* CTA & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="relative rounded-full p-2 hover:bg-surface transition-colors cursor-pointer text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-8 h-8 flex items-center justify-center overflow-hidden"
              aria-label="Toggle Theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) markAllRead(); }}
                    className="relative rounded-full p-2 hover:bg-surface transition-colors text-text-secondary hover:text-text-primary w-8 h-8 flex items-center justify-center cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center bg-primary text-white text-[9px] font-black rounded-full font-mono">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-10 w-72 bg-secondary border border-border rounded-sm shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="flex justify-between items-center px-4 py-3 border-b border-border/60">
                          <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase font-mono">Notifications</span>
                          <button
                            onClick={() => markAllRead()}
                            className="text-[9px] font-mono font-bold text-primary hover:underline uppercase"
                          >Mark read</button>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-center text-[10px] text-text-tertiary font-mono py-6">No new notifications</p>
                          ) : (
                            notifications.map((n, i) => (
                              <div key={n.id ?? i} className="px-4 py-3 border-b border-border/30 hover:bg-surface transition-colors">
                                <p className="text-[10px] text-text-primary font-bold leading-relaxed">{n.message}</p>
                                <span className="text-[9px] text-text-tertiary font-mono mt-0.5 block">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/dashboard"
                  className="text-xs font-bold tracking-wider text-text-primary hover:text-primary transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded uppercase font-mono"
                >
                  <User className="h-4 w-4 text-text-secondary" /> Console
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    className="text-xs font-bold tracking-wider text-text-secondary hover:text-primary transition-colors flex items-center gap-1 border border-border px-2.5 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary uppercase font-mono"
                  >
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold tracking-wider text-text-secondary hover:text-text-primary transition-colors uppercase font-mono cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-xs font-bold tracking-wider text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 uppercase font-mono"
                >
                  Log in
                </Link>
                <Link href="/signup">
                  <MagneticButton
                    variant="primary"
                    className="text-xs font-bold py-2 px-5 rounded-sm tracking-wider uppercase font-mono"
                  >
                    Get started
                  </MagneticButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="relative rounded-full p-2 hover:bg-surface text-text-secondary w-8 h-8 flex items-center justify-center overflow-hidden"
              aria-label="Toggle Theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </motion.div>
              </AnimatePresence>
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-md p-2 hover:bg-surface text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-in Mobile Drawer with Backdrop Fade */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-50 w-72 bg-secondary border-l border-border px-6 py-6 flex flex-col justify-between shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-8">
                {/* Header inside drawer */}
                <div className="flex justify-between items-center">
                  <span className="text-md font-display font-black tracking-widest text-text-primary uppercase">
                    ATHLIX<span className="text-primary">.</span>
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md p-2 hover:bg-surface text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="h-5.5 w-5.5" />
                  </button>
                </div>

                {/* Navigation lists */}
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-sm font-bold tracking-wider uppercase font-mono py-2 border-b border-border/20 ${
                        isActive(link.href) ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Drawer footer actions */}
              <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-bold tracking-wider text-text-primary flex items-center gap-2 py-2 uppercase font-mono"
                    >
                      <User className="h-4 w-4 text-text-secondary" /> Dashboard Console
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      className="flex items-center gap-2 text-left text-xs font-bold tracking-wider text-text-secondary py-2 uppercase font-mono cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-bold tracking-wider text-text-secondary text-center py-2 uppercase font-mono"
                    >
                      Log in
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <button className="w-full bg-primary hover:bg-opacity-95 text-white font-bold py-3 rounded-sm text-xs tracking-wider uppercase font-mono cursor-pointer transition-colors">
                        Get started
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
