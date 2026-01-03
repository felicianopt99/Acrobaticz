'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  RefreshCw,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/utils';

interface Backup {
  id: string;
  filename: string;
  size: number;
  sizeGB: string;
  createdAt: string;
  path: string;
}

interface JobHistory {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  fileSize: string;
  error: string;
}

interface BackupResponse {
  backups: Backup[];
  jobHistory: JobHistory[];
  retentionDays: number;
  totalBackups: number;
  totalSize: string;
}

export default function CloudBackupManagement() {
  const { toast } = useToast();
  const [data, setData] = useState<BackupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cloud/backups');
      if (!res.ok) throw new Error('Failed to fetch backups');
      const data = await res.json();
      setData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load backups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/cloud/backups', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to create backup');

      toast({
        title: 'Success',
        description: 'Backup created successfully',
      });

      loadBackups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
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

  if (!data) {
    return <div>Failed to load backup data</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.totalBackups}
              </p>
            </div>
            <Database className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {parseFloat(data.totalSize).toFixed(2)} GB
              </p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Retention</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.retentionDays} days
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Schedule</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Daily</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Backup List */}
      <Card className="p-6 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Backups</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadBackups}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleCreateBackup}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {creating ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.backups.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
              No backups found
            </p>
          ) : (
            data.backups.map((backup) => (
              <div
                key={backup.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Database className="h-5 w-5 text-blue-500" />
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {backup.filename}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {backup.sizeGB} GB • {new Date(backup.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Job History */}
      <Card className="p-6 bg-white dark:bg-slate-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Backup Job History
        </h2>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.jobHistory.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
              No job history
            </p>
          ) : (
            data.jobHistory.map((job) => (
              <div
                key={job.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {job.status}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {job.startedAt && new Date(job.startedAt).toLocaleString()}
                      {job.duration && ` • ${job.duration}s`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {job.fileSize && (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {(parseInt(job.fileSize) / 1024 / 1024 / 1024).toFixed(2)} GB
                    </p>
                  )}
                  {job.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 max-w-xs text-right">
                      {job.error.substring(0, 50)}...
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-medium mb-1">Backup Information</p>
            <ul className="space-y-1 text-xs">
              <li>• Backups run automatically every day at 2:00 AM</li>
              <li>• Only the last {data.retentionDays} days of backups are kept</li>
              <li>• Total size: {parseFloat(data.totalSize).toFixed(2)} GB</li>
              <li>• Storage location: /mnt/server_data/backups/daily/</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
