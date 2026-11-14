import { z } from 'zod';
import { workspaceRequest } from './workspaceApi';

const author = z.object({ _id: z.string(), name: z.string(), role: z.string() }).nullable();
export const feedPostSchema = z.object({
  _id: z.string(), authorId: author, content: z.string(), createdAt: z.string(),
  likesCount: z.number().int().nonnegative(), likedByMe: z.boolean(), commentsCount: z.number().int().nonnegative(),
});
export type FeedPost = z.infer<typeof feedPostSchema>;
export const commentSchema = z.object({ _id: z.string(), authorId: author, content: z.string(), createdAt: z.string() });
export type FeedComment = z.infer<typeof commentSchema>;
const pageShape = { success: z.literal(true), page: z.number(), hasMore: z.boolean() };
export const loadFeed = (token: string, page: number, signal?: AbortSignal) => workspaceRequest(token, `/posts?page=${page}&limit=12`,
  z.object({ ...pageShape, posts: z.array(feedPostSchema) }), { signal });
export const publishPost = (token: string, content: string) => workspaceRequest(token, '/posts',
  z.object({ success: z.literal(true), post: feedPostSchema }), { method: 'POST', body: JSON.stringify({ content }) });
export const setPostLike = (token: string, id: string, liked: boolean) => workspaceRequest(token, `/posts/${encodeURIComponent(id)}/like`,
  z.object({ success: z.literal(true), liked: z.boolean(), likesCount: z.number().int().nonnegative() }), { method: 'POST', body: JSON.stringify({ liked }) });
export const loadComments = (token: string, id: string, page: number, signal?: AbortSignal) => workspaceRequest(token, `/posts/${encodeURIComponent(id)}/comments?page=${page}&limit=20`,
  z.object({ ...pageShape, comments: z.array(commentSchema) }), { signal });
export const publishComment = (token: string, id: string, content: string) => workspaceRequest(token, `/posts/${encodeURIComponent(id)}/comments`,
  z.object({ success: z.literal(true), comment: commentSchema }), { method: 'POST', body: JSON.stringify({ content }) });
