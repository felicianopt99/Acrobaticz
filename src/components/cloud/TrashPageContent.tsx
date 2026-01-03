'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrashItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  updatedAt: string;
}

export default function TrashPageContent({ userId }: { userId: string }) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const response = await fetch('/api/cloud/trash');
      if (response.ok) {
        const data = await response.json();
        const allItems: TrashItem[] = [
          ...data.files.map((f: any) => ({ ...f, type: 'file' })),
          ...data.folders.map((f: any) => ({ ...f, type: 'folder' })),
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setItems(allItems);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trash',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (itemId: string, itemType: 'file' | 'folder') => {
    try {
      const response = await fetch('/api/cloud/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType }),
      });

      if (response.ok) {
        setItems(items.filter(i => i.id !== itemId));
        toast({
          title: 'Success',
          description: 'Item restored from trash',
        });
      } else {
        throw new Error('Failed to restore');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore item',
        variant: 'destructive',
      });
    }
  };

  const handlePermanentDelete = async (itemId: string, itemType: 'file' | 'folder') => {
    if (!confirm('This action cannot be undone. Are you sure?')) return;

    try {
      const response = await fetch(
        `/api/cloud/trash?itemId=${itemId}&itemType=${itemType}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setItems(items.filter(i => i.id !== itemId));
        toast({
          title: 'Success',
          description: 'Item permanently deleted',
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <AppHeader title="Trash" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Trash is empty</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.type === 'file' ? item.size : 'Folder'} • {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(item.id, item.type)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handlePermanentDelete(item.id, item.type)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
