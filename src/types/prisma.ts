import { Prisma } from '@prisma/client'

/**
 * Tipos expandidos do Prisma para uso em todo o app
 */

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true
    images: true
    supplier: true
  }
}>

export type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: {
    products: {
      include: {
        images: true
        supplier: true
      }
    }
  }
}>

export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    catalogs: {
      include: {
        products: {
          include: {
            category: true
            images: true
          }
        }
      }
    }
    orders: true
  }
}>

export type CatalogWithProducts = Prisma.CatalogGetPayload<{
  include: {
    client: true
    products: {
      include: {
        category: true
        images: true
        supplier: true
      }
    }
  }
}>

export type ImageWithProduct = Prisma.ImageGetPayload<{
  include: {
    product: true
  }
}>

export type SupplierWithProducts = Prisma.SupplierGetPayload<{
  include: {
    products: true
  }
}>
