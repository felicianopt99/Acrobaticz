import { describe, it, expect } from 'vitest'
import { hasPermission, getRolePermissions } from '@/lib/permissions'
import type { UserRole } from '@/types'

describe('Permission System', () => {
  describe('getRolePermissions', () => {
    it('should return admin permissions with all access', () => {
      const permissions = getRolePermissions('Admin')
      
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canManageEquipment).toBe(true)
      expect(permissions.canManageClients).toBe(true)
      expect(permissions.canManageEvents).toBe(true)
      expect(permissions.canViewReports).toBe(true)
    })

    it('should return viewer permissions with limited access', () => {
      const permissions = getRolePermissions('Viewer')
      
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canViewReports).toBe(true)
      // Viewers can see but not modify
    })

    it('should return manager permissions', () => {
      const permissions = getRolePermissions('Manager')
      
      expect(permissions.canManageUsers).toBe(false) // Only admin can manage users
      expect(permissions.canManageEquipment).toBe(true)
      expect(permissions.canManageClients).toBe(true)
      expect(permissions.canManageEvents).toBe(true)
    })

    it('should return technician permissions', () => {
      const permissions = getRolePermissions('Technician')
      
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canManageEquipment).toBe(true)
      expect(permissions.canManageClients).toBe(false)
    })

    it('should return employee permissions', () => {
      const permissions = getRolePermissions('Employee')
      
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canManageEquipment).toBe(false)
      expect(permissions.canManageClients).toBe(true)
      expect(permissions.canManageEvents).toBe(true)
    })
  })

  describe('hasPermission', () => {
    it('should allow admin to access all actions', () => {
      expect(hasPermission('Admin', 'manage-users')).toBe(true)
      expect(hasPermission('Admin', 'manage-equipment')).toBe(true)
      expect(hasPermission('Admin', 'manage-clients')).toBe(true)
      expect(hasPermission('Admin', 'view-reports')).toBe(true)
    })

    it('should restrict viewer permissions', () => {
      expect(hasPermission('Viewer', 'manage-users')).toBe(false)
      expect(hasPermission('Viewer', 'manage-equipment')).toBe(false)
      expect(hasPermission('Viewer', 'view-reports')).toBe(true)
    })

    it('should allow technicians equipment access', () => {
      expect(hasPermission('Technician', 'manage-equipment')).toBe(true)
      expect(hasPermission('Technician', 'manage-users')).toBe(false)
      expect(hasPermission('Technician', 'manage-clients')).toBe(false)
    })

    it('should allow managers business operations', () => {
      expect(hasPermission('Manager', 'manage-equipment')).toBe(true)
      expect(hasPermission('Manager', 'manage-clients')).toBe(true)
      expect(hasPermission('Manager', 'manage-events')).toBe(true)
      expect(hasPermission('Manager', 'manage-users')).toBe(false) // Only admin
    })

    it('should handle invalid actions gracefully', () => {
      // @ts-ignore - testing invalid action
      const result = hasPermission('Admin', 'invalid-action')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Role hierarchy', () => {
    it('should establish proper role hierarchy', () => {
      const roles: UserRole[] = ['Admin', 'Manager', 'Technician', 'Employee', 'Viewer']
      
      // Admin should have most permissions
      const adminPerms = getRolePermissions('Admin')
      const adminPermCount = Object.values(adminPerms).filter(Boolean).length
      
      // Viewer should have least permissions
      const viewerPerms = getRolePermissions('Viewer')
      const viewerPermCount = Object.values(viewerPerms).filter(Boolean).length
      
      expect(adminPermCount).toBeGreaterThan(viewerPermCount)
    })
  })
})
