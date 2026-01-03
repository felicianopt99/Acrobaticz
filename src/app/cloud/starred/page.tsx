import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import StarredPageContent from '@/components/cloud/StarredPageContent';

export const metadata = {
  title: 'Starred - Cloud Storage',
  description: 'Your favorite files and folders',
};

export default async function StarredPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      redirect('/login');
    }

    return <StarredPageContent userId={user.id} />;
  } catch {
    redirect('/login');
  }
}
