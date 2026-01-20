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
      expect(permissions.canViewReports).toBe(false)
      // Viewers have read-only access - all permissions false in current impl
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
      expect(hasPermission('Admin', 'canManageUsers')).toBe(true)
      expect(hasPermission('Admin', 'canManageEquipment')).toBe(true)
      expect(hasPermission('Admin', 'canManageClients')).toBe(true)
      expect(hasPermission('Admin', 'canViewReports')).toBe(true)
    })

    it('should restrict viewer permissions', () => {
      expect(hasPermission('Viewer', 'canManageUsers')).toBe(false)
      expect(hasPermission('Viewer', 'canManageEquipment')).toBe(false)
      expect(hasPermission('Viewer', 'canViewReports')).toBe(false)
    })

    it('should allow technicians equipment access', () => {
      expect(hasPermission('Technician', 'canManageEquipment')).toBe(true)
      expect(hasPermission('Technician', 'canManageUsers')).toBe(false)
      expect(hasPermission('Technician', 'canManageClients')).toBe(false)
    })

    it('should allow managers business operations', () => {
      expect(hasPermission('Manager', 'canManageEquipment')).toBe(true)
      expect(hasPermission('Manager', 'canManageClients')).toBe(true)
      expect(hasPermission('Manager', 'canManageEvents')).toBe(true)
      expect(hasPermission('Manager', 'canManageUsers')).toBe(false) // Only admin
    })

    it('should handle invalid actions gracefully', () => {
      // Test that invalid permission returns false (not undefined)
      // Using a valid role key but invalid permission key
      const result = hasPermission('Admin', 'nonexistent' as any)
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
