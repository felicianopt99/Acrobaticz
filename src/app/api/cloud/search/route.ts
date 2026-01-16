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

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // 'file', 'folder', or null for both
    
    // Advanced filters
    const minSize = searchParams.get('minSize') ? BigInt(searchParams.get('minSize')!) : undefined;
    const maxSize = searchParams.get('maxSize') ? BigInt(searchParams.get('maxSize')!) : undefined;
    const fileType = searchParams.get('fileType'); // MIME type prefix like 'image/', 'application/pdf'
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const owner = searchParams.get('owner'); // Filter by owner, default current user
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt', 'name', 'size'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ files: [], folders: [], total: 0 });
    }

    let files: any[] = [];
    let folders: any[] = [];
    let fileCount = 0;
    let folderCount = 0;

    // Build file search query
    if (!type || type === 'file') {
      const fileWhere: any = {
        ownerId: owner || auth.userId,
        isTrashed: false,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      };

      // Add size filters
      if (minSize !== undefined || maxSize !== undefined) {
        fileWhere.size = {};
        if (minSize !== undefined) fileWhere.size.gte = minSize;
        if (maxSize !== undefined) fileWhere.size.lte = maxSize;
      }

      // Add MIME type filter
      if (fileType) {
        fileWhere.mimeType = {
          startsWith: fileType,
          mode: 'insensitive',
        };
      }

      // Add date range filter
      if (startDate || endDate) {
        fileWhere.createdAt = {};
        if (startDate) fileWhere.createdAt.gte = startDate;
        if (endDate) fileWhere.createdAt.lte = endDate;
      }

      // Get total count
      fileCount = await prisma.cloudFile.count({
        where: fileWhere,
      });

      // Get paginated results
      files = await prisma.cloudFile.findMany({
        where: fileWhere,
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
          isPublic: true,
          User: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      });
    }

    // Build folder search query
    if (!type || type === 'folder') {
      const folderWhere: any = {
        ownerId: owner || auth.userId,
        isTrashed: false,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      };

      // Add date range filter
      if (startDate || endDate) {
        folderWhere.createdAt = {};
        if (startDate) folderWhere.createdAt.gte = startDate;
        if (endDate) folderWhere.createdAt.lte = endDate;
      }

      // Get total count
      folderCount = await prisma.cloudFolder.count({
        where: folderWhere,
      });

      // Get paginated results
      folders = await prisma.cloudFolder.findMany({
        where: folderWhere,
        select: {
          id: true,
          name: true,
          color: true,
          createdAt: true,
          updatedAt: true,
          isStarred: true,
          User: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      });
    }

    return NextResponse.json({
      files: files.map(f => ({
        ...f,
        size: f.size.toString(),
      })),
      folders,
      total: fileCount + folderCount,
      fileCount,
      folderCount,
      pagination: {
        offset,
        limit,
        hasMore: offset + limit < fileCount + folderCount,
      },
    });
  } catch (error) {
    console.error('Error searching files:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
