import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { CloudLayoutClient } from '@/components/cloud/CloudLayoutClient';

// Force dynamic rendering to ensure cookies are always fresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Cloud Storage',
  description: 'Manage your files and documents in cloud storage',
};

export default async function CloudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    console.log('[Cloud Layout] No auth token found, redirecting to login');
    redirect('/login');
  }

  try {
    let decoded: { userId: string; username: string; role: string };
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
        role: string;
      };
    } catch (jwtError) {
      console.error('[Cloud Layout] JWT verification failed:', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        tokenLength: token?.length,
      });
      redirect('/login');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      console.log('[Cloud Layout] User not found or inactive:', { userId: decoded.userId });
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
      console.error('[Cloud Layout] Failed to initialize quota:', quotaError);
      // Continue anyway - quota is not critical for access
    }

    return (
      <CloudLayoutClient 
        user={{ id: user.id, name: user.name, role: user.role }}
      >
        {children}
      </CloudLayoutClient>
    );
  } catch (error) {
    console.error('[Cloud Layout] Unexpected auth error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    redirect('/login');
  }
}
