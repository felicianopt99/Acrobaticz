'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HardDrive, Star, Users, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Upload, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/drive', label: 'My Drive', icon: HardDrive },
  { href: '/drive/starred', label: 'Starred', icon: Star },
  { href: '/drive/shared', label: 'Shared', icon: Users },
  { href: '/drive/trash', label: 'Trash', icon: Trash2 },
];

export function CloudMobileNav() {
  const pathname = usePathname();
  const { toast } = useToast();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/10 z-30 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/drive' && pathname.startsWith('/drive/folder'));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[60px] transition-colors",
                isActive 
                  ? "text-amber-400" 
                  : "text-gray-500"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-amber-400")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* FAB for New */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:opacity-90 shadow-lg shadow-amber-500/30 -mt-4"
            >
              <Plus className="h-6 w-6 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center"
            side="top"
            className="w-48 bg-[#1a1a1a] border-white/10 text-white mb-2"
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
              <span>Upload files</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
