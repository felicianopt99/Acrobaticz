import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
      // Return default preferences if not authenticated
      return NextResponse.json({
        userId: '',
        conflictAlerts: true,
        statusChanges: true,
        eventReminders: true,
        overdueAlerts: true,
        criticalAlerts: true,
        stockAlerts: true,
        equipmentAvailable: true,
        monthlySummary: true,
        toastCritical: true,
        toastHigh: true,
      });
    }

    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      // Return default preferences if token is invalid
      return NextResponse.json({
        userId: '',
        conflictAlerts: true,
        statusChanges: true,
        eventReminders: true,
        overdueAlerts: true,
        criticalAlerts: true,
        stockAlerts: true,
        equipmentAvailable: true,
        monthlySummary: true,
        toastCritical: true,
        toastHigh: true,
      });
    }

    // Verify user exists before querying preferences
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      // Return default preferences if user doesn't exist
      return NextResponse.json({
        userId: decoded.userId,
        conflictAlerts: true,
        statusChanges: true,
        eventReminders: true,
        overdueAlerts: true,
        criticalAlerts: true,
        stockAlerts: true,
        equipmentAvailable: true,
        monthlySummary: true,
        toastCritical: true,
        toastHigh: true,
      });
    }

    // @ts-ignore - notificationPreference model exists
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: decoded.userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      try {
        // @ts-ignore - notificationPreference model exists
        preferences = await prisma.notificationPreference.create({
          data: { 
            id: crypto.randomUUID(),
            userId: decoded.userId,
            updatedAt: new Date(),
          },
        });
      } catch (createError) {
        // If creation fails (e.g., FK constraint), return defaults
        console.warn('Could not create notification preferences, returning defaults:', createError);
        return NextResponse.json({
          id: `temp-${decoded.userId}`,
          userId: decoded.userId,
          conflictAlerts: true,
          statusChanges: true,
          eventReminders: true,
          overdueAlerts: true,
          criticalAlerts: true,
          stockAlerts: true,
          equipmentAvailable: true,
          monthlySummary: true,
          toastCritical: true,
          toastHigh: true,
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    // Verify user exists before updating preferences
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure preferences exist
    // @ts-ignore - notificationPreference model exists
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: decoded.userId },
    });

    if (!preferences) {
      try {
        // @ts-ignore - notificationPreference model exists
        preferences = await prisma.notificationPreference.create({
          data: { 
            id: crypto.randomUUID(),
            userId: decoded.userId,
            updatedAt: new Date(),
          },
        });
      } catch (createError) {
        // If creation fails, return error
        console.error('Could not create notification preferences:', createError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }
    }

    // Update only the allowed fields
    // @ts-ignore - notificationPreference model exists
    const updatedPreferences = await prisma.notificationPreference.update({
      where: { userId: decoded.userId },
      data: {
        conflictAlerts: body.conflictAlerts ?? undefined,
        statusChanges: body.statusChanges ?? undefined,
        eventReminders: body.eventReminders ?? undefined,
        overdueAlerts: body.overdueAlerts ?? undefined,
        criticalAlerts: body.criticalAlerts ?? undefined,
        stockAlerts: body.stockAlerts ?? undefined,
        equipmentAvailable: body.equipmentAvailable ?? undefined,
        monthlySummary: body.monthlySummary ?? undefined,
        toastCritical: body.toastCritical ?? undefined,
        toastHigh: body.toastHigh ?? undefined,
      },
    });

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
