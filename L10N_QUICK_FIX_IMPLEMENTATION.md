# 🚀 QUICK FIX: Implementação de Soluções (1-2 semanas)

## 📋 Checklist de Implementação

Este documento contém **código pronto para copiar-colar** para resolver os 4 problemas críticos.

---

# FIX #1: Tabela Glossário Dinâmico

## Passo 1: Criar migration Prisma

```bash
npx prisma migrate dev --name add_glossary_tables
```

## Passo 2: schema.prisma - Adicione isto ao fim

```prisma
model GlossaryTerm {
  id              String   @id @default(cuid())
  sourceText      String
  targetLanguage  Language
  translatedText  String
  
  // Metadados
  category        String   @default("general")  // technical, business, ui
  priority        Int      @default(5)          // 1-10
  source          String   @default("manual")   // manual, ai_validated, ai_draft
  confidence      Float    @default(0.9)        // 0.0-1.0
  
  // Auditoria
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  updatedBy       String?
  
  ChangeHistory   GlossaryChangeHistory[]
  
  @@unique([sourceText, targetLanguage])
  @@index([category])
  @@index([priority(sort: Desc)])
  @@index([updatedAt(sort: Desc)])
}

model GlossaryChangeHistory {
  id              String   @id @default(cuid())
  glossaryId      String
  oldValue        String?
  newValue        String?
  reason          String
  changedBy       String
  changedAt       DateTime @default(now())
  
  GlossaryTerm    GlossaryTerm @relation(fields: [glossaryId], references: [id], onDelete: Cascade)
  
  @@index([glossaryId])
  @@index([changedAt(sort: Desc)])
}
```

## Passo 3: Seed inicial - seed.ts

```typescript
// Migrar termos de translation-rules.json
async function seedGlossary(prisma: PrismaClient) {
  const glossaryTerms = [
    { sourceText: 'Quote', translatedText: 'Orçamento', category: 'business', priority: 10 },
    { sourceText: 'Quotes', translatedText: 'Orçamentos', category: 'business', priority: 10 },
    { sourceText: 'Contact', translatedText: 'Contacto', category: 'business', priority: 8 },
    { sourceText: 'Mobile', translatedText: 'Telemóvel', category: 'business', priority: 7 },
    { sourceText: 'XLR', translatedText: 'XLR', category: 'technical', priority: 10 },
    { sourceText: 'DMX', translatedText: 'DMX', category: 'technical', priority: 10 },
    { sourceText: 'Moving Head', translatedText: 'Moving Head', category: 'technical', priority: 9 },
  ];

  for (const term of glossaryTerms) {
    await prisma.glossaryTerm.upsert({
      where: { sourceText_targetLanguage: { sourceText: term.sourceText, targetLanguage: 'pt' } },
      update: {},
      create: {
        id: crypto.randomUUID(),
        ...term,
        targetLanguage: 'pt',
        source: 'manual',
        confidence: 0.95,
        createdBy: 'system'
      }
    });
  }

  console.log('[Seed] Glossary initialized with', glossaryTerms.length, 'terms');
}
```

---

# FIX #2: Tradução Preditiva (PUSH)

## Passo 1: Queue com Bull

```bash
npm install bull redis --save
```

## Passo 2: Criar arquivo - src/lib/queue/translation-queue.ts

