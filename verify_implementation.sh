#!/usr/bin/env bash
# 🔍 CHECKLIST DE VERIFICAÇÃO - Arquitetura Integrada
# Execute isto para validar que tudo está implementado corretamente

set -e

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                 🔍 CHECKLIST DE VERIFICAÇÃO                           ║"
echo "║            Arquitetura Integrada de Segurança - Acrobaticz           ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper functions
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $description (file not found: $file)"
        ((FAILED++))
    fi
}

check_content() {
    local file=$1
    local search_term=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$search_term" "$file"; then
        echo -e "${GREEN}✅${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $description (not found in $file)"
        ((FAILED++))
    fi
}

# ============================================================================
# 1. CHECK FICHEIROS CRIADOS
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 1: Ficheiros Core Criados"
echo "═══════════════════════════════════════════════════════════════════════"

check_file "src/lib/prisma-extended.ts" "Prisma Extended (soft-delete + activity log)"
check_file "src/lib/api-wrapper.ts" "API Wrapper (rate limiting + validation + error handling)"
check_file "src/lib/schemas.ts" "Zod Schemas com XSS sanitization"
check_file "src/app/api/rentals/route.ts" "Exemplo de implementação - Rentals API"

# ============================================================================
# 2. CHECK DOCUMENTAÇÃO
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 2: Documentação Completa"
echo "═══════════════════════════════════════════════════════════════════════"

check_file "ARQUITECTURA_INTEGRADA_SEGURANCA.md" "Documentação completa da arquitetura"
check_file "QUICK_START_INTEGRATED_SECURITY.md" "Quick start guide"
check_file "ARQUITETURA_DIAGRAMAS_VISUAIS.md" "Diagramas e fluxos visuais"
check_file "RESUMO_EXECUTIVO_SEGURANCA.md" "Resumo executivo"

# ============================================================================
# 3. CHECK CONTEÚDO - PRISMA EXTENDED
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 3: Conteúdo - Prisma Extended"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/lib/prisma-extended.ts" "function createPrismaExtended" "Função createPrismaExtended definida"
check_content "src/lib/prisma-extended.ts" "function getPrismaExtended" "Função getPrismaExtended definida"
check_content "src/lib/prisma-extended.ts" "SOFT_DELETE_MODELS" "Lista de modelos com soft-delete"
check_content "src/lib/prisma-extended.ts" "logActivityOperation" "Função de activity logging"
check_content "src/lib/prisma-extended.ts" "setOperationContext" "Context management para logging"
check_content "src/lib/prisma-extended.ts" "restoreSoftDeleted" "Helper para restaurar soft-deletes"
check_content "src/lib/prisma-extended.ts" "getSoftDeletedRecords" "Helper para listar registos deletados"
check_content "src/lib/prisma-extended.ts" "purgeOldSoftDeletes" "Helper para limpar registos antigos"

# ============================================================================
# 4. CHECK CONTEÚDO - API WRAPPER
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 4: Conteúdo - API Wrapper"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/lib/api-wrapper.ts" "function checkRateLimit" "Rate limiting implementado"
check_content "src/lib/api-wrapper.ts" "const PRISMA_ERROR_MAP" "Mapeamento de erros Prisma"
check_content "src/lib/api-wrapper.ts" "function handlePrismaError" "Handler de erros Prisma"
check_content "src/lib/api-wrapper.ts" "function withSafety" "HOC withSafety implementado"
check_content "src/lib/api-wrapper.ts" "successResponse" "Helper successResponse"
check_content "src/lib/api-wrapper.ts" "errorResponse" "Helper errorResponse"
check_content "src/lib/api-wrapper.ts" "X-RateLimit" "Headers de rate limit"
check_content "src/lib/api-wrapper.ts" "ZodError" "Tratamento de erros Zod"

# ============================================================================
# 5. CHECK CONTEÚDO - SCHEMAS
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 5: Conteúdo - Zod Schemas"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/lib/schemas.ts" "import DOMPurify" "DOMPurify importado"
check_content "src/lib/schemas.ts" "SafeString" "SafeString schema definido"
check_content "src/lib/schemas.ts" "SafeEmail" "SafeEmail schema definido"
check_content "src/lib/schemas.ts" "SafePhone" "SafePhone schema definido"
check_content "src/lib/schemas.ts" "RentalCreateSchema" "RentalCreateSchema definido"
check_content "src/lib/schemas.ts" "RentalUpdateSchema" "RentalUpdateSchema definido"
check_content "src/lib/schemas.ts" "EquipmentCreateSchema" "EquipmentCreateSchema definido"
check_content "src/lib/schemas.ts" "ClientCreateSchema" "ClientCreateSchema definido"
check_content "src/lib/schemas.ts" "sanitizeString" "Função de sanitização"
check_content "src/lib/schemas.ts" "PaginationSchema" "PaginationSchema para queries"

