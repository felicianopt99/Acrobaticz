import { useCallback } from 'react'
import useSWR from 'swr'

interface UseEquipmentParams {
  page?: number
  pageSize?: number
  categoryId?: string
  status?: string
  search?: string
}

export function useEquipment(params: UseEquipmentParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', String(params.page))
  if (params.pageSize) searchParams.append('pageSize', String(params.pageSize))
  if (params.categoryId) searchParams.append('categoryId', params.categoryId)
  if (params.status) searchParams.append('status', params.status)
  if (params.search) searchParams.append('search', params.search)

  const { data, error, isLoading, mutate } = useSWR(
    `/api/equipment?${searchParams.toString()}`,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache por 1 minuto
    }
  )

  return {
    equipment: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/categories',
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // Cache por 10 minutos
    }
  )

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useCategory(categoryId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    categoryId ? `/api/categories/${categoryId}` : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache por 5 minutos
    }
  )

  return {
    category: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useCatalogShare(token?: string) {
  const { data, error, isLoading } = useSWR(
    token ? `/api/catalog/share/${token}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache por 5 minutos
    }
  )

  return {
    catalogData: data,
    isLoading,
    isError: !!error,
    error,
  }
}
