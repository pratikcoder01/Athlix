import { z } from 'zod';
import { useAuthStore } from '../store/authStore';

const authResponse = z.object({ success: z.literal(true), token: z.string().min(1).max(8192), user: z.object({
  id: z.string(), name: z.string(), email: z.string(), phone: z.string().optional(),
  role: z.enum(['athlete', 'coach', 'academy_owner', 'tournament_organizer', 'admin']),
  profileImage: z.string().optional(), bio: z.string().optional(), discipline: z.string().optional(), beltRank: z.string().optional(),
}) });

export const accessExpiresAt = (token: string | null) => {
  if (!token) return 0;
  try {
    const part = token.split('.')[1];
    const decoded = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' && Number.isFinite(decoded.exp) ? decoded.exp * 1000 : 0;
  } catch { return 0; }
};

let renewing: Promise<boolean> | null = null;
export const renewSession = (): Promise<boolean> => {
  if (renewing) return renewing;
  const run = async () => {
    const revision = useAuthStore.getState().revision;
    const response = await fetch('/api/auth/session', { method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { 'X-ATHLIX-Session': '1' }, signal: AbortSignal.timeout(15_000) });
    if (response.status === 401) {
      if (useAuthStore.getState().revision === revision) useAuthStore.getState().logout();
      return false;
    }
    if (!response.ok) throw new Error('Unable to renew your session. Check your connection and try again.');
    const result = authResponse.safeParse(await response.json());
    if (!result.success) throw new Error('ATHLIX returned an unexpected session response. Sign in again.');
    if (useAuthStore.getState().revision === revision) useAuthStore.getState().setAuth(result.data.user, result.data.token);
    return true;
  };
  // Coordinate tabs so single-use cookies do not race. Browsers without Web
  // Locks still fail closed on a concurrent rotation and may require a new login.
  const operation = (async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.locks) return await navigator.locks.request('athlix-session', run);
    return await run();
  })().finally(() => { renewing = null; });
  renewing = operation;
  return operation;
};

export const logoutSession = async (everywhere = false) => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`/api/auth/${everywhere ? 'logout-all' : 'logout'}`, {
    method: 'POST', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(15_000),
    headers: { 'X-ATHLIX-Session': '1', ...(everywhere && token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) throw new Error('Server sign-out could not be confirmed. Check your connection and retry.');
  useAuthStore.getState().logout();
  try { localStorage.removeItem('athlix-auth'); } catch { /* Browser storage may be unavailable. */ }
};
