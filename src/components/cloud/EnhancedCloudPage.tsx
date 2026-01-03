'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/card';
import { FolderPlus, Upload, Cloud, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { StorageQuotaDisplay } from '@/components/cloud/StorageQuotaDisplay';
import { ActivityLog } from '@/components/cloud/ActivityLog';
import CloudPageContent from '@/components/cloud/CloudPageContent';

interface EnhancedCloudPageProps {
  userId: string;
}

export default function EnhancedCloudPage({ userId }: EnhancedCloudPageProps) {
  const { toast } = useToast();
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      try {
        const formData = new FormData();
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });

        const res = await fetch('/api/cloud/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Upload failed');
        }

        toast({
          title: 'Success',
          description: `${files.length} file(s) uploaded successfully`,
        });

        // Reload content
        window.location.reload();
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Upload failed',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      const res = await fetch('/api/cloud/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName }),
      });

      if (!res.ok) throw new Error('Failed to create folder');

      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });

      setFolderName('');
      setShowNewFolderInput(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <AppHeader title="Cloud Storage">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </AppHeader>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8 p-4 md:p-8 max-w-7xl mx-auto">
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Quick Actions */}
            <Card className="p-4 bg-white dark:bg-slate-800 border-0 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={handleUploadClick}
                  className="w-full justify-start flex gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                  className="w-full justify-start flex gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  New Folder
                </Button>
              </div>

              {showNewFolderInput && (
                <motion.div
                  className="mt-4 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Input
                    placeholder="Folder name..."
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCreateFolder} size="sm" className="flex-1">
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShowNewFolderInput(false);
                        setFolderName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>

            {/* Storage Quota */}
            <StorageQuotaDisplay userId={userId} />

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 px-1">
                Recent Activity
              </h3>
              <ActivityLog />
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CloudPageContent userId={userId} />
          </motion.div>
        </div>
      </div>
    </>
  );
}
