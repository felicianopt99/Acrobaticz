#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY SSH - Acrobaticz para 192.168.1.119
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configurações
SSH_USER="feliciano"
SSH_HOST="192.168.1.119"
SSH_TARGET="$SSH_USER@$SSH_HOST"
REMOTE_PATH="/home/feliciano/acrobaticz"
LOCAL_DIR="$(pwd)"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ 🚀 DEPLOY SSH - ACROBATICZ            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Servidor:${NC} $SSH_TARGET"
echo -e "${YELLOW}📁 Caminho remoto:${NC} $REMOTE_PATH"
echo ""

# Step 1: Verificar .next
echo -e "${BLUE}[1/5]${NC} Verificando build..."
if [ ! -d ".next" ]; then
  echo -e "${RED}❌ Erro: .next não encontrado. Execute npm run build primeiro.${NC}"
  exit 1
fi
BUILD_SIZE=$(du -sh .next | cut -f1)
echo -e "${GREEN}✅ Build pronto ($BUILD_SIZE)${NC}"
echo ""

# Step 2: Criar arquivo comprimido
echo -e "${BLUE}[2/5]${NC} Criando arquivo de deploy..."
ARCHIVE="acrobaticz-build-$(date +%Y%m%d-%H%M%S).tar.gz"
TEMP_DIR=$(mktemp -d)

mkdir -p "$TEMP_DIR/app/prisma"
cp -r .next "$TEMP_DIR/app/"
cp -r public "$TEMP_DIR/app/" 2>/dev/null || true
cp prisma/schema.prisma "$TEMP_DIR/app/prisma/" || true
cp -r prisma/migrations "$TEMP_DIR/app/prisma/" 2>/dev/null || true
cp package.json "$TEMP_DIR/app/"
cp package-lock.json "$TEMP_DIR/app/" 2>/dev/null || true
cp docker-compose.yml "$TEMP_DIR/app/" || true
cp .env "$TEMP_DIR/app/" 2>/dev/null || true

cd "$TEMP_DIR"
tar -czf "$ARCHIVE" app/
ARCHIVE_SIZE=$(du -sh "$ARCHIVE" | cut -f1)
echo -e "${GREEN}✅ Arquivo criado: $ARCHIVE ($ARCHIVE_SIZE)${NC}"
echo ""

# Step 3: Upload
echo -e "${BLUE}[3/5]${NC} Enviando para servidor..."
scp -o ConnectTimeout=10 "$ARCHIVE" "$SSH_TARGET:~/acrobaticz/" || {
  echo -e "${RED}❌ Erro ao enviar arquivo${NC}"
  exit 1
}
echo -e "${GREEN}✅ Arquivo enviado${NC}"
echo ""

# Step 4: Extrair e deploy
echo -e "${BLUE}[4/5]${NC} Extraindo e iniciando deploy..."
ssh "$SSH_TARGET" "cd $REMOTE_PATH && \
  tar -xzf $ARCHIVE && \
  cd app && \
  echo 'Instalando dependências...' && \
  npm install --production && \
  echo 'Iniciando containers...' && \
  docker-compose down 2>/dev/null || true && \
  docker-compose up -d && \
  echo 'Aguardando inicialização...' && \
  sleep 5 && \
  echo 'Deploy concluído!'" || {
  echo -e "${RED}❌ Erro durante deploy${NC}"
  exit 1
}
echo -e "${GREEN}✅ Deploy executado${NC}"
echo ""

# Step 5: Verificar status
echo -e "${BLUE}[5/5]${NC} Verificando status..."
ssh "$SSH_TARGET" "cd $REMOTE_PATH/app && \
  echo 'Containers:' && \
  docker-compose ps && \
  echo '' && \
  echo 'Health check:' && \
  curl -s http://localhost:3000/api/health | head -c 100 && \
  echo ''" || {
  echo -e "${YELLOW}⚠ Aviso: Alguns containers podem ainda estar iniciando${NC}"
}

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ ✅ DEPLOY CONCLUÍDO COM SUCESSO!      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo -e "  1. Aguardar 30-60 segundos para seeding completo"
echo -e "  2. Acessar: https://acrobaticz.duckdns.org"
echo -e "  3. Logar: admin@acrobaticz.com / admin123"
echo -e "  4. Regenerar DuckDNS Token (ver DEPLOY_READY_SUMMARY.md)"
echo ""
echo -e "${YELLOW}Ver logs:${NC}"
echo -e "  ssh $SSH_TARGET 'cd $REMOTE_PATH/app && docker-compose logs -f app'"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

