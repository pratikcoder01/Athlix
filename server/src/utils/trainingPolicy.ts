import { z } from 'zod';
import { disciplineSchema, directoryObjectId } from './directoryPolicy';

export const recordId = directoryObjectId;
const pageNumber = (max: number) => z.preprocess(value => typeof value === 'string' || typeof value === 'number' ? value : Number.NaN, z.coerce.number().int().min(1).max(max));
export const recordListQuery = z.object({ page: pageNumber(1000).default(1), limit: pageNumber(50).default(12) }).strict();
export const recordVersion = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10);
}, 'Use an actual training date no later than today (UTC)');
const entryFields = {
  date, discipline: disciplineSchema, durationMinutes: z.number().int().min(1).max(1440),
  focus: z.string().trim().min(1).max(200), notes: z.string().trim().max(3000).default(''),
  effort: z.number().int().min(1).max(10).optional(),
};
export const createTrainingSchema = z.object({ ...entryFields, clientRequestId: z.string().uuid() }).strict();
export const updateTrainingSchema = z.object({ ...entryFields, version: recordVersion }).strict();
export const removeTrainingSchema = z.object({ version: recordVersion }).strict();
export const clientNotesSchema = z.object({ notes: z.string().trim().max(5000), version: recordVersion }).strict();
export const notificationQuery = recordListQuery.extend({ unreadOnly: z.enum(['true', 'false']).optional() }).strict();
export const notificationReadSchema = z.object({ read: z.boolean() }).strict();

// Never follow externally supplied or legacy notification URLs.
export const safeNotificationLink = (link: unknown): string => {
  if (typeof link !== 'string' || !/^\/(bookings|tournaments|feed|profile|training|clients|academies)(?:\?[^\r\n\\]*)?$/.test(link)) return '';
  return link.length <= 500 ? link : '';
};
