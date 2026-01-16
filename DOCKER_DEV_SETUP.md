# Docker Development Setup (Production-like Environment)

## Overview

O novo `docker-compose.dev.yml` foi criado para permitir testar seu ambiente de desenvolvimento com uma configuração **idêntica à produção**, incluindo:

- ✅ PostgreSQL 16 (production-grade)
- ✅ MinIO S3-compatible storage (production-grade)
- ✅ Next.js App com hot-reload (development)
- ✅ Nginx reverse proxy (optional)
- ✅ Health checks em todos os serviços
- ✅ Limites de recursos e logging estruturado

## Quick Start

### 1. Iniciar o ambiente

```bash
# Opção A: Usar o script de setup (recomendado)
./scripts/dev-docker-setup.sh start

# Opção B: Usar docker-compose diretamente
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Acessar os serviços

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Aplicação | http://localhost:3000 | - |
| MinIO Web Console | http://localhost:9001 | minioadmin / minioadmin_dev_123 |
| PostgreSQL | localhost:5432 | acrobaticz_user / dev_password_123 |
| Nginx (Reverse Proxy) | http://localhost:80 | - |

### 3. Visualizar logs

```bash
# Opção A: Usar script
./scripts/dev-docker-setup.sh logs

# Opção B: Docker compose
docker-compose -f docker-compose.dev.yml logs -f

# Opção C: Serviço específico
docker-compose -f docker-compose.dev.yml logs -f app
```

## Commands

### Usar o Script de Setup

```bash
./scripts/dev-docker-setup.sh start   # Iniciar
./scripts/dev-docker-setup.sh stop    # Parar
./scripts/dev-docker-setup.sh reset   # Resetar (destroi dados!)
./scripts/dev-docker-setup.sh logs    # Logs em tempo real
./scripts/dev-docker-setup.sh status  # Status dos serviços
./scripts/dev-docker-setup.sh shell   # Shell no container do app
./scripts/dev-docker-setup.sh psql    # Conectar ao PostgreSQL
```

### Ou usar Docker Compose Diretamente

```bash
# Iniciar
docker-compose -f docker-compose.dev.yml up -d

# Parar
docker-compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpar dados)
docker-compose -f docker-compose.dev.yml down -v

# Ver status
docker-compose -f docker-compose.dev.yml ps

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Entrar no container
docker exec -it acrobaticz-app-dev bash
```

## Environment Variables

As variáveis estão em `.env.dev`:

```bash
# Criar .env a partir de .env.dev
cp .env.dev .env

# Ou editar .env manualmente
# O script de setup faz isso automaticamente
```

**Variáveis importantes:**

| Variável | Valor Dev | Descrição |
|----------|-----------|-----------|
| NODE_ENV | development | Modo de desenvolvimento |
| DATABASE_URL | postgresql://... | Conexão com PostgreSQL |
| S3_ENDPOINT | http://minio:9000 | Endpoint MinIO interno |
| S3_BUCKET | acrobaticz-dev | Bucket MinIO para dev |
| JWT_SECRET | dev-secret-... | Chave JWT (dev only) |

## Arquitetura

```
┌─────────────────────────────────────┐
│     Docker Compose Network          │
│  (acrobaticz-dev-network bridge)    │
└─────────────────────────────────────┘
         ↓
   ┌─────┴─────┬──────────┬──────────┐
   ↓           ↓          ↓          ↓
PostgreSQL  MinIO      App(Next)   Nginx
:5432       :9000/:9001  :3000       :80
database    storage      app         proxy
```

## Diferenças entre Dev e Prod

| Aspecto | Dev | Prod |
|---------|-----|------|
| Dockerfile | Dockerfile.dev | Dockerfile |
| Build | Com hot-reload | Multi-stage otimizado |
| Volumes | Código montado | Imagem self-contained |
| MinIO Console | Acessível | Geralmente desabilitado |
| Debug | Logs detalhados | Logs comprimidos |
| Resources | 2 cores / 4GB | 1 core / 512MB |
| Restart Policy | unless-stopped | unless-stopped |

## Troubleshooting

### Portas em uso

```bash
# Ver o que está usando a porta
lsof -i :3000
lsof -i :5432
lsof -i :9000

# Parar os containers conflitantes
docker-compose -f docker-compose.dev.yml down
```

### MinIO bucket não encontrado

```bash
# Entrar no MinIO console
# http://localhost:9001

# Ou usar CLI:
docker exec -it acrobaticz-minio-dev mc ls minio/acrobaticz-dev

# Criar bucket se não existir:
docker exec acrobaticz-minio-dev mc mb minio/acrobaticz-dev
```

### PostgreSQL não conecta

```bash
# Verificar se container está rodando
docker ps | grep postgres

# Ver logs
docker logs acrobaticz-postgres-dev

# Testar conexão
docker exec acrobaticz-postgres-dev psql -U acrobaticz_user -d acrobaticz_dev -c "SELECT 1"
```

### App demora muito para iniciar

```bash
# Primeiro build leva tempo (instala dependências)
# Aguarde ~3-5 minutos no primeiro start

# Ver progresso:
docker-compose -f docker-compose.dev.yml logs -f app
```

## Performance Tips

1. **Usar named volumes em vez de bind mounts** para `/app/node_modules`:
   - Já configurado no docker-compose.dev.yml ✓

2. **Limite de recursos** está configurado:
   - 2 cores / 4GB limite
   - 1 core / 2GB reservado

3. **Cache Docker** é preservado entre restarts

4. **Para limpeza de cache** se houver problemas:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker system prune -a
   ```

## Próximos Passos

1. ✅ Testar fluxo completo de setup localmente
2. ✅ Validar migrações de banco de dados
3. ✅ Testar upload de arquivos no MinIO
4. ✅ Verificar health checks
5. ✅ Simular scaling (com docker-compose scale)

## Arquivos Modificados

- `docker-compose.dev.yml` - Novo (production-like dev setup)
- `.env.dev` - Novo (variáveis para dev)
- `scripts/dev-docker-setup.sh` - Novo (helper script)

## Suporte

Para ver logs detalhados de inicialização:

```bash
./scripts/dev-docker-setup.sh logs

# ou

docker-compose -f docker-compose.dev.yml logs -f --tail=100
```

---

**Última atualização:** 2026-01-15
