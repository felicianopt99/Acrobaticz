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
// Get all tags for current user
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.tagDefinition.findMany({
      where: {
        ownerId: auth.userId,
      },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            FileTag: true,
            FolderTag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      tags: tags.map((tag) => ({
        ...tag,
        itemCount: tag._count.FileTag + tag._count.FolderTag,
      })),
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
      },
      { status: 500 }
    );
  }
}

// Create new tag
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Check if tag with same name already exists
    const existingTag = await prisma.tagDefinition.findFirst({
      where: {
        ownerId: auth.userId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }

    const tag = await prisma.tagDefinition.create({
      data: {
        id: crypto.randomUUID(),
        name: name.trim(),
        color: color || '#3B82F6',
        description: description || null,
        ownerId: auth.userId,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create tag',
      },
      { status: 500 }
    );
  }
}
