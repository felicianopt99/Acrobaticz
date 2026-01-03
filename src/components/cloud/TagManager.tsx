'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tag, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TagDefinition {
  id: string;
  name: string;
  color: string;
  description?: string;
  itemCount?: number;
}

interface TagManagerProps {
  fileId?: string;
  isOpen: boolean;
  onClose: () => void;
  onTagsAdded?: () => void;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function TagManager({
  fileId,
  isOpen,
  onClose,
  onTagsAdded,
}: TagManagerProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<TagDefinition[]>([]);
  const [fileTags, setFileTags] = useState<TagDefinition[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load all tags and file tags
  useEffect(() => {
    if (!isOpen) return;

    const loadTags = async () => {
      try {
        setIsLoading(true);

        // Load user's tags
        const tagsRes = await fetch('/api/cloud/tags');
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setTags(data.tags || []);
        }

        // Load file's tags if fileId is provided
        if (fileId) {
          const fileTagsRes = await fetch(`/api/cloud/tags/${fileId}`);
          if (fileTagsRes.ok) {
            const data = await fileTagsRes.json();
            setFileTags(data.tags || []);
          }
        }
      } catch (error) {
        console.error('Error loading tags:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tags',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, [isOpen, fileId, toast]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch('/api/cloud/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      const data = await res.json();
      setTags([data.tag, ...tags]);
      setNewTagName('');
      setShowNewTagForm(false);

      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tag',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTagToFile = async (tagId: string) => {
    if (!fileId) return;

    try {
      setIsLoading(true);

      const res = await fetch(`/api/cloud/tags/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add tag');
      }

      const data = await res.json();
      setFileTags([...fileTags, data.tag]);

      toast({
        title: 'Success',
        description: 'Tag added to file',
      });

      onTagsAdded?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add tag',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTagFromFile = async (tagId: string) => {
    if (!fileId) return;

    try {
      setIsLoading(true);

      const res = await fetch(`/api/cloud/tags/${fileId}?tagId=${tagId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove tag');
      }

      setFileTags(fileTags.filter((t) => t.id !== tagId));

      toast({
        title: 'Success',
        description: 'Tag removed from file',
      });

      onTagsAdded?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove tag',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableTags = tags.filter((t) => !fileTags.some((ft) => ft.id === t.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            {fileId ? 'Add or remove tags for this file' : 'Create and manage your tags'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Tags (if fileId) */}
          {fileId && fileTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Applied Tags</h4>
              <div className="flex flex-wrap gap-2">
                {fileTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTagFromFile(tag.id)}
                      disabled={isLoading}
                      className="hover:opacity-80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Tags to Add */}
          {fileId && availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Available Tags</h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTagToFile(tag.id)}
                    disabled={isLoading}
                    className="px-3 py-1 rounded-full text-sm border-2 transition-colors"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                    }}
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Tags List */}
          {!fileId && tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Your Tags</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{tag.name}</p>
                        <p className="text-xs text-gray-500">
                          {tag.itemCount || 0} items
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Tag Form */}
          <div className="border-t pt-4">
            {!showNewTagForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewTagForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Tag
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  disabled={isLoading}
                />

                <div>
                  <p className="text-xs text-gray-600 mb-2">Choose a color</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        disabled={isLoading}
                        className={`w-6 h-6 rounded border-2 ${
                          newTagColor === color ? 'border-gray-800' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTagForm(false)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={isLoading || !newTagName.trim()}
                    className="flex-1"
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
