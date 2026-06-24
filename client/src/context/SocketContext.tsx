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
  booking: Record<string, any>;
}

export interface NewPost {
  _id: string;
  authorId: Record<string, any>;
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
  const { user } = useAuthStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bookingUpdates, setBookingUpdates] = useState<BookingUpdate[]>([]);
  const [newPosts, setNewPosts] = useState<NewPost[]>([]);

  useEffect(() => {
    // Disconnect if user logs out
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      setBookingUpdates([]);
      setNewPosts([]);
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      // Send ATHLIX JWT in auth handshake so server can optionally verify
      auth: { token: useAuthStore.getState().token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.io connected:', newSocket.id);
      // Join personal user room — server emits notifications to this room
      newSocket.emit('join_user_room', user.id);
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
      setBookingUpdates((prev) => [update, ...prev]);
    });

    // ── New community post broadcast ───────────────────────────────────────
    newSocket.on('new_post', (post: NewPost) => {
      setNewPosts((prev) => [post, ...prev]);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
