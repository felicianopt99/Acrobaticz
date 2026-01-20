#!/bin/bash
# Deploy simples e direto

SSH="feliciano@192.168.1.119"
REMOTE="/home/feliciano/acrobaticz"

echo "🚀 DEPLOY ACROBATICZ"
echo ""

# 1. Preparar
echo "1️⃣ Preparando arquivo..."
TEMP=$(mktemp -d)
mkdir -p "$TEMP/acrobaticz/prisma"

cp -r .next "$TEMP/acrobaticz/" 2>/dev/null || echo "  ⚠️ .next"
cp -r public "$TEMP/acrobaticz/" 2>/dev/null || echo "  ⚠️ public"
cp -r prisma/migrations "$TEMP/acrobaticz/prisma/" 2>/dev/null || echo "  ⚠️ migrations"
cp prisma/schema.prisma "$TEMP/acrobaticz/prisma/" 2>/dev/null || echo "  ⚠️ schema"
cp package.json "$TEMP/acrobaticz/" 2>/dev/null || echo "  ⚠️ package.json"
cp docker-compose.yml "$TEMP/acrobaticz/" 2>/dev/null || echo "  ⚠️ docker-compose"
cp Dockerfile "$TEMP/acrobaticz/" 2>/dev/null || echo "  ⚠️ Dockerfile"

echo "  → Comprimindo..."
tar -czf "$TEMP/app.tar.gz" -C "$TEMP" acrobaticz/

SIZE=$(du -h "$TEMP/app.tar.gz" | cut -f1)
echo "✅ Pronto: $SIZE"
echo ""

# 2. Enviar
echo "2️⃣ Enviando ($SIZE)..."
scp "$TEMP/app.tar.gz" "$SSH:$REMOTE.tar.gz" && echo "✅ Enviado" || exit 1
echo ""

# 3. Extrair no servidor
echo "3️⃣ Extraindo no servidor..."
ssh "$SSH" "
  cd /home/feliciano
  mkdir -p $REMOTE
  tar -xzf $REMOTE.tar.gz
  cd acrobaticz
" && echo "✅ Extraído" || exit 1
echo ""

# 4. Docker
echo "4️⃣ Iniciando Docker..."
ssh "$SSH" "
  cd $REMOTE
  docker-compose down 2>/dev/null || true
  docker-compose up -d --pull always
" && echo "✅ Docker iniciado" || exit 1
echo ""

# Cleanup
rm -rf "$TEMP"

echo "✅ DEPLOY CONCLUÍDO!"
echo ""
echo "Próximas etapas:"
echo "  ssh $SSH"
echo "  cd $REMOTE"
echo "  docker-compose logs -f app"
