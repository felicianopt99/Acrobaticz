import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { CalendarContent } from '@/components/rentals/CalendarContent';

export default async function RentalCalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const { hasRole, ROLE_GROUPS } = await import('@/lib/roles');

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      redirect('/login');
    }
    if (!hasRole(user.role, ROLE_GROUPS.STAFF)) {
      redirect('/unauthorized');
    }
  } catch {
    redirect('/login');
  }

  return <CalendarContent />;
}