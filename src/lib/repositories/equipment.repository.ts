import { prisma } from '@/lib/db-enhanced'
import { Prisma } from '@prisma/client'

export class EquipmentRepository {
  /**
   * Buscar equipamentos com paginação e otimização
   * - Usa select para reduzir payload
   * - Máximo 200 items por página
   * - Índice em categoryId para filtros rápidos
   */
  static async findPaginated(params: {
    page?: number
    pageSize?: number
    categoryId?: string
    status?: string
    search?: string
  }) {
    const { page = 1, pageSize = 50, categoryId, status, search } = params

    // Validar pageSize
    const validPageSize = Math.min(Math.max(pageSize, 1), 200)

    // Construir where
    const where: Prisma.EquipmentItemWhereInput = {}

    if (categoryId) where.categoryId = categoryId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Select otimizado
    const select = {
      id: true,
      name: true,
      description: true,
      categoryId: true,
      subcategoryId: true,
      quantity: true,
      status: true,
      quantityByStatus: true,
      location: true,
      imageUrl: true,
      imageContentType: true,
      dailyRate: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
        },
      },
      maintenanceLogs: {
        select: {
          id: true,
          date: true,
          description: true,
          cost: true,
        },
        orderBy: { date: 'desc' as const },
        take: 5,
      },
    } as const

    // Executar query
    const [data, total] = await Promise.all([
      prisma.equipmentItem.findMany({
        where,
        select,
        orderBy: { name: 'asc' },
        skip: (page - 1) * validPageSize,
        take: validPageSize,
      }),
      prisma.equipmentItem.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        pageSize: validPageSize,
        total,
        totalPages: Math.ceil(total / validPageSize),
      },
    }
  }

  /**
   * Buscar equipamento único com todas as relações
   */
  static async findById(id: string) {
    return prisma.equipmentItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        maintenanceLogs: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            description: true,
            cost: true,
          },
        },
        quoteItems: {
          select: {
            id: true,
            quoteId: true,
          },
          take: 10,
        },
        rentals: {
          select: {
            id: true,
            eventId: true,
            quantityRented: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  /**
   * Buscar múltiplos equipamentos por IDs (para catálogos)
   * - Otimizado para catálogos compartilhados
   * - Sem campos desnecessários
   * - Ordenação em aplicação (mais rápido)
   */
  static async findByIds(
    ids: string[],
    options?: {
      includeImage?: boolean
      includeMaintenance?: boolean
    }
  ) {
    if (ids.length === 0) return []

    const select = {
      id: true,
      name: true,
      description: true,
      dailyRate: true,
      quantity: true,
      quantityByStatus: true,
      location: true,
      type: true,
      ...(options?.includeImage && {
        imageUrl: true,
        imageContentType: true,
      }),
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
        },
      },
      ...(options?.includeMaintenance && {
        maintenanceLogs: {
          select: {
            id: true,
            date: true,
            description: true,
            cost: true,
          },
          orderBy: { date: 'desc' as const },
          take: 3,
        },
      }),
    } as const

    return prisma.equipmentItem.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select,
    })
  }

  /**
   * Contar equipamentos por categoria
   * - Usa query agregada otimizada
   */
  static async countByCategory(categoryId: string) {
    return prisma.equipmentItem.count({
      where: { categoryId },
    })
  }

  /**
   * Buscar equipamentos agrupados por categoria
   */
  static async findGroupedByCategory() {
    const equipment = await prisma.equipmentItem.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { categoryId: 'asc' },
        { name: 'asc' },
      ],
    })

    // Agrupar em memória
    const grouped = equipment.reduce(
      (acc, item) => {
        const catName = item.category.name
        if (!acc[catName]) {
          acc[catName] = []
        }
        acc[catName].push(item)
        return acc
      },
      {} as Record<string, typeof equipment>
    )

    return grouped
  }
}
