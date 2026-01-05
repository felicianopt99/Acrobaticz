import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { AppHeader } from '@/components/layout/AppHeader';
import StorageDashboardContent from '@/components/cloud/StorageDashboardContent';

export const metadata = {
  title: 'Storage Dashboard - AV Rentals Cloud',
  description: 'Manage cloud storage and disk health',
};

export default async function StorageDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      redirect('/login');
    }

    // Check if user is admin
    const { isAdmin } = await import('@/lib/roles');
    if (!isAdmin(user.role)) {
      redirect('/cloud');
    }

    return (
      <>
        <AppHeader title="Storage Dashboard" />
        <StorageDashboardContent userId={user.id} />
      </>
    );
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}
