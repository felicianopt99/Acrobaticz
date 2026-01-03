import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { RecentContent } from '@/components/cloud/RecentContent';

// Force dynamic rendering to ensure cookies are always fresh
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Recent - Cloud Storage',
  description: 'View recently accessed files',
};

export default async function RecentPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      redirect('/login');
    }

    return <RecentContent userId={user.id} />;
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}
