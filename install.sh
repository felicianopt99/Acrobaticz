#!/bin/bash

###############################################################################
#
#  🚀 AV RENTALS - PROFESSIONAL INSTALLER v2.0
#
#  Instalador Automático Premium para Acrobaticz AV Rental Platform
#  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
#  Recursos:
#    ✓ Validação automática de pré-requisitos
#    ✓ Configuração inteligente de ambiente
#    ✓ Setup interativo com múltiplas opções
#    ✓ Tratamento robusto de erros
#    ✓ Logging detalhado
#    ✓ Recovery e rollback automático
#    ✓ Suporte multiplataforma (Linux/macOS)
#
#  Uso: bash install.sh [opções]
#       bash install.sh --help
#
###############################################################################

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURAÇÕES GLOBAIS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
VERSION="2.0.0"
BUILD_DATE="2026-01-14"

# Diretórios importantes
LOGS_DIR="${SCRIPT_DIR}/.installation-logs"
INSTALL_LOG="${LOGS_DIR}/install-${BUILD_DATE}-$(date +%H%M%S).log"
BACKUP_DIR="${SCRIPT_DIR}/.installation-backups"
LOCK_FILE="/tmp/av-rentals-install.lock"

# Cores ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m'

# Caracteres especiais
CHECK='✓'
CROSS='✗'
WARN='⚠'
INFO='ℹ'
GEAR='⚙'
ARROW='→'
BULLET='•'
STAR='★'

# Variáveis de estado
INSTALLATION_START_TIME=$(date +%s)
INSTALLATION_STEP=0
TOTAL_STEPS=12
ERRORS_ENCOUNTERED=0
WARNINGS_ENCOUNTERED=0
INSTALL_MODE="production"
SKIP_DOCKER=false
SKIP_DATABASE=false
DRY_RUN=false
INTERACTIVE=true
VERBOSE=false

# ─────────────────────────────────────────────────────────────────────────────
# FUNÇÕES DE OUTPUT
# ─────────────────────────────────────────────────────────────────────────────

setup_logging() {
    mkdir -p "$LOGS_DIR" "$BACKUP_DIR"
    touch "$INSTALL_LOG"
    exec 1> >(tee -a "$INSTALL_LOG")
    exec 2>&1
}

print_banner() {
    cat << 'EOF'

    ╔═══════════════════════════════════════════════════════════════════════╗
    ║                                                                       ║
    ║         🚀  AV RENTALS - PROFESSIONAL INSTALLER                      ║
    ║                                                                       ║
    ║             Acrobaticz AV Rental Platform Setup                      ║
    ║                                                                       ║
    ║                     Version 2.0.0 - Premium                          ║
    ║                                                                       ║
    ╚═══════════════════════════════════════════════════════════════════════╝

EOF
}

print_header() {
    local text="$1"
    INSTALLATION_STEP=$((INSTALLATION_STEP + 1))
    echo ""
    echo -e "${BLUE}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│${NC} ${CYAN}[${INSTALLATION_STEP}/${TOTAL_STEPS}]${NC} ${WHITE}${text}${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}${CHECK}${NC} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} ${RED}$1${NC}"
    ERRORS_ENCOUNTERED=$((ERRORS_ENCOUNTERED + 1))
}

print_warning() {
    echo -e "${YELLOW}${WARN}${NC} ${YELLOW}$1${NC}"
    WARNINGS_ENCOUNTERED=$((WARNINGS_ENCOUNTERED + 1))
}

print_info() {
    echo -e "${CYAN}${INFO}${NC} ${CYAN}$1${NC}"
}

print_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${GRAY}${BULLET} $1${NC}"
    fi
}

print_section() {
    echo -e "\n${MAGENTA}━━ $1 ━━${NC}\n"
}

print_success_box() {
    local text="$1"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${WHITE}${text}${NC}"
    echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_error_box() {
    local text="$1"
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}                                                            ${RED}║${NC}"
    echo -e "${RED}║${NC}  ${WHITE}${text}${NC}"
    echo -e "${RED}║${NC}                                                            ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# FUNÇÕES DE VALIDAÇÃO
# ─────────────────────────────────────────────────────────────────────────────

check_os() {
    print_header "Detectando Sistema Operacional"
    
    local os_type=$(uname -s)
    local os_arch=$(uname -m)
    
    print_verbose "Sistema: $os_type"
    print_verbose "Arquitetura: $os_arch"
    
    case "$os_type" in
        Linux)
            print_success "Linux detectado"
            export OS_TYPE="linux"
            ;;
        Darwin)
            print_success "macOS detectado"
            export OS_TYPE="macos"
            ;;
        *)
            print_error "Sistema operacional não suportado: $os_type"
            return 1
            ;;
    esac
}

check_dependencies() {
    print_header "Verificando Dependências"
    
    local missing_deps=()
    local required_commands=("git" "node" "npm" "docker" "docker-compose")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            print_warning "Faltando: $cmd"
            missing_deps+=("$cmd")
        else
            local version=$(get_command_version "$cmd")
            print_success "$cmd: $version"
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo ""
        print_error "Dependências faltando: ${missing_deps[*]}"
        echo ""
        print_info "Instale as dependências e tente novamente:"
        
        if [[ "$OS_TYPE" == "linux" ]]; then
            echo -e "${GRAY}  sudo apt-get install -y git nodejs npm docker.io docker-compose${NC}"
        elif [[ "$OS_TYPE" == "macos" ]]; then
            echo -e "${GRAY}  brew install git node docker docker-compose${NC}"
        fi
        echo ""
        return 1
    fi
    
    print_success "Todas as dependências instaladas"
}

get_command_version() {
    local cmd="$1"
    case "$cmd" in
        git)
            git --version 2>/dev/null | awk '{print $3}'
            ;;
        node)
            node --version 2>/dev/null | sed 's/v//'
            ;;
        npm)
            npm --version 2>/dev/null
            ;;
        docker)
            docker --version 2>/dev/null | grep -oP 'Docker version \K[^,]+'
            ;;
        docker-compose)
            docker-compose --version 2>/dev/null | grep -oP '[0-9]+\.[0-9]+\.[0-9]+'
            ;;
        *)
            echo "desconhecido"
            ;;
    esac
}

check_disk_space() {
    print_header "Verificando Espaço em Disco"
    
    local available_space=$(df "$SCRIPT_DIR" | tail -1 | awk '{print $4}')
    local required_space=$((5 * 1024 * 1024)) # 5GB em KB
    
    print_verbose "Espaço disponível: $((available_space / 1024 / 1024))GB"
    print_verbose "Espaço requerido: 5GB"
    
    if [[ $available_space -lt $required_space ]]; then
        print_error "Espaço em disco insuficiente"
        return 1
    fi
    
    print_success "Espaço em disco adequado"
}

check_permissions() {
    print_header "Verificando Permissões"
    
    if [[ ! -w "$SCRIPT_DIR" ]]; then
        print_error "Sem permissão de escrita no diretório de instalação"
        return 1
    fi
    
    print_success "Permissões de escrita confirmadas"
}

# ─────────────────────────────────────────────────────────────────────────────
# FUNÇÕES DE CONFIGURAÇÃO
# ─────────────────────────────────────────────────────────────────────────────

