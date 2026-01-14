'use client'

import Image from 'next/image'
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/hooks/use-cart-store'

interface CartModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCheckout?: () => void
}

export function CartModal({
  isOpen,
  onOpenChange,
  onCheckout,
}: CartModalProps) {
  const { cart, removeItem, updateQuantity } = useCartStore()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700/50 rounded-2xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-neutral-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-white">Your Cart</DialogTitle>
              <p className="text-xs text-neutral-400 mt-1">
                {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} in cart
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Cart Items */}
        <div className="max-h-96 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">Your cart is empty</p>
              <p className="text-neutral-500 text-xs mt-2">
                Add items to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {cart.items.map((item) => (
                <div key={item.id}>
                  <div className="flex gap-3 pb-4">
                    {/* Image */}
                    {item.image && (
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-700/50">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-400 mb-2">
                        ${item.price.toFixed(2)} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="h-6 w-6 rounded-md bg-neutral-700/50 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="h-6 w-6 rounded-md bg-neutral-700/50 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-neutral-400 hover:text-red-400 transition-colors duration-300 self-start"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Separator className="bg-neutral-700/50" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Actions */}
        {cart.items.length > 0 && (
          <>
            <Separator className="bg-neutral-700/50" />

            <div className="p-4 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">
                    ${cart.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Shipping</span>
                  <span className="text-white font-semibold">Calculated at checkout</span>
                </div>
              </div>

              <Separator className="bg-neutral-700/50" />

              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  ${cart.total.toFixed(2)}
                </span>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-semibold"
                >
                  Continue to Booking
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="w-full bg-neutral-700/20 border-neutral-600/50 text-neutral-300 hover:bg-neutral-700/40 hover:text-white hover:border-neutral-500/50 transition-all duration-300"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
