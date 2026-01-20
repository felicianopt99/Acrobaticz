#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY VIA SSH - BUILD LOCAL (Otimizado para servidor com pouca RAM)
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Este script:
#   1. Faz build completo LOCALMENTE
#   2. Comprime apenas os ficheiros necessários (.next, public, etc)
#   3. Envia via SSH para servidor
#   4. Extrai e inicia no servidor (SEM build remote)
#
# Uso:
#   ./deploy-ssh-local-build.sh user@host:/path/to/app [--skip-build] [--dry-run]
#
# Exemplo:
#   ./deploy-ssh-local-build.sh deploy@prod.example.com:/app/acrobaticz
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Argumentos
SSH_TARGET="${1:-}"
SKIP_BUILD="${2:-}"
DRY_RUN="${3:-}"

# Validação
if [[ -z "$SSH_TARGET" ]]; then
    echo -e "${RED}❌ Erro: SSH target não fornecido${NC}"
    echo ""
    echo "Uso: $0 user@host:/path/to/app [--skip-build] [--dry-run]"
    echo ""
    echo "Exemplo:"
    echo "  $0 deploy@prod.example.com:/app/acrobaticz"
    exit 1
fi

# Parse SSH target
SSH_USER_HOST=$(echo "$SSH_TARGET" | cut -d: -f1)
REMOTE_PATH=$(echo "$SSH_TARGET" | cut -d: -f2)

if [[ -z "$REMOTE_PATH" ]]; then
    echo -e "${RED}❌ Erro: Caminho remoto não especificado${NC}"
    echo "Formato esperado: user@host:/path/to/app"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 DEPLOY SSH - BUILD LOCAL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📍 Destino:${NC} $SSH_TARGET"
echo -e "${YELLOW}👤 Utilizador:${NC} $SSH_USER_HOST"
echo -e "${YELLOW}📁 Caminho remoto:${NC} $REMOTE_PATH"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1️⃣ BUILD LOCAL
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [[ "$SKIP_BUILD" != "--skip-build" ]]; then
    echo -e "${BLUE}Step 1/4:${NC} Build local..."
    echo -e "${YELLOW}→ npm run build${NC}"
    
    npm run build
    
    echo -e "${GREEN}✅ Build completo!${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️ Skipping build (--skip-build)${NC}"
    echo ""
fi

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2️⃣ CRIAR ARQUIVO DEPLOY
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 2/4:${NC} Preparando arquivo de deploy..."

DEPLOY_FILE="acrobaticz-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
TEMP_DIR=$(mktemp -d)

# Criar estrutura temporária
mkdir -p "$TEMP_DIR/app"

# Copiar ficheiros essenciais
echo -e "${YELLOW}→ Copiando .next/ (standalone)${NC}"
cp -r .next "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ .next não encontrado"

echo -e "${YELLOW}→ Copiando public/${NC}"
cp -r public "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ public não encontrado"

echo -e "${YELLOW}→ Copiando prisma/migrations/${NC}"
cp -r prisma/migrations "$TEMP_DIR/app/prisma/" 2>/dev/null || mkdir -p "$TEMP_DIR/app/prisma"

echo -e "${YELLOW}→ Copiando node_modules (apenas essencial)${NC}"
cp -r node_modules "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ node_modules não encontrado"

echo -e "${YELLOW}→ Copiando ficheiros raiz${NC}"
cp package.json "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ package.json não encontrado"
cp package-lock.json "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ package-lock.json não encontrado"
cp .env.production "$TEMP_DIR/app/.env.production" 2>/dev/null || echo "  ⚠️ .env.production não encontrado (criar no servidor)"
cp next.config.ts "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ next.config.ts não encontrado"
cp tsconfig.json "$TEMP_DIR/app/" 2>/dev/null || echo "  ⚠️ tsconfig.json não encontrado"
cp prisma/schema.prisma "$TEMP_DIR/app/prisma/" 2>/dev/null || echo "  ⚠️ schema.prisma não encontrado"

# Criar arquivo
echo -e "${YELLOW}→ Comprimindo... (pode levar 1-2 min)${NC}"
cd "$TEMP_DIR"
tar -czf "$DEPLOY_FILE" app/ 2>/dev/null

# Mover para diretório atual
mv "$DEPLOY_FILE" - > "/tmp/$DEPLOY_FILE"
cd - > /dev/null

DEPLOY_SIZE=$(du -h "/tmp/$DEPLOY_FILE" | cut -f1)
echo -e "${GREEN}✅ Arquivo criado: /tmp/$DEPLOY_FILE ($DEPLOY_SIZE)${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3️⃣ ENVIAR VIA SSH
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 3/4:${NC} Enviando via SSH..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    echo -e "${YELLOW}DRY RUN - Não será enviado${NC}"
    echo -e "${YELLOW}→ rsync -avz --delete /tmp/$DEPLOY_FILE $SSH_USER_HOST:$REMOTE_PATH/${NC}"
else
    echo -e "${YELLOW}→ rsync -avz /tmp/$DEPLOY_FILE $SSH_USER_HOST:$REMOTE_PATH/${NC}"
    rsync -avz "/tmp/$DEPLOY_FILE" "$SSH_USER_HOST:$REMOTE_PATH/" || {
        echo -e "${RED}❌ Erro ao enviar arquivo${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Arquivo enviado!${NC}"
fi
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4️⃣ EXTRAIR E INICIAR NO SERVIDOR
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 4/4:${NC} Iniciando no servidor..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    echo -e "${YELLOW}DRY RUN - Comandos remotos:${NC}"
    echo ""
    echo "ssh $SSH_USER_HOST << 'EOF'"
    echo "cd $REMOTE_PATH"
    echo "tar -xzf $DEPLOY_FILE"
    echo "cd app"
    echo "npm install --production"
    echo "npm run db:migrate"
    echo "npm run start"
    echo "EOF"
else
    ssh "$SSH_USER_HOST" << EOF
cd "$REMOTE_PATH"
echo "📂 Extraindo arquivo..."
tar -xzf "$DEPLOY_FILE"
cd app
echo "📦 Instalando dependências de produção..."
npm install --production
echo "🗄️ Aplicando migrações..."
npm run db:migrate || echo "⚠️ Migrações já aplicadas"
echo "🚀 Iniciando aplicação..."
npm run start
EOF
    
    echo -e "${GREEN}✅ Deploy completado!${NC}"
fi

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🧹 LIMPEZA
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

rm -rf "$TEMP_DIR"
rm -f "/tmp/$DEPLOY_FILE"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy finalizado!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📊 Resumo:${NC}"
echo "  • Build: Local ✅"
echo "  • Tamanho: $DEPLOY_SIZE"
echo "  • Destino: $SSH_TARGET"
echo "  • Modo: $([ "$DRY_RUN" == "--dry-run" ] && echo "DRY RUN" || echo "ATIVO")"
echo ""
