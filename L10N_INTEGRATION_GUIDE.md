/**
 * L10N Ecosystem Integration Guide
 * 
 * Como integrar a nova arquitetura 360º ao sistema existente
 * Tudo em PT-PT, DeepL trata de traduzir
 */

// ============================================
// 1. INTEGRAÇÃO NO EQUIPMENT CREATION
// ============================================

// Ficheiro: src/app/api/equipment/route.ts (ou onde criar equipment)

import { setupEquipmentTranslationTrigger } from '@/lib/predictive-translation.service';

export async function POST(req: Request) {
  // ... validação existente ...

  // Cria equipment
  const equipment = await prisma.equipmentItem.create({
    data: {
      id: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description,
      categoryId: req.body.categoryId,
      // ... outros campos ...
    },
  });

  // 🔥 NOVO: Dispara tradução automática (fire-and-forget)
  // Não bloqueia response - executa em background
  setupEquipmentTranslationTrigger(
    equipment.id,
    equipment.name,
    equipment.description
  ).catch(err => console.error('[API] Translation trigger failed:', err));

  return Response.json(equipment);
}

// ============================================
// 2. INTEGRAÇÃO NO CATEGORY CREATION
// ============================================

import { setupCategoryTranslationTrigger } from '@/lib/predictive-translation.service';

export async function POST(req: Request) {
  const category = await prisma.category.create({
    data: {
      id: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description,
      // ... outros campos ...
    },
  });

  // 🔥 NOVO: Dispara tradução automática
  setupCategoryTranslationTrigger(
    category.id,
    category.name,
    category.description
  ).catch(err => console.error('[API] Translation trigger failed:', err));

  return Response.json(category);
}

// ============================================
// 3. INTEGRAÇÃO NO PDF GENERATOR
// ============================================

// Ficheiro: src/app/api/labels/generate/route.ts (ou similar)

import { EquipmentLabelPDFGenerator } from '@/lib/equipment-label-pdf-generator-v2';
import { predictiveTranslationService } from '@/lib/predictive-translation.service';

export async function POST(req: Request) {
  const { equipmentIds, quantities } = await req.json();

  // Busca equipment items com traduções
  const items = await prisma.equipmentItem.findMany({
    where: { id: { in: equipmentIds } },
  });

  // Enriquece com traduções em PT-PT
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      // Obtém tradução em PT-PT
      const translation = await prisma.translation.findFirst({
        where: {
          sourceText: item.name,
          targetLang: 'pt',
        },
      });

      const category = await prisma.category.findUnique({
        where: { id: item.categoryId },
      });

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        nameTranslated: translation?.translatedText || item.name,
        descriptionTranslated: item.description, // Se tiver tradução em BD
        category: category?.name,
        quantity: quantities?.[item.id] || 1,
      };
    })
  );

  // Gera PDF com pre-warm de cache
  const pdfBuffer = await EquipmentLabelPDFGenerator.generateLabelsPDFWithTranslations(
    enrichedItems,
    'pt', // PT-PT
    quantities
  );

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="labels.pdf"',
    },
  });
}

// ============================================
// 4. BACKGROUND JOB: PROCESSAR FALLBACKS
// ============================================

// Ficheiro: src/lib/background-jobs.ts (novo ou existente)

import { runPendingRetranslationJob } from '@/lib/fallback-strategy.service';

// Executar a cada 1 minuto (pode ser em cron ou worker thread)
export async function setupBackgroundJobs() {
  setInterval(async () => {
    try {
      await runPendingRetranslationJob();
    } catch (err) {
      console.error('[Background] Retranslation job failed:', err);
    }
  }, 60000); // 1 minuto
}

// ============================================
// 5. BACKGROUND JOB: FLUSH MÉTRICAS
// ============================================

// (automático - TranslationMetricsService já faz isto)

// ============================================
// 6. API ROUTE: DASHBOARD MÉTRICAS
// ============================================

// Ficheiro: src/app/api/admin/translation-metrics/route.ts (novo)

import { metricsService } from '@/lib/translation-metrics.service';

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const endpoint = params.get('endpoint') || 'dashboard';

  switch (endpoint) {
    case 'dashboard':
      return Response.json(await metricsService.getDashboardStatus());

    case 'realtime':
      return Response.json(await metricsService.getRealtimeStats());

    case 'historical':
      const days = parseInt(params.get('days') || '7');
      return Response.json(await metricsService.getHistoricalStats(days));

    case 'anomalies':
      return Response.json(await metricsService.detectAnomalies());

    default:
      return Response.json({ error: 'Unknown endpoint' }, { status: 400 });
  }
}

// ============================================
// 7. APP MOBILE: INICIALIZAR OFFLINE SYNC
// ============================================

// Ficheiro: src/app/layout.tsx ou src/app/(mobile)/layout.tsx

