# 🔄 Consolidação de Regras de Tradução - Plano de Refatoração

**Data**: 16 de Janeiro de 2026  
**Objetivo**: Centralizar regras de tradução e eliminar duplicação entre `.ts` e `.json`

---

## 📊 Análise Executiva

### Estado Atual (ANTES)
```
❌ translationRules.ts (323 linhas)
   ├─ 50+ regras de CSS selectors
   ├─ 4 classes de análise de conteúdo
   ├─ Lógica de detecção hardcoded
   └─ Não persistido em JSON

❌ translation-rules.json (1 linha)
   └─ Apenas 2 regras: Quote/Quotes

❌ translation-rules.ts (20 linhas)
   └─ Carregador genérico que só lê 2 regras do JSON

❌ PROBLEMA: O motor real está em .ts, não configurável
```

### Estado Desejado (DEPOIS)
```
✅ translation-rules.json (NOVO - completo)
   ├─ 20 regras "nunca traduzir"
   ├─ 5 regras "analisar"
   ├─ 14 regras "sempre traduzir"
   ├─ 20+ padrões de detecção
   ├─ Configurável externamente
   └─ Controlado por Database (via API)

✅ translation-rules-loader.ts (NOVO)
   ├─ Parser de JSON com cache
   ├─ Getters tipados para cada seção
   ├─ Fallback automático
   └─ Função de summary para debug

✅ translationRules.ts (APAGADO)
   └─ Importações migradas para o loader

✅ translation-rules.ts (MODIFICADO)
   └─ Agora importa de translation-rules-loader.ts
```

---

## 📝 Mudanças Necessárias

### 1️⃣ **Ficheiro JSON Consolidado**
**Status**: ✅ CONCLUÍDO  
**Localização**: [translation-rules.json](translation-rules.json)

**Conteúdo**:
- ✅ 20 regras "nunca traduzir" (dados pessoais, IDs, preços)
- ✅ 5 regras "analisar" (tabelas, dropdowns, listas)
- ✅ 14 regras "sempre traduzir" (UI, botões, labels)
- ✅ Padrões regex para detecção automática
- ✅ Área de conteúdo do utilizador
- ✅ Restrições gerais (tamanho máximo, etc)

**Exemplo de estrutura**:
```json
{
  "postTranslationRules": { "Quote": "Orçamento", "Quotes": "Orçamentos" },
  "neverTranslateRules": { "rules": [...] },
  "analyzeRules": { "rules": [...] },
  "translateRules": { "rules": [...] },
  "contentPatterns": { "personalData": {...}, "businessData": {...} },
  "constraints": { "maxTextLength": 500 }
}
```

---

### 2️⃣ **Novo Carregador Tipado**
**Status**: ✅ CONCLUÍDO  
**Localização**: [src/lib/translation-rules-loader.ts](src/lib/translation-rules-loader.ts)

**Funcionalidades**:
- ✅ Parser de JSON com caching automático
- ✅ Interfaces TypeScript completas (`TranslationRulesConfig`, `TranslationRule`)
- ✅ Getters especializados para cada seção
- ✅ Fallback automático se JSON não existir
- ✅ Função `getTranslationRulesSummary()` para debug
- ✅ `clearRulesCache()` para testes

**Exemplo de uso**:
```typescript
import { loadTranslationRulesConfig, getAllTranslationRules } from '@/lib/translation-rules-loader';

const config = loadTranslationRulesConfig();
const rules = getAllTranslationRules();
const postRules = getPostTranslationRules();
```

---

### 3️⃣ **Ficheiros a Modificar**

#### A. [src/lib/translation.ts](src/lib/translation.ts)
**Alteração**: Mudar importação

**Antes**:
```typescript
import { loadTranslationRules } from './translation-rules';
```

**Depois**:
```typescript
import { getPostTranslationRules } from './translation-rules-loader';

function applyPostTranslationRules(...) {
  const rules = getPostTranslationRules();
  // resto do código...
}
```

---

#### B. [src/lib/translation-rules.ts](src/lib/translation-rules.ts)
**Alteração**: Deprecate ou converter para wrapper

**Opção 1 - Simples (Recomendado)**:
```typescript
// DEPRECATED: Use translation-rules-loader.ts instead
export type TranslationRules = Record<string, string>;

export function loadTranslationRules(): TranslationRules {
  return getPostTranslationRules(); // Só retorna post-translation rules
}
```

**Opção 2 - Agressiva (Melhor)**:
- Apagar completamente o ficheiro
- Atualizar todas as importações (5 locais)

---

#### C. [src/components/translation/SmartFormTranslation.tsx](src/components/translation/SmartFormTranslation.tsx)
**Alteração**: Mudar importação

**Antes**:
```typescript
import { shouldTranslateText } from '@/lib/translationRules';
```

