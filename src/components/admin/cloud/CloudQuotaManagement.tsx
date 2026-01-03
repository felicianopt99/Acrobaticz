'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HardDrive,
  Users,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Save,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/utils';

interface UserQuota {
  userId: string;
  name: string;
  role: string;
  isActive: boolean;
  usedBytes: string;
  quotaBytes: string;
  percentUsed: number;
  fileCount: number;
  folderCount: number;
  roleDefaultQuotaBytes?: string;
  lastUpdated: string;
}

interface EditingQuota {
  userId: string;
  newQuotaBytes: string;
  reason: string;
}

export default function CloudQuotaManagement() {
  const { toast } = useToast();
  const [quotas, setQuotas] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingQuota | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    loadQuotas();
  }, []);

  const loadQuotas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cloud/quotas');
      if (!res.ok) throw new Error('Failed to fetch quotas');
      const data = await res.json();
      setQuotas(data.users);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quotas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuota = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch('/api/admin/cloud/quotas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.userId,
          newQuotaBytes: BigInt(editingUser.newQuotaBytes),
          reason: editingUser.reason || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update quota');

      toast({
        title: 'Success',
        description: 'Quota updated successfully',
      });

      setEditingUser(null);
      loadQuotas();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quota',
        variant: 'destructive',
      });
    }
  };

  const handleViewHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/cloud/quotas/${userId}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistoryData(data.changes);
      setShowHistory(userId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quota history',
        variant: 'destructive',
      });
    }
  };

  const getQuotaStatus = (percentUsed: number) => {
    if (percentUsed >= 95) return { status: 'critical', color: 'bg-red-500' };
    if (percentUsed >= 80) return { status: 'warning', color: 'bg-orange-500' };
    return { status: 'ok', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {quotas.filter((q) => q.isActive).length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users Over 80%</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {quotas.filter((q) => q.percentUsed >= 80).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical (95%+)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {quotas.filter((q) => q.percentUsed >= 95).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Storage Quotas</h2>
          <Button size="sm" variant="outline" onClick={loadQuotas}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {quotas.map((quota) => {
            const { color } = getQuotaStatus(quota.percentUsed);
            const isEditing = editingUser?.userId === quota.userId;

            return (
              <div
                key={quota.userId}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {quota.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quota.role} • {quota.fileCount} files • {quota.folderCount} folders
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewHistory(quota.userId)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingUser({
                          userId: quota.userId,
                          newQuotaBytes: quota.quotaBytes,
                          reason: '',
                        })
                      }
                      className="h-8"
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatBytes(parseInt(quota.usedBytes))} / {formatBytes(parseInt(quota.quotaBytes))}
                      </span>
                      <span className={`font-semibold ${quota.percentUsed >= 95 ? 'text-red-600' : quota.percentUsed >= 80 ? 'text-orange-600' : 'text-green-600'}`}>
                        {quota.percentUsed}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${color}`}
                        style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Quota (GB):
                      </label>
                      <Input
                        type="number"
                        value={parseInt(editingUser.newQuotaBytes) / 1024 / 1024 / 1024}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            newQuotaBytes: String(
                              BigInt(parseInt(e.target.value) * 1024 * 1024 * 1024)
                            ),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason (optional):
                      </label>
                      <Input
                        type="text"
                        placeholder="Why this change?"
                        value={editingUser.reason}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            reason: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveQuota}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {showHistory && (
        <Card className="p-6 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Quota Change History
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(null)}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {historyData.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No changes recorded</p>
            ) : (
              historyData.map((change) => (
                <div
                  key={change.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(change.changedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      by {change.changedBy}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {formatBytes(parseInt(change.oldQuotaBytes))} →{' '}
                    {formatBytes(parseInt(change.newQuotaBytes))}
                  </p>
                  {change.reason && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Reason: {change.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
