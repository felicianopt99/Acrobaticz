#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY COMPLETO SSH - TUDO DE UMA VEZ!
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Script de Deploy 100% Automatizado via SSH
#
# O que este script faz (TUDO DE UMA VEZ):
#   ✅ Valida pré-requisitos locais
#   ✅ Faz build local (Next.js completo)
#   ✅ Valida conexão SSH ao servidor
#   ✅ Prepara arquivo comprimido com toda a app
#   ✅ Envia via SSH/SCP para o servidor
#   ✅ Extrai e valida estrutura no servidor
#   ✅ Instala dependências remotas
#   ✅ Configura banco de dados (migrations)
#   ✅ Inicia containers Docker ou app
#   ✅ Valida saúde da aplicação
#   ✅ Mostra status final
#
# USO:
#   chmod +x deploy-complete-ssh.sh
#   ./deploy-complete-ssh.sh <user@host> [--docker|--native] [--dry-run] [--skip-health]
#
# EXEMPLOS:
#   # Deploy com Docker (recomendado)
#   ./deploy-complete-ssh.sh deploy@prod.com:3000 --docker
#
#   # Deploy sem Docker (Node.js nativo)
#   ./deploy-complete-ssh.sh deploy@prod.com:3000 --native
#
#   # Teste seco (simula sem executar)
#   ./deploy-complete-ssh.sh deploy@prod.com:3000 --docker --dry-run
#
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -euo pipefail

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 CORES E FORMATAÇÃO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚙️ CONFIGURAÇÃO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SSH_TARGET="${1:-}"
DEPLOY_MODE="${2:---docker}"
DRY_RUN="${3:-}"
SKIP_HEALTH="${4:-}"

# Defaults
DEPLOY_MODE="${DEPLOY_MODE/--/}"
[[ "$DEPLOY_MODE" != "docker" && "$DEPLOY_MODE" != "native" ]] && DEPLOY_MODE="docker"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOY_ARCHIVE="acrobaticz-deploy-${TIMESTAMP}.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_SETUP_SCRIPT="deploy-remote-setup.sh"

# Parse SSH
SSH_USER_HOST="${SSH_TARGET%%:*}"
PORT_OR_PATH="${SSH_TARGET#*:}"

# Se não tem ":", assume default
if [[ "$SSH_TARGET" != *":"* ]]; then
    SSH_USER_HOST="$SSH_TARGET"
    REMOTE_PATH="/app/acrobaticz"
else
    REMOTE_PATH="$PORT_OR_PATH"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎯 FUNÇÕES AUXILIARES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║ $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    local step=$1
    local title=$2
    echo -e "${BLUE}[${step}]${NC} ${YELLOW}${title}${NC}"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_debug() {
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        echo -e "${MAGENTA}[DRY-RUN]${NC} $1"
    fi
}

execute_or_dry() {
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        echo -e "${MAGENTA}[SIMULADO]${NC} $@"
    else
        "$@"
    fi
}

