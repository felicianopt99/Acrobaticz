"use client";

import { useAppContext } from '@/contexts/AppContext';
import type { EquipmentItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, FileText, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { WorkLogDialog } from './WorkLogDialog';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslate } from '@/contexts/TranslationContext';

interface EquipmentDetailViewProps {
  equipmentId: string;
  onBack?: () => void;
}

export function EquipmentDetailView({ equipmentId, onBack }: EquipmentDetailViewProps) {
  const { equipment } = useAppContext();
  const router = useRouter();
  const [isWorkLogDialogOpen, setIsWorkLogDialogOpen] = useState(false);

  const { translated: backText } = useTranslate('Back');
  const { translated: addLogText } = useTranslate('Add Log');
  const { translated: maintenanceHistoryText } = useTranslate('Maintenance History');
  const { translated: totalCostText } = useTranslate('Total Cost');
  const { translated: maintenanceTimesText } = useTranslate('Times Maintained');
  const { translated: lastMaintenanceText } = useTranslate('Last Maintenance');
  const { translated: avgDaysText } = useTranslate('Avg Days to Complete');
  const { translated: noLogsText } = useTranslate('No maintenance logs yet');

  const equipmentItem = equipment.find(e => e.id === equipmentId);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!equipmentItem?.maintenanceHistory || equipmentItem.maintenanceHistory.length === 0) {
      return {
        totalCost: 0,
        maintenanceCount: 0,
        lastMaintenanceDate: null,
        avgDaysToComplete: 0,
      };
    }

    const logs = equipmentItem.maintenanceHistory;
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const maintenanceCount = logs.length;
    const lastMaintenanceDate = logs.length > 0 ? logs[0].date : null;

    // Calculate average days to complete (approximation: assuming logs are in order)
    let totalDays = 0;
    let completedLogsCount = 0;
    for (let i = 0; i < logs.length - 1; i++) {
      const daysBetween = differenceInDays(logs[i].date, logs[i + 1].date);
      if (daysBetween > 0) {
        totalDays += daysBetween;
        completedLogsCount++;
      }
    }
    const avgDaysToComplete = completedLogsCount > 0 ? Math.round(totalDays / completedLogsCount) : 0;

    return {
      totalCost,
      maintenanceCount,
      lastMaintenanceDate,
      avgDaysToComplete,
    };
  }, [equipmentItem]);

  const getStatusColor = (status: string) => {
    if (status === 'damaged') return 'bg-red-500';
    if (status === 'maintenance') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'damaged') return 'destructive';
    if (status === 'maintenance') return 'secondary';
    return 'outline';
  };

  if (!equipmentItem) {
    return (
      <div className="p-6">
        <Button onClick={onBack || (() => router.back())} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Equipment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <Button 
            onClick={onBack || (() => router.back())} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{equipmentItem.name}</h1>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(equipmentItem.status)}`}></div>
            </div>
            <p className="text-muted-foreground">{equipmentItem.description}</p>
          </div>
        </div>
        <Button onClick={() => setIsWorkLogDialogOpen(true)} className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> {addLogText}
        </Button>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusBadgeVariant(equipmentItem.status)}>
              {equipmentItem.status.charAt(0).toUpperCase() + equipmentItem.status.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{equipmentItem.location}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{equipmentItem.quantity}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">${equipmentItem.dailyRate.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              YTD maintenance spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{maintenanceTimesText}</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.maintenanceCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Work orders recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{lastMaintenanceText}</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {metrics.lastMaintenanceDate 
                ? format(new Date(metrics.lastMaintenanceDate), 'MMM d')
                : 'Never'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.lastMaintenanceDate 
                ? `${differenceInDays(new Date(), new Date(metrics.lastMaintenanceDate))} days ago`
                : 'No history'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{avgDaysText}</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.avgDaysToComplete}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg completion time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance History */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {maintenanceHistoryText}
            </CardTitle>
            <Badge variant="outline">{equipmentItem.maintenanceHistory?.length || 0}</Badge>
          </div>
          <CardDescription>
            Complete record of all maintenance and repair work
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!equipmentItem.maintenanceHistory || equipmentItem.maintenanceHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{noLogsText}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsWorkLogDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> {addLogText}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {equipmentItem.maintenanceHistory
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log, index) => (
                  <div 
                    key={log.id} 
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      {log.cost ? (
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          {log.cost.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No cost</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Log Dialog */}
      <WorkLogDialog 
        isOpen={isWorkLogDialogOpen}
        onOpenChange={setIsWorkLogDialogOpen}
        equipmentItem={equipmentItem}
      />
    </div>
  );
}
