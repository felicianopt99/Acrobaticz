#!/bin/bash

# ============================================================================
# DeepL Integration - Post-Implementation Validation Script
# ============================================================================
# Este script valida se todas as correções foram implementadas corretamente
#
# Usage: bash scripts/validate-deepl-integration.sh

set -e

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_ROOT"

echo "🔍 VALIDAÇÃO DA INTEGRAÇÃO DeepL - Relatório Completo"
echo "============================================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Função auxiliar para checks
check_file_exists() {
  local file="$1"
  local description="$2"
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $description"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC} $description - Ficheiro não encontrado: $file"
    ((CHECKS_FAILED++))
    return 1
  fi
}

# Função para verificar se string existe num ficheiro
check_string_in_file() {
  local file="$1"
  local string="$2"
  local description="$3"
  
  if grep -q "$string" "$file" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} $description"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC} $description"
    ((CHECKS_FAILED++))
    return 1
  fi
}

# ============================================================================
# CRÍTICO #1: Endpoint v1 → v2
# ============================================================================
echo -e "${BLUE}[1/8] Verificar Endpoint DeepL (v1 → v2)${NC}"
check_string_in_file \
  "src/app/api/actions/api-configuration.actions.ts" \
  "https://api-free.deepl.com/v2/translate" \
  "Endpoint de teste DeepL usando v2 (não v1)"
echo ""

# ============================================================================
# CRÍTICO #2: Fallback Env Var
# ============================================================================
echo -e "${BLUE}[2/8] Verificar Fallback Environment Variable${NC}"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "process.env.DEEPL_API_KEY" \
  "Fallback para DEEPL_API_KEY em environment variable"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "Priority 3: Environment variable" \
  "Comentário de prioridade 3 (env var)"
echo ""

# ============================================================================
# CRÍTICO #3: Validação de Chave
# ============================================================================
echo -e "${BLUE}[3/8] Verificar Validação de Chave API${NC}"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "function validateDeeplApiKey" \
  "Função validateDeeplApiKey() implementada"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "trimmed.length < 24 || trimmed.length > 128" \
  "Validação de comprimento (24-128 chars)"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "^\[a-zA-Z0-9\\\\-:\\]\+" \
  "Validação de caracteres (alfanuméricos, hífens, dois-pontos)"
echo ""

# ============================================================================
# CRÍTICO #4: Tratamento Erro 429
# ============================================================================
echo -e "${BLUE}[4/8] Verificar Tratamento de Rate Limit (429)${NC}"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "response.status === 429" \
  "Detecção de erro 429 (rate limit)"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "isRateLimited = true" \
  "Flag isRateLimited para tratamento especial"
check_string_in_file \
  "src/lib/deepl.service.ts" \
  "delay = 60000" \
  "Delay de 60 segundos para rate limit (vs 500ms normal)"
echo ""

# ============================================================================
# CRÍTICO #5: Reset Cache
# ============================================================================
echo -e "${BLUE}[5/8] Verificar Reset de Cache após Config${NC}"
check_string_in_file \
  "src/app/api/setup/complete/route.ts" \
  "resetDeeplApiKeyCache" \
  "Chamada a resetDeeplApiKeyCache() após setup"
check_string_in_file \
  "src/app/api/setup/complete/route.ts" \
  "import.*deepl.service" \
  "Import dinâmico de deepl.service"
echo ""

# ============================================================================
# IMPORTANTE #1: Unificar Cache
# ============================================================================
echo -e "${BLUE}[6/8] Verificar Unificação de Cache (LRU removido)${NC}"
check_string_in_file \
  "src/lib/translation.ts" \
  "Use disabled. Todas as traduções usam BD cache" \
  "Cache LRU desabilitado com aviso"
check_string_in_file \
  "src/lib/translation.ts" \
  "return undefined" \
  "LRUCache.get() retorna undefined (força uso de BD)"
echo ""

# ============================================================================
# IMPORTANTE #2: Health Check Endpoint
# ============================================================================
echo -e "${BLUE}[7/8] Verificar Health Check Endpoint${NC}"
check_file_exists \
  "src/app/api/admin/deepl/health/route.ts" \
  "Ficheiro health/route.ts criado"
check_string_in_file \
  "src/app/api/admin/deepl/health/route.ts" \
  "export async function GET" \
  "Endpoint GET /api/admin/deepl/health implementado"
check_string_in_file \
  "src/app/api/admin/deepl/health/route.ts" \
  "export async function POST" \
  "Endpoint POST /api/admin/deepl/health implementado"
check_string_in_file \
  "src/app/api/admin/deepl/health/route.ts" \
  "clean-expired" \
  "Ação 'clean-expired' implementada"
check_string_in_file \
  "src/app/api/admin/deepl/health/route.ts" \
  "test-translation" \
  "Ação 'test-translation' implementada"
echo ""

# ============================================================================
# IMPORTANTE #3: Testes Unitários
# ============================================================================
echo -e "${BLUE}[8/8] Verificar Suite de Testes${NC}"
check_file_exists \
  "src/__tests__/deepl.service.test.ts" \
  "Ficheiro deepl.service.test.ts criado"
check_string_in_file \
  "src/__tests__/deepl.service.test.ts" \
  "describe.*API Key Validation" \
  "Testes para validação de chave API"
check_string_in_file \
  "src/__tests__/deepl.service.test.ts" \
  "describe.*Retry Logic" \
  "Testes para lógica de retry"
check_string_in_file \
  "src/__tests__/deepl.service.test.ts" \
  "describe.*Concurrency Control" \
  "Testes para controle de concorrência"
check_string_in_file \
  "src/__tests__/deepl.service.test.ts" \
  "describe.*Cache Management" \
  "Testes para gestão de cache"
echo ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
echo "============================================================================"
echo -e "${BLUE}📊 RESUMO FINAL${NC}"
echo "============================================================================"
echo -e "Checks aprovados: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks falhados: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 TODAS AS VERIFICAÇÕES PASSARAM!${NC}"
  echo ""
  echo "✅ Próximos passos:"
  echo "   1. Executar npm run dev para testar localmente"
  echo "   2. Testar endpoint: curl http://localhost:3000/api/admin/deepl/health"
  echo "   3. Executar: npm test -- deepl.service.test.ts"
  echo "   4. Fazer docker build e testar em contentor"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Algumas verificações falharam${NC}"
  echo ""
  echo "❌ Erros encontrados:"
  echo "   - Revisar os ficheiros listados acima"
  echo "   - Comparar com o relatório de implementação"
  echo ""
  exit 1
fi
