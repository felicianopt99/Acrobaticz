"use client";

import { useTranslation } from '@/contexts/TranslationContext';
import { useEffect, useState } from 'react';

/**
 * Hook simples para traduzir um texto
 * Retorna o texto traduzido imediatamente se estiver em cache
 * ou marca para tradução em background
 */
export function useTranslate(text: string): string {
  const { language, tSync, t, cacheVersion } = useTranslation();
  const [translated, setTranslated] = useState(text);

  // Primeiro, retorna do cache (síncrono)
  // CORREÇÃO: cacheVersion nas dependências força re-render quando o cache muda
  useEffect(() => {
    if (language === 'en') {
      setTranslated(text);
      return;
    }

    const cached = tSync(text);
    setTranslated(cached);

    // Se não estava em cache, pede tradução
    if (cached === text) {
      t(text).then(result => {
        setTranslated(result);
      }).catch(() => {
        setTranslated(text);
      });
    }
  }, [text, language, tSync, t, cacheVersion]);

  return translated;
}
