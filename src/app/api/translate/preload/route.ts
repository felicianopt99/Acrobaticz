import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/translate/preload
 * Returns all existing translations from database for client-side caching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetLang = searchParams.get('targetLang');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '1000', 10) || 1000, 1), 5000);

    console.log(`📝 Preload API: Fetching translations for lang=${targetLang}, limit=${limit}`);

    const where: any = {};
    if (targetLang === 'en' || targetLang === 'pt') {
      where.targetLang = targetLang;
    }

    const translations = await prisma.translation.findMany({
      where,
      select: {
        sourceText: true,
        targetLang: true,
        translatedText: true,
      },
      take: limit,
      orderBy: [
        { lastUsed: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    console.log(`✅ Preload API: Found ${translations.length} translations in database`);

    return NextResponse.json({
      success: true,
      count: translations.length,
      translations,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('❌ Preload API Error:', errorMessage);
    console.error('Stack:', errorStack);
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch translations: ${errorMessage}`,
      count: 0,
      translations: [],
    }, { status: 500 });
  }
}