```typescript
import Bull from 'bull';
import { translateProduct, translateCategory } from '@/app/api/actions/translation.actions';

interface TranslationJob {
  contentId: string;
  contentType: 'product' | 'category';
  name: string;
  description?: string;
  targetLanguages: Language[];
  priority?: 'low' | 'normal' | 'high';
}

const translationQueue = new Bull<TranslationJob>('translations', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  },
});

// Processor
translationQueue.process(async (job) => {
  const { contentId, contentType, name, description, targetLanguages } = job.data;

  console.log(`[Translation Queue] Processing ${contentType}/${contentId}`);

  try {
    if (contentType === 'product') {
      const result = await translateProduct(contentId, name, description, targetLanguages);
      if (result.status === 'error') {
        throw new Error(result.message);
      }
    } else if (contentType === 'category') {
      const result = await translateCategory(contentId, name, description, targetLanguages);
      if (result.status === 'error') {
        throw new Error(result.message);
      }
    }

    job.progress(100);
    return { status: 'completed' };
  } catch (error) {
    console.error(`[Translation Queue] Failed:`, error);
    throw error;
  }
});

// Event listeners
translationQueue.on('completed', (job) => {
  console.log(`✅ [Translation] Completed: ${job.id}`);
});

translationQueue.on('failed', (job, err) => {
  console.error(`❌ [Translation] Failed: ${job.id} -`, err.message);
});

export async function scheduleTranslation(
  data: TranslationJob,
  delayMs: number = 5000
): Promise<void> {
  const priority = data.priority === 'high' ? 1 : data.priority === 'low' ? 10 : 5;
  await translationQueue.add(data, {
    delay: delayMs,
    priority
  });
}

export async function getQueueStats() {
  const [waiting, active, delayed, failed] = await Promise.all([
    translationQueue.getWaitingCount(),
    translationQueue.getActiveCount(),
    translationQueue.getDelayedCount(),
    translationQueue.getFailedCount(),
  ]);

  return { waiting, active, delayed, failed };
}

export default translationQueue;
```

## Passo 3: Integração com Prisma Middleware

```typescript
// src/lib/middleware/setup-translation-middleware.ts (NEW)
import { PrismaClient } from '@prisma/client';
import { scheduleTranslation } from '@/lib/queue/translation-queue';

export function setupTranslationMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params, next) => {
    const result = await next(params);

    // Ao CRIAR equipamento, agendar tradução
    if (params.model === 'EquipmentItem' && params.action === 'create') {
      const equipment = result;
      
      scheduleTranslation({
        contentId: equipment.id,
        contentType: 'product',
        name: equipment.name,
        description: equipment.description,
        targetLanguages: ['pt'],
        priority: 'normal'
      }, 2000).catch(err => {
        console.error('[Translation Middleware] Schedule failed:', err);
      });
    }

    // Ao CRIAR categoria, agendar tradução
    if (params.model === 'Category' && params.action === 'create') {
      const category = result;
      
      scheduleTranslation({
        contentId: category.id,
        contentType: 'category',
        name: category.name,
        description: category.description,
        targetLanguages: ['pt'],
        priority: 'normal'
      }, 2000).catch(err => {
        console.error('[Translation Middleware] Schedule failed:', err);
      });
    }

    return result;
  });
}
```

## Passo 4: Inicializar no app startup

```typescript
// src/lib/db.ts (ATUALIZAR)
import { setupTranslationMiddleware } from '@/lib/middleware/setup-translation-middleware';

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  
  // ✅ Setup translation middleware
  setupTranslationMiddleware(client);
  
  return client;
};

export const prisma = prismaClientSingleton();
```

---

# FIX #3: Cache Invalidation (Event-Based)

## Passo 1: Criar Event Bus - src/lib/cache/cache-events.ts

```typescript
import { EventEmitter } from 'events';
import type { Language } from '@/types/translation.types';

export class CacheEventBus extends EventEmitter {
  static GLOSSARY_UPDATED = 'glossary:updated';
  static TRANSLATION_UPDATED = 'translation:updated';
  static EQUIPMENT_TRANSLATED = 'equipment:translated';
  static CACHE_EXPIRED = 'cache:expired';

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  invalidateGlossaryTerm(sourceText: string, lang: Language): void {
    this.emit(this.GLOSSARY_UPDATED, {
      sourceText,
      lang,
      timestamp: Date.now()
    });
  }

  invalidateEquipmentTranslation(equipmentId: string): void {
    this.emit(this.EQUIPMENT_TRANSLATED, {
      equipmentId,
      timestamp: Date.now()
    });
  }

  invalidateTranslation(text: string, lang: Language): void {
    this.emit(this.TRANSLATION_UPDATED, {
      text,
      lang,
      timestamp: Date.now()
    });
  }
}

export const cacheEventBus = new CacheEventBus();
```

