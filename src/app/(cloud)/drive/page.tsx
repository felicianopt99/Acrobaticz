import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { DriveContent } from '@/components/cloud/DriveContent';

// Force dynamic rendering to ensure cookies are always fresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'My Drive - Cloud Storage',
  description: 'View and manage your files',
};

export default async function DrivePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  console.log('[/drive] Auth check:', {
    hasToken: !!token,
    tokenValue: token ? token.substring(0, 20) + '...' : null,
  });

  if (!token) {
    console.log('[/drive] No token found, redirecting to /login');
    redirect('/login');
  }

  try {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch (jwtError) {
      console.error('[/drive] JWT verification failed:', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        tokenLength: token?.length,
      });
      redirect('/login');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      console.log('[/drive] User not found or inactive');
      redirect('/login');
    }

    return <DriveContent userId={user.id} />;
  } catch (error) {
    console.error('[/drive] Auth error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    redirect('/login');
  }
}
