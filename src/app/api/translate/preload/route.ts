import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/translate/preload
 * Returns all existing translations from database for client-side caching
 * 
 * CORRIGIDO: Agora busca de AMBAS as tabelas:
 * - Translation: traduções permanentes com analytics (usageCount, lastUsed)
 * - TranslationCache: cache TTL do DeepL
 * 
 * Isto resolve o problema onde novas traduções iam para TranslationCache
 * mas o preload só buscava de Translation.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetLang = searchParams.get('targetLang');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '1000', 10) || 1000, 1), 5000);

    console.log(`📝 Preload API: Fetching translations for lang=${targetLang}, limit=${limit}`);

    // Dividir limite entre as duas tabelas
    const halfLimit = Math.ceil(limit / 2);

    // Query para tabela Translation (traduções permanentes com analytics)
    const translationWhere: Record<string, unknown> = {};
    if (targetLang === 'en' || targetLang === 'pt') {
      translationWhere.targetLang = targetLang;
    }

    // Query para tabela TranslationCache (cache TTL do DeepL)
    const cacheWhere: Record<string, unknown> = {
      expiresAt: { gte: new Date() }, // Apenas não expiradas
    };
    if (targetLang === 'en' || targetLang === 'pt') {
      cacheWhere.targetLanguage = targetLang;
    }

    // Buscar de ambas as tabelas em paralelo
    const [permanentTranslations, cachedTranslations] = await Promise.all([
      // Tabela de traduções permanentes (com analytics)
      prisma.translation.findMany({
        where: translationWhere,
        select: {
          sourceText: true,
          targetLang: true,
          translatedText: true,
        },
        take: halfLimit,
        orderBy: [
          { usageCount: 'desc' },
          { lastUsed: 'desc' },
          { updatedAt: 'desc' },
        ],
      }),
      // Tabela de cache DeepL (TTL)
      prisma.translationCache.findMany({
        where: cacheWhere,
        select: {
          sourceText: true,
          targetLanguage: true,
          translatedText: true,
        },
        take: halfLimit,
        orderBy: [
          { updatedAt: 'desc' },
        ],
      }),
    ]);

    console.log(`📊 Preload API: Found ${permanentTranslations.length} from Translation, ${cachedTranslations.length} from TranslationCache`);

    // Merge e deduplicate - Translation tem prioridade (tem analytics)
    const seen = new Set<string>();
    const allTranslations: Array<{
      sourceText: string;
      targetLang: string;
      translatedText: string;
    }> = [];

    // Primeiro adicionar de Translation (prioridade)
    for (const t of permanentTranslations) {
      const key = `${t.sourceText}:${t.targetLang}`;
      if (!seen.has(key)) {
        seen.add(key);
        allTranslations.push({
          sourceText: t.sourceText,
          targetLang: t.targetLang,
          translatedText: t.translatedText,
        });
      }
    }

    // Depois adicionar de TranslationCache (se não duplicado)
    for (const t of cachedTranslations) {
      const key = `${t.sourceText}:${t.targetLanguage}`;
      if (!seen.has(key)) {
        seen.add(key);
        allTranslations.push({
          sourceText: t.sourceText,
          targetLang: t.targetLanguage,
          translatedText: t.translatedText,
        });
      }
    }

    // Limitar ao limite original
    const finalTranslations = allTranslations.slice(0, limit);

    console.log(`✅ Preload API: Returning ${finalTranslations.length} unique translations (merged from both tables)`);

    return NextResponse.json({
      success: true,
      count: finalTranslations.length,
      translations: finalTranslations,
      sources: {
        translation: permanentTranslations.length,
        translationCache: cachedTranslations.length,
      },
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
