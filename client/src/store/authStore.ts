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
  sessionLoading: boolean;
  setSessionLoading: (loading: boolean) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// Access credentials stay in memory. A server-owned HttpOnly cookie restores the
// account after reload; old localStorage bearers are never read or trusted.
export const useAuthStore = create<AuthState>()(set => ({
  user: null, token: null, isAuthenticated: false, revision: 0, sessionLoading: true,
  setSessionLoading: sessionLoading => set({ sessionLoading }),
  setAuth: (user, token) => set(state => ({ user, token, isAuthenticated: true, revision: state.revision + 1, sessionLoading: false })),
  logout: () => set(state => ({ user: null, token: null, isAuthenticated: false, revision: state.revision + 1, sessionLoading: false })),
}));

export default useAuthStore;
