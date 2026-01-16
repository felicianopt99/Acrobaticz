import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const RentalSchema = z.object({
  eventId: z.string(),
  equipment: z.array(
    z.object({
      equipmentId: z.string(),
      quantity: z.number().min(1),
    })
  ).min(1),
  notes: z.string().optional(),
})

const SingleRentalUpdateSchema = z.object({
  eventId: z.string().optional(),
  equipmentId: z.string().optional(),
  quantityRented: z.number().min(1).optional(),
  prepStatus: z.enum(['pending', 'checked-out', 'checked-in']).optional(),
})

// GET /api/rentals - Get all rentals
export async function GET(request: NextRequest) {
  // Require authentication to view rentals
  try {
    await requireReadAccess(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }

  try {
    const rentals = await prisma.rental.findMany({
      include: {
        Event: {
          include: {
            Client: true,
          }
        },
        EquipmentItem: {
          include: {
            Category: true,
            Subcategory: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 })
  }
}

// POST /api/rentals - Create new rentals
export async function POST(request: NextRequest) {
  // Require authentication and permission to manage rentals
  let user;
  try {
    user = await requirePermission(request, 'canManageRentals');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const body = await request.json()
    const validatedData = RentalSchema.parse(body)

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const rentals = []
    for (const item of validatedData.equipment) {
      // Check if equipment exists
      const equipment = await prisma.equipmentItem.findUnique({
        where: { id: item.equipmentId },
      })
      if (!equipment) {
        return NextResponse.json({ error: `Equipment ${item.equipmentId} not found` }, { status: 404 })
      }

      const rental = await prisma.rental.create({
        data: {
          id: crypto.randomUUID(),
          eventId: validatedData.eventId,
          equipmentId: item.equipmentId,
          quantityRented: item.quantity,
          updatedAt: new Date(),
        },
        include: {
          Event: {
            include: {
              Client: true,
            }
          },
          EquipmentItem: {
            include: {
              Category: true,
              Subcategory: true,
            }
          },
        },
      })
      rentals.push(rental)
    }

    // After creating rentals, check for conflicts and low stock
    try {
      const { checkEquipmentConflicts, createConflictNotification } = await import('@/lib/notifications')
      
      for (const rental of rentals) {
        // Check for equipment conflicts
        const conflictingEventIds = await checkEquipmentConflicts(
          rental.equipmentId,
          event.startDate,
          event.endDate,
          rental.id
        )
        
        if (conflictingEventIds.length > 0) {
          await createConflictNotification([event.id, ...conflictingEventIds], rental.EquipmentItem.name)
        }
      }
    } catch (e) {
      console.error('Error processing notifications:', e)
    }

    return NextResponse.json(rentals, { status: 201 })
  } catch (error) {
    console.error('Error creating rentals:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create rentals' }, { status: 500 })
  }
}

// PUT /api/rentals - Update rental
export async function PUT(request: NextRequest) {
  // Require authentication and permission to manage rentals
  let user;
  try {
    user = await requirePermission(request, 'canManageRentals');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 })
    }
    
    // Get old rental data for comparison
    const oldRental = await prisma.rental.findUnique({
      where: { id },
      include: {
        EquipmentItem: true,
      },
    })
    
    const validatedData = SingleRentalUpdateSchema.parse(updateData)
    
    const rental = await prisma.rental.update({
      where: { id },
      data: validatedData,
      include: {
        Event: {
          include: {
            Client: true,
          }
        },
        EquipmentItem: true,
      },
    })
    
    // Trigger notifications for status changes
    if (oldRental?.prepStatus && rental.prepStatus && oldRental.prepStatus !== rental.prepStatus) {
      try {
        const { createStatusChangeNotification } = await import('@/lib/notifications')
        await createStatusChangeNotification(id, oldRental.prepStatus, rental.prepStatus)
      } catch (e) {
        console.error('Error sending status change notification:', e)
      }
    }

    return NextResponse.json(rental)
  } catch (error) {
    console.error('Error updating rental:', error)
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 })
  }
}

// DELETE /api/rentals - Delete rental
export async function DELETE(request: NextRequest) {
  // Require authentication and permission to manage rentals
  let user;
  try {
    user = await requirePermission(request, 'canManageRentals');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 })
    }
    
    await prisma.rental.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rental:', error)
    return NextResponse.json({ error: 'Failed to delete rental' }, { status: 500 })
  }
}