'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface Toast {
  id: string;
  notification: any;
  timestamp: number;
}

export function NotificationToasts() {
  const { notifications, preferences } = useNotifications();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Watch for new critical/high priority notifications
    const latestNotification = notifications[0];

    if (latestNotification && !latestNotification.isRead) {
      const shouldShowToast =
        (latestNotification.priority === 'critical' && preferences?.toastCritical) ||
        (latestNotification.priority === 'high' && preferences?.toastHigh);

      if (shouldShowToast) {
        const toast: Toast = {
          id: latestNotification.id,
          notification: latestNotification,
          timestamp: Date.now(),
        };

        setToasts((prev) => [toast, ...prev]);

        // Auto-remove after 8 seconds
        const timeout = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 8000);

        return () => clearTimeout(timeout);
      }
    }
  }, [notifications, preferences]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-96 p-4 rounded-lg shadow-lg border-l-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 ${
            toast.notification.priority === 'critical'
              ? 'bg-red-50 border-l-red-500'
              : 'bg-orange-50 border-l-orange-500'
          }`}
        >
          {toast.notification.priority === 'critical' ? (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {toast.notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {toast.notification.message}
            </p>

            {toast.notification.actionUrl && (
              <a
                href={toast.notification.actionUrl}
                className="inline-block mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                View Details →
              </a>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
