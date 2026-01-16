import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// POST: Create a file share
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileId, sharedWith, permission, expiresAt } = await request.json();

    // Verify file exists and belongs to user
    const file = await prisma.cloudFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true },
    });

    if (!file || file.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Generate share token for public links
    const shareToken = sharedWith ? null : randomBytes(16).toString('hex');

    const share = await prisma.fileShare.create({
      data: {
        id: crypto.randomUUID(),
        fileId,
        sharedWith: sharedWith || null,
        permission: permission || 'view',
        shareToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        fileId: true,
        permission: true,
        shareToken: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}

// GET: List shares for a file
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    // Verify file exists and belongs to user
    const file = await prisma.cloudFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true },
    });

    if (!file || file.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const shares = await prisma.fileShare.findMany({
      where: { fileId },
      select: {
        id: true,
        permission: true,
        shareToken: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}

// DELETE: Remove a share
export async function DELETE(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({ error: 'shareId is required' }, { status: 400 });
    }

    const share = await prisma.fileShare.findUnique({
      where: { id: shareId },
      select: { CloudFile: { select: { ownerId: true } } },
    });

    if (!share || share.CloudFile.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    await prisma.fileShare.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting share:', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}
