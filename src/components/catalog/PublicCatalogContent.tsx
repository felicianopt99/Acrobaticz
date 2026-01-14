'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CatalogHeader } from '@/components/native/CatalogHeader'
import { HeroSection } from '@/components/native/HeroSection'
import { CatalogFilters } from '@/components/native/CatalogFilters'
import { ProductCard, ProductGrid } from '@/components/native/ProductCard'
import { CartModal } from '@/components/native/CartModal'
import { CatalogFooter } from '@/components/native/CatalogFooter'
import { InquiryFormModal } from '@/components/native/InquiryFormModal'
import { useCartStore } from '@/hooks/use-cart-store'
import { useFilterStore } from '@/hooks/use-filter-store'
import { ProductWithRelations } from '@/types/prisma'

interface Equipment {
  id: string
  name: string
  description: string
  imageUrl: string | null
  dailyRate: number
  quantity: number
  category: {
    id: string
    name: string
    icon: string | null
  }
  subcategory: {
    id: string
    name: string
  } | null
  images?: Array<{ url: string }>
}

interface Partner {
  id: string
  name: string
  companyName: string | null
  logoUrl: string | null
  address: string | null
  email: string | null
  phone: string | null
}

interface CatalogData {
  partner: Partner
  equipment: Equipment[]
  shareToken: string
}

interface PublicCatalogContentProps {
  token: string
}

// Converter Equipment para ProductWithRelations
function equipmentToProduct(equipment: Equipment): ProductWithRelations {
  return {
    id: equipment.id,
    name: equipment.name,
    description: equipment.description,
    price: equipment.dailyRate,
    stock: equipment.quantity,
    images: equipment.images || [{ id: '', url: equipment.imageUrl || '', productId: equipment.id }],
    category: equipment.category as any,
    supplier: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryId: equipment.category.id,
    supplierId: null,
  }
}

export function PublicCatalogContent({ token }: PublicCatalogContentProps) {
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false)
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])

  // Using Zustand stores
  const { cart, isOpen, addItem, removeItem, updateQuantity, toggleOpen, clearCart } =
    useCartStore()
  const { filters, setSearch, setCategories: setFilterCategories } = useFilterStore()

  useEffect(() => {
    loadCatalog()
  }, [token])

  const loadCatalog = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/catalog/share/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Catalog not found or has expired.')
        } else if (response.status === 410) {
          setError('This catalog share link has expired.')
        } else {
          setError('Failed to load catalog.')
        }
        return
      }

      const data = await response.json()
      setCatalogData(data)

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Map(
          data.equipment.map((eq: Equipment) => [
            eq.category.id,
            { id: eq.category.id, name: eq.category.name },
          ])
        ).values()
      )
      setCategories(uniqueCategories)
    } catch (err) {
      console.error('Error loading catalog:', err)
      setError('Failed to load catalog. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const filteredEquipment = catalogData?.equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(filters.search?.toLowerCase() || '') ||
      item.description.toLowerCase().includes(filters.search?.toLowerCase() || '')
    const matchesCategory =
      !filters.categories?.length || filters.categories.includes(item.category.id)
    return matchesSearch && matchesCategory
  }) || []

  // Debug
  console.log('📦 Catalog Data:', catalogData)
  console.log('🔍 Filtered Equipment:', filteredEquipment)
  console.log('📊 Filters:', filters)
  if (filteredEquipment.length > 0) {
    const firstProduct = filteredEquipment[0]
    console.log('🎯 First Product:', {
      id: firstProduct.id,
      name: firstProduct.name,
      images: firstProduct.images,
      imageUrl: firstProduct.imageUrl,
    })
  }

  const handleAddToCart = (product: ProductWithRelations) => {
    // Find the original equipment to get quantity
    const equipment = catalogData?.equipment.find((eq) => eq.id === product.id)
    if (equipment) {
      addItem(product as any, 1)
    }
  }

  const handleSubmitInquiry = async (inquiryData: any) => {
    try {
      setSubmittingInquiry(true)
      const cartItemsData = cart.items.map((item) => ({
        equipmentId: item.productId,
        equipmentName: item.name,
        quantity: item.quantity,
        dailyRate: item.price,
      }))

      const response = await fetch('/api/catalog/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inquiryData,
          partnerId: catalogData?.partner.id,
          cartItems: cartItemsData,
          shareToken: token,
        }),
      })

      if (response.ok) {
        setIsInquiryFormOpen(false)
        clearCart()
        alert('Inquiry submitted successfully! The provider will contact you soon.')
      } else {
        alert('Failed to submit inquiry. Please try again.')
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err)
      alert('Failed to submit inquiry. Please try again.')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-neutral-400">Loading catalog...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md bg-red-950/50 border-red-800/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!catalogData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 flex items-center justify-center p-4">
        <Alert className="max-w-md bg-neutral-800/50 border-neutral-700/50">
          <AlertDescription className="text-neutral-300">
            No catalog data available.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { partner } = catalogData

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 flex flex-col">
      {/* Header */}
      <CatalogHeader
        title={partner.name}
        subtitle={partner.companyName || 'Premium Equipment Rental'}
        cartCount={cart.itemCount}
        onCartClick={() => toggleOpen()}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 border-b border-neutral-800/50">
        <CatalogFilters
          categories={categories}
          productCount={filteredEquipment.length}
          className="mb-6"
        />
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 flex-1">
        {filteredEquipment.length > 0 ? (
          <>
            {/* Header */}
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Equipment Catalog
              </h2>
              <p className="text-neutral-400">
                Showing{' '}
                <span className="text-blue-400 font-semibold">{filteredEquipment.length}</span> of{' '}
                <span className="text-blue-400 font-semibold">{catalogData?.equipment.length}</span> items
              </p>
            </div>

            {/* Grid */}
            <ProductGrid
              products={filteredEquipment.map((equipment) =>
                equipmentToProduct(equipment)
              )}
              onAddToCart={handleAddToCart}
              onFavorite={(p) => toggleWishlist(p.id)}
              favorites={wishlist}
            />
          </>
        ) : (
          <div className="text-center py-24">
            <div className="inline-block mb-4 p-4 rounded-2xl bg-neutral-800/50 border border-neutral-700/50">
              <AlertCircle className="h-12 w-12 text-neutral-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Products Found</h3>
            <p className="text-neutral-400 max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <CatalogFooter />

      {/* Cart Modal */}
      <CartModal
        isOpen={isOpen}
        onOpenChange={toggleOpen}
        onCheckout={() => {
          toggleOpen()
          setIsInquiryFormOpen(true)
        }}
      />

      {/* Inquiry Form Modal */}
      <InquiryFormModal
        isOpen={isInquiryFormOpen}
        onOpenChange={setIsInquiryFormOpen}
        partner={partner as any}
        cartItems={cart.items}
        onSubmit={handleSubmitInquiry}
        isSubmitting={submittingInquiry}
      />
    </div>
  )
}
