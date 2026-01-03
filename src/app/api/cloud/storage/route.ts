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

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const quota = await prisma.storageQuota.findUnique({
      where: { userId: auth.userId },
    });

    if (!quota) {
      // Create default quota if doesn't exist
      const defaultQuota = BigInt(process.env.DEFAULT_STORAGE_QUOTA || '53687091200');
      const newQuota = await prisma.storageQuota.create({
        data: {
          userId: auth.userId,
          usedBytes: BigInt(0),
          quotaBytes: defaultQuota,
        },
      });
      return NextResponse.json({
        usedBytes: newQuota.usedBytes.toString(),
        quotaBytes: newQuota.quotaBytes.toString(),
        percentUsed: 0,
      });
    }

    const percentUsed = Number((BigInt(quota.usedBytes) * BigInt(100)) / BigInt(quota.quotaBytes));

    return NextResponse.json({
      usedBytes: quota.usedBytes.toString(),
      quotaBytes: quota.quotaBytes.toString(),
      percentUsed,
    });
  } catch (error) {
    console.error('Error fetching storage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage info' },
      { status: 500 }
    );
  }
}
