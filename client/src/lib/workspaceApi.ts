import { z } from 'zod';

export const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other'] as const;
export const accountSchema = z.object({ _id: z.string(), name: z.string(), role: z.string() });
export const profileSchema = z.object({
  bio: z.string().default(''), discipline: z.string().default(''), beltRank: z.string().default(''),
  achievements: z.array(z.string()).default([]), location: z.string().default(''),
  profileImage: z.string().default(''),
  socialLinks: z.object({ instagram: z.string().optional(), twitter: z.string().optional(), linkedin: z.string().optional() }).optional(),
});
export type AthleteProfile = z.infer<typeof profileSchema>;
export const academySchema = z.object({
  _id: z.string(), name: z.string(), address: z.string(),
  ownerId: z.union([z.string(), z.object({ _id: z.string(), name: z.string() })]).nullable(),
  disciplines: z.array(z.string()).default([]), description: z.string().default(''), schedule: z.string().default(''),
  location: z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number(), z.number()]) }),
});
export type AcademyListing = z.infer<typeof academySchema>;
export const workspaceEventSchema = z.object({
  _id: z.string(), title: z.string(), date: z.string(), location: z.string(), status: z.enum(['upcoming', 'ongoing', 'completed']),
  organizerId: z.union([z.string(), z.object({ _id: z.string(), name: z.string().optional() })]).nullable(),
  registrations: z.array(z.union([z.string(), z.object({ _id: z.string() })])).default([]),
});
export type WorkspaceEvent = z.infer<typeof workspaceEventSchema>;
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function workspaceRequest<T extends z.ZodTypeAny>(token: string, path: string, schema: T, init: RequestInit = {}): Promise<z.infer<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...init, cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new Error('Unable to reach ATHLIX. Check your connection and try again.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = z.object({ message: z.string() }).safeParse(body);
    throw new Error(response.status === 401 ? 'Your session expired. Please sign in again.' : failure.success ? failure.data.message : 'This request could not be completed.');
  }
  const result = schema.safeParse(body);
  if (!result.success) throw new Error('ATHLIX returned an unexpected response. Refresh before making changes.');
  return result.data;
}

export const loadProfile = (token: string, id: string, signal?: AbortSignal) => workspaceRequest(token, `/profiles/${encodeURIComponent(id)}`,
  z.object({ success: z.literal(true), user: accountSchema, profile: profileSchema.nullable() }), { signal });
export const saveProfile = (token: string, profile: Pick<AthleteProfile, 'bio' | 'discipline' | 'beltRank' | 'achievements' | 'location'>) => workspaceRequest(token, '/profiles',
  z.object({ success: z.literal(true), message: z.string(), profile: profileSchema }), { method: 'PUT', body: JSON.stringify(profile) });
export const loadAcademies = (token: string, query: URLSearchParams, signal?: AbortSignal) => workspaceRequest(token, `/academies?${query}`,
  z.object({ success: z.literal(true), academies: z.array(academySchema), page: z.number(), hasMore: z.boolean() }), { signal });
export const loadWorkspaceEvents = (token: string, signal?: AbortSignal) => workspaceRequest(token, '/tournaments?limit=24&page=1',
  z.object({ success: z.literal(true), tournaments: z.array(workspaceEventSchema), page: z.number() }), { signal });
export const entityId = (value: string | { _id: string } | null) => typeof value === 'string' ? value : value?._id;
