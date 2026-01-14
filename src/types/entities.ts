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
