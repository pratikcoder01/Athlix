import { z } from 'zod';
import { workspaceRequest } from './workspaceApi';

export const trainingEntrySchema = z.object({
  _id: z.string(), date: z.string(), discipline: z.string(), durationMinutes: z.number(), focus: z.string(),
  notes: z.string(), effort: z.number().optional(), version: z.number(), createdAt: z.string().optional(), updatedAt: z.string().optional(),
});
export type TrainingEntry = z.infer<typeof trainingEntrySchema>;
export type TrainingDetails = Pick<TrainingEntry, 'date' | 'discipline' | 'durationMinutes' | 'focus' | 'notes' | 'effort'>;
const planSchema = z.object({ _id: z.string(), weekOverview: z.string(), notes: z.string(), createdAt: z.string().optional(), days: z.array(z.object({
  day: z.string(), focus: z.string(), drills: z.array(z.string()), duration: z.string(), intensity: z.enum(['low', 'medium', 'high']),
})) });
export type SavedTrainingPlan = z.infer<typeof planSchema>;
const entryResponse = z.object({ success: z.literal(true), entry: trainingEntrySchema, message: z.string() });
export const loadTrainingEntries = (token: string, page: number, signal?: AbortSignal) => workspaceRequest(token, `/training/entries?page=${page}&limit=12`,
  z.object({ success: z.literal(true), entries: z.array(trainingEntrySchema), page: z.number(), hasMore: z.boolean() }), { signal });
export const createTrainingEntry = (token: string, details: TrainingDetails, clientRequestId: string) => workspaceRequest(token, '/training/entries', entryResponse,
  { method: 'POST', body: JSON.stringify({ ...details, clientRequestId }) });
export const updateTrainingEntry = (token: string, id: string, details: TrainingDetails, version: number) => workspaceRequest(token, `/training/entries/${encodeURIComponent(id)}`, entryResponse,
  { method: 'PATCH', body: JSON.stringify({ ...details, version }) });
export const archiveTrainingEntry = (token: string, id: string, version: number) => workspaceRequest(token, `/training/entries/${encodeURIComponent(id)}`,
  z.object({ success: z.literal(true), message: z.string() }), { method: 'DELETE', body: JSON.stringify({ version }) });
export const loadTrainingPlans = (token: string, page: number, signal?: AbortSignal) => workspaceRequest(token, `/training/plans?page=${page}&limit=6`,
  z.object({ success: z.literal(true), plans: z.array(planSchema), page: z.number(), hasMore: z.boolean() }), { signal });
export const loadTrainingPlan = (token: string, id: string, signal?: AbortSignal) => workspaceRequest(token, `/training/plans/${encodeURIComponent(id)}`,
  z.object({ success: z.literal(true), plan: planSchema }), { signal });

const clientSchema = z.object({ _id: z.string(), name: z.string(), discipline: z.string(), beltRank: z.string(), sessions: z.number(), completedSessions: z.number(), lastScheduledTime: z.string() });
export type CoachingClient = z.infer<typeof clientSchema>;
export const loadCoachingClients = (token: string, page: number, signal?: AbortSignal) => workspaceRequest(token, `/coach-clients?page=${page}&limit=12`,
  z.object({ success: z.literal(true), clients: z.array(clientSchema), page: z.number(), hasMore: z.boolean() }), { signal });
const notesSchema = z.object({ text: z.string(), version: z.number(), updatedAt: z.string().optional() });
const clientDetailsSchema = z.object({ success: z.literal(true), client: z.object({ id: z.string(), name: z.string(), discipline: z.string(), beltRank: z.string() }), notes: notesSchema,
  sessions: z.array(z.object({ _id: z.string(), scheduledTime: z.string(), durationMinutes: z.number(), status: z.enum(['pending', 'accepted', 'completed', 'rejected', 'cancelled']) })), page: z.number(), hasMore: z.boolean() });
export type CoachingClientDetails = z.infer<typeof clientDetailsSchema>;
export const loadCoachingClient = (token: string, id: string, page: number, signal?: AbortSignal) => workspaceRequest(token, `/coach-clients/${encodeURIComponent(id)}?page=${page}&limit=12`, clientDetailsSchema, { signal });
export const saveCoachingNotes = (token: string, id: string, notes: string, version: number) => workspaceRequest(token, `/coach-clients/${encodeURIComponent(id)}/notes`,
  z.object({ success: z.literal(true), message: z.string(), notes: notesSchema }), { method: 'PUT', body: JSON.stringify({ notes, version }) });

const notificationSchema = z.object({ _id: z.string(), type: z.enum(['booking', 'social', 'tournament', 'system']), message: z.string(), read: z.boolean(), link: z.string(), createdAt: z.string() });
export type StoredNotification = z.infer<typeof notificationSchema>;
export const loadNotifications = (token: string, page: number, unreadOnly: boolean, signal?: AbortSignal) => workspaceRequest(token, `/notifications?page=${page}&limit=20&unreadOnly=${unreadOnly}`,
  z.object({ success: z.literal(true), notifications: z.array(notificationSchema), unreadCount: z.number(), page: z.number(), hasMore: z.boolean() }), { signal });
export const setNotificationRead = async (token: string, id: string, read: boolean) => {
  const result = await workspaceRequest(token, `/notifications/${encodeURIComponent(id)}`,
    z.object({ success: z.literal(true), notification: notificationSchema }), { method: 'PATCH', body: JSON.stringify({ read }) });
  window.dispatchEvent(new Event('athlix:notifications-updated'));
  return result;
};
export const markAllNotificationsRead = async (token: string) => {
  const result = await workspaceRequest(token, '/notifications/read-all', z.object({ success: z.literal(true), changed: z.number() }), { method: 'POST', body: '{}' });
  window.dispatchEvent(new Event('athlix:notifications-updated'));
  return result;
};
