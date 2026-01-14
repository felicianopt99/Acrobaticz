import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const SubrentalSchema = z.object({
  partnerId: z.string().min(1, 'Partner is required'),
  eventId: z.string().optional().nullable(),
  equipmentName: z.string().min(1, 'Equipment name is required'),
  equipmentDesc: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  dailyRate: z.number().min(0, 'Daily rate must be non-negative'),
  totalCost: z.number().min(0, 'Total cost must be non-negative'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: z.enum(['pending', 'active', 'returned', 'cancelled']).optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/subrentals - Get all subrentals
export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {}
    
    if (partnerId) where.partnerId = partnerId
    if (eventId) where.eventId = eventId
    if (status) where.status = status
    if (startDate) where.startDate = { gte: new Date(startDate) }
    if (endDate) where.endDate = { lte: new Date(endDate) }

    const subrentals = await prisma.subrental.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            location: true,
            startDate: true,
            endDate: true,
          }
        },
      },
      orderBy: { startDate: 'desc' },
    })
    
    return NextResponse.json(subrentals)
  } catch (error) {
    console.error('Error fetching subrentals:', error)
    return NextResponse.json({ error: 'Failed to fetch subrentals' }, { status: 500 })
  }
}

// POST /api/subrentals - Create new subrental
export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const validatedData = SubrentalSchema.parse(body)
    
    const subrental = await prisma.subrental.create({
      data: {
        ...validatedData,
        eventId: validatedData.eventId || undefined,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    })
    
    return NextResponse.json(subrental, { status: 201 })
  } catch (error) {
    console.error('Error creating subrental:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create subrental' }, { status: 500 })
  }
}

// PUT /api/subrentals - Update subrental
export async function PUT(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Subrental ID is required' }, { status: 400 })
    }
    
    const validatedData = SubrentalSchema.partial().parse(updateData)
    
    const subrental = await prisma.subrental.update({
      where: { id },
      data: {
        ...validatedData,
        eventId: validatedData.eventId || undefined,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    })
    
    return NextResponse.json(subrental)
  } catch (error) {
    console.error('Error updating subrental:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update subrental' }, { status: 500 })
  }
}

// DELETE /api/subrentals - Delete subrental
export async function DELETE(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Subrental ID is required' }, { status: 400 })
    }
    
    await prisma.subrental.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subrental:', error)
    return NextResponse.json({ error: 'Failed to delete subrental' }, { status: 500 })
  }
}
