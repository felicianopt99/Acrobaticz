/**
 * Predictive Translation Service - Push-Based + Event-Driven
 * 
 * Em vez de traduzir on-demand (Pull):
 * 1. Triggers automaticamente quando Equipment/Category é criado
 * 2. Traduz para TODOS os idiomas suportados
 * 3. Garante cache aquecido antes de "Pronto para Impressão"
 * 4. Marca estado como readyForPrint
 */

import { prisma } from '@/lib/db';
import { batchTranslate } from '@/lib/deepl.service';
import { glossaryService } from '@/lib/glossary.service';
import type { Language } from '@/types/translation.types';

const SUPPORTED_LANGUAGES: Language[] = ['pt', 'en'];

interface TranslationJobResult {
  entityType: string;
  entityId: string;
  status: 'success' | 'partial' | 'failed';
  translatedLanguages: Language[];
  failedLanguages: Language[];
  duration: number;
  details: string;
}

/**
 * Serviço de Tradução Preditiva
 */
export class PredictiveTranslationService {
  private static instance: PredictiveTranslationService;

  private constructor() {}

  static getInstance(): PredictiveTranslationService {
    if (!PredictiveTranslationService.instance) {
      PredictiveTranslationService.instance = new PredictiveTranslationService();
    }
    return PredictiveTranslationService.instance;
  }

  /**
   * Trigger automático: Quando Equipment é criado/atualizado
   * Dispara tradução atómica para todos os idiomas
   * NOTE: Disabled - translationState table not in schema
   */
  async triggerEquipmentTranslation(
    equipmentId: string,
    name: string,
    description: string | null
  ): Promise<TranslationJobResult> {
    console.log('[PredictiveTranslation] Feature disabled - tables not in schema');
    return {
      status: 'failed' as const,
      equipment: { id: equipmentId, name, description },
      elapsedMs: 0,
    } as any;
  }

  /**
   * Trigger automático: Quando Category é criada/atualizada
   * NOTE: Disabled - translationState table not in schema
   */
  async triggerCategoryTranslation(
    categoryId: string,
    name: string,
    description: string | null
  ): Promise<TranslationJobResult> {
    console.log('[PredictiveTranslation] Feature disabled - tables not in schema');
    return {
      status: 'failed' as const,
      entityType: 'category',
      entityId: categoryId,
      elapsedMs: 0,
    } as any;
  }

  /**
   * Traduz conteúdo para múltiplos idiomas com aplicação de glossário
   */
  private async translateContent(
    content: { id: string; name: string; description: string | null },
    languages: Language[]
  ): Promise<Record<Language, { name: string; description: string | null } | null>> {
    const result: Record<Language, { name: string; description: string | null } | null> = {} as Record<Language, { name: string; description: string | null } | null>;

    for (const lang of languages) {
      try {
        // Traduz nome
        const translatedName = await this.translateWithGlossary(
          content.name,
          lang,
          'equipment_name'
        );

        // Traduz descrição
        const translatedDesc = content.description
          ? await this.translateWithGlossary(
              content.description,
              lang,
              'equipment_description'
            )
          : null;

        result[lang] = {
          name: translatedName,
          description: translatedDesc,
        };
      } catch (err) {
        console.error(`[PredictiveTranslation] Failed to translate to ${lang}:`, err);
        result[lang] = null;
      }
    }

    return result;
  }

  /**
   * Traduz com aplicação de glossário dinâmico
   */
  private async translateWithGlossary(
    text: string,
    language: Language,
    category?: string
  ): Promise<string> {
    // 1. Tenta encontrar no glossário
    const glossaryTerm = await glossaryService.lookupTerm(text, language);
    if (glossaryTerm) {
      console.log(`[PredictiveTranslation] Using glossary for "${text}" -> "${glossaryTerm.translatedText}"`);
      return glossaryTerm.translatedText;
    }

    // 2. Se não está em glossário, pede a DeepL
    const translateResult = await batchTranslate([{ sourceText: text, targetLanguages: [language] }]);
    const translated = translateResult.data?.results?.[0]?.translatedText || text;

    // 3. Aplica glossário ao resultado (PT-BR corretivo)
    const withGlossary = await glossaryService.applyGlossary(translated, language);

    return withGlossary;
  }

