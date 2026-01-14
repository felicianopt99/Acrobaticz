import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

// GET /api/subrentals/[id] - Get subrental by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await params
    
    const subrental = await prisma.subrental.findUnique({
      where: { id },
      include: {
        partner: true,
        event: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
      },
    })
    
    if (!subrental) {
      return NextResponse.json({ error: 'Subrental not found' }, { status: 404 })
    }
    
    return NextResponse.json(subrental)
  } catch (error) {
    console.error('Error fetching subrental:', error)
    return NextResponse.json({ error: 'Failed to fetch subrental' }, { status: 500 })
  }
}

// PATCH /api/subrentals/[id] - Update subrental status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['pending', 'active', 'returned', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const subrental = await prisma.subrental.update({
      where: { id },
      data: {
        status,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    })
    
    return NextResponse.json(subrental)
  } catch (error) {
    console.error('Error updating subrental status:', error)
    return NextResponse.json({ error: 'Failed to update subrental status' }, { status: 500 })
  }
}
