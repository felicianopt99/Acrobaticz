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

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileIds = [], folderIds = [], targetFolderId } = body;

    if (!fileIds.length && !folderIds.length) {
      return NextResponse.json(
        { error: 'No files or folders to move' },
        { status: 400 }
      );
    }

    // Verify target folder exists and belongs to user
    if (targetFolderId) {
      const targetFolder = await prisma.cloudFolder.findFirst({
        where: {
          id: targetFolderId,
          ownerId: auth.userId,
        },
      });

      if (!targetFolder) {
        return NextResponse.json(
          { error: 'Target folder not found' },
          { status: 404 }
        );
      }
    }

    // Create batch operation record
    const batchOperation = await prisma.batchOperation.create({
      data: {
        operationType: 'move',
        status: 'processing',
        fileCount: fileIds.length,
        folderCount: folderIds.length,
        performedBy: auth.userId,
        details: JSON.stringify({ targetFolderId, timestamp: new Date().toISOString() }),
      },
    });

    try {
      // Move files
      if (fileIds.length > 0) {
        await prisma.cloudFile.updateMany({
          where: {
            id: { in: fileIds },
            ownerId: auth.userId,
          },
          data: {
            folderId: targetFolderId || null,
            updatedAt: new Date(),
          },
        });

        // Log activity for each file
        const activities = fileIds.map((fileId: string) => ({
          fileId,
          userId: auth.userId,
          action: 'moved',
          details: JSON.stringify({ targetFolderId, timestamp: new Date().toISOString() }),
        }));

        await prisma.fileActivity.createMany({
          data: activities,
        });
      }

      // Move folders (only direct children, not recursive)
      if (folderIds.length > 0) {
        await prisma.cloudFolder.updateMany({
          where: {
            id: { in: folderIds },
            ownerId: auth.userId,
          },
          data: {
            parentId: targetFolderId || null,
            updatedAt: new Date(),
          },
        });
      }

      // Update batch operation status
      await prisma.batchOperation.update({
        where: { id: batchOperation.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Moved ${fileIds.length} files and ${folderIds.length} folders`,
        operationId: batchOperation.id,
        movedCount: fileIds.length + folderIds.length,
      });
    } catch (error) {
      await prisma.batchOperation.update({
        where: { id: batchOperation.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  } catch (error) {
    console.error('Batch move error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to move items',
      },
      { status: 500 }
    );
  }
}
