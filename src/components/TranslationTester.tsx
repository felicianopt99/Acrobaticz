"use client";

import { useTranslation } from '@/contexts/TranslationContext';
import { useEffect, useState } from 'react';

export function TranslationTester() {
  const { language, t, tBatch } = useTranslation();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const test = async () => {
    setLoading(true);
    try {
      const texts = [
        'Welcome to our system',
        'Please enter your credentials',
        'Dashboard',
        'Inventory',
      ];
      
      console.log('Testing translation with:', texts);
      const translated = await tBatch(texts);
      console.log('Translated results:', translated);
      setResults(translated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-test when language changes
    test();
  }, [language]);

  return (
    <div className="fixed top-24 left-4 z-50 bg-purple-900 text-white px-3 py-2 rounded text-xs shadow-lg max-w-xs">
      <div className="font-bold mb-2">🧪 Translation Tester</div>
      <div className="text-yellow-300">Language: {language}</div>
      <button
        onClick={test}
        disabled={loading}
        className="mt-2 px-2 py-1 bg-purple-700 rounded text-xs hover:bg-purple-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test'}
      </button>
      {results.length > 0 && (
        <div className="mt-2 text-green-300 text-xs">
          <div>Results:</div>
          {results.map((r, i) => (
            <div key={i}>{i + 1}. {r}</div>
          ))}
        </div>
      )}
    </div>
  );
}
