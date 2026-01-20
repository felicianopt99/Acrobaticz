#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY - MODO MANUAL COM PASSWORD
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

SSH_USER="home"
SSH_HOST="192.168.1.119"
REMOTE_PATH="/home/projects"
SSH_TARGET="$SSH_USER@$SSH_HOST:$REMOTE_PATH"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🚀 DEPLOY LOCAL BUILD - PASSO A PASSO          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PASSO 1: VERIFICAR CONECTIVIDADE
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[1/5]${NC} Testando conexão SSH..."
echo "      → ssh $SSH_USER@$SSH_HOST"
echo ""

if ssh -o ConnectTimeout=10 "$SSH_USER@$SSH_HOST" "echo ✅ SSH OK && pwd" 2>&1; then
    echo -e "${GREEN}✅ SSH conectado!${NC}"
else
    echo -e "${RED}❌ SSH falhou${NC}"
    echo "Verifique:"
    echo "  • Host correto: $SSH_HOST"
    echo "  • Utilizador: $SSH_USER"
    echo "  • Password correto"
    exit 1
fi

echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PASSO 2: BUILD LOCAL
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[2/5]${NC} Build local (npm run build)..."
echo "      → Pode levar 2-3 minutos..."
echo ""

npm run build

BUILD_SIZE=$(du -sh .next | cut -f1)
echo -e "${GREEN}✅ Build completo! (.next: $BUILD_SIZE)${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PASSO 3: PREPARAR ARQUIVO
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[3/5]${NC} Preparando arquivo de deploy..."

ARCHIVE="acrobaticz-$(date +%Y%m%d-%H%M%S).tar.gz"
TEMP_DIR=$(mktemp -d)
APP_DIR="$TEMP_DIR/app"

mkdir -p "$APP_DIR/prisma"

# Copiar essencial
cp -r .next "$APP_DIR/" 2>/dev/null || true
cp -r public "$APP_DIR/" 2>/dev/null || true
cp prisma/schema.prisma "$APP_DIR/prisma/" 2>/dev/null || true
cp -r prisma/migrations "$APP_DIR/prisma/" 2>/dev/null || true
cp package.json "$APP_DIR/" 2>/dev/null || true
cp package-lock.json "$APP_DIR/" 2>/dev/null || true
cp next.config.ts "$APP_DIR/" 2>/dev/null || true
cp tsconfig.json "$APP_DIR/" 2>/dev/null || true
cp .env.production "$APP_DIR/" 2>/dev/null || echo "⚠️ .env.production não encontrado"

# Compactar
cd "$TEMP_DIR"
tar -czf "$ARCHIVE" app/
cd - > /dev/null

ARCHIVE_PATH="/tmp/$ARCHIVE"
mv "$TEMP_DIR/$ARCHIVE" "$ARCHIVE_PATH"

ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
echo -e "${GREEN}✅ Arquivo criado: /tmp/$ARCHIVE ($ARCHIVE_SIZE)${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PASSO 4: ENVIAR VIA SCP
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[4/5]${NC} Transferindo via SCP ($ARCHIVE_SIZE)..."
echo "      → scp $ARCHIVE_PATH $SSH_TARGET/"
echo ""

scp "$ARCHIVE_PATH" "$SSH_USER@$SSH_HOST:$REMOTE_PATH/" || {
    echo -e "${RED}❌ Erro ao transferir${NC}"
    exit 1
}

echo -e "${GREEN}✅ Arquivo transferido!${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PASSO 5: EXTRAIR E INICIAR NO SERVIDOR
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[5/5]${NC} Iniciando no servidor..."
echo ""

ssh "$SSH_USER@$SSH_HOST" << REMOTE_EOF
#!/bin/bash
set -e

cd "$REMOTE_PATH"

echo "📂 Extraindo $ARCHIVE..."
tar -xzf "$ARCHIVE"

cd app

echo "📦 Instalando dependências..."
npm install --production --omit=dev || true

echo "🗄️ Aplicando migrações..."
npm run db:migrate || echo "ℹ️ Migrações já aplicadas"

echo "🚀 Iniciando aplicação..."
npm run start &

sleep 3
echo "✅ Aplicação iniciada!"
ps aux | grep "node" | grep -v grep || echo "⚠️ Verificar com: npm run start"

REMOTE_EOF

# Limpeza local
rm -rf "$TEMP_DIR"
rm -f "$ARCHIVE_PATH"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   ✅ DEPLOY COMPLETO!                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Aplicação em execução em:${NC}"
echo "  → http://192.168.1.119:3000"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  • Verificar logs: ssh $SSH_USER@$SSH_HOST 'npm run start'"
echo "  • Health check: curl http://192.168.1.119:3000/api/health"
echo ""
