/**
 * Tipos para compatibilidade com catálogo público
 * Baseados no modelo EquipmentItem do Prisma
 */

export interface ProductImage {
  id: string
  url: string
  productId: string
}

export interface ProductCategory {
  id: string
  name: string
  icon?: string | null
  description?: string | null
}

export interface ProductWithRelations {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  images: ProductImage[]
  category: ProductCategory | null
  supplier: null
  createdAt: Date
  updatedAt: Date
  categoryId: string
  supplierId: string | null
}
