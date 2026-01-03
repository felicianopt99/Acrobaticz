import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { 
  saveFile, 
  getStoragePath, 
  createUserStorageDirectories,
  hasEnoughSpace,
  getUserDiskUsage,
} from '@/lib/storage';
import path from 'path';
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

// POST: Upload files
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error('[Upload] FormData parsing error:', e);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }
    
    const folderId = formData.get('folderId') as string | null;
    const files = formData.getAll('files') as File[];

    console.log('[Upload] Received upload request:', {
      userId: auth.userId,
      folderId,
      fileCount: files.length,
      fileNames: files.map(f => f.name),
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Verify folder exists (if provided)
    if (folderId) {
      const folder = await prisma.cloudFolder.findUnique({
        where: { id: folderId },
        select: { ownerId: true, isTrashed: true },
      });

      if (!folder || folder.ownerId !== auth.userId || folder.isTrashed) {
        return NextResponse.json(
          { error: 'Folder not found or not accessible' },
          { status: 404 }
        );
      }
    }

    // Ensure user storage directories exist
    await createUserStorageDirectories(auth.userId);

    // Get user's storage quota
    const storageQuota = await prisma.storageQuota.findUnique({
      where: { userId: auth.userId },
    });

    let userDiskUsage = BigInt(storageQuota?.usedBytes || 0);
    const quotaBytes = BigInt(storageQuota?.quotaBytes || 53687091200);

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Check file size
        if (file.size === 0) {
          errors.push({ filename: file.name, error: 'File is empty' });
          continue;
        }

        const fileSize = BigInt(file.size);

        // Check if user has enough space
        if (userDiskUsage + fileSize > quotaBytes) {
          errors.push({ filename: file.name, error: 'Storage quota exceeded' });
          continue;
        }

        // Check if disk has enough space
        const hasSpace = await hasEnoughSpace(fileSize);
        if (!hasSpace) {
          return NextResponse.json(
            { error: 'Disk storage is full' },
            { status: 507 }
          );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = randomBytes(4).toString('hex');
        const ext = path.extname(file.name);
        const nameWithoutExt = path.basename(file.name, ext);
        const uniqueFilename = `${nameWithoutExt}_${timestamp}_${randomStr}${ext}`;

        // Get storage path
        const filePath = getStoragePath(auth.userId, folderId || undefined, uniqueFilename);

        // Convert file to buffer and save
        const buffer = Buffer.from(await file.arrayBuffer());
        await saveFile(buffer, filePath);

        // Create file record in database
        const cloudFile = await prisma.cloudFile.create({
          data: {
            name: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: fileSize,
            storagePath: filePath,
            url: null,
            folderId: folderId || null,
            ownerId: auth.userId,
            version: 1,
          },
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            isStarred: true,
            createdAt: true,
          },
        });

        // Update user's disk usage
        userDiskUsage += fileSize;

        // Log activity
        await prisma.fileActivity.create({
          data: {
            fileId: cloudFile.id,
            userId: auth.userId,
            action: 'uploaded',
            details: JSON.stringify({ mimeType: file.type, size: file.size }),
          },
        }).catch(() => {
          // Ignore errors in activity logging
        });

        uploadedFiles.push(cloudFile);
      } catch (error) {
        console.error(`[Upload] Error uploading file ${file.name}:`, {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          fileName: file.name,
          fileSize: file.size,
        });
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    // Update storage quota
    if (uploadedFiles.length > 0) {
      await prisma.storageQuota.upsert({
        where: { userId: auth.userId },
        create: {
          userId: auth.userId,
          usedBytes: userDiskUsage,
          quotaBytes,
        },
        update: {
          usedBytes: userDiskUsage,
        },
      });
    }

    return NextResponse.json(
      {
        uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        totalSize: userDiskUsage.toString(),
      },
      { status: uploadedFiles.length > 0 ? 201 : 400 }
    );
  } catch (error) {
    console.error('[Upload] Critical error during file upload:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
