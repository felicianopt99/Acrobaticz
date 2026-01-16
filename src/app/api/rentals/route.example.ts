// @ts-nocheck
/**
 * Example: Secure Rental API Endpoint
 * 
 * This file demonstrates how to integrate all security layers:
 * 1. Error Handling
 * 2. Input Sanitization & Validation
 * 3. Activity Logging
 * 4. Soft-Delete Filtering
 * 5. Rate Limiting
 * 
 * Usage: Copy patterns from this file into your actual API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, errorResponse, successResponse } from '@/lib/error-handler';
import { logManualActivity } from '@/lib/activity-logger';
import { RentalCreationSchema, RentalUpdateSchema, validateInput } from '@/lib/input-sanitization';
import { checkApiRateLimit, rateLimitExceeded, addRateLimitHeaders, RATE_LIMIT_PRESETS } from '@/lib/rate-limiter';
import { getSocketIO } from '@/lib/socket-server';
import { z } from 'zod';

/**
 * POST /api/rentals - Create new rental (with all security layers)
 * 
 * Security Layers:
 * ✅ Rate Limiting (10 requests/min for write operations)
 * ✅ Input Sanitization & Validation (Zod + DOMPurify)
 * ✅ Automatic Activity Logging
 * ✅ Soft-Delete Filtering (only active events/equipment)
 * ✅ Centralized Error Handling
 */
export async function POST(request: NextRequest) {
  try {
    // 1️⃣ RATE LIMITING - Check if user exceeded limits
    const rateLimitCheck = checkApiRateLimit(request, RATE_LIMIT_PRESETS.WRITE);
    if (!rateLimitCheck.allowed) {
      return rateLimitExceeded(rateLimitCheck);
    }

    // 2️⃣ INPUT VALIDATION - Parse and sanitize input
    const body = await request.json();
    const validationResult = validateInput(RentalCreationSchema, body);

    if (!validationResult.success) {
      return errorResponse(
        'Invalid input data',
        400,
        validationResult.errors
      );
    }

    const validatedData = validationResult.data;

    // 3️⃣ BUSINESS LOGIC - Validate equipment availability
    // (Soft-deleted records are automatically filtered by middleware)
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      select: { id: true, name: true, startDate: true, endDate: true, deletedAt: true },
    });

    if (!event) {
      return errorResponse('Event not found', 404);
    }

    if (event.deletedAt !== null) {
      return errorResponse('Cannot rent equipment for a deleted event', 410);
    }

    // Validate equipment exists and is not deleted
    const equipmentIds = validatedData.equipment.map((e) => e.equipmentId);
    const equipmentItems = await prisma.equipmentItem.findMany({
      where: {
        id: { in: equipmentIds },
      },
      select: { id: true, name: true, deletedAt: true },
    });

    if (equipmentItems.length !== equipmentIds.length) {
      return errorResponse('One or more equipment items not found', 404);
    }

    const deletedEquipment = equipmentItems.filter((eq) => eq.deletedAt !== null);
    if (deletedEquipment.length > 0) {
      return errorResponse(
        `Equipment no longer available: ${deletedEquipment.map((eq) => eq.name).join(', ')}`,
        410
      );
    }

    // 4️⃣ CREATE RENTAL
    const rentals = [];
    for (const item of validatedData.equipment) {
      const rental = await prisma.rental.create({
        data: {
          eventId: validatedData.eventId,
          equipmentId: item.equipmentId,
          quantityRented: item.quantity,
          notes: validatedData.notes,
        },
        include: {
          event: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true } },
        },
      });
      rentals.push(rental);

      // 5️⃣ ACTIVITY LOGGING - Log the create operation
      const userId = request.headers.get('x-user-id') || 'unknown';
      await logManualActivity(
        userId,
        'Rental',
        rental.id,
        'CREATE',
        {
          equipmentId: { oldValue: null, newValue: item.equipmentId },
          quantity: { oldValue: null, newValue: item.quantity },
        },
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );
    }

    // 6️⃣ REAL-TIME SYNC - Emit Socket.IO events
    const io = getSocketIO();
    if (io) {
      for (const rental of rentals) {
        io.to('sync-rental').emit('rental:created', rental);
      }
    }

    // 7️⃣ SUCCESS RESPONSE - Add rate limit headers
    const response = successResponse(rentals, 201);
    return addRateLimitHeaders(response, rateLimitCheck, RATE_LIMIT_PRESETS.WRITE.maxRequests);

  } catch (error) {
    // Centralized error handling - converts Prisma errors to user-friendly messages
    return handleApiError(error);
  }
}

/**
 * PUT /api/rentals - Update rental (with all security layers)
 */
