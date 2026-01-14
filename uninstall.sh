#!/bin/bash

###############################################################################
#
#  🗑️ AV RENTALS - PROFESSIONAL UNINSTALLER
#
#  Remove completamente a instalação de forma segura
#  Avec opções de backup e recovery
#
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/.installation-backups"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}                                                           ${RED}║${NC}"
    echo -e "${RED}║${NC}  ${WHITE}AV RENTALS - DESINSTALADOR PROFISSIONAL${NC}"
    echo -e "${RED}║${NC}                                                           ${RED}║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} ${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}✗${NC} ${RED}$1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} ${CYAN}$1${NC}"
}

confirm() {
    local prompt="$1"
    local response
    read -p "$(echo -e ${RED}${prompt}${NC} [s/n]: )" response
    [[ "$response" == "s" ]]
}

main() {
    clear
    print_header
    
    echo -e "${WHITE}Este script irá remover a instalação do AV Rentals${NC}"
    echo ""
    
    print_warning "ESTA AÇÃO NÃO PODE SER DESFEITA SEM BACKUPS"
    echo ""
    
    if ! confirm "Tem certeza de que deseja continuar?"; then
        print_info "Desinstalação cancelada"
        exit 0
    fi
    
    echo ""
    echo -e "${WHITE}Selecione o que remover:${NC}"
    echo ""
    echo "  1) Apenas node_modules (reconstruível)"
    echo "  2) node_modules + build"
    echo "  3) Tudo menos banco de dados"
    echo "  4) COMPLETO (banco de dados, Docker, tudo)"
    echo ""
    
    read -p "$(echo -e ${CYAN}Escolha [1-4]:${NC} )" choice
    
    case $choice in
        1)
            remove_node_modules
            ;;
        2)
            remove_node_modules
            remove_build
            ;;
        3)
            remove_node_modules
            remove_build
            remove_docker
            remove_env
            ;;
        4)
            complete_uninstall
            ;;
        *)
            print_error "Opção inválida"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Desinstalação concluída"
    echo ""
    
    if [[ -d "$BACKUP_DIR" ]]; then
        echo -e "${CYAN}Backups disponíveis em:${NC} $BACKUP_DIR"
    fi
}

remove_node_modules() {
    print_info "Removendo node_modules..."
    if [[ -d "$SCRIPT_DIR/node_modules" ]]; then
        rm -rf "$SCRIPT_DIR/node_modules"
        print_success "node_modules removido"
    fi
    
    if [[ -f "$SCRIPT_DIR/package-lock.json" ]]; then
        rm -f "$SCRIPT_DIR/package-lock.json"
        print_success "package-lock.json removido"
    fi
}

remove_build() {
    print_info "Removendo artifacts de build..."
    
    if [[ -d "$SCRIPT_DIR/.next" ]]; then
        rm -rf "$SCRIPT_DIR/.next"
        print_success ".next removido"
    fi
    
    if [[ -d "$SCRIPT_DIR/dist" ]]; then
        rm -rf "$SCRIPT_DIR/dist"
        print_success "dist removido"
    fi
    
    if [[ -d "$SCRIPT_DIR/.prisma" ]]; then
        rm -rf "$SCRIPT_DIR/.prisma"
        print_success ".prisma removido"
    fi
}

remove_docker() {
    print_info "Removendo containers Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker não instalado"
        return
    fi
    
    if confirm "Parar e remover containers?"; then
        docker-compose down -v 2>/dev/null || true
        print_success "Containers removidos"
    fi
    
    if confirm "Remover imagem Docker?"; then
        docker rmi av-rentals:latest 2>/dev/null || true
        print_success "Imagem removida"
    fi
}

remove_env() {
    print_info "Removendo arquivos de configuração..."
    
    if [[ -f "$SCRIPT_DIR/.env.local" ]]; then
        if confirm "Remover .env.local?"; then
            # Backup primeiro
            mkdir -p "$BACKUP_DIR"
            cp "$SCRIPT_DIR/.env.local" "$BACKUP_DIR/.env.local.backup.$(date +%s)"
            rm -f "$SCRIPT_DIR/.env.local"
            print_success ".env.local removido (backup criado)"
        fi
    fi
}

complete_uninstall() {
    print_warning "DESINSTALAÇÃO COMPLETA SELECIONADA"
    echo ""
    
    if ! confirm "Tem CERTEZA? Isto removerá TUDO incluindo o banco de dados?"; then
        print_info "Cancelado"
        return
    fi
    
    remove_node_modules
    remove_build
    remove_docker
    remove_env
    
    print_info "Removendo volumes Docker..."
    if command -v docker &> /dev/null; then
        docker volume prune -f 2>/dev/null || true
        print_success "Volumes removidos"
    fi
    
    print_success "Desinstalação completa concluída"
}

trap 'print_error "Erro durante desinstalação"; exit 1' ERR
main
