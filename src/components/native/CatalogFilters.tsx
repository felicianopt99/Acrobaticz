'use client'

import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/hooks/use-filter-store'

interface CatalogFiltersProps {
  categories?: Array<{ id: string; name: string }>
  productCount?: number
  className?: string
}

export function CatalogFilters({
  categories = [],
  productCount = 0,
  className,
}: CatalogFiltersProps) {
  const { filters, setSearch, setCategories, setSortBy } = useFilterStore()

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50',
        className
      )}
    >
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-blue-400 transition-colors duration-300" />
        <Input
          placeholder="Search equipment..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-neutral-700/30 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg transition-all duration-300"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Category Filter */}
        {categories.length > 0 && (
          <Select
            value={filters.categories?.[0] || 'all'}
            onValueChange={(value) => setCategories(value !== 'all' && value ? [value] : [])}
          >
            <SelectTrigger className="bg-neutral-700/30 border-neutral-600/50 text-white hover:bg-neutral-700/50 hover:border-blue-500/30 transition-all duration-300 rounded-lg">
              <SelectValue placeholder="All Categories" />
              <ChevronDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort Filter */}
        <Select
          value={filters.sortBy || 'newest'}
          onValueChange={(value) =>
            setSortBy(value as any)
          }
        >
          <SelectTrigger className="bg-neutral-700/30 border-neutral-600/50 text-white hover:bg-neutral-700/50 hover:border-blue-500/30 transition-all duration-300 rounded-lg">
            <SelectValue />
            <ChevronDown className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700">
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>

        {/* Results Counter */}
        <div className="flex items-center justify-end">
          <div className="px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/30">
            <p className="text-sm font-semibold text-blue-400">
              {productCount} results
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Filters Button */}
      <div className="flex gap-2 pt-2 border-t border-neutral-700/50">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-neutral-700/20 border-neutral-600/50 text-neutral-300 hover:bg-neutral-700/40 hover:text-white hover:border-blue-500/30 transition-all duration-300"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filters
        </Button>
      </div>
    </div>
  )
}
