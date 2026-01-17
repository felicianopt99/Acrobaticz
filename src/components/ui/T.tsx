"use client";

/**
 * Auto-Translate Component
 * 
 * Componente que automaticamente traduz qualquer texto passado.
 * Uso: <T>Texto em inglês</T> ou <T text="Texto em inglês" />
 * 
 * Funciona de duas formas:
 * 1. Com prop text: <T text="Hello" />
 * 2. Com children: <T>Hello</T>
 */

import React, { ReactNode } from 'react';
import { useTranslate } from '@/contexts/TranslationContext';

interface TProps {
  /** Texto para traduzir (se não usar children) */
  text?: string;
  /** Texto para traduzir (alternativa a text prop) */
  children?: ReactNode;
  /** Classe CSS opcional */
  className?: string;
  /** Tag HTML a usar (default: span, use 'fragment' para React.Fragment) */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'fragment';
}

/**
 * Componente de tradução universal
 * 
 * @example
 * // Usando prop text
 * <T text="Hello World" />
 * 
 * @example
 * // Usando children
 * <T>Hello World</T>
 * 
 * @example
 * // Com className
 * <T className="text-lg font-bold">Welcome</T>
 * 
 * @example
 * // Com tag específica
 * <T as="h1">Page Title</T>
 */
export function T({ text, children, className, as = 'fragment' }: TProps) {
  // Determine the text to translate
  const textToTranslate = text || (typeof children === 'string' ? children : '');
  
  // Use the translation hook
  const { translated } = useTranslate(textToTranslate);
  
  // If children is not a simple string, render as-is (can't translate React nodes)
  if (children && typeof children !== 'string') {
    return <>{children}</>;
  }
  
  // Render based on 'as' prop
  if (as === 'fragment') {
    return <>{translated}</>;
  }
  
  const Tag = as;
  return <Tag className={className}>{translated}</Tag>;
}

/**
 * Hook para traduzir texto em componentes funcionais
 * Re-exportado para conveniência
 */
export { useTranslate } from '@/contexts/TranslationContext';

/**
 * Hook para acesso completo ao contexto de tradução
 * Re-exportado para conveniência
 */
export { useTranslation } from '@/contexts/TranslationContext';

export default T;
