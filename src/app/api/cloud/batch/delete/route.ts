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
    const { fileIds = [], folderIds = [], permanent = false } = body;

    if (!fileIds.length && !folderIds.length) {
      return NextResponse.json(
        { error: 'No files or folders to delete' },
        { status: 400 }
      );
    }

    // Create batch operation record
    const batchOperation = await prisma.batchOperation.create({
      data: {
        id: crypto.randomUUID(),
        operationType: 'delete',
        status: 'processing',
        fileCount: fileIds.length,
        folderCount: folderIds.length,
        performedBy: auth.userId,
        details: JSON.stringify({ permanent, timestamp: new Date().toISOString() }),
      },
    });

    try {
      if (permanent) {
        // Permanent deletion: remove from database
        // Files are physically deleted elsewhere (deleteFile in storage.ts)
        if (fileIds.length > 0) {
          await prisma.cloudFile.deleteMany({
            where: {
              id: { in: fileIds },
              ownerId: auth.userId,
              isTrashed: true,
            },
          });
        }

        if (folderIds.length > 0) {
          // Delete all files in folder recursively
          const filesToDelete = await prisma.cloudFile.findMany({
            where: {
              folderId: { in: folderIds },
              ownerId: auth.userId,
            },
            select: { id: true },
          });

          if (filesToDelete.length > 0) {
            await prisma.cloudFile.deleteMany({
              where: {
                id: { in: filesToDelete.map((f) => f.id) },
              },
            });
          }

          await prisma.cloudFolder.deleteMany({
            where: {
              id: { in: folderIds },
              ownerId: auth.userId,
              isTrashed: true,
            },
          });
        }
      } else {
        // Soft delete: move to trash
        if (fileIds.length > 0) {
          await prisma.cloudFile.updateMany({
            where: {
              id: { in: fileIds },
              ownerId: auth.userId,
            },
            data: {
              isTrashed: true,
              updatedAt: new Date(),
            },
          });

          // Log activity for each file
          const activities = fileIds.map((fileId: string) => ({
            fileId,
            userId: auth.userId,
            action: 'deleted',
            details: JSON.stringify({ timestamp: new Date().toISOString() }),
          }));

          await prisma.fileActivity.createMany({
            data: activities,
          });
        }

        if (folderIds.length > 0) {
          await prisma.cloudFolder.updateMany({
            where: {
              id: { in: folderIds },
              ownerId: auth.userId,
            },
            data: {
              isTrashed: true,
              updatedAt: new Date(),
            },
          });
        }
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
        message: `Deleted ${fileIds.length} files and ${folderIds.length} folders${
          permanent ? ' permanently' : ' to trash'
        }`,
        operationId: batchOperation.id,
        deletedCount: fileIds.length + folderIds.length,
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
    console.error('Batch delete error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete items',
      },
      { status: 500 }
    );
  }
}