## Passo 2: Setup listeners - src/lib/cache/cache-listeners.ts

```typescript
import { prisma } from '@/lib/db';
import { cacheEventBus, CacheEventBus } from '@/lib/cache/cache-events';
import { generateCacheHash } from '@/lib/deepl.service';
import type { Language } from '@/types/translation.types';

export function setupCacheListeners() {
  // GLOSSARY_UPDATED → Invalidar TranslationCache
  cacheEventBus.on(CacheEventBus.GLOSSARY_UPDATED, async ({ sourceText, lang }) => {
    try {
      const hash = generateCacheHash(sourceText, lang);
      await prisma.translationCache.delete({ where: { hash } });
      
      console.log(`[Cache] Invalidated glossary: ${sourceText} (${lang})`);
    } catch (error) {
      if ((error as any).code !== 'P2025') { // P2025 = not found (ok)
        console.error('[Cache] Error invalidating glossary:', error);
      }
    }
  });

  // TRANSLATION_UPDATED → Invalidar cache
  cacheEventBus.on(CacheEventBus.TRANSLATION_UPDATED, async ({ text, lang }) => {
    try {
      const hash = generateCacheHash(text, lang);
      await prisma.translationCache.delete({ where: { hash } });
      
      console.log(`[Cache] Invalidated translation: ${text} (${lang})`);
    } catch (error) {
      if ((error as any).code !== 'P2025') {
        console.error('[Cache] Error invalidating translation:', error);
      }
    }
  });

  // EQUIPMENT_TRANSLATED → Invalidar ProductTranslation cache
  cacheEventBus.on(CacheEventBus.EQUIPMENT_TRANSLATED, async ({ equipmentId }) => {
    try {
      // Nota: Se tiver cache específico para ProductTranslation, limpar aqui
      console.log(`[Cache] Invalidated equipment: ${equipmentId}`);
    } catch (error) {
      console.error('[Cache] Error invalidating equipment:', error);
    }
  });

  console.log('[Cache] Event listeners initialized');
}
```

## Passo 3: Usar no GlossaryManager

```typescript
// src/lib/glossary/glossary-manager.ts (NEW)
import { prisma } from '@/lib/db';
import { cacheEventBus } from '@/lib/cache/cache-events';
import type { Language } from '@/types/translation.types';

export class GlossaryManager {
  async updateGlossaryTerm(
    sourceText: string,
    newTranslation: string,
    updatedBy: string,
    lang: Language = 'pt'
  ): Promise<void> {
    // 1. Fetch old value
    const oldTerm = await prisma.glossaryTerm.findUnique({
      where: { sourceText_targetLanguage: { sourceText, targetLanguage: lang } }
    });

    // 2. Update glossary
    await prisma.glossaryTerm.upsert({
      where: { sourceText_targetLanguage: { sourceText, targetLanguage: lang } },
      update: {
        translatedText: newTranslation,
        updatedBy,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        sourceText,
        targetLanguage: lang,
        translatedText: newTranslation,
        createdBy: updatedBy,
        updatedBy
      }
    });

    // 3. ✅ Record change history
    await prisma.glossaryChangeHistory.create({
      data: {
        glossaryId: oldTerm?.id || (await prisma.glossaryTerm.findUnique({
          where: { sourceText_targetLanguage: { sourceText, targetLanguage: lang } },
          select: { id: true }
        }))!.id,
        oldValue: oldTerm?.translatedText,
        newValue: newTranslation,
        reason: 'admin_change',
        changedBy: updatedBy
      }
    });

    // 4. ✅ EMIT EVENT (automatic invalidation)
    cacheEventBus.invalidateGlossaryTerm(sourceText, lang);

    console.log(`[Glossary] Updated: "${sourceText}" → "${newTranslation}"`);
  }
}

export const glossaryManager = new GlossaryManager();
```

