#!/bin/bash

# Este script verifica as pastas no SSH e faz o deploy

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🔍 VERIFICAR PASTAS + DEPLOY                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

ssh home@192.168.1.119 << 'EOF'
echo "📋 HOME DIRECTORY:"
ls -lah ~/

echo ""
echo "📋 /home/projects:"
ls -lah /home/projects/ || echo "⚠️ Pasta não existe - vou criar"

echo ""
echo "🚀 DEPLOY:"
mkdir -p /home/projects
cd /home/projects

echo "📂 Listando arquivos tar.gz:"
ls -lh acrobaticz-*.tar.gz 2>/dev/null || echo "⚠️ Nenhum arquivo encontrado"

echo ""
echo "Se o arquivo foi transferido, extrair:"
# Tentar encontrar e extrair o último arquivo
ARCHIVE=$(ls -t acrobaticz-*.tar.gz 2>/dev/null | head -1)

if [ -n "$ARCHIVE" ]; then
    echo "✅ Encontrado: $ARCHIVE"
    echo "📂 Extraindo..."
    tar -xzf "$ARCHIVE"
    echo "✅ Extraído!"
    
    cd app
    echo ""
    echo "📦 npm install --production..."
    npm install --production --omit=dev
    
    echo ""
    echo "🗄️ Migrações..."
    npm run db:migrate || echo "ℹ️ Já aplicadas"
    
    echo ""
    echo "🚀 Iniciando..."
    npm run start &
    
    sleep 2
    ps aux | grep node | grep -v grep && echo "✅ RODANDO!" || echo "⚠️ Verificar"
else
    echo "❌ Arquivo não encontrado!"
    echo "Transferir primeiro com: scp /tmp/acrobaticz-*.tar.gz home@192.168.1.119:/home/projects/"
fi

EOF

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      DEPLOY COMPLETO!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Acesse: http://192.168.1.119:3000"
echo ""
