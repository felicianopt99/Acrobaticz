import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

const BACKUP_DIR = '/mnt/server_data/backups/daily';

// GET: List all backups
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth || auth.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get database backups from filesystem
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const backupList = [];

    for (const file of backupFiles) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        
        // Extract timestamp from filename (backup_20260102_101530.sql)
        const match = file.match(/backup_(\d{8})_(\d{6})/);
        const createdAt = match
          ? new Date(
              parseInt(match[1].substring(0, 4)),
              parseInt(match[1].substring(4, 6)) - 1,
              parseInt(match[1].substring(6, 8)),
              parseInt(match[2].substring(0, 2)),
              parseInt(match[2].substring(2, 4)),
              parseInt(match[2].substring(4, 6))
            )
          : new Date(stats.mtime);

        backupList.push({
          id: file,
          filename: file,
          size: stats.size,
          sizeGB: (stats.size / 1024 / 1024 / 1024).toFixed(2),
          createdAt: createdAt.toISOString(),
          path: filePath,
        });
      }
    }

    // Sort by date descending
    backupList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get job history from database
    const jobHistory = await prisma.backupJob.findMany({
      where: { jobType: 'daily' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      backups: backupList,
      jobHistory: jobHistory.map((job) => ({
        id: job.id,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        duration: job.duration,
        fileSize: job.fileSize?.toString(),
        error: job.error,
      })),
      retentionDays: 5,
      totalBackups: backupList.length,
      totalSize: (
        backupList.reduce((sum, b) => sum + b.size, 0) /
        1024 /
        1024 /
        1024
      ).toFixed(2),
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

// POST: Create manual backup
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth || auth.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup_manual_${timestamp}.sql`);

    // Create backup job record
    const job = await prisma.backupJob.create({
      data: {
        jobType: 'manual',
        status: 'running',
        startedAt: new Date(),
      },
    });

    const startTime = Date.now();

    try {
      // Run pg_dump
      const dbUrl = process.env.DATABASE_URL || 'postgresql://avrentals_user:avrentals_pass@postgres:5432/avrentals_db';
      const cmd = `pg_dump "${dbUrl}" > "${backupFile}"`;
      
      execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

      // Get file size
      const stats = await fs.stat(backupFile);
      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update job record
      await prisma.backupJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          backupFile,
          fileSize: BigInt(stats.size),
          duration,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Manual backup created successfully',
        backup: {
          filename: path.basename(backupFile),
          size: stats.size,
          sizeGB: (stats.size / 1024 / 1024 / 1024).toFixed(2),
          createdAt: new Date().toISOString(),
          duration,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Update job record with error
      await prisma.backupJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: errorMsg,
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
