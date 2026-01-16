import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format bytes to human readable format
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Format date to readable format
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return d.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
  }
}

// Responsive grid utilities
export function responsiveGrid(baseColumns: number, mdColumns?: number, lgColumns?: number) {
  return cn(
    `grid grid-cols-${baseColumns}`,
    mdColumns && `md:grid-cols-${mdColumns}`,
    lgColumns && `lg:grid-cols-${lgColumns}`
  )
}

// Mobile-first responsive height utilities
export function responsiveHeight(mobile: string, desktop?: string) {
  return cn(
    mobile,
    desktop && `md:${desktop}`
  )
}

// Safe area utilities for mobile
export function safeAreaPadding(position: 'top' | 'bottom' | 'all' = 'all') {
  const paddingMap = {
    top: 'pt-[env(safe-area-inset-top)]',
    bottom: 'pb-[env(safe-area-inset-bottom)]',
    all: 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
  }
  return paddingMap[position]
}

// Responsive text sizing
export function responsiveText(size: 'sm' | 'base' | 'lg' | 'xl') {
  const sizeMap = {
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl'
  }
  return sizeMap[size]
}
// Debounce function for event handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}