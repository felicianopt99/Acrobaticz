'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Menu,
  Grid3X3,
  List,
  User,
  LogOut,
  Settings,
  X,
  LayoutDashboard,
  Cloud,
  ChevronRight,
  HelpCircle,
  Upload,
  RefreshCw,
  Info,
  Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CloudHeaderProps {
  userName: string;
  onMenuClick: () => void;
  showMenuButton: boolean;
  breadcrumbs?: { name: string; path: string }[];
}

export function CloudHeader({ userName, onMenuClick, showMenuButton, breadcrumbs }: CloudHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/drive/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const switchToDashboard = () => {
    router.push('/dashboard');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Store view mode preference
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    window.dispatchEvent(new CustomEvent('cloud-view-mode', { detail: newMode }));
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 backdrop-blur-md shadow-lg">
      {/* Main Header Row */}
      <div className="h-16 flex items-center justify-between px-4 gap-3 sm:gap-4">
        {/* Left Section: Menu + Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile Menu Button */}
          {showMenuButton && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onMenuClick}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Logo and Title - Mobile Hidden */}
          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
            <motion.div whileHover={{ rotate: 10 }} className="text-amber-400">
              <Cloud className="h-5 w-5" />
            </motion.div>
            <span className="text-sm font-semibold text-white hidden md:inline">Cloud Storage</span>
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <form 
          onSubmit={handleSearch} 
          className="flex-1 max-w-2xl hidden xs:block"
        >
          <motion.div 
            className={cn(
              "relative flex items-center bg-white/5 rounded-full transition-all duration-200 border",
              searchFocused ? "bg-white/10 border-amber-500/50 shadow-lg shadow-amber-500/10" : "border-white/10 hover:border-white/20"
            )}
            animate={searchFocused ? { scale: 1.01 } : { scale: 1 }}
          >
            <Search className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 px-3"
              aria-label="Search cloud storage"
            />
            {searchQuery && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="mr-2 h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </form>

        {/* Right Section: Actions + User Menu */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* View Mode Toggle - Desktop Only */}
          <div className="hidden lg:inline-flex items-center gap-0 bg-white/5 rounded-full p-0.5 border border-white/10">
            <Button
              variant="ghost"
              className={cn(
                "h-7 w-7 rounded-full p-0 flex items-center justify-center",
                viewMode === 'grid' 
                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              onClick={() => {
                setViewMode('grid');
                window.dispatchEvent(new CustomEvent('cloud-view-mode', { detail: 'grid' }));
              }}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-7 w-7 rounded-full p-0 flex items-center justify-center",
                viewMode === 'list' 
                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              onClick={() => {
                setViewMode('list');
                window.dispatchEvent(new CustomEvent('cloud-view-mode', { detail: 'list' }));
              }}
              title="List view"
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh - Reload files and folders from server"
            aria-label="Refresh files"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          {/* Dashboard Button - Hidden on Mobile */}
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hidden sm:flex text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
            onClick={switchToDashboard}
            title="Go to Dashboard - Switch to main dashboard"
            aria-label="Dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Button>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 p-0 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
                  title={`User profile - ${userName}`}
                  aria-label="User menu"
                >
                  <span className="text-xs font-semibold text-white">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-gradient-to-b from-gray-950 to-gray-900 border border-white/10 text-white shadow-xl"
            >
              <DropdownMenuLabel className="font-normal py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-gray-400">Cloud Storage Manager</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={switchToDashboard}
                className="gap-3 py-2.5 cursor-pointer hover:bg-white/10 focus:bg-white/10 transition-colors"
                title="Switch to main dashboard view"
              >
                <LayoutDashboard className="h-4 w-4 text-gray-400" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-3 py-2.5 cursor-pointer hover:bg-white/10 focus:bg-white/10 transition-colors"
                title="Configure cloud storage settings"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                className="gap-3 py-2.5 cursor-pointer hover:bg-white/10 focus:bg-white/10 transition-colors"
                title="View keyboard shortcuts and tips"
                onClick={() => setShowShortcutsDialog(true)}
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="gap-3 py-2.5 cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 text-red-400 transition-colors"
                title="Sign out of your account"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar - Visible only on small screens */}
      <div className="block xs:hidden border-t border-white/5 bg-white/2 px-4 py-2">
        <form onSubmit={handleSearch}>
          <motion.div 
            className={cn(
              "relative flex items-center bg-white/5 rounded-full transition-all duration-200 border",
              searchFocused ? "bg-white/10 border-amber-500/50 shadow-lg shadow-amber-500/10" : "border-white/10 hover:border-white/20"
            )}
            animate={searchFocused ? { scale: 1.01 } : { scale: 1 }}
          >
            <Search className="h-4 w-4 text-gray-400 ml-3 flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 px-2 text-sm"
              aria-label="Search cloud storage"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="mr-1 h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        </form>
      </div>

      {/* Breadcrumb Navigation - Tablet and above */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="hidden md:flex items-center gap-2 text-sm px-4 py-2.5 border-t border-white/5 bg-white/1 overflow-x-auto">
          <button
            onClick={() => router.push('/drive')}
            className="text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap flex-shrink-0"
          >
            My Drive
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-shrink-0">
              <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <button
                onClick={() => router.push(crumb.path)}
                className="text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Master these shortcuts to work faster in Cloud Storage
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
              <h3 className="font-semibold text-amber-400 mb-3">Selection</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Click item</span>
                  <span className="text-gray-500 font-mono">Select</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Ctrl/Cmd + Click</span>
                  <span className="text-gray-500 font-mono">Multi-select</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Shift + Click</span>
                  <span className="text-gray-500 font-mono">Range select</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Ctrl/Cmd + A</span>
                  <span className="text-gray-500 font-mono">Select all</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Escape</span>
                  <span className="text-gray-500 font-mono">Deselect</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-3">Actions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Double-click</span>
                  <span className="text-gray-500 font-mono">Open/Preview</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Delete key</span>
                  <span className="text-gray-500 font-mono">Move to trash</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Right-click</span>
                  <span className="text-gray-500 font-mono">Context menu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 col-span-2">See all options in</span>
                </div>
                <div className="text-gray-400 text-xs">the More menu (⋮) on each item</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
