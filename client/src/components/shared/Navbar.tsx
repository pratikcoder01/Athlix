'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X, Shield, LogOut, User } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import MagneticButton from './MagneticButton';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-wider font-display text-primary uppercase">
                ATHLIX<span className="text-secondary-accent font-bebas">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? 'text-primary font-bold' : 'text-text-secondary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 hover:bg-surface transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                >
                  <User className="h-4 w-4 text-primary" /> Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1 border border-border px-2.5 py-1 rounded"
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
                  className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  LOGIN
                </Link>
                <Link href="/signup">
                  <MagneticButton className="bg-primary hover:bg-opacity-90 text-white text-xs font-bold py-2 px-4 rounded-md font-bebas tracking-widest">
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
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-2 hover:bg-surface text-text-secondary"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-base font-semibold ${
                  isActive(link.href) ? 'text-primary' : 'text-text-secondary'
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
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
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
                  <button className="w-full bg-primary hover:bg-opacity-90 text-white font-bold py-2.5 rounded-md font-bebas tracking-widest text-sm">
                    JOIN PLATFORM
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
