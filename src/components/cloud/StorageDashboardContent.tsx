'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ToggleLeft,
  Database,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/utils';

interface DiskHealth {
  isAccessible: boolean;
  available: string | number;
  total: string | number;
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
        // Convert string values to numbers
        setHealth({
          ...data,
          available: typeof data.available === 'string' ? BigInt(data.available) : data.available,
          total: typeof data.total === 'string' ? BigInt(data.total) : data.total,
        });
      } else {
        console.error('Health API failed:', healthRes.status);
        throw new Error('Failed to fetch health');
      }

      if (quotasRes.ok) {
        const data = await quotasRes.json();
        console.log('Quotas data:', data);
        setQuotas(data.users || []);
      } else {
        console.error('Quotas API failed:', quotasRes.status, await quotasRes.text());
        throw new Error('Failed to fetch quotas');
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
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

  const formatBytesValue = (value: string | number | bigint): string => {
    const numValue = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? parseInt(value, 10) : value;
    return formatBytes(numValue);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
        </div>
        <span className="ml-2">Loading storage data...</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-200">
          Failed to load storage information. Please refresh and try again.
        </p>
      </div>
    );
  }

  const usedBytes = health && typeof health.total === 'bigint' && typeof health.available === 'bigint'
    ? Number(health.total - health.available)
    : (typeof health?.total === 'number' && typeof health?.available === 'number' 
        ? health.total - health.available 
        : 0);
  const status = health.isAccessible ? 'healthy' : 'error';
  const isCritical = health.usedPercent > 90;
  const isWarning = health.usedPercent > 70;
  const activeUsers = quotas.filter((q) => q.isActive).length;
  const cloudEnabledUsers = quotas.filter((q) => q.cloudEnabled).length;
  const criticalUsers = quotas.filter((q) => q.percentUsed >= 95).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Storage Dashboard</h1>
        <p className="text-muted-foreground">
          {health.isAccessible 
            ? 'Monitor your cloud storage usage and manage user quotas'
            : 'System is experiencing storage access issues'
          }
        </p>
      </div>

      {/* Status Alerts */}
      {!health.isAccessible && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Storage device is not accessible!
          </p>
        </div>
      )}

      {isCritical && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Storage critically full! Disk usage exceeds 90%
          </p>
        </div>
      )}

      {isWarning && !isCritical && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200 font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Storage usage is high. Consider archiving old files.
          </p>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disk Usage</p>
                <p className="text-2xl font-bold">
                  {Math.round(health.usedPercent)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <HardDrive className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">
                  {formatBytesValue(health.available)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cloud Users</p>
                <p className="text-2xl font-bold">
                  {cloudEnabledUsers}/{activeUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical Users</p>
                <p className="text-2xl font-bold">
                  {criticalUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Storage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            System Storage
          </CardTitle>
          <CardDescription>
            Disk capacity and usage information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Total Disk Usage
              </span>
              <span className="text-lg font-bold">
                {Math.round(health.usedPercent)}%
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(health.usedPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-lg border border-secondary">
              <p className="text-sm text-muted-foreground mb-2">
                Total Capacity
              </p>
              <p className="text-2xl font-bold">
                {formatBytesValue(health.total)}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-secondary">
              <p className="text-sm text-muted-foreground mb-2">
                Used
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatBytes(usedBytes)}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-secondary">
              <p className="text-sm text-muted-foreground mb-2">
                Available
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatBytesValue(health.available)}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Last checked: {new Date(health.lastCheck).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* User Storage Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              User Storage Management
            </CardTitle>
            <CardDescription>
              Manage storage quotas and cloud access for users
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quotas.filter((q) => q.isActive).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active users found</p>
            </div>
          ) : (
            quotas.filter((q) => q.isActive).map((quota) => {
              const isEditing = editingUser?.userId === quota.userId;

              return (
                <div
                  key={quota.userId}
                  className="p-4 border border-secondary rounded-lg hover:bg-secondary/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
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
                      <p className="text-sm text-muted-foreground">
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
                        <ToggleLeft className="h-4 w-4" />
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
                        <span className="text-muted-foreground">
                          {formatBytes(parseInt(quota.usedBytes))} / {formatBytes(parseInt(quota.quotaBytes))}
                        </span>
                        <span className={`font-semibold ${quota.percentUsed >= 95 ? 'text-red-600' : quota.percentUsed >= 80 ? 'text-orange-600' : 'text-green-600'}`}>
                          {quota.percentUsed}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getQuotaStatus(quota.percentUsed).color}`}
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
            })
          )}
        </CardContent>
      </Card>

      {/* Quota History Modal */}
      {showHistory && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                    <History className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  Quota Change History
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes recorded</p>
              ) : (
                historyData.map((change) => (
                  <div
                    key={change.id}
                    className="p-3 bg-secondary rounded-lg text-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">
                        {new Date(change.changedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        by Admin
                      </span>
                    </div>
                    <p className="text-foreground">
                      {formatBytes(parseInt(change.oldQuotaBytes))} →{' '}
                      {formatBytes(parseInt(change.newQuotaBytes))}
                    </p>
                    {change.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {change.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
