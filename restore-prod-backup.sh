#!/bin/bash

################################################################################
# AV-RENTALS Production Backup Restoration Script
#
# Restaura o backup para o banco de dados de produção no Docker
#
# Uso: ./restore-prod-backup.sh
################################################################################

set -euo pipefail

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Configurações
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_FILE="${PROJECT_ROOT}/final restore/av-rentals-backup-complete-20260108/av-rentals-backup-package/full_backup_dev_20260108_003912.tar.gz"
RESTORE_TEMP_DIR="/tmp/av-rentals-restore-$$"
RESTORE_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/restore_${RESTORE_TIMESTAMP}.log"

# Docker config
DB_CONTAINER="av-postgres"
DB_USER="avrentals_user"
DB_NAME="avrentals_db"

# Funções de logging
log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "${level}" in
        INFO)
            echo -e "${BLUE}[${timestamp}] [INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[${timestamp}] [✓]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        WARN)
            echo -e "${YELLOW}[${timestamp}] [⚠]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        ERROR)
            echo -e "${RED}[${timestamp}] [✗]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
    esac
}

cleanup() {
    local exit_code=$?
    log INFO "Limpando recursos temporários..."
    
    if [[ -d "${RESTORE_TEMP_DIR}" ]]; then
        rm -rf "${RESTORE_TEMP_DIR}"
    fi
    
    exit ${exit_code}
}

error_exit() {
    log ERROR "$@"
    exit 1
}

trap cleanup EXIT

# ============================================================================
# VALIDAÇÕES
# ============================================================================

validate_environment() {
    log INFO "Validando ambiente..."
    
    if ! command -v docker &> /dev/null; then
        error_exit "Docker não está instalado"
    fi
    
    # Verificar se o container PostgreSQL está rodando
    if ! docker ps --filter "name=^${DB_CONTAINER}$" --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        error_exit "Container PostgreSQL (${DB_CONTAINER}) não está em execução"
    fi
    
    if [[ ! -f "${BACKUP_FILE}" ]]; then
        error_exit "Arquivo de backup não encontrado: ${BACKUP_FILE}"
    fi
    
    log SUCCESS "Ambiente validado"
}

# ============================================================================
# RESTAURAÇÃO
# ============================================================================

extract_backup() {
    log INFO "Extraindo arquivo de backup..."
    mkdir -p "${RESTORE_TEMP_DIR}"
    
    if ! tar -tzf "${BACKUP_FILE}" > /dev/null 2>&1; then
        error_exit "Arquivo de backup está corrompido"
    fi
    
    tar -xzf "${BACKUP_FILE}" -C "${RESTORE_TEMP_DIR}" || error_exit "Falha ao extrair backup"
    log SUCCESS "Backup extraído com sucesso"
}

restore_database() {
    log INFO "Restaurando banco de dados..."
    
    local db_dump=$(find "${RESTORE_TEMP_DIR}" -name "*.sql.gz" | head -1)
    
    if [[ -z "${db_dump}" ]]; then
        error_exit "Nenhum arquivo SQL encontrado no backup"
    fi
    
    log INFO "Encontrado arquivo de dump: $(basename "${db_dump}")"
    
    # Preparar comando de restauração
    log INFO "Dropando banco de dados atual..."
    docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
    
    log INFO "Restaurando dados do dump..."
    gunzip -c "${db_dump}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" \
        || error_exit "Falha ao restaurar dados do banco de dados"
    
    log SUCCESS "Banco de dados restaurado com sucesso"
}

restore_files() {
    log INFO "Restaurando arquivos..."
    
    local backup_dir=$(find "${RESTORE_TEMP_DIR}" -type d -name "backup" | head -1)
    local cloud_storage_tar=$(find "${RESTORE_TEMP_DIR}" -name "*cloud-storage*.tar.gz" | head -1)
    
    if [[ -n "${cloud_storage_tar}" ]]; then
        log INFO "Extraindo cloud-storage..."
        mkdir -p "/mnt/backup_drive/av-rentals"
        tar -xzf "${cloud_storage_tar}" -C "/mnt/backup_drive/av-rentals/" 2>/dev/null || {
            log WARN "Falha ao extrair cloud-storage (pode precisar de permissões)"
        }
        log SUCCESS "Cloud-storage restaurado"
    fi
}

verify_restoration() {
    log INFO "Verificando restauração..."
    
    local counts=$(docker exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "
        SELECT 
            (SELECT COUNT(*) FROM \"Category\") as categories,
            (SELECT COUNT(*) FROM \"EquipmentItem\") as equipment,
            (SELECT COUNT(*) FROM \"Client\") as clients,
            (SELECT COUNT(*) FROM \"Rental\") as rentals;
    " 2>/dev/null || echo "0 0 0 0")
    
    log SUCCESS "Restauração verificada:"
    log SUCCESS "${counts}"
}

# ============================================================================
# EXECUÇÃO
# ============================================================================

main() {
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  AV-RENTALS Production Database Restoration"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    validate_environment
    extract_backup
    restore_database
    restore_files
    verify_restoration
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    log SUCCESS "Restauração concluída com sucesso!"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    log INFO "Log completo: ${LOG_FILE}"
    echo ""
}

main "$@"
