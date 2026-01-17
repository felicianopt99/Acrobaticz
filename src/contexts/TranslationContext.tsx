"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language } from '@/lib/translation';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => Promise<string>;
  tSync: (text: string) => string;
  tBatch: (texts: string[], progressive?: boolean) => Promise<string[]>;
  preloadTranslations: (texts: string[]) => Promise<void>;
  isTranslating: boolean;
  isPreloading: boolean;
  cacheStats: () => { size: number; keys: string[] };
  // CORREÇÃO: cacheVersion permite componentes reagirem a mudanças no cache
  cacheVersion: number;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Client-side translation cache
const clientCache = new Map<string, string>();

// Client-side batching queue
interface QueuedTranslation {
  text: string;
  resolve: (translation: string) => void;
  reject: (error: any) => void;
}

const translationQueue: QueuedTranslation[] = [];
let isProcessingQueue = false;
let queueProcessTimeout: NodeJS.Timeout | null = null;

// Process queued translations in batches
async function processTranslationQueue(targetLang: Language) {
  if (isProcessingQueue || translationQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    // Collect all queued texts
    const queuedItems = [...translationQueue];
    translationQueue.length = 0; // Clear queue
    
    const texts = queuedItems.map(item => item.text);
    const uniqueTexts = Array.from(new Set(texts));
    
    console.log(`🚀 Processing ${uniqueTexts.length} texts in batch instead of ${texts.length} individual calls`);
    
    // Make batch API call
    const response = await fetch('/api/translate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        texts: uniqueTexts, 
        targetLang,
        progressive: true 
      }),
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
        console.error('Translation API error response:', errorData);
      } catch (parseErr) {
        const responseText = await response.text();
        errorDetails = responseText || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Translation API response (not JSON):', responseText);
      }
      throw new Error(`Batch translation failed: ${errorDetails}`);
    }

    const data = await response.json();
    const translations = data.translations || uniqueTexts;
    
    // Create translation map
    const translationMap = new Map<string, string>();
    uniqueTexts.forEach((text, index) => {
      const translated = translations[index] || text;
      translationMap.set(text, translated);
      
      // Cache the result
      const cacheKey = `${targetLang}:${text}`;
      clientCache.set(cacheKey, translated);
    });
    
    // Resolve all queued promises
    queuedItems.forEach(item => {
      const translated = translationMap.get(item.text) || item.text;
      item.resolve(translated);
    });
    
  } catch (error) {
    console.error('Batch translation error:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
    
    // Reject all queued promises with fallback to original text
    const currentQueue = [...translationQueue];
    translationQueue.length = 0;
    currentQueue.forEach(item => {
      item.resolve(item.text); // Fallback to original text instead of rejecting
    });
  } finally {
    isProcessingQueue = false;
  }
}

