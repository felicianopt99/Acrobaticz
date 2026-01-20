import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { requireReadAccess, requirePermission } from '@/lib/api-auth'


// Helper function to transform Prisma Quote response to frontend Quote format
// Maps QuoteItem[] to items[] and handles field name conversions
const transformQuoteResponse = (quote: any) => {
  const { QuoteItem, ...baseQuote } = quote
  return {
    ...baseQuote,
    items: QuoteItem || [],
  }
}

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
        Client: true,
        QuoteItem: {
          include: {
            EquipmentItem: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Transform response: map QuoteItem to items
    const transformedQuotes = quotes.map(transformQuoteResponse)
    return NextResponse.json(transformedQuotes)
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

    console.log('[QUOTES POST] Received body:', {
      hasDraft: !!draft,
      hasItems: Array.isArray(items),
      itemsCount: Array.isArray(items) ? items.length : 0,
      restKeys: Object.keys(rest),
    })
    console.log('[QUOTES POST] Items:', items)

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
      id: crypto.randomUUID(),
      ...validatedBase,
      quoteNumber,
      clientEmail: validatedBase.clientEmail || undefined,
      updatedAt: new Date(),
    }
    if (draft && validatedBase.startDate instanceof Date === false && typeof validatedBase.startDate === 'string') {
      dataToCreate.startDate = new Date(validatedBase.startDate)
    }
    if (draft && validatedBase.endDate instanceof Date === false && typeof validatedBase.endDate === 'string') {
      dataToCreate.endDate = new Date(validatedBase.endDate)
    }

    // Helper function to map item fields to valid QuoteItem schema fields
    const mapItemToQuoteItem = (item: any) => {
      // Only include fields that exist in QuoteItem schema
      const validFields: any = {
        id: crypto.randomUUID(),
        type: String(item.type || 'equipment'),
        equipmentId: item.equipmentId || undefined,
        equipmentName: item.equipmentName || undefined,
        serviceId: item.serviceId || undefined,
        serviceName: item.serviceName || undefined,
        feeId: item.feeId || undefined,
        feeName: item.feeName || undefined,
        amount: item.amount !== undefined && item.amount !== null ? Number(item.amount) : undefined,
        feeType: item.feeType || undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : undefined,
        unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? Number(item.unitPrice) : undefined,
        days: item.days !== undefined && item.days !== null ? Number(item.days) : undefined,
        lineTotal: item.lineTotal !== undefined && item.lineTotal !== null ? Number(item.lineTotal) : 0,
        updatedAt: new Date(),
      }
      // Remove undefined values to let database defaults handle them
      return Object.fromEntries(Object.entries(validFields).filter(([, v]) => v !== undefined))
    }

    const quote = await prisma.quote.create({
      data: {
        ...dataToCreate,
        QuoteItem: validatedItems && validatedItems.length > 0 ? { 
          create: validatedItems.map(mapItemToQuoteItem)
        } : undefined,
      },
      include: {
        Client: true,
        QuoteItem: { include: { EquipmentItem: true } },
      },
    })

    // Transform response: map QuoteItem to items
    const transformedQuote = transformQuoteResponse(quote)
    return NextResponse.json(transformedQuote, { status: 201 })
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

    console.log('[QUOTES PUT] Received body:', {
      quoteId: id,
      hasItems: Array.isArray(items),
      itemsCount: Array.isArray(items) ? items.length : 0,
      updateDataKeys: Object.keys(updateData),
    })
    console.log('[QUOTES PUT] Items:', items)

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

    // Helper function to map item fields to valid QuoteItem schema fields
    const mapItemToQuoteItem = (item: any) => {
      // Only include fields that exist in QuoteItem schema
      const validFields: any = {
        id: item.id || crypto.randomUUID(),
        type: String(item.type || 'equipment'),
        equipmentId: item.equipmentId || undefined,
        equipmentName: item.equipmentName || undefined,
        serviceId: item.serviceId || undefined,
        serviceName: item.serviceName || undefined,
        feeId: item.feeId || undefined,
        feeName: item.feeName || undefined,
        amount: item.amount !== undefined && item.amount !== null ? Number(item.amount) : undefined,
        feeType: item.feeType || undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : undefined,
        unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? Number(item.unitPrice) : undefined,
        days: item.days !== undefined && item.days !== null ? Number(item.days) : undefined,
        lineTotal: item.lineTotal !== undefined && item.lineTotal !== null ? Number(item.lineTotal) : 0,
        updatedAt: new Date(),
      }
      // Remove undefined values to let database defaults handle them
      return Object.fromEntries(Object.entries(validFields).filter(([, v]) => v !== undefined))
    }

    // If items provided, just clean them for Prisma without strict validation
    let validatedItems: any[] = []
    if (Array.isArray(items) && items.length > 0) {
      try {
        console.log('Items being processed for update:', JSON.stringify(items.slice(0, 1), null, 2), `... (${items.length} total)`)
        // Map items to valid QuoteItem fields
        validatedItems = items.map((item: any) => mapItemToQuoteItem(item))
      } catch (e) {
        console.error('Error processing items:', e)
        return NextResponse.json({ error: 'Failed to process items', details: String(e) }, { status: 400 })
      }
    }

    // Build update payload with only valid Quote scalar fields
    // Filter out relations, non-existent fields, and internal fields
    const validQuoteFields = [
      'name', 'location', 'clientId', 'clientName', 'clientEmail', 'clientPhone', 'clientAddress',
      'startDate', 'endDate', 'subTotal', 'discountAmount', 'discountType', 'taxRate', 'taxAmount',
      'totalAmount', 'status', 'notes', 'terms', 'updatedAt'
    ]
    
    const updatePayload: any = {}
    for (const field of validQuoteFields) {
      if (field in baseValidated) {
        updatePayload[field] = baseValidated[field]
      }
    }
    // Ensure clientEmail is undefined if empty
    if (updatePayload.clientEmail === '') {
      updatePayload.clientEmail = undefined
    }
    updatePayload.updatedAt = new Date()

    // Run in a transaction if items are being replaced
    const result = await prisma.$transaction(async (tx) => {
      // CRITICAL FIX: ALWAYS update items when present in request, even if empty
      // This prevents the bug where items array gets lost during update
      // When items key exists in body, we MUST respect it and sync the DB
      const shouldUpdateItems = 'items' in body // Check if items key exists in body, not just if length > 0
      
      if (shouldUpdateItems) {
        // Replace items atomically - delete ALL old items and create new ones
        console.log(`[QUOTES PUT] Updating quote items. Current items: ${Array.isArray(items) ? items.length : 0}`)
        
        // Always delete old items first
        const deletedCount = await tx.quoteItem.deleteMany({ where: { quoteId: id } })
        console.log(`[QUOTES PUT] Deleted ${deletedCount.count} old items`)
        
        // Then create new items if any provided
        if (Array.isArray(items) && items.length > 0) {
          console.log(`[QUOTES PUT] Creating ${validatedItems.length} new items`)
          await tx.quote.update({
            where: { id },
            data: {
              ...updatePayload,
              QuoteItem: { create: validatedItems },
            },
          })
        } else {
          // Even if no items, still update quote fields
          console.log(`[QUOTES PUT] No items to create, updating quote fields only`)
          await tx.quote.update({ where: { id }, data: updatePayload })
        }
      } else {
        // Only update quote fields (items not included in request)
        console.log('[QUOTES PUT] Items not in request body, updating quote fields only')
        await tx.quote.update({ where: { id }, data: updatePayload })
      }

      // Return the full updated entity with includes
      const updated = await tx.quote.findUnique({
        where: { id },
        include: {
          Client: true,
          QuoteItem: { include: { EquipmentItem: true } },
        },
      })
      if (!updated) throw new Error('Updated quote not found')
      return updated
    })

    // Transform response: map QuoteItem to items
    const transformedResult = transformQuoteResponse(result)
    return NextResponse.json(transformedResult)
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
    const body = await request.json()
    const { id } = body
    
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