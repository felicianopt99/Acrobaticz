'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Folder, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText,
  FileSpreadsheet,
  FileCode,
  Archive,
  MoreVertical,
  Download,
  Star,
  StarOff,
  Trash2,
  Share2,
  Edit2,
  FolderPlus,
  Upload,
  Grid3X3,
  List,
  Copy,
  Eye,
  Link,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | number;
  isStarred: boolean;
  createdAt: string;
}

interface CloudFolder {
  id: string;
  name: string;
  color: string;
  isStarred: boolean;
  createdAt: string;
  _count: {
    files: number;
    children: number;
  };
}

interface DriveContentProps {
  userId: string;
  folderId?: string;
  folderName?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive;
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return FileCode;
  if (mimeType.includes('text') || mimeType.includes('document') || mimeType.includes('word')) return FileText;
  return File;
}

function getFileIconColor(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'text-red-400';
  if (mimeType.startsWith('video/')) return 'text-orange-400';
  if (mimeType.startsWith('audio/')) return 'text-pink-400';
  if (mimeType.includes('pdf')) return 'text-red-500';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-green-500';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-yellow-500';
  if (mimeType.includes('javascript') || mimeType.includes('typescript')) return 'text-yellow-400';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'text-blue-500';
  return 'text-gray-400';
}