// Add translation to queue with debouncing
function queueTranslation(text: string, targetLang: Language): Promise<string> {
  return new Promise((resolve, reject) => {
    translationQueue.push({ text, resolve, reject });
    
    // Clear existing timeout
    if (queueProcessTimeout) {
      clearTimeout(queueProcessTimeout);
    }
    
    // Process queue after short delay to collect more items
    queueProcessTimeout = setTimeout(() => {
      processTranslationQueue(targetLang).catch(console.error);
    }, 50); // 50ms delay to batch multiple rapid requests
  });
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadRetryCount, setPreloadRetryCount] = useState(0);
  // CORREÇÃO: cacheVersion força re-render quando o cache é atualizado
  const [cacheVersion, setCacheVersion] = useState(0);

  // Preload all existing translations from database
  const preloadExistingTranslations = useCallback(async (targetLang?: Language) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsPreloading(false);
      return;
    }

    setIsPreloading(true);
    
    try {
      // Determine target language: use provided, or saved, or detect from browser
      let desiredLang: Language = targetLang || 'pt';
      if (!targetLang) {
        const savedLang = localStorage.getItem('app-language') as Language | null;
        if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
          desiredLang = savedLang;
        } else {
          const browserLang = navigator.language.toLowerCase();
          if (browserLang.startsWith('pt')) desiredLang = 'pt';
        }
      }

      // Don't preload for English
      if (desiredLang === 'en') {
        console.log('🇬🇧 Language is English, no preload needed');
        setIsPreloading(false);
        return;
      }

      console.log(`🔄 Preloading translations for language: ${desiredLang}...`);

      const params = new URLSearchParams();
      params.set('targetLang', desiredLang);
      params.set('limit', '2000');
      const url = `/api/translate/preload?${params.toString()}`;

      console.log(`📡 TranslationContext: Fetching from ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // Don't cache this request
      });

      if (response.ok) {
        const data = await response.json();
        const translations = data.translations || [];
        
        // Cache all existing translations
        let cached = 0;
        translations.forEach((translation: any) => {
          if (translation.translatedText && translation.translatedText !== translation.sourceText) {
            const cacheKey = `${translation.targetLang}:${translation.sourceText}`;
            clientCache.set(cacheKey, translation.translatedText);
            cached++;
          }
        });
        
        console.log(`✅ Preloaded ${cached} translations into cache (${translations.length} total from API)`);
        if (data.sources) {
          console.log(`📊 Sources: Translation=${data.sources.translation}, TranslationCache=${data.sources.translationCache}`);
        }
        setPreloadRetryCount(0); // Reset retry count on success
        // CORREÇÃO: Força re-render de todos os componentes que usam traduções
        if (cached > 0) {
          setCacheVersion(prev => prev + 1);
        }
      } else {
        console.warn(`⚠️ Preload API returned status ${response.status}: ${response.statusText}`);
        // Retry up to 3 times
        if (preloadRetryCount < 3) {
          console.log(`🔄 Retrying preload (attempt ${preloadRetryCount + 1}/3)...`);
          setPreloadRetryCount(prev => prev + 1);
          setTimeout(() => preloadExistingTranslations(desiredLang), 1000 * (preloadRetryCount + 1));
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Translation preload error: ${errorMsg}`);
      // Retry on network errors
      if (preloadRetryCount < 3) {
        console.log(`🔄 Retrying preload after error (attempt ${preloadRetryCount + 1}/3)...`);
        setPreloadRetryCount(prev => prev + 1);
        setTimeout(() => preloadExistingTranslations(targetLang), 1000 * (preloadRetryCount + 1));
      }
    } finally {
      setIsPreloading(false);
    }
  }, [preloadRetryCount]);

  // Load language preference and preload translations
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server

    const loadLanguageAndTranslations = async () => {
      try {
        const saved = localStorage.getItem('app-language') as Language;
        let targetLang: Language = 'en';
        
        if (saved && (saved === 'en' || saved === 'pt')) {
          targetLang = saved;
          setLanguageState(saved);
        } else {
          // Auto-detect browser language
          const browserLang = navigator.language.toLowerCase();
          if (browserLang.startsWith('pt')) {
            targetLang = 'pt';
            setLanguageState('pt');
            localStorage.setItem('app-language', 'pt');
          }
        }

        // Skip for English
        if (targetLang === 'en') {
          setIsPreloading(false);
          return;
        }

        // Check if seed is needed (first run or incomplete translations)
        const seedCheckKey = `translation-seed-${targetLang}`;
        const lastSeed = localStorage.getItem(seedCheckKey);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        if (!lastSeed || parseInt(lastSeed) < oneDayAgo) {
          console.log(`🌱 Checking/seeding static translations for ${targetLang}...`);
          try {
            // Check seed status
            const statusRes = await fetch(`/api/translate/seed?targetLang=${targetLang}`);
            if (statusRes.ok) {
              const status = await statusRes.json();
              if (!status.isComplete) {
                console.log(`🌱 Seeding ${status.missing} missing translations...`);
                // Trigger seed in background (don't await)
                fetch('/api/translate/seed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetLang })
                }).then(res => res.json()).then(result => {
                  console.log(`✅ Seed completed:`, result.stats);
                  // Reload translations after seed
                  preloadExistingTranslations(targetLang);
                  setCacheVersion(prev => prev + 1);
                }).catch(e => console.warn('Seed failed:', e));
              }
              localStorage.setItem(seedCheckKey, String(Date.now()));
            }
          } catch (e) {
            console.warn('Seed check failed:', e);
          }
        }

        // Preload existing translations
        await preloadExistingTranslations(targetLang);
      } catch (e) {
        // Silently fail - preloading is not critical
        console.warn('Language setup encountered an issue');
        setIsPreloading(false);
      }
    };

    loadLanguageAndTranslations();
  }, [preloadExistingTranslations]);

  // Re-preload when language changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only reload if not English (English doesn't need translations)
    if (language !== 'en') {
      console.log(`🔄 Language changed to ${language}, reloading translations...`);
      preloadExistingTranslations(language);
    }
  }, [language, preloadExistingTranslations]);

  // Cross-tab/client cache invalidation when admin updates translations or rules
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'translations-updated') {
        clientCache.clear();
        preloadExistingTranslations(language);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [language, preloadExistingTranslations]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    // Clear cache when language changes to prevent mixed languages
    // The useEffect above will trigger preload for the new language
    clientCache.clear();
  }, []);

  // Async translation function with automatic batching
  const t = useCallback(async (text: string): Promise<string> => {
    if (language === 'en' || !text.trim()) {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    
    // Check cache first
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey)!;
    }

    // Use batching queue instead of individual API call
    setIsTranslating(true);
    try {
      const translated = await queueTranslation(text, language);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Synchronous translation function (returns from cache or original)
  // CORREÇÃO: cacheVersion nas dependências força re-render quando o cache muda
  const tSync = useCallback((text: string): string => {
    if (language === 'en' || !text.trim()) {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    return clientCache.get(cacheKey) || text;
  }, [language, cacheVersion]);

  // Optimized batch translation with smart caching
  const tBatch = useCallback(async (texts: string[], progressive: boolean = true): Promise<string[]> => {
    if (language === 'en' || texts.length === 0) {
      return texts;
    }

    // Check which texts need translation
    const toTranslate: string[] = [];
    const results: string[] = new Array(texts.length);

    texts.forEach((text, index) => {
      const cacheKey = `${language}:${text}`;
      if (clientCache.has(cacheKey)) {
        results[index] = clientCache.get(cacheKey)!;
      } else {
        toTranslate.push(text);
        results[index] = text; // Use original as immediate fallback
      }
    });

    // If all are cached, return immediately
    if (toTranslate.length === 0) {
      return results;
    }

    console.log(`📦 tBatch: ${toTranslate.length} texts need translation, ${texts.length - toTranslate.length} cached`);

    setIsTranslating(true);
    try {
      // Make single batch API call (uses server-side intelligent batching)
      const response = await fetch('/api/translate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          texts: toTranslate, 
          targetLang: language,
          progressive: false
        }),
      });

      if (!response.ok) {
        throw new Error('Batch translation failed');
      }

      const data = await response.json();
      const translations = data.translations || toTranslate;

      console.log(`✅ Received ${translations.length} translations`);

      // Update results and cache
      let toTranslateIndex = 0;
      texts.forEach((text, index) => {
        const cacheKey = `${language}:${text}`;
        if (!clientCache.has(cacheKey)) {
          const translated = translations[toTranslateIndex] || text;
          clientCache.set(cacheKey, translated);
          results[index] = translated;
          toTranslateIndex++;
        }
      });

      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      return results; // Return with fallback values
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Preload translations without returning them
  const preloadTranslations = useCallback(async (texts: string[]): Promise<void> => {
    await tBatch(texts);
  }, [tBatch]);

  // Get cache statistics
  const cacheStats = useCallback(() => ({
    size: clientCache.size,
    keys: Array.from(clientCache.keys()),
  }), []);

  return (
    <TranslationContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      tSync, 
      tBatch, 
      preloadTranslations, 
      isTranslating,
      isPreloading,
      cacheStats,
      cacheVersion
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

/**
 * Custom hook for translating text with state management
 * @param text - Text to translate
 * @returns Object with translated text and loading state
 */
export function useTranslate(text: string) {
  const { language, t, tSync, cacheVersion } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function translate() {
      if (language === 'en') {
        if (isMounted) setTranslated(text);
        return;
      }

      // Immediately show cached version if available
      // CORREÇÃO: tSync agora tem cacheVersion como dependência, então será atualizado quando o cache mudar
      const cached = tSync(text);
      if (cached !== text) {
        if (isMounted) setTranslated(cached);
        return; // Already have a translation, no need to fetch
      }

      setIsLoading(true);
      const result = await t(text);
      
      if (isMounted) {
        setTranslated(result);
        setIsLoading(false);
      }
    }

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, language, t, tSync, cacheVersion]); // CORREÇÃO: cacheVersion nas dependências

  return { translated, isLoading };
}
