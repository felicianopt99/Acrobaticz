/**
 * Translation Rules Loader
 * Centralised loader for translation-rules.json
 * Single source of truth for all translation configuration
 * 
 * Works in both Server and Client environments (Next.js compatible)
 */

export interface TranslationRule {
  selector: string;
  action: 'translate' | 'skip' | 'analyze';
  reason: string;
  priority: number;
}

export interface TranslationRulesConfig {
  meta: {
    version: string;
    description: string;
    lastUpdated: string;
    source: string;
  };
  postTranslationRules: Record<string, string>;
  neverTranslateRules: {
    description: string;
    rules: TranslationRule[];
  };
  analyzeRules: {
    description: string;
    rules: TranslationRule[];
  };
  translateRules: {
    description: string;
    rules: TranslationRule[];
  };
  contentPatterns: {
    personalData: {
      description: string;
      patterns: Array<{ name: string; regex: string; [key: string]: any }>;
    };
    businessData: {
      description: string;
      patterns: Array<{ name: string; regex: string; [key: string]: any }>;
    };
    systemIdentifiers: {
      description: string;
      patterns: Array<{ name: string; regex: string; [key: string]: any }>;
    };
    dateTime: {
      description: string;
      patterns: Array<{ name: string; regex: string; [key: string]: any }>;
    };
    uiElements: {
      description: string;
      keywords: string[];
    };
  };
  userContentAreas: {
    description: string;
    selectors: string[];
  };
  constraints: {
    maxTextLength: number;
    description: string;
  };
}

let cachedRules: TranslationRulesConfig | null = null;

/**
 * Load translation rules from JSON file or public URL
 * Works in both Server and Client environments
 */
export async function loadTranslationRulesConfig(): Promise<TranslationRulesConfig> {
  // Return cached version if available
  if (cachedRules) {
    return cachedRules as TranslationRulesConfig;
  }

  try {
    // Try to load from public folder (works in both server and client)
    const response = await fetch('/translation-rules.json', {
      cache: 'force-cache', // Cache aggressively
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch translation rules: ${response.status}`);
    }

    cachedRules = await response.json();
    return cachedRules as TranslationRulesConfig;
  } catch (e) {
    console.error('Failed to load translation-rules.json:', e);
    return getDefaultRulesConfig();
  }
}

/**
 * Get all translation rules as flat array (for selector matching)
 */
export async function getAllTranslationRules(): Promise<TranslationRule[]> {
  const config = await loadTranslationRulesConfig();
  return [
    ...config.neverTranslateRules.rules,
    ...config.analyzeRules.rules,
    ...config.translateRules.rules,
  ];
}

/**
 * Get post-translation rules (word replacements)
 */
export async function getPostTranslationRules(): Promise<Record<string, string>> {
  const config = await loadTranslationRulesConfig();
  return config.postTranslationRules;
}

/**
 * Get content pattern for pattern-based detection
 */
export async function getContentPatterns() {
  const config = await loadTranslationRulesConfig();
  return config.contentPatterns;
}

/**
 * Get user content area selectors
 */
export async function getUserContentSelectors(): Promise<string[]> {
  const config = await loadTranslationRulesConfig();
  return config.userContentAreas.selectors;
}

/**
 * Get maximum text length constraint
 */
export async function getMaxTextLength(): Promise<number> {
  const config = await loadTranslationRulesConfig();
  return config.constraints.maxTextLength;
}

/**
 * Get rules summary for debugging/monitoring
 */
export async function getTranslationRulesSummary() {
  const config = await loadTranslationRulesConfig();
  return {
    version: config.meta.version,
    neverTranslate: config.neverTranslateRules.rules.length,
    analyze: config.analyzeRules.rules.length,
    alwaysTranslate: config.translateRules.rules.length,
    total: (await getAllTranslationRules()).length,
    postTranslationRulesCount: Object.keys(config.postTranslationRules).length,
    lastUpdated: config.meta.lastUpdated,
  };
}

/**
 * Default configuration (fallback)
 */
function getDefaultRulesConfig(): TranslationRulesConfig {
  return {
    meta: {
      version: '1.0',
      description: 'Default translation rules (file not found)',
      lastUpdated: new Date().toISOString(),
      source: 'Default fallback',
    },
    postTranslationRules: {
      Quote: 'Orçamento',
      Quotes: 'Orçamentos',
    },
    neverTranslateRules: {
      description: 'Default never translate rules',
      rules: [
        {
          selector: '[data-no-translate], .no-translate',
          action: 'skip',
          reason: 'Explicitly excluded',
          priority: 1,
        },
      ],
    },
    analyzeRules: {
      description: 'Default analyze rules',
      rules: [],
    },
    translateRules: {
      description: 'Default translate rules',
      rules: [
        {
          selector: 'button, .btn, label, h1, h2, h3',
          action: 'translate',
          reason: 'UI elements',
          priority: 3,
        },
      ],
    },
    contentPatterns: {
      personalData: {
        description: 'Personal data patterns',
        patterns: [
          {
            name: 'email',
            regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
          },
        ],
      },
      businessData: {
        description: 'Business data patterns',
        patterns: [],
      },
      systemIdentifiers: {
        description: 'System identifier patterns',
        patterns: [],
      },
      dateTime: {
        description: 'Date/time patterns',
        patterns: [],
      },
      uiElements: {
        description: 'UI element keywords',
        keywords: [
          'save',
          'cancel',
          'delete',
          'edit',
          'add',
          'create',
          'update',
          'submit',
        ],
      },
    },
    userContentAreas: {
      description: 'User content area selectors',
      selectors: [
        '[data-user-content]',
        '.user-content',
        '.client-info',
        '.equipment-details',
      ],
    },
    constraints: {
      maxTextLength: 500,
      description: 'Skip texts longer than this',
    },
  };
}

/**
 * Clear cache (useful for testing)
 */
export function clearRulesCache(): void {
  cachedRules = null;
}
