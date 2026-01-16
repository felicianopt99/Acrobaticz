import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    const limit = request.nextUrl.searchParams.get('limit') || '20';
    const offset = request.nextUrl.searchParams.get('offset') || '0';

    const activities = await prisma.fileActivity.findMany({
      where: {
        CloudFile: {
          // ownerId: auth.userId, // TODO: Add auth filter
        },
      },
      select: {
        id: true,
        fileId: true,
        CloudFile: { select: { name: true } },
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
        fileName: a.CloudFile?.name || 'Unknown',
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
