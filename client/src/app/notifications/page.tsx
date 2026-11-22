'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WorkspaceShell, { SignInPrompt, workspacePanel as panel } from '../../components/shared/WorkspaceShell';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import { loadNotifications, markAllNotificationsRead, setNotificationRead, StoredNotification } from '../../lib/trainingApi';
const safeLink = (link: string) => /^\/(bookings|tournaments|feed|profile|training|clients|academies)(?:\?[^\r\n\\]*)?$/.test(link);
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Unable to load notifications.';

export default function NotificationsPage() {
  const { token, user } = useAuthStore(); const { socket } = useSocket();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]); const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1); const [hasMore, setHasMore] = useState(false); const [unreadOnly, setUnreadOnly] = useState(false);
  const [refresh, setRefresh] = useState(0); const [loading, setLoading] = useState(false); const [busyId, setBusyId] = useState('');
  const [error, setError] = useState(''); const [actionError, setActionError] = useState('');
  useEffect(() => { setNotifications([]); setUnreadCount(0); setPage(1); setActionError(''); }, [user?.id]);
  useEffect(() => {
    setNotifications([]); if (!token) return;
    const controller = new AbortController(); setLoading(true); setError('');
    loadNotifications(token, page, unreadOnly, controller.signal).then(result => { setNotifications(result.notifications); setUnreadCount(result.unreadCount); setHasMore(result.hasMore); })
      .catch(reason => { if (!controller.signal.aborted) setError(errorText(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, unreadOnly, refresh]);
  useEffect(() => {
    const refreshRecords = () => setRefresh(value => value + 1);
    socket?.on('notification', refreshRecords); socket?.on('connect', refreshRecords); window.addEventListener('focus', refreshRecords);
    return () => { socket?.off('notification', refreshRecords); socket?.off('connect', refreshRecords); window.removeEventListener('focus', refreshRecords); };
  }, [socket]);
  async function mark(notification: StoredNotification) {
    if (!token) return; setBusyId(notification._id); setActionError('');
    try { await setNotificationRead(token, notification._id, !notification.read); setRefresh(value => value + 1); }
    catch (reason) { setActionError(errorText(reason)); } finally { setBusyId(''); }
  }
  async function markAll() {
    if (!token) return; setBusyId('all'); setActionError('');
    try { await markAllNotificationsRead(token); setRefresh(value => value + 1); }
    catch (reason) { setActionError(errorText(reason)); } finally { setBusyId(''); }
  }
  return <WorkspaceShell title="Your notifications." eyebrow="Stay connected to your training" description="Persisted in-app updates for your account. Refreshing or reconnecting reloads your saved records; email and push delivery are not configured.">
    {!token ? <SignInPrompt purpose="view your notifications" /> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-text-secondary">{unreadCount} unread in-app updates</p><div className="flex flex-wrap items-center gap-4"><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={unreadOnly} onChange={event => { setUnreadOnly(event.target.checked); setPage(1); }} className="accent-orange-500" />Only unread</label><button disabled={loading} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setRefresh(value => value + 1)}>Refresh notifications</button><button disabled={loading || !!busyId || unreadCount === 0} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={markAll}>Mark all read</button></div></div>
      {loading && <p role="status" className={panel}>Loading saved notifications…</p>}{error && <p role="alert" className={panel}>{error}</p>}{actionError && <p role="alert" className={`${panel} mb-4`}>{actionError}</p>}
      {!loading && !error && notifications.length === 0 && <p className={`${panel} text-text-secondary`}>No {unreadOnly ? 'unread ' : ''}notifications on this page.</p>}
      <div className="space-y-4">{notifications.map(notification => <article key={notification._id} className={`${panel} ${notification.read ? '' : 'border-accent/50'}`}><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs uppercase tracking-wider text-accent">{notification.type} · {notification.read ? 'Read' : 'Unread'}</p><time className="text-xs text-text-tertiary" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time></div><p className="mt-4 break-words leading-relaxed">{notification.message}</p><div className="mt-4 flex flex-wrap items-center gap-5">{safeLink(notification.link) && <Link href={notification.link} className="text-sm text-accent underline">View related activity</Link>}<button disabled={!!busyId} onClick={() => mark(notification)} className="text-sm underline disabled:opacity-50">{busyId === notification._id ? 'Saving…' : notification.read ? 'Mark unread' : 'Mark read'}</button></div></article>)}</div>
      <div className="mt-6 flex items-center justify-between gap-3"><button disabled={page === 1 || loading} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPage(value => value - 1)}>Previous notifications</button><span className="text-sm">Page {page}</span><button disabled={!hasMore || loading || !!error} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPage(value => value + 1)}>Next notifications</button></div>
    </>}
  </WorkspaceShell>;
}