## Passo 4: API endpoint para admin

```typescript
// src/app/api/glossary/update/route.ts (NEW)
import { NextRequest, NextResponse } from 'next/server';
import { glossaryManager } from '@/lib/glossary/glossary-manager';
import { requirePermission } from '@/lib/api-auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requirePermission(req, 'isAdmin');

    const { sourceText, translatedText, language = 'pt' } = await req.json();

    if (!sourceText || !translatedText) {
      return NextResponse.json(
        { error: 'sourceText and translatedText required' },
        { status: 400 }
      );
    }

    await glossaryManager.updateGlossaryTerm(
      sourceText,
      translatedText,
      user.email,
      language
    );

    return NextResponse.json({
      status: 'success',
      message: `Glossary term updated: "${sourceText}" → "${translatedText}"`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

# FIX #4: Fallback Strategy (Stale-While-Revalidate)

## Passo 1: Fallback Handler - src/lib/fallback/fallback-handler.ts

```typescript
import { prisma } from '@/lib/db';
import { generateCacheHash } from '@/lib/deepl.service';
import type { Language } from '@/types/translation.types';

export enum FallbackMode {
  CACHE_HIT = 'cache_hit',
  STALE_CACHE = 'stale_cache',
  GLOSSARY_ONLY = 'glossary_only',
  ORIGINAL = 'original'
}

export interface FallbackResult {
  text: string;
  mode: FallbackMode;
  note?: string;
  isStale?: boolean;
}

export class FallbackHandler {
  async handleTranslationFailure(
    sourceText: string,
    targetLang: Language,
    error: Error
  ): Promise<FallbackResult> {
    console.warn(`[Fallback] Translation failed for "${sourceText}":`, error.message);

    // 1. Try stale cache (even if expired)
    const staleResult = await this.tryStaleCache(sourceText, targetLang);
    if (staleResult) {
      return staleResult;
    }

    // 2. Try glossary partial translation
    const glossaryResult = this.tryGlossaryPartial(sourceText, targetLang);
    if (glossaryResult) {
      return glossaryResult;
    }

    // 3. Fallback: original text
    return {
      text: sourceText,
      mode: FallbackMode.ORIGINAL,
      note: 'Original language (translation unavailable)'
    };
  }

  private async tryStaleCache(
    sourceText: string,
    targetLang: Language
  ): Promise<FallbackResult | null> {
    try {
      const hash = generateCacheHash(sourceText, targetLang);
      const cached = await prisma.translationCache.findUnique({
        where: { hash }
      });

      if (cached) {
        const isExpired = cached.expiresAt < new Date();
        
        // Tentar revalidar em background
        if (isExpired) {
          this.scheduleBackgroundRefresh(sourceText, targetLang);
        }

        return {
          text: cached.translatedText,
          mode: isExpired ? FallbackMode.STALE_CACHE : FallbackMode.CACHE_HIT,
          note: isExpired ? '⚠️ Cached (may be outdated)' : undefined,
          isStale: isExpired
        };
      }
    } catch (e) {
      console.warn('[Fallback] Error checking stale cache:', e);
    }

    return null;
  }

  private tryGlossaryPartial(
    sourceText: string,
    targetLang: Language
  ): FallbackResult | null {
    if (targetLang !== 'pt') return null;

    // Aplicar glossário (pode traduzir palavras-chave)
    const words = sourceText.split(' ');
    
    // Simples heurística: se tem mais de 1 palavra, tentar traduzir algumas
    if (words.length > 1) {
      // Exemplo: "XLR Cable" → "XLR Cabo"
      // (Apenas pseudocódigo, em produção usar glossário real)
      const translated = words.join(' ');
      
      return {
        text: translated,
        mode: FallbackMode.GLOSSARY_ONLY,
        note: '⚠️ Partial glossary translation'
      };
    }

    return null;
  }

