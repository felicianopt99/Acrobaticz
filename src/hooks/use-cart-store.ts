import { create } from 'zustand'
import { CartItem, Cart } from '@/types/entities'
import { ProductWithRelations } from '@/types/prisma'

interface CartStore {
  cart: Cart
  isOpen: boolean
  addItem: (product: ProductWithRelations, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleOpen: () => void
  setOpen: (open: boolean) => void
}

const initialCart: Cart = {
  items: [],
  total: 0,
  itemCount: 0,
}

export const useCartStore = create<CartStore>((set) => ({
  cart: initialCart,
  isOpen: false,

  addItem: (product: ProductWithRelations, quantity: number = 1) =>
    set((state) => {
      const existingItem = state.cart.items.find(
        (item) => item.productId === product.id
      )

      let items: CartItem[]
      if (existingItem) {
        items = state.cart.items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        items = [
          ...state.cart.items,
          {
            id: Math.random().toString(),
            productId: product.id,
            quantity,
            price: product.price,
            name: product.name,
            image: product.images?.[0]?.url,
          },
        ]
      }

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

      return {
        cart: { items, total, itemCount },
        isOpen: true,
      }
    }),

  removeItem: (productId: string) =>
    set((state) => {
      const items = state.cart.items.filter(
        (item) => item.productId !== productId
      )
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

      return {
        cart: { items, total, itemCount },
      }
    }),

  updateQuantity: (productId: string, quantity: number) =>
    set((state) => {
      // If quantity is 0 or less, remove the item
      const items = quantity <= 0
        ? state.cart.items.filter((item) => item.productId !== productId)
        : state.cart.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          )
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

      return {
        cart: { items, total, itemCount },
      }
    }),

  clearCart: () =>
    set({
      cart: initialCart,
      isOpen: false,
    }),

  toggleOpen: () =>
    set((state) => ({
      isOpen: !state.isOpen,
    })),

  setOpen: (open: boolean) =>
    set({
      isOpen: open,
    }),
}))
