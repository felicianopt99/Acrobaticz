'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2, Copy, Check, Lock, Globe, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShareDialogProps {
  fileId: string;
  fileName: string;
}

export function ShareDialog({ fileId, fileName }: ShareDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadShares = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cloud/share?fileId=${fileId}`);
      if (!res.ok) throw new Error('Failed to load shares');
      const data = await res.json();
      setShares(data.shares || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load shares',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch('/api/cloud/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          permission,
          isPublic,
        }),
      });

      if (!res.ok) throw new Error('Failed to create share');

      const data = await res.json();
      setShares([...shares, data.share]);
      setPermission('view');
      setIsPublic(false);

      toast({
        title: 'Success',
        description: 'File shared successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share file',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };

  const handleDeleteShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/cloud/share/${shareId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete share');

      setShares(shares.filter(s => s.id !== shareId));
      toast({
        title: 'Success',
        description: 'Share removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove share',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(true);
            loadShares();
          }}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{fileName}"</DialogTitle>
          <DialogDescription>
            Manage who can access this file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create Share Section */}
          <div className="space-y-2 border-b pb-4">
            <label className="text-sm font-medium">Add New Share</label>
            <div className="flex gap-2">
              <Select value={permission} onValueChange={(val) => setPermission(val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <Eye className="h-4 w-4 mr-2 inline" />
                    View
                  </SelectItem>
                  <SelectItem value="edit">
                    <Edit className="h-4 w-4 mr-2 inline" />
                    Edit
                  </SelectItem>
                  <SelectItem value="admin">
                    <Lock className="h-4 w-4 mr-2 inline" />
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleShare} className="flex-shrink-0">
                <Globe className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Shares List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Shares</label>
            {shares.length === 0 ? (
              <p className="text-sm text-gray-500">No active shares</p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="p-3 border rounded-lg bg-gray-50 dark:bg-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {share.isPublic ? (
                          <Globe className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-xs font-medium capitalize">
                          {share.permission} - {share.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDeleteShare(share.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {share.isPublic && share.shareToken && (
                      <div className="flex gap-1">
                        <Input
                          value={`${window.location.origin}/share/${share.shareToken}`}
                          readOnly
                          className="text-xs h-8"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleCopyLink(share.shareToken)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    {share.expiresAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Expires: {new Date(share.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
