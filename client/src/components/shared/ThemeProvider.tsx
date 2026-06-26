'use client';

import React, { useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('athlix-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('athlix-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    // Save theme preference
    localStorage.setItem('athlix-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
