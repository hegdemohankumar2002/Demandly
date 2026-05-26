'use client';

import { create } from 'zustand';
import type { Notification } from '@/types';
import { API_URL } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (token: string) => Promise<void>;
  fetchUnreadCount: (token: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string, token?: string) => void;
  markAllAsRead: (token?: string) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (token: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data,
          unreadCount: data.filter((n: Notification) => !n.read).length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { count } = await res.json();
        set({ unreadCount: count });
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: async (id, token) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    });
    // Persist to backend
    if (token) {
      fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  },

  markAllAsRead: async (token) => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    // Persist to backend
    if (token) {
      fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  },

  removeNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),
}));
