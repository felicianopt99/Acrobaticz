import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markNotificationsAsRead, deleteNotifications, getUnreadCount } from '@/lib/notifications';

function decodeToken(token: string) {
  try {
    return require('jsonwebtoken').verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      // Return empty notifications if no auth token
      return NextResponse.json({
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false,
      });
    }

    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      // Return empty notifications if token is invalid
      return NextResponse.json({
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false,
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    const where = {
      userId: decoded.userId,
      ...(unreadOnly && { isRead: false }),
      ...(type && { type }),
      ...(priority && { priority }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      getUnreadCount(decoded.userId),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (action === 'mark-read') {
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json({ error: 'notificationIds array required' }, { status: 400 });
      }

      // Verify all notifications belong to user
      const notifications = await prisma.notification.findMany({
        where: { id: { in: notificationIds }, userId: decoded.userId },
      });

      if (notifications.length !== notificationIds.length) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      await markNotificationsAsRead(notificationIds);
      return NextResponse.json({ success: true, count: notificationIds.length });
    }

    if (action === 'mark-all-read') {
      await prisma.notification.updateMany({
        where: { userId: decoded.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json({ error: 'notificationIds array required' }, { status: 400 });
      }

      // Verify all notifications belong to user
      const notifications = await prisma.notification.findMany({
        where: { id: { in: notificationIds }, userId: decoded.userId },
      });

      if (notifications.length !== notificationIds.length) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      await deleteNotifications(notificationIds);
      return NextResponse.json({ success: true, count: notificationIds.length });
    }

    if (action === 'delete-all') {
      const result = await prisma.notification.deleteMany({
        where: { userId: decoded.userId },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
