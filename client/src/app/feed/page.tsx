'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Heart, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import { FeedPost, FeedComment, loadFeed, publishPost, setPostLike, loadComments, publishComment } from '../../lib/communityApi';
import WorkspaceShell, { SignInPrompt, workspaceButton, workspaceControl, workspacePanel } from '../../components/shared/WorkspaceShell';

const failure = (error: unknown) => error instanceof Error ? error.message : 'This community request could not be completed.';
const stamp = (date: string) => new Date(date).toLocaleString();
export default function FeedPage() {
  const { token, user } = useAuthStore();
  const { socket } = useSocket();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState('');
  const [reload, setReload] = useState(0);
  const [fresh, setFresh] = useState(false);
  const [activePost, setActivePost] = useState<string | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentMore, setCommentMore] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentReload, setCommentReload] = useState(0);

  useEffect(() => {
    setPosts([]); setError(''); setFresh(false);
    if (!token) return;
    const controller = new AbortController(); setLoading(true);
    loadFeed(token, page, controller.signal).then(result => { setPosts(result.posts); setHasMore(result.hasMore); })
      .catch(cause => { if (!controller.signal.aborted) setError(failure(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, reload]);
  useEffect(() => {
    setActivePost(null); setComments([]); setDraft(''); setNotice('');
  }, [user?.id]);
  useEffect(() => {
    const onNewPost = () => setFresh(true);
    socket?.on('new_post', onNewPost);
    return () => { socket?.off('new_post', onNewPost); };
  }, [socket]);
  useEffect(() => {
    setComments([]);
    if (!token || !activePost) return;
    const controller = new AbortController(); setCommentLoading(true);
    loadComments(token, activePost, commentPage, controller.signal).then(result => { setComments(result.comments); setCommentMore(result.hasMore); })
      .catch(cause => { if (!controller.signal.aborted) setError(failure(cause)); })
      .finally(() => { if (!controller.signal.aborted) setCommentLoading(false); });
    return () => controller.abort();
  }, [token, activePost, commentPage, commentReload]);

  const publish = async (event: FormEvent) => {
    event.preventDefault(); if (!token || !draft.trim()) return;
    setWriting(true); setError(''); setNotice('');
    try { await publishPost(token, draft.trim()); setDraft(''); setNotice('Your post was published.'); setPage(1); setReload(value => value + 1); }
    catch (cause) { setError(failure(cause)); }
    finally { setWriting(false); }
  };
  const like = async (post: FeedPost) => {
    if (!token) return; setWriting(true); setError('');
    try { const result = await setPostLike(token, post._id, !post.likedByMe); setPosts(values => values.map(value => value._id === post._id ? { ...value, likedByMe: result.liked, likesCount: result.likesCount } : value)); }
    catch (cause) { setError(failure(cause)); }
    finally { setWriting(false); }
  };
  const comment = async (event: FormEvent) => {
    event.preventDefault(); if (!token || !activePost || !commentDraft.trim()) return;
    setWriting(true); setError(''); setNotice('');
    try { await publishComment(token, activePost, commentDraft.trim()); setCommentDraft(''); setCommentPage(1); setCommentReload(value => value + 1); setReload(value => value + 1); setNotice('Your comment was published.'); }
    catch (cause) { setError(failure(cause)); }
    finally { setWriting(false); }
  };

  return <WorkspaceShell eyebrow="Training community" title="Share your training journey." description="Text posts and conversations from signed-in ATHLIX members. Posts are member contributions; achievements and advice are not independently verified.">
    {!token ? <SignInPrompt purpose="join the community" /> : <div className="mx-auto max-w-3xl space-y-6">
      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">{error}</div>}
      {notice && <p role="status" className="rounded-xl border border-success/30 bg-success/10 p-4">{notice}</p>}
      <form onSubmit={publish} className={workspacePanel}><label htmlFor="community-post" className="font-bold">What are you working on?</label><textarea id="community-post" required maxLength={5000} rows={4} value={draft} onChange={event => setDraft(event.target.value)} className={`${workspaceControl} mt-3 resize-y`} placeholder="Share a training reflection or question. Avoid private information." /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-text-tertiary">Text only · {draft.length}/5000 characters</p><button type="submit" disabled={writing || !draft.trim()} className={workspaceButton}><Send className="h-4 w-4" />{writing ? 'Saving…' : 'Publish post'}</button></div></form>
      <div className="flex items-center justify-between gap-4"><p className="text-sm text-text-secondary">{fresh ? 'New posts are available.' : 'Newest posts first'}</p><button onClick={() => setReload(value => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"><RefreshCw className="h-4 w-4" />Refresh feed</button></div>
      {loading ? <p role="status" className="py-10 text-center text-text-secondary">Loading community posts…</p> : posts.length === 0 ? <section className={`${workspacePanel} py-12 text-center`}><h2 className="font-bold">No posts on this page yet</h2><p className="mt-3 text-sm text-text-secondary">Start a conversation with a training reflection or return to the previous page.</p></section> : posts.map(post => <article key={post._id} className={workspacePanel}>
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{post.authorId?.name || 'Former member'}</h2><time dateTime={post.createdAt} className="text-xs text-text-tertiary">{stamp(post.createdAt)}</time></header>
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-relaxed">{post.content}</p>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4"><button type="button" aria-pressed={post.likedByMe} disabled={writing} onClick={() => void like(post)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm disabled:opacity-40 ${post.likedByMe ? 'border-accent text-accent' : 'border-border text-text-secondary'}`}><Heart className="h-4 w-4" />{post.likedByMe ? 'Liked' : 'Like'} · {post.likesCount}</button><button type="button" aria-expanded={activePost === post._id} aria-controls={`comments-${post._id}`} onClick={() => { setActivePost(activePost === post._id ? null : post._id); setCommentPage(1); setCommentDraft(''); setError(''); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><MessageSquare className="h-4 w-4" />Comments · {post.commentsCount}</button></div>
        {activePost === post._id && <section id={`comments-${post._id}`} aria-label="Post comments" className="mt-5 border-t border-border pt-5">
          {commentLoading ? <p role="status" className="text-sm text-text-secondary">Loading comments…</p> : comments.length ? <ul className="space-y-4">{comments.map(value => <li key={value._id} className="rounded-xl border border-border bg-background p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">{value.authorId?.name || 'Former member'}</span><time dateTime={value.createdAt} className="text-xs text-text-tertiary">{stamp(value.createdAt)}</time></div><p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm">{value.content}</p></li>)}</ul> : <p className="text-sm text-text-secondary">No comments on this page yet.</p>}
          <div className="my-4 flex items-center justify-between text-xs"><button disabled={commentPage === 1 || commentLoading} onClick={() => setCommentPage(value => value - 1)} className="underline disabled:opacity-30">Previous comments</button><span>Page {commentPage}</span><button disabled={!commentMore || commentLoading} onClick={() => setCommentPage(value => value + 1)} className="underline disabled:opacity-30">Next comments</button></div>
          <form onSubmit={comment}><label htmlFor={`comment-${post._id}`} className="text-sm font-semibold">Add to the conversation</label><textarea id={`comment-${post._id}`} required maxLength={2000} rows={3} value={commentDraft} onChange={event => setCommentDraft(event.target.value)} className={`${workspaceControl} mt-2 resize-y`} /><button type="submit" disabled={writing || !commentDraft.trim()} className={`${workspaceButton} mt-3`}>Publish comment</button></form>
        </section>}
      </article>)}
      <nav aria-label="Community pages" className="flex items-center justify-between text-sm"><button disabled={page === 1 || loading} onClick={() => { setPage(value => value - 1); setActivePost(null); }} className="rounded-full border border-border px-4 py-2 disabled:opacity-40">Previous posts</button><span>Page {page}</span><button disabled={!hasMore || loading} onClick={() => { setPage(value => value + 1); setActivePost(null); }} className="rounded-full border border-border px-4 py-2 disabled:opacity-40">Next posts</button></nav>
      <p className="text-xs leading-relaxed text-text-tertiary">Media uploads, member following, moderation tools, and social notification delivery are not available in this feed. Do not share sensitive data or content you do not have permission to publish.</p>
    </div>}
  </WorkspaceShell>;
}
