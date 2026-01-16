import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/rentals/[id]/version
 * 
 * Retorna apenas a versão mais recente do rental
 * Usado por useScanWithRetry para fazer retry com versão correta
 * 
 * Response: { version: number }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rentalId } = await params;

    if (!rentalId) {
      return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      select: { version: true }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version: rental.version
    });

  } catch (error) {
    console.error('[VERSION API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
