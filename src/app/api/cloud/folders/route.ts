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

// GET: List folders for user (root level or in a specific folder)
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId') || null;

    const folders = await prisma.cloudFolder.findMany({
      where: {
        ownerId: auth.userId,
        parentId: parentId === 'null' ? null : parentId,
        isTrashed: false,
      },
      select: {
        id: true,
        name: true,
        color: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST: Create a new folder
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, parentId, color } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // Verify parent folder exists and belongs to user (if provided)
    if (parentId) {
      const parentFolder = await prisma.cloudFolder.findUnique({
        where: { id: parentId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!parentFolder || parentFolder.ownerId !== auth.userId || parentFolder.isTrashed) {
        return NextResponse.json(
          { error: 'Parent folder not found or not accessible' },
          { status: 404 }
        );
      }
    }

    const folder = await prisma.cloudFolder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        ownerId: auth.userId,
        color: color || '#1F2937',
      },
      select: {
        id: true,
        name: true,
        color: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
    });

    // Log activity
    await prisma.fileActivity.create({
      data: {
        fileId: '', // This is a folder activity, we'll update schema later to support folder activities
        userId: auth.userId,
        action: 'created',
        details: JSON.stringify({ type: 'folder', folderId: folder.id, folderName: folder.name }),
      },
    }).catch(() => {
      // Ignore errors in activity logging
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
