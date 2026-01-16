import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db-enhanced'
import { EquipmentRepository } from '@/lib/repositories'
import { broadcastDataChange } from '@/lib/realtime-broadcast'
import { createEquipmentAvailableNotification } from '@/lib/notifications'
import { translateText } from '@/lib/translation'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'
import { initializeQuantityByStatus, ensureQuantityByStatus } from '@/lib/equipment-utils'

const QuantityByStatusSchema = z.object({
  good: z.number().min(0),
  damaged: z.number().min(0),
  maintenance: z.number().min(0),
}).optional();

const EquipmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
  quantity: z.number().min(0),
  status: z.enum(['good', 'damaged', 'maintenance']),
  quantityByStatus: QuantityByStatusSchema,
  location: z.string().min(1),
  imageUrl: z.string().optional(),
  dailyRate: z.number().min(0),
  type: z.enum(['equipment', 'consumable']),
  version: z.number().optional(),
})

// Utility function to fetch and encode image as base64
async function encodeImageToBase64(imageUrl: string): Promise<{ data: string; contentType: string } | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image');
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      data: base64,
      contentType: contentType,
    };
  } catch (error) {
    console.error('Failed to encode image:', error);
    return null;
  }
}


// Utility function to translate equipment description to Portuguese
async function translateEquipmentDescription(description: string): Promise<string | null> {
  try {
    const translated = await translateText(description, 'pt');
    return translated;
  } catch (error) {
    console.error('Failed to translate equipment description:', error);
    return null;
  }
}


// GET /api/equipment - Get equipment with pagination or fetch all
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view equipment

  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')
    const categoryId = searchParams.get('categoryId') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const fetchAll = searchParams.get('fetchAll') === 'true'

    // If fetchAll=true or no pagination params provided, fetch all equipment
    if (fetchAll || (!page && !pageSize)) {
      const data = await EquipmentRepository.findAll({
        categoryId,
        status,
        search,
      })
      
      return NextResponse.json({
        data: data,
        total: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: 1,
      })
    }

    // Otherwise, use paginated fetch
    const pageNum = parseInt(page || '1')
    const pageSizeNum = parseInt(pageSize || '50')

    const result = await EquipmentRepository.findPaginated({
      page: pageNum,
      pageSize: pageSizeNum,
      categoryId,
      status,
      search,
    })
    
    // Transform the result to match the expected format from frontend API
    // Repository returns {data, pagination: {page, pageSize, total, totalPages}}
    // Frontend expects {data, total, page, pageSize, totalPages}
    return NextResponse.json({
      data: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      totalPages: result.pagination.totalPages,
    })
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {
  // Require authentication and permission to manage equipment
  let user;
  try {
    user = await requirePermission(request, 'canManageEquipment');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const body = await request.json()
    let validatedData = EquipmentSchema.parse(body)
    // Normalize empty subcategoryId to undefined to avoid FK errors
    if (typeof validatedData.subcategoryId === 'string' && validatedData.subcategoryId.trim() === '') {
      validatedData.subcategoryId = undefined
    }

    // Initialize quantityByStatus if not provided
    let quantityByStatus = validatedData.quantityByStatus 
      ? ensureQuantityByStatus(validatedData.quantityByStatus)
      : initializeQuantityByStatus(validatedData.quantity, validatedData.status);

    // Encode image to base64 if external URL provided
    let imageData: string | undefined = undefined;
    let imageContentType: string | undefined = undefined;
    if (validatedData.imageUrl && validatedData.imageUrl.startsWith('http')) {
      console.log('[POST /api/equipment] Encoding image from URL:', validatedData.imageUrl);
      const encoded = await encodeImageToBase64(validatedData.imageUrl);
      if (encoded) {
        imageData = encoded.data;
        imageContentType = encoded.contentType;
        console.log('[POST /api/equipment] Image encoded successfully. Size:', imageData.length, 'bytes. Type:', imageContentType);
      } else {
        console.log('[POST /api/equipment] Failed to encode image from URL');
      }
    }

    // Generate equipment ID upfront for background translation
    const equipmentId = crypto.randomUUID();

    const equipment = await prisma.$transaction(async (tx) => {
      const newEquipment = await tx.equipmentItem.create({
        data: {
          id: equipmentId,
          ...validatedData,
          quantityByStatus: quantityByStatus as any,
          descriptionPt: undefined, // Will be updated asynchronously
          imageUrl: validatedData.imageUrl || 'https://placehold.co/600x400.png',
          imageData: imageData,
          imageContentType: imageContentType,
          updatedAt: new Date(),
        },
        include: {
          Category: true,
          Subcategory: true,
          MaintenanceLog: true,
        },
      })

      return newEquipment
    })

    // Broadcast real-time update
    broadcastDataChange('EquipmentItem', 'CREATE', equipment, 'system')

    // Fire-and-forget: Translate description in background (non-blocking)
    // This ensures the UI response is immediate while translation happens asynchronously
    if (validatedData.description) {
      translateEquipmentDescription(validatedData.description)
        .then(async (translatedDescription) => {
          if (translatedDescription) {
            try {
              await prisma.equipmentItem.update({
                where: { id: equipmentId },
                data: { descriptionPt: translatedDescription },
              });
              console.log(`[Background] Translation completed for equipment ${equipmentId}`);
            } catch (updateError) {
              console.error(`[Background] Failed to save translation for ${equipmentId}:`, updateError);
            }
          }
        })
        .catch((error) => {
          console.error(`[Background] Translation failed for ${equipmentId}:`, error);
        });
    }
    
    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 })
  }
}

