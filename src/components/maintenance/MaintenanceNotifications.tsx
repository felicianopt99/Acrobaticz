"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, isAfter } from "date-fns";
import type { EquipmentItem, MaintenanceLog } from "@/types";

export interface MaintenanceNotification {
  id: string;
  type: "overdue-repair" | "ready-for-pickup" | "upcoming-maintenance" | "cost-threshold";
  equipmentId: string;
  equipmentName: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  actionUrl?: string;
}

interface NotificationCheckResult {
  notifications: MaintenanceNotification[];
  lastChecked: Date;
}

const COST_THRESHOLD = 500; // Alert if outside repair cost reaches $500
const OVERDUE_DAYS = 0; // Alert if return date has passed

export function MaintenanceNotifications() {
  const { equipment } = useAppContext();
  const { toast } = useToast();
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    const notifications = checkForNotifications(equipment);
    
    notifications.forEach((notification) => {
      // Only show each notification once per session
      if (!shownNotifications.has(notification.id)) {
        displayNotification(notification);
        setShownNotifications(prev => new Set(prev).add(notification.id));
      }
    });
  }, [equipment]);

  function displayNotification(notification: MaintenanceNotification) {
    const toastVariant = notification.severity === "error" ? "destructive" : "default";
    
    toast({
      title: notification.title,
      description: notification.message,
      variant: toastVariant,
    });
  }

  return null; // This component only manages notifications, doesn't render UI
}

export function checkForNotifications(equipment: EquipmentItem[]): MaintenanceNotification[] {
  const notifications: MaintenanceNotification[] = [];
  const now = new Date();

  equipment.forEach((item) => {
    if (!item.maintenanceHistory || item.maintenanceHistory.length === 0) {
      return;
    }

    // Check for outside repairs that are overdue for return
    const overdueRepairs = item.maintenanceHistory.filter(
      (log) =>
        log.isOutsideRepair &&
        log.expectedReturnDate &&
        log.repairStatus !== "returned" &&
        isAfter(now, new Date(log.expectedReturnDate))
    );

    overdueRepairs.forEach((log) => {
      const daysOverdue = differenceInDays(now, new Date(log.expectedReturnDate!));
      notifications.push({
        id: `overdue-${item.id}-${log.id}`,
        type: "overdue-repair",
        equipmentId: item.id,
        equipmentName: item.name,
        title: `${item.name} - Overdue from Repair`,
        message: `This equipment has been overdue from repair for ${daysOverdue} day(s). Vendor: ${log.vendorName || "Unknown"}. Expected return: ${new Date(log.expectedReturnDate!).toLocaleDateString()}`,
        severity: "error",
        actionUrl: `/maintenance/${item.id}`,
      });
    });

    // Check for repairs that are ready for pickup
    const readyForPickup = item.maintenanceHistory.filter(
      (log) =>
        log.isOutsideRepair &&
        log.repairStatus === "ready-for-pickup"
    );

    readyForPickup.forEach((log) => {
      notifications.push({
        id: `ready-${item.id}-${log.id}`,
        type: "ready-for-pickup",
        equipmentId: item.id,
        equipmentName: item.name,
        title: `${item.name} - Ready for Pickup`,
        message: `This equipment is ready for pickup from ${log.vendorName || "the vendor"}. Reference: ${log.referenceNumber || "N/A"}`,
        severity: "info",
        actionUrl: `/maintenance/${item.id}`,
      });
    });

    // Check for high-cost repairs
    const highCostRepairs = item.maintenanceHistory.filter(
      (log) =>
        log.isOutsideRepair &&
        log.cost &&
        log.cost >= COST_THRESHOLD &&
        log.repairStatus !== "returned"
    );

    highCostRepairs.forEach((log) => {
      notifications.push({
        id: `cost-${item.id}-${log.id}`,
        type: "cost-threshold",
        equipmentId: item.id,
        equipmentName: item.name,
        title: `${item.name} - High Repair Cost Alert`,
        message: `Outside repair cost has reached $${log.cost}. Vendor: ${log.vendorName}. Reference: ${log.referenceNumber || "N/A"}`,
        severity: "warning",
        actionUrl: `/maintenance/${item.id}`,
      });
    });

    // Check for incomplete maintenance work in progress
    const inProgressWork = item.maintenanceHistory.filter(
      (log) =>
        log.workStatus === "in-progress" &&
        !log.isOutsideRepair
    );

    if (inProgressWork.length > 0) {
      notifications.push({
        id: `ongoing-${item.id}`,
        type: "upcoming-maintenance",
        equipmentId: item.id,
        equipmentName: item.name,
        title: `${item.name} - Maintenance In Progress`,
        message: `${inProgressWork.length} maintenance task(s) are currently in progress. Please complete or update status.`,
        severity: "info",
        actionUrl: `/maintenance/${item.id}`,
      });
    }
  });

  return notifications;
}

/**
 * Hook to get all current notifications
 * Useful for displaying notification list or badge counts
 */
export function useMaintenanceNotifications(equipment: EquipmentItem[]) {
  const [notifications, setNotifications] = useState<MaintenanceNotification[]>([]);

  useEffect(() => {
    setNotifications(checkForNotifications(equipment));
  }, [equipment]);

  const notificationCount = notifications.length;
  const errorCount = notifications.filter((n) => n.severity === "error").length;
  const warningCount = notifications.filter((n) => n.severity === "warning").length;

  return {
    notifications,
    notificationCount,
    errorCount,
    warningCount,
  };
}
