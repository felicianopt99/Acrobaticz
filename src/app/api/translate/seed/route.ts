/**
 * API Route: /api/translate/seed
 * 
 * Pré-traduz todos os textos estáticos da UI para garantir
 * tradução instantânea quando o utilizador abre a aplicação.
 * 
 * Esta rota é chamada automaticamente:
 * - No primeiro arranque da aplicação
 * - Quando se muda o idioma
 * - Manualmente via painel de administração
 */

import { NextRequest, NextResponse } from 'next/server';
import { UNIQUE_STATIC_TEXTS } from '@/lib/static-translations';
import { translateBatch, Language } from '@/lib/translation';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for large batch translations

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetLang = (body.targetLang as Language) || 'pt';
    const forceRetranslate = body.force === true;

    console.log(`🌱 [Seed] Starting seed translation for ${UNIQUE_STATIC_TEXTS.length} texts to ${targetLang}`);

    // Check which texts already exist in database
    const existingTranslations = await prisma.translationCache.findMany({
      where: {
        targetLanguage: targetLang,
        sourceText: { in: UNIQUE_STATIC_TEXTS }
      },
      select: {
        sourceText: true,
        translatedText: true
      }
    });

    const existingMap = new Map<string, string>(
      existingTranslations
        .filter((t: { sourceText: string; translatedText: string }) => t.translatedText !== t.sourceText) // Only count real translations
        .map((t: { sourceText: string; translatedText: string }) => [t.sourceText, t.translatedText] as [string, string])
    );

    // Find texts that need translation
    const textsToTranslate = forceRetranslate 
      ? UNIQUE_STATIC_TEXTS 
      : UNIQUE_STATIC_TEXTS.filter(text => !existingMap.has(text));

    console.log(`📊 [Seed] ${existingMap.size} already translated, ${textsToTranslate.length} need translation`);

    if (textsToTranslate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All static texts are already translated',
        stats: {
          total: UNIQUE_STATIC_TEXTS.length,
          existing: existingMap.size,
          translated: 0,
          skipped: UNIQUE_STATIC_TEXTS.length
        }
      });
    }

    // Translate in batches of 50 to avoid timeouts
    const BATCH_SIZE = 50;
    let translatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
      const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
      console.log(`🔄 [Seed] Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(textsToTranslate.length / BATCH_SIZE)} (${batch.length} texts)`);

      try {
        const results = await translateBatch(batch, targetLang);
        
        // Count successful translations (where result differs from original)
        results.forEach((result, index) => {
          if (result !== batch[index]) {
            translatedCount++;
          }
        });

        // Small delay between batches to respect rate limits
        if (i + BATCH_SIZE < textsToTranslate.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ [Seed] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errorMsg);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errorMsg}`);
      }
    }

    console.log(`✅ [Seed] Completed: ${translatedCount} new translations`);

    return NextResponse.json({
      success: true,
      message: `Seed translation completed`,
      stats: {
        total: UNIQUE_STATIC_TEXTS.length,
        existing: existingMap.size,
        translated: translatedCount,
        errors: errors.length,
        errorDetails: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ [Seed] Error:', errorMsg);
    
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}

// GET - Check seed status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetLang = (searchParams.get('targetLang') as Language) || 'pt';

  try {
    // Count existing translations
    const existingCount = await prisma.translationCache.count({
      where: {
        targetLanguage: targetLang,
        sourceText: { in: UNIQUE_STATIC_TEXTS },
        NOT: {
          translatedText: { in: UNIQUE_STATIC_TEXTS } // Exclude where source == translated
        }
      }
    });

    const missingTexts = UNIQUE_STATIC_TEXTS.length - existingCount;
    const completionRate = Math.round((existingCount / UNIQUE_STATIC_TEXTS.length) * 100);

    return NextResponse.json({
      targetLang,
      total: UNIQUE_STATIC_TEXTS.length,
      translated: existingCount,
      missing: missingTexts,
      completionRate: `${completionRate}%`,
      isComplete: missingTexts === 0
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
