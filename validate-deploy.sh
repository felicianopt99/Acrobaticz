#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 PRÉ-DEPLOY VALIDATION - Acrobaticz
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Valida todos os requisitos antes de fazer deploy
# - Verifica Node.js, npm, Docker, SSH
# - Testa conectividade SSH
# - Valida variáveis de ambiente
# - Testa DuckDNS token
#
# USO:
#   chmod +x validate-deploy.sh
#   ./validate-deploy.sh user@host.com --duckdns-domain=seu-dominio --duckdns-token=token
#
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# ============================================================
# CORES & FORMATAÇÃO
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'
CHECK='✅'
CROSS='❌'
WARN='⚠️'
INFO='ℹ️'

# ============================================================
# FUNÇÕES
# ============================================================

pass() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

fail() {
    echo -e "${RED}${CROSS}${NC} $1"
}

warn() {
    echo -e "${YELLOW}${WARN}${NC} $1"
}

info() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ============================================================
# VALIDAÇÃO BÁSICA
# ============================================================

SSH_HOST="${1:-}"
DUCKDNS_DOMAIN=""
DUCKDNS_TOKEN=""
ERRORS=0
WARNINGS=0

if [[ -z "$SSH_HOST" ]]; then
    echo -e "${RED}❌ SSH host não fornecido${NC}"
    echo "Uso: $0 user@host [--duckdns-domain=domain --duckdns-token=token]"
    exit 1
fi

# Parse argumentos
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --duckdns-domain=*)
            DUCKDNS_DOMAIN="${1#*=}"
            shift
            ;;
        --duckdns-token=*)
            DUCKDNS_TOKEN="${1#*=}"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# ============================================================
# 1️⃣ VERIFICAÇÃO LOCAL
# ============================================================

print_header "🔍 VALIDAÇÃO LOCAL"

echo "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    if [[ $NODE_VERSION == v20* ]] || [[ $NODE_VERSION == v21* ]] || [[ $NODE_VERSION == v22* ]]; then
        pass "Node.js $NODE_VERSION"
    else
        warn "Node.js $NODE_VERSION (recomendado v20+)"
        ((WARNINGS++))
    fi
else
    fail "Node.js não instalado"
    ((ERRORS++))
fi

echo "Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    pass "npm $NPM_VERSION"
else
    fail "npm não instalado"
    ((ERRORS++))
fi

echo "Verificando Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,$//')
    pass "Docker $DOCKER_VERSION"
else
    fail "Docker não instalado"
    ((ERRORS++))
fi

echo "Verificando Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | sed 's/,$//')
    if [[ $COMPOSE_VERSION == 2* ]]; then
        pass "Docker Compose $COMPOSE_VERSION"
    else
        warn "Docker Compose $COMPOSE_VERSION (recomendado v2+)"
        ((WARNINGS++))
    fi
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    pass "Docker Compose (integrado)"
else
    fail "Docker Compose não instalado"
    ((ERRORS++))
fi

echo "Verificando SSH..."
if command -v ssh &> /dev/null; then
    pass "SSH cliente disponível"
else
    fail "SSH cliente não instalado"
    ((ERRORS++))
fi

echo "Verificando Git..."
if command -v git &> /dev/null; then
    pass "Git disponível"
else
    warn "Git não encontrado (opcional)"
    ((WARNINGS++))
fi

echo "Verificando espaço em disco..."
DISK_FREE=$(df -h . | tail -1 | awk '{print $4}' | sed 's/[A-Z]$//')
if (( $(echo "$DISK_FREE > 5" | bc -l) )); then
    pass "Espaço disponível: ${DISK_FREE}GB"
else
    fail "Espaço em disco insuficiente (mínimo 5GB)"
    ((ERRORS++))
fi

# ============================================================
# 2️⃣ VERIFICAÇÃO DO PROJETO
# ============================================================

print_header "📁 VERIFICAÇÃO DO PROJETO"

echo "Verificando package.json..."
if [[ -f "package.json" ]]; then
    pass "package.json encontrado"
else
    fail "package.json não encontrado"
    ((ERRORS++))
fi

echo "Verificando Dockerfile..."
if [[ -f "Dockerfile" ]]; then
    pass "Dockerfile encontrado"
else
    fail "Dockerfile não encontrado"
    ((ERRORS++))
fi

echo "Verificando docker-compose.yml..."
if [[ -f "docker-compose.yml" ]]; then
    pass "docker-compose.yml encontrado"
else
    fail "docker-compose.yml não encontrado"
    ((ERRORS++))
fi

echo "Verificando prisma..."
if [[ -f "prisma/schema.prisma" ]]; then
    pass "prisma/schema.prisma encontrado"
else
    warn "prisma/schema.prisma não encontrado"
    ((WARNINGS++))
fi

echo "Verificando next.config.ts..."
if [[ -f "next.config.ts" ]]; then
    pass "next.config.ts encontrado"
else
    fail "next.config.ts não encontrado"
    ((ERRORS++))
