#!/bin/bash
# Script para configurar app para DuckDNS

DOMAIN="acrobaticz.duckdns.org"

echo "🚀 CONFIGURANDO PARA DUCKDNS"
echo "Domínio: $DOMAIN"
echo ""

cd /home/feliciano/acrobaticz

# 1. Criar/atualizar .env.production
echo "1️⃣ Criando .env.production..."
cat > .env.production << EOF
# Production Environment
NODE_ENV=production
PORT=3000

# Database
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=acrobaticz_password_123

# NextAuth / JWT
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=\$(openssl rand -base64 32)
JWT_SECRET=\$(openssl rand -base64 32)
ENCRYPTION_KEY=\$(openssl rand -base64 32)

# MinIO / S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=acrobaticz

# DuckDNS
DOMAIN=$DOMAIN
DUCKDNS_TOKEN=your_duckdns_token_here

EOF

echo "✅ .env.production criado"
echo ""

# 2. Parar containers
echo "2️⃣ Parando containers..."
docker-compose down

echo ""
echo "3️⃣ Iniciando novamente..."
docker-compose up -d --pull always

echo ""
sleep 10

echo "4️⃣ Status dos containers:"
docker-compose ps

echo ""
echo "5️⃣ Teste de conexão:"
curl -I http://localhost/ 2>/dev/null | head -3 || echo "Nginx não respondeu ainda"

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "Próximos passos:"
echo "1. Editar .env.production com DUCKDNS_TOKEN correto"
echo "2. Verificar logs: docker-compose logs -f app"
echo "3. Acessar: http://$DOMAIN"
