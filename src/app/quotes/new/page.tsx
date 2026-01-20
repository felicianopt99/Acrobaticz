
// src/app/quotes/new/page.tsx
"use client";

import { QuoteForm } from '@/components/quotes/QuoteForm';
import { FileText } from 'lucide-react';

import { useTranslate } from '@/contexts/TranslationContext';
export default function NewQuotePage() {
  // Translation hooks
  const { translated: uiCreateNewQuoteText } = useTranslate('Create New Quote');
  const { translated: uiQuoteSubtitleText } = useTranslate('Generate professional quotes for your AV rental services');

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-10 sm:h-12 w-10 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg bg-gray-800 dark:bg-gray-700 flex-shrink-0">
                <FileText className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">{uiCreateNewQuoteText}</h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{uiQuoteSubtitleText}</p>
          </div>
        </div>
        
        <QuoteForm />
      </div>
    </div>
  );
}
