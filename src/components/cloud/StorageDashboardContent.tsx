'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  HardDrive, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Users,
  Save,
  Eye,
  Toggle2,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/utils';

interface DiskHealth {
  isAccessible: boolean;
  available: number;
  total: number;
  usedPercent: number;
  lastCheck: string;
}

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
  cloudEnabled: boolean;
  roleDefaultQuotaBytes?: string;
  lastUpdated: string;
}

interface EditingQuota {
  userId: string;
  newQuotaBytes: string;
  reason: string;
}

export default function StorageDashboardContent({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [health, setHealth] = useState<DiskHealth | null>(null);
  const [quotas, setQuotas] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingQuota | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [healthRes, quotasRes] = await Promise.all([
        fetch('/api/cloud/health'),
        fetch('/api/admin/cloud/quotas'),
      ]);

      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      } else {
        throw new Error('Failed to fetch health');
      }

      if (quotasRes.ok) {
        const data = await quotasRes.json();
        setQuotas(data.users);
      } else {
        throw new Error('Failed to fetch quotas');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load storage data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quota',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCloudAccess = async (user: UserQuota) => {
    try {
      const res = await fetch('/api/admin/cloud/quotas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          cloudEnabled: !user.cloudEnabled,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle cloud access');

      toast({
        title: 'Success',
        description: `Cloud access ${!user.cloudEnabled ? 'enabled' : 'disabled'} for ${user.name}`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle cloud access',
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

  if (loading || !health) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin">
              <div className="h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const usedBytes = health.total - health.available;
  const status = health.isAccessible ? 'healthy' : 'error';
  const isCritical = health.usedPercent > 90;
  const isWarning = health.usedPercent > 70;
  const activeUsers = quotas.filter((q) => q.isActive).length;
  const cloudEnabledUsers = quotas.filter((q) => q.cloudEnabled).length;
  const criticalUsers = quotas.filter((q) => q.percentUsed >= 95).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* System Status Header */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-0 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {status === 'healthy' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Storage Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  System is {status === 'healthy' ? 'operational' : 'experiencing issues'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {!health.isAccessible && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                ⚠️ Storage device is not accessible!
              </p>
            </div>
          )}

          {isCritical && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                🚨 Storage critically full! Disk usage exceeds 90%
              </p>
            </div>
          )}

          {isWarning && !isCritical && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200 font-semibold">
                ⚠️ Storage usage is high. Consider archiving old files.
              </p>
            </div>
          )}
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-800 border-0 shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Disk Usage
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(health.usedPercent)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-800 border-0 shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Available
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatBytes(health.available)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-800 border-0 shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Cloud Users
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {cloudEnabledUsers}/{activeUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-800 border-0 shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Critical Users
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {criticalUsers}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Disk Health Breakdown */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-0 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            System Storage
          </h3>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Disk Usage
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(health.usedPercent)}%
              </span>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(health.usedPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Capacity
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatBytes(health.total)}
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Used
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatBytes(usedBytes)}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Available
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatBytes(health.available)}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
            Last checked: {new Date(health.lastCheck).toLocaleString()}
          </p>
        </Card>

        {/* User Storage Quotas */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Storage Management</h2>
            <Button size="sm" variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {quotas.filter((q) => q.isActive).map((quota) => {
              const { color } = getQuotaStatus(quota.percentUsed);
              const isEditing = editingUser?.userId === quota.userId;

              return (
                <div
                  key={quota.userId}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {quota.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          quota.cloudEnabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {quota.cloudEnabled ? '✓ Cloud Enabled' : 'Cloud Disabled'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {quota.role} • {quota.fileCount} files • {quota.folderCount} folders
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={quota.cloudEnabled ? 'default' : 'outline'}
                        onClick={() => handleToggleCloudAccess(quota)}
                        className="h-8 px-3 flex items-center gap-2"
                      >
                        <Toggle2 className="h-4 w-4" />
                        {quota.cloudEnabled ? 'Enabled' : 'Disabled'}
                      </Button>
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
                        Edit Size
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
                      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${color}`}
                          style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
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

        {/* Quota History Modal */}
        {showHistory && (
          <Card className="p-6 bg-white dark:bg-slate-800 border-0 shadow-lg">
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

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyData.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No changes recorded</p>
              ) : (
                historyData.map((change) => (
                  <div
                    key={change.id}
                    className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(change.changedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        by Admin
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
    </div>
  );
}
