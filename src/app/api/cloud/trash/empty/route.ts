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

// DELETE: Empty all trash
export async function DELETE(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all trashed files
    const trashedFiles = await prisma.cloudFile.findMany({
      where: {
        ownerId: auth.userId,
        isTrashed: true,
      },
      select: {
        id: true,
        storagePath: true,
        size: true,
      },
    });

    // Delete files from disk
    let totalBytesFreed: number = 0;
    for (const file of trashedFiles) {
      try {
        await deleteFile(file.storagePath);
        totalBytesFreed += Number(file.size);
      } catch (e) {
        console.error('Failed to delete file from disk:', e);
        // Continue even if deletion from disk fails
      }
    }

    // Delete all trashed files from database
    await prisma.cloudFile.deleteMany({
      where: {
        ownerId: auth.userId,
        isTrashed: true,
      },
    });

    // Delete all trashed folders
    const trashedFolders = await prisma.cloudFolder.findMany({
      where: {
        ownerId: auth.userId,
        isTrashed: true,
      },
      select: { id: true },
    });

    for (const folder of trashedFolders) {
      await prisma.cloudFolder.delete({
        where: { id: folder.id },
      });
    }

    // Update storage quota
    if (totalBytesFreed > 0) {
      await prisma.storageQuota.updateMany({
        where: { userId: auth.userId },
        data: { usedBytes: { decrement: totalBytesFreed } },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Trash emptied successfully',
      bytesFreed: totalBytesFreed,
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    return NextResponse.json(
      { error: 'Failed to empty trash' },
      { status: 500 }
    );
  }
}
