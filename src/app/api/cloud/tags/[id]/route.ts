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

// Get tags for a specific file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const file = await prisma.cloudFile.findFirst({
      where: {
        id,
        ownerId: auth.userId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const tags = await prisma.fileTag.findMany({
      where: {
        fileId: id,
      },
      select: {
        TagDefinition: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      tags: tags.map((t) => t.TagDefinition),
    });
  } catch (error) {
    console.error('Error fetching file tags:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
      },
      { status: 500 }
    );
  }
}

// Add tag to file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Verify file exists and belongs to user
    const file = await prisma.cloudFile.findFirst({
      where: {
        id,
        ownerId: auth.userId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
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

    // Check if tag already applied
    const existingTag = await prisma.fileTag.findFirst({
      where: {
        fileId: id,
        tagId,
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag already applied to this file' },
        { status: 409 }
      );
    }

    const fileTag = await prisma.fileTag.create({
      data: {
        id: crypto.randomUUID(),
        fileId: id,
        tagId,
      },
      select: {
        TagDefinition: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({ tag: fileTag.TagDefinition }, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add tag',
      },
      { status: 500 }
    );
  }
}

// Remove tag from file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Verify file exists and belongs to user
    const file = await prisma.cloudFile.findFirst({
      where: {
        id,
        ownerId: auth.userId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await prisma.fileTag.deleteMany({
      where: {
        fileId: id,
        tagId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to remove tag',
      },
      { status: 500 }
    );
  }
}
