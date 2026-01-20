"use client";

import type React from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { MobileNavProvider } from '@/contexts/MobileNavContext';
import { MobileWelcomeBar } from '@/components/layout/MobileWelcomeBar';

const BottomNav = dynamic(() => import('@/components/layout/BottomNav').then(mod => ({ default: mod.BottomNav })), {
  ssr: false
});

export function MobileLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <div 
        className="flex flex-col min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-x-hidden relative"
      >
        <AppHeader />
        <main 
          className="flex-1 min-w-0 max-w-full bg-white dark:bg-black relative z-[1]"
          style={{ 
            paddingBottom: 'max(calc(64px + env(safe-area-inset-bottom)), 80px)' 
          }}
        >
          <div className="page-container">
            <MobileWelcomeBar />
            {children}
          </div>
        </main>
        <Toaster />
        <ScrollToTopButton />
        <BottomNav />
      </div>
    </MobileNavProvider>
  );
}
