import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireReadAccess } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const auth = requireReadAccess(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const limit = request.nextUrl.searchParams.get('limit') || '20';
    const offset = request.nextUrl.searchParams.get('offset') || '0';

    const activities = await prisma.fileActivity.findMany({
      where: {
        file: {
          ownerId: auth.userId,
        },
      },
      select: {
        id: true,
        fileId: true,
        file: { select: { name: true } },
        action: true,
        createdAt: true,
        details: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    return NextResponse.json({
      activities: activities.map(a => ({
        id: a.id,
        fileId: a.fileId,
        fileName: a.file?.name || 'Unknown',
        action: a.action,
        createdAt: a.createdAt,
        details: a.details,
      })),
      count: activities.length,
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