export function DriveContent({ userId, folderId, folderName }: DriveContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedItem, setCopiedItem] = useState<{ id: string; type: 'file' | 'folder' } | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveItem, setMoveItem] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);
  const [dragSelectionStart, setDragSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const parentParam = folderId ? `parentId=${folderId}` : 'parentId=null';
      
      const [folderRes, fileRes] = await Promise.all([
        fetch(`/api/cloud/folders?${parentParam}`),
        fetch(`/api/cloud/files?${parentParam}`)
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
        description: 'Failed to load content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [folderId, toast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => loadContent();
    const handleNewFolder = () => setShowNewFolderDialog(true);
    const handleViewMode = (e: CustomEvent) => setViewMode(e.detail);

    window.addEventListener('cloud-refresh', handleRefresh);
    window.addEventListener('cloud-new-folder', handleNewFolder);
    window.addEventListener('cloud-view-mode', handleViewMode as EventListener);

    return () => {
      window.removeEventListener('cloud-refresh', handleRefresh);
      window.removeEventListener('cloud-new-folder', handleNewFolder);
      window.removeEventListener('cloud-view-mode', handleViewMode as EventListener);
    };
  }, [loadContent]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allIds = new Set([
          ...folders.map(f => f.id),
          ...files.map(f => f.id),
        ]);
        setSelectedItems(allIds);
      }
      // Delete: Move selected to trash
      if (e.key === 'Delete' && selectedItems.size > 0) {
        e.preventDefault();
        selectedItems.forEach(id => {
          const isFolder = folders.some(f => f.id === id);
          handleMoveToTrash(id, isFolder ? 'folder' : 'file');
        });
        setSelectedItems(new Set());
      }
      // Escape: Deselect all
      if (e.key === 'Escape' && selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, folders, files]);

  // Handle item selection with multi-select
  const handleItemSelect = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + Click: Toggle selection
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else if (event.shiftKey) {
      // Shift + Click: Range selection
      const allItems = [...folders.map(f => f.id), ...files.map(f => f.id)];
      const currentIndex = allItems.indexOf(id);
      
      if (lastSelectedIndex !== null && lastSelectedIndex !== currentIndex) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        const newSet = new Set(selectedItems);
        
        for (let i = start; i <= end; i++) {
          newSet.add(allItems[i]);
        }
        setSelectedItems(newSet);
      } else {
        setSelectedItems(new Set([id]));
      }
    } else {
      // Regular click: Select only this item
      setSelectedItems(new Set([id]));
    }
    
    const allItems = [...folders.map(f => f.id), ...files.map(f => f.id)];
    setLastSelectedIndex(allItems.indexOf(id));
  };

  // Deselect all items when clicking on empty space
  const handleContainerClick = () => {
    setSelectedItems(new Set());
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/cloud/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFolderName,
          parentId: folderId || null 
        }),
      });

      if (!res.ok) throw new Error('Failed to create folder');

      toast({ title: 'Folder created' });
      setNewFolderName('');
      setShowNewFolderDialog(false);
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const handleRename = async () => {
    if (!renameItem || !renameItem.name.trim()) return;

    try {
      const endpoint = renameItem.type === 'folder' 
        ? `/api/cloud/folders/${renameItem.id}`
        : `/api/cloud/files/${renameItem.id}`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameItem.name }),
      });

      if (!res.ok) throw new Error('Failed to rename');

      toast({ title: 'Renamed successfully' });
      setShowRenameDialog(false);
      setRenameItem(null);
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStar = async (id: string, type: 'file' | 'folder', currentStarred: boolean) => {
    try {
      const endpoint = type === 'folder' 
        ? `/api/cloud/folders/${id}`
        : `/api/cloud/files/${id}`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !currentStarred }),
      });

      if (!res.ok) throw new Error('Failed to update');
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update star status',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToTrash = async (id: string, type: 'file' | 'folder') => {
    try {
      const endpoint = type === 'folder' 
        ? `/api/cloud/folders/${id}`
        : `/api/cloud/files/${id}`;

      const res = await fetch(endpoint, {
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

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/cloud/files/${fileId}/download`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = (id: string, type: 'file' | 'folder') => {
    setCopiedItem({ id, type });
    toast({
      title: 'Copied',
      description: `${type === 'file' ? 'File' : 'Folder'} copied to clipboard`,
    });
  };

  const handlePaste = async () => {
    if (!copiedItem) return;

    try {
      const isFile = copiedItem.type === 'file';
      const endpoint = isFile 
        ? `/api/cloud/files/${copiedItem.id}/copy`
        : `/api/cloud/folders/${copiedItem.id}/copy`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: folderId || null }),
      });

      if (!res.ok) throw new Error('Failed to paste');

      toast({ title: 'Pasted successfully' });
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to paste',
        variant: 'destructive',
      });
    }
  };

  const handleMove = async (destinationFolderId: string) => {
    if (!moveItem) return;

    try {
      const endpoint = moveItem.type === 'file'
        ? `/api/cloud/files/${moveItem.id}`
        : `/api/cloud/folders/${moveItem.id}`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: destinationFolderId }),
      });

      if (!res.ok) throw new Error('Failed to move');

      toast({ title: 'Moved successfully' });
      setShowMoveDialog(false);
      setMoveItem(null);
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move item',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = (file: CloudFile) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const handleDeletePermanently = async (id: string, type: 'file' | 'folder') => {
    try {
      const endpoint = type === 'folder'
        ? `/api/cloud/folders/${id}`
        : `/api/cloud/files/${id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Item permanently deleted' });
      loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const formData = new FormData();
    droppedFiles.forEach(file => formData.append('files', file));
    if (folderId) formData.append('folderId', folderId);

    try {
      const res = await fetch('/api/cloud/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast({
        title: 'Upload successful',
        description: `${droppedFiles.length} file(s) uploaded`,
      });
      loadContent();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const openFolder = (folderId: string) => {
    router.push(`/drive/folder/${folderId}`);
  };

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div 
      ref={containerRef}
      className="h-full"
      onClick={handleContainerClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {folderName || 'My Drive'}
          </h1>
          {selectedItems.size > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="text-gray-400 hover:text-white"
          >
            {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-amber-500/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-[#1a1a1a] border-2 border-dashed border-amber-500 rounded-2xl p-12 text-center">
              <Upload className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <p className="text-xl text-white font-medium">Drop files to upload</p>
              <p className="text-gray-400 mt-2">Files will be uploaded to {folderName || 'My Drive'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 rounded-full bg-white/5 mb-6">
            <Folder className="h-16 w-16 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">
            {folderId ? 'This folder is empty' : 'Welcome to your Drive'}
          </h2>
          <p className="text-gray-400 mb-6 max-w-md">
            {folderId 
              ? 'Upload files or create folders to get started'
              : 'Drop files here or use the + New button to upload files and create folders'
            }
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowNewFolderDialog(true)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            : "flex flex-col gap-1"
        )}>
          {/* Folders */}
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              viewMode={viewMode}
              isSelected={selectedItems.has(folder.id)}
              onSelect={(e) => handleItemSelect(folder.id, e)}
              onOpen={() => openFolder(folder.id)}
              onRename={() => {
                setRenameItem({ id: folder.id, name: folder.name, type: 'folder' });
                setShowRenameDialog(true);
              }}
              onToggleStar={() => handleToggleStar(folder.id, 'folder', folder.isStarred)}
              onMoveToTrash={() => handleMoveToTrash(folder.id, 'folder')}
              onCopy={() => handleCopy(folder.id, 'folder')}
              onMove={() => {
                setMoveItem({ id: folder.id, type: 'folder', name: folder.name });
                setShowMoveDialog(true);
              }}
              onDeletePermanently={() => handleDeletePermanently(folder.id, 'folder')}
            />
          ))}

          {/* Files */}
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              isSelected={selectedItems.has(file.id)}
              onSelect={(e) => handleItemSelect(file.id, e)}
              onRename={() => {
                setRenameItem({ id: file.id, name: file.name, type: 'file' });
                setShowRenameDialog(true);
              }}
              onToggleStar={() => handleToggleStar(file.id, 'file', file.isStarred)}
              onMoveToTrash={() => handleMoveToTrash(file.id, 'file')}
              onDownload={() => handleDownload(file.id, file.name)}
              onCopy={() => handleCopy(file.id, 'file')}
              onMove={() => {
                setMoveItem({ id: file.id, type: 'file', name: file.name });
                setShowMoveDialog(true);
              }}
              onPreview={() => {
                const cloudFile: CloudFile = file;
                handlePreview(cloudFile);
              }}
            />
          ))}
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Untitled folder"
            className="bg-white/5 border-white/10 text-white"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} className="bg-amber-600 hover:bg-amber-700">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            value={renameItem?.name || ''}
            onChange={(e) => setRenameItem(prev => prev ? { ...prev, name: e.target.value } : null)}
            className="bg-white/5 border-white/10 text-white"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} className="bg-amber-600 hover:bg-amber-700">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Move {moveItem?.type === 'file' ? 'file' : 'folder'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a destination folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-sm text-gray-500">No folders available</p>
            ) : (
              folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => moveItem && handleMove(folder.id)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Folder className="h-4 w-4" style={{ color: folder.color || undefined }} />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex flex-col gap-4">
              {previewFile.mimeType.startsWith('image/') && (
                <div className="w-full h-96 bg-black/50 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={`/api/cloud/files/${previewFile.id}/download`}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {previewFile.mimeType.startsWith('video/') && (
                <video
                  controls
                  className="w-full h-96 bg-black/50 rounded-lg"
                  src={`/api/cloud/files/${previewFile.id}/download`}
                />
              )}
              {previewFile.mimeType.startsWith('audio/') && (
                <audio
                  controls
                  className="w-full"
                  src={`/api/cloud/files/${previewFile.id}/download`}
                />
              )}
              <div className="text-sm text-gray-400 space-y-1">
                <p><strong>Type:</strong> {previewFile.mimeType}</p>
                <p><strong>Size:</strong> {formatBytes(typeof previewFile.size === 'string' ? parseInt(previewFile.size) : previewFile.size)}</p>
                <p><strong>Created:</strong> {new Date(previewFile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
            {previewFile && (
              <Button 
                onClick={() => handleDownload(previewFile.id, previewFile.name)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Folder Item Component
function FolderItem({ 
  folder, 
  viewMode,
  isSelected,
  onSelect,
  onOpen, 
  onRename, 
  onToggleStar, 
  onMoveToTrash,
  onCopy,
  onMove,
  onDeletePermanently
}: { 
  folder: CloudFolder;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onOpen: () => void;
  onRename: () => void;
  onToggleStar: () => void;
  onMoveToTrash: () => void;
  onCopy: () => void;
  onMove: () => void;
  onDeletePermanently: () => void;
}) {
  if (viewMode === 'list') {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-all",
              isSelected ? "bg-amber-500/20 border border-amber-500/30" : "hover:bg-white/5"
            )}
            onClick={onSelect}
            onDoubleClick={onOpen}
          >
            <Folder className="h-6 w-6 text-gray-400 flex-shrink-0" style={{ color: folder.color || undefined }} />
            <span className="flex-1 text-white truncate">{folder.name}</span>
            {folder.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
            <span className="text-sm text-gray-500">
              {folder._count.files + folder._count.children} items
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Move className="h-4 w-4 mr-2" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar(); }}>
                  {folder.isStarred ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                  {folder.isStarred ? 'Remove star' : 'Add star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToTrash(); }} className="text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" /> Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
          <ContextMenuItem onClick={onOpen}>Open</ContextMenuItem>
          <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
          <ContextMenuItem onClick={onCopy}>Copy</ContextMenuItem>
          <ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
          <ContextMenuSeparator className="bg-white/10" />
          <ContextMenuItem onClick={onToggleStar}>
            {folder.isStarred ? 'Remove star' : 'Add star'}
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-white/10" />
          <ContextMenuItem onClick={onMoveToTrash} className="text-red-400">
            Move to trash
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "group relative rounded-xl p-4 cursor-pointer transition-all duration-200",
            isSelected 
              ? "bg-amber-500/30 border-2 border-amber-500" 
              : "bg-white/5 hover:bg-white/10 border border-transparent"
          )}
          onClick={onSelect}
          onDoubleClick={onOpen}
        >
          {folder.isStarred && (
            <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-400 fill-yellow-400" />
          )}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-square bg-gradient-to-br from-blue-900/40 to-blue-950 rounded-lg mb-3 overflow-hidden flex items-center justify-center border border-blue-500/30 relative">
              <Folder 
                className="h-16 w-16" 
                style={{ color: folder.color || '#3b82f6' }}
              />
              <div className="absolute inset-0 flex items-end justify-start p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-xs text-gray-300">{folder._count.files + folder._count.children} items</span>
              </div>
            </div>
            <span className="text-sm text-white text-center truncate w-full font-medium">{folder.name}</span>
            <span className="text-xs text-gray-500 mt-1">
              {folder._count.files + folder._count.children} items
            </span>
          </div>
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70">
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Move className="h-4 w-4 mr-2" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar(); }}>
                  {folder.isStarred ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                  {folder.isStarred ? 'Remove star' : 'Add star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToTrash(); }} className="text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" /> Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
        <ContextMenuItem onClick={onOpen}>Open</ContextMenuItem>
        <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>Copy</ContextMenuItem>
        <ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuItem onClick={onToggleStar}>
          {folder.isStarred ? 'Remove star' : 'Add star'}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuItem onClick={onMoveToTrash} className="text-red-400">
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// File Item Component
function FileItem({ 
  file, 
  viewMode,
  isSelected,
  onSelect,
  onRename, 
  onToggleStar, 
  onMoveToTrash,
  onDownload,
  onCopy,
  onMove,
  onPreview
}: { 
  file: CloudFile;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onRename: () => void;
  onToggleStar: () => void;
  onMoveToTrash: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onMove: () => void;
  onPreview: () => void;
}) {
  const Icon = getFileIcon(file.mimeType);
  const iconColor = getFileIconColor(file.mimeType);
  const fileSize = typeof file.size === 'string' ? parseInt(file.size) : file.size;

  if (viewMode === 'list') {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-all",
            isSelected ? "bg-amber-500/20 border border-amber-500/30" : "hover:bg-white/5"
          )}
          onClick={onSelect}
          onDoubleClick={onPreview}
          >
            <Icon className={cn("h-6 w-6 flex-shrink-0", iconColor)} />
            <span className="flex-1 text-white truncate">{file.name}</span>
            {file.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
            <span className="text-sm text-gray-500">{formatBytes(fileSize)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(); }}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Move className="h-4 w-4 mr-2" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar(); }}>
                  {file.isStarred ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                  {file.isStarred ? 'Remove star' : 'Add star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToTrash(); }} className="text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" /> Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
          <ContextMenuItem onClick={onDownload}>Download</ContextMenuItem>
          <ContextMenuItem onClick={onPreview}>Preview</ContextMenuItem>
          <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
          <ContextMenuItem onClick={onCopy}>Copy</ContextMenuItem>
          <ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
          <ContextMenuSeparator className="bg-white/10" />
          <ContextMenuItem onClick={onToggleStar}>
            {file.isStarred ? 'Remove star' : 'Add star'}
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-white/10" />
          <ContextMenuItem onClick={onMoveToTrash} className="text-red-400">
            Move to trash
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "group relative rounded-xl p-4 cursor-pointer transition-all duration-200",
            isSelected 
              ? "bg-amber-500/30 border-2 border-amber-500" 
              : "bg-white/5 hover:bg-white/10 border border-transparent"
          )}
          onClick={onSelect}
          onDoubleClick={onPreview}
        >
          {file.isStarred && (
            <Star className="absolute top-2 left-2 h-4 w-4 text-yellow-400 fill-yellow-400 z-10" />
          )}
          <div className="flex flex-col items-center">
            {file.mimeType.startsWith('image/') ? (
              <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg mb-3 overflow-hidden flex items-center justify-center border border-white/10 relative group/thumb">
                <img 
                  src={`/api/cloud/files/${file.id}/download`}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <Icon className={cn("h-12 w-12 absolute", iconColor, "group-hover/thumb:hidden")} />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg mb-3 overflow-hidden flex items-center justify-center border border-white/10">
                <Icon className={cn("h-16 w-16", iconColor)} />
              </div>
            )}
            <span className="text-sm text-white text-center truncate w-full font-medium">{file.name}</span>
            <span className="text-xs text-gray-500 mt-1">{formatBytes(fileSize)}</span>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70">
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(); }}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Move className="h-4 w-4 mr-2" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar(); }}>
                  {file.isStarred ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                  {file.isStarred ? 'Remove star' : 'Add star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToTrash(); }} className="text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" /> Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
        <ContextMenuItem onClick={onDownload}>Download</ContextMenuItem>
        <ContextMenuItem onClick={onPreview}>Preview</ContextMenuItem>
        <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>Copy</ContextMenuItem>
        <ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuItem onClick={onToggleStar}>
          {file.isStarred ? 'Remove star' : 'Add star'}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuItem onClick={onMoveToTrash} className="text-red-400">
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
