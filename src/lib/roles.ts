// Centralized role management for consistent role handling across the application
// All roles are stored and compared in lowercase to avoid case-sensitivity issues

import type { UserRole } from '@/types';

// Canonical role values (lowercase for storage and comparison)
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TECHNICIAN: 'technician',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer',
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: RoleValue[] = [
  ROLES.VIEWER,
  ROLES.EMPLOYEE,
  ROLES.TECHNICIAN,
  ROLES.MANAGER,
  ROLES.ADMIN,
];

// Normalize any role string to lowercase for consistent comparison
export function normalizeRole(role: string | undefined | null): RoleValue {
  if (!role) return ROLES.VIEWER;
  return role.toLowerCase() as RoleValue;
}

// Check if a user role has permission (is in the allowed roles list)
export function hasRole(userRole: string | undefined | null, allowedRoles: RoleValue[]): boolean {
  if (!userRole) return false;
  const normalized = normalizeRole(userRole);
  return allowedRoles.includes(normalized);
}

// Check if user has at least the minimum required role level
export function hasMinimumRole(userRole: string | undefined | null, minimumRole: RoleValue): boolean {
  if (!userRole) return false;
  const normalized = normalizeRole(userRole);
  const userLevel = ROLE_HIERARCHY.indexOf(normalized);
  const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);
  return userLevel >= requiredLevel;
}

// Check if user is admin
export function isAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === ROLES.ADMIN;
}

// Check if user is admin or manager
export function isAdminOrManager(role: string | undefined | null): boolean {
  return hasRole(role, [ROLES.ADMIN, ROLES.MANAGER]);
}

// Predefined role groups for common permission patterns
export const ROLE_GROUPS = {
  // Full access
  ALL: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.EMPLOYEE, ROLES.VIEWER] as RoleValue[],
  
  // Administrative functions
  ADMIN_ONLY: [ROLES.ADMIN] as RoleValue[],
  
  // Management functions (partners, reports, etc.)
  MANAGEMENT: [ROLES.ADMIN, ROLES.MANAGER] as RoleValue[],
  
  // Operational functions (inventory, rentals, etc.)
  OPERATIONS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN] as RoleValue[],
  
  // Staff functions (clients, quotes, etc.)
  STAFF: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.EMPLOYEE] as RoleValue[],
  
  // Read-only access
  VIEWERS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.EMPLOYEE, ROLES.VIEWER] as RoleValue[],
};

// Display name for roles (for UI)
export function getRoleDisplayName(role: string | undefined | null): string {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case ROLES.ADMIN:
      return 'Admin';
    case ROLES.MANAGER:
      return 'Manager';
    case ROLES.TECHNICIAN:
      return 'Technician';
    case ROLES.EMPLOYEE:
      return 'Employee';
    case ROLES.VIEWER:
      return 'Viewer';
    default:
      return 'Unknown';
  }
}

// Convert display name or any format to normalized role
export function toNormalizedRole(role: string): RoleValue {
  return normalizeRole(role);
}

// Get all valid role values
export function getAllRoles(): RoleValue[] {
  return Object.values(ROLES);
}

// Validate if a string is a valid role
export function isValidRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return getAllRoles().includes(normalizeRole(role));
}
