import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { PartnerDetailContent } from '@/components/partners/PartnerDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userId: string | null = null;
  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as any;
    userId = decoded.userId as string;
  } catch {
    redirect('/login');
  }

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect('/login');
  }

  const { hasRole, ROLE_GROUPS } = await import('@/lib/roles');
  if (!hasRole(user.role, ROLE_GROUPS.MANAGEMENT)) {
    redirect('/unauthorized');
  }

  // Fetch partner to verify it exists
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!partner) {
    notFound();
  }

  return <PartnerDetailContent partnerId={id} />;
}
