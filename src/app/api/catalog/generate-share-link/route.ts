/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let userId: string | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId as string;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Check authorization - must be in management role
    const { hasRole, ROLE_GROUPS } = await import('@/lib/roles');
    if (!hasRole(user.role, ROLE_GROUPS.MANAGEMENT)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const { partnerId, selectedEquipmentIds } = await request.json();

    if (!partnerId || !selectedEquipmentIds || !Array.isArray(selectedEquipmentIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Verify partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true },
    });

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Generate unique token
    const shareToken = randomBytes(32).toString('hex');

    // Create catalog share record
    const catalogShare = await prisma.catalogShare.create({
      data: {
        token: shareToken,
        partnerId: partnerId,
        selectedEquipmentIds: selectedEquipmentIds,
        expiresAt: null, // No expiration by default
      },
    });

    // Generate public URL
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.DOMAIN 
        ? `https://${process.env.DOMAIN}`
        : process.env.NEXTAUTH_URL 
          ? process.env.NEXTAUTH_URL
          : 'http://localhost:3000';

    const publicUrl = `${baseUrl}/catalog/share/${catalogShare.token}`;

    return NextResponse.json(
      {
        success: true,
        shareLink: publicUrl,
        token: catalogShare.token,
        message: 'Catalog share link generated successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating catalog share link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
