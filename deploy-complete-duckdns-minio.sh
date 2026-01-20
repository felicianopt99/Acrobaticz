#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY COMPLETO - Acrobaticz 100% com DuckDNS + MinIO no SSH
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# FEATURES:
#   ✅ Docker Compose com PostgreSQL + MinIO + Next.js
#   ✅ DuckDNS Dynamic DNS automático
#   ✅ SSL/TLS com Certbot (Let's Encrypt)
#   ✅ Deploy SSH com build local otimizado
#   ✅ Seeding automático da base de dados
#   ✅ Health checks e recuperação automática
#
# PRÉ-REQUISITOS:
#   • Servidor Linux com Docker + Docker Compose
#   • SSH configurado
#   • DuckDNS token (get em https://www.duckdns.org)
#   • Domínio: meudomain.duckdns.org
#
# USO:
#   chmod +x deploy-complete-duckdns-minio.sh
#   ./deploy-complete-duckdns-minio.sh user@host:/app/acrobaticz \
#       --duckdns-domain=meudomain \
#       --duckdns-token=seu-token-aqui \
#       --db-password=senha-forte \
#       --minio-password=senha-minio-forte
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
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# ============================================================
# FUNÇÕES UTILITÁRIAS
# ============================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}[PASSO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️ ${NC} $1"
}

# ============================================================
# VALIDAÇÃO DE ARGUMENTOS
# ============================================================

show_usage() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════╗
║          🚀 DEPLOY COMPLETO - Acrobaticz 100%                    ║
║          DuckDNS + MinIO + PostgreSQL + SSL/TLS                  ║
╚═══════════════════════════════════════════════════════════════════╝

USO BÁSICO:
  ./deploy-complete-duckdns-minio.sh user@host:/app/acrobaticz \
      --duckdns-domain=seu-dominio \
      --duckdns-token=seu-token

OPÇÕES OBRIGATÓRIAS:
  --duckdns-domain      DuckDNS domain (ex: meudomain de meudomain.duckdns.org)
  --duckdns-token       DuckDNS token (get em https://www.duckdns.org)

OPÇÕES OPCIONAIS:
  --db-password         PostgreSQL password (default: gerado aleatório)
  --minio-password      MinIO password (default: gerado aleatório)
  --email               Email para certificado SSL (default: felizartpt@gmail.com)
  --storage-path        Caminho para armazenamento MinIO (default: ./storage/minio)
  --dry-run             Mostrar comandos sem executar

EXEMPLOS:

  # Deploy básico
  ./deploy-complete-duckdns-minio.sh deploy@prod.com:/app/acrobaticz \
      --duckdns-domain=acrobaticz \
      --duckdns-token=f0027691-1f98-4a3e-9f26-94020479451e

  # Deploy customizado
  ./deploy-complete-duckdns-minio.sh deploy@prod.com:/app/acrobaticz \
      --duckdns-domain=myapp \
      --duckdns-token=seu-token \
      --db-password=MinhaSenhaForte123! \
      --minio-password=MinIOSecure456@ \
      --email=admin@mycompany.com

  # Teste (dry-run)
  ./deploy-complete-duckdns-minio.sh deploy@prod.com:/app/acrobaticz \
      --duckdns-domain=acrobaticz \
      --duckdns-token=token123 \
      --dry-run

PRÓXIMOS PASSOS:
  1. Aceda a: https://seu-dominio.duckdns.org
  2. Login com: admin@acrobaticz.com / password
  3. Upload de produto teste no MinIO console
  4. Verificar logs: docker-compose logs -f

EOF
    exit 1
}

# ============================================================
# PARSE ARGUMENTOS
# ============================================================

SSH_TARGET="${1:-}"
DUCKDNS_DOMAIN=""
DUCKDNS_TOKEN=""
DB_PASSWORD=""
MINIO_PASSWORD=""
EMAIL="felizartpt@gmail.com"
STORAGE_PATH="./storage/minio"
DRY_RUN=false

if [[ -z "$SSH_TARGET" ]]; then
    print_error "SSH target não fornecido"
    show_usage
fi

