import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

// GET /api/partners/[id] - Get partner by ID with full subrental history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await params
    
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        Subrental: {
          orderBy: { startDate: 'desc' },
          include: {
            Event: {
              select: {
                id: true,
                name: true,
                location: true,
                startDate: true,
                endDate: true,
              }
            }
          }
        },
        _count: {
          select: { Subrental: true }
        }
      },
    })
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }
    
    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error fetching partner:', error)
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 })
  }
}
