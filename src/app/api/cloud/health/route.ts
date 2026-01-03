import { NextRequest, NextResponse } from 'next/server';
import { checkDiskHealth } from '@/lib/storage';
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

  // Only admins can check disk health
  if (auth.role !== 'Admin' && auth.role !== 'Manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const health = await checkDiskHealth();

    return NextResponse.json({
      isAccessible: health.isAccessible,
      available: health.available.toString(),
      total: health.total.toString(),
      usedPercent: health.usedPercent,
      lastCheck: health.lastCheck.toISOString(),
      error: health.error,
    });
  } catch (error) {
    console.error('Error checking disk health:', error);
    return NextResponse.json(
      { error: 'Failed to check disk health' },
      { status: 500 }
    );
  }
}
