import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'

const ClientSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  partnerId: z.string().optional().or(z.literal('none')),
})

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view clients

  try {
    console.log('[API] GET /api/clients - Fetching all clients from database')
    
    const clients = await prisma.client.findMany({
      include: {
        Event: true,
        Quote: true,
        _count: {
          select: { 
            Event: true,
            Quote: true 
          }
        }
      },
      orderBy: { name: 'asc' },
    })
    
    console.log('[API] GET /api/clients - Found clients:', clients.length)
    return NextResponse.json(clients)
  } catch (error) {
    console.error('[API] GET /api/clients - ERROR:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    console.log('[API] POST /api/clients - Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = ClientSchema.parse(body)
    console.log('[API] POST /api/clients - Validated data:', JSON.stringify(validatedData, null, 2))
    
    // Handle partnerId
    let partnerId: string | undefined = undefined
    if (validatedData.partnerId && validatedData.partnerId !== 'none') {
      console.log('[API] POST /api/clients - Verifying partner:', validatedData.partnerId)
      // Verify the partner exists
      const partnerExists = await prisma.partner.findUnique({
        where: { id: validatedData.partnerId },
      })
      if (!partnerExists) {
        console.log('[API] POST /api/clients - Partner not found:', validatedData.partnerId)
        return NextResponse.json({ error: 'The specified partner does not exist' }, { status: 400 })
      }
      partnerId = validatedData.partnerId
    }
    
    console.log('[API] POST /api/clients - Creating client in database:', { name: validatedData.name, partnerId })
    
    const client = await prisma.client.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        contactPerson: validatedData.contactPerson,
        email: validatedData.email || undefined,
        phone: validatedData.phone,
        address: validatedData.address,
        notes: validatedData.notes,
        partnerId,
        updatedAt: new Date(),
      },
    })
    
    console.log('[API] POST /api/clients - Client created successfully:', JSON.stringify(client, null, 2))
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/clients - ERROR:', error)
    if (error instanceof z.ZodError) {
      console.error('[API] POST /api/clients - Validation error:', error.errors)
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

// PUT /api/clients - Update client
export async function PUT(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    const validatedData = ClientSchema.partial().parse(updateData)
    
    // Handle partnerId separately
    let partnerId: string | undefined | null = undefined
    let hasPartnerIdUpdate = false
    
    if (validatedData.partnerId !== undefined) {
      hasPartnerIdUpdate = true
      if (validatedData.partnerId && validatedData.partnerId !== 'none') {
        // Verify the partner exists
        const partnerExists = await prisma.partner.findUnique({
          where: { id: validatedData.partnerId },
        })
        if (!partnerExists) {
          return NextResponse.json({ error: 'The specified partner does not exist' }, { status: 400 })
        }
        partnerId = validatedData.partnerId
      } else {
        // Clear the partnership
        partnerId = null
      }
    }
    
    const updatePayload: any = {
      name: validatedData.name,
      contactPerson: validatedData.contactPerson,
      email: validatedData.email || undefined,
      phone: validatedData.phone,
      address: validatedData.address,
      notes: validatedData.notes,
    }
    
    if (hasPartnerIdUpdate) {
      updatePayload.partnerId = partnerId
    }
    
    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined && key !== 'partnerId') {
        delete updatePayload[key]
      }
    })
    
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...updatePayload,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { Event: true, Quote: true }
        }
      }
    })
    
    // Sync client details to linked partners (where this client is a direct client of the partner)
    const partnersLinkedToClient = await prisma.partner.findMany({
      where: { clientId: id },
    })
    
    if (partnersLinkedToClient.length > 0) {
      const syncData: any = {}
      
      // Map shared fields from client to partner
      if (validatedData.name !== undefined) syncData.name = validatedData.name
      if (validatedData.contactPerson !== undefined) syncData.contactPerson = validatedData.contactPerson
      if (validatedData.email !== undefined) syncData.email = validatedData.email || undefined
      if (validatedData.phone !== undefined) syncData.phone = validatedData.phone || undefined
      if (validatedData.address !== undefined) syncData.address = validatedData.address || undefined
      if (validatedData.notes !== undefined) syncData.notes = validatedData.notes || undefined
      
      // Update all linked partners with new details
      if (Object.keys(syncData).length > 0) {
        await prisma.partner.updateMany({
          where: { clientId: id },
          data: syncData,
        })
      }
    }

    
    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients - Delete client
export async function DELETE(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    await prisma.client.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}