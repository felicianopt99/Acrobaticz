'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Move, Trash2, Share2, Tag, MoreVertical, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BatchActionsToolbarProps {
  selectedCount: number;
  selectedFileIds: string[];
  selectedFolderIds: string[];
  onMove?: (targetFolderId?: string) => Promise<void>;
  onDelete?: (permanent?: boolean) => Promise<void>;
  onShare?: (sharedWith?: string, permission?: string) => Promise<void>;
  onAddTags?: (tagIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function BatchActionsToolbar({
  selectedCount,
  selectedFileIds,
  selectedFolderIds,
  onMove,
  onDelete,
  onShare,
  onAddTags,
  onClose,
}: BatchActionsToolbarProps) {
  const { toast } = useToast();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleMove = async (targetFolderId?: string) => {
    if (!onMove) return;
    try {
      setIsLoading(true);
      await onMove(targetFolderId);
      toast({
        title: 'Success',
        description: `Moved ${selectedCount} items`,
      });
      setShowMoveDialog(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (permanent?: boolean) => {
    if (!onDelete) return;
    try {
      setIsLoading(true);
      await onDelete(permanent);
      toast({
        title: 'Success',
        description: `Deleted ${selectedCount} items${permanent ? ' permanently' : ' to trash'}`,
      });
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (shareWith?: string, permission?: string) => {
    if (!onShare) return;
    try {
      setIsLoading(true);
      await onShare(shareWith, permission);
      toast({
        title: 'Success',
        description: `Shared ${selectedCount} items`,
      });
      setShowShareDialog(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to share items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex gap-2">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <span className="text-sm font-medium text-gray-700">{selectedCount} selected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {onMove && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMoveDialog(true)}
            disabled={isLoading}
          >
            <Move className="h-4 w-4 mr-2" />
            Move
          </Button>
        )}

        {onShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            disabled={isLoading}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}

        {onAddTags && (
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <Tag className="h-4 w-4 mr-2" />
            Tag
          </Button>
        )}

        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              Download as ZIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Move Dialog */}
      {showMoveDialog && (
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Items</DialogTitle>
              <DialogDescription>
                Move {selectedCount} items to a folder or root directory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Feature to select destination folder coming soon
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleMove()}
                disabled={isLoading}
              >
                Move to Root
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Items</DialogTitle>
              <DialogDescription>
                Share {selectedCount} items with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Permission Level</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                  <option value="view">View only</option>
                  <option value="comment">Can comment</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleShare(undefined, 'view')}
                disabled={isLoading}
              >
                Create Public Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Items</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedCount} items?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => handleDelete(false)}
                disabled={isLoading}
                className="w-full"
              >
                Move to Trash
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(true)}
                disabled={isLoading}
                className="w-full"
              >
                Delete Permanently
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
