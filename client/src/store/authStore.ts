import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'athlete' | 'coach' | 'academy_owner' | 'tournament_organizer' | 'admin';
  profileImage?: string;
  bio?: string;
  discipline?: string;
  beltRank?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  revision: number;
  lastSignInAt: number;
  sessionLoading: boolean;
  setSessionLoading: (loading: boolean) => void;
  setAuth: (user: User, token: string, options?: { renewal?: boolean }) => void;
  logout: () => void;
}

// Access credentials stay in memory. A server-owned HttpOnly cookie restores the
// account after reload; old localStorage bearers are never read or trusted.
// Wall time advances across system sleep, unlike some performance clocks. The
// local clamp preserves ordering when milliseconds repeat or the clock goes
// backward. Adjustments can still skew ordering between tabs; these are UI hints,
// never server authorization or a globally synchronized clock.
let lastSessionChangeTime = 0;
export const sessionChangeTime = () => {
  lastSessionChangeTime = Math.max(Date.now(), lastSessionChangeTime + 1);
  return lastSessionChangeTime;
};

export const useAuthStore = create<AuthState>()(set => ({
  user: null, token: null, isAuthenticated: false, revision: 0, lastSignInAt: 0, sessionLoading: true,
  setSessionLoading: sessionLoading => set({ sessionLoading }),
  setAuth: (user, token, options) => set(state => ({ user, token, isAuthenticated: true, revision: state.revision + 1,
    lastSignInAt: options?.renewal ? state.lastSignInAt : sessionChangeTime(), sessionLoading: false })),
  logout: () => set(state => ({ user: null, token: null, isAuthenticated: false, revision: state.revision + 1, sessionLoading: false })),
}));

export default useAuthStore;
