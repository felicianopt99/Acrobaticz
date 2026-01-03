'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Breadcrumb {
  id: string;
  name: string;
}

interface BreadcrumbNavProps {
  items: Breadcrumb[];
  onNavigate?: (folderId: string) => void;
}

export function BreadcrumbNav({ items, onNavigate }: BreadcrumbNavProps) {
  const router = useRouter();

  const handleNavigate = (folderId: string) => {
    if (onNavigate) {
      onNavigate(folderId);
    } else {
      router.push(`/cloud?folder=${folderId}`);
    }
  };

  return (
    <div className="flex items-center gap-1 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-x-auto">
      {/* Home button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigate('')}
        className="flex items-center gap-1 flex-shrink-0"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline text-sm">My Drive</span>
      </Button>

      {/* Breadcrumb items */}
      {items.length > 0 && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1 overflow-x-auto">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant={index === items.length - 1 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavigate(item.id)}
                  className="text-sm"
                >
                  {item.name}
                </Button>
                {index < items.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