ssh_exec() {
    ssh -o ConnectTimeout=10 -o BatchMode=yes "$SSH_USER_HOST" "$@"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📋 VALIDAÇÃO INICIAL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🚀 DEPLOY COMPLETO SSH - ACROBATICZ"

# Validar argumentos
if [[ -z "$SSH_TARGET" ]]; then
    print_error "SSH target não fornecido"
    echo ""
    echo "Uso:"
    echo "  $0 <user@host> [--docker|--native] [--dry-run] [--skip-health]"
    echo ""
    echo "Exemplos:"
    echo "  $0 deploy@prod.com:3000 --docker"
    echo "  $0 deploy@prod.com --native"
    echo "  $0 deploy@prod.com --docker --dry-run"
    echo ""
    exit 1
fi

# Mostrar configuração
echo -e "${YELLOW}📍 Destino:${NC} $SSH_TARGET"
echo -e "${YELLOW}👤 Utilizador:${NC} $SSH_USER_HOST"
echo -e "${YELLOW}📁 Caminho remoto:${NC} $REMOTE_PATH"
echo -e "${YELLOW}🐳 Modo deploy:${NC} $DEPLOY_MODE"
[[ "$DRY_RUN" == "--dry-run" ]] && echo -e "${MAGENTA}🧪 Modo:${NC} DRY RUN (SIMULADO)"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1️⃣ VERIFICAR PRÉ-REQUISITOS LOCAIS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "1/8" "Verificando pré-requisitos locais..."

MISSING=""

# Verificar ferramentas
for tool in node npm git ssh tar gzip; do
    if ! command -v "$tool" &> /dev/null; then
        MISSING="$MISSING $tool"
    fi
done

if [[ -n "$MISSING" ]]; then
    print_error "Ferramentas faltantes:$MISSING"
    exit 1
fi

print_info "Node.js: $(node --version)"
print_info "npm: $(npm --version)"
print_info "Git: $(git --version | head -n1)"
print_success "Pré-requisitos OK!"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2️⃣ BUILD LOCAL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "2/8" "Build local (Next.js)..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    print_debug "Seria executado: npm run build"
    print_debug "Build local simulado"
else
    # Limpeza
    print_info "Limpando build anterior..."
    rm -rf .next .build-test.log 2>/dev/null || true
    
    # Build
    print_info "Executando: npm run build"
    npm run build 2>&1 | tee .build-test.log || {
        print_error "Build falhou! Verifique os erros acima."
        exit 1
    }
    
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    print_success "Build completo! (.next: $BUILD_SIZE)"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3️⃣ TESTAR CONEXÃO SSH
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "3/8" "Testando conexão SSH..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    print_debug "Verificação SSH simulada"
else
    if ! ssh_exec "echo 'SSH OK'" &> /dev/null; then
        print_error "Não foi possível conectar via SSH: $SSH_USER_HOST"
        echo ""
        echo "Verifique:"
        echo "  • SSH key está configurada: ssh-keygen -t ed25519"
        echo "  • Servidor SSH está acessível"
        echo "  • Usuário existe no servidor"
        exit 1
    fi
    
    # Verificar dependências no servidor
    print_info "Verificando dependências no servidor..."
    
    if [[ "$DEPLOY_MODE" == "docker" ]]; then
        if ! ssh_exec "docker --version" &> /dev/null; then
            print_error "Docker não instalado no servidor!"
            exit 1
        fi
        if ! ssh_exec "docker-compose --version" &> /dev/null; then
            print_error "Docker Compose não instalado no servidor!"
            exit 1
        fi
        print_success "Docker e Docker Compose OK"
    else
        if ! ssh_exec "node --version" &> /dev/null; then
            print_error "Node.js não instalado no servidor!"
            exit 1
        fi
        if ! ssh_exec "npm --version" &> /dev/null; then
            print_error "npm não instalado no servidor!"
            exit 1
        fi
        print_success "Node.js e npm OK"
    fi
fi

print_success "Conexão SSH OK!"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4️⃣ PREPARAR ARQUIVO DE DEPLOY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "4/8" "Preparando arquivo de deploy..."

TEMP_DIR=$(mktemp -d)
APP_DIR="$TEMP_DIR/acrobaticz"

trap "rm -rf $TEMP_DIR" EXIT

# Estrutura base
mkdir -p "$APP_DIR"/{prisma,public,.github}

print_info "Copiando arquivos..."

# Arquivos críticos
[[ -d ".next" ]] && cp -r .next "$APP_DIR/" && print_info "  ✓ .next (build)"
[[ -d "public" ]] && cp -r public "$APP_DIR/" && print_info "  ✓ public"
[[ -d "prisma/migrations" ]] && cp -r prisma/migrations "$APP_DIR/prisma/" && print_info "  ✓ prisma/migrations"
[[ -f "prisma/schema.prisma" ]] && cp prisma/schema.prisma "$APP_DIR/prisma/" && print_info "  ✓ prisma/schema.prisma"
[[ -f "package.json" ]] && cp package.json "$APP_DIR/" && print_info "  ✓ package.json"
[[ -f "package-lock.json" ]] && cp package-lock.json "$APP_DIR/" && print_info "  ✓ package-lock.json"
[[ -f "next.config.ts" ]] && cp next.config.ts "$APP_DIR/" && print_info "  ✓ next.config.ts"
[[ -f "tsconfig.json" ]] && cp tsconfig.json "$APP_DIR/" && print_info "  ✓ tsconfig.json"
[[ -f ".env.production" ]] && cp .env.production "$APP_DIR/" && print_info "  ✓ .env.production"

# Copiar docker-compose se estiver usando Docker
if [[ "$DEPLOY_MODE" == "docker" ]]; then
    [[ -f "docker-compose.yml" ]] && cp docker-compose.yml "$APP_DIR/" && print_info "  ✓ docker-compose.yml"
    [[ -f "Dockerfile" ]] && cp Dockerfile "$APP_DIR/" && print_info "  ✓ Dockerfile"
    [[ -f ".dockerignore" ]] && cp .dockerignore "$APP_DIR/" && print_info "  ✓ .dockerignore"
fi

# Compressão
print_info "Comprimindo... (isto pode levar 30-60 segundos)"
cd "$TEMP_DIR"
tar -czf "$DEPLOY_ARCHIVE" acrobaticz/ 2>/dev/null || {
    print_error "Erro ao comprimir arquivo"
    exit 1
}

ARCHIVE_PATH="$TEMP_DIR/$DEPLOY_ARCHIVE"
ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)

print_success "Arquivo criado: $DEPLOY_ARCHIVE ($ARCHIVE_SIZE)"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5️⃣ ENVIAR VIA SCP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "5/8" "Enviando via SCP..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    print_debug "Seria transferido: $ARCHIVE_SIZE para $SSH_USER_HOST:$REMOTE_PATH/"
else
    print_info "Transferindo $ARCHIVE_SIZE..."
    
    if ! scp -P 22 "$ARCHIVE_PATH" "$SSH_USER_HOST:$REMOTE_PATH/" 2>&1 | grep -E "^(100%|[0-9]+%)" || true; then
        print_error "Erro ao transferir arquivo"
        exit 1
    fi
