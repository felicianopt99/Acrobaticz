import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CategoryRepository } from '@/lib/repositories'
import { triggerCategoryTranslation } from '@/lib/translation-integration'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const CategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
})

// GET /api/categories - Get all categories with subcategories
export async function GET(request: NextRequest) {
  try {
    // Allow any authenticated user to view categories
    await requireReadAccess(request)

    const categories = await CategoryRepository.findAll()
    
    return NextResponse.json(categories)
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  // Categories are part of equipment management

  try {
    const body = await request.json()
    const validatedData = CategorySchema.parse(body)
    
    const category = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        Subcategory: true,
      },
    })
    
    // Trigger automatic translation for the new category (non-blocking)
    triggerCategoryTranslation(
      category.id,
      category.name,
      category.description,
      ['pt']
    ).catch(err => console.error('Failed to trigger category translation:', err));
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT /api/categories - Update category
export async function PUT(request: NextRequest) {
  // Categories are part of equipment management

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    
    // Get existing category for comparison
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    
    const validatedData = CategorySchema.partial().parse(updateData)
    
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        Subcategory: true,
      },
    })
    
    // Trigger retranslation if name or description changed
    if (
      (updateData.name && updateData.name !== existingCategory.name) ||
      (updateData.description && updateData.description !== existingCategory.description)
    ) {
      triggerCategoryTranslation(
        category.id,
        category.name,
        category.description,
        ['pt']
      ).catch(err => console.error('Failed to trigger category retranslation:', err));
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/categories - Delete category
export async function DELETE(request: NextRequest) {
  // Categories are part of equipment management

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    
    // Check if category has equipment
    const equipmentCount = await prisma.equipmentItem.count({
      where: { categoryId: id }
    })
    
    if (equipmentCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with equipment items' 
      }, { status: 400 })
    }
    
    await prisma.category.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}