fi

# ============================================================
# 3️⃣ VERIFICAÇÃO SSH
# ============================================================

print_header "🔐 VERIFICAÇÃO SSH"

echo "Testando conectividade SSH com $SSH_HOST..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "$SSH_HOST" "echo OK" &> /dev/null; then
    pass "SSH conectado com sucesso"
    
    echo "Verificando ferramentas no servidor..."
    if ssh "$SSH_HOST" "command -v docker" &> /dev/null; then
        pass "Docker instalado no servidor"
    else
        fail "Docker não instalado no servidor"
        ((ERRORS++))
    fi
    
    if ssh "$SSH_HOST" "command -v docker-compose" &> /dev/null; then
        pass "Docker Compose instalado no servidor"
    else
        fail "Docker Compose não instalado no servidor"
        ((ERRORS++))
    fi
    
    echo "Verificando espaço em disco no servidor..."
    REMOTE_DISK=$(ssh "$SSH_HOST" "df -h / | tail -1 | awk '{print \$4}'" 2>/dev/null | sed 's/[A-Z]$//' || echo "0")
    if (( $(echo "$REMOTE_DISK > 5" | bc -l) )); then
        pass "Espaço no servidor: ${REMOTE_DISK}GB"
    else
        fail "Espaço em disco insuficiente no servidor"
        ((ERRORS++))
    fi
else
    fail "Não foi possível conectar via SSH"
    fail "Verifique: ssh-keygen, ssh-copy-id, e firewall"
    ((ERRORS++))
fi

# ============================================================
# 4️⃣ VERIFICAÇÃO DUCKDNS
# ============================================================

if [[ -n "$DUCKDNS_DOMAIN" && -n "$DUCKDNS_TOKEN" ]]; then
    print_header "🌐 VERIFICAÇÃO DUCKDNS"
    
    echo "Testando DuckDNS domain..."
    if curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | grep -q "OK"; then
        pass "DuckDNS token válido"
    else
        fail "DuckDNS token inválido ou domínio indisponível"
        ((ERRORS++))
    fi
    
    echo "Verificando resolução DNS..."
    if nslookup "${DUCKDNS_DOMAIN}.duckdns.org" &> /dev/null; then
        pass "Domínio ${DUCKDNS_DOMAIN}.duckdns.org resolve"
    else
        warn "Domínio ${DUCKDNS_DOMAIN}.duckdns.org não resolve ainda (normal na primeira vez)"
        ((WARNINGS++))
    fi
else
    print_header "🌐 DUCKDNS"
    info "DuckDNS não fornecido (será configurado mais tarde)"
fi

# ============================================================
# 5️⃣ VERIFICAÇÃO BUILD
# ============================================================

print_header "🏗️  TESTE DE BUILD LOCAL"

echo "Testando npm install..."
if npm list > /dev/null 2>&1; then
    pass "Dependências npm válidas"
else
    info "Instalando dependências..."
    if npm install --prefer-offline --no-audit > /dev/null 2>&1; then
        pass "Dependências instaladas"
    else
        warn "npm install pode falhar (verifique depois)"
        ((WARNINGS++))
    fi
fi

echo "Testando typecheck..."
if npm run typecheck > /dev/null 2>&1; then
    pass "TypeScript typecheck OK"
else
    fail "TypeScript typecheck falhou"
    ((ERRORS++))
fi

echo "Testando build (DRY-RUN)..."
echo -e "${YELLOW}→${NC} Isto pode levar 2-5 minutos na primeira vez..."
if npm run build > /dev/null 2>&1; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "N/A")
    pass "Build OK (tamanho: $BUILD_SIZE)"
else
    fail "npm run build falhou"
    echo "  Verifique a saída acima para erros"
    ((ERRORS++))
fi

# ============================================================
# RESUMO FINAL
# ============================================================

print_header "📊 RESUMO FINAL"

echo -e "${CYAN}┌────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│${NC} Erros: ${RED}$ERRORS${NC}                                      "
echo -e "${CYAN}│${NC} Avisos: ${YELLOW}$WARNINGS${NC}                                    "
echo -e "${CYAN}└────────────────────────────────────────────────────────┘${NC}"
echo ""

if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✅ TUDO PRONTO PARA DEPLOY!${NC}"
    echo ""
    echo "Próximo passo:"
    echo "  ./deploy-complete-duckdns-minio.sh \\"
    echo "    $SSH_HOST:/app/acrobaticz \\"
    if [[ -n "$DUCKDNS_DOMAIN" ]]; then
        echo "    --duckdns-domain=$DUCKDNS_DOMAIN \\"
        echo "    --duckdns-token=$DUCKDNS_TOKEN"
    else
        echo "    --duckdns-domain=seu-dominio \\"
        echo "    --duckdns-token=seu-token"
    fi
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}❌ FALHAS DETECTADAS${NC}"
    echo ""
    echo "Corrija os erros acima e tente novamente"
    echo ""
    exit 1
fi
