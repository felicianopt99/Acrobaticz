# 🚀 DEPLOY 100% - DuckDNS + MinIO + SSL/TLS

## 📋 Visão Geral

Este guia fornece instruções completas para fazer deploy do Acrobaticz com:

- ✅ **DuckDNS** - Dynamic DNS automático (seu domínio sempre atualizado)
- ✅ **MinIO** - S3-compatible object storage (ficheiros de produtos, imagens)
- ✅ **PostgreSQL** - Database persistente
- ✅ **SSL/TLS** - Certificado automático com Let's Encrypt
- ✅ **Docker Compose** - Orquestração completa
- ✅ **SSH Deploy** - Build local + deploy remoto

## 🎯 Resultados Esperados

Após o deploy, terá:

```
https://seu-dominio.duckdns.org          → Acrobaticz (app principal)
https://seu-dominio.duckdns.org:9001     → MinIO Console (gestão de ficheiros)
postgresql://user:pass@host:5432         → Database (persistente)
```

**Tempos:**
- Build local: ~2-5 minutos (primeira vez)
- Upload/Deploy: ~1-2 minutos
- Containers iniciarem: ~30-60 segundos
- **Total: ~5-10 minutos**

---

## 📦 PRÉ-REQUISITOS

### No seu Servidor (SSH)

```bash
# Sistema
- Ubuntu 20.04 LTS+ / Debian 11+ / CentOS 8+
- 2GB RAM mínimo (4GB recomendado)
- 10GB disco livre

# Software
- Docker CE 20.10+
- Docker Compose 2.0+
- Git (opcional)
- SSH acesso

# Verificar versões
docker --version
docker-compose --version
```

### No seu Computador Local

```bash
# Node.js
node --version    # v20.0+
npm --version     # v10.0+

# Build da app
npm run build     # Deve completar sem erros

# SSH
ssh-keygen -t rsa -b 4096
ssh-copy-id user@seu-servidor.com
```

### DuckDNS

1. Ir a https://www.duckdns.org
2. Login com GitHub/Google/etc
3. Criar novo domínio: `seu-dominio`
4. Guardar o **TOKEN** (importante!)

---

## 🚀 QUICK START (5 minutos)

### Passo 1: Preparar Servidor

```bash
# SSH no seu servidor
ssh deploy@seu-servidor.com

# Criar diretório
mkdir -p /app/acrobaticz
cd /app/acrobaticz

# Voltar para local
exit
```

### Passo 2: Fazer Deploy

```bash
# No seu computador, na pasta do projeto
chmod +x deploy-complete-duckdns-minio.sh

./deploy-complete-duckdns-minio.sh \
    deploy@seu-servidor.com:/app/acrobaticz \
    --duckdns-domain=seu-dominio \
    --duckdns-token=seu-token-aqui
```

**Exemplo real:**

```bash
./deploy-complete-duckdns-minio.sh \
    deploy@prod.example.com:/app/acrobaticz \
    --duckdns-domain=acrobaticz \
    --duckdns-token=f0027691-1f98-4a3e-9f26-94020479451e
```

### Passo 3: Verificar Status

```bash
# SSH no servidor
ssh deploy@seu-servidor.com
cd /app/acrobaticz

# Ver containers
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar curl
curl -s http://localhost:3000 | head -20
```

### Passo 4: Aceder à Aplicação

```
1. Abra o browser: https://seu-dominio.duckdns.org
2. (Pode levar 2-3 minutos na primeira vez)
3. Login: admin@acrobaticz.com / password
4. DuckDNS atualizado automaticamente
```

---

## ⚙️ CONFIGURAÇÃO DETALHADA

### 1️⃣ Configurar SSH (One-time Setup)

```bash
# Gerar chave SSH (se não tem)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copiar para servidor
ssh-copy-id deploy@seu-servidor.com

# Testar
ssh deploy@seu-servidor.com "echo ✅ SSH OK"
```

### 2️⃣ Preparar .env.production

O script cria automaticamente, mas pode customizar:

```bash
# Antes de rodar deploy-complete-duckdns-minio.sh
cp .env.prod .env.production

# Editar se quiser valores específicos
nano .env.production
```

