'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart } from 'lucide-react'
import { ProductWithRelations } from '@/types/prisma'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: ProductWithRelations
  onAddToCart?: (product: ProductWithRelations) => void
  onFavorite?: (product: ProductWithRelations) => void
  isFavorite?: boolean
  isLink?: boolean
  href?: string
}

export function ProductCard({
  product,
  onAddToCart,
  onFavorite,
  isFavorite = false,
  isLink = false,
  href = `/products/${product.id}`,
}: ProductCardProps) {
  const image = product.images?.[0]
  const isOutOfStock = !product.stock || product.stock <= 0
  
  // Debug first render
  if (typeof window !== 'undefined') {
    console.log('🎴 ProductCard rendered:', product.name, '| Image:', image?.url || 'NO IMAGE')
  }

  const cardContent = (
    <Card className="h-full flex flex-col bg-neutral-800 border-neutral-700 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group">
      {/* Image Header */}
      <CardHeader className="p-0 overflow-hidden relative">
        <div className="relative h-64 w-full bg-neutral-900">
          {image ? (
            <Image
              src={image.url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
              <div className="text-neutral-500 text-sm">No image</div>
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-10">
            {isOutOfStock ? (
              <Badge variant="destructive" className="bg-red-500/90">
                Out of Stock
              </Badge>
            ) : (
              <Badge className="bg-green-500/90">In Stock</Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onFavorite?.(product)
            }}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-all duration-300',
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-white hover:text-red-500'
              )}
            />
          </button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        {product.category && (
          <Badge variant="outline" className="w-fit mb-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
            {product.category.name}
          </Badge>
        )}

        <CardTitle className="text-base font-bold text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
          {product.name}
        </CardTitle>

        {product.description && (
          <CardDescription className="text-sm text-neutral-400 line-clamp-2 mb-auto">
            {product.description}
          </CardDescription>
        )}

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-bold text-white">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </CardContent>

      {/* Footer - Actions */}
      <CardFooter className="p-4 pt-0">
        {!isOutOfStock ? (
          <Button
            onClick={(e) => {
              e.preventDefault()
              onAddToCart?.(product)
            }}
            className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold transition-all duration-300"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        ) : (
          <Button disabled className="w-full bg-neutral-700 text-neutral-400">
            Out of Stock
          </Button>
        )}
      </CardFooter>
    </Card>
  )

  if (isLink) {
    return <Link href={href}>{cardContent}</Link>
  }

  return cardContent
}

export function ProductGrid({
  products,
  onAddToCart,
  onFavorite,
  favorites = [],
}: {
  products: ProductWithRelations[]
  onAddToCart?: (product: ProductWithRelations) => void
  onFavorite?: (product: ProductWithRelations) => void
  favorites?: string[]
}) {
  if (!products || products.length === 0) {
    console.log('📊 ProductGrid: No products')
    return <div className="text-center py-12 text-neutral-400">No products found</div>
  }
  
  console.log('📊 ProductGrid: Rendering', products.length, 'products')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onFavorite={onFavorite}
          isFavorite={favorites.includes(product.id)}
        />
      ))}
    </div>
  )
}
