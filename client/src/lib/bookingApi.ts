import { z } from 'zod';

export const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const availabilitySchema = z.object({ dayOfWeek: z.enum(daysOfWeek), startTime: z.string(), endTime: z.string() });
export const coachSchema = z.object({
  id: z.string(), name: z.string(), discipline: z.string(), beltRank: z.string().default(''), bio: z.string().default(''),
  experienceYears: z.number().default(0), certifications: z.array(z.string()).default([]),
  pricingPerHour: z.number().finite().nonnegative(), currency: z.enum(['INR', 'USD']),
  availability: z.array(availabilitySchema), availabilityTimezone: z.literal('UTC'), autoConfirm: z.boolean().default(false),
});
const participantSchema = z.union([z.string(), z.object({ _id: z.string(), name: z.string().optional() })]);
export const sessionSchema = z.object({
  _id: z.string(), athleteId: participantSchema, coachId: participantSchema,
  scheduledTime: z.string().datetime({ offset: true }), durationMinutes: z.number().int().positive(),
  price: z.number().finite().nonnegative(), currency: z.enum(['INR', 'USD']).optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
});
export type Coach = z.infer<typeof coachSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type AvailabilityWindow = z.infer<typeof availabilitySchema>;
export type CoachSettings = {
  pricingPerHour: number; currency: 'INR' | 'USD'; availabilityTimezone?: 'UTC'; availability: AvailabilityWindow[];
  active: boolean; autoConfirm: boolean; experienceYears: number; certifications: string[];
};

const settingsResponseSchema = z.object({
  pricingPerHour: z.number().default(0), currency: z.enum(['INR', 'USD']).optional(), availabilityTimezone: z.literal('UTC').optional(),
  availability: z.array(availabilitySchema).default([]), active: z.boolean().default(false),
  autoConfirm: z.boolean().default(false), experienceYears: z.number().default(0), certifications: z.array(z.string()).default([]),
});
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function request<T extends z.ZodTypeAny>(path: string, token: string, schema: T, init?: RequestInit): Promise<z.infer<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Unable to reach ATHLIX. Refresh your sessions before retrying a booking.');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = z.object({ message: z.string() }).safeParse(data);
    throw new Error(response.status === 401 ? 'Your session expired. Sign in again.' : failure.success ? failure.data.message : 'The request failed. Please try again.');
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error('ATHLIX returned an unexpected response. Refresh before retrying.');
  return parsed.data;
}

export function loadCoaches(token: string, filters: { search?: string; discipline?: string; coachId?: string; page?: number } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') query.set(key, String(value));
  return request(`/api/bookings/coaches?${query}`, token,
    z.object({ success: z.literal(true), coaches: z.array(coachSchema), page: z.number(), hasMore: z.boolean() }), { signal });
}

export function loadSessions(token: string, page = 1, signal?: AbortSignal) {
  return request(`/api/bookings?page=${page}`, token,
    z.object({ success: z.literal(true), bookings: z.array(sessionSchema), page: z.number(), hasMore: z.boolean() }), { signal });
}

export function requestSession(token: string, details: { coachId: string; scheduledTime: string; durationMinutes: number; quotedPrice: number; quotedCurrency: 'INR' | 'USD' }) {
  return request('/api/bookings', token, z.object({ success: z.literal(true), booking: sessionSchema, message: z.string() }),
    { method: 'POST', body: JSON.stringify(details) });
}

export function changeSessionStatus(token: string, id: string, status: Session['status']) {
  return request(`/api/bookings/${encodeURIComponent(id)}`, token, z.object({ success: z.literal(true), booking: sessionSchema, message: z.string() }),
    { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function loadCoachSettings(token: string, id: string, signal?: AbortSignal) {
  return request(`/api/profiles/${encodeURIComponent(id)}`, token,
    z.object({ success: z.literal(true), coachProfile: settingsResponseSchema.nullable() }), { signal });
}

export function saveCoachSettings(token: string, settings: CoachSettings) {
  return request('/api/profiles/coach', token,
    z.object({ success: z.literal(true), coachProfile: settingsResponseSchema, message: z.string() }),
    { method: 'PUT', body: JSON.stringify(settings) });
}

export const sessionQuote = (rate: number, minutes: number) => Math.round(Math.round(rate * 100) * minutes / 60) / 100;
export const formatPrice = (amount: number, currency: 'INR' | 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
export const participantId = (participant: Session['coachId']) => typeof participant === 'string' ? participant : participant._id;
export const participantName = (participant: Session['coachId']) => typeof participant === 'string' ? `Account ${participant.slice(-6)}` : participant.name || `Account ${participant._id.slice(-6)}`;
