'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Save, AlertCircle } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { preferences, updatePreferences, fetchPreferences } = useNotifications();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (preferences) {
      setFormData(preferences as any);
    }
  }, [preferences]);

  const handleToggle = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(formData);
      setIsDirty(false);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (preferences) {
      setFormData(preferences as any);
      setIsDirty(false);
    }
  };

  const notificationGroups = [
    {
      title: 'Event Alerts',
      description: 'Notifications related to events and timelines',
      settings: [
        {
          key: 'eventReminders',
          label: 'Event Timeline Reminders',
          description: 'Get notified 3 days, 1 day, and 3 hours before events start',
        },
        {
          key: 'criticalAlerts',
          label: 'Critical Event Alerts',
          description: 'Urgent notifications when events are starting within 3 hours',
        },
      ],
    },
    {
      title: 'Equipment & Rental Alerts',
      description: 'Notifications related to equipment and rental management',
      settings: [
        {
          key: 'conflictAlerts',
          label: 'Equipment Conflict Alerts',
          description: 'Notify when equipment is double-booked on overlapping dates',
        },
        {
          key: 'statusChanges',
          label: 'Rental Status Changes',
          description: 'Get notified when rental prep status changes',
        },
        {
          key: 'equipmentAvailable',
          label: 'Equipment Back in Service',
          description: 'Notification when equipment returns from maintenance',
        },
        {
          key: 'stockAlerts',
          label: 'Low Stock Alerts',
          description: 'Get notified when consumable inventory runs low',
        },
      ],
    },
    {
      title: 'Return & Billing Alerts',
      description: 'Notifications related to overdue items and payments',
      settings: [
        {
          key: 'overdueAlerts',
          label: 'Overdue Return Alerts',
          description: 'Notifications when equipment is not returned on time',
        },
        {
          key: 'monthlySummary',
          label: 'Monthly Revenue Summary',
          description: 'Get monthly revenue reports on the 1st of each month',
        },
      ],
    },
    {
      title: 'Toast Notification Preferences',
      description: 'Control which alerts appear as pop-up toasts',
      settings: [
        {
          key: 'toastCritical',
          label: 'Show Toast for Critical Alerts',
          description: 'Display critical priority notifications as pop-up alerts',
        },
        {
          key: 'toastHigh',
          label: 'Show Toast for High Priority',
          description: 'Display high priority notifications as pop-up alerts',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
          <p className="text-gray-600">Customize which notifications you receive and how they're displayed</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Settings Groups */}
        <div className="space-y-6">
          {notificationGroups.map((group) => (
            <div key={group.title} className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              </div>

              <div className="space-y-4">
                {group.settings.map((setting) => (
                  <label
                    key={setting.key}
                    className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={formData[setting.key as keyof typeof formData]}
                      onChange={() => handleToggle(setting.key)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 mt-0.5 flex-shrink-0 cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{setting.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-end">
          <button
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Notification History</p>
            <p className="text-sm text-blue-800 mt-1">
              Your notification history is automatically cleaned up after 30 days for read notifications and 60 days for unread ones.
              Monthly revenue summaries are kept for 1 year.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
