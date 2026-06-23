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
      className={`relative text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1 ${
        active ? 'text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
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
  ];

  const isActive = (path: string) => pathname === path;

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -8, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, y: -8, height: 0 },
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
              <span className="text-lg font-bold tracking-tight text-text-primary">
                Athlix
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <NavLink key={link.name} href={link.href} active={isActive(link.href)}>
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* CTA & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-1.5 hover:bg-surface transition-colors cursor-pointer text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-[13px] font-medium text-text-primary hover:text-primary transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  <User className="h-3.5 w-3.5 text-text-secondary" /> Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    className="text-[13px] font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1 border border-border px-2 py-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Shield className="h-3 w-3" /> Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                >
                  Log in
                </Link>
                <Link href="/signup">
                  <MagneticButton
                    variant="primary"
                    className="text-[13px] font-medium py-1.5 px-4 rounded-md"
                  >
                    Get started
                  </MagneticButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-full p-1.5 hover:bg-surface text-text-secondary"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-1.5 hover:bg-surface text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-[14px] transition-colors ${
                    isActive(link.href) ? 'text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-border my-2" />
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-[14px] text-text-primary flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-text-secondary" /> Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="flex items-center gap-2 text-left text-[14px] text-text-secondary"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-[14px] text-text-secondary"
                  >
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <button className="w-full bg-primary hover:brightness-110 text-white font-medium py-2 rounded-md text-[14px] transition-all">
                      Get started
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
