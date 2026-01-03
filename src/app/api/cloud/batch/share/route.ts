import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
    const { fileIds = [], folderIds = [], sharedWith, permission = 'view', expiresIn } = body;

    if (!fileIds.length && !folderIds.length) {
      return NextResponse.json(
        { error: 'No files or folders to share' },
        { status: 400 }
      );
    }

    if (!['view', 'comment', 'edit', 'admin'].includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission level' },
        { status: 400 }
      );
    }

    // Create batch operation record
    const batchOperation = await prisma.batchOperation.create({
      data: {
        operationType: 'share',
        status: 'processing',
        fileCount: fileIds.length,
        folderCount: folderIds.length,
        performedBy: auth.userId,
        details: JSON.stringify({
          sharedWith,
          permission,
          expiresIn,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    try {
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : undefined;

      // Share files
      if (fileIds.length > 0) {
        const fileShares = fileIds.map((fileId: string) => ({
          fileId,
          sharedWith: sharedWith || null,
          permission,
          shareToken: !sharedWith ? crypto.randomBytes(32).toString('hex') : undefined,
          expiresAt,
        }));

        await prisma.fileShare.createMany({
          data: fileShares,
        });

        // Log activity for each file
        const activities = fileIds.map((fileId: string) => ({
          fileId,
          userId: auth.userId,
          action: 'shared',
          details: JSON.stringify({
            sharedWith,
            permission,
            timestamp: new Date().toISOString(),
          }),
        }));

        await prisma.fileActivity.createMany({
          data: activities,
        });
      }

      // Share folders
      if (folderIds.length > 0) {
        const folderShares = folderIds.map((folderId: string) => ({
          folderId,
          sharedWith: sharedWith || null,
          permission,
          shareToken: !sharedWith ? crypto.randomBytes(32).toString('hex') : undefined,
          expiresAt,
        }));

        await prisma.folderShare.createMany({
          data: folderShares,
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
        message: `Shared ${fileIds.length} files and ${folderIds.length} folders with ${
          sharedWith ? 'user' : 'public link'
        }`,
        operationId: batchOperation.id,
        sharedCount: fileIds.length + folderIds.length,
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
    console.error('Batch share error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to share items',
      },
      { status: 500 }
    );
  }
}
