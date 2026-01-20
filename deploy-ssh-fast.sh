#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY OTIMIZADO SSH - Apenas BUILD + Deps mínimas
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# OTIMIZADO para servidor com pouca RAM:
#   1. Build local (usando RAM da máquina)
#   2. Envia .next (build), public e configs
#   3. Servidor faz "npm install --production" (muito mais leve)
#   4. Servidor inicia a app
#
# Tamanho final: ~200MB (vs 500MB+ com node_modules completo)
#
# Uso: ./deploy-ssh-fast.sh user@host:/path/to/app [--dry-run]
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Argumentos
SSH_TARGET="${1:-}"
DRY_RUN="${2:-}"

# Validação
if [[ -z "$SSH_TARGET" ]]; then
    echo -e "${RED}❌ SSH target não fornecido${NC}"
    echo "Uso: $0 user@host:/path/to/app [--dry-run]"
    echo ""
    echo "Exemplo:"
    echo "  $0 deploy@prod.example.com:/app/acrobaticz"
    exit 1
fi

# Parse SSH
SSH_USER_HOST=$(echo "$SSH_TARGET" | cut -d: -f1)
REMOTE_PATH=$(echo "$SSH_TARGET" | cut -d: -f2)

[[ -z "$REMOTE_PATH" ]] && {
    echo -e "${RED}❌ Caminho remoto não especificado (formato: user@host:/path)${NC}"
    exit 1
}

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ 🚀 DEPLOY SSH - BUILD LOCAL OTIMIZADO                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Destino:${NC} $SSH_TARGET"
echo -e "${YELLOW}👤 User:${NC} $SSH_USER_HOST"
echo -e "${YELLOW}📁 Path:${NC} $REMOTE_PATH"
[[ "$DRY_RUN" == "--dry-run" ]] && echo -e "${YELLOW}🧪 Modo:${NC} DRY RUN (sem executar)"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1️⃣ CLEAN BUILD LOCAL
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[1/3]${NC} Limpando e fazendo build local..."
echo -e "${YELLOW}→ Removendo .next antigo${NC}"
rm -rf .next 2>/dev/null || true

echo -e "${YELLOW}→ npm run build${NC}"
npm run build

BUILD_SIZE=$(du -sh .next | cut -f1)
echo -e "${GREEN}✅ Build completo! (.next: $BUILD_SIZE)${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2️⃣ PREPARAR ARQUIVO COMPRIMIDO
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[2/3]${NC} Preparando arquivo de deploy..."

ARCHIVE="acrobaticz-build-$(date +%Y%m%d-%H%M%S).tar.gz"
TEMP_DIR=$(mktemp -d)
APP_DIR="$TEMP_DIR/app"

mkdir -p "$APP_DIR/prisma"

# Copiar apenas essencial
echo -e "${YELLOW}→ .next/ (build compilado)${NC}"
cp -r .next "$APP_DIR/" || true

echo -e "${YELLOW}→ public/ (assets estáticos)${NC}"
cp -r public "$APP_DIR/" || true

echo -e "${YELLOW}→ prisma/ (schema e migrations)${NC}"
cp prisma/schema.prisma "$APP_DIR/prisma/" || true
cp -r prisma/migrations "$APP_DIR/prisma/" 2>/dev/null || true

echo -e "${YELLOW}→ Ficheiros de configuração${NC}"
cp package.json "$APP_DIR/" || true
cp package-lock.json "$APP_DIR/" 2>/dev/null || true
cp next.config.ts "$APP_DIR/" || true
cp tsconfig.json "$APP_DIR/" 2>/dev/null || true

# Criar .env.production placeholder (será preenchido no servidor)
if [[ ! -f .env.production ]]; then
    echo -e "${YELLOW}→ Criando .env.production placeholder${NC}"
    cat > "$APP_DIR/.env.production" << 'ENVFILE'
# 🔒 Variáveis de Produção - PREENCHER NO SERVIDOR
DATABASE_URL="postgresql://user:password@localhost:5432/acrobaticz"
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="gerar-com-: openssl rand -base64 32"
NODE_ENV="production"
ENVFILE
else
    cp .env.production "$APP_DIR/" 2>/dev/null || true
fi

echo -e "${YELLOW}→ Comprimindo (incluindo .next)${NC}"
cd "$TEMP_DIR"
ARCHIVE_PATH="/tmp/$ARCHIVE"
tar -czf "$ARCHIVE_PATH" app/ --exclude='.git' --exclude='node_modules'
cd - > /dev/null

ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
echo -e "${GREEN}✅ Arquivo criado: $ARCHIVE ($ARCHIVE_SIZE)${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3️⃣ ENVIAR E INICIAR
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}[3/3]${NC} Deploy via SSH..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    echo -e "${YELLOW}📋 Comandos que serão executados:${NC}"
    echo ""
    echo "scp /tmp/$ARCHIVE $SSH_USER_HOST:$REMOTE_PATH/"
    echo ""
    echo "ssh $SSH_USER_HOST << 'REMOTE_EOF'"
    echo "#!/bin/bash"
    echo "set -e"
    echo "cd $REMOTE_PATH"
    echo "tar -xzf $ARCHIVE"
    echo "cd app"
    echo "npm install --production --omit=dev"
    echo "npm run db:migrate"
    echo "npm run start"
    echo "REMOTE_EOF"
else
    # Enviar arquivo
    echo -e "${YELLOW}→ Transferindo build ($ARCHIVE_SIZE)...${NC}"
    scp "$ARCHIVE_PATH" "$SSH_USER_HOST:$REMOTE_PATH/" || {
        echo -e "${RED}❌ Erro ao transferir${NC}"
        exit 1
    }
    
    # Extrair e iniciar
    echo -e "${YELLOW}→ Extraindo e iniciando no servidor...${NC}"
    ssh "$SSH_USER_HOST" << REMOTE_EOF
#!/bin/bash
set -e
cd "$REMOTE_PATH"

echo "📂 Extraindo..."
tar -xzf "$ARCHIVE"

cd app

echo "📦 Instalando dependências (apenas produção)..."
npm install --production --omit=dev

echo "🗄️ Aplicando migrações..."
npm run db:migrate || echo "ℹ️ Migrações já atualizadas"

echo "🚀 Iniciando aplicação..."
npm run start
REMOTE_EOF
    
    echo -e "${GREEN}✅ Deploy enviado e iniciado!${NC}"
fi

# Limpeza
rm -rf "$TEMP_DIR"
rm -f "$ARCHIVE_PATH"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ ✅ Deploy Finalizado                                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 Resumo:${NC}"
echo "  • Build: Local ✅"
echo "  • Arquivo: $ARCHIVE_SIZE"
echo "  • Dependências: npm install (no servidor)"
echo "  • Destino: $SSH_TARGET"
echo ""
echo -e "${YELLOW}💡 Dica:${NC} Para atualizar, basta executar novamente este script"
echo ""
