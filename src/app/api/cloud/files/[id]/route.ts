import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { readFile, deleteFile } from '@/lib/storage';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// GET: Download file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileId = id;

    const file = await prisma.cloudFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true, storagePath: true, name: true, mimeType: true },
    });

    if (!file || file.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file from disk
    const buffer = await readFile(file.storagePath);

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

// PATCH: Rename, move, star file
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileId = id;
    const { name, folderId, isStarred } = await request.json();

    // Verify file exists and belongs to user
    const file = await prisma.cloudFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true, isTrashed: true },
    });

    if (!file || file.ownerId !== auth.userId || file.isTrashed) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Verify new folder if moving
    if (folderId) {
      const folder = await prisma.cloudFolder.findUnique({
        where: { id: folderId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!folder || folder.ownerId !== auth.userId || folder.isTrashed) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.cloudFile.update({
      where: { id: fileId },
      data: {
        ...(name && { name }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(isStarred !== undefined && { isStarred }),
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ file: updated });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

// DELETE: Move to trash or permanently delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileId = id;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Verify file exists and belongs to user
    const file = await prisma.cloudFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true, storagePath: true, size: true },
    });

    if (!file || file.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanently delete file from disk
      try {
        await deleteFile(file.storagePath);
      } catch (e) {
        console.error('Failed to delete file from disk:', e);
      }

      // Delete file record
      await prisma.cloudFile.delete({
        where: { id: fileId },
      });

      // Update user's storage quota
      await prisma.storageQuota.updateMany({
        where: { userId: auth.userId },
        data: {
          usedBytes: {
            decrement: file.size,
          },
        },
      });
    } else {
      // Soft delete to trash
      await prisma.cloudFile.update({
        where: { id: fileId },
        data: { isTrashed: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