import { offlineSyncService } from '@/lib/offline-sync.service';

export default async function RootLayout({ children }) {
  return (
    <html>
      <body>
        <InitializeOfflineSync>
          {children}
        </InitializeOfflineSync>
      </body>
    </html>
  );
}

// Componente client-side
'use client';

import { useEffect } from 'react';
import { offlineSyncService } from '@/lib/offline-sync.service';

export function InitializeOfflineSync({ children }) {
  useEffect(() => {
    // Na inicialização: baixa glossário para offline
    offlineSyncService.initializeOfflineSync().catch(err =>
      console.error('[Init] Offline sync failed:', err)
    );
  }, []);

  return <>{children}</>;
}

// ============================================
// 8. USAR TRADUÇÃO OFFLINE EM SCAN PAGE
// ============================================

// Ficheiro: src/app/scan/page.tsx

'use client';

import { useOfflineTranslation } from '@/lib/offline-sync.service';
import { useEffect, useState } from 'react';

export default function ScanPage() {
  const translateOffline = useOfflineTranslation();
  const [equipmentName, setEquipmentName] = useState('');
  const [translatedName, setTranslatedName] = useState('');

  useEffect(() => {
    (async () => {
      if (equipmentName) {
        const translated = await translateOffline(equipmentName, 'pt');
        setTranslatedName(translated);
      }
    })();
  }, [equipmentName]);

  return (
    <div>
      <h1>{translatedName || equipmentName}</h1>
      {/* ... resto da page ... */}
    </div>
  );
}

// ============================================
// 9. DEEPL SERVICE: ADICIONAR MÉTRICAS
// ============================================

// Ficheiro: src/lib/deepl.service.ts (modificar existente)

import { metricsService } from '@/lib/translation-metrics.service';
import { fallbackService } from '@/lib/fallback-strategy.service';
import { glossaryService } from '@/lib/glossary.service';

export async function deeplTranslateText(
  text: string,
  targetLang: Language
): Promise<TranslationResult> {
  const startTime = Date.now();

  try {
    // Registra request
    metricsService.recordCacheMiss();

    // Verifica glossário primeiro
    const glossaryTerm = await glossaryService.lookupTerm(text, targetLang);
    if (glossaryTerm) {
      metricsService.recordCacheHit('memory');
      return {
        status: 'success',
        data: glossaryTerm.translatedText,
      };
    }

    // Chama DeepL
    const result = await callDeeplAPI(text, targetLang);

    const latency = Date.now() - startTime;
    metricsService.recordDeeplLatency(latency);

    if (result.status === 'success') {
      metricsService.recordCacheHit('deepl');
      
      // Aplica glossário ao resultado (PT-PT corrections)
      const withGlossary = await glossaryService.applyGlossary(
        result.data!,
        targetLang
      );

      return {
        status: 'success',
        data: withGlossary,
      };
    }

    // Fallback: stale cache + retry scheduling
    return await fallbackService.translateWithFallback(text, targetLang);
  } catch (err) {
    console.error('[DeepL] Translation failed:', err);
    metricsService.recordFailedTranslation();

    // Tenta fallback
    return await fallbackService.translateWithFallback(text, targetLang);
  }
}

// ============================================
// 10. MIGRATION: EXECUTAR
// ============================================

// Na terminal:
// npx prisma migrate dev --name add_l10n_ecosystem
// npx prisma generate

// ============================================
// CHECKLIST DE INTEGRAÇÃO
// ============================================

/*
✅ Schema Prisma: 7 novos modelos (TranslationGlossary, GlossaryAudit, etc)
✅ Glossário Service: Trie + Auditoria + Invalidação cascata
✅ Fallback Service: Circuit breaker + Stale-while-revalidate + Retry exponential backoff
✅ Predictive Translation: Push-based triggers no create/update
✅ PDF Generator v2: Auto-shrink + pre-warm cache
✅ Metrics Service: Hit rate tracking + dashboard
✅ Offline Sync: IndexedDB + localStorage + Service Worker
✅ Background Jobs: Retry + metrics flush
✅ API Routes: Dashboard + glossário export

[ ] Testar: criar equipment -> verifica translationState.readyForPrint = true
[ ] Testar: PDF generation com traduções em PT-PT
[ ] Testar: DeepL failure -> fallback + retry automático
[ ] Testar: App offline -> sync glossário + tradução instantânea
[ ] Testar: Cache hit rate > 95% em warehouse

CONFIGURAÇÃO RECOMENDADA:
- Suporte: PT-PT (default)
- Languages array: ['pt'] (remover 'en' se não necessário)
- Cache TTL: 24 horas
- Retry max: 3 tentativas com exponential backoff
- Metrics flush: 1 minuto
- Offline glossary TTL: 24 horas
- Circuit breaker threshold: 5 falhas
- Target cache hit rate: >95%
*/
