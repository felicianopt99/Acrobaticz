# 📋 Mapeamento Completo de Ficheiros de Tradução

**Data**: 16 de Janeiro de 2026  
**Objetivo**: Localizar e rastrear todas as dependências

---

## 📁 Ficheiros do Sistema de Tradução

### ✅ NOVOS (Fase 2)
```
src/lib/translation-analyzer.ts (245 linhas)
├─ Status: ✅ NOVO - Implementado
├─ Descrição: Analisador baseado em JSON
├─ Dependências: translation-rules-loader
└─ Usado por: SmartFormTranslation, BackgroundTranslation

src/lib/translation-rules-loader.ts (195 linhas)
├─ Status: ✅ NOVO - Implementado
├─ Descrição: Parser tipado com cache
├─ Dependências: translation-rules.json
└─ Usado por: translation-analyzer, translation.ts
```

### ⚡ MODIFICADOS (Fase 2)
```
src/lib/translation.ts (677 linhas)
├─ Status: ✅ MODIFICADO (4 imports)
├─ Antes: loadTranslationRules() from './translation-rules'
├─ Depois: getPostTranslationRules() from './translation-rules-loader'
├─ Linhas: ~323, ~390, ~453, ~595
└─ Compilação: ✅ OK (0 erros)

src/components/translation/SmartFormTranslation.tsx (262 linhas)
├─ Status: ✅ MODIFICADO (1 import)
├─ Antes: import from '@/lib/translationRules'
├─ Depois: import from '@/lib/translation-analyzer'
├─ Linha: 5
└─ Compilação: ✅ OK

src/components/translation/BackgroundTranslation.tsx (332 linhas)
├─ Status: ✅ MODIFICADO (1 import)
├─ Antes: import from '@/lib/translationRules'
├─ Depois: import from '@/lib/translation-analyzer'
├─ Linha: 5
└─ Compilação: ✅ OK
```

### 🔄 CONSOLIDADO (Fase 1)
```
translation-rules.json
├─ Status: ✅ CONSOLIDADO (1 linha → 400+ linhas)
├─ Antes: {"Quote":"Orçamento","Quotes":"Orçamentos"}
├─ Depois: 50+ regras + 20+ padrões regex
├─ Estrutura:
│  ├─ postTranslationRules
│  ├─ neverTranslateRules (20 regras)
│  ├─ analyzeRules (5 regras)
│  ├─ translateRules (14 regras)
│  ├─ contentPatterns (5 categorias)
│  ├─ userContentAreas
│  └─ constraints
└─ Validação: ✅ JSON válido
```

### ⚠️ OBSOLETOS (Apagar em Fase 3)
```
src/lib/translationRules.ts (323 linhas)
├─ Status: ❌ OBSOLETO (será apagado)
├─ Motivo: Substituído por translation-analyzer.ts
├─ Contém: ContentAnalyzer, shouldTranslateText()
├─ Importado por: SmartFormTranslation, BackgroundTranslation [JÁ MIGRADO]
└─ Fase 3: rm -v src/lib/translationRules.ts

src/lib/translation-rules.ts (20 linhas)
├─ Status: ⚠️ OPCIONAL APAGAR (será deprecado)
├─ Motivo: Substituído por translation-rules-loader.ts
├─ Contém: loadTranslationRules(), TranslationRules type
├─ Importado por: translation.ts [JÁ MIGRADO]
└─ Fase 3: OPCIONAL - rm -v src/lib/translation-rules.ts (após 1 release)
```

---

## 🔗 Relacionados (Não afetados por consolidação)

```
src/lib/api-error-translation.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Tradução de erros API
└─ Nota: Não usa translationRules.ts

src/lib/client-pdf-translation.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Tradução para PDFs
└─ Nota: Pode ser beneficiário de futuros melhoramentos

src/lib/client-translation.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Tradução de clientes
└─ Nota: Usa deepl.service.ts

src/lib/pdf-translation.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Tradução PDF genérica
└─ Nota: Usa deepl.service.ts

src/lib/predictive-translation.service.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Traduções preditivas
└─ Nota: Independente do sistema de regras

src/lib/translation-integration.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Integração de tradução
└─ Nota: Pode usar translation-analyzer em futuro

src/lib/translation-metrics.service.ts
├─ Status: ✅ NÃO MODIFICADO
├─ Descrição: Métricas de tradução
└─ Nota: Independente do sistema de regras
```

