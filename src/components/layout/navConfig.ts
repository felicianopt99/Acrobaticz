import { Home, CalendarDays, Users, FileText, Package, Wrench, Shield, Settings, Palette, Users2, FileType, Languages, Handshake, Cloud, HardDrive } from 'lucide-react';
import { ROLES, ROLE_GROUPS, type RoleValue } from '@/lib/roles';

export type NavItem = {
  href?: string;
  label: string;
  icon?: any;
  requiredRole: RoleValue[];
  subItems?: Array<{ href: string; label: string }>
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, requiredRole: ROLE_GROUPS.ALL },
  { label: 'Inventory', icon: Package, requiredRole: ROLE_GROUPS.ALL, subItems: [
    { href: '/inventory', label: 'View Inventory' },
    { href: '/categories', label: 'Categories' }
  ] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, requiredRole: ROLE_GROUPS.OPERATIONS },
  { href: '/clients', label: 'Clients', icon: Users, requiredRole: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE] },
  { href: '/partners', label: 'Partners', icon: Handshake, requiredRole: ROLE_GROUPS.MANAGEMENT },
  { href: '/team', label: 'Team', icon: Users2, requiredRole: ROLE_GROUPS.ALL },
  { label: 'Rentals', icon: CalendarDays, requiredRole: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE], subItems: [
    { href: '/rentals/calendar', label: 'Event Calendar' },
    { href: '/events', label: 'Events' }
  ] },
  { label: 'Quotes', icon: FileText, requiredRole: ROLE_GROUPS.ALL, subItems: [
    { href: '/quotes', label: 'Quotes' },
    { href: '/quotes/services', label: 'Services' },
    { href: '/quotes/fees', label: 'Fees' }
  ] },
];

export const adminItems: NavItem[] = [
  { href: '/admin/users', label: 'User Management', icon: Shield, requiredRole: ROLE_GROUPS.ADMIN_ONLY },
  { href: '/admin/translations', label: 'Translation Management', icon: Languages, requiredRole: ROLE_GROUPS.ADMIN_ONLY },
  { href: '/admin/customization', label: 'Customization', icon: Palette, requiredRole: ROLE_GROUPS.ADMIN_ONLY },
  { href: '/admin/pdf-branding', label: 'PDF Branding', icon: FileType, requiredRole: ROLE_GROUPS.ADMIN_ONLY },
  { href: '/admin/storage-dashboard', label: 'Storage Dashboard', icon: HardDrive, requiredRole: ROLE_GROUPS.ADMIN_ONLY },
  { href: '/admin/settings', label: 'System Settings', icon: Settings, requiredRole: ROLE_GROUPS.ADMIN_ONLY },
];