// PUT /api/equipment - Update equipment with optimistic locking
export async function PUT(request: NextRequest) {
  // Require authentication and permission to manage equipment
  let user;
  try {
    user = await requirePermission(request, 'canManageEquipment');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const body = await request.json()
    const { id, version, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    let validatedData = EquipmentSchema.partial().parse(updateData)
    // Normalize empty subcategoryId to undefined to avoid FK errors
    if (typeof validatedData.subcategoryId === 'string' && validatedData.subcategoryId.trim() === '') {
      validatedData.subcategoryId = undefined
    }

    // Encode image to base64 if external URL provided
    let imageData: string | undefined = undefined;
    let imageContentType: string | undefined = undefined;
    if (validatedData.imageUrl && validatedData.imageUrl.startsWith('http')) {
      const encoded = await encodeImageToBase64(validatedData.imageUrl);
      if (encoded) {
        imageData = encoded.data;
        imageContentType = encoded.contentType;
      }
    }

    // Translate description to Portuguese if it was updated
    let descriptionPt: string | null | undefined = undefined;
    if (validatedData.description) {
      try {
        descriptionPt = await translateEquipmentDescription(validatedData.description);
      } catch (error) {
        console.error('Translation skipped for equipment update:', error);
      }
    }
    
    try {
      // Get current version and data first
      const currentItem = await prisma.equipmentItem.findUnique({
        where: { id },
        select: { version: true, status: true, quantityByStatus: true }
      })

      if (!currentItem) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
      }

      if (version && currentItem.version !== version) {
        return NextResponse.json({ 
          error: 'Conflict detected', 
          message: 'This record was modified by another user. Please refresh and try again.',
          serverVersion: currentItem.version
        }, { status: 409 })
      }

      // Ensure quantityByStatus is valid if provided
      let quantityByStatus = validatedData.quantityByStatus
        ? ensureQuantityByStatus(validatedData.quantityByStatus)
        : undefined;

      const equipment = await prisma.equipmentItem.update({
        where: { id },
        data: {
          ...validatedData,
          imageData: imageData,
          imageContentType: imageContentType,
          ...(descriptionPt !== undefined ? { descriptionPt } : {}),
          ...(quantityByStatus ? { quantityByStatus: quantityByStatus as any } : {}),
          updatedBy: user.userId,
          version: currentItem.version + 1,
        },
        include: {
          Category: true,
          Subcategory: true,
          MaintenanceLog: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      })

      // Broadcast real-time update
      broadcastDataChange('EquipmentItem', 'UPDATE', equipment, 'system')
      
      // Generate notification if equipment becomes available from maintenance
      if (validatedData.status && currentItem.status && validatedData.status !== currentItem.status) {
        try {
          if (currentItem.status === 'maintenance' && validatedData.status === 'good') {
            // Get the updated equipment with quantityByStatus
            const updatedQbs = quantityByStatus || ensureQuantityByStatus(currentItem.quantityByStatus);
            await createEquipmentAvailableNotification(id, equipment.name, updatedQbs)
          }
        } catch (e) {
          console.error('Error sending equipment available notification:', e)
        }
      }
      
      return NextResponse.json(equipment)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating equipment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 })
  }
}

// DELETE /api/equipment - Delete equipment
export async function DELETE(request: NextRequest) {
  // Require authentication and permission to manage equipment
  try {
    await requirePermission(request, 'canManageEquipment');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }
    
    // Get the equipment before deletion for real-time sync
    const equipment = await prisma.equipmentItem.findUnique({
      where: { id },
      include: { Category: true, Subcategory: true }
    })
    
    await prisma.$transaction(async (tx) => {
      await tx.equipmentItem.delete({
        where: { id },
      })
    })

    // Broadcast real-time update
    if (equipment) {
      broadcastDataChange('EquipmentItem', 'DELETE', { ...equipment }, 'system')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipment:', error)
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 })
  }
}