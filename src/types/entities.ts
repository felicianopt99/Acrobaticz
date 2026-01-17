/**
 * Tipos de entidades para listagens e tabelas
 */

export interface ProductColumn {
  id: string
  name: string
  price: number
  category: string
  stock: number
  status: 'available' | 'unavailable'
  image?: string
}

export interface CategoryColumn {
  id: string
  name: string
  description?: string
  productCount: number
}

export interface ClientColumn {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
  name: string
  image?: string
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export interface FilterOptions {
  categories?: string[]
  priceRange?: [number, number]
  search?: string
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'popular'
  availability?: 'all' | 'available' | 'unavailable'
}

/**
 * Cloud Storage Types - Synchronize with Backend
 */

export interface CloudFile {
  id: string
  name: string
  path: string
  size: number
  mimeType: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  ownerId: string
  folderId?: string | null
  isShared: boolean
  permissions?: string[]
}

export interface CloudFolder {
  id: string
  name: string
  path: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  ownerId: string
  parentFolderId?: string | null
  isShared: boolean
  fileCount: number
  subfolderCount: number
  permissions?: string[]
}

export interface CustomizationSettings {
  companyName?: string
  companyTagline?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  pdfFooterMessage?: string
  emailTemplate?: string
  themePreset?: 'light' | 'dark' | 'auto'
}

export interface CloudStorageQuota {
  totalStorage: number // bytes
  usedStorage: number // bytes
  availableStorage: number // bytes
  fileCount: number
  maxFileSize: number // bytes
  maxUploadSize: number // bytes
}
