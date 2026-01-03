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

// GET: List all users with quota information
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth || auth.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    const quotas = await Promise.all(
      users.map(async (user) => {
        const quota = await prisma.storageQuota.findUnique({
          where: { userId: user.id },
        });

        const fileCount = await prisma.cloudFile.count({
          where: { ownerId: user.id, isTrashed: false },
        });

        const folderCount = await prisma.cloudFolder.count({
          where: { ownerId: user.id, isTrashed: false },
        });

        const usedBytes = quota?.usedBytes || BigInt(0);
        const quotaBytes = quota?.quotaBytes || BigInt(53687091200);
        const percentUsed = Number((usedBytes * BigInt(100)) / quotaBytes);

        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          usedBytes: usedBytes.toString(),
          quotaBytes: quotaBytes.toString(),
          percentUsed,
          fileCount,
          folderCount,
          cloudEnabled: quota?.cloudEnabled || false,
          roleDefaultQuotaBytes: quota?.roleDefaultQuotaBytes?.toString(),
          lastUpdated: quota?.lastUpdated,
        };
      })
    );

    return NextResponse.json({ users: quotas });
  } catch (error) {
    console.error('Error fetching quotas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotas' },
      { status: 500 }
    );
  }
}

// PUT: Update user quota and cloud access
export async function PUT(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth || auth.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, newQuotaBytes, cloudEnabled, reason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get current quota
    const currentQuota = await prisma.storageQuota.findUnique({
      where: { userId },
    });

    if (!currentQuota) {
      return NextResponse.json(
        { error: 'User quota not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (newQuotaBytes !== undefined) {
      updateData.quotaBytes = BigInt(newQuotaBytes);
    }
    
    if (cloudEnabled !== undefined) {
      updateData.cloudEnabled = cloudEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update quota
    const updated = await prisma.storageQuota.update({
      where: { userId },
      data: updateData,
    });

    // Log the change if quota was updated
    if (newQuotaBytes !== undefined) {
      await prisma.quotaChangeHistory.create({
        data: {
          userId,
          oldQuotaBytes: currentQuota.quotaBytes,
          newQuotaBytes: BigInt(newQuotaBytes),
          changedBy: auth.userId,
          reason: reason || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User settings updated successfully',
      quota: {
        userId,
        cloudEnabled: updated.cloudEnabled,
        quotaBytes: updated.quotaBytes.toString(),
        usedBytes: updated.usedBytes.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating quota:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
