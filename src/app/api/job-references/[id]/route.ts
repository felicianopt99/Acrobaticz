import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireReadAccess } from '@/lib/api-auth'

// GET /api/job-references/[id] - Get single job reference
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params

  try {
    const jobReference = await prisma.jobReference.findUnique({
      where: { id },
      include: {
        Partner: true,
        Event: {
          include: { Client: true }
        },
        Quote: true,
      },
    })

    if (!jobReference) {
      return NextResponse.json({ error: 'Job reference not found' }, { status: 404 })
    }

    return NextResponse.json(jobReference)
  } catch (error) {
    console.error('Error fetching job reference:', error)
    return NextResponse.json({ error: 'Failed to fetch job reference' }, { status: 500 })
  }
}
