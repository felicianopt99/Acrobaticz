/**
 * Translation Content Analyzer
 * Intelligently determines if text should be translated based on patterns and rules
 * Uses centralised translation-rules.json configuration
 */

import {
  loadTranslationRulesConfig,
  getAllTranslationRules,
  getContentPatterns,
  getUserContentSelectors,
  getMaxTextLength,
} from './translation-rules-loader';

let cachedPatterns: any = null;
let cachedSelectors: string[] = [];
let cachedMaxLen: number = 500;

export interface TranslationRule {
  selector: string;
  action: 'translate' | 'skip' | 'analyze';
  reason: string;
  priority: number;
}

/**
 * Initialize cache on first use
 */
async function initializeCache() {
  if (!cachedPatterns) {
    cachedPatterns = await getContentPatterns();
    cachedSelectors = await getUserContentSelectors();
    cachedMaxLen = await getMaxTextLength();
  }
}

/**
 * Content analysis functions for pattern-based detection
 * Uses regex patterns from translation-rules.json
 */
export class ContentAnalyzer {
  static async isPersonalData(text: string): Promise<boolean> {
    if (!text || text.length === 0) return false;
    
    await initializeCache();
    const patterns = cachedPatterns.personalData.patterns;

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex);

        if (pattern.name === 'phone') {
          // Phone requires minimum 3 digits
          if (regex.test(text) && /\d{3,}/.test(text)) {
            console.debug(`[ContentAnalyzer] Detected phone: "${text}"`);
            return true;
          }
        } else if (pattern.name === 'properNames') {
          // Skip properNames check - too many false positives for UI text
          // This pattern was blocking common UI text
          continue;
        } else if (pattern.name === 'email') {
          if (regex.test(text)) {
            console.debug(`[ContentAnalyzer] Detected email: "${text}"`);
            return true;
          }
        } else {
          if (regex.test(text)) {
            console.debug(`[ContentAnalyzer] Detected ${pattern.name}: "${text}"`);
            return true;
          }
        }
      } catch (e) {
        console.warn(`Invalid regex pattern for ${pattern.name}:`, e);
      }
    }

    return false;
  }

  static async isBusinessData(text: string): Promise<boolean> {
    if (!text || text.length === 0) return false;

    await initializeCache();
    const patterns = cachedPatterns.businessData.patterns;

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex);
        const lowerText = text.trim();

        if (pattern.name === 'productCode') {
          // Requires both alpha and digits
          if (regex.test(lowerText) && /[A-Z]/.test(text) && /\d/.test(text)) {
            return true;
          }
        } else if (pattern.name === 'companyLegalSuffix') {
          if (regex.test(text)) return true;
        } else {
          if (regex.test(text)) return true;
        }
      } catch (e) {
        console.warn(`Invalid regex pattern for ${pattern.name}:`, e);
      }
    }

    return false;
  }

  static async isSystemIdentifier(text: string): Promise<boolean> {
    if (!text || text.length === 0) return false;

    await initializeCache();
    const patterns = cachedPatterns.systemIdentifiers.patterns;

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex);
        if (regex.test(text.trim())) return true;
      } catch (e) {
        console.warn(`Invalid regex pattern for ${pattern.name}:`, e);
      }
    }

    return false;
  }

  static async isUIText(text: string, element?: Element): Promise<boolean> {
    if (!text || text.length === 0) return false;

    await initializeCache();
    const keywords = cachedPatterns.uiElements.keywords;
    const lowerText = text.toLowerCase().trim();

    // Exact match for common UI words
    if (keywords.includes(lowerText)) return true;

    // Short instructional phrases
    if (text.length < 50 && /^[A-Z][a-z\s]+[.!?]?$/.test(text) && !this.isPersonalData(text)) {
      return true;
    }

    // Form validation messages
    if (/^(Please|Enter|Select|Choose|This field|Invalid|Required)/.test(text)) return true;

    return false;
  }

  static async isDateOrTime(text: string): Promise<boolean> {
    if (!text || text.length === 0) return false;

    await initializeCache();
    const patterns = cachedPatterns.dateTime.patterns;

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex);
        if (regex.test(text)) return true;
      } catch (e) {
        console.warn(`Invalid regex pattern for ${pattern.name}:`, e);
      }
    }

    return false;
  }
}

