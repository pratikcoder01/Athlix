import { z } from 'zod';
import { academySchema, workspaceRequest } from './workspaceApi';

export const managedAcademySchema = academySchema.extend({ isPublished: z.boolean().default(true), archivedAt: z.string().nullable().default(null), version: z.number().int().default(0) });
export const academyMemberSchema = z.object({ _id: z.string(), academyId: z.string(), memberCode: z.string(), name: z.string(),
  email: z.string().default(''), discipline: z.string(), beltRank: z.string().default(''), joinedOn: z.string(),
  status: z.enum(['active', 'inactive']), notes: z.string().default(''), version: z.number().int(),
});
const attendanceSchema = z.object({ _id: z.string(), academyId: z.string(), memberId: z.union([z.string(), z.object({ _id: z.string(), name: z.string(), memberCode: z.string() })]).nullable(),
  date: z.string(), status: z.enum(['present', 'absent', 'excused']),
});
export type ManagedAcademy = z.infer<typeof managedAcademySchema>;
export type AcademyMember = z.infer<typeof academyMemberSchema>;
export type AcademyAttendance = z.infer<typeof attendanceSchema>;
export type AcademySummary = { totalMembers: number; activeMembers: number; inactiveMembers: number; date: string; attendance: { present: number; absent: number; excused: number } };
const prefix = (id: string) => `/academies/${encodeURIComponent(id)}`;
export const loadAcademyOperations = (token: string, id: string, signal?: AbortSignal) => workspaceRequest(token, `${prefix(id)}/operations`, z.object({
  success: z.literal(true), academy: managedAcademySchema, summary: z.object({ totalMembers: z.number(), activeMembers: z.number(), inactiveMembers: z.number(), date: z.string(),
    attendance: z.object({ present: z.number(), absent: z.number(), excused: z.number() }) }),
}), { signal });
export const saveAcademyListing = (token: string, id: string, changes: Record<string, unknown>) => workspaceRequest(token, prefix(id),
  z.object({ success: z.literal(true), message: z.string(), academy: managedAcademySchema }), { method: 'PATCH', body: JSON.stringify(changes) });
export const loadAcademyMembers = (token: string, id: string, query: URLSearchParams, signal?: AbortSignal) => workspaceRequest(token, `${prefix(id)}/members?${query}`,
  z.object({ success: z.literal(true), members: z.array(academyMemberSchema), page: z.number(), hasMore: z.boolean() }), { signal });
export const saveAcademyMember = (token: string, id: string, changes: Record<string, unknown>, memberId?: string) => workspaceRequest(token,
  `${prefix(id)}/members${memberId ? `/${encodeURIComponent(memberId)}` : ''}`, z.object({ success: z.literal(true), message: z.string(), member: academyMemberSchema }),
  { method: memberId ? 'PATCH' : 'POST', body: JSON.stringify(changes) });
export const loadAcademyAttendance = (token: string, id: string, date: string, page: number, signal?: AbortSignal) => workspaceRequest(token,
  `${prefix(id)}/attendance?${new URLSearchParams({ date, page: String(page), limit: '24' })}`,
  z.object({ success: z.literal(true), records: z.array(attendanceSchema), date: z.string(), page: z.number(), hasMore: z.boolean() }), { signal });
export const saveAcademyAttendance = (token: string, id: string, changes: Record<string, unknown>) => workspaceRequest(token, `${prefix(id)}/attendance`,
  z.object({ success: z.literal(true), message: z.string(), record: attendanceSchema }), { method: 'PUT', body: JSON.stringify(changes) });
