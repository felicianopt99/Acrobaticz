import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import EnhancedCloudPage from '@/components/cloud/EnhancedCloudPage';

// Force dynamic rendering to ensure cookies are always fresh
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cloud Storage - AV Rentals',
  description: 'Manage your files and documents in cloud storage',
};

export default async function CloudPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  console.log('[/cloud] Auth check:', {
    hasToken: !!token,
    tokenValue: token ? token.substring(0, 20) + '...' : null,
  });

  if (!token) {
    console.log('[/cloud] No token found, redirecting to /login');
    redirect('/login');
  }

  try {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch (jwtError) {
      console.error('[/cloud] JWT verification failed:', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        tokenLength: token?.length,
      });
      redirect('/login');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, name: true },
    });

    if (!user || !user.isActive) {
      console.log('[/cloud] User not found or inactive');
      redirect('/login');
    }

    // Initialize storage quota if not exists (don't fail if this fails)
    try {
      const quota = await prisma.storageQuota.findUnique({
        where: { userId: user.id },
      });

      if (!quota) {
        await prisma.storageQuota.create({
          data: {
            userId: user.id,
            usedBytes: BigInt(0),
            quotaBytes: BigInt(process.env.DEFAULT_STORAGE_QUOTA || '53687091200'),
          },
        });
      }
    } catch (quotaError) {
      console.error('[/cloud] Failed to initialize quota:', quotaError);
      // Continue anyway - quota is not critical for access
    }

    return <EnhancedCloudPage userId={user.id} />;
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}
