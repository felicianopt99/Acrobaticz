# 🚀 Acrobaticz - Guia Rápido de Ambiente

## 📋 Estrutura de Ambiente

O projeto usa apenas **2 ficheiros de configuração**:

### **`.env.dev`** - Desenvolvimento
- Base de dados local
- Credenciais de teste (não seguras)
- MinIO local
- Ideal para desenvolvimento local

### **`.env.prod`** - Produção
- Credenciais vazias (DEVEM SER PREENCHIDAS)
- Configuração para deploy em servidor
- URLs e domínios reais

---

## ⚙️ Como Usar

### **1️⃣ Para DESENVOLVIMENTO (Local)**

```bash
# Copiar configuração de desenvolvimento
cp .env.dev .env

# Iniciar stack (docker-compose.dev.yml opcional)
docker-compose -f docker-compose.dev.yml up -d

# Ou usar docker-compose.yml com .env.dev
docker-compose up -d
```

**Acesso:**
- App: http://localhost:3000
- PostgreSQL: localhost:5432
- MinIO: http://localhost:9001 (user: minioadmin)

---

### **2️⃣ Para PRODUÇÃO (Deploy)**

```bash
# Copiar configuração de produção
cp .env.prod .env

# ⚠️ IMPORTANTE: Editar .env e MUDAR valores:
# - DB_PASSWORD (linha 9)
# - JWT_SECRET (linha 15)
# - MINIO_ROOT_PASSWORD (linha 21)
# - DOMAIN (linha 5)

nano .env

# Iniciar stack
docker-compose up -d
```

**Checklist de Segurança:**
- [ ] Alterou `DB_PASSWORD`
- [ ] Alterou `JWT_SECRET` (use: `openssl rand -base64 32`)
- [ ] Alterou `MINIO_ROOT_PASSWORD`
- [ ] Configurou `DOMAIN` correto
- [ ] Setup SSL/TLS via Nginx (opcional)

---

## 🔒 Variáveis Críticas

| Variável | Dev | Prod | Notas |
|----------|-----|------|-------|
| `NODE_ENV` | development | production | Controla otimizações |
| `JWT_SECRET` | demo | MUDAR! | Segurança da app |
| `DB_PASSWORD` | demo | MUDAR! | Credencial BD |
| `MINIO_ROOT_PASSWORD` | demo | MUDAR! | Storage seguro |
| `DOMAIN` | localhost:3000 | seu-dominio.com | URLs da app |

---

## 📦 Serviços Disponíveis

```
┌─────────────┐
│   nginx     │ (Reverse proxy - opcional)
└──────┬──────┘
       │
┌──────▼──────┐
│     app     │ (Next.js)
│  :3000      │
└──────┬──────┘
       ├─────────────┬──────────────┐
       │             │              │
┌──────▼───┐  ┌──────▼────┐  ┌──────▼────┐
│ postgres  │  │  minio    │  │  nginx    │
│  :5432    │  │  :9000    │  │ :80, :443 │
└───────────┘  └───────────┘  └───────────┘
```

---

## 🛠️ Comandos Úteis

### **Logs em Tempo Real**
```bash
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f minio
```

### **Parar/Reiniciar**
```bash
docker-compose down          # Parar todos
docker-compose down -v       # Parar + limpar volumes

docker-compose restart app   # Reiniciar apenas app
```

### **Status**
```bash
docker-compose ps
docker-compose ps --services
```

---

## ⚠️ Troubleshooting

### **Erro: "permission denied" nos ficheiros .env**
```bash
# Solução para partições USB/externas:
sudo chmod 777 .env .env.dev .env.prod
```

### **PostgreSQL não inicia**
```bash
# Ver logs
docker-compose logs postgres

# Reset completo
docker-compose down -v
docker-compose up -d
```

### **MinIO não inicializa buckets**
```bash
# Manualmente criar bucket
docker exec acrobaticz-minio /bin/sh -c \
  "mc alias set myminio http://localhost:9000 minioadmin minioadmin_dev_123 && \
   mc mb myminio/acrobaticz-dev"
```

---

## 📝 Ficheiros Importantes

- `.env` - Configuração atual (ativa)
- `.env.dev` - Template de desenvolvimento
- `.env.prod` - Template de produção
- `.env.example` - Documentação completa de todas as opções
- `docker-compose.yml` - Stack de produção
- `docker-compose.dev.yml` - Stack de desenvolvimento

---

## 🔄 Fluxo de Deploy

1. **Local**: `cp .env.dev .env` → Desenvolver
2. **Teste**: `cp .env.prod .env` → Editar valores → Testar
3. **Produção**: Mesmo ficheiro .env.prod → Deploy

---

**Versão:** 1.0  
**Data:** Jan 17, 2026
