"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, UserCircle, LogOut, User, Trash2, Cloud, Languages } from 'lucide-react';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { useTranslate } from '@/contexts/TranslationContext';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/types';
import { ClientOnly, useIsClient } from '@/hooks/useIsClient';
import { LanguageToggle } from '@/components/LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem } from '@/components/notifications/NotificationItem';

interface AppHeaderProps {
  title?: string;
  children?: React.ReactNode; // Added children prop to allow nested elements
  className?: string; // Added className prop to allow custom styling
}

export function AppHeader({ title, children, className }: AppHeaderProps) {
  const { currentUser, isAuthenticated } = useAppContext();
  const { logout } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isClient = useIsClient();

  // Translation hooks
  const { translated: notificationsText } = useTranslate('Notifications');
  const { translated: noNotificationsText } = useTranslate('No notifications');
  const { translated: profileText } = useTranslate('Profile');
  const { translated: logoutText } = useTranslate('Logout');

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetch(`/api/notifications?limit=20`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          const notifs = (data.notifications || []) as Notification[];
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.isRead).length);
        })
        .catch(err => {
          console.error('Failed to fetch notifications:', err);
          // Don't show error to user, just log it
          if (err.message.includes('NetworkError') || err.message === 'Failed to fetch') {
            console.warn('Network error when fetching notifications - this is likely temporary');
          }
        });
    }
  }, [isAuthenticated, currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    }
  };



  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
        console.warn('Network error when marking notification as read - this is likely temporary');
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const deleted = notifications.find(n => n.id === notificationId);
        if (deleted && !deleted.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds: unreadIds,
        }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-[9999] flex h-16 items-center justify-between px-6 pt-[env(safe-area-inset-top)] w-full glass-header ${className}`}
    >
      {/* Left side - Profile (only on mobile) */}
      <div className="flex items-center gap-1 flex-1 justify-start">
        <ClientOnly>
          {isAuthenticated && (
            <div className="md:hidden">
              {/* Profile Dropdown - Mobile Only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                    <UserCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="sr-only">Profile menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[99999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/20 dark:border-gray-700/20" align="start">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                      <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                        {currentUser?.username}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="w-fit mt-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      >
                        {currentUser?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <User className="mr-2 h-4 w-4" />
                    {profileText}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                  <DropdownMenuItem onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutText}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </ClientOnly>
      </div>

      {/* Center - Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-base font-medium truncate text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      
      {/* Custom children content */}
      {children && <div className="hidden md:flex items-center gap-3">{children}</div>}
      
      {/* Right side - Notifications (always visible when authenticated) */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <ClientOnly>
          <LanguageToggle />
          {isAuthenticated && (
            <>
              {/* Switch to Cloud */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-lg group"
                onClick={() => {
                  router.push('/drive');
                  setTimeout(() => {
                    router.refresh();
                  }, 100);
                }}
                title="Open Cloud Storage"
              >
                <Cloud className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
                <span className="sr-only">Cloud Storage</span>
              </Button>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-lg group">
                  <motion.div
                    animate={unreadCount > 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Bell className="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors" />
                  </motion.div>
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Badge className="h-6 w-6 rounded-full p-0 text-xs bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold border-2 border-white dark:border-gray-900 shadow-lg">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="sr-only">{notificationsText}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-96 max-h-[500px] z-[10000] bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl border border-gray-200/40 dark:border-gray-700/40 shadow-2xl rounded-xl overflow-hidden flex flex-col" align="end" style={{backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)'}}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notificationsText}</p>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Bell className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{noNotificationsText}</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-2 p-3">
                        {notifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <NotificationItem
                              notification={notification}
                              onMarkAsRead={markNotificationAsRead}
                              onDelete={deleteNotification}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markNotificationAsRead(notification.id);
                                }
                                if (notification.actionUrl) {
                                  window.location.href = notification.actionUrl;
                                }
                              }}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>
                  </div>
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                    <a
                      href="/notifications"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center w-full justify-center py-2"
                    >
                      View all notifications →
                    </a>
                  </div>
                )}
              </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </ClientOnly>
      </div>
    </header>
  );
}