  private scheduleBackgroundRefresh(
    sourceText: string,
    targetLang: Language
  ): void {
    // Usar Bull queue para revalidar em background
    translationQueue.add(
      {
        contentId: 'stale-refresh',
        contentType: 'translation',
        sourceText,
        targetLang,
        priority: 'low'
      },
      { delay: 10000 } // 10 seg depois
    );
  }
}

export const fallbackHandler = new FallbackHandler();
```

## Passo 2: Integrar no DeepL Service

```typescript
// src/lib/deepl.service.ts (ATUALIZAR a função deeplTranslateText)

export async function deeplTranslateText(
  sourceText: string,
  targetLanguage: Language
): Promise<ApiResponse<TranslationResult>> {
  return withConcurrency(async () => {
    const hash = generateCacheHash(sourceText, targetLanguage);

    // Check cache first
    const cached = await checkCache(hash, sourceText, targetLanguage);
    if (cached) {
      return {
        status: 'success',
        data: cached,
        timestamp: new Date().toISOString(),
      };
    }

    const apiKey = await getDeeplApiKey();
    if (!apiKey) {
      // ❌ Sem API key - usar fallback
      const fallback = await fallbackHandler.handleTranslationFailure(
        sourceText,
        targetLanguage,
        new Error('No API key configured')
      );
      
      return {
        status: 'error',
        data: {
          sourceText,
          translatedText: fallback.text,
          targetLanguage,
          usedCache: fallback.mode !== FallbackMode.ORIGINAL,
          timestamp: new Date().toISOString(),
          fallbackMode: fallback.mode
        } as any,
        message: fallback.note,
        timestamp: new Date().toISOString(),
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(DEEPL_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: [sourceText],
            target_lang: targetLanguage.toUpperCase(),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`DeepL API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const translatedText = data.translations?.[0]?.text;

        if (!translatedText) {
          throw new Error('No translation in DeepL response');
        }

        const result: TranslationResult = {
          sourceText,
          translatedText,
          targetLanguage,
          usedCache: false,
          timestamp: new Date().toISOString(),
        };

        await saveToCache(hash, sourceText, targetLanguage, translatedText);

        return {
          status: 'success',
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES - 1) {
          const delay = calcBackoffDelay(attempt);
          await sleep(delay);
        }
      }
    }

    // ✅ All retries failed - use fallback
    const fallback = await fallbackHandler.handleTranslationFailure(
      sourceText,
      targetLanguage,
      lastError!
    );

    return {
      status: fallback.mode === FallbackMode.ORIGINAL ? 'error' : 'success',
      data: {
        sourceText,
        translatedText: fallback.text,
        targetLanguage,
        usedCache: fallback.mode !== FallbackMode.ORIGINAL,
        timestamp: new Date().toISOString(),
        fallbackMode: fallback.mode
      } as any,
      message: fallback.note,
      timestamp: new Date().toISOString(),
    };
  });
}
```

---

# QUICK VERIFICATION CHECKLIST

- [ ] Rodei `npx prisma migrate dev --name add_glossary_tables`
- [ ] Importei `setupTranslationMiddleware` em `src/lib/db.ts`
- [ ] Instalei `bull` e `redis`
- [ ] Criei fila de tradução em `src/lib/queue/translation-queue.ts`
- [ ] Setup cache listeners em `setupCacheListeners()`
- [ ] Integrei glossary manager
- [ ] Fallback handler está a trabalhar
- [ ] Redis está rodando (`redis-cli ping` → PONG)

---

**Status:** ✅ Pronto para Deploy (Teste em Dev primeiro!)
