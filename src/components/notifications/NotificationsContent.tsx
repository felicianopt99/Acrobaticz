'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Trash2, Check, Trash, Bell, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { useTranslate } from '@/contexts/TranslationContext';

export function NotificationsContent() {
  const { translated: uiDashboardText } = useTranslate('Dashboard');
  const { translated: uiNotificationsText } = useTranslate('Notifications');
  const { translated: uiSearchText } = useTranslate('Search');
  const { translated: uiReadStatusText } = useTranslate('Read Status');
  const { translated: uiPriorityText } = useTranslate('Priority');
  const { translated: uiTypeText } = useTranslate('Type');
  const { translated: uiResetFiltersText } = useTranslate('Reset Filters');
  const { translated: uiDeleteText } = useTranslate('Delete');
  const { translated: uiMarkAsReadText } = useTranslate('Mark as Read');
  const { translated: uiSelectAllText } = useTranslate('Select All');
  const { translated: uiDeselectAllText } = useTranslate('Deselect All');
  const { translated: uiLoadingText } = useTranslate('Loading');
  const { translated: uiNoNotificationsText } = useTranslate('No notifications found');

  const {
    notifications,
    markAsRead,
    markAsReadBatch,
    deleteNotification,
    deleteNotificationsBatch,
    fetchNotifications,
    isLoading,
  } = useNotifications();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || n.type === filterType;
      const matchesPriority = filterPriority === 'all' || n.priority === filterPriority;
      const matchesReadStatus =
        filterReadStatus === 'all' ||
        (filterReadStatus === 'unread' && !n.isRead) ||
        (filterReadStatus === 'read' && n.isRead);

      return matchesSearch && matchesType && matchesPriority && matchesReadStatus;
    });
  }, [notifications, searchQuery, filterType, filterPriority, filterReadStatus]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  }, [selectedIds.size, filteredNotifications]);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'border-l-destructive';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      default:
        return 'border-l-muted';
    }
  };

  const handleMarkSelectedAsRead = useCallback(async () => {
    if (selectedIds.size > 0) {
      try {
        await markAsReadBatch(Array.from(selectedIds));
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  }, [selectedIds, markAsReadBatch]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size > 0) {
      try {
        await deleteNotificationsBatch(Array.from(selectedIds));
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Error deleting notifications:', error);
      }
    }
  }, [selectedIds, deleteNotificationsBatch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchNotifications({ limit: 50 });
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchNotifications]);

  const resetFilters = useCallback(() => {
    setFilterType('all');
    setFilterPriority('all');
    setFilterReadStatus('all');
    setSearchQuery('');
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-2 md:px-6 pt-2 md:pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">{uiDashboardText}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{uiNotificationsText}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Bell className="h-6 w-6" />
              {uiNotificationsText}
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2 w-full sm:w-auto"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 md:p-6 mb-6 space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block">{uiSearchText}</label>
            <Input
              placeholder={`${uiSearchText} notifications...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">{uiReadStatusText}</label>
              <Select value={filterReadStatus} onValueChange={(value: any) => setFilterReadStatus(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">{uiPriorityText}</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">{uiTypeText}</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="conflict">Conflict</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                  <SelectItem value="event_timeline">Event Timeline</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="critical_event">Critical Event</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="equipment_available">Equipment Available</SelectItem>
                  <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
              >
                {uiResetFiltersText}
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-accent border rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm font-medium">
              {selectedIds.size} notification{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkSelectedAsRead}
                disabled={isLoading}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {uiMarkAsReadText}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Trash className="h-4 w-4" />
                    {uiDeleteText} ({selectedIds.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete Notifications</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedIds.size} notification{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
                  </AlertDialogDescription>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{uiLoadingText}...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">{uiNoNotificationsText}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All Bar */}
            <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size === 0 ? uiSelectAllText : uiDeselectAllText}
              </span>
            </div>

            {/* Notification Items */}
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-card border-l-4 ${getPriorityColor(
                  notification.priority
                )} border rounded-lg p-4 transition hover:bg-accent`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(notification.id)}
                    onCheckedChange={() => toggleSelect(notification.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityVariant(notification.priority) as any}>
                          {notification.priority}
                        </Badge>
                        {!notification.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <time>{new Date(notification.createdAt).toLocaleString()}</time>
                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="text-primary hover:underline font-medium"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this notification?
                        </AlertDialogDescription>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteNotification(notification.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
