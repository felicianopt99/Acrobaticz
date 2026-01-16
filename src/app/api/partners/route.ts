import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const PartnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required'),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  clientId: z.string().optional().or(z.literal('none')),
  partnerType: z.string().optional().default('provider'),
  commission: z.number().positive().optional(),
  isActive: z.boolean().optional().default(true),
  logoUrl: z.string().optional(),
})

// GET /api/partners - Get all partners
export async function GET(request: NextRequest) {

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
        Client_Partner_clientIdToClient: true,
        Subrental: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
        _count: {
          select: { Subrental: true }
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

  try {
    const body = await request.json()
    
    // Validate the data
    const validatedData = PartnerSchema.parse(body)
    
    // Convert "none" and empty string clientId to undefined
    let clientId: string | undefined = undefined
    if (validatedData.clientId && validatedData.clientId !== 'none' && validatedData.clientId.trim()) {
      clientId = validatedData.clientId
      // Verify the client exists
      const clientExists = await prisma.client.findUnique({
        where: { id: clientId },
      })
      if (!clientExists) {
        return NextResponse.json({ error: 'The specified client does not exist' }, { status: 400 })
      }
    }
    
    // Convert empty strings to undefined for optional fields
    const createData = {
      name: validatedData.name,
      companyName: validatedData.companyName && validatedData.companyName.trim() ? validatedData.companyName : undefined,
      contactPerson: validatedData.contactPerson && validatedData.contactPerson.trim() ? validatedData.contactPerson : undefined,
      email: validatedData.email && validatedData.email.trim() ? validatedData.email : undefined,
      phone: validatedData.phone && validatedData.phone.trim() ? validatedData.phone : undefined,
      address: validatedData.address && validatedData.address.trim() ? validatedData.address : undefined,
      website: validatedData.website && validatedData.website.trim() ? validatedData.website : undefined,
      notes: validatedData.notes && validatedData.notes.trim() ? validatedData.notes : undefined,
      clientId,
      partnerType: validatedData.partnerType || 'provider',
      commission: validatedData.commission,
      isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
    }
    
    const partner = await prisma.partner.create({
      data: {
        id: crypto.randomUUID(),
        ...createData,
        updatedAt: new Date(),
      },
      include: {
        Client_Partner_clientIdToClient: true,
        _count: {
          select: { Subrental: true }
        }
      }
    })
    
    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error('Error creating partner:', error)
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation error: ${fieldErrors}` }, { status: 400 })
    }

    if (error instanceof Error) {
      const msg = error.message || ''
      // Detect common schema mismatch errors (missing column) and give actionable guidance
      if (msg.includes('logoUrl') || /does not exist/.test(msg) || /column .* does not exist/.test(msg)) {
        return NextResponse.json(
          {
            error: 'Database schema mismatch: missing column for Partner.logoUrl',
            details:
              'Your database schema is out of sync with Prisma. Start your database and run migrations: `npx prisma migrate deploy` (or `npx prisma migrate dev`). If using Docker, run `docker-compose -f docker-compose.dev.yml up -d postgres` first.'
          },
          { status: 500 }
        )
      }

      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
}

// PUT /api/partners - Update partner
export async function PUT(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }
    
    const validatedData = PartnerSchema.partial().parse(updateData)
    
    // Handle clientId separately to properly clear it when needed
    let clientId: string | undefined | null = undefined
    let hasClientIdUpdate = false
    
    if (validatedData.clientId !== undefined) {
      hasClientIdUpdate = true
      if (validatedData.clientId && validatedData.clientId !== 'none' && validatedData.clientId.trim()) {
        clientId = validatedData.clientId
        // Verify the client exists
        const clientExists = await prisma.client.findUnique({
          where: { id: clientId },
        })
        if (!clientExists) {
          return NextResponse.json({ error: 'The specified client does not exist' }, { status: 400 })
        }
      } else {
        // Explicitly set to null to clear the relationship
        clientId = null
      }
    }
    
    // Convert empty strings to undefined for optional fields, excluding clientId
    const updatePayload: any = {
      ...validatedData,
      ...(hasClientIdUpdate && { clientId }),
    }
    
    // Remove clientId from updatePayload if we explicitly handled it
    if (hasClientIdUpdate) {
      delete updatePayload.clientId
      updatePayload.clientId = clientId
    }
    
    // Handle optional string fields
    if (validatedData.email !== undefined) {
      updatePayload.email = validatedData.email && validatedData.email.trim() ? validatedData.email : undefined
    }
    if (validatedData.website !== undefined) {
      updatePayload.website = validatedData.website && validatedData.website.trim() ? validatedData.website : undefined
    }
    if (validatedData.phone !== undefined) {
      updatePayload.phone = validatedData.phone && validatedData.phone.trim() ? validatedData.phone : undefined
    }
    if (validatedData.address !== undefined) {
      updatePayload.address = validatedData.address && validatedData.address.trim() ? validatedData.address : undefined
    }
    if (validatedData.notes !== undefined) {
      updatePayload.notes = validatedData.notes && validatedData.notes.trim() ? validatedData.notes : undefined
    }
    if (validatedData.companyName !== undefined) {
      updatePayload.companyName = validatedData.companyName && validatedData.companyName.trim() ? validatedData.companyName : undefined
    }
    if (validatedData.contactPerson !== undefined) {
      updatePayload.contactPerson = validatedData.contactPerson && validatedData.contactPerson.trim() ? validatedData.contactPerson : undefined
    }
    
    
    const partner = await prisma.partner.update({
      where: { id },
      data: updatePayload,
      include: {
        Client_Partner_clientIdToClient: true,
        _count: {
          select: { Subrental: true }
        }
      }
    })
    
    // Sync partner details to linked client
    if (partner.clientId) {
      const syncData: any = {}
      
      // Map shared fields from partner to client
      if (validatedData.name !== undefined) syncData.name = validatedData.name
      if (validatedData.contactPerson !== undefined) syncData.contactPerson = validatedData.contactPerson
      if (validatedData.email !== undefined) syncData.email = validatedData.email || undefined
      if (validatedData.phone !== undefined) syncData.phone = validatedData.phone || undefined
      if (validatedData.address !== undefined) syncData.address = validatedData.address || undefined
      if (validatedData.notes !== undefined) syncData.notes = validatedData.notes || undefined
      
      // Update the linked client with new details
      if (Object.keys(syncData).length > 0) {
        await prisma.client.update({
          where: { id: partner.clientId },
          data: syncData,
        })
      }
    }
    
    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error updating partner:', error)
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation error: ${fieldErrors}` }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}

// DELETE /api/partners - Delete partner
export async function DELETE(request: NextRequest) {

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
