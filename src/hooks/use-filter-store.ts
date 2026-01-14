import { create } from 'zustand'
import { FilterOptions } from '@/types/entities'

interface FilterStore {
  filters: FilterOptions
  setSearch: (search: string) => void
  setCategories: (categories: string[]) => void
  setPriceRange: (range: [number, number]) => void
  setSortBy: (sortBy: FilterOptions['sortBy']) => void
  setAvailability: (availability: FilterOptions['availability']) => void
  resetFilters: () => void
}

const defaultFilters: FilterOptions = {
  search: '',
  categories: [],
  priceRange: [0, 10000],
  sortBy: 'newest',
  availability: 'all',
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,

  setSearch: (search: string) =>
    set((state) => ({
      filters: { ...state.filters, search },
    })),

  setCategories: (categories: string[]) =>
    set((state) => ({
      filters: { ...state.filters, categories },
    })),

  setPriceRange: (priceRange: [number, number]) =>
    set((state) => ({
      filters: { ...state.filters, priceRange },
    })),

  setSortBy: (sortBy: FilterOptions['sortBy']) =>
    set((state) => ({
      filters: { ...state.filters, sortBy },
    })),

  setAvailability: (availability: FilterOptions['availability']) =>
    set((state) => ({
      filters: { ...state.filters, availability },
    })),

  resetFilters: () =>
    set({
      filters: defaultFilters,
    }),
}))
