'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { HardDrive, AlertCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface StorageQuotaDisplayProps {
  userId: string;
}

export function StorageQuotaDisplay({ userId }: StorageQuotaDisplayProps) {
  const [quota, setQuota] = useState<{ usedBytes: number; quotaBytes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const res = await fetch('/api/cloud/storage');
        if (res.ok) {
          const data = await res.json();
          setQuota(data);
        }
      } catch (error) {
        console.error('Failed to fetch storage quota:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuota();
  }, []);

  if (loading || !quota) return null;

  const percentUsed = (quota.usedBytes / quota.quotaBytes) * 100;
  const isNearFull = percentUsed > 80;
  const isFull = percentUsed >= 100;

  return (
    <Card className="p-4 bg-white dark:bg-slate-800 border-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Storage</h3>
        </div>
        {isNearFull && (
          <AlertCircle className={`h-5 w-5 ${isFull ? 'text-red-500' : 'text-orange-500'}`} />
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isFull ? 'bg-red-500' : isNearFull ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Storage text */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {formatBytes(quota.usedBytes)} of {formatBytes(quota.quotaBytes)}
        </span>
        <span className={`font-semibold ${
          isFull ? 'text-red-600' : isNearFull ? 'text-orange-600' : 'text-gray-600'
        }`}>
          {Math.round(percentUsed)}%
        </span>
      </div>

      {isFull && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          Storage full. Delete some files to continue.
        </p>
      )}

      {isNearFull && !isFull && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
          Storage nearly full. Consider deleting old files.
        </p>
      )}
    </Card>
  );
}
