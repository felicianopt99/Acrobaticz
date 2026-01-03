'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Upload, 
  FolderPlus, 
  HardDrive,
  Star,
  Users,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building,
  X,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCustomizationSettings } from '@/hooks/useCustomizationSettings';
import { APP_NAME } from '@/lib/constants';

interface CloudSidebarProps {
  userId: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

const navItems = [
  { href: '/drive', label: 'My Drive', icon: HardDrive },
  { href: '/drive/starred', label: 'Starred', icon: Star },
  { href: '/drive/shared', label: 'Shared with me', icon: Users },
  { href: '/drive/recent', label: 'Recent', icon: Clock },
  { href: '/drive/trash', label: 'Trash', icon: Trash2 },
];

export function CloudSidebar({ 
  userId, 
  collapsed, 
  onCollapsedChange, 
  onClose,
  isMobile 
}: CloudSidebarProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { data: settings } = useCustomizationSettings();
  const [quota, setQuota] = useState<{ usedBytes: number; quotaBytes: number } | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  const displayName = settings?.companyName || APP_NAME;

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/cloud/storage');
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch (error) {
      console.error('Failed to fetch storage quota:', error);
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

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
          description: `${files.length} file(s) uploaded`,
        });

        fetchQuota();
        window.dispatchEvent(new CustomEvent('cloud-refresh'));
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const handleFolderUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    (input as any).directory = true;
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

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
          title: 'Folder uploaded',
          description: `${files.length} file(s) uploaded`,
        });

        fetchQuota();
        window.dispatchEvent(new CustomEvent('cloud-refresh'));
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const handleCreateFolder = () => {
    window.dispatchEvent(new CustomEvent('cloud-new-folder'));
  };

  const percentUsed = quota ? (quota.usedBytes / quota.quotaBytes) * 100 : 0;

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-full bg-[#141414] border-r border-white/10 flex flex-col z-30 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[280px]",
        isMobile && "shadow-2xl"
      )}
    >
      {/* Header with Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/drive" className="flex items-center gap-2">
            {settings?.logoUrl && settings?.useTextLogo === false ? (
              <img 
                src={settings.logoUrl} 
                alt={displayName}
                className="h-8 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <>
                <Cloud className="h-7 w-7 text-amber-400" />
                <span className="font-semibold text-white text-lg">Cloud</span>
              </>
            )}
          </Link>
        )}
        {collapsed && (
          <Link href="/drive" className="mx-auto">
            <Cloud className="h-7 w-7 text-amber-400" />
          </Link>
        )}
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* New Button */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className={cn(
                "bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg transition-all",
                collapsed ? "w-12 h-12 p-0 rounded-full mx-auto" : "w-full justify-start gap-3 h-12 rounded-full px-6"
              )}
            >
              <Plus className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
              {!collapsed && <span className="font-medium">New</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 bg-[#1a1a1a] border-white/10 text-white"
            sideOffset={8}
          >
            <DropdownMenuItem 
              onClick={handleCreateFolder}
              className="gap-3 py-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
            >
              <FolderPlus className="h-5 w-5 text-gray-400" />
              <span>New folder</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={handleFileUpload}
              className="gap-3 py-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
            >
              <Upload className="h-5 w-5 text-gray-400" />
              <span>File upload</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleFolderUpload}
              className="gap-3 py-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
            >
              <FolderPlus className="h-5 w-5 text-gray-400" />
              <span>Folder upload</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/drive' && pathname.startsWith('/drive/folder'));
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200",
                    isActive 
                      ? "bg-amber-500/20 text-amber-300" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-amber-400")} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Storage Usage */}
      {quota && !collapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <HardDrive className="h-4 w-4" />
              <span>Storage</span>
            </div>
            <Progress 
              value={percentUsed} 
              className="h-1.5 bg-white/10"
            />
            <p className="text-xs text-gray-500">
              {formatBytes(quota.usedBytes)} of {formatBytes(quota.quotaBytes)} used
            </p>
          </div>
        </div>
      )}

      {/* Collapse Button (Desktop only) */}
      {!isMobile && (
        <div className="p-2 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "w-full text-gray-400 hover:text-white hover:bg-white/10",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}
