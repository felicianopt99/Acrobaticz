import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { deleteFile } from '@/lib/storage';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// GET: List trashed items
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const trashedFiles = await prisma.cloudFile.findMany({
      where: {
        ownerId: auth.userId,
        isTrashed: true,
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const trashedFolders = await prisma.cloudFolder.findMany({
      where: {
        ownerId: auth.userId,
        isTrashed: true,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Convert BigInt to string for JSON serialization
    const filesWithStringSize = trashedFiles.map(file => ({
      ...file,
      size: file.size.toString(),
    }));

    return NextResponse.json({ files: filesWithStringSize, folders: trashedFolders });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 });
  }
}

// POST: Restore from trash
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { itemId, itemType } = await request.json(); // itemType: 'file' | 'folder'

    if (itemType === 'file') {
      const file = await prisma.cloudFile.findUnique({
        where: { id: itemId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!file || file.ownerId !== auth.userId || !file.isTrashed) {
        return NextResponse.json({ error: 'File not found in trash' }, { status: 404 });
      }

      await prisma.cloudFile.update({
        where: { id: itemId },
        data: { isTrashed: false },
      });
    } else if (itemType === 'folder') {
      const folder = await prisma.cloudFolder.findUnique({
        where: { id: itemId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!folder || folder.ownerId !== auth.userId || !folder.isTrashed) {
        return NextResponse.json(
          { error: 'Folder not found in trash' },
          { status: 404 }
        );
      }

      await prisma.cloudFolder.update({
        where: { id: itemId },
        data: { isTrashed: false },
      });

      // Also restore all files in this folder
      await prisma.cloudFile.updateMany({
        where: { folderId: itemId },
        data: { isTrashed: false },
      });
    } else {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring from trash:', error);
    return NextResponse.json(
      { error: 'Failed to restore item' },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete from trash
export async function DELETE(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType'); // 'file' | 'folder'

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'Missing itemId or itemType' },
        { status: 400 }
      );
    }

    if (itemType === 'file') {
      const file = await prisma.cloudFile.findUnique({
        where: { id: itemId },
        select: { ownerId: true, storagePath: true, size: true, isTrashed: true },
      });

      if (!file || file.ownerId !== auth.userId || !file.isTrashed) {
        return NextResponse.json(
          { error: 'File not found in trash' },
          { status: 404 }
        );
      }

      // Delete from disk
      try {
        await deleteFile(file.storagePath);
      } catch (e) {
        console.error('Failed to delete file from disk:', e);
      }

      // Delete from database
      await prisma.cloudFile.delete({
        where: { id: itemId },
      });

      // Update storage quota
      await prisma.storageQuota.updateMany({
        where: { userId: auth.userId },
        data: { usedBytes: { decrement: file.size } },
      });
    } else if (itemType === 'folder') {
      const folder = await prisma.cloudFolder.findUnique({
        where: { id: itemId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!folder || folder.ownerId !== auth.userId || !folder.isTrashed) {
        return NextResponse.json(
          { error: 'Folder not found in trash' },
          { status: 404 }
        );
      }

      // Delete all files in folder
      const files = await prisma.cloudFile.findMany({
        where: { folderId: itemId, isTrashed: true },
        select: { id: true, storagePath: true, size: true },
      });

      for (const file of files) {
        try {
          await deleteFile(file.storagePath);
        } catch (e) {
          console.error('Failed to delete file from disk:', e);
        }
        await prisma.storageQuota.updateMany({
          where: { userId: auth.userId },
          data: { usedBytes: { decrement: file.size } },
        });
      }

      await prisma.cloudFile.deleteMany({
        where: { folderId: itemId },
      });

      // Delete folder
      await prisma.cloudFolder.delete({
        where: { id: itemId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