**Principais variáveis:**

```bash
# Domain
DOMAIN=seu-dominio.duckdns.org
NEXTAUTH_URL=https://seu-dominio.duckdns.org

# Database (gerado aleatório se não especificar)
DB_PASSWORD=sua-senha-forte

# MinIO
MINIO_ROOT_PASSWORD=seu-minio-password
STORAGE_PATH=./storage/minio

# DuckDNS
DUCKDNS_DOMAIN=seu-dominio
DUCKDNS_TOKEN=seu-token
```

### 3️⃣ Customizar Senhas

```bash
# Opção A: Gerar aleatório (recomendado)
./deploy-complete-duckdns-minio.sh ... \
    # Senhas geradas automaticamente

# Opção B: Especificar manualmente
./deploy-complete-duckdns-minio.sh ... \
    --db-password="MinhaSenha123!" \
    --minio-password="MinIOPass456@"
```

### 4️⃣ SSL/TLS Automático

```bash
# O deploy configura automaticamente:
# 1. Certbot cria certificado Let's Encrypt
# 2. Renovação automática cada 60 dias
# 3. HTTPS funciona em 2-3 minutos

# Verificar certificado
ssh deploy@seu-servidor.com
cd /app/acrobaticz
docker-compose exec certbot certbot certificates
```

---

## 📊 ESTRUTURA DOCKER COMPOSE

Após deploy, terá estes containers:

```yaml
Services:
  ├── acrobaticz (Next.js app)      → Port 3000
  ├── postgres (Database)            → Port 5432 (interno)
  ├── minio (Storage S3)             → Ports 9000, 9001
  ├── duckdns (Dynamic DNS)          → Updates automáticos
  └── certbot (SSL/TLS)              → Certificados Let's Encrypt

Volumes:
  ├── storage/minio/                 → Ficheiros de produtos
  ├── data/postgres/                 → Database persistente
  ├── certbot/conf/                  → SSL Certificates
  └── .next/                         → App build

Networks:
  └── acrobaticz-network             → Internal communication
```

---

## 🔧 COMANDOS PÓS-DEPLOY

### Ver Status

```bash
ssh deploy@seu-servidor.com

cd /app/acrobaticz

# Todos containers
docker-compose ps

# Logs específicos
docker-compose logs postgres          # Database
docker-compose logs minio             # Storage
docker-compose logs acrobaticz        # App principal

# Logs em tempo real
docker-compose logs -f
```

### Reiniciar Serviços

```bash
# Restart app
docker-compose restart acrobaticz

# Restart tudo
docker-compose restart

# Recreate containers (manter dados)
docker-compose up -d --force-recreate
```

### Gestão MinIO

```bash
# MinIO Console
https://seu-dominio.duckdns.org:9001

Credentials:
  User: minioadmin
  Password: (a que forneceu no deploy)

Opções:
1. Criar buckets (ex: "products", "uploads")
2. Upload de ficheiros teste
3. Gerir politicas de acesso
4. Ver estatísticas de storage
```

### Verificar Database

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz

# Comandos úteis
\dt                 # Listar tabelas
SELECT COUNT(*) FROM users;     # Contar utilizadores
\q                  # Sair
```

---

## 🆘 TROUBLESHOOTING

### Problema: "Connection refused" em https://

**Solução:**
```bash
# Certificado levanta 2-3 minutos
# Verificar logs do certbot
docker-compose logs certbot

# Se problemas, fazer renewal manual
docker-compose exec certbot certbot renew
```

### Problema: MinIO não inicia

**Solução:**
```bash
# Verificar permissões storage
ls -la storage/
chmod 755 storage/minio

# Restart
docker-compose restart minio

# Logs
docker-compose logs minio
```

### Problema: Database não conecta

**Solução:**
```bash
# Verificar se postgres está healthy
docker-compose ps postgres

# Logs
docker-compose logs postgres

# Se morrer, resetar
docker-compose down -v   # ⚠️ Remove dados!
docker-compose up -d postgres
```

### Problema: DuckDNS não atualiza

**Solução:**
```bash
# Verificar variáveis
grep DUCKDNS /app/acrobaticz/app/.env.production

# Logs do container
docker-compose logs duckdns 2>/dev/null

# Manual update
curl -i "https://www.duckdns.org/update?domains=seu-dominio&token=seu-token&ip="
```

### Problema: App slow / alta CPU

**Solução:**
```bash
# Ver recursos
docker stats

# Se Node.js usando muita CPU:
docker-compose logs acrobaticz | tail -50

# Rebuild com otimizações
cd /app/acrobaticz/app
npm run build --verbose
```

---

## 🔐 SEGURANÇA

### Boas Práticas

```bash
✅ Mudar todas as senhas padrão
✅ Usar SSH key em vez de password
✅ Ativar firewall no servidor
✅ Limitar acesso SSH por IP se possível
✅ Fazer backup da database regularmente
✅ Monitorar logs regularmente
```

### Backup Database

```bash
# Backup automático
docker-compose exec postgres pg_dump -U acrobaticz_user acrobaticz > backup.sql

# Restaurar
docker-compose exec -T postgres psql -U acrobaticz_user acrobaticz < backup.sql
```

### Firewall

```bash
# Abrir portas necessárias
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 443/tcp         # HTTPS
sudo ufw allow 9001/tcp        # MinIO Console

# Ver status
sudo ufw status
```

---

## 📈 MONITORAMENTO

### Health Checks Automáticos

```bash
# Docker já faz checks automáticos
# Ver status: docker-compose ps

# Health status individual
docker inspect --format='{{.State.Health.Status}}' acrobaticz-postgres
docker inspect --format='{{.State.Health.Status}}' acrobaticz-minio
```

### Logs Persistentes

```bash
# Todos logs guardados em:
/var/lib/docker/containers/[container-id]/

# Ver histórico
docker-compose logs --tail=100
docker-compose logs --since 1h
```

### Alertas (Opcional - Prometheus/Grafana)

```yaml
# Futuro upgrade possível com:
- Prometheus (coleta de métricas)
- Grafana (visualização)
- AlertManager (notificações)
```

---

## 🔄 ATUALIZAR DEPLOY

### Atualizar App

```bash
# No seu computador
git pull origin main

npm run build

./deploy-complete-duckdns-minio.sh \
    deploy@seu-servidor.com:/app/acrobaticz \
    --duckdns-domain=seu-dominio \
    --duckdns-token=seu-token
```

### Atualizar Database Schema

```bash
# No servidor
cd /app/acrobaticz/app

# Aplicar migrations
npm run db:migrate

# Ver status
npm run db:status
```

---

## 📞 SUPORTE

### Recursos Úteis

- DuckDNS: https://www.duckdns.org
- MinIO Docs: https://min.io/docs/minio
- Docker Docs: https://docs.docker.com
- Let's Encrypt: https://letsencrypt.org

### Comandos de Debug

```bash
# Teste de conectividade
curl -v https://seu-dominio.duckdns.org

# Testar API
curl -X GET https://seu-dominio.duckdns.org/api/health

# Logs de rede
docker-compose logs -f | grep -E "ERROR|WARN"

# Verificar IP
curl https://ifconfig.me
```

---

## ✅ CHECKLIST FINAL

Antes de considerar deploy completo:

- [ ] App acessível em https://seu-dominio.duckdns.org
- [ ] Login funciona (admin@acrobaticz.com)
- [ ] MinIO console acessível em :9001
- [ ] Certificado SSL válido (sem warnings)
- [ ] Database responde (docker-compose exec postgres...)
- [ ] DuckDNS atualizado (verifica ping)
- [ ] Backups configurados
- [ ] Firewall ativo
- [ ] Logs monitorados

---

## 🎉 Pronto!

Seu Acrobaticz está agora em produção com:
- ✅ HTTPS seguro
- ✅ Dynamic DNS sempre atualizado
- ✅ Storage robusto com MinIO
- ✅ Database persistente
- ✅ Auto-restart em caso de problemas
- ✅ Certificados automáticos

Qualquer dúvida, verifique os logs: `docker-compose logs -f`
