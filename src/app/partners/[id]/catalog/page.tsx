import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { PartnerCatalogGenerator } from '@/components/partners/PartnerCatalogGenerator';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerCatalogPage({ params }: PageProps) {
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

  // Fetch partner
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!partner) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Equipment Catalog</h1>
        <p className="text-muted-foreground mt-2">
          Generate PDF catalogs of available equipment for {partner.name}
        </p>
      </div>
      <PartnerCatalogGenerator partnerId={id} partnerName={partner.name} />
    </div>
  );
}
