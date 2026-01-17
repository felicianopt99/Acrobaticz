"use client";

import React, { useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Componente que monitora o DOM e traduz textos automaticamente
 * Funciona capturando elementos DOM criados e chamando a API de tradução
 */
export function DOMTranslationObserver() {
  const { language, tBatch } = useTranslation();

  useEffect(() => {
    if (language === 'en' || typeof window === 'undefined') return;

    const processedTexts = new WeakSet<Node>();
    const pendingTexts = new Map<string, Element[]>();
    let processingTimeout: NodeJS.Timeout;

    const translatePendingTexts = async () => {
      if (pendingTexts.size === 0) return;

      const textsToTranslate = Array.from(pendingTexts.keys());
      try {
        const translated = await tBatch(textsToTranslate);

        textsToTranslate.forEach((original, idx) => {
          const newText = translated[idx];
          if (newText && newText !== original) {
            pendingTexts.get(original)?.forEach(element => {
              // Verify element is still a valid DOM node before using it
              if (!element || !(element instanceof Node)) {
                return;
              }
              
              // Update all text nodes in the element
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null
              );

              let node: Text | null;
              while ((node = walker.nextNode() as Text)) {
                if (node.textContent?.trim() === original) {
                  node.textContent = newText;
                  processedTexts.add(node);
                }
              }
            });
          }
        });

        pendingTexts.clear();
      } catch (error) {
        console.error('Error translating DOM texts:', error);
        pendingTexts.clear();
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text && text.length > 1 && text.length < 200 && !processedTexts.has(node)) {
              const parentEl = node.parentElement;
              if (parentEl) {
                if (!pendingTexts.has(text)) {
                  pendingTexts.set(text, []);
                }
                pendingTexts.get(text)!.push(parentEl);
                processedTexts.add(node);
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const text = element.textContent?.trim();
            
            if (text && text.length > 1 && text.length < 200 && !processedTexts.has(element)) {
              // Only translate if it's a leaf node (no children with their own text)
              const hasChildElements = element.children.length > 0;
              if (!hasChildElements) {
                if (!pendingTexts.has(text)) {
                  pendingTexts.set(text, []);
                }
                pendingTexts.get(text)!.push(element);
                processedTexts.add(element);
              }
            }
          }
        });
      });

      // Debounce translation
      clearTimeout(processingTimeout);
      processingTimeout = setTimeout(() => {
        translatePendingTexts();
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    return () => {
      observer.disconnect();
      clearTimeout(processingTimeout);
    };
  }, [language, tBatch]);

  return null;
}