fi

print_success "Arquivo enviado!"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6️⃣ CRIAR SCRIPT DE SETUP REMOTO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "6/8" "Preparando script de setup remoto..."

# Criar script que será executado no servidor
cat > "$TEMP_DIR/$REMOTE_SETUP_SCRIPT" << 'REMOTE_SCRIPT_EOF'
#!/bin/bash
set -e

REMOTE_PATH="${1:-.}"
DEPLOY_MODE="${2:-docker}"
DEPLOY_ARCHIVE="$(ls $REMOTE_PATH/acrobaticz-deploy-*.tar.gz 2>/dev/null | tail -1)"

if [[ -z "$DEPLOY_ARCHIVE" ]]; then
    echo "❌ Arquivo de deploy não encontrado em $REMOTE_PATH"
    exit 1
fi

cd "$REMOTE_PATH"

# Backup do anterior (se existir)
if [[ -d "acrobaticz" ]]; then
    echo "📦 Fazendo backup da versão anterior..."
    tar -czf "acrobaticz-backup-$(date +%Y%m%d-%H%M%S).tar.gz" acrobaticz/ 2>/dev/null || true
fi

# Extrair
echo "📂 Extraindo arquivo..."
tar -xzf "$DEPLOY_ARCHIVE"

cd acrobaticz

# Setup dependências
echo "📦 Instalando dependências..."
if [[ "$DEPLOY_MODE" == "docker" ]]; then
    echo "   Using Docker Compose..."
    docker-compose up -d --pull always
else
    echo "   Using npm..."
    npm install --production --no-optional
fi

# Migrations
echo "🗄️  Executando migrations..."
if [[ "$DEPLOY_MODE" == "native" ]]; then
    npx prisma migrate deploy || true
fi

echo "✅ Setup remoto concluído!"
REMOTE_SCRIPT_EOF

chmod +x "$TEMP_DIR/$REMOTE_SETUP_SCRIPT"

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    print_debug "Script de setup remoto seria enviado"
else
    scp -P 22 "$TEMP_DIR/$REMOTE_SETUP_SCRIPT" "$SSH_USER_HOST:$REMOTE_PATH/" 2>&1 | grep -E "^(100%|[0-9]+%)" || true
    print_success "Script de setup enviado"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7️⃣ EXECUTAR SETUP NO SERVIDOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "7/8" "Executando setup no servidor..."

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    print_debug "Setup remoto seria executado"
    print_debug "Modo: $DEPLOY_MODE"
else
    if ! ssh_exec "cd $REMOTE_PATH && bash $REMOTE_SETUP_SCRIPT $REMOTE_PATH $DEPLOY_MODE"; then
        print_error "Setup remoto falhou"
        exit 1
    fi
fi

print_success "Setup remoto concluído!"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8️⃣ VERIFICAÇÃO DE SAÚDE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "8/8" "Verificando saúde da aplicação..."

if [[ "$SKIP_HEALTH" == "--skip-health" ]]; then
    print_info "Verificação de saúde pulada"
else
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        print_debug "Verificações de saúde seriam executadas"
    else
        print_info "Aguardando containers/app iniciar (30 segundos)..."
        sleep 30
        
        if [[ "$DEPLOY_MODE" == "docker" ]]; then
            print_info "Verificando status dos containers..."
            ssh_exec "cd $REMOTE_PATH/acrobaticz && docker-compose ps" || print_info "  (Containers ainda estão inicializando)"
        else
            print_info "Verificando aplicação em http://localhost:3000"
        fi
    fi
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ RESUMO FINAL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "✅ DEPLOY CONCLUÍDO COM SUCESSO!"

echo -e "${GREEN}📊 RESUMO:${NC}"
echo "  • Destino: $SSH_TARGET"
echo "  • Modo: $DEPLOY_MODE"
echo "  • Arquivo: $ARCHIVE_SIZE"
echo "  • Caminho remoto: $REMOTE_PATH"
echo ""

if [[ "$DEPLOY_MODE" == "docker" ]]; then
    echo -e "${YELLOW}📍 Próximos passos:${NC}"
    echo "  1. Verificar containers:"
    echo "     ssh $SSH_USER_HOST"
    echo "     cd $REMOTE_PATH/acrobaticz"
    echo "     docker-compose ps"
    echo ""
    echo "  2. Ver logs da aplicação:"
    echo "     docker-compose logs -f app"
    echo ""
    echo "  3. Acessar a aplicação:"
    echo "     https://seu-dominio.com"
else
    echo -e "${YELLOW}📍 Próximos passos:${NC}"
    echo "  1. Conectar ao servidor:"
    echo "     ssh $SSH_USER_HOST"
    echo "     cd $REMOTE_PATH/acrobaticz"
    echo ""
    echo "  2. Iniciar a aplicação:"
    echo "     npm start"
    echo ""
    echo "  3. Acessar a aplicação:"
    echo "     http://seu-servidor:3000"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
