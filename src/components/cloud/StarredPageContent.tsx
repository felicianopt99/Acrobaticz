'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/card';
import { AlertCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StarredItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  createdAt: string;
}

export default function StarredPageContent({ userId }: { userId: string }) {
  const [starred, setStarred] = useState<StarredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStarred();
  }, []);

  const fetchStarred = async () => {
    try {
      const filesResponse = await fetch('/api/cloud/files');
      const foldersResponse = await fetch('/api/cloud/folders');

      if (filesResponse.ok && foldersResponse.ok) {
        const filesData = await filesResponse.json();
        const foldersData = await foldersResponse.json();

        const starredItems: StarredItem[] = [
          ...filesData.files.filter((f: any) => f.isStarred).map((f: any) => ({ ...f, type: 'file' })),
          ...foldersData.folders.filter((f: any) => f.isStarred).map((f: any) => ({ ...f, type: 'folder' })),
        ];
        setStarred(starredItems);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load starred items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppHeader title="Starred" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : starred.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">You haven't starred any files or folders yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {starred.map(item => (
              <Card key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.type === 'file' ? 'File' : 'Folder'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
