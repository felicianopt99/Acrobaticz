import type { EquipmentItem, QuantityByStatus } from '@/types';

/**
 * Calculate total quantity from quantityByStatus breakdown
 */
export function getTotalQuantity(quantityByStatus: QuantityByStatus): number {
  return quantityByStatus.good + quantityByStatus.damaged + quantityByStatus.maintenance;
}

/**
 * Get available quantity for rental (only 'good' status units)
 */
export function getAvailableQuantity(equipment: EquipmentItem | any, rentedOutCount: number = 0): number {
  const qbs = equipment.quantityByStatus as QuantityByStatus;
  if (!qbs) return equipment.quantity || 0; // Fallback to old field
  return Math.max(0, qbs.good - rentedOutCount);
}

/**
 * Check if equipment has available units for rental
 */
export function hasAvailableUnits(equipment: EquipmentItem | any, quantityNeeded: number = 1): boolean {
  const qbs = equipment.quantityByStatus as QuantityByStatus;
  if (!qbs) return (equipment.quantity || 0) >= quantityNeeded; // Fallback to old field
  return qbs.good >= quantityNeeded;
}

/**
 * Initialize quantityByStatus when creating new equipment
 */
export function initializeQuantityByStatus(
  quantity: number,
  status: string
): QuantityByStatus {
  const defaultQbs: QuantityByStatus = {
    good: 0,
    damaged: 0,
    maintenance: 0,
  };

  if (status === 'good') {
    defaultQbs.good = quantity;
  } else if (status === 'damaged') {
    defaultQbs.damaged = quantity;
  } else if (status === 'maintenance') {
    defaultQbs.maintenance = quantity;
  } else {
    // Default to good if status is unknown
    defaultQbs.good = quantity;
  }

  return defaultQbs;
}

/**
 * Validate quantityByStatus structure
 */
export function isValidQuantityByStatus(obj: any): obj is QuantityByStatus {
  if (!obj || typeof obj !== 'object') return false;
  return (
    typeof obj.good === 'number' &&
    typeof obj.damaged === 'number' &&
    typeof obj.maintenance === 'number' &&
    obj.good >= 0 &&
    obj.damaged >= 0 &&
    obj.maintenance >= 0
  );
}

/**
 * Ensure quantityByStatus is properly formatted
 */
export function ensureQuantityByStatus(
  quantityByStatus: any
): QuantityByStatus {
  if (isValidQuantityByStatus(quantityByStatus)) {
    return quantityByStatus;
  }

  return {
    good: 0,
    damaged: 0,
    maintenance: 0,
  };
}

/**
 * Update quantity for a specific status
 */
export function updateQuantityByStatus(
  current: QuantityByStatus,
  status: 'good' | 'damaged' | 'maintenance',
  newQuantity: number
): QuantityByStatus {
  return {
    ...current,
    [status]: Math.max(0, newQuantity),
  };
}

/**
 * Adjust quantity for a specific status by delta (positive or negative)
 */
export function adjustQuantityByStatus(
  current: QuantityByStatus,
  status: 'good' | 'damaged' | 'maintenance',
  delta: number
): QuantityByStatus {
  const newQuantity = (current[status] || 0) + delta;
  return updateQuantityByStatus(current, status, newQuantity);
}

/**
 * Get status breakdown as a human-readable string
 */
export function getStatusBreakdownString(quantityByStatus: QuantityByStatus): string {
  return `${quantityByStatus.good} good, ${quantityByStatus.damaged} damaged, ${quantityByStatus.maintenance} in maintenance`;
}

/**
 * Check if all units are in a specific status
 */
export function allUnitsInStatus(
  quantityByStatus: QuantityByStatus,
  status: 'good' | 'damaged' | 'maintenance'
): boolean {
  const total = getTotalQuantity(quantityByStatus);
  return total > 0 && quantityByStatus[status] === total;
}

/**
 * Check if equipment has any units in maintenance
 */
export function hasUnitsInMaintenance(quantityByStatus: QuantityByStatus): boolean {
  return quantityByStatus.maintenance > 0;
}

/**
 * Check if equipment has any damaged units
 */
export function hasUnitsInDamaged(quantityByStatus: QuantityByStatus): boolean {
  return quantityByStatus.damaged > 0;
}
