import type { UserRole, RolePermissions } from '@/types';
import { normalizeRole, getRoleDisplayName as getDisplayName } from '@/lib/roles';

// Internal permissions map using lowercase keys for consistency
const ROLE_PERMISSIONS_MAP: Record<string, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canManageEquipment: true,
    canManageClients: true,
    canManageEvents: true,
    canManageQuotes: true,
    canManageRentals: true,
    canViewReports: true,
    canManageMaintenance: true,
    canManagePartners: true,
  },
  manager: {
    canManageUsers: false,
    canManageEquipment: true,
    canManageClients: true,
    canManageEvents: true,
    canManageQuotes: true,
    canManageRentals: true,
    canViewReports: true,
    canManageMaintenance: true,
    canManagePartners: true,
  },
  technician: {
    canManageUsers: false,
    canManageEquipment: true,
    canManageClients: false,
    canManageEvents: false,
    canManageQuotes: false,
    canManageRentals: true,
    canViewReports: false,
    canManageMaintenance: true,
    canManagePartners: false,
  },
  employee: {
    canManageUsers: false,
    canManageEquipment: false,
    canManageClients: true,
    canManageEvents: true,
    canManageQuotes: true,
    canManageRentals: true,
    canViewReports: false,
    canManageMaintenance: false,
    canManagePartners: false,
  },
  viewer: {
    canManageUsers: false,
    canManageEquipment: false,
    canManageClients: false,
    canManageEvents: false,
    canManageQuotes: false,
    canManageRentals: false,
    canViewReports: false,
    canManageMaintenance: false,
    canManagePartners: false,
  },
};

// Backwards compatibility export with capitalized keys
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: ROLE_PERMISSIONS_MAP.admin,
  Manager: ROLE_PERMISSIONS_MAP.manager,
  Technician: ROLE_PERMISSIONS_MAP.technician,
  Employee: ROLE_PERMISSIONS_MAP.employee,
  Viewer: ROLE_PERMISSIONS_MAP.viewer,
};

export function getRolePermissions(role: UserRole | string): RolePermissions {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS_MAP[normalized] || ROLE_PERMISSIONS_MAP.viewer;
}

export function hasPermission(role: UserRole | string, permission: keyof RolePermissions): boolean {
  const normalized = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS_MAP[normalized] || ROLE_PERMISSIONS_MAP.viewer;
  return permissions[permission];
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full system access including user management',
  manager: 'Business operations management (no user management)',
  technician: 'Equipment and maintenance focus',
  employee: 'Basic operations and customer management',
  viewer: 'Read-only access to view data',
};

// Backwards compatible version with capitalized keys
export const ROLE_DESCRIPTIONS_DISPLAY: Record<UserRole, string> = {
  Admin: 'Full system access including user management',
  Manager: 'Business operations management (no user management)',
  Technician: 'Equipment and maintenance focus',
  Employee: 'Basic operations and customer management',
  Viewer: 'Read-only access to view data',
};