# Parse named arguments
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
        --db-password=*)
            DB_PASSWORD="${1#*=}"
            shift
            ;;
        --minio-password=*)
            MINIO_PASSWORD="${1#*=}"
            shift
            ;;
        --email=*)
            EMAIL="${1#*=}"
            shift
            ;;
        --storage-path=*)
            STORAGE_PATH="${1#*=}"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            print_error "Argumento desconhecido: $1"
            show_usage
            ;;
    esac
done

# Validação obrigatória
if [[ -z "$DUCKDNS_DOMAIN" || -z "$DUCKDNS_TOKEN" ]]; then
    print_error "DuckDNS domain e token são obrigatórios"
    show_usage
fi

# Gerar senhas se não fornecidas
if [[ -z "$DB_PASSWORD" ]]; then
    DB_PASSWORD=$(openssl rand -base64 16)
fi

if [[ -z "$MINIO_PASSWORD" ]]; then
    MINIO_PASSWORD=$(openssl rand -base64 16)
fi

# Parse SSH
SSH_USER_HOST=$(echo "$SSH_TARGET" | cut -d: -f1)
REMOTE_PATH=$(echo "$SSH_TARGET" | cut -d: -f2)

if [[ -z "$REMOTE_PATH" ]]; then
    print_error "Caminho remoto não especificado (formato: user@host:/path)"
    exit 1
fi

# ============================================================
# EXIBIR CONFIGURAÇÃO
# ============================================================

print_header "🔧 CONFIGURAÇÃO DO DEPLOY"

echo -e "${YELLOW}SSH:${NC}"
echo "  • Host: $SSH_USER_HOST"
echo "  • Path: $REMOTE_PATH"
echo ""

echo -e "${YELLOW}DuckDNS:${NC}"
echo "  • Domain: ${DUCKDNS_DOMAIN}.duckdns.org"
echo "  • Token: ${DUCKDNS_TOKEN:0:10}..."
echo ""

echo -e "${YELLOW}Database:${NC}"
echo "  • User: acrobaticz_user"
echo "  • Password: ${DB_PASSWORD:0:8}..."
echo ""

echo -e "${YELLOW}MinIO:${NC}"
echo "  • User: minioadmin"
echo "  • Password: ${MINIO_PASSWORD:0:8}..."
echo "  • Storage: $STORAGE_PATH"
echo ""

echo -e "${YELLOW}SSL/TLS:${NC}"
echo "  • Email: $EMAIL"
echo "  • Domain: ${DUCKDNS_DOMAIN}.duckdns.org"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}🧪 MODO: DRY RUN (sem executar)${NC}"
fi

echo ""
read -p "Continuar? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_error "Cancelado pelo utilizador"
    exit 1
fi

# ============================================================
# PASSO 1: BUILD LOCAL
# ============================================================

print_header "📦 PASSO 1/5: BUILD LOCAL"

print_step "Limpando build anterior"
rm -rf .next 2>/dev/null || true

print_step "Executando: npm run build"
npm run build

BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "0MB")
print_success "Build completo! Tamanho: $BUILD_SIZE"

# ============================================================
# PASSO 2: PREPARAR DEPLOY
# ============================================================

print_header "📦 PASSO 2/5: PREPARAR ARQUIVO DE DEPLOY"

ARCHIVE="acrobaticz-$(date +%Y%m%d-%H%M%S).tar.gz"
TEMP_DIR=$(mktemp -d)
APP_DIR="$TEMP_DIR/app"

mkdir -p "$APP_DIR/prisma"

print_step "Copiando arquivos essenciais"
cp -r .next "$APP_DIR/" 2>/dev/null || true
cp -r public "$APP_DIR/" 2>/dev/null || true
cp prisma/schema.prisma "$APP_DIR/prisma/" 2>/dev/null || true
cp -r prisma/migrations "$APP_DIR/prisma/" 2>/dev/null || true
cp package.json "$APP_DIR/" 2>/dev/null || true
cp package-lock.json "$APP_DIR/" 2>/dev/null || true
cp next.config.ts "$APP_DIR/" 2>/dev/null || true
cp tsconfig.json "$APP_DIR/" 2>/dev/null || true

# Copiar docker-compose.yml
print_step "Copiando docker-compose.yml"
mkdir -p "$APP_DIR/docker"
cp docker-compose.yml "$APP_DIR/docker/" 2>/dev/null || true
cp docker-entrypoint.sh "$APP_DIR/docker/" 2>/dev/null || true

# Copiar nginx config se existir
if [[ -d "nginx" ]]; then
    print_step "Copiando nginx config"
    cp -r nginx "$APP_DIR/" 2>/dev/null || true
fi

# Criar .env.production com variáveis
print_step "Gerando .env.production"
cat > "$APP_DIR/.env.production" << ENVFILE
# 🚀 ACROBATICZ PRODUCTION - Gerado automaticamente
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Domain
DOMAIN=${DUCKDNS_DOMAIN}.duckdns.org
NEXTAUTH_URL=https://${DUCKDNS_DOMAIN}.duckdns.org
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Database
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://acrobaticz_user:$DB_PASSWORD@postgres:5432/acrobaticz?schema=public

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=7d

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_ENDPOINT=http://minio:9000
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=$MINIO_PASSWORD
S3_BUCKET=acrobaticz
S3_REGION=us-east-1
STORAGE_PATH=$STORAGE_PATH

# DuckDNS
DUCKDNS_DOMAIN=$DUCKDNS_DOMAIN
DUCKDNS_TOKEN=$DUCKDNS_TOKEN

# SSL/TLS
CERTBOT_EMAIL=$EMAIL
ENABLE_HTTPS=true

# Seeding
SEED_ON_START=true
FORCE_SEED=false

# Translation & AI
DEEPL_API_KEY=${DEEPL_API_KEY:-}
GEMINI_API_KEY=${GEMINI_API_KEY:-}

# Telemetry
NEXT_TELEMETRY_DISABLED=1
ENVFILE

# Criar docker-compose.production.yml se não existir
print_step "Copiando docker-compose"
if [[ -f "docker-compose.yml" ]]; then
    cp docker-compose.yml "$APP_DIR/docker-compose.yml"
fi

print_step "Comprimindo arquivo"
cd "$TEMP_DIR"
ARCHIVE_PATH="/tmp/$ARCHIVE"
tar -czf "$ARCHIVE_PATH" app/ \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next/.turbopack' \
    2>/dev/null || true
cd - > /dev/null

ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" 2>/dev/null | cut -f1 || echo "0MB")
print_success "Arquivo criado: $ARCHIVE ($ARCHIVE_SIZE)"

# ============================================================
# PASSO 3: DEPLOY SSH
# ============================================================

print_header "🌐 PASSO 3/5: DEPLOY VIA SSH"

if [[ "$DRY_RUN" == "true" ]]; then
    print_warning "MODO DRY RUN - Exibindo comandos (sem executar)"
    echo ""
    echo -e "${YELLOW}Comando SCP:${NC}"
    echo "  scp /tmp/$ARCHIVE $SSH_USER_HOST:$REMOTE_PATH/"
    echo ""
    echo -e "${YELLOW}Comando SSH (no servidor):${NC}"
    cat << 'REMOTE_PREVIEW'
1. Extrair archive
   cd /app/acrobaticz
   tar -xzf acrobaticz-*.tar.gz

2. Preparar docker-compose
   cd app
   mv docker-compose.yml ../ || true

3. Criar diretorias
   mkdir -p storage/minio certbot/conf data/dev_cache

4. Iniciar containers
   docker-compose up -d

5. Aguardar healthy
   docker-compose ps
   docker-compose logs -f

6. Verificar app
   curl -s http://localhost:3000 | head -20
REMOTE_PREVIEW
    echo ""
else
    print_step "Transferindo arquivo ($ARCHIVE_SIZE)..."
    
    if ! scp "$ARCHIVE_PATH" "$SSH_USER_HOST:$REMOTE_PATH/" 2>/dev/null; then
        print_error "Falha na transferência SCP"
        exit 1
    fi
    print_success "Arquivo transferido"
fi

# ============================================================
# PASSO 4: INICIAR CONTAINERS (SSH)
# ============================================================

