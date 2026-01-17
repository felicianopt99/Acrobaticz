"use client";

import React from 'react';
import { useTranslate } from '@/hooks/useTranslate';

/**
 * Wrapper que traduz automaticamente o texto de seus filhos
 * Uso: <T>Hello World</T>
 */
export function T({ children }: { children: React.ReactNode }) {
  const text = typeof children === 'string' ? children : '';
  const translated = useTranslate(text);

  if (typeof children === 'string') {
    return <>{translated}</>;
  }

  return <>{children}</>;
}

/**
 * Componente para traduzir atributos como placeholder, title, aria-label
 * Uso: <TranslatedAttribute element={ref} attr="placeholder" />
 */
export function TranslatedAttribute({
  element,
  attr,
  value,
}: {
  element?: React.RefObject<HTMLElement>;
  attr: string;
  value: string;
}) {
  const translated = useTranslate(value);

  React.useEffect(() => {
    if (element?.current) {
      element.current.setAttribute(attr, translated);
    }
  }, [translated, element, attr]);

  return null;
}
