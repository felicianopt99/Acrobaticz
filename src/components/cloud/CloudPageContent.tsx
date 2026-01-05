'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/card';
import { FolderPlus, Upload, File, Folder, Clock, Star, Trash2, Search, Cloud, MoreVertical, Download, Share2, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useTranslate } from '@/contexts/TranslationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | number; // Use string for BigInt compatibility
  isStarred: boolean;
  isPublic: boolean;
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

interface CloudPageContentProps {
  userId: string;
}

export default function CloudPageContent({ userId }: CloudPageContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { translated: searchFilesText } = useTranslate('Search files...');
  const { translated: nameText } = useTranslate('Name');
  const { translated: typeText } = useTranslate('Type');
  const { translated: sizeText } = useTranslate('Size');
  const { translated: dateText } = useTranslate('Date Modified');
  const { translated: noFilesText } = useTranslate('No files found');
  const { translated: noFoldersText } = useTranslate('No folders');
  const { translated: downloadText } = useTranslate('Download');
  const { translated: shareText } = useTranslate('Share');
  const { translated: deleteText } = useTranslate('Delete');
  const { translated: errorText } = useTranslate('Error');
  const { translated: failedToLoadText } = useTranslate('Error loading files');
  const { translated: loadingText } = useTranslate('Loading...');
  const { translated: newFolderText } = useTranslate('New Folder');
  const { translated: folderNamePlaceholder } = useTranslate('Folder name...');
  const { translated: createText } = useTranslate('Create');
  const { translated: cancelText } = useTranslate('Cancel');
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderName, setFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Fetch folders
      const folderRes = await fetch('/api/cloud/folders?parentId=null');
      if (folderRes.ok) {
        const folderData = await folderRes.json();
        setFolders(folderData.folders || []);
      }

      // Fetch files
      const fileRes = await fetch('/api/cloud/files?parentId=null');
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        setFiles(fileData.files || []);
      }
    } catch (error) {
      console.error('Error loading cloud content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cloud storage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/cloud/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName }),
      });

      if (!res.ok) {
        throw new Error('Failed to create folder');
      }

      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });

      setFolderName('');
      setShowNewFolderInput(false);
      await loadContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

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
          let errorMessage = 'Upload failed';
          try {
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const error = await res.json();
              errorMessage = error.error || errorMessage;
            } else {
              errorMessage = `Upload failed (${res.status})`;
            }
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            errorMessage = `Upload failed (${res.status})`;
          }
          throw new Error(errorMessage);
        }

        toast({
          title: 'Success',
          description: `${files.length} file(s) uploaded successfully`,
        });

        await loadContent();
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and controls */}
          <motion.div
            className="mb-8 flex flex-col md:flex-row gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder={searchFilesText}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="flex items-center gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              {newFolderText}
            </Button>
          </motion.div>

          {/* New folder input */}
          {showNewFolderInput && (
            <motion.div
              className="mb-6 flex gap-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Input
                placeholder={folderNamePlaceholder}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <Button onClick={handleCreateFolder} size="sm">
                {createText}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewFolderInput(false);
                  setFolderName('');
                }}
              >
                {cancelText}
              </Button>
            </motion.div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin mb-4">
                <div className="h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">{loadingText}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Folders Grid */}
              {folders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-500" />
                    Folders ({folders.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {folders.map((folder) => (
                      <motion.div
                        key={folder.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 border-0 relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FolderActionMenu 
                              folderId={folder.id}
                              folderName={folder.name}
                              onDelete={() => setFolders(folders.filter(f => f.id !== folder.id))}
                              onStar={() => setFolders(folders.map(f => f.id === folder.id ? {...f, isStarred: !f.isStarred} : f))}
                              onReload={() => loadContent()}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center justify-center h-16 w-16 rounded-lg flex-shrink-0" style={{ backgroundColor: `${folder.color}20` }}>
                              <Folder className="h-8 w-8" style={{ color: folder.color }} />
                            </div>
                            {folder.isStarred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm mt-3">
                            {folder.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {folder._count.files} files • {folder._count.children} folders
                          </p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Grid */}
              {files.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <File className="h-5 w-5 text-amber-500" />
                    Files ({files.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card className="p-4 hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 border-0 relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FileActionMenu 
                              fileId={file.id} 
                              fileName={file.name}
                              onDelete={() => setFiles(files.filter(f => f.id !== file.id))}
                              onStar={() => setFiles(files.map(f => f.id === file.id ? {...f, isStarred: !f.isStarred} : f))}
                              onReload={() => loadContent()}
                            />
                          </div>
                          <div className="flex items-center justify-center h-16 rounded-lg mb-3 bg-gray-100 dark:bg-slate-700">
                            <File className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                            {file.name}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(Number(file.size) / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {file.isStarred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {folders.length === 0 && files.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Cloud className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Your cloud storage is empty
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                    Start by uploading files or creating folders
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={handleUploadClick} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Files
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewFolderInput(true)}
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      New Folder
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// File Action Menu Component
function FileActionMenu({ 
  fileId, 
  fileName,
  onDelete, 
  onStar,
  onReload 
}: { 
  fileId: string; 
  fileName: string;
  onDelete: () => void; 
  onStar: () => void;
  onReload: () => void;
}) {
  const { toast } = useToast();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(fileName);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/cloud/files/${fileId}`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleRename = async () => {
    if (!newName || newName === fileName) {
      setRenaming(false);
      return;
    }

    try {
      const res = await fetch(`/api/cloud/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error('Rename failed');

      toast({
        title: 'Success',
        description: 'File renamed successfully',
      });

      setRenaming(false);
      await onReload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${fileName}?`)) return;

    try {
      const res = await fetch(`/api/cloud/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        let errorMessage = 'Failed to delete file';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const error = await res.json();
            errorMessage = error.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing delete response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error('Delete failed');
      }

      toast({
        title: 'Success',
        description: 'File moved to trash',
      });

      onDelete();
    } catch (error) {
      console.error('Delete file error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  if (renaming) {
    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          className="h-8 text-xs"
          autoFocus
        />
        <Button size="sm" onClick={handleRename} className="h-8 px-2">OK</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRenaming(true)}>
          <Edit2 className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onStar}>
          <Star className="h-4 w-4 mr-2" />
          Star
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Folder Action Menu Component
function FolderActionMenu({ 
  folderId, 
  folderName,
  onDelete, 
  onStar,
  onReload 
}: { 
  folderId: string; 
  folderName: string;
  onDelete: () => void; 
  onStar: () => void;
  onReload: () => void;
}) {
  const { toast } = useToast();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folderName);

  const handleRename = async () => {
    if (!newName || newName === folderName) {
      setRenaming(false);
      return;
    }

    try {
      const res = await fetch(`/api/cloud/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error('Rename failed');

      toast({
        title: 'Success',
        description: 'Folder renamed successfully',
      });

      setRenaming(false);
      await onReload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename folder',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${folderName} and its contents?`)) return;

    try {
      const res = await fetch(`/api/cloud/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        let errorMessage = 'Failed to delete folder';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const error = await res.json();
            errorMessage = error.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing delete response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error('Delete failed');
      }

      toast({
        title: 'Success',
        description: 'Folder moved to trash',
      });

      onDelete();
    } catch (error) {
      console.error('Delete folder error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete folder',
        variant: 'destructive',
      });
    }
  };

  if (renaming) {
    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          className="h-8 text-xs"
          autoFocus
        />
        <Button size="sm" onClick={handleRename} className="h-8 px-2">OK</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setRenaming(true)}>
          <Edit2 className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onStar}>
          <Star className="h-4 w-4 mr-2" />
          Star
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
