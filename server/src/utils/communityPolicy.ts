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
