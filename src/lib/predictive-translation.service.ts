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
   */
  async triggerEquipmentTranslation(
    equipmentId: string,
    name: string,
    description: string | null
  ): Promise<TranslationJobResult> {
    const startTime = Date.now();

    try {
      // 1. Cria estado de tradução
      await prisma.translationState.upsert({
        where: {
          entityType_entityId: {
            entityType: 'equipment',
            entityId: equipmentId,
          },
        },
        create: {
          id: `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entityType: 'equipment',
          entityId: equipmentId,
          status: 'translating',
        },
        update: {
          status: 'translating',
          updatedAt: new Date(),
        },
      });

      // 2. Traduz para todos os idiomas
      const translations = await this.translateContent(
        { id: equipmentId, name, description },
        SUPPORTED_LANGUAGES
      );

      const translatedLanguages = Object.keys(translations).filter(
        lang => translations[lang as Language] !== null
      ) as Language[];

      const failedLanguages = SUPPORTED_LANGUAGES.filter(
        lang => !translatedLanguages.includes(lang)
      );

      // 3. Armazena traduções na BD
      await this.storeTranslations(equipmentId, 'equipment', translations);

      // 4. Aquece cache
      await this.warmCache(equipmentId, 'equipment', translations);

      // 5. Marca como "Pronto para Impressão"
      const status = failedLanguages.length === 0 ? 'success' : 'partial';
      const readyForPrint = translatedLanguages.length > 0;

      await prisma.translationState.update({
        where: {
          entityType_entityId: {
            entityType: 'equipment',
            entityId: equipmentId,
          },
        },
        data: {
          status: 'complete',
          translatedLanguages: JSON.stringify(translatedLanguages),
          cacheWarmed: true,
          readyForPrint,
          printReadyAt: readyForPrint ? new Date() : null,
        },
      });

      const duration = Date.now() - startTime;

      console.log(
        `[PredictiveTranslation] ✅ Equipment translated: ${equipmentId} (${translatedLanguages.join(', ')}) in ${duration}ms`
      );

      return {
        entityType: 'equipment',
        entityId: equipmentId,
        status,
        translatedLanguages,
        failedLanguages,
        duration,
        details: `Translated to ${translatedLanguages.length}/${SUPPORTED_LANGUAGES.length} languages`,
      };
    } catch (err) {
      console.error(`[PredictiveTranslation] Failed for equipment ${equipmentId}:`, err);

      await prisma.translationState.update({
        where: {
          entityType_entityId: {
            entityType: 'equipment',
            entityId: equipmentId,
          },
        },
        data: {
          status: 'complete',
          readyForPrint: false,
        },
      }).catch(() => {});

      return {
        entityType: 'equipment',
        entityId: equipmentId,
        status: 'failed',
        translatedLanguages: [],
        failedLanguages: SUPPORTED_LANGUAGES,
        duration: Date.now() - startTime,
        details: `Failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Trigger automático: Quando Category é criada/atualizada
   */
  async triggerCategoryTranslation(
    categoryId: string,
    name: string,
    description: string | null
  ): Promise<TranslationJobResult> {
    const startTime = Date.now();

    try {
      await prisma.translationState.upsert({
        where: {
          entityType_entityId: {
            entityType: 'category',
            entityId: categoryId,
          },
        },
        create: {
          id: `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entityType: 'category',
          entityId: categoryId,
          status: 'translating',
        },
        update: {
          status: 'translating',
          updatedAt: new Date(),
        },
      });

      const translations = await this.translateContent(
        { id: categoryId, name, description },
        SUPPORTED_LANGUAGES
      );

      const translatedLanguages = Object.keys(translations).filter(
        lang => translations[lang as Language] !== null
      ) as Language[];

      const failedLanguages = SUPPORTED_LANGUAGES.filter(
        lang => !translatedLanguages.includes(lang)
      );

      await this.storeTranslations(categoryId, 'category', translations);
      await this.warmCache(categoryId, 'category', translations);

      const status = failedLanguages.length === 0 ? 'success' : 'partial';
      const readyForPrint = translatedLanguages.length > 0;

      await prisma.translationState.update({
        where: {
          entityType_entityId: {
            entityType: 'category',
            entityId: categoryId,
          },
        },
        data: {
          status: 'complete',
          translatedLanguages: JSON.stringify(translatedLanguages),
          cacheWarmed: true,
          readyForPrint,
          printReadyAt: readyForPrint ? new Date() : null,
        },
      });

      const duration = Date.now() - startTime;

      console.log(
        `[PredictiveTranslation] ✅ Category translated: ${categoryId} (${translatedLanguages.join(', ')}) in ${duration}ms`
      );

      return {
        entityType: 'category',
        entityId: categoryId,
        status,
        translatedLanguages,
        failedLanguages,
        duration,
        details: `Translated to ${translatedLanguages.length}/${SUPPORTED_LANGUAGES.length} languages`,
      };
    } catch (err) {
      console.error(`[PredictiveTranslation] Failed for category ${categoryId}:`, err);

      await prisma.translationState.update({
        where: {
          entityType_entityId: {
            entityType: 'category',
            entityId: categoryId,
          },
        },
        data: {
          status: 'complete',
          readyForPrint: false,
        },
      }).catch(() => {});

      return {
        entityType: 'category',
        entityId: categoryId,
        status: 'failed',
        translatedLanguages: [],
        failedLanguages: SUPPORTED_LANGUAGES,
        duration: Date.now() - startTime,
        details: `Failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Traduz conteúdo para múltiplos idiomas com aplicação de glossário
   */
  private async translateContent(
    content: { id: string; name: string; description: string | null },
    languages: Language[]
  ): Promise<Record<Language, { name: string; description: string | null } | null>> {
    const result: Record<Language, any> = {};

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
    const translateResult = await batchTranslate([text], language);
    const translated = translateResult[0] || text;

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
                targetLang: lang as Language,
              },
            },
            create: {
              id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sourceText: content.name,
              targetLang: lang as Language,
              translatedText: content.name,
              model: 'deepl',
              usageCount: 1,
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
    const state = await prisma.translationState.findUnique({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
    });

    return state?.readyForPrint ?? false;
  }

  /**
   * Obtém status de tradução
   */
  async getTranslationStatus(entityType: string, entityId: string) {
    return prisma.translationState.findUnique({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
    });
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
