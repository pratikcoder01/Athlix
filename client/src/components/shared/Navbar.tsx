'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X, Shield, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
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
  const shouldReduce = useReducedMotion();
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${
        active ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'
      }`}
    >
      {children}
      {/* Animated underline */}
      {!shouldReduce && (
        <motion.span
          className="absolute -bottom-0.5 left-0 h-[2px] rounded-full bg-primary"
          initial={false}
          animate={{ width: active ? '100%' : '0%' }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
      )}
      {shouldReduce && active && (
        <span className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-primary" />
      )}
    </Link>
  );
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduce = useReducedMotion();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => pathname === path;

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -8, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, y: -8, height: 0 },
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
              <img src="/logo.png" alt="ATHLIX Logo" className="h-8 w-auto object-contain" />
              <span className="text-2xl font-extrabold tracking-wider font-display text-primary uppercase">
                ATHLIX<span className="text-secondary-accent font-bebas">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center gap-7">
              {navLinks.map((link) => (
                <NavLink key={link.name} href={link.href} active={isActive(link.href)}>
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* CTA & Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 hover:bg-surface transition-colors cursor-pointer text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-text-primary hover:text-primary transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  <User className="h-4 w-4 text-primary" /> Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1 border border-border px-2.5 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Link>
                )}
                <MagneticButton
                  onClick={logout}
                  className="bg-surface hover:bg-opacity-80 text-text-primary text-xs py-2 px-4 rounded-md"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1 inline" /> LOGOUT
                </MagneticButton>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                >
                  LOGIN
                </Link>
                <Link href="/signup">
                  <MagneticButton
                    variant="primary"
                    className="text-xs font-bold py-2 px-5 rounded-md font-bebas tracking-widest"
                  >
                    JOIN PLATFORM
                  </MagneticButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 hover:bg-surface text-text-secondary"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-2 hover:bg-surface text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={isOpen ? 'close' : 'open'}
                  initial={shouldReduce ? {} : { opacity: 0, rotate: -90 }}
                  animate={shouldReduce ? {} : { opacity: 1, rotate: 0 }}
                  exit={shouldReduce ? {} : { opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={shouldReduce ? {} : mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border bg-background px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-semibold transition-colors ${
                    isActive(link.href) ? 'text-primary' : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-border my-2" />
              {isAuthenticated ? (
                <div className="flex flex-col gap-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-base font-semibold text-text-primary flex items-center gap-2"
                  >
                    <User className="h-5 w-5 text-primary" /> Dashboard Panel
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="flex items-center gap-2 text-left text-base font-semibold text-primary"
                  >
                    <LogOut className="h-5 w-5" /> LOGOUT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-base font-semibold text-text-secondary"
                  >
                    LOGIN
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <button className="w-full bg-primary hover:brightness-110 text-white font-bold py-2.5 rounded-md font-bebas tracking-widest text-sm transition-all shadow-lg shadow-primary/20">
                      JOIN PLATFORM
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
