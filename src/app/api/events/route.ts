import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const EventSchema = z.object({
  name: z.string().min(1),
  clientId: z.string(),
  location: z.string().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  agencyId: z.string().optional(),
  quoteId: z.string().optional(),
  totalRevenue: z.number().default(0),
})

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view events

  try {
    const events = await prisma.event.findMany({
      include: {
        Client: true,
        Partner: true,
        Quote: true,
        Rental: {
          include: {
            EquipmentItem: true,
          }
        },
        _count: {
          select: { Rental: true }
        }
      },
      orderBy: { startDate: 'desc' },
    })
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const validatedData = EventSchema.parse(body)
    
    // Validate agencyId if provided
    if (validatedData.agencyId) {
      const agencyExists = await prisma.partner.findUnique({
        where: { id: validatedData.agencyId },
      })
      if (!agencyExists) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 400 })
      }
    }

    // Calculate revenue
    let totalRevenue = validatedData.totalRevenue || 0

    // If quoteId provided, get revenue from quote
    if (validatedData.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: validatedData.quoteId },
      })
      if (quote) {
        // Use the quote's total amount as the event revenue
        totalRevenue = quote.totalAmount
      }
    }
    
    const event = await prisma.event.create({
      data: {
        id: crypto.randomUUID(),
        ...validatedData,
        totalRevenue,
        updatedAt: new Date(),
      },
      include: {
        Client: true,
        Rental: true,
        Quote: true,
      },
    })
    
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// PUT /api/events - Update event
export async function PUT(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    const validatedData = EventSchema.partial().parse(updateData)
    
    // Validate agencyId if provided and not empty
    if (validatedData.agencyId && validatedData.agencyId !== '') {
      const agencyExists = await prisma.partner.findUnique({
        where: { id: validatedData.agencyId },
      })
      if (!agencyExists) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 400 })
      }
    }

    // Handle null/undefined agencyId
    const dataToUpdate: any = { ...validatedData }
    if (validatedData.agencyId === '') {
      dataToUpdate.agencyId = null
    }

    // Calculate revenue if quoteId is being updated
    if (validatedData.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: validatedData.quoteId },
      })
      if (quote) {
        dataToUpdate.totalRevenue = quote.totalAmount
      }
    }
    
    const event = await prisma.event.update({
      where: { id },
      data: dataToUpdate,
      include: {
        Client: true,
        Rental: true,
        Quote: true,
      },
    })
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/events - Delete event
export async function DELETE(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    await prisma.event.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}