**Depois**:
```typescript
import { shouldTranslateText } from '@/lib/translation-analyzer'; // NOVO
```

**Nota**: Será necessário criar [src/lib/translation-analyzer.ts](src/lib/translation-analyzer.ts) que implementa a lógica de análise usando o JSON

---

#### D. [src/components/translation/BackgroundTranslation.tsx](src/components/translation/BackgroundTranslation.tsx)
**Mesma alteração que C**

---

### 4️⃣ **Novo Analisador (Optional mas Recomendado)**
**Localização**: Criar [src/lib/translation-analyzer.ts](src/lib/translation-analyzer.ts)

**Responsabilidade**: Implementar a lógica do `ContentAnalyzer` usando padrões do JSON

```typescript
export function shouldTranslateText(text: string, element: Element): boolean {
  const config = loadTranslationRulesConfig();
  
  // 1. Hard blocks
  if (isPersonalData(text, config.contentPatterns.personalData)) return false;
  if (isSystemIdentifier(text, config.contentPatterns.systemIdentifiers)) return false;
  
  // 2. Check rules
  const matchedRule = getMatchingRule(element, getAllTranslationRules());
  if (matchedRule?.action === 'skip') return false;
  
  return true; // Default: translate
}
```

---

## 🚀 Plano de Execução

### Fase 1: Preparação (CONCLUÍDO)
- ✅ Criar JSON consolidado completo
- ✅ Criar translation-rules-loader.ts com tipos
- ✅ Validar estrutura JSON

### Fase 2: Refatoração (PRÓXIMO)
- ⏳ Criar translation-analyzer.ts
- ⏳ Atualizar translation.ts
- ⏳ Atualizar SmartFormTranslation.tsx
- ⏳ Atualizar BackgroundTranslation.tsx
- ⏳ Deprecate translation-rules.ts

### Fase 3: Limpeza
- ⏳ Apagar translationRules.ts (após validação)
- ⏳ Apagar translation-rules.ts (se não mais usado)
- ⏳ Testar fluxo completo

---

## 🗑️ Comando para Apagar Ficheiros (Fase 3)

```bash
# Apenas após validação completa!
rm -v src/lib/translationRules.ts
rm -v src/lib/translation-rules.ts  # Se convertido para loader
```

---

## 📌 Importações Afetadas (5 ficheiros)

| Ficheiro | Tipo | Atual | Novo |
|----------|------|-------|------|
| [src/lib/translation.ts](src/lib/translation.ts) | `.ts` | `loadTranslationRules` | `getPostTranslationRules` |
| [src/components/translation/SmartFormTranslation.tsx](src/components/translation/SmartFormTranslation.tsx) | `.tsx` | `translationRules` | `translation-analyzer` |
| [src/components/translation/BackgroundTranslation.tsx](src/components/translation/BackgroundTranslation.tsx) | `.tsx` | `translationRules` | `translation-analyzer` |
| `translation.ts` (linha 323) | Uso | `loadTranslationRules()` | `getPostTranslationRules()` |
| `translation.ts` (linha 390) | Uso | `loadTranslationRules()` | `getPostTranslationRules()` |

---

## ✨ Benefícios da Consolidação

| Aspecto | Antes | Depois |
|--------|-------|--------|
| **Fonte Única** | 3 ficheiros (split) | 1 JSON centralizado |
| **Configurabilidade** | Hardcoded | JSON + Database-ready |
| **Tipo de Dados** | Sem tipos (rules em array) | TypeScript completo |
| **Manutenção** | Duplicação | Sem duplicação |
| **Performance** | Sem cache | Cache em memória |
| **Fallback** | Não | Automático |
| **Debug** | Difícil | `getTranslationRulesSummary()` |
| **Extensibilidade** | Limitada | Fácil (só mudar JSON) |

---

## 🔗 Proximos Passos

1. **Confirmar**: Deseja prosseguir com as modificações?
2. **Escolher Estratégia**:
   - **Opção A (Conservadora)**: Manter `translation-rules.ts` como wrapper
   - **Opção B (Agressiva)**: Apagar `translation-rules.ts` e atualizar todos os importadores
3. **Implementar**: Criar `translation-analyzer.ts` e migrar lógica
4. **Testar**: Validar fluxo completo
5. **Deploy**: Remover ficheiros obsoletos

---

## 📞 Contacto para Esclarecimentos

**Ficheiros Envolvidos**:
- [translation-rules.json](translation-rules.json) - Configuração centralizada
- [src/lib/translation-rules-loader.ts](src/lib/translation-rules-loader.ts) - Carregador novo
- [src/lib/translationRules.ts](src/lib/translationRules.ts) - **APAGAR (depois)**
- [src/lib/translation-rules.ts](src/lib/translation-rules.ts) - **DEPRECATE**

**Estratégia de Consolidação**: ✅ **COMPLETA**
