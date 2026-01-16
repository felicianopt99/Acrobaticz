#!/bin/bash

# 🚀 SCRIPT DE TESTE - Erro "Installation Failed"
# Execute isto para verificar se tudo está funcionando

set -e

PROJECT_DIR="/media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz"
cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════════════════"
echo "🔍 VERIFICAÇÃO PRÉ-INSTALAÇÃO"
echo "═══════════════════════════════════════════════════════"

# 1. Verificar DATABASE_URL
echo ""
echo "1️⃣ Verificando DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "   ❌ DATABASE_URL não definido no ambiente"
    echo "   → Tentando ler de .env..."
    if grep -q "^DATABASE_URL=" .env; then
        echo "   ✅ DATABASE_URL encontrado em .env"
        export $(grep "^DATABASE_URL=" .env)
    else
        echo "   ❌ DATABASE_URL não encontrado em .env"
        exit 1
    fi
else
    echo "   ✅ DATABASE_URL definido: $(echo $DATABASE_URL | cut -d: -f1-3)://***"
fi

# 2. Verificar PostgreSQL
echo ""
echo "2️⃣ Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo "   ✅ PostgreSQL acessível"
    else
        echo "   ❌ PostgreSQL não consegue conectar"
        exit 1
    fi
else
    echo "   ⚠️  psql não encontrado, skipping verificação"
fi

# 3. Verificar tabelas Prisma
echo ""
echo "3️⃣ Verificando tabelas Prisma..."
if psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 5;" 2>/dev/null | grep -q "system_setting"; then
    echo "   ✅ Tabelas Prisma existem"
else
    echo "   ❌ Tabelas Prisma não encontradas"
    echo "   → A correr: npx prisma db push"
    npx prisma db push
fi

# 4. Verificar ficheiro route.ts
echo ""
echo "4️⃣ Verificando ficheiro corrigido..."
if grep -q "id: randomUUID()" src/app/api/setup/complete/route.ts; then
    COUNT=$(grep -c "id: randomUUID()" src/app/api/setup/complete/route.ts)
    echo "   ✅ Ficheiro corrigido ($COUNT ids encontrados)"
else
    echo "   ❌ Ficheiro não parece estar corrigido"
    exit 1
fi

# 5. Verificar logs DEBUG
echo ""
echo "5️⃣ Verificando logs DEBUG..."
if grep -q "\[INSTALL-DEBUG\]" src/app/api/setup/complete/route.ts; then
    DEBUG_COUNT=$(grep -c "\[INSTALL-DEBUG\]" src/app/api/setup/complete/route.ts)
    echo "   ✅ Logs DEBUG implementados ($DEBUG_COUNT logs)"
else
    echo "   ❌ Logs DEBUG não encontrados"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ VERIFICAÇÃO COMPLETA - TUDO OK"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Próximos passos:"
echo "1. npm run dev"
echo "2. Abrir http://localhost:3000/install"
echo "3. Preencher formulário e clicar 'Complete Installation'"
echo "4. Ver logs [INSTALL-DEBUG] no terminal"
echo ""
echo "Se falhar, mostram logs [INSTALL-ERROR] com detalhe"
echo ""
