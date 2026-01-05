'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, X, Check, Trash2 } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const recentNotifications = notifications.slice(0, 10);

  if (!isOpen) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-opacity-70 transition cursor-pointer`}
                onClick={() => {
                  if (!notification.isRead) markAsRead(notification.id);
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="ml-2 p-1 hover:bg-gray-300 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3 flex gap-2">
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark All Read
          </button>
        )}
        <a
          href="/notifications"
          onClick={onClose}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
        >
          View All
        </a>
      </div>
    </div>
  );
}
