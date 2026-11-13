'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: 'booking' | 'social' | 'tournament' | 'system';
  message: string;
  createdAt: string;
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
  bookingUpdates: BookingUpdate[];
  newPosts: NewPost[];
  markAllRead: () => void;
  clearBookingUpdates: () => void;
  clearNewPosts: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  notifications: [],
  unreadCount: 0,
  bookingUpdates: [],
  newPosts: [],
  markAllRead: () => {},
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
  const [bookingUpdates, setBookingUpdates] = useState<BookingUpdate[]>([]);
  const [newPosts, setNewPosts] = useState<NewPost[]>([]);

  useEffect(() => {
    // Never retain one account's realtime data when the session changes.
    setSocket(null);
    setNotifications([]);
    setUnreadCount(0);
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

    // ── Real-time notification ──────────────────────────────────────────────
    newSocket.on('notification', (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // cap at 50
      setUnreadCount((c) => c + 1);
    });

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
      newSocket.disconnect();
    };
  }, [userId, token]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

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
