"use client";

import { useTranslation } from '@/contexts/TranslationContext';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-xs font-mono ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => setLanguage('pt')}
        className={`px-3 py-1 rounded text-xs font-mono ${
          language === 'pt'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🇵🇹 PT
      </button>
    </div>
  );
}
