'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CloudSidebar } from './CloudSidebar';
import { CloudHeader } from './CloudHeader';
import { CloudMobileNav } from './CloudMobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

interface CloudLayoutClientProps {
  user: {
    id: string;
    name: string;
    role: string;
  };
  children: React.ReactNode;
}

export function CloudLayoutClient({ user, children }: CloudLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Reset sidebar state based on screen size
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setSidebarCollapsed(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <CloudSidebar 
          userId={user.id}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72">
            <CloudSidebar 
              userId={user.id}
              collapsed={false}
              onCollapsedChange={() => {}}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        !isMobile && sidebarCollapsed ? "ml-[72px]" : !isMobile ? "ml-[280px]" : ""
      )}>
        <CloudHeader 
          userName={user.name}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={isMobile}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <CloudMobileNav />}
      </div>

      <Toaster />
    </div>
  );
}
