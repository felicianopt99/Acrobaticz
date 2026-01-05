import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { PartnerForm } from '@/components/partners/PartnerForm';

export default async function NewPartnerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  console.log('[Partners/New] Cookie check:', {
    hasCookieStore: !!cookieStore,
    allCookies: cookieStore.getAll().map(c => c.name),
    token: token ? 'Present' : 'Missing',
  });

  if (!token) {
    console.log('[Partners/New] No token found, redirecting to login');
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">Add New Partner</h2>
          <PartnerForm />
        </div>
      </div>
    </div>
  );
}
