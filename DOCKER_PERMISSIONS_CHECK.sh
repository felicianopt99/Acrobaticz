#!/bin/bash
# ============================================================
# Docker Permissions & Setup Verification
# Verifica se tudo está configurado para usar Docker
# ============================================================

set -e

echo "🔍 Verificando configuração do Docker..."
echo "============================================================"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Verificar Docker instalado
echo -e "${BLUE}[1/8]${NC} Verificando instalação do Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker instalado: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker NÃO está instalado"
    ERRORS=$((ERRORS+1))
fi

# 2. Verificar Docker daemon rodando
echo -e "${BLUE}[2/8]${NC} Verificando se Docker daemon está rodando..."
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon está rodando"
else
    echo -e "${RED}✗${NC} Docker daemon NÃO está respondendo"
    ERRORS=$((ERRORS+1))
fi

# 3. Verificar usuário no grupo docker
echo -e "${BLUE}[3/8]${NC} Verificando permissões do usuário..."
CURRENT_USER=$(whoami)
if id -nG "$CURRENT_USER" | grep -qw docker; then
    echo -e "${GREEN}✓${NC} Usuário '$CURRENT_USER' está no grupo docker"
else
    echo -e "${RED}✗${NC} Usuário '$CURRENT_USER' NÃO está no grupo docker"
    echo -e "${YELLOW}   Para corrigir, execute: sudo usermod -aG docker $CURRENT_USER${NC}"
    ERRORS=$((ERRORS+1))
fi

# 4. Verificar Docker Compose
echo -e "${BLUE}[4/8]${NC} Verificando Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose instalado: $COMPOSE_VERSION"
else
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker Compose V2 disponível (docker compose)"
    else
        echo -e "${RED}✗${NC} Docker Compose NÃO encontrado"
        ERRORS=$((ERRORS+1))
    fi
fi

# 5. Verificar espaço em disco
echo -e "${BLUE}[5/8]${NC} Verificando espaço em disco..."
AVAILABLE=$(df /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz 2>/dev/null | awk 'NR==2 {print $4}')
if [ -n "$AVAILABLE" ] && [ "$AVAILABLE" -gt 5242880 ]; then  # > 5GB
    AVAILABLE_GB=$((AVAILABLE / 1024 / 1024))
    echo -e "${GREEN}✓${NC} Espaço disponível: ${AVAILABLE_GB}GB"
else
    echo -e "${RED}✗${NC} Espaço insuficiente (< 5GB necessários)"
    ERRORS=$((ERRORS+1))
fi

# 6. Verificar permissões da pasta
echo -e "${BLUE}[6/8]${NC} Verificando permissões da pasta do projeto..."
PROJECT_PATH="/media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz"
if [ -w "$PROJECT_PATH" ]; then
    echo -e "${GREEN}✓${NC} Pasta do projeto tem permissões de escrita"
else
    echo -e "${RED}✗${NC} Pasta do projeto NÃO tem permissões de escrita"
    ERRORS=$((ERRORS+1))
fi

# 7. Verificar arquivos docker-compose
echo -e "${BLUE}[7/8]${NC} Verificando arquivos Docker Compose..."
FILES_OK=true
for file in docker-compose.yml docker-compose.dev.yml Dockerfile Dockerfile.dev; do
    if [ -f "$PROJECT_PATH/$file" ]; then
        echo -e "${GREEN}  ✓${NC} $file encontrado"
    else
        echo -e "${YELLOW}  ⚠${NC} $file não encontrado (opcional)"
    fi
done

# 8. Verificar .env
echo -e "${BLUE}[8/8]${NC} Verificando arquivo .env..."
if [ -f "$PROJECT_PATH/.env" ]; then
    echo -e "${GREEN}✓${NC} .env encontrado"
else
    echo -e "${YELLOW}⚠${NC} .env NÃO encontrado - criando a partir de .env.dev..."
    if [ -f "$PROJECT_PATH/.env.dev" ]; then
        cp "$PROJECT_PATH/.env.dev" "$PROJECT_PATH/.env"
        echo -e "${GREEN}✓${NC} .env criado com sucesso"
    else
        echo -e "${YELLOW}⚠${NC} .env.dev também não encontrado"
    fi
fi

# Resumo
echo ""
echo "============================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Tudo está pronto! Você pode usar Docker sem problemas.${NC}"
    echo ""
    echo "Para iniciar o projeto com Docker, execute:"
    echo -e "  ${BLUE}docker-compose -f docker-compose.dev.yml up -d${NC}"
    exit 0
else
    echo -e "${RED}✗ Encontrados $ERRORS problema(s) que precisam ser corrigidos.${NC}"
    exit 1
fi
