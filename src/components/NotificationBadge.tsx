'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBadge() {
  const { unreadCount, notifications } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check if there are any critical notifications
  const hasCritical = notifications.some((n) => n.priority === 'critical' && !n.isRead);

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDropdownOpen ? 'bg-gray-100' : 'hover:bg-gray-100'
        }`}
        aria-label="Notifications"
      >
        <Bell className={`w-6 h-6 ${hasCritical ? 'text-red-500' : 'text-gray-600'}`} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className={`absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full ${
            hasCritical ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
    </div>
  );
}
