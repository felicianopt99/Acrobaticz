import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { DriveContent } from '@/components/cloud/DriveContent';
import { FolderBreadcrumb } from '@/components/cloud/FolderBreadcrumb';

// Force dynamic rendering to ensure cookies are always fresh
export const dynamic = 'force-dynamic';

interface FolderPageProps {
  params: Promise<{ id: string }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { id } = await params;
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

    // Get folder with breadcrumb path
    const folder = await prisma.cloudFolder.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerId: true,
        isTrashed: true,
        parentId: true,
      },
    });

    if (!folder || folder.ownerId !== user.id || folder.isTrashed) {
      notFound();
    }

    // Build breadcrumb path
    const breadcrumbs: { id: string; name: string }[] = [];
    let currentFolder = folder;
    
    while (currentFolder) {
      breadcrumbs.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (currentFolder.parentId) {
        const parent = await prisma.cloudFolder.findUnique({
          where: { id: currentFolder.parentId },
          select: { id: true, name: true, parentId: true },
        });
        currentFolder = parent as typeof currentFolder;
      } else {
        break;
      }
    }

    return (
      <div className="space-y-4">
        <FolderBreadcrumb items={breadcrumbs} />
        <DriveContent userId={user.id} folderId={id} folderName={folder.name} />
      </div>
    );
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}
