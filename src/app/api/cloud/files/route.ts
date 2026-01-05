import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// GET: List files for user
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || searchParams.get('parentId') || null;
    const starred = searchParams.get('starred') === 'true';
    const recent = searchParams.get('recent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let where: any = {
      ownerId: auth.userId,
      isTrashed: false,
    };

    // Handle different query types
    if (!starred && !recent) {
      // Default: files in a specific folder
      where.folderId = folderId === 'null' ? null : folderId;
    }

    if (starred) {
      where.isStarred = true;
    }

    const files = await prisma.cloudFile.findMany({
      where,
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        isStarred: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: recent ? limit : undefined,
    });

    // Convert BigInt to string for JSON serialization
    const filesWithStringSize = files.map(file => ({
      ...file,
      size: file.size.toString(),
    }));

    return NextResponse.json({ files: filesWithStringSize });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
