import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// Get all files and folders with a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await params;
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify tag exists and belongs to user
    const tag = await prisma.tagDefinition.findFirst({
      where: {
        id: tagId,
        ownerId: auth.userId,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Get files with this tag
    const files = await prisma.fileTag.findMany({
      where: {
        tagId,
        CloudFile: {
          ownerId: auth.userId,
          isTrashed: false,
        },
      },
      select: {
        CloudFile: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimeType: true,
            size: true,
            folderId: true,
            createdAt: true,
            updatedAt: true,
            isStarred: true,
          },
        },
      },
    });

    // Get folders with this tag
    const folders = await prisma.folderTag.findMany({
      where: {
        tagId,
        CloudFolder: {
          ownerId: auth.userId,
          isTrashed: false,
        },
      },
      select: {
        CloudFolder: {
          select: {
            id: true,
            name: true,
            color: true,
            createdAt: true,
            updatedAt: true,
            isStarred: true,
          },
        },
      },
    });

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
      },
      files: files.map((f) => ({
        ...f.CloudFile,
        size: f.CloudFile.size.toString(),
      })),
      folders: folders.map((f) => f.CloudFolder),
      count: {
        files: files.length,
        folders: folders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching items by tag:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch tagged items',
      },
      { status: 500 }
    );
  }
}