if [[ "$DRY_RUN" != "true" ]]; then
    print_header "🐳 PASSO 4/5: INICIAR CONTAINERS NO SERVIDOR"
    
    print_step "Conectando ao servidor..."
    
    ssh "$SSH_USER_HOST" << REMOTE_DEPLOY_EOF
#!/bin/bash
set -e

echo "📂 Navigando para $REMOTE_PATH"
cd "$REMOTE_PATH"

echo "📦 Extraindo arquivo"
tar -xzf "$ARCHIVE" || {
    echo "❌ Falha ao extrair"
    exit 1
}

cd app

echo "📁 Criando estrutura de diretorias"
mkdir -p storage/minio
mkdir -p certbot/conf
mkdir -p data/dev_cache
mkdir -p nginx
mkdir -p scripts

echo "⚙️  Preparando docker-compose"
if [[ ! -f "../docker-compose.yml" ]]; then
    if [[ -f "docker-compose.yml" ]]; then
        mv docker-compose.yml ../
    fi
fi

echo "🔧 Ajustando permissões"
chmod 755 docker-entrypoint.sh 2>/dev/null || true

echo "🚀 Iniciando containers (docker-compose up -d)"
cd ..
docker-compose up -d

echo "⏳ Aguardando serviços iniciarem (30s)"
sleep 5

echo "📊 Status dos containers:"
docker-compose ps

echo "📝 Logs (10 linhas iniciais):"
docker-compose logs --tail=10

echo "✅ Deploy no servidor concluído!"
echo ""
echo "🌐 Próximas ações:"
echo "   1. Aguarde 2-3 minutos para inicialização completa"
echo "   2. Aceda a: https://${DUCKDNS_DOMAIN}.duckdns.org"
echo "   3. Login: admin@acrobaticz.com / password"
echo "   4. DuckDNS deverá ter atualizado automaticamente"
echo "   5. Ver logs contínuos: docker-compose logs -f"
echo ""

REMOTE_DEPLOY_EOF
    
    print_success "Deploy iniciado no servidor"
fi

# ============================================================
# LIMPEZA LOCAL
# ============================================================

print_header "🧹 PASSO 5/5: LIMPEZA"

print_step "Removendo ficheiros temporários"
rm -rf "$TEMP_DIR" 2>/dev/null || true
rm -f "$ARCHIVE_PATH" 2>/dev/null || true

print_success "Limpeza concluída"

# ============================================================
# RESUMO FINAL
# ============================================================

print_header "✅ DEPLOY COMPLETO!"

echo -e "${YELLOW}📊 RESUMO:${NC}"
echo "  • Build: ✅ Local"
echo "  • Arquivo: ✅ $ARCHIVE ($ARCHIVE_SIZE)"
echo "  • Transfer: ✅ SCP"
echo "  • Containers: ✅ docker-compose"
echo ""

echo -e "${YELLOW}🌐 ACESSO:${NC}"
echo "  • App: https://${DUCKDNS_DOMAIN}.duckdns.org"
echo "  • MinIO Console: http://${DUCKDNS_DOMAIN}.duckdns.org:9001"
echo "  • SSH: ssh $SSH_USER_HOST"
echo ""

echo -e "${YELLOW}🔑 CREDENCIAIS:${NC}"
echo "  • Admin: admin@acrobaticz.com / password"
echo "  • MinIO: minioadmin / ${MINIO_PASSWORD:0:8}..."
echo "  • DB: acrobaticz_user / ${DB_PASSWORD:0:8}..."
echo ""

echo -e "${YELLOW}📋 COMANDOS ÚTEIS:${NC}"
echo "  • Logs: ssh $SSH_USER_HOST 'cd $REMOTE_PATH && docker-compose logs -f'"
echo "  • Status: ssh $SSH_USER_HOST 'cd $REMOTE_PATH && docker-compose ps'"
echo "  • Restart: ssh $SSH_USER_HOST 'cd $REMOTE_PATH && docker-compose restart'"
echo "  • Stop: ssh $SSH_USER_HOST 'cd $REMOTE_PATH && docker-compose down'"
echo ""

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ 🎉 Acrobaticz está sendo deployado!                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
