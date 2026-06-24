import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

/**
 * Auth store with persistence — survives page refreshes.
 * Uses localStorage under the key 'athlix-auth'.
 *
 * The persist middleware handles hydration automatically on mount,
 * so no manual localStorage.getItem calls are needed anywhere in the app.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'athlix-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential fields — skip transient UI state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
