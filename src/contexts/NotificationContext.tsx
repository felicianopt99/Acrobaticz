'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  groupKey?: string;
  createdAt: string;
}

interface NotificationPreferences {
  userId: string;
  conflictAlerts: boolean;
  statusChanges: boolean;
  eventReminders: boolean;
  overdueAlerts: boolean;
  criticalAlerts: boolean;
  stockAlerts: boolean;
  equipmentAvailable: boolean;
  monthlySummary: boolean;
  toastCritical: boolean;
  toastHigh: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  socket: Socket | null;
  fetchNotifications: (params?: { limit?: number; offset?: number; unreadOnly?: boolean; type?: string }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsReadBatch: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteNotificationsBatch: (notificationIds: string[]) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  getNotificationsByType: (type: string) => Notification[];
  getNotificationsByPriority: (priority: string) => Notification[];
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (params?: { limit?: number; offset?: number; unreadOnly?: boolean; type?: string }) => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams();
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.offset) query.append('offset', params.offset.toString());
        if (params?.unreadOnly) query.append('unreadOnly', 'true');
        if (params?.type) query.append('type', params.type);

        const response = await fetch(`/api/notifications?${query.toString()}`);
        
        if (!response.ok) {
          // If unauthorized (401), just set empty state
          if (response.status === 401) {
            setNotifications([]);
            setUnreadCount(0);
            return;
          }
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark multiple notifications as read
  const markAsReadBatch = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds,
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (notificationIds.includes(n.id) ? { ...n, isRead: true } : n))
        );
        const count = notificationIds.filter((id) => !notifications.find((n) => n.id === id && n.isRead)).length;
        setUnreadCount((prev) => Math.max(0, prev - count));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [notifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Delete batch of notifications
  const deleteNotificationsBatch = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationIds,
        }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => !notificationIds.includes(n.id)));
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-all' }),
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback(
    (type: string) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  // Get notifications by priority
  const getNotificationsByPriority = useCallback(
    (priority: string) => {
      return notifications.filter((n) => n.priority === priority);
    },
    [notifications]
  );

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) {
        // If unauthorized, just set default preferences
        if (response.status === 401) {
          setPreferences({
            userId: '',
            conflictAlerts: true,
            statusChanges: true,
            eventReminders: true,
            overdueAlerts: true,
            criticalAlerts: true,
            stockAlerts: true,
            equipmentAvailable: true,
            monthlySummary: true,
            toastCritical: true,
            toastHigh: true,
          });
          return;
        }
        throw new Error('Failed to fetch preferences');
      }
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || window.location.origin, {
      path: '/api/socket',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('Notification socket connected');
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on('disconnect', () => {
      console.log('Notification socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial notifications and preferences
  useEffect(() => {
    fetchNotifications({ limit: 50 });
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    socket,
    fetchNotifications,
    markAsRead,
    markAsReadBatch,
    markAllAsRead,
    deleteNotification,
    deleteNotificationsBatch,
    deleteAllNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    fetchPreferences,
    updatePreferences,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
