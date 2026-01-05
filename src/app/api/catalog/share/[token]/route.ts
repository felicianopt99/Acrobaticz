/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    // Find catalog share by token
    // @ts-expect-error - CatalogShare model exists in database
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
    const equipment = await prisma.equipmentItem.findMany({
      where: {
        id: {
          in: catalogShare.selectedEquipmentIds,
        },
      },
      include: {
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
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        partner: catalogShare.partner,
        equipment,
        shareToken: token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching catalog share data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
