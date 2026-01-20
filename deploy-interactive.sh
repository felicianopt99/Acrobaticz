#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🛫 DEPLOY INTERACTIVE - Guia interativo para deploy via SSH
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   🚀 DEPLOY WIZARD                     ║${NC}"
echo -e "${CYAN}║           Acrobaticz - Build Local via SSH             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECOLHER INFORMAÇÕES
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📋 Passo 1/4: Informações do servidor${NC}"
echo ""

read -p "👤 Utilizador SSH (ex: deploy): " SSH_USER
read -p "🌐 Host/IP do servidor: " SSH_HOST
read -p "📁 Caminho remoto (ex: /app/acrobaticz): " REMOTE_PATH

SSH_TARGET="$SSH_USER@$SSH_HOST:$REMOTE_PATH"

echo ""
echo -e "${YELLOW}📋 Passo 2/4: Verificar conexão SSH${NC}"
echo ""
echo -e "${CYAN}Testando SSH...${NC}"

if ssh -o ConnectTimeout=5 "$SSH_USER@$SSH_HOST" "echo ✅ SSH OK" 2>/dev/null; then
    echo -e "${GREEN}✅ Conexão SSH validada!${NC}"
else
    echo -e "${RED}❌ Erro ao conectar via SSH${NC}"
    echo "Verifique:"
    echo "  • SSH key configurada: ssh-keygen -t rsa"
    echo "  • Credenciais corretas"
    echo "  • Host acessível"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Passo 3/4: Opções de deploy${NC}"
echo ""
echo "Opções disponíveis:"
echo "  1) Build + Deploy (RECOMENDADO)"
echo "  2) Apenas teste (--dry-run)"
echo ""

read -p "Escolha (1 ou 2): " OPTION

case $OPTION in
    1)
        DRY_RUN=""
        echo -e "${GREEN}→ Modo: DEPLOY ATIVO${NC}"
        ;;
    2)
        DRY_RUN="--dry-run"
        echo -e "${YELLOW}→ Modo: DRY RUN (sem executar)${NC}"
        ;;
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}📋 Passo 4/4: Confirmar deploy${NC}"
echo ""
echo -e "${CYAN}Resumo:${NC}"
echo "  🔐 SSH: $SSH_USER@$SSH_HOST"
echo "  📁 Destino: $REMOTE_PATH"
echo "  🎯 Modo: $([ "$DRY_RUN" == "--dry-run" ] && echo "DRY RUN" || echo "DEPLOY ATIVO")"
echo ""

read -p "Deseja prosseguir? (s/n): " CONFIRM

if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo -e "${YELLOW}Deploy cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  🚀 INICIANDO DEPLOY                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EXECUTAR DEPLOY
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

./deploy-ssh-fast.sh "$SSH_TARGET" $DRY_RUN

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   ✅ DEPLOY COMPLETO!                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    echo -e "${YELLOW}💡 Este foi um teste (DRY RUN)${NC}"
    echo ""
    echo "Para fazer o deploy real, execute:"
    echo "  ${YELLOW}./deploy-interactive.sh${NC}"
else
    echo -e "${GREEN}✅ Aplicação em execução!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  • Verificar logs: ssh $SSH_USER@$SSH_HOST 'pm2 logs acrobaticz'"
    echo "  • Acessar: https://$SSH_HOST"
    echo "  • Health check: curl http://$SSH_HOST:3000/api/health"
fi

echo ""
