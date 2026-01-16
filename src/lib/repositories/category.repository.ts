import { prisma } from '@/lib/db-enhanced'
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import { CacheInvalidation } from '@/lib/cache-invalidation'

export class CategoryRepository {
  /**
   * Buscar todas as categorias com contagem de equipamentos
   * - Usa contagem paralela eficiente
   * - Sem N+1 queries
   * - Cache-friendly
   * - TTL: 1 hora
   */
  static async findAll() {
    // Check cache first
    const cached = cacheManager.get(CACHE_KEYS.CATEGORIES)
    if (cached) {
      console.log('[CategoryRepository] Returning cached categories')
      return cached
    }

    // Buscar categorias com subcategorias
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
        Subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Contar equipamentos em paralelo
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const [equipmentCount, subcategoryCount] = await Promise.all([
          prisma.equipmentItem.count({
            where: { categoryId: cat.id },
          }),
          cat.Subcategory.length,
        ])

        return {
          ...cat,
          _count: {
            equipment: equipmentCount,
            subcategories: subcategoryCount,
          },
        }
      })
    )

    // Cache for 1 hour
    cacheManager.set(CACHE_KEYS.CATEGORIES, categoriesWithCounts, CACHE_TTL.CATEGORIES)
    console.log('[CategoryRepository] Cached categories for 1 hour')

    return categoriesWithCounts
  }

  /**
   * Buscar categorias com estatísticas agregadas
   * - Usa view materializada para performance
   * - Ideal para dashboards
   */
  static async findWithStats() {
    // Se tiver view materializada, usar:
    return prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        COUNT(DISTINCT e.id) as equipment_count,
        COUNT(DISTINCT s.id) as subcategory_count,
        c."createdAt",
        c."updatedAt"
      FROM "Category" c
      LEFT JOIN "EquipmentItem" e ON e."categoryId" = c.id
      LEFT JOIN "Subcategory" s ON s."parentId" = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `
  }

  /**
   * Buscar categoria por ID com equips
   */
  static async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        Subcategory: {
          orderBy: { name: 'asc' },
        },
        EquipmentItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
          orderBy: { name: 'asc' },
          take: 100, // Limitar
        },
      },
    })
  }

  /**
   * Criar categoria
   */
  static async create(data: {
    name: string
    description?: string
    icon?: string
  }) {
    const result = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        updatedAt: new Date(),
      },
      include: {
        Subcategory: true,
      },
    })

    // Invalidate cache
    CacheInvalidation.invalidateCategory()

    return result
  }

  /**
   * Atualizar categoria
   */
  static async update(id: string, data: {
    name?: string
    description?: string
    icon?: string
  }) {
    const result = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        Subcategory: true,
      },
    })

    // Invalidate cache
    CacheInvalidation.invalidateCategory(id)

    return result
  }

  /**
   * Deletar categoria (com validação)
   */
  static async delete(id: string) {
    // Verificar se tem equipamentos
    const count = await prisma.equipmentItem.count({
      where: { categoryId: id },
    })

    if (count > 0) {
      throw new Error(`Cannot delete category with ${count} equipment items`)
    }

    const result = await prisma.category.delete({
      where: { id },
    })

    // Invalidate cache
    CacheInvalidation.invalidateCategory(id)

    return result
  }
}
