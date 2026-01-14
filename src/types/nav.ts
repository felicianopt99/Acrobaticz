/**
 * Tipos para navegacao e menus
 */

export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: React.ComponentType<{ className?: string }>
  label?: string
  description?: string
  badge?: string | number
}

export interface MainNavItem extends NavItem {
  items?: MainNavItem[]
}

export interface SidebarNavItem extends NavItem {
  items: SidebarNavItem[]
}

export interface FooterLink {
  title: string
  items: NavItem[]
}
