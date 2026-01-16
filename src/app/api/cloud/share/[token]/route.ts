import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    // Find share by token
    const share = await prisma.fileShare.findUnique({
      where: { shareToken: token },
      include: {
        CloudFile: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if share has expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share expired' }, { status: 410 });
    }

    // Check if share is public (sharedWith is null means it's public)
    if (share.sharedWith !== null) {
      return NextResponse.json({ error: 'This share is not public' }, { status: 403 });
    }

    return NextResponse.json({
      file: {
        id: share.CloudFile.id,
        name: share.CloudFile.name,
        mimeType: share.CloudFile.mimeType,
        size: share.CloudFile.size.toString(),
        storagePath: share.CloudFile.storagePath,
      },
      share: {
        permission: share.permission,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error) {
    console.error('Share lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared file' },
      { status: 500 }
    );
  }
}