export async function PUT(request: NextRequest) {
  try {
    // 1️⃣ RATE LIMITING
    const rateLimitCheck = checkApiRateLimit(request, RATE_LIMIT_PRESETS.WRITE);
    if (!rateLimitCheck.allowed) {
      return rateLimitExceeded(rateLimitCheck);
    }

    // 2️⃣ INPUT VALIDATION
    const body = await request.json();
    const validationResult = validateInput(RentalUpdateSchema, body);

    if (!validationResult.success) {
      return errorResponse('Invalid input data', 400, validationResult.errors);
    }

    const { id, ...updateData } = validationResult.data;

    // 3️⃣ GET OLD DATA FOR AUDIT TRAIL
    const oldRental = await prisma.rental.findUnique({
      where: { id },
      select: {
        id: true,
        equipmentId: true,
        quantityRented: true,
        prepStatus: true,
        notes: true,
      },
    });

    if (!oldRental) {
      return errorResponse('Rental not found', 404);
    }

    // 4️⃣ UPDATE RENTAL
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: updateData,
      include: {
        event: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
      },
    });

    // 5️⃣ ACTIVITY LOGGING - Log changes
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    for (const [key, newValue] of Object.entries(updateData)) {
      changes[key] = {
        oldValue: (oldRental as any)[key],
        newValue,
      };
    }

    const userId = request.headers.get('x-user-id') || 'unknown';
    await logManualActivity(
      userId,
      'Rental',
      id,
      'UPDATE',
      changes,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    // 6️⃣ REAL-TIME SYNC
    const io = getSocketIO();
    if (io) {
      io.to('sync-rental').emit('rental:updated', updatedRental);
    }

    // 7️⃣ SUCCESS RESPONSE
    const response = successResponse(updatedRental);
    return addRateLimitHeaders(response, rateLimitCheck, RATE_LIMIT_PRESETS.WRITE.maxRequests);

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rentals - Soft-delete rental (with all security layers)
 * 
 * Note: Uses soft-delete, so the record is marked as deleted but not removed from database
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1️⃣ RATE LIMITING
    const rateLimitCheck = checkApiRateLimit(request, RATE_LIMIT_PRESETS.WRITE);
    if (!rateLimitCheck.allowed) {
      return rateLimitExceeded(rateLimitCheck);
    }

    // 2️⃣ GET ID FROM QUERY PARAMS
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Rental ID is required', 400);
    }

    // 3️⃣ VALIDATE UUID FORMAT
    const uuidSchema = z.string().uuid();
    try {
      uuidSchema.parse(id);
    } catch {
      return errorResponse('Invalid rental ID format', 400);
    }

    // 4️⃣ GET RENTAL FOR AUDIT
    const rental = await prisma.rental.findUnique({
      where: { id },
      select: { id: true, equipmentId: true, eventId: true },
    });

    if (!rental) {
      return errorResponse('Rental not found', 404);
    }

    // 5️⃣ SOFT-DELETE RENTAL
    const deletedRental = await prisma.rental.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        event: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
      },
    });

    // 6️⃣ ACTIVITY LOGGING
    const userId = request.headers.get('x-user-id') || 'unknown';
    await logManualActivity(
      userId,
      'Rental',
      id,
      'DELETE',
      undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    // 7️⃣ REAL-TIME SYNC
    const io = getSocketIO();
    if (io) {
      io.to('sync-rental').emit('rental:deleted', id);
    }

    // 8️⃣ SUCCESS RESPONSE
    const response = successResponse({ success: true, id });
    return addRateLimitHeaders(response, rateLimitCheck, RATE_LIMIT_PRESETS.WRITE.maxRequests);

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/rentals - Get all active rentals
 * 
 * Note: Soft-deleted records are automatically filtered by Prisma middleware
 * No need to manually add { deletedAt: null } filter
 */
export async function GET(request: NextRequest) {
  try {
    // 1️⃣ RATE LIMITING (relaxed for read operations)
    const rateLimitCheck = checkApiRateLimit(request, RATE_LIMIT_PRESETS.READ);
    if (!rateLimitCheck.allowed) {
      return rateLimitExceeded(rateLimitCheck);
    }

    // 2️⃣ FETCH RENTALS (soft-deleted records automatically excluded)
    const rentals = await prisma.rental.findMany({
      include: {
        event: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3️⃣ SUCCESS RESPONSE
    const response = successResponse(rentals);
    return addRateLimitHeaders(response, rateLimitCheck, RATE_LIMIT_PRESETS.READ.maxRequests);

  } catch (error) {
    return handleApiError(error);
  }
}
