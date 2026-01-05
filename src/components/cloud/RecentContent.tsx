'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  File, 
  Image, 
  FileText, 
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  MoreVertical,
  Star,
  StarOff,
  Download,
  Trash2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | number;
  isStarred: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecentContentProps {
  userId: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return { icon: Image, color: 'text-red-400' };
  if (mimeType.startsWith('video/')) return { icon: FileVideo, color: 'text-orange-400' };
  if (mimeType.startsWith('audio/')) return { icon: FileAudio, color: 'text-orange-400' };
  if (mimeType.includes('pdf')) return { icon: FileText, color: 'text-red-500' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) 
    return { icon: FileSpreadsheet, color: 'text-green-500' };
  if (mimeType.includes('document') || mimeType.includes('word')) 
    return { icon: FileText, color: 'text-blue-500' };
  if (mimeType.includes('zip') || mimeType.includes('compressed')) 
    return { icon: FileArchive, color: 'text-yellow-500' };
  if (mimeType.includes('javascript') || mimeType.includes('json')) 
    return { icon: FileCode, color: 'text-cyan-400' };
  return { icon: File, color: 'text-gray-400' };
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export function RecentContent({ userId }: RecentContentProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/cloud/files?recent=true&limit=50');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recent files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    const handleRefresh = () => loadContent();
    const handleViewMode = (e: CustomEvent) => setViewMode(e.detail);

    window.addEventListener('cloud-refresh', handleRefresh);
    window.addEventListener('cloud-view-mode', handleViewMode as EventListener);

    return () => {
      window.removeEventListener('cloud-refresh', handleRefresh);
      window.removeEventListener('cloud-view-mode', handleViewMode as EventListener);
    };
  }, [loadContent]);

  const toggleStar = async (id: string, currentStarred: boolean) => {
    try {
      const res = await fetch(`/api/cloud/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !currentStarred }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, isStarred: !currentStarred } : f
      ));

      toast({
        title: currentStarred ? 'Removed from starred' : 'Added to starred',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update',
        variant: 'destructive',
      });
    }
  };

  const moveToTrash = async (id: string) => {
    try {
      const res = await fetch(`/api/cloud/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrashed: true }),
      });

      if (!res.ok) throw new Error('Failed to move to trash');

      toast({ title: 'Moved to trash' });
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move to trash',
        variant: 'destructive',
      });
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/cloud/files/${fileId}/download`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const isEmpty = files.length === 0;

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-400" />
          Recent
        </h1>
        <p className="text-gray-400 text-sm mt-1">Files you've recently accessed</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-gray-700 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Clock className="h-12 w-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No recent files</h2>
          <p className="text-gray-400 max-w-md">
            Files you access will appear here for quick access
          </p>
        </div>
      )}

      {!loading && !isEmpty && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              : "space-y-1"
          )}
        >
          {viewMode === 'grid' ? (
            files.map((file) => {
              const { icon: FileIcon, color } = getFileIcon(file.mimeType);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-4 cursor-pointer transition-all"
                  onClick={() => downloadFile(file.id, file.name)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <FileIcon className={cn("h-12 w-12", color)} />
                      {file.isStarred && (
                        <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <span className="text-sm text-white font-medium truncate w-full text-center">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(file.updatedAt || file.createdAt)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-white/10"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadFile(file.id, file.name); }}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStar(file.id, file.isStarred); }}>
                        {file.isStarred ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                        {file.isStarred ? 'Remove from starred' : 'Add to starred'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); moveToTrash(file.id); }}
                        className="text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Move to trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-white/10">
                <div className="col-span-5">Name</div>
                <div className="col-span-3 hidden md:block">Last accessed</div>
                <div className="col-span-2 hidden md:block">Size</div>
                <div className="col-span-2"></div>
              </div>

              {files.map((file) => {
                const { icon: FileIcon, color } = getFileIcon(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-white/5 cursor-pointer group"
                    onClick={() => downloadFile(file.id, file.name)}
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <FileIcon className={cn("h-5 w-5", color)} />
                      <span className="text-white truncate">{file.name}</span>
                      {file.isStarred && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <div className="col-span-3 text-gray-500 text-sm hidden md:block">
                      {formatRelativeTime(file.updatedAt || file.createdAt)}
                    </div>
                    <div className="col-span-2 text-gray-500 text-sm hidden md:block">
                      {formatBytes(Number(file.size))}
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); downloadFile(file.id, file.name); }}
                      >
                        <Download className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); toggleStar(file.id, file.isStarred); }}
                      >
                        {file.isStarred ? (
                          <StarOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Star className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
