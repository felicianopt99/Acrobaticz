import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const JobReferenceSchema = z.object({
  partnerId: z.string().min(1, 'Partner is required'),
  eventId: z.string().optional(),
  quoteId: z.string().optional(),
  clientName: z.string().optional(),
  referralNotes: z.string().optional(),
  commission: z.number().optional(),
  status: z.enum(['pending', 'active', 'completed', 'archived']).optional().default('pending'),
})

// GET /api/job-references - Get job references (filtered by partner if specified)
export async function GET(request: NextRequest) {
  const authResult = requireReadAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')

    const where: any = {}
    if (partnerId) {
      where.partnerId = partnerId
    }
    if (status) {
      where.status = status
    }

    const jobReferences = await prisma.jobReference.findMany({
      where,
      include: {
        partner: true,
        event: {
          include: { client: true }
        },
        quote: true,
      },
      orderBy: { referralDate: 'desc' },
    })

    return NextResponse.json(jobReferences)
  } catch (error) {
    console.error('Error fetching job references:', error)
    return NextResponse.json({ error: 'Failed to fetch job references' }, { status: 500 })
  }
}

// POST /api/job-references - Create new job reference
export async function POST(request: NextRequest) {
  const authResult = requirePermission(request, 'canManagePartners')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const validatedData = JobReferenceSchema.parse(body)

    // Verify partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: validatedData.partnerId },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const jobReference = await prisma.jobReference.create({
      data: {
        ...validatedData,
        createdBy: authResult.userId,
      },
      include: {
        partner: true,
        event: {
          include: { client: true }
        },
        quote: true,
      },
    })

    return NextResponse.json(jobReference, { status: 201 })
  } catch (error) {
    console.error('Error creating job reference:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create job reference' }, { status: 500 })
  }
}

// PUT /api/job-references - Update job reference
export async function PUT(request: NextRequest) {
  const authResult = requirePermission(request, 'canManagePartners')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Job reference ID is required' }, { status: 400 })
    }

    const validatedData = JobReferenceSchema.partial().parse(updateData)

    const jobReference = await prisma.jobReference.update({
      where: { id },
      data: {
        ...validatedData,
        updatedBy: authResult.userId,
      },
      include: {
        partner: true,
        event: {
          include: { client: true }
        },
        quote: true,
      },
    })

    return NextResponse.json(jobReference)
  } catch (error) {
    console.error('Error updating job reference:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update job reference' }, { status: 500 })
  }
}

// DELETE /api/job-references - Delete job reference
export async function DELETE(request: NextRequest) {
  const authResult = requirePermission(request, 'canManagePartners')
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Job reference ID is required' }, { status: 400 })
    }

    await prisma.jobReference.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job reference:', error)
    return NextResponse.json({ error: 'Failed to delete job reference' }, { status: 500 })
  }
}
