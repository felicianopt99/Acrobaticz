"use client";

import { Notification } from '@/types';
import { Bell, AlertTriangle, Calendar, Wrench, Package, CheckCircle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const getIcon = (type: string) => {
    const iconProps = 'h-5 w-5';
    switch (type) {
      case 'event_reminder':
        return <Calendar className={iconProps} />;
      case 'conflict_alert':
        return <AlertTriangle className={iconProps} />;
      case 'maintenance_due':
        return <Wrench className={iconProps} />;
      case 'low_stock':
        return <Package className={iconProps} />;
      case 'success':
        return <CheckCircle className={iconProps} />;
      default:
        return <Bell className={iconProps} />;
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

  const getIconBgColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'low':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onMarkAsRead(notification.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer group overflow-hidden ${
        notification.isRead
          ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-800/30'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      }`}
    >
      {/* Unread indicator bar */}
      {!notification.isRead && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-400"
          layoutId={`unread-${notification.id}`}
        />
      )}

      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div
          className={`p-2.5 rounded-lg flex-shrink-0 transition-transform group-hover:scale-110 ${getIconBgColor(
            notification.priority
          )}`}
        >
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className={`text-sm font-semibold truncate ${
              notification.isRead
                ? 'text-gray-700 dark:text-gray-400'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {notification.title}
            </p>
            <Badge
              variant={getPriorityColor(notification.priority)}
              className="text-xs flex-shrink-0 animate-pulse-subtle"
            >
              {notification.priority}
            </Badge>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {notification.message}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="h-8 w-8 p-0 hover:bg-blue-200 dark:hover:bg-blue-900/40"
              title="Mark as read"
            >
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 hover:bg-red-200 dark:hover:bg-red-900/40"
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </div>

      {/* Optional action link */}
      {notification.actionUrl && (
        <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <a
            href={notification.actionUrl}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
            onClick={e => e.stopPropagation()}
          >
            View details →
          </a>
        </div>
      )}
    </motion.div>
  );
}
