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

// GET: Get quota history for a user
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  const { isAdmin } = await import('@/lib/roles');
  if (!auth || !isAdmin(auth.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const userId = pathname.split('/')[5]; // Extract userId from /api/admin/cloud/quotas/{userId}/history

  try {
    const history = await prisma.quotaChangeHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: 50,
    });

    // Get admin names for changedBy
    const adminIds = [...new Set(history.map((h) => h.changedBy))];
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true },
    });

    const adminMap = new Map(admins.map((a) => [a.id, a.name]));

    const enrichedHistory = history.map((h) => ({
      id: h.id,
      oldQuotaBytes: h.oldQuotaBytes.toString(),
      newQuotaBytes: h.newQuotaBytes.toString(),
      changedBy: adminMap.get(h.changedBy) || 'Unknown Admin',
      reason: h.reason,
      changedAt: h.changedAt,
    }));

    return NextResponse.json({ changes: enrichedHistory });
  } catch (error) {
    console.error('Error fetching quota history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quota history' },
      { status: 500 }
    );
  }
}
