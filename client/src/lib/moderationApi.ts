import { z } from 'zod';
import { workspaceRequest } from './workspaceApi';

const member = z.object({ _id: z.string(), name: z.string(), role: z.string() }).nullable();
export const reportSchema = z.object({ _id: z.string(), reporterId: member, targetType: z.enum(['post', 'comment']), targetId: z.string(),
  reason: z.string(), details: z.string(), status: z.enum(['open', 'resolved']), version: z.number().int(), createdAt: z.string(),
  resolvedAt: z.string().optional(), action: z.enum(['dismiss', 'hide']).optional(), resolutionNote: z.string().optional(),
  target: z.object({ _id: z.string(), authorId: member, content: z.string(), visibility: z.enum(['visible', 'hidden', 'deleted']), version: z.number().int() }).nullable(),
});
export type CommunityReport = z.infer<typeof reportSchema>;
export const loadModerationReports = (token: string, status: 'open' | 'resolved', page: number, signal?: AbortSignal) => workspaceRequest(token,
  `/posts/moderation/reports?${new URLSearchParams({ status, page: String(page), limit: '12' })}`,
  z.object({ success: z.literal(true), reports: z.array(reportSchema), page: z.number(), hasMore: z.boolean() }), { signal });
export const resolveModerationReport = (token: string, report: CommunityReport, action: 'hide' | 'dismiss', note: string) => workspaceRequest(token,
  `/posts/moderation/reports/${encodeURIComponent(report._id)}/resolve`, z.object({ success: z.literal(true), message: z.string() }),
  { method: 'POST', body: JSON.stringify({ expectedVersion: report.version, action, note,
    ...(action === 'hide' && report.target ? { expectedTargetVersion: report.target.version } : {}) }) });
