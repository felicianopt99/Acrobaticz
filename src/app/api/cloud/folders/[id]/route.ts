import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { deleteDirectory, deleteFile } from '@/lib/storage';
import path from 'path';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// PATCH: Rename, move, star folder
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
    const folderId = id;
    const { name, parentId, isStarred, color } = await request.json();

    // Verify folder exists and belongs to user
    const folder = await prisma.cloudFolder.findUnique({
      where: { id: folderId },
      select: { ownerId: true, isTrashed: true },
    });

    if (!folder || folder.ownerId !== auth.userId || folder.isTrashed) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Verify new parent if moving
    if (parentId) {
      const parentFolder = await prisma.cloudFolder.findUnique({
        where: { id: parentId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!parentFolder || parentFolder.ownerId !== auth.userId || parentFolder.isTrashed) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.cloudFolder.update({
      where: { id: folderId },
      data: {
        ...(name && { name }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(isStarred !== undefined && { isStarred }),
        ...(color && { color }),
      },
      select: {
        id: true,
        name: true,
        color: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ folder: updated });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
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
    const folderId = id;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Verify folder exists and belongs to user
    const folder = await prisma.cloudFolder.findUnique({
      where: { id: folderId },
      select: { ownerId: true, id: true },
    });

    if (!folder || folder.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanently delete folder and all its contents
      // Delete all files in this folder recursively
      const files = await prisma.cloudFile.findMany({
        where: {
          folderId: folderId,
        },
        select: { id: true, storagePath: true },
      });

      // Delete file records and physical files
      for (const file of files) {
        try {
          await deleteFile(file.storagePath);
        } catch (e) {
          console.error(`Failed to delete file from disk: ${file.storagePath}`, e);
        }
      }

      await prisma.cloudFile.deleteMany({
        where: { folderId: folderId },
      });

      // Delete subfolders recursively
      const subfolders = await prisma.cloudFolder.findMany({
        where: { parentId: folderId },
        select: { id: true },
      });

      for (const subfolder of subfolders) {
        // Recursively delete subfolders
        await DELETE(request, { params: Promise.resolve({ id: subfolder.id }) });
      }

      // Delete the folder itself
      await prisma.cloudFolder.delete({
        where: { id: folderId },
      });
    } else {
      // Soft delete to trash
      await prisma.cloudFolder.update({
        where: { id: folderId },
        data: { isTrashed: true },
      });

      // Also move all files in this folder to trash
      await prisma.cloudFile.updateMany({
        where: { folderId: folderId },
        data: { isTrashed: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