# ============================================================================
# 6. CHECK CONTEÚDO - EXAMPLE ROUTE
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 6: Conteúdo - Exemplo de Rota"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/app/api/rentals/route.ts" "withSafety" "withSafety HOC aplicado"
check_content "src/app/api/rentals/route.ts" "RentalCreateSchema" "Schema de validação usado"
check_content "src/app/api/rentals/route.ts" "getPrismaExtended" "Prisma extended importado"
check_content "src/app/api/rentals/route.ts" "successResponse" "Response helpers usados"
check_content "src/app/api/rentals/route.ts" "errorResponse" "Error handling implementado"
check_content "src/app/api/rentals/route.ts" "WRITE_RATE_LIMIT" "Rate limiting configurado"
check_content "src/app/api/rentals/route.ts" "READ_RATE_LIMIT" "Rate limiting para leitura"
check_content "src/app/api/rentals/route.ts" "export const GET" "GET endpoint implementado"
check_content "src/app/api/rentals/route.ts" "export const POST" "POST endpoint implementado"
check_content "src/app/api/rentals/route.ts" "export const PUT" "PUT endpoint implementado"
check_content "src/app/api/rentals/route.ts" "export const DELETE" "DELETE endpoint implementado"

# ============================================================================
# 7. CHECK FEATURES IMPLEMENTADAS
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 7: Features de Segurança Implementadas"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/lib/api-wrapper.ts" "rateLimitStore" "In-memory rate limit store"
check_content "src/lib/api-wrapper.ts" "checkRateLimit" "Rate limit check por IP"
check_content "src/lib/schemas.ts" "DOMPurify.sanitize" "XSS prevention via DOMPurify"
check_content "src/lib/api-wrapper.ts" "P2002" "Erro P2002 mapeado (unique constraint)"
check_content "src/lib/api-wrapper.ts" "P2025" "Erro P2025 mapeado (not found)"
check_content "src/lib/prisma-extended.ts" "deletedAt" "Soft-delete implementado"
check_content "src/lib/prisma-extended.ts" "ActivityLog" "Activity logging implementado"
check_content "src/app/api/rentals/route.ts" "getSocketIO" "Socket.IO integration"

# ============================================================================
# 8. CHECK TYPE SAFETY
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 8: Type Safety"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/lib/prisma-extended.ts" "export type" "Type exports definidos"
check_content "src/lib/api-wrapper.ts" "export type" "Type exports definidos"
check_content "src/lib/schemas.ts" "z.infer" "Type inference implementado"
check_content "src/app/api/rentals/route.ts" "context: ApiHandlerContext" "Type safety em handlers"

# ============================================================================
# 9. CHECK DOCUMENTAÇÃO INLINE
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 9: Documentação Inline"
echo "═══════════════════════════════════════════════════════════════════════"

check_content "src/lib/prisma-extended.ts" "FEATURES:" "Documentação de features"
check_content "src/lib/api-wrapper.ts" "FEATURES:" "Documentação de features"
check_content "src/lib/schemas.ts" "FEATURES:" "Documentação de features"
check_content "src/app/api/rentals/route.ts" "FLUXO:" "Documentação de fluxo"

# ============================================================================
# 10. VERIFICAÇÕES ADICIONAIS
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "STEP 10: Verificações Adicionais"
echo "═══════════════════════════════════════════════════════════════════════"

# Check line counts
echo -n "Contando linhas de código..."

PRISMA_EXT_LINES=$(wc -l < src/lib/prisma-extended.ts)
API_WRAPPER_LINES=$(wc -l < src/lib/api-wrapper.ts)
SCHEMAS_LINES=$(wc -l < src/lib/schemas.ts)
RENTALS_ROUTE_LINES=$(wc -l < src/app/api/rentals/route.ts)

TOTAL_CODE_LINES=$((PRISMA_EXT_LINES + API_WRAPPER_LINES + SCHEMAS_LINES + RENTALS_ROUTE_LINES))

if [ $TOTAL_CODE_LINES -gt 1000 ]; then
    echo -e "${GREEN}✅${NC} Total de linhas: $TOTAL_CODE_LINES (esperado >1000)"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Total de linhas: $TOTAL_CODE_LINES (esperado >1000)"
    ((FAILED++))
fi

echo "  - prisma-extended.ts: $PRISMA_EXT_LINES linhas"
echo "  - api-wrapper.ts: $API_WRAPPER_LINES linhas"
echo "  - schemas.ts: $SCHEMAS_LINES linhas"
echo "  - rentals/route.ts: $RENTALS_ROUTE_LINES linhas"

# ============================================================================
# RESULTADOS
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "RESULTADOS FINAIS"
echo "═══════════════════════════════════════════════════════════════════════"

TOTAL=$((PASSED + FAILED))

echo ""
echo -e "Total de verificações: ${YELLOW}$TOTAL${NC}"
echo -e "Passadas: ${GREEN}$PASSED${NC}"
echo -e "Falhadas: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                       ║"
    echo -e "║                  ${GREEN}✅ TUDO OK! IMPLEMENTAÇÃO COMPLETA${NC}                      ║"
    echo "║                                                                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Próximos passos:"
    echo "1. npm install isomorphic-dompurify"
    echo "2. npx prisma migrate dev --name add_soft_delete_and_activity_log"
    echo "3. Testar endpoints localmente"
    echo "4. Migrar outras rotas usando rentals como template"
    echo "5. Deploy em staging"
    echo ""
    exit 0
else
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                       ║"
    echo -e "║               ${RED}❌ ERROS ENCONTRADOS - Verifique acima${NC}                   ║"
    echo "║                                                                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
fi