---

## 🧪 Validação de Migrações

### Imports Verificados

| Ficheiro | Import | Antes | Depois | Status |
|----------|--------|-------|--------|--------|
| translation.ts | rules loader | `.translation-rules` | `.translation-rules-loader` | ✅ |
| SmartFormTranslation.tsx | analyzer | `translationRules` | `translation-analyzer` | ✅ |
| BackgroundTranslation.tsx | analyzer | `translationRules` | `translation-analyzer` | ✅ |

### Funcionais Migradas

| Função | De | Para | Locais |
|--------|----|----|--------|
| `loadTranslationRules()` | translation-rules.ts | `getPostTranslationRules()` | 4 |
| `shouldTranslateText()` | translationRules.ts | translation-analyzer.ts | 2 |

---

## 📊 Resumo de Ficheiros

```
TOTAL FICHEIROS DE TRADUÇÃO: 12

✅ NOVOS (Fase 2): 2
   • translation-analyzer.ts
   • translation-rules-loader.ts

✅ MODIFICADOS (Fase 2): 3
   • translation.ts (4 imports)
   • SmartFormTranslation.tsx (1 import)
   • BackgroundTranslation.tsx (1 import)

✅ CONSOLIDADOS (Fase 1): 1
   • translation-rules.json (1 linha → 400+)

⚠️ OBSOLETOS (Apagar Fase 3): 2
   • translationRules.ts (será apagado)
   • translation-rules.ts (será deprecado)

ℹ️ NÃO AFETADOS: 7
   • api-error-translation.ts
   • client-pdf-translation.ts
   • client-translation.ts
   • pdf-translation.ts
   • predictive-translation.service.ts
   • translation-integration.ts
   • translation-metrics.service.ts
```

---

## 🎯 Checklist de Verificação

- [x] Localizar todos os ficheiros de tradução
- [x] Identificar dependências
- [x] Criar novos ficheiros (loader + analyzer)
- [x] Atualizar imports em 3 ficheiros
- [x] Validar compilação (0 erros)
- [x] Consolidar JSON (50+ regras)
- [x] Documentar mudanças
- [ ] Testar em staging
- [ ] Apagar ficheiros obsoletos
- [ ] Deploy em produção

---

## 🔍 Verificação de Dependências Cruzadas

### Quem importa translationRules.ts? ✅ MIGRADO
```
❌ SmartFormTranslation.tsx ........... MIGRADO para translation-analyzer
❌ BackgroundTranslation.tsx ......... MIGRADO para translation-analyzer
```

### Quem importa translation-rules.ts? ✅ MIGRADO
```
❌ translation.ts (4 locais) ......... MIGRADO para translation-rules-loader
```

### Quem usaria translation-analyzer.ts? ✅ ATIVO
```
✅ SmartFormTranslation.tsx ......... ATIVO (novo import)
✅ BackgroundTranslation.tsx ........ ATIVO (novo import)
✅ Futuro: Outros componentes podem usar
```

### Quem usaria translation-rules-loader.ts? ✅ ATIVO
```
✅ translation-analyzer.ts ......... ATIVO (dependência interna)
✅ translation.ts ................... ATIVO (para regras de post-tradução)
✅ Futuro: API para Database pode usar
```

---

## 📝 Notas

1. **translation-rules.json** agora é a fonte única de verdade
2. **translation-analyzer.ts** implementa toda a lógica do antigo translationRules.ts
3. **translation-rules-loader.ts** fornece interface tipada e cache
4. **Backward compatibility** mantida através de defaults
5. **Zero breaking changes** para utilizadores finais

---

## 🚀 Próximos Passos

1. Executar testes em staging
2. Validar comportamento com novos padrões
3. Apagar translationRules.ts
4. Deprecar translation-rules.ts
5. Deploy em produção