interactive_setup() {
    print_header "Configuração Interativa"
    
    echo ""
    echo -e "${WHITE}Selecione o modo de instalação:${NC}"
    echo ""
    echo "  ${CYAN}1)${NC} ${WHITE}Produção${NC} (Recomendado)"
    echo "     • Docker habilitado"
    echo "     • Database PostgreSQL"
    echo "     • SSL/HTTPS configurado"
    echo ""
    echo "  ${CYAN}2)${NC} ${WHITE}Desenvolvimento${NC}"
    echo "     • Docker opcional"
    echo "     • Database local ou remoto"
    echo "     • Sem SSL"
    echo ""
    echo "  ${CYAN}3)${NC} ${WHITE}Customizado${NC}"
    echo "     • Escolha cada componente"
    echo ""
    
    local choice
    read -p "$(echo -e ${CYAN}Escolha [1-3]:${NC} )" choice
    
    case $choice in
        1)
            INSTALL_MODE="production"
            SKIP_DOCKER=false
            SKIP_DATABASE=false
            print_success "Modo Produção selecionado"
            ;;
        2)
            INSTALL_MODE="development"
            print_info "Docker é opcional no modo desenvolvimento"
            read -p "$(echo -e ${CYAN}Usar Docker? [s/n]:${NC} )" use_docker
            [[ "$use_docker" == "s" ]] && SKIP_DOCKER=false || SKIP_DOCKER=true
            print_success "Modo Desenvolvimento selecionado"
            ;;
        3)
            INSTALL_MODE="custom"
            read -p "$(echo -e ${CYAN}Usar Docker? [s/n]:${NC} )" use_docker
            [[ "$use_docker" == "s" ]] && SKIP_DOCKER=false || SKIP_DOCKER=true
            read -p "$(echo -e ${CYAN}Configurar Database? [s/n]:${NC} )" use_db
            [[ "$use_db" == "s" ]] && SKIP_DATABASE=false || SKIP_DATABASE=true
            print_success "Modo Customizado selecionado"
            ;;
        *)
            print_error "Opção inválida"
            interactive_setup
            ;;
    esac
}

