'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Upload, Download, Trash2, Edit, Share2, MoreVertical, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  fileId: string;
  fileName: string;
  action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'RENAME' | 'SHARE';
  timestamp: string;
  details?: string;
}

export function ActivityLog() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      const res = await fetch('/api/cloud/activity');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <Upload className="h-4 w-4 text-green-600" />;
      case 'DOWNLOAD':
        return <Download className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'RENAME':
        return <Edit className="h-4 w-4 text-orange-600" />;
      case 'SHARE':
        return <Share2 className="h-4 w-4 text-amber-600" />;
      default:
        return <MoreVertical className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      UPLOAD: 'Uploaded',
      DOWNLOAD: 'Downloaded',
      DELETE: 'Deleted',
      RENAME: 'Renamed',
      SHARE: 'Shared',
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500 text-sm">
          No recent activity
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-center gap-3 p-3 ${
              index !== activities.length - 1 ? 'border-b' : ''
            } hover:bg-gray-50 dark:hover:bg-slate-700/50`}
          >
            <div className="flex-shrink-0">
              {getActionIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getActionLabel(activity.action)} {activity.fileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
