'use client';

import Link from 'next/link';
import { ChevronRight, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface FolderBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function FolderBreadcrumb({ items }: FolderBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 mb-4 text-sm overflow-x-auto pb-2">
      <Link 
        href="/drive" 
        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
      >
        <HardDrive className="h-4 w-4" />
        <span>My Drive</span>
      </Link>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="h-4 w-4 text-gray-600" />
          {index === items.length - 1 ? (
            <span className="text-white font-medium">{item.name}</span>
          ) : (
            <Link 
              href={`/drive/folder/${item.id}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
