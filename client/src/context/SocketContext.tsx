'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { loadNotifications, markAllNotificationsRead } from '../lib/trainingApi';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: 'booking' | 'social' | 'tournament' | 'system';
  message: string;
  createdAt: string;
  read?: boolean;
  link?: string;
}

export interface BookingUpdate {
  type: 'new_booking' | 'status_changed';
  booking: Record<string, unknown>;
}

export interface NewPost {
  _id: string;
  authorId: Record<string, unknown>;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  likes: string[];
  commentsCount: number;
  createdAt: string;
}

interface SocketContextProps {
  socket: Socket | null;
  notifications: NotificationItem[];
  unreadCount: number;
  notificationError: string;
  bookingUpdates: BookingUpdate[];
  newPosts: NewPost[];
  markAllRead: () => Promise<void>;
  clearBookingUpdates: () => void;
  clearNewPosts: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  notifications: [],
  unreadCount: 0,
  notificationError: '',
  bookingUpdates: [],
  newPosts: [],
  markAllRead: async () => {},
  clearBookingUpdates: () => {},
  clearNewPosts: () => {},
});

export const useSocket = () => useContext(SocketContext);

// ── Provider ──────────────────────────────────────────────────────────────────

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuthStore();
  const userId = user?.id;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');
  const [bookingUpdates, setBookingUpdates] = useState<BookingUpdate[]>([]);
  const [newPosts, setNewPosts] = useState<NewPost[]>([]);

  useEffect(() => {
    // Never retain one account's realtime data when the session changes.
    setSocket(null);
    setNotifications([]);
    setUnreadCount(0);
    setNotificationError('');
    setBookingUpdates([]);
    setNewPosts([]);
    if (!userId || !token) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      // Re-read the current JWT for each reconnect. The server derives identity.
      auth: (callback) => callback({ token: useAuthStore.getState().token }),
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket.io connection error:', err.message);
    });

    // Socket events are refresh hints. The database owns inbox contents/counts,
    // including events received while this browser was disconnected.
    let notificationRequest: AbortController | undefined;
    const refreshNotifications = () => {
      notificationRequest?.abort();
      const controller = new AbortController(); notificationRequest = controller;
      loadNotifications(token, 1, false, controller.signal).then(result => {
        if (controller.signal.aborted) return;
        setNotifications(result.notifications.map(item => ({ ...item, id: item._id })));
        setUnreadCount(result.unreadCount); setNotificationError('');
      }).catch(error => {
        if (!controller.signal.aborted) setNotificationError(error instanceof Error ? error.message : 'Notification records are unavailable');
      });
    };
    refreshNotifications();
    newSocket.on('notification', refreshNotifications);
    newSocket.on('connect', refreshNotifications);
    window.addEventListener('focus', refreshNotifications);
    window.addEventListener('athlix:notifications-updated', refreshNotifications);

    // ── Booking accepted / rejected / completed ────────────────────────────
    newSocket.on('booking_update', (update: BookingUpdate) => {
      setBookingUpdates((prev) => [update, ...prev].slice(0, 50));
    });

    // ── New community post broadcast ───────────────────────────────────────
    newSocket.on('new_post', (post: NewPost) => {
      setNewPosts((prev) => [post, ...prev].slice(0, 50));
    });

    setSocket(newSocket);

    return () => {
      notificationRequest?.abort();
      window.removeEventListener('focus', refreshNotifications);
      window.removeEventListener('athlix:notifications-updated', refreshNotifications);
      newSocket.disconnect();
    };
  }, [userId, token]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try { await markAllNotificationsRead(token); }
    catch (error) { setNotificationError(error instanceof Error ? error.message : 'Unable to update notifications'); throw error; }
  }, [token]);

  const clearBookingUpdates = useCallback(() => {
    setBookingUpdates([]);
  }, []);

  const clearNewPosts = useCallback(() => {
    setNewPosts([]);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        notificationError,
        bookingUpdates,
        newPosts,
        markAllRead,
        clearBookingUpdates,
        clearNewPosts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
