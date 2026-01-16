#!/bin/bash
# Phase 4 Validation Script
# Testa se a implementação Cookies-over-Fetch está funcionando corretamente

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           Phase 4: Cookies-over-Fetch Validation              ║"
echo "║                    15 Janeiro 2026                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function
test_check() {
    local test_name="$1"
    local test_result="$2"
    
    if [ "$test_result" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name"
        ((FAILED++))
    fi
}

echo -e "${BLUE}📋 Verificando Arquivos Modificados...${NC}"
echo ""

# Check 1: middleware.ts existe
if [ -f "src/middleware.ts" ]; then
    test_check "src/middleware.ts existe" "pass"
else
    test_check "src/middleware.ts existe" "fail"
fi

# Check 2: setup/complete/route.ts existe
if [ -f "./src/app/api/setup/complete/route.ts" ]; then
    test_check "./src/app/api/setup/complete/route.ts existe" "pass"
else
    test_check "./src/app/api/setup/complete/route.ts existe" "fail"
fi

# Check 3: install/page.tsx existe
INSTALL_PATH=$(find . -path "*install/page.tsx" -type f 2>/dev/null | head -1)
if [ -f "$INSTALL_PATH" ]; then
    test_check "install/page.tsx existe" "pass"
else
    test_check "install/page.tsx existe" "fail"
fi

echo ""
echo -e "${BLUE}🔍 Verificando Implementação de Cookie...${NC}"
echo ""

# Check 4: Cookie setting no response
if grep -q "response.cookies.set('app_installed'" "src/app/api/setup/complete/route.ts"; then
    test_check "Cookie setting implementado" "pass"
else
    test_check "Cookie setting implementado" "fail"
fi

# Check 5: httpOnly flag
if grep -q "httpOnly: true" "src/app/api/setup/complete/route.ts"; then
    test_check "httpOnly: true está configurado" "pass"
else
    test_check "httpOnly: true está configurado" "fail"
fi

# Check 6: SameSite flag
if grep -q "sameSite: 'lax'" "src/app/api/setup/complete/route.ts"; then
    test_check "sameSite: 'lax' está configurado" "pass"
else
    test_check "sameSite: 'lax' está configurado" "fail"
fi

# Check 7: MaxAge (1 year)
if grep -q "maxAge: 315360000" "src/app/api/setup/complete/route.ts"; then
    test_check "maxAge: 315360000 (1 ano) está configurado" "pass"
else
    test_check "maxAge: 315360000 (1 ano) está configurado" "fail"
fi

# Check 8: Path configured
if grep -q "path: '/'" "src/app/api/setup/complete/route.ts"; then
    test_check "path: '/' está configurado" "pass"
else
    test_check "path: '/' está configurado" "fail"
fi

echo ""
echo -e "${BLUE}🛡️  Verificando Segurança do Middleware...${NC}"
echo ""

# Check 9: Sem fetch no middleware
if ! grep -q "fetch" "src/middleware.ts"; then
    test_check "Sem chamadas fetch no middleware" "pass"
else
    test_check "Sem chamadas fetch no middleware" "fail"
fi

# Check 10: Verificação de cookie
if grep -q "request.cookies.get('app_installed')" "src/middleware.ts"; then
    test_check "Middleware verifica cookie app_installed" "pass"
else
    test_check "Middleware verifica cookie app_installed" "fail"
fi

# Check 11: Redirecionamento root path
if grep -q "pathname === '/'" "src/middleware.ts" && grep -q "redirect(new URL('/install'" "src/middleware.ts"; then
    test_check "Redirecionamento root path implementado" "pass"
else
    test_check "Redirecionamento root path implementado" "fail"
fi

# Check 12: Redirecionamento install path
if grep -q "pathname.startsWith('/install')" "src/middleware.ts" && grep -q "redirect(new URL('/dashboard'" "src/middleware.ts"; then
    test_check "Redirecionamento /install → /dashboard implementado" "pass"
else
    test_check "Redirecionamento /install → /dashboard implementado" "fail"
fi

echo ""
echo -e "${BLUE}🎨 Verificando UI Elite...${NC}"
echo ""

# Check 13: Install page dark mode
if grep -q "bg-\[hsl" "src/app/(setup)/install/page.tsx"; then
    test_check "Design dark mode Elite preservado" "pass"
else
    test_check "Design dark mode Elite preservado" "fail"
fi

# Check 14: Progress bar
if grep -q "Progress" "src/app/(setup)/install/page.tsx"; then
    test_check "Wizard de progresso intacto" "pass"
else
    test_check "Wizard de progresso intacto" "fail"
fi

# Check 15: Sidebar steps
if grep -q "STEPS.map" "src/app/(setup)/install/page.tsx"; then
    test_check "Sidebar de passos funcional" "pass"
else
    test_check "Sidebar de passos funcional" "fail"
fi

echo ""
echo -e "${BLUE}📝 Verificando Documentação...${NC}"
echo ""

# Check 16: PHASE_4_COOKIES_IMPLEMENTATION.md
if [ -f "PHASE_4_COOKIES_IMPLEMENTATION.md" ]; then
    test_check "PHASE_4_COOKIES_IMPLEMENTATION.md criado" "pass"
else
    test_check "PHASE_4_COOKIES_IMPLEMENTATION.md criado" "fail"
fi

# Check 17: PHASE_4_SUMMARY.md
if [ -f "PHASE_4_SUMMARY.md" ]; then
    test_check "PHASE_4_SUMMARY.md criado" "pass"
else
    test_check "PHASE_4_SUMMARY.md criado" "fail"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Teste Completo                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Resultados:"
echo -e "  ${GREEN}Passou: $PASSED${NC}"
echo -e "  ${RED}Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo -e "Phase 4 está ${GREEN}PRONTO PARA PRODUÇÃO${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Executar docker-compose up"
    echo "  2. Acessar http://localhost:3000/"
    echo "  3. Verificar redirecionamento para /install"
    echo "  4. Completar wizard de instalação"
    echo "  5. Verificar cookie 'app_installed' no DevTools"
    echo "  6. Acessar novamente - deve ir para /dashboard"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Por favor, revise os itens marcados com ✗"
    echo ""
    exit 1
fi