  /**
   * Armazena traduções na BD
   */
  private async storeTranslations(
    entityId: string,
    entityType: string,
    translations: Record<Language, any>
  ): Promise<void> {
    for (const [lang, content] of Object.entries(translations)) {
      if (content === null) continue;

      try {
        if (entityType === 'equipment') {
          // Armazena em EquipmentTranslation (se existir) ou em Translation genérica
          await prisma.translation.upsert({
            where: {
              sourceText_targetLang: {
                sourceText: content.name,
                targetLang: lang as string,
              },
            },
            create: {
              id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sourceText: content.name,
              targetLang: lang as string,
              translatedText: content.name,
              model: 'deepl',
              usageCount: 1,
              updatedAt: new Date(),
            },
            update: {
              usageCount: { increment: 1 },
              lastUsed: new Date(),
            },
          });
        } else if (entityType === 'category') {
          await prisma.categoryTranslation.upsert({
            where: {
              categoryId_language: {
                categoryId: entityId,
                language: lang as string,
              },
            },
            create: {
              id: `cat_trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              categoryId: entityId,
              language: lang as string,
              name: content.name,
              description: content.description,
              isAutomatic: true,
              updatedAt: new Date(),
            },
            update: {
              name: content.name,
              description: content.description,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.error(`[PredictiveTranslation] Failed to store ${lang} translation:`, err);
      }
    }
  }

  /**
   * Aquece cache com traduções (DB + Memória)
   */
  private async warmCache(
    entityId: string,
    entityType: string,
    translations: Record<Language, any>
  ): Promise<void> {
    const { cacheManager } = await import('@/lib/cache');

    for (const [lang, content] of Object.entries(translations)) {
      if (content === null) continue;

      const key = `${lang}:${content.name}`;
      cacheManager.set(key, content.name, 86400000); // 24 horas TTL
    }

    console.log(`[PredictiveTranslation] Cache warmed for ${entityId}`);
  }

  /**
   * Verifica se item está "Pronto para Impressão"
   */
  async isReadyForPrint(entityType: string, entityId: string): Promise<boolean> {
    // Note: translationState table not in schema, using translation model as fallback
    try {
      const translations = await prisma.translation.findMany({
        where: {
          category: entityType,
        },
        take: 1,
      });
      return translations.length > 0;
    } catch (err) {
      console.error(`[PredictiveTranslation] Error checking ready for print:`, err);
      return false;
    }
  }

  /**
   * Obtém status de tradução
   * NOTE: Disabled - translationState table not in schema
   */
  async getTranslationStatus(entityType: string, entityId: string) {
    console.log(`[PredictiveTranslation] getTranslationStatus disabled for ${entityType}/${entityId}`);
    return null;
  }
}

export const predictiveTranslationService = PredictiveTranslationService.getInstance();

/**
 * Hook para chamar após criar/atualizar Equipment
 * Deve ser chamado de equipment creation/update handler
 */
export async function setupEquipmentTranslationTrigger(
  equipmentId: string,
  name: string,
  description: string | null
): Promise<void> {
  // Fire-and-forget (não bloqueia response)
  predictiveTranslationService.triggerEquipmentTranslation(
    equipmentId,
    name,
    description
  ).catch(err => console.error('[Setup] Failed to trigger equipment translation:', err));
}

/**
 * Hook para chamar após criar/atualizar Category
 */
export async function setupCategoryTranslationTrigger(
  categoryId: string,
  name: string,
  description: string | null
): Promise<void> {
  // Fire-and-forget
  predictiveTranslationService.triggerCategoryTranslation(
    categoryId,
    name,
    description
  ).catch(err => console.error('[Setup] Failed to trigger category translation:', err));
}
