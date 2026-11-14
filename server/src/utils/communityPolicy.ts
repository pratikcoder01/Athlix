import { z } from 'zod';

export const communityIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid post identifier');
export const communityPostSchema = z.object({ content: z.string().trim().min(1).max(5000) }).strict();
export const communityCommentSchema = z.object({ content: z.string().trim().min(1).max(2000) }).strict();
export const communityLikeSchema = z.object({ liked: z.boolean() }).strict();
const paginationNumber = (maximum: number) => z.preprocess(
  value => typeof value === 'string' || typeof value === 'number' ? value : Number.NaN,
  z.coerce.number().int().min(1).max(maximum),
);
export const communityQuerySchema = z.object({
  page: paginationNumber(10000).default(1),
  limit: paginationNumber(50).default(12),
}).strict();

export const communityVisible = { visibility: { $nin: ['hidden', 'deleted'] } };
export const communityVersionFilter = (expectedVersion: number) => expectedVersion === 0
  ? { $or: [{ version: 0 }, { version: { $exists: false } }] } : { version: expectedVersion };
const expectedVersion = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const communityPostEditSchema = communityPostSchema.extend({ expectedVersion }).strict();
export const communityCommentEditSchema = communityCommentSchema.extend({ expectedVersion }).strict();
export const communityRemoveSchema = z.object({ expectedVersion }).strict();
export const communityReportSchema = z.object({ reason: z.enum(['spam', 'harassment', 'safety', 'privacy', 'other']), details: z.string().trim().max(1000).default('') })
  .strict().refine(value => value.reason !== 'other' || value.details.length > 0, 'Describe the concern when selecting other');
export const communityReportQuerySchema = communityQuerySchema.extend({ status: z.enum(['open', 'resolved']).default('open') }).strict();
export const communityResolveSchema = z.object({ expectedVersion, action: z.enum(['dismiss', 'hide']), note: z.string().trim().min(1).max(1000),
  expectedTargetVersion: expectedVersion.optional(),
}).strict().refine(value => value.action !== 'hide' || value.expectedTargetVersion !== undefined, 'Reload the current target before hiding');
