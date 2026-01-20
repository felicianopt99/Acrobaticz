#!/bin/bash

#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 DIAGNÓSTICO SSH - 192.168.1.119
#━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOST="192.168.1.119"
USER="home"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🔍 DIAGNÓSTICO SSH - ANÁLISE DE DIRETÓRIOS        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 STATUS SSH:"
echo ""
echo "  Host: $HOST"
echo "  User: $USER"
echo ""

echo "🔗 Testando conectividade:"
echo ""

# Teste 1: Ping
echo -n "  • PING: "
if ping -c 1 -W 2 "$HOST" > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Sem resposta"
    exit 1
fi

# Teste 2: Porta 22
echo -n "  • Porta 22: "
if timeout 2 bash -c "echo > /dev/tcp/$HOST/22" 2>/dev/null; then
    echo "✅ ABERTA"
else
    echo "❌ FECHADA"
fi

# Teste 3: SSH
echo -n "  • SSH: "
if timeout 5 ssh -o BatchMode=yes -o ConnectTimeout=3 "$USER@$HOST" "echo OK" > /dev/null 2>&1; then
    echo "✅ CONECTA"
    
    echo ""
    echo "📂 DIRETÓRIOS:"
    echo ""
    
    ssh "$USER@$HOST" << 'REMOTE_CMD'

echo "  🏠 HOME:"
echo "    $(pwd)"
echo ""

echo "  📁 Conteúdo do HOME:"
ls -lah ~/

echo ""
echo "  🔍 /home:"
ls -lah /home/

echo ""
echo "  🔎 Procurando 'projects':"
find /home -maxdepth 2 -name "*project*" -o -name "*app*" 2>/dev/null | head -10

echo ""
echo "  📊 Espaço disco:"
df -h

REMOTE_CMD

else
    echo "❌ SEM RESPOSTA"
    
    echo ""
    echo "⚠️  SSH não conecta - Opções:"
    echo ""
    echo "  1. Reiniciar SSH no servidor:"
    echo "     sudo systemctl restart ssh"
    echo ""
    echo "  2. Verificar porta SSH (pode não ser 22):"
    echo "     ssh -p PORTA $USER@$HOST"
    echo ""
    echo "  3. Verificar firewall:"
    echo "     sudo ufw allow 22/tcp"
    echo ""
    echo "  4. Status SSH no servidor:"
    echo "     sudo systemctl status ssh"
    echo ""
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     DIAGNÓSTICO COMPLETO                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
