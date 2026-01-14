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


// GET /api/equipment - Get equipment with pagination
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view equipment

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const categoryId = searchParams.get('categoryId') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const result = await EquipmentRepository.findPaginated({
      page,
      pageSize,
      categoryId,
      status,
      search,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {

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

    // Translate description to Portuguese in parallel
    let descriptionPt: string | null = null;
    if (validatedData.description) {
      try {
        descriptionPt = await translateEquipmentDescription(validatedData.description);
      } catch (error) {
        console.error('Translation skipped for new equipment:', error);
      }
    }

    const equipment = await prisma.$transaction(async (tx) => {
      const newEquipment = await tx.equipmentItem.create({
        data: {
          ...validatedData,
          quantityByStatus: quantityByStatus as any,
          descriptionPt: descriptionPt || undefined,
          imageUrl: validatedData.imageUrl || 'https://placehold.co/600x400.png',
          imageData: imageData,
          imageContentType: imageContentType,
          createdBy: user.userId,
          updatedBy: user.userId,
        },
        include: {
          category: true,
          subcategory: true,
          maintenanceLogs: true,
        },
      })

      return newEquipment
    })

    // Broadcast real-time update
    broadcastDataChange('EquipmentItem', 'CREATE', equipment, 'system')
    
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
          category: true,
          subcategory: true,
          maintenanceLogs: {
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

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }
    
    // Get the equipment before deletion for real-time sync
    const equipment = await prisma.equipmentItem.findUnique({
      where: { id },
      include: { category: true, subcategory: true }
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