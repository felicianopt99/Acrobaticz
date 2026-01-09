
"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { EquipmentItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wrench, Search, ChevronDown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { WorkLogDialog } from './WorkLogDialog';
import { MaintenanceNotifications, useMaintenanceNotifications } from './MaintenanceNotifications';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslate } from '@/contexts/TranslationContext';

export function MaintenanceManager() {
  const { equipment, isDataLoaded } = useAppContext();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Get maintenance notifications
  const { notificationCount, errorCount } = useMaintenanceNotifications(equipment);

  // Translation hooks
  const { translated: loadingText } = useTranslate('Loading maintenance data...');
  const { translated: maintenanceText } = useTranslate('Maintenance');
  const { translated: createMaintenanceText } = useTranslate('Add Work Log');
  const { translated: noItemsText } = useTranslate('No items that need attention.');
  const { translated: allGoodText } = useTranslate('All equipment is in good condition.');
  const { translated: nameText } = useTranslate('Name');
  const { translated: statusText } = useTranslate('Status');
  const { translated: lastMaintenanceText } = useTranslate('Last Maintenance');
  const { translated: actionsText } = useTranslate('Actions');
  const { translated: addLogText } = useTranslate('Add Log');
  const { translated: viewHistoryText } = useTranslate('View History');

  const [isWorkLogDialogOpen, setIsWorkLogDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'maintenance' | 'damaged'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'location'>('name');

  const itemsInMaintenance = useMemo(() => {
    return equipment.filter(item => item.status === 'maintenance' || item.status === 'damaged');
  }, [equipment]);

  // Apply search, filter, and sort
  const filteredItems = useMemo(() => {
    let results = itemsInMaintenance;

    // Filter by status
    if (statusFilter !== 'all') {
      results = results.filter(item => item.status === statusFilter);
    }

    // Search by name or location
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else if (sortBy === 'location') {
        return a.location.localeCompare(b.location);
      }
      return 0;
    });

    return results;
  }, [itemsInMaintenance, searchQuery, statusFilter, sortBy]);

  const handleAddLogClick = (item: EquipmentItem | null = null) => {
    setSelectedEquipment(item);
    setIsWorkLogDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsWorkLogDialogOpen(false);
    setSelectedEquipment(null);
  }

  // Get status color
  const getStatusColor = (status: string) => {
    if (status === 'damaged') return 'bg-red-500';
    if (status === 'maintenance') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'damaged') return 'destructive';
    return 'secondary';
  }

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{maintenanceText}</h2>
            {notificationCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {notificationCount}
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => handleAddLogClick()} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> {createMaintenanceText}
        </Button>
      </div>

      {/* Maintenance Notifications Component */}
      <MaintenanceNotifications />

      {/* Search and Filter Bar */}
      {itemsInMaintenance.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Search Input */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-48">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="w-full sm:w-40">
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{maintenanceText}</span>
            {itemsInMaintenance.length > 0 && (
              <Badge variant="outline" className="text-sm">
                {filteredItems.length} of {itemsInMaintenance.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Track items that are damaged or currently undergoing maintenance.</CardDescription>
        </CardHeader>
        <CardContent>
          {itemsInMaintenance.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
              <Wrench className="w-16 h-16 mb-4 text-primary/50" />
              <p className="text-xl mb-1">{noItemsText}</p>
              <p className="text-sm">{allGoodText}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
              <Search className="w-16 h-16 mb-4 text-primary/50" />
              <p className="text-lg">No results found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleAddLogClick(item)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(item.status)}`}></div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {item.maintenanceHistory?.length || 0} log entries
                        </span>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLogClick(item);
                          }} 
                          className="flex-1 h-8 text-xs"
                        >
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> {addLogText}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/maintenance/${item.id}`);
                          }} 
                          className="flex-1 h-8 text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Logs</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(item.status)}`}></div>
                            <span>{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{item.maintenanceHistory?.length || 0}</span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleAddLogClick(item)}
                            title="Add a new work log"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> {addLogText}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/maintenance/${item.id}`)}
                            title="View full equipment details"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Unified Work Log Dialog */}
      <WorkLogDialog 
        isOpen={isWorkLogDialogOpen}
        onOpenChange={handleDialogClose}
        equipmentItem={selectedEquipment || undefined}
      />
    </div>
  );
}
