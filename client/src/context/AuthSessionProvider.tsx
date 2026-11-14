'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { accessExpiresAt, renewSession } from '../lib/authSession';

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    try { localStorage.removeItem('athlix-auth'); } catch { /* Private storage can be disabled. */ }
    const schedule = (delay: number) => { clearTimeout(timer); timer = setTimeout(() => { void refresh(); }, delay); };
    const refresh = async () => {
      try {
        const signedIn = await renewSession();
        if (!active) return;
        setMessage('');
        useAuthStore.getState().setSessionLoading(false);
        if (signedIn) schedule(12 * 60_000);
      } catch (error) {
        if (!active) return;
        useAuthStore.getState().setSessionLoading(false);
        const state = useAuthStore.getState();
        if (state.token && accessExpiresAt(state.token) <= Date.now()) state.logout();
        setMessage(error instanceof Error ? error.message : 'Session verification is temporarily unavailable.');
        schedule(30_000);
      }
    };
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.token !== previous.token) {
        clearTimeout(timer);
        if (state.token) schedule(Math.max(1000, (accessExpiresAt(state.token) || Date.now() + 15 * 60_000) - Date.now() - 3 * 60_000));
      }
    });
    const focus = () => { const state = useAuthStore.getState(); if (state.token && accessExpiresAt(state.token) - Date.now() < 3 * 60_000) void refresh(); };
    window.addEventListener('focus', focus);
    void refresh();
    return () => { active = false; clearTimeout(timer); unsubscribe(); window.removeEventListener('focus', focus); };
  }, []);
  return <>{children}{message && <div role="alert" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-border bg-surface p-4 text-sm text-text-primary shadow-lg">{message}<button type="button" className="ml-3 text-accent underline" onClick={() => { void renewSession().then(() => setMessage('')).catch(() => setMessage('Session verification is unavailable. Please retry or sign in again.')); }}>Retry</button></div>}</>;
}
