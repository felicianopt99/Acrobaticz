import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { PartnerForm } from '@/components/partners/PartnerForm';
import type { Partner } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPartnerPage({ params }: PageProps) {
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

  const allowedRoles = ['Admin', 'Manager'];
  if (!allowedRoles.includes(user.role as any)) {
    redirect('/unauthorized');
  }

  const partner = await prisma.partner.findUnique({
    where: { id },
  });

  if (!partner) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">Edit Partner</h2>
          <PartnerForm initialData={partner as Partner} />
        </div>
      </div>
    </div>
  );
}
