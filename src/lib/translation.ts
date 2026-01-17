/**
 * Legacy translation wrapper - maintained for backward compatibility
 * Use src/lib/deepl.service.ts for new code
 */

import { deeplTranslateText, batchTranslate } from './deepl.service';
import { loadTranslationRules } from './translation-rules';
import { prisma } from '@/lib/db';

export type Language = 'en' | 'pt';

/**
 * Apply post-translation word replacements
 * Replaces known translations of rule keys with the desired terms
 * For example: replaces "citações"/"cotações" with "orçamentos"
 */
function applyPostTranslationRules(translated: string, sourceText: string, rules: Record<string, string>): string {
  let result = translated;
  
  // For each rule, find what DeepL might have translated the source to, and replace it
  for (const [sourcePattern, replacement] of Object.entries(rules)) {
    // Get approximate translations of the source pattern
    // This is a heuristic - we translate the source to see what DeepL would produce
    // Then we can replace those terms with our desired replacement
    
    // For now, use a simple heuristic:
    // If the source contains the rule key, find where it appears in the translated text
    // and replace nearby words
    
    // Check if source pattern appears in the original text (case-insensitive)
    if (sourceText.toLowerCase().includes(sourcePattern.toLowerCase())) {
      // The source contains this rule key, so we should replace known translations of it
      // Common Portuguese translations:
      // - "Quotes" -> "citações", "cotações" 
      // - "Quote" -> "citação", "cotação"
      
      const lowerPattern = sourcePattern.toLowerCase();
      const lowerReplacement = replacement.toLowerCase();
      
      // Build list of possible translations to search for
      const possibleTranslations: string[] = [];
      
      if (lowerPattern === 'quote') {
        possibleTranslations.push('citação', 'cotação', 'proposta', 'orçamento');
      } else if (lowerPattern === 'quotes') {
        possibleTranslations.push('citações', 'cotações', 'propostas', 'orçamentos');
      }
      
      // Replace all possible translations with case preservation
      for (const possibleTranslation of possibleTranslations) {
        const pattern = new RegExp(`\\b${possibleTranslation}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          // Preserve case
          if (match === match.toUpperCase()) {
            return lowerReplacement.toUpperCase();
          } else if (match[0] === match[0].toUpperCase()) {
            return lowerReplacement.charAt(0).toUpperCase() + lowerReplacement.slice(1);
          } else {
            return lowerReplacement;
          }
        });
      }
    }
  }
  
  return result;
}

/**
 * NOTA: LRU Cache in-memory foi REMOVIDO.
 * 
 * Todas as traduções agora usam o sistema unificado de cache:
 * - TranslationCache (Prisma): Cache TTL de 30 dias para traduções DeepL
 * - Translation (Prisma): Tabela principal com analytics (usageCount, lastUsed)
 * - clientCache (React): Cache in-memory no TranslationContext
 * 
 * Vantagens:
 * - Sem duplicação de dados em memória
 * - Analytics precisos via BD
 * - Persistência entre restarts
 * - Sincronização automática entre tabelas
 * 
 * Ver: src/lib/deepl.service.ts para implementação completa
 */

// Pending translation requests to avoid duplicates
const pendingTranslations = new Map<string, Promise<string>>();

// Translation queue system
interface QueuedTranslation {
  texts: string[];
  targetLang: Language;
  resolve: (results: Map<string, string>) => void;
  reject: (error: any) => void;
}

const translationQueue: QueuedTranslation[] = [];
let isProcessingQueue = false;

// No Gemini/Google AI logic needed; DeepL handles all translation.

// Removed full-table preload to avoid heavy memory usage and slow cold starts

// Generate cache key
function getCacheKey(text: string, targetLang: Language): string {
  return `${targetLang}:${text}`;
}

// Simple glossary overrides for Portuguese (PT-PT - European Portuguese)
// Ensures specific business terms use PT-PT instead of PT-BR
const PT_GLOSSARY: Array<{ pattern: RegExp; replace: string }> = [
  // Business terms - keep consistent
  { pattern: /\bQuotes\b/g, replace: 'Orçamentos' },
  { pattern: /\bQuote\b/g, replace: 'Orçamento' },
  { pattern: /\bquotes\b/g, replace: 'orçamentos' },
  { pattern: /\bquote\b/g, replace: 'orçamento' },
  
  // PT-BR → PT-PT corrections (common differences)
  // Pronomes - PT-PT não usa "você" da mesma forma
  { pattern: /\bVocê tem\b/g, replace: 'Tem' },
  { pattern: /\bvocê tem\b/g, replace: 'tem' },
  { pattern: /\bVocê está\b/g, replace: 'Está' },
  { pattern: /\bvocê está\b/g, replace: 'está' },
  { pattern: /\bVocê pode\b/g, replace: 'Pode' },
  { pattern: /\bvocê pode\b/g, replace: 'pode' },
  { pattern: /\bVocê deve\b/g, replace: 'Deve' },
  { pattern: /\bvocê deve\b/g, replace: 'deve' },
  { pattern: /\bVocê precisa\b/g, replace: 'Precisa' },
  { pattern: /\bvocê precisa\b/g, replace: 'precisa' },
  // Palavras comuns PT-BR → PT-PT
  { pattern: /\bcontato\b/gi, replace: 'contacto' },
  { pattern: /\bContato\b/g, replace: 'Contacto' },
  { pattern: /\bconosco\b/gi, replace: 'connosco' },
  { pattern: /\baluguel\b/gi, replace: 'aluguer' },
  { pattern: /\bAluguel\b/g, replace: 'Aluguer' },
  { pattern: /\bcelular\b/gi, replace: 'telemóvel' },
  { pattern: /\bCelular\b/g, replace: 'Telemóvel' },
  { pattern: /\bônibus\b/gi, replace: 'autocarro' },
  { pattern: /\bÔnibus\b/g, replace: 'Autocarro' },
  { pattern: /\bfato\b/g, replace: 'facto' },
  { pattern: /\bFato\b/g, replace: 'Facto' },
  { pattern: /\btrem\b/g, replace: 'comboio' },
  { pattern: /\bTrem\b/g, replace: 'Comboio' },
  { pattern: /\bxícara\b/gi, replace: 'chávena' },
  { pattern: /\bgeladeira\b/gi, replace: 'frigorífico' },
  { pattern: /\bGeladeira\b/g, replace: 'Frigorífico' },
  { pattern: /\bbanheiro\b/gi, replace: 'casa de banho' },
  { pattern: /\bBanheiro\b/g, replace: 'Casa de banho' },
  { pattern: /\btime\b/g, replace: 'equipa' },
  { pattern: /\bTime\b/g, replace: 'Equipa' },
  { pattern: /\btimes\b/g, replace: 'equipas' },
  { pattern: /\bTimes\b/g, replace: 'Equipas' },
  { pattern: /\bprivacidade\b/g, replace: 'privacidade' },
  { pattern: /\bgestor\b/gi, replace: 'gestor' },
  { pattern: /\busuário\b/gi, replace: 'utilizador' },
  { pattern: /\bUsuário\b/g, replace: 'Utilizador' },
  { pattern: /\busuários\b/gi, replace: 'utilizadores' },
  { pattern: /\bUsuários\b/g, replace: 'Utilizadores' },
  { pattern: /\bequipe\b/gi, replace: 'equipa' },
  { pattern: /\bEquipe\b/g, replace: 'Equipa' },
  { pattern: /\bequipes\b/gi, replace: 'equipas' },
  { pattern: /\bEquipes\b/g, replace: 'Equipas' },
  { pattern: /\barquivo\b/gi, replace: 'ficheiro' },
  { pattern: /\bArquivo\b/g, replace: 'Ficheiro' },
  { pattern: /\barquivos\b/gi, replace: 'ficheiros' },
  { pattern: /\bArquivos\b/g, replace: 'Ficheiros' },
  { pattern: /\bmouse\b/gi, replace: 'rato' },
  { pattern: /\bMouse\b/g, replace: 'Rato' },
  { pattern: /\btela\b/gi, replace: 'ecrã' },
  { pattern: /\bTela\b/g, replace: 'Ecrã' },
];

function applyGlossary(text: string, targetLang: Language): string {
  if (targetLang !== 'pt') return text;
  let out = text;
  for (const rule of PT_GLOSSARY) {
    out = out.replace(rule.pattern, rule.replace);
  }
  return out;
}

// No rate limiting logic needed for DeepL here; handled by DeepL API or can be added if needed.

// Note: Full-table preload removed in favor of on-demand LRU caching

// Update usage counters for a single translation
async function touchUsage(text: string, targetLang: Language): Promise<void> {
  try {
    await prisma.translation.update({
      where: {
        sourceText_targetLang: {
          sourceText: text,
          targetLang: targetLang,
        },
      },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });
  } catch (e) {
    // Ignore if not found or race conditions
  }
}

// Update usage counters for many translations with small concurrency to avoid overload
async function touchUsageMany(texts: string[], targetLang: Language, concurrency = 10): Promise<void> {
  const queue = [...new Set(texts)];
  let idx = 0;
  async function worker() {
    while (idx < queue.length) {
      const current = idx++;
      const text = queue[current];
      await touchUsage(text, targetLang);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
}

/**
 * Batch fetch translations from database
 * Much faster than individual queries
 * IMPORTANTE: Só retorna traduções válidas (diferentes do texto original)
 */
async function batchFetchFromDb(
  texts: string[],
  targetLang: Language
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  try {
    const translations = await prisma.translation.findMany({
      where: {
        sourceText: { in: texts },
        targetLang: targetLang,
      },
      select: {
        sourceText: true,
        translatedText: true,
      },
    });
    
    translations.forEach(t => {
      // CORREÇÃO: Só usar tradução se for diferente do original
      // Traduções falsas (source == translated) devem ser ignoradas
      if (t.translatedText && t.translatedText !== t.sourceText) {
        results.set(t.sourceText, t.translatedText);
      }
    });
    
    console.log(`[Translation] Found ${translations.length} in DB, ${results.size} valid translations`);
  } catch (error) {
    console.error('Batch fetch error:', error);
  }
  
  return results;
}

// Use DeepL for batch translation
async function batchTranslateWithAI(
  texts: string[],
  targetLang: Language,
  _maxChunkSize: number = 10,
  _rules?: Record<string, string>
): Promise<Map<string, string>> {
  // Use new DeepL service for batch translation
  try {
    const result = await batchTranslate([{
      sourceText: texts[0],
      targetLanguages: [targetLang],
    }]);
    
    const out = new Map<string, string>();
    if (result.status === 'success' && result.data?.results) {
      result.data.results.forEach(r => {
        out.set(r.sourceText, r.translatedText);
      });
    }
    
    // For multiple texts, translate individually
    for (const t of texts.slice(1)) {
      try {
        const translated = await deeplTranslateText(t, targetLang);
        if (translated.status === 'success' && translated.data?.translatedText) {
          out.set(t, translated.data.translatedText);
        } else {
          out.set(t, t);
        }
      } catch {
        out.set(t, t);
      }
    }
    
    return out;
  } catch (e) {
    // Failover: translate individually
    const out = new Map<string, string>();
    for (const t of texts) {
      try {
        const translated = await deeplTranslateText(t, targetLang);
        if (translated.status === 'success' && translated.data?.translatedText) {
          out.set(t, translated.data.translatedText);
        } else {
          out.set(t, t);
        }
      } catch {
        out.set(t, t);
      }
    }
    return out;
  }
}

/**
 * Queue-based translation system
 * Efficiently batches and processes translation requests
 */
async function processTranslationQueue(): Promise<void> {
  if (isProcessingQueue || translationQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    while (translationQueue.length > 0) {
      // Collect texts from multiple queue items up to batch limit
      const batchTexts: string[] = [];
      const queueItems: QueuedTranslation[] = [];
      const maxBatchSize = 20; // Process up to 20 texts at once
      
      while (translationQueue.length > 0 && batchTexts.length < maxBatchSize) {
        const item = translationQueue.shift()!;
        queueItems.push(item);
        batchTexts.push(...item.texts);
      }
      
      // Remove duplicates while preserving order
      const uniqueTexts = Array.from(new Set(batchTexts));
      const targetLang = queueItems[0].targetLang;
      
      try {
        // Load rules for this batch
        const rules = loadTranslationRules();
        
        // Process the batch
        const results = await batchTranslateWithAI(uniqueTexts, targetLang, 15, rules);
        
        // Resolve all queue items
        queueItems.forEach(item => {
          const itemResults = new Map<string, string>();
          item.texts.forEach(text => {
            itemResults.set(text, results.get(text) || text);
          });
          item.resolve(itemResults);
        });
        
      } catch (error) {
        // Reject all queue items on error
        queueItems.forEach(item => item.reject(error));
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Add translation request to queue
 */
function queueTranslation(texts: string[], targetLang: Language): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    translationQueue.push({
      texts,
      targetLang,
      resolve,
      reject,
    });
    
    // Start processing if not already running
    processTranslationQueue().catch(console.error);
  });
}

/**
 * Translate text using Google AI with optimized caching
 * Performance optimizations:
 * - In-memory cache (fastest)
 * - Deduplicates concurrent requests
 * - Database persistent cache
 * - AI translation as last resort
 * 
 * @param text - Text to translate
 * @param targetLang - Target language ('pt' for Portuguese European)
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: Language = 'pt'
): Promise<string> {
  // Don't translate if target is English or empty
  if (targetLang === 'en' || !text.trim()) {
    return text;
  }

  try {
    // Check translation rules for override - ONLY for exact matches on simple terms
    const rules = loadTranslationRules();
    const trimmedText = text.trim();
    
    for (const [sourcePattern, replacement] of Object.entries(rules)) {
      if (trimmedText.toLowerCase() === sourcePattern.toLowerCase()) {
        // Exact match! Preserve case and return
        let result = replacement;
        if (trimmedText === trimmedText.toUpperCase() && trimmedText.length > 1) {
          result = replacement.toUpperCase();
        } else if (trimmedText[0] === trimmedText[0].toUpperCase()) {
          result = replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
        } else {
          result = replacement.toLowerCase();
        }
        return result;
      }
    }

    // Use new DeepL service (handles cache, retry, etc.)
    const result = await deeplTranslateText(text, targetLang);
    
    if (result.status === 'success' && result.data?.translatedText) {
      let translated = result.data.translatedText;
      
      // Apply post-translation word replacements
      translated = applyPostTranslationRules(translated, text, rules);
      
      // Apply glossary overrides
      translated = applyGlossary(translated, targetLang);
      
      return translated;
    }
    
    // Fallback to original text on error
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

/**
 * Batch translate multiple texts with progressive loading
 * Returns cached results immediately, loads missing ones in background
 * 
 * @param texts - Array of texts to translate
 * @param targetLang - Target language
 * @param progressive - If true, returns immediately with available translations
 * @returns Array of translated texts
 */
export async function translateBatch(
  texts: string[],
  targetLang: Language = 'pt',
  progressive: boolean = false
): Promise<string[]> {
  if (targetLang === 'en' || texts.length === 0) {
    return texts;
  }

  const results: string[] = new Array(texts.length);
  const uncachedTexts: string[] = [];
  const uncachedIndices: number[] = [];

  // Load override rules once for this batch
  const rules = loadTranslationRules();

  // 1. Check in-memory cache first AND override rules
  texts.forEach((text, index) => {
    const cacheKey = getCacheKey(text, targetLang);
    
    // Check override rules first - ONLY for exact matches
    const trimmedText = text.trim();
    for (const [sourcePattern, replacement] of Object.entries(rules)) {
      if (trimmedText.toLowerCase() === sourcePattern.toLowerCase()) {
        // Exact match! Preserve case
        let result = replacement;
        if (trimmedText === trimmedText.toUpperCase() && trimmedText.length > 1) {
          result = replacement.toUpperCase();
        } else if (trimmedText[0] === trimmedText[0].toUpperCase()) {
          result = replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
        } else {
          result = replacement.toLowerCase();
        }
        results[index] = result;
        return; // Continue to next text
      }
    }
    
    // LRU cache removido - todas as traduções agora vêm da BD
    // O TranslationContext do React mantém cache in-memory no cliente
    
    uncachedTexts.push(text);
    uncachedIndices.push(index);
    // Fill with original text as fallback
    results[index] = text;
  });

  // If all cached or matched rules, return immediately
  if (uncachedTexts.length === 0) {
    return results;
  }

  // For progressive mode, start background translation and return current results
  if (progressive) {
    // Start background translation (don't await)
    translateBatchBackground(uncachedTexts, targetLang, uncachedIndices, results);
    return results;
  }


  // 2. Batch fetch from database (single query)
  const dbResults = await batchFetchFromDb(uncachedTexts, targetLang);
  
  const stillMissing: string[] = [];
  const missingIndices: number[] = [];

  uncachedTexts.forEach((text, i) => {
    const index = uncachedIndices[i];
    const dbTranslation = dbResults.get(text);
    
    if (dbTranslation) {
      // Found in DB, use it (cache é gerido pelo TranslationContext no cliente)
      results[index] = dbTranslation;
      // Update usage in background
      touchUsage(text, targetLang).catch(() => {});
    } else {
      stillMissing.push(text);
      missingIndices.push(index);
    }
  });

  // 3. Translate remaining with AI using intelligent batching
  if (stillMissing.length > 0) {
    const aiResults = await batchTranslateWithAI(stillMissing, targetLang, 10, rules);
    stillMissing.forEach((text, i) => {
      const index = missingIndices[i];
      const translatedRaw = aiResults.get(text) || text;
      const translated = applyGlossary(translatedRaw, targetLang);
      results[index] = translated;
    });

    // 3b. Persist newly translated results to database (bulk insert, skip duplicates)
    try {
      const data = stillMissing.map((text) => ({
        id: crypto.randomUUID(),
        sourceText: text,
        targetLang: targetLang,
        translatedText: applyGlossary(aiResults.get(text) || text, targetLang),
        model: 'deepl',
        updatedAt: new Date(),
      }));
      if (data.length > 0) {
        await prisma.translation.createMany({ data, skipDuplicates: true });
      }
      // Cache é agora gerido pelo TranslationContext do React (cliente)
      // e pelo TranslationCache (BD com TTL)
      // Update usage for all newly translated items (background)
      touchUsageMany(stillMissing, targetLang).catch(() => {});
    } catch (err) {
      console.error('Failed to persist batch translations:', err);
    }
  }

  return results;
}

/**
 * Background translation for progressive loading
 */
async function translateBatchBackground(
  texts: string[],
  targetLang: Language,
  indices: number[],
  results: string[]
): Promise<void> {
  try {
    // Check database first
    const dbResults = await batchFetchFromDb(texts, targetLang);
    
    const stillMissing: string[] = [];
    
    texts.forEach((text, i) => {
      const dbTranslation = dbResults.get(text);
      if (dbTranslation) {
        // Update result array (client will get this on next render)
        results[indices[i]] = dbTranslation;
        touchUsage(text, targetLang).catch(() => {});
      } else {
        stillMissing.push(text);
      }
    });
    
    // Translate remaining with AI if any
    if (stillMissing.length > 0) {
      const rules = loadTranslationRules();
      const aiResults = await batchTranslateWithAI(stillMissing, targetLang, 15, rules); // Larger batches for background
      
      stillMissing.forEach(text => {
        const translated = applyGlossary(aiResults.get(text) || text, targetLang);
        const originalIndex = texts.indexOf(text);
        if (originalIndex !== -1) {
          results[indices[originalIndex]] = translated;
        }
      });

      // Persist background translations as well (bulk insert, skip duplicates)
      try {
        const data = stillMissing.map((text) => ({
          id: crypto.randomUUID(),
          sourceText: text,
          targetLang: targetLang,
          translatedText: applyGlossary(aiResults.get(text) || text, targetLang),
          model: 'deepl',
          updatedAt: new Date(),
        }));
        if (data.length > 0) {
          await prisma.translation.createMany({ data, skipDuplicates: true });
        }
        // Cache é gerido pelo cliente (TranslationContext) e BD (TranslationCache)
        // Update usage for missing items
        touchUsageMany(stillMissing, targetLang).catch(() => {});
      } catch (e) {
        console.error('Failed to persist background batch translations:', e);
      }
    }
  } catch (error) {
    console.error('Background translation error:', error);
  }
}

/**
 * Clear translation cache
 * Note: LRU cache was removed. This now clears TranslationCache in DB.
 * For full reset, use Prisma to truncate tables.
 */
export async function clearTranslationCache(): Promise<void> {
  try {
    // Import and use the clearExpiredCache from deepl.service
    const { clearExpiredCache } = await import('./deepl.service');
    await clearExpiredCache();
    console.log('[Translation] Expired cache entries cleared');
  } catch (error) {
    console.error('[Translation] Failed to clear cache:', error);
  }
}

/**
 * Get cache statistics
 * Returns stats from the database TranslationCache table
 */
export async function getCacheStats() {
  try {
    const { getCacheStats: getDeeplCacheStats } = await import('./deepl.service');
    const result = await getDeeplCacheStats();
    return result.status === 'success' ? result.data : { size: 0, keys: [] };
  } catch {
    return { size: 0, keys: [] };
  }
}

/**
 * Get database translation statistics
 */
export async function getDbTranslationStats() {
  try {
    const count = await prisma.translation.count();
    const byLanguage = await prisma.translation.groupBy({
      by: ['targetLang'],
      _count: true,
    });
    
    return {
      totalTranslations: count,
      byLanguage: byLanguage.map(item => ({
        language: item.targetLang,
        count: item._count,
      })),
    };
  } catch (error) {
    console.error('Error getting DB stats:', error);
    return null;
  }
}
