import { z } from 'zod';
import { academyCreateSchema, disciplineSchema, directoryObjectId } from './directoryPolicy';

export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && utcDay(date) === value;
}, 'Use a valid calendar date');
const pastDate = calendarDate.refine(value => value <= utcDay(), 'Future dates are not accepted');
export const academyListingUpdateSchema = academyCreateSchema.partial().extend({
  description: academyCreateSchema.shape.description.removeDefault().optional(),
  schedule: academyCreateSchema.shape.schedule.removeDefault().optional(),
  gallery: academyCreateSchema.shape.gallery.removeDefault().optional(),
  expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  isPublished: z.boolean().optional(),
  archived: z.boolean().optional(),
}).strict().superRefine((value, context) => {
  if (Object.keys(value).length < 2) context.addIssue({ code: 'custom', message: 'No listing changes provided' });
  if ((value.latitude === undefined) !== (value.longitude === undefined)) context.addIssue({ code: 'custom', message: 'Both coordinates are required' });
});

const memberFields = {
  memberCode: z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/).transform(value => value.toUpperCase()),
  name: z.string().trim().min(1).max(150),
  email: z.union([z.string().trim().email().max(254).transform(value => value.toLowerCase()), z.literal('')]).default(''),
  discipline: disciplineSchema,
  beltRank: z.string().trim().max(80).default(''),
  joinedOn: pastDate,
  notes: z.string().trim().max(1000).default(''),
};
export const academyMemberCreateSchema = z.object({ ...memberFields, permissionConfirmed: z.literal(true) }).strict();
export const academyMemberUpdateSchema = z.object({ ...memberFields, status: z.enum(['active', 'inactive']) }).partial().extend({
  email: memberFields.email.removeDefault().optional(),
  beltRank: memberFields.beltRank.removeDefault().optional(),
  notes: memberFields.notes.removeDefault().optional(),
  expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
}).strict().refine(value => Object.keys(value).length > 1, 'No member changes provided');
const page = z.preprocess(value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value, z.number().int().min(1).max(10000)).default(1);
const limit = z.preprocess(value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value, z.number().int().min(1).max(50)).default(24);
export const academyMemberQuerySchema = z.object({ page, limit,
  search: z.string().trim().max(80).optional(), status: z.enum(['active', 'inactive']).optional(),
}).strict();
export const academyAttendanceQuerySchema = z.object({ page, limit, date: pastDate.optional() }).strict();
export const academyAttendanceSchema = z.object({ memberId: directoryObjectId,
  date: pastDate.refine(value => new Date(`${value}T00:00:00Z`).getTime() >= Date.now() - 366 * 86400000, 'Attendance is limited to the last 365 days'),
  status: z.enum(['present', 'absent', 'excused']),
}).strict();

export const academyOwnedFilter = (id: string, user: { _id: unknown; role: string }) => ({
  _id: id, ...(user.role === 'admin' ? {} : { ownerId: user._id }),
});
export const academyVersionFilter = (version: number) => version === 0
  ? { $or: [{ version: 0 }, { version: { $exists: false } }] } : { version };
