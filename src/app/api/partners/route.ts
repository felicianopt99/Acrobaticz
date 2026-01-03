import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const PartnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required'),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  clientId: z.string().optional().or(z.literal('none')),  // Link to Client if partner is also a direct client; "none" means no link
  partnerType: z.enum(['provider', 'agency', 'both']).optional().default('provider'),
  commission: z.number().positive().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/partners - Get all partners
export async function GET(request: NextRequest) {
  const authResult = requireReadAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        client: true,
        subrentals: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
        _count: {
          select: { subrentals: true }
        }
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(partners)
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
}

// POST /api/partners - Create new partner
export async function POST(request: NextRequest) {
  const authResult = requirePermission(request, 'canManagePartners')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const validatedData = PartnerSchema.parse(body)
    
    // Convert "none" clientId to undefined
    const clientId = validatedData.clientId === 'none' ? undefined : validatedData.clientId
    
    const partner = await prisma.partner.create({
      data: {
        ...validatedData,
        clientId,
        email: validatedData.email || undefined,
        website: validatedData.website || undefined,
        createdBy: authResult.userId,
      },
      include: {
        client: true,
        _count: {
          select: { subrentals: true }
        }
      }
    })
    
    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error('Error creating partner:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
}

// PUT /api/partners - Update partner
export async function PUT(request: NextRequest) {
  const authResult = requirePermission(request, 'canManagePartners')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }
    
    const validatedData = PartnerSchema.partial().parse(updateData)
    
    // Convert "none" clientId to undefined
    const clientId = validatedData.clientId === 'none' ? undefined : validatedData.clientId
    
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...validatedData,
        clientId,
        email: validatedData.email || undefined,
        website: validatedData.website || undefined,
        updatedBy: authResult.userId,
      },
      include: {
        client: true,
        _count: {
          select: { subrentals: true }
        }
      }
    })
    
    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error updating partner:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}

// DELETE /api/partners - Delete partner
export async function DELETE(request: NextRequest) {
  const authResult = requirePermission(request, 'canManagePartners')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }
    
    await prisma.partner.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 })
  }
}
