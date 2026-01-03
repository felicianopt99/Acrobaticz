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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Folder, 
  File, 
  Image, 
  FileText, 
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  MoreVertical,
  Trash2,
  RotateCcw,
  AlertTriangle,
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
  createdAt: string;
}

interface CloudFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface TrashContentProps {
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

export function TrashContent({ userId }: TrashContentProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [emptyTrashDialog, setEmptyTrashDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      
      const [folderRes, fileRes] = await Promise.all([
        fetch('/api/cloud/folders?trashed=true'),
        fetch('/api/cloud/files?trashed=true'),
      ]);

      if (folderRes.ok) {
        const data = await folderRes.json();
        setFolders(data.folders || []);
      }
      if (fileRes.ok) {
        const data = await fileRes.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trash',
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

  const restoreItem = async (id: string, type: 'file' | 'folder') => {
    try {
      const endpoint = type === 'file' ? `/api/cloud/files/${id}` : `/api/cloud/folders/${id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrashed: false }),
      });

      if (!res.ok) throw new Error('Failed to restore');

      toast({ title: 'Restored successfully' });
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore item',
        variant: 'destructive',
      });
    }
  };

  const deleteForever = async (id: string, type: 'file' | 'folder') => {
    try {
      const endpoint = type === 'file' ? `/api/cloud/files/${id}` : `/api/cloud/folders/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });

      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Deleted permanently' });
      setDeleteDialog(null);
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const emptyTrash = async () => {
    try {
      const res = await fetch('/api/cloud/trash/empty', { method: 'DELETE' });

      if (!res.ok) throw new Error('Failed to empty trash');

      toast({ title: 'Trash emptied' });
      setEmptyTrashDialog(false);
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to empty trash',
        variant: 'destructive',
      });
    }
  };

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-gray-400" />
            Trash
          </h1>
          <p className="text-gray-400 text-sm mt-1">Items in trash will be permanently deleted after 30 days</p>
        </div>
        {!isEmpty && (
          <Button 
            variant="outline" 
            onClick={() => setEmptyTrashDialog(true)}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Empty trash
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-gray-700 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Trash2 className="h-12 w-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">Trash is empty</h2>
          <p className="text-gray-400 max-w-md">
            Items you delete will appear here
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
            <>
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-4 cursor-pointer transition-all opacity-60 border border-white/5"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full aspect-square bg-gradient-to-br from-blue-900/40 to-blue-950 rounded-lg overflow-hidden flex items-center justify-center border border-blue-500/30">
                      <Folder 
                        className="h-16 w-16" 
                        style={{ color: folder.color || '#3b82f6' }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium truncate w-full text-center">
                      {folder.name}
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
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); restoreItem(folder.id, 'folder'); }}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Restore
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ id: folder.id, type: 'folder', name: folder.name }); }}
                        className="text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete forever
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}

              {files.map((file) => {
                const { icon: FileIcon, color } = getFileIcon(file.mimeType);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-4 cursor-pointer transition-all opacity-60 border border-white/5"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {file.mimeType.startsWith('image/') ? (
                        <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden flex items-center justify-center border border-white/10 relative">
                          <img 
                            src={`/api/cloud/files/${file.id}/download`}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <FileIcon className={cn("h-12 w-12 absolute", color)} />
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
                          <FileIcon className={cn("h-16 w-16", color)} />
                        </div>
                      )}
                      <span className="text-sm text-white font-medium truncate w-full text-center">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatBytes(Number(file.size))}
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); restoreItem(file.id, 'file'); }}>
                          <RotateCcw className="h-4 w-4 mr-2" /> Restore
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setDeleteDialog({ id: file.id, type: 'file', name: file.name }); }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete forever
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                );
              })}
            </>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-white/10">
                <div className="col-span-6">Name</div>
                <div className="col-span-3 hidden md:block">Deleted</div>
                <div className="col-span-2 hidden md:block">Size</div>
                <div className="col-span-1"></div>
              </div>

              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-white/5 cursor-pointer group opacity-60"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <Folder className="h-5 w-5" style={{ color: folder.color || '#9CA3AF' }} />
                    <span className="text-white truncate">{folder.name}</span>
                  </div>
                  <div className="col-span-3 text-gray-500 text-sm hidden md:block">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 text-gray-500 text-sm hidden md:block">—</div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={() => restoreItem(folder.id, 'folder')}
                    >
                      <RotateCcw className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))}

              {files.map((file) => {
                const { icon: FileIcon, color } = getFileIcon(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-white/5 cursor-pointer group opacity-60"
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <FileIcon className={cn("h-5 w-5", color)} />
                      <span className="text-white truncate">{file.name}</span>
                    </div>
                    <div className="col-span-3 text-gray-500 text-sm hidden md:block">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 text-gray-500 text-sm hidden md:block">
                      {formatBytes(Number(file.size))}
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => restoreItem(file.id, 'file')}
                      >
                        <RotateCcw className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </motion.div>
      )}

      {/* Empty Trash Confirmation */}
      <AlertDialog open={emptyTrashDialog} onOpenChange={setEmptyTrashDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Empty trash?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              All items in the trash will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={emptyTrash}
              className="bg-red-600 hover:bg-red-700"
            >
              Empty trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Forever Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete forever?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              "{deleteDialog?.name}" will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog && deleteForever(deleteDialog.id, deleteDialog.type)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