/**
 * Helper: Check if element is inside a user content area
 */
async function isInUserContentArea(element: Element): Promise<boolean> {
  await initializeCache();
  
  return cachedSelectors.some(selector => {
    try {
      return element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Helper: Check if this is a form input value or related to one
 */
function isFormInputValue(element: Element): boolean {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return true;
  }

  // Check if element displays form input value
  const parent = element.parentElement;
  if (parent) {
    const input = parent.querySelector('input, textarea, select');
    if (input && input.getAttribute('value') === element.textContent?.trim()) {
      return true;
    }
  }

  return false;
}

/**
 * Helper: Get matching rule for element (sorted by priority)
 */
async function getMatchingRule(element: Element): Promise<TranslationRule | null> {
  const allRules = await getAllTranslationRules();
  const sortedRules = allRules.sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    try {
      if (element.matches(rule.selector)) {
        return rule;
      }

      // Check if element is inside a matching parent
      if (element.closest(rule.selector)) {
        return rule;
      }
    } catch (e) {
      // Invalid selector, skip
      continue;
    }
  }

  return null;
}

/**
 * Main function: Determine if text should be translated
 * 
 * Algorithm:
 * 1. HARD BLOCKS - Never translate these (personal data, IDs, etc)
 * 2. Check explicit SKIP rules from configuration
 * 3. Default: TRANSLATE (unless we're sure it shouldn't be)
 */
export async function shouldTranslateText(text: string, element: Element): Promise<boolean> {
  if (!text || text.trim().length === 0) return false;

  await initializeCache();

  // Check max length constraint
  if (text.length > cachedMaxLen) {
    console.debug(`[Translation] Skipping long text (${text.length} > ${cachedMaxLen})`);
    return false;
  }

  // 1. HARD BLOCKS - Never translate these
  const isPersonal = await ContentAnalyzer.isPersonalData(text);
  if (isPersonal) {
    console.debug(`[Translation] Skipping personal data: "${text}"`);
    return false;
  }
  
  const isSystemId = await ContentAnalyzer.isSystemIdentifier(text);
  if (isSystemId) {
    console.debug(`[Translation] Skipping system identifier: "${text}"`);
    return false;
  }
  
  const isDateTime = await ContentAnalyzer.isDateOrTime(text);
  if (isDateTime) {
    console.debug(`[Translation] Skipping date/time: "${text}"`);
    return false;
  }
  
  if (isFormInputValue(element)) {
    console.debug(`[Translation] Skipping form input value: "${text}"`);
    return false;
  }
  
  if (await isInUserContentArea(element)) {
    console.debug(`[Translation] Skipping user content area`);
    return false;
  }

  // 2. Check explicit SKIP rules
  const matchedRule = await getMatchingRule(element);
  if (matchedRule?.action === 'skip') {
    console.debug(`[Translation] Skipping by rule (${matchedRule.reason}): "${text}"`);
    return false;
  }
  
  if (matchedRule?.action === 'translate') {
    console.debug(`[Translation] Translating by rule (${matchedRule.reason}): "${text}"`);
    return true;
  }

  // 3. Default: TRANSLATE (unless we're really sure it shouldn't be)
  console.debug(`[Translation] Translating by default: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  return true;
}

/**
 * Get translation rules summary for debugging
 */
export async function getTranslationAnalyzerSummary() {
  const config = await loadTranslationRulesConfig();
  return {
    version: config.meta.version,
    neverTranslate: config.neverTranslateRules.rules.length,
    analyze: config.analyzeRules.rules.length,
    alwaysTranslate: config.translateRules.rules.length,
    totalRules: (await getAllTranslationRules()).length,
    maxTextLength: await getMaxTextLength(),
    lastUpdated: config.meta.lastUpdated,
  };
}
