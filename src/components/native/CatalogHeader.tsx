'use client'

import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CatalogHeaderProps {
  title?: string
  subtitle?: string
  cartCount?: number
  onCartClick?: () => void
  className?: string
}

export function CatalogHeader({
  title = 'Equipment Rental',
  subtitle = 'Premium quality equipment at your fingertips',
  cartCount = 0,
  onCartClick,
  className,
}: CatalogHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-neutral-800/50 bg-gradient-to-b from-neutral-950 to-neutral-900/80 backdrop-blur-xl',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo/Branding */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            {/* Logo Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/30 rounded-xl blur-md" />
            <div className="relative flex items-center justify-center h-12 w-12 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-blue-900/20">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg" />
            </div>
          </div>

          {/* Text */}
          <div className="hidden sm:flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xs text-neutral-500 leading-none">{subtitle}</p>
          </div>
        </div>

        {/* Cart Button */}
        <button
          onClick={onCartClick}
          className="relative flex items-center justify-center h-11 w-11 rounded-lg border border-neutral-700/50 bg-gradient-to-br from-blue-600/20 to-blue-900/20 hover:from-blue-600/30 hover:to-blue-900/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50 group"
        >
          <ShoppingCart className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />

          {/* Badge */}
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
