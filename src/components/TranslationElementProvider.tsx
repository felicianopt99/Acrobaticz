"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

type OriginalCreateElement = typeof React.createElement;

interface TranslationElementContextType {
  enabled: boolean;
  createElement: OriginalCreateElement;
}

const TranslationElementContext = createContext<TranslationElementContextType | undefined>(
  undefined
);

export function TranslationElementProvider({ children }: { children: ReactNode }) {
  const { language } = useTranslation();

  const wrappedCreateElement = ((
    type: any,
    props: any,
    ...rest: any[]
  ) => {
    // Only for string content children
    const childrenArg = rest[0];

    // If child is string and language is not English, mark it for translation
    if (typeof childrenArg === 'string' && childrenArg.trim() && language !== 'en') {
      // Add a data attribute to mark this for lazy translation
      const newProps = {
        ...props,
        'data-translate': 'true',
        'data-original-text': childrenArg,
      };

      // Use original createElement but with modified props
      const element = React.createElement(type, newProps, childrenArg);

      // If it's a simple text element, wrap in a translation component
      if (typeof type === 'string' && ['span', 'div', 'p', 'button', 'a', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(type)) {
        return React.createElement(TranslatableText, {
          text: childrenArg,
          element,
        });
      }

      return element;
    }

    return React.createElement(type, props, ...rest);
  }) as OriginalCreateElement;

  return (
    <TranslationElementContext.Provider value={{ enabled: language !== 'en', createElement: wrappedCreateElement }}>
      {children}
    </TranslationElementContext.Provider>
  );
}

/**
 * Component that translates text content
 */
function TranslatableText({ text, element }: { text: string; element: ReactNode }) {
  const { t } = useTranslation();
  const [translated, setTranslated] = React.useState(text);

  React.useEffect(() => {
    t(text)
      .then(result => setTranslated(result))
      .catch(() => setTranslated(text));
  }, [text, t]);

  if (translated === text) {
    return element;
  }

  // Return element but with translated text
  if (React.isValidElement(element)) {
    return React.cloneElement(element, {}, translated);
  }

  return element;
}
