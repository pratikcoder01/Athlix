'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { accessExpiresAt, applySessionSignOut, renewSession } from '../lib/authSession';
import { subscribeSessionSignOut } from '../lib/sessionEvents';

const sessionFailureMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'Session verification is taking longer than expected. Wait a moment, then retry.';
    }
    if (error instanceof TypeError && /^(Failed to fetch|NetworkError when attempting to fetch resource\.?|Load failed|Network request failed)$/i.test(error.message)) {
      return 'Unable to reach ATHLIX. Check your connection, then retry.';
    }
    return error.message;
  }
  return 'Session verification is temporarily unavailable. Please retry or sign in again.';
};

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const retry = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let active = true;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout>;
    try { localStorage.removeItem('athlix-auth'); } catch { /* Private storage can be disabled. */ }
    const schedule = (delay: number) => { clearTimeout(timer); timer = setTimeout(() => { void refresh(); }, delay); };
    const refresh = async () => {
      clearTimeout(timer);
      const requestGeneration = generation;
      try {
        const signedIn = await renewSession();
        if (!active || requestGeneration !== generation) return;
        setMessage('');
        useAuthStore.getState().setSessionLoading(false);
        if (signedIn) schedule(12 * 60_000);
      } catch (error) {
        if (!active || requestGeneration !== generation) return;
        useAuthStore.getState().setSessionLoading(false);
        const state = useAuthStore.getState();
        if (state.token && accessExpiresAt(state.token) <= Date.now()) state.logout();
        setMessage(sessionFailureMessage(error));
        schedule(30_000);
      }
    };
    retry.current = refresh;
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.revision !== previous.revision && (state.lastSignInAt !== previous.lastSignInAt || (!state.token && previous.token))) generation++;
      if (state.token !== previous.token) {
        clearTimeout(timer);
        if (state.token) schedule(Math.max(1000, (accessExpiresAt(state.token) || Date.now() + 15 * 60_000) - Date.now() - 3 * 60_000));
        else setMessage('');
      }
    });
    const focus = () => { const state = useAuthStore.getState(); if (state.token && accessExpiresAt(state.token) - Date.now() < 3 * 60_000) void refresh(); };
    const unsubscribeSignOut = subscribeSessionSignOut(startedAt => {
      if (applySessionSignOut(startedAt)) { generation++; clearTimeout(timer); setMessage(''); }
    });
    window.addEventListener('focus', focus);
    void refresh();
    return () => { active = false; retry.current = async () => {}; clearTimeout(timer); unsubscribe(); unsubscribeSignOut(); window.removeEventListener('focus', focus); };
  }, []);
  return <>{children}{message && <div role="alert" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-border bg-surface p-4 text-sm text-text-primary shadow-lg">{message}<button type="button" className="ml-3 [color:var(--brand-accent-text)] underline" onClick={() => { void retry.current(); }}>Retry</button></div>}</>;
}
