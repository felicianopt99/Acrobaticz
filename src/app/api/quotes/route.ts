import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'


const QuoteItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['equipment', 'service', 'fee', 'subrental']),
  // Equipment fields
  equipmentId: z.string().optional(),
  equipmentName: z.string().optional(),
  // Service fields
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  // Fee fields
  feeId: z.string().optional(),
  feeName: z.string().optional(),
  amount: z.number().optional(),
  feeType: z.enum(['fixed', 'percentage']).optional(),
  // Subrental fields
  partnerId: z.string().optional(),
  partnerName: z.string().optional(),
  subrentalCost: z.number().optional(),
  // Common fields
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  days: z.number().optional(),
  lineTotal: z.number().min(0).optional(),
  description: z.string().optional(),
  // Database fields - allow but ignore
  quoteId: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  // Relations (will be stripped out before Prisma operations)
  equipment: z.any().optional(),
}).passthrough()

const QuoteSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  startDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  endDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  items: z.array(QuoteItemSchema),
  subTotal: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  discountType: z.enum(['percentage', 'fixed']).default('fixed'),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Archived']).default('Draft'),
  notes: z.string().optional(),
  terms: z.string().optional().or(z.literal('')),
}).passthrough()

// GET /api/quotes - Get all quotes
export async function GET(request: NextRequest) {
  // Allow any authenticated user to view quotes

  try {
    const quotes = await prisma.quote.findMany({
      include: {
        client: true,
        items: {
          include: {
            equipment: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

// POST /api/quotes - Create new quote
export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const { draft, items, ...rest } = body as any

    // Validation: strict when draft is falsey; relaxed when draft=true
    let validatedBase: any
    let validatedItems: any[] | undefined
    if (draft) {
      // Allow partial fields; items optional; dates optional strings
      const PartialQuote = QuoteSchema.partial({ items: true, startDate: true, endDate: true })
      validatedBase = PartialQuote.parse({ ...rest, items: undefined })
      if (Array.isArray(items)) {
        validatedItems = z.array(QuoteItemSchema.partial()).parse(items)
      }
    } else {
      const strict = QuoteSchema.parse({ ...rest, items })
      validatedBase = { ...strict, items: undefined }
      validatedItems = strict.items
    }

    // Generate quote number
    const currentYear = new Date().getFullYear()
    const existingQuotes = await prisma.quote.findMany({
      where: { quoteNumber: { startsWith: `Q${currentYear}-` } },
      orderBy: { quoteNumber: 'desc' },
      take: 1,
    })
    let quoteNumber = `Q${currentYear}-001`
    if (existingQuotes.length > 0) {
      const lastNumber = parseInt(existingQuotes[0].quoteNumber.split('-')[1])
      quoteNumber = `Q${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Normalize optional fields
    const dataToCreate: any = {
      ...validatedBase,
      quoteNumber,
      clientEmail: validatedBase.clientEmail || undefined,
    }
    if (draft && validatedBase.startDate instanceof Date === false && typeof validatedBase.startDate === 'string') {
      dataToCreate.startDate = new Date(validatedBase.startDate)
    }
    if (draft && validatedBase.endDate instanceof Date === false && typeof validatedBase.endDate === 'string') {
      dataToCreate.endDate = new Date(validatedBase.endDate)
    }

    const quote = await prisma.quote.create({
      data: {
        ...dataToCreate,
        items: validatedItems && validatedItems.length ? { create: validatedItems } : undefined,
      },
      include: {
        client: true,
        items: { include: { equipment: true } },
      },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create quote' }, { status: 500 })
  }
}

// PUT /api/quotes - Update quote
export async function PUT(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, items, quoteNumber, createdAt, updatedAt, ...updateData } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    // Validate fields; allow partial updates for all fields since we're doing partial updates
    let baseValidated
    try {
      baseValidated = QuoteSchema.partial().parse({ ...updateData, items: undefined })
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error('Quote validation error:', e.errors)
        return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
      }
      throw e
    }

    // If items provided, just clean them for Prisma without strict validation
    let validatedItems: any[] | undefined = undefined
    if (Array.isArray(items) && items.length > 0) {
      try {
        console.log('Items being processed for update:', JSON.stringify(items.slice(0, 1), null, 2), `... (${items.length} total)`)
        // Don't validate during updates, just clean the data
        // Remove database-generated and relation fields that shouldn't be included in create operations
        validatedItems = items.map(({ id, quoteId, createdAt, updatedAt, equipment, ...item }: any) => ({
          ...item,
          // Ensure required fields have proper types
          type: String(item.type),
          lineTotal: typeof item.lineTotal === 'number' ? item.lineTotal : 0,
        }))
      } catch (e) {
        console.error('Error processing items:', e)
        return NextResponse.json({ error: 'Failed to process items', details: String(e) }, { status: 400 })
      }
    }

    // Build update payload (exclude items for now)
    const updatePayload: any = {
      ...baseValidated,
      clientEmail: baseValidated.clientEmail || undefined,
    }

    // Run in a transaction if items are being replaced
    const result = await prisma.$transaction(async (tx) => {
      // Only replace items if explicitly provided AND they appear to be new data
      // (i.e., don't have database timestamps or have been explicitly modified)
      const shouldUpdateItems = validatedItems && validatedItems.length > 0 && items?.some((item: any) => !item.id || item.isNew)
      
      if (shouldUpdateItems) {
        // Replace items atomically
        console.log('Updating quote items')
        await tx.quoteItem.deleteMany({ where: { quoteId: id } })
        await tx.quote.update({
          where: { id },
          data: {
            ...updatePayload,
            items: { create: validatedItems },
          },
        })
      } else {
        // Only update quote fields
        console.log('Updating quote fields only')
        await tx.quote.update({ where: { id }, data: updatePayload })
      }

      // Return the full updated entity with includes
      const updated = await tx.quote.findUnique({
        where: { id },
        include: {
          client: true,
          items: { include: { equipment: true } },
        },
      })
      if (!updated) throw new Error('Updated quote not found')
      return updated
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating quote:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update quote' }, { status: 500 })
  }
}

// DELETE /api/quotes - Delete quote
export async function DELETE(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }
    
    await prisma.quote.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 })
  }
}