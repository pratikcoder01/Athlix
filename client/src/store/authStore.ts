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
// Epoch-based monotonic browser time lets tabs discard a delayed sign-out hint
// after a newer explicit sign-in. It never authorizes a server request.
export const sessionChangeTime = () => typeof performance !== 'undefined'
  ? performance.timeOrigin + performance.now() : Date.now();

export const useAuthStore = create<AuthState>()(set => ({
  user: null, token: null, isAuthenticated: false, revision: 0, lastSignInAt: 0, sessionLoading: true,
  setSessionLoading: sessionLoading => set({ sessionLoading }),
  setAuth: (user, token, options) => set(state => ({ user, token, isAuthenticated: true, revision: state.revision + 1,
    lastSignInAt: options?.renewal ? state.lastSignInAt : sessionChangeTime(), sessionLoading: false })),
  logout: () => set(state => ({ user: null, token: null, isAuthenticated: false, revision: state.revision + 1, sessionLoading: false })),
}));

export default useAuthStore;