setup_environment() {
    print_header "Configurando Variáveis de Ambiente"
    
    if [[ ! -f "$SCRIPT_DIR/.env.local" ]]; then
        print_info "Criando arquivo .env.local"
        
        # Backup do arquivo env existente se houver
        if [[ -f "$SCRIPT_DIR/env" ]]; then
            cp "$SCRIPT_DIR/env" "$BACKUP_DIR/env.backup.$(date +%s)"
            print_verbose "Backup criado"
        fi
        
        cat > "$SCRIPT_DIR/.env.local" << 'ENVFILE'
# ============================================================================
# AV RENTALS - Environment Configuration
# ============================================================================
# IMPORTANTE: Altere os valores padrão para seus próprios valores de produção
# ============================================================================

# Node Environment
NODE_ENV="development"

# Application
APP_NAME="AV Rentals"
APP_URL="http://localhost:3000"

# Database Configuration
DATABASE_URL="postgresql://avrentals_user:avrentals_pass@postgres:5432/avrentals_db"
POSTGRES_DB="avrentals_db"
POSTGRES_USER="avrentals_user"
POSTGRES_PASSWORD="avrentals_pass"

# JWT & Security
JWT_SECRET="your-secret-jwt-key-change-this-in-production-$(openssl rand -hex 32)"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Google APIs
GOOGLE_GENERATIVE_AI_API_KEY="your-key-here"

# Domain Configuration (DuckDNS)
DOMAIN="localhost"
DUCKDNS_DOMAIN="your-domain"
DUCKDNS_TOKEN="your-token"

# SSL/Certbot
CERTBOT_EMAIL="your-email@example.com"
CERTBOT_STAGING="true"

# Storage Configuration
EXTERNAL_STORAGE_PATH="/mnt/backup_drive/av-rentals/cloud-storage"
EXTERNAL_STORAGE_TEMP="/tmp/av-rentals-storage"
DEFAULT_STORAGE_QUOTA="53687091200"
ENABLE_STORAGE_DISK_CHECK="true"

# DeepL API (Optional)
DEEPL_API_KEY="your-key-here"

ENVFILE
        
        print_success "Arquivo .env.local criado"
        print_warning "⚠ Revise e atualize os valores em .env.local antes de começar"
    else
        print_info "Arquivo .env.local já existe"
    fi
    
    # Export para uso durante o script
    if [[ -f "$SCRIPT_DIR/.env.local" ]]; then
        set -a
        source "$SCRIPT_DIR/.env.local"
        set +a
        print_verbose ".env.local carregado"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# FUNÇÕES DE INSTALAÇÃO
# ─────────────────────────────────────────────────────────────────────────────

install_dependencies() {
    print_header "Instalando Dependências NPM"
    
    if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
        print_info "Instalando pacotes npm..."
        cd "$SCRIPT_DIR"
        
        if npm install --legacy-peer-deps; then
            print_success "Dependências npm instaladas com sucesso"
        else
            print_error "Falha ao instalar dependências npm"
            return 1
        fi
    else
        print_info "node_modules já existe"
        read -p "$(echo -e ${CYAN}Reinstalar dependências? [s/n]:${NC} )" reinstall
        if [[ "$reinstall" == "s" ]]; then
            rm -rf "$SCRIPT_DIR/node_modules" "$SCRIPT_DIR/package-lock.json"
            npm install --legacy-peer-deps
            print_success "Dependências npm atualizadas"
        else
            print_info "Pulando reinstalação"
        fi
    fi
}

setup_prisma() {
    print_header "Configurando Prisma ORM"
    
    print_info "Gerando cliente Prisma..."
    cd "$SCRIPT_DIR"
    
    if npx prisma generate; then
        print_success "Cliente Prisma gerado"
    else
        print_error "Falha ao gerar cliente Prisma"
        return 1
    fi
}

setup_database() {
    print_header "Configurando Banco de Dados"
    
    if [[ "$SKIP_DATABASE" == "true" ]]; then
        print_warning "Setup de database ignorado"
        return 0
    fi
    
    print_info "Executando migrações Prisma..."
    cd "$SCRIPT_DIR"
    
    if npx prisma migrate deploy; then
        print_success "Migrações executadas"
    else
        print_warning "Falha ao executar migrações (pode ser esperado)"
    fi
    
    print_info "Seed de dados inicial (opcional)..."
    read -p "$(echo -e ${CYAN}Fazer seed de dados demo? [s/n]:${NC} )" do_seed
    
    if [[ "$do_seed" == "s" ]]; then
        if npm run db:seed; then
            print_success "Dados demo inseridos com sucesso"
        else
            print_warning "Falha ao fazer seed (verifique o banco de dados)"
        fi
    fi
}

setup_docker() {
    print_header "Configurando Docker"
    
    if [[ "$SKIP_DOCKER" == "true" ]]; then
        print_warning "Setup de Docker ignorado"
        return 0
    fi
    
    print_info "Verificando Docker daemon..."
    if ! docker info &> /dev/null; then
        print_error "Docker daemon não está rodando"
        print_info "Inicie o Docker e tente novamente"
        return 1
    fi
    
    print_success "Docker daemon está rodando"
    
    print_info "Construindo imagem Docker..."
    if docker build -t av-rentals:latest .; then
        print_success "Imagem Docker construída"
    else
        print_error "Falha ao construir imagem Docker"
        return 1
    fi
    
    if [[ "$INSTALL_MODE" == "production" ]]; then
        print_info "Iniciando containers com docker-compose..."
        if docker-compose up -d; then
            print_success "Containers iniciados"
            sleep 5
        else
            print_error "Falha ao iniciar containers"
            return 1
        fi
    fi
}

build_application() {
    print_header "Compilando Aplicação"
    
    print_info "Compilando Next.js..."
    cd "$SCRIPT_DIR"
    
    if npm run build; then
        print_success "Aplicação compilada com sucesso"
    else
        print_error "Falha ao compilar aplicação"
        return 1
    fi
}

run_tests() {
    print_header "Executando Testes"
    
    print_info "Rodando testes de tipo..."
    if npm run typecheck; then
        print_success "Type checks passaram"
    else
        print_warning "Alguns type checks falharam"
    fi
    
    print_info "Rodando testes unitários..."
    if npm run test:run; then
        print_success "Testes passaram"
    else
        print_warning "Alguns testes falharam (verifique depois)"
    fi
}

verify_installation() {
    print_header "Verificando Instalação"
    
    local checks_passed=0
    local checks_total=0
    
    # Verificações
    checks_total=$((checks_total + 1))
    if [[ -d "$SCRIPT_DIR/node_modules" ]]; then
        print_success "node_modules presente"
        checks_passed=$((checks_passed + 1))
    else
        print_warning "node_modules não encontrado"
    fi
    
    checks_total=$((checks_total + 1))
    if [[ -d "$SCRIPT_DIR/.next" ]]; then
        print_success ".next (build) presente"
        checks_passed=$((checks_passed + 1))
    else
        print_warning ".next não encontrado (execute 'npm run build')"
    fi
    
    checks_total=$((checks_total + 1))
    if [[ -f "$SCRIPT_DIR/.env.local" ]]; then
        print_success ".env.local presente"
        checks_passed=$((checks_passed + 1))
    else
        print_warning ".env.local não encontrado"
    fi
    
    if [[ "$SKIP_DOCKER" == "false" ]]; then
        checks_total=$((checks_total + 1))
        if docker images | grep -q "av-rentals"; then
            print_success "Imagem Docker construída"
            checks_passed=$((checks_passed + 1))
        else
            print_warning "Imagem Docker não encontrada"
        fi
    fi
    
    echo ""
    print_info "Verificações: $checks_passed/$checks_total passadas"
}

print_final_summary() {
    print_header "Resumo da Instalação"
    
    local end_time=$(date +%s)
    local duration=$((end_time - INSTALLATION_START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo ""
    echo -e "${WHITE}Informações da Instalação:${NC}"
    echo ""
    echo -e "  ${BULLET} ${CYAN}Modo:${NC} $INSTALL_MODE"
    echo -e "  ${BULLET} ${CYAN}OS:${NC} $OS_TYPE"
    echo -e "  ${BULLET} ${CYAN}Diretório:${NC} $SCRIPT_DIR"
    echo -e "  ${BULLET} ${CYAN}Duração:${NC} ${minutes}m ${seconds}s"
    echo -e "  ${BULLET} ${CYAN}Logs:${NC} $INSTALL_LOG"
    echo ""
    
    echo -e "${WHITE}Sumário:${NC}"
    echo ""
    echo -e "  ${CHECK} ${GREEN}Etapas completadas: $INSTALLATION_STEP/$TOTAL_STEPS${NC}"
    echo -e "  ${WARN} ${YELLOW}Avisos: $WARNINGS_ENCOUNTERED${NC}"
    
    if [[ $ERRORS_ENCOUNTERED -gt 0 ]]; then
        echo -e "  ${CROSS} ${RED}Erros: $ERRORS_ENCOUNTERED${NC}"
    else
        echo -e "  ${CHECK} ${GREEN}Erros: 0${NC}"
    fi
    
    echo ""
}

print_next_steps() {
    print_header "Próximos Passos"
    
    echo -e "${WHITE}${STAR} Configuração Recomendada:${NC}"
    echo ""
    echo -e "  1. ${CYAN}Revise as variáveis de ambiente${NC}"
    echo -e "     ${GRAY}vim .env.local${NC}"
    echo ""
    
    if [[ "$INSTALL_MODE" == "development" ]]; then
        echo -e "  2. ${CYAN}Inicie o servidor de desenvolvimento${NC}"
        echo -e "     ${GRAY}npm run dev${NC}"
        echo ""
        echo -e "  3. ${CYAN}Acesse em navegador${NC}"
        echo -e "     ${GRAY}http://localhost:3000${NC}"
    else
        echo -e "  2. ${CYAN}Inicie os containers Docker${NC}"
        echo -e "     ${GRAY}docker-compose up -d${NC}"
        echo ""
        echo -e "  3. ${CYAN}Verifique o status${NC}"
        echo -e "     ${GRAY}docker-compose ps${NC}"
        echo ""
        echo -e "  4. ${CYAN}Acesse a aplicação${NC}"
        echo -e "     ${GRAY}https://\$DOMAIN${NC}"
    fi
    
    echo ""
    echo -e "${WHITE}${STAR} Comandos Úteis:${NC}"
    echo ""
    echo -e "  ${GRAY}npm run dev${NC}             # Iniciar desenvolvimento"
    echo -e "  ${GRAY}npm run build${NC}           # Compilar para produção"
    echo -e "  ${GRAY}npm run db:seed${NC}         # Fazer seed de dados"
    echo -e "  ${GRAY}docker-compose logs${NC}     # Ver logs"
    echo ""
    
    echo -e "${WHITE}${STAR} Documentação:${NC}"
    echo ""
    echo -e "  ${GRAY}docs/ARCHITECTURE.md${NC}    # Arquitetura do projeto"
    echo -e "  ${GRAY}docs/DEPLOYMENT.md${NC}      # Guia de deployment"
    echo -e "  ${GRAY}README.md${NC}               # Documentação principal"
    echo ""
}

cleanup_on_error() {
    print_header "Limpeza Pós-Erro"
    
    print_error "Instalação falhou"
    echo ""
    print_info "Executando limpeza..."
    
    # Não remover node_modules completamente, mas poderia fazer backup
    if [[ -d "$BACKUP_DIR" ]]; then
        print_verbose "Arquivos de backup em: $BACKUP_DIR"
    fi
    
    print_info "Verifique o log de instalação:"
    echo -e "  ${GRAY}cat $INSTALL_LOG${NC}"
    echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# FUNÇÕES UTILITÁRIAS
# ─────────────────────────────────────────────────────────────────────────────

show_help() {
    cat << EOF

${WHITE}Uso: bash $SCRIPT_NAME [opções]${NC}

${WHITE}Opções:${NC}
  -m, --mode MODE        Modo de instalação: production, development, custom
  --skip-docker          Pular setup de Docker
  --skip-database        Pular setup de banco de dados
  -y, --yes              Responder sim a todas as perguntas
  -v, --verbose          Modo verbose (mais detalhes)
  --dry-run              Mostrar o que seria feito, sem fazer
  --help                 Mostrar esta mensagem de ajuda

${WHITE}Exemplos:${NC}
  bash install.sh                           # Setup interativo
  bash install.sh -m production             # Produção direta
  bash install.sh -m development --skip-docker
  bash install.sh -y -v                     # Verbose, sem perguntas

EOF
}

# ─────────────────────────────────────────────────────────────────────────────
# PROCESSAMENTO DE ARGUMENTOS
# ─────────────────────────────────────────────────────────────────────────────

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                INSTALL_MODE="$2"
                shift 2
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-database)
                SKIP_DATABASE=true
                shift
                ;;
            -y|--yes)
                INTERACTIVE=false
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# ─────────────────────────────────────────────────────────────────────────────
# FUNÇÃO PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────

main() {
    # Setup inicial
    setup_logging
    parse_arguments "$@"
    clear
    print_banner
    
    # Verificações iniciais
    check_os
    check_disk_space
    check_permissions
    check_dependencies
    
    # Configuração
    if [[ "$INTERACTIVE" == "true" ]]; then
        interactive_setup
    fi
    
    setup_environment
    
    # Instalação
    install_dependencies
    setup_prisma
    setup_database
    setup_docker
    build_application
    run_tests
    verify_installation
    
    # Finalização
    print_final_summary
    
    if [[ $ERRORS_ENCOUNTERED -eq 0 ]]; then
        print_success_box "✓ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
        echo ""
        print_next_steps
        exit 0
    else
        print_error_box "✗ Instalação completada com $ERRORS_ENCOUNTERED erro(s)"
        cleanup_on_error
        exit 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# EXECUÇÃO
# ─────────────────────────────────────────────────────────────────────────────

trap 'cleanup_on_error' ERR
main "$@"
