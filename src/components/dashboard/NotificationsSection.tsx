"use client";

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, Wrench, Package, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/contexts/AppContext';
import { useTranslate } from '@/contexts/TranslationContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Notification } from '@/types';

export function NotificationsSection({ noCard = false }: { noCard?: boolean }) {
  const { currentUser } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);

  // Translation hooks
  const { translated: notificationsText } = useTranslate('Notifications');
  const { translated: loadingText } = useTranslate('Loading...');
  const { translated: noNotificationsText } = useTranslate('No notifications');
  const { translated: noUnreadNotificationsText } = useTranslate('No unread notifications');
  const { translated: hideReadText } = useTranslate('Hide Read');
  const { translated: showAllText } = useTranslate('Show All');
  const { translated: markAllReadText } = useTranslate('Mark all read');
  const { translated: markReadText } = useTranslate('Mark read');

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?limit=20&unreadOnly=false`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds,
          userId: currentUser?.id,
        }),
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Delete this notification? It will only delete today\'s notifications.')) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationIds: [notificationId],
          userId: currentUser?.id,
        }),
      });

      if (response.ok) {
        // Update local state - remove the deleted notification
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    await markAsRead(unreadIds);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'conflict_alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance_due':
        return <Wrench className="h-4 w-4" />;
      case 'low_stock':
        return <Package className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    const loadingContent = (
      <>
        <div className="flex items-center p-6 pb-2">
          <h3 className="text-sm font-medium flex items-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <Bell className="mr-2 h-4 w-4" />
            </motion.div>
            {notificationsText}
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
              />
            ))}
          </div>
        </div>
      </>
    );
    return noCard ? loadingContent : (
      <Card className="shadow-lg">
        {loadingContent}
      </Card>
    );
  }

  const displayedNotifications = showRead ? notifications : notifications.filter(n => !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const content = (
    <>
      <div className="flex items-center justify-between p-6 pb-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
        <div>
          <h3 className="text-base font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <motion.div animate={{ rotate: unreadCount > 0 ? [0, 15, -15, 0] : 0 }} transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}>
              <Bell className="mr-2 h-5 w-5" />
            </motion.div>
            {notificationsText}
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Badge variant="destructive" className="ml-3 text-xs font-bold animate-pulse-subtle">
                  {unreadCount} unread
                </Badge>
              </motion.div>
            )}
          </h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              You have {unreadCount} notification{unreadCount !== 1 ? 's' : ''} waiting
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRead(!showRead)}
            className="text-xs hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            {showRead ? hideReadText : showAllText}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:bg-green-100 dark:hover:bg-green-900/20"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>
      <div className="p-6">
        {displayedNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {showRead ? noNotificationsText : noUnreadNotificationsText}
            </p>
          </motion.div>
        ) : (
          <ScrollArea className="h-96">
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 pr-4">
                {displayedNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={(id) => markAsRead([id])}
                      onDelete={deleteNotification}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead([notification.id]);
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </div>
    </>
  );

  return noCard ? content : (
    <Card className="shadow-lg">
      {content}
    </Card>
  );
}
