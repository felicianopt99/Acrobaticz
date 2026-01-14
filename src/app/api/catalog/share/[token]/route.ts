/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { CacheInvalidation } from '@/lib/cache-invalidation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = CACHE_KEYS.CATALOG_SHARE(token);
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log(`[Catalog API] Cache hit for token: ${token}`);
      return NextResponse.json(cached);
    }

    // Find catalog share by token
    const catalogShare = await prisma.catalogShare.findUnique({
      where: { token },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            companyName: true,
            logoUrl: true,
            address: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!catalogShare) {
      return NextResponse.json(
        { error: 'Catalog share link not found or has expired' },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (catalogShare.expiresAt && new Date() > catalogShare.expiresAt) {
      return NextResponse.json(
        { error: 'Catalog share link has expired' },
        { status: 410 }
      );
    }

    // Fetch equipment items that are in the selectedEquipmentIds array
    // OPTIMIZED: Use select instead of include, order by application (faster than ordering by relation)
    const equipment = await prisma.equipmentItem.findMany({
      where: {
        id: {
          in: catalogShare.selectedEquipmentIds,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        dailyRate: true,
        quantity: true,
        quantityByStatus: true,
        location: true,
        type: true,
        status: true,
        imageUrl: true,
        imageContentType: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' }, // Only order by equipment name (faster)
    });

    // Sort by category name in application (much faster than DB-level join ordering)
    const sortedEquipment = equipment.sort((a, b) => {
      const categoryCompare = (a.category?.name || '').localeCompare(b.category?.name || '');
      if (categoryCompare !== 0) return categoryCompare;
      return a.name.localeCompare(b.name);
    });

    const response = {
      success: true,
      partner: catalogShare.partner,
      equipment: sortedEquipment,
      shareToken: token,
    };

    // Cache for 10 minutes
    cacheManager.set(cacheKey, response, CACHE_TTL.CATALOG_SHARE);
    console.log(`[Catalog API] Cached catalog share for token: ${token}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching catalog share data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
