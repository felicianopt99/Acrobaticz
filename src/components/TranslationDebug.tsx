"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

export function TranslationDebug() {
  const { language, isTranslating, isPreloading, cacheStats } = useTranslation();
  const [stats, setStats] = useState<{ size: number; keys: string[] }>({ size: 0, keys: [] });

  useEffect(() => {
    const stats = cacheStats();
    setStats(stats as any);
    
    const interval = setInterval(() => {
      setStats(cacheStats() as any);
    }, 1000);

    return () => clearInterval(interval);
  }, [cacheStats]);

  if (language === 'en') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black text-green-400 px-3 py-2 rounded text-xs font-mono shadow-lg border border-green-400">
      <div>🌐 Language: {language}</div>
      <div>📦 Cache: {stats.size} entries</div>
      <div>🔄 Translating: {isTranslating ? 'YES' : 'NO'}</div>
      <div>⏳ Preloading: {isPreloading ? 'YES' : 'NO'}</div>
      <div className="mt-1 text-yellow-400">Frontend Debug Mode</div>
    </div>
  );
}
