#!/bin/bash

# 🚀 DEPLOY RÁPIDO - Acrobaticz 100% (DuckDNS + MinIO + SSH)

## 📝 Instruções Rápidas (5 minutos)

### 1️⃣ Validar Ambiente

```bash
chmod +x validate-deploy.sh
./validate-deploy.sh user@seu-servidor.com \
    --duckdns-domain=seu-dominio \
    --duckdns-token=seu-token
```

### 2️⃣ Fazer Deploy

```bash
chmod +x deploy-complete-duckdns-minio.sh

./deploy-complete-duckdns-minio.sh \
    user@seu-servidor.com:/app/acrobaticz \
    --duckdns-domain=seu-dominio \
    --duckdns-token=seu-token
```

### 3️⃣ Aceder à Aplicação

Após 5-10 minutos:
- **App:** https://seu-dominio.duckdns.org
- **MinIO:** https://seu-dominio.duckdns.org:9001
- **Login:** admin@acrobaticz.com / password

---

## 📚 Documentação Completa

👉 Ver: **[DEPLOY_COMPLETE_DUCKDNS_MINIO.md](DEPLOY_COMPLETE_DUCKDNS_MINIO.md)**

Contém:
- ✅ Configuração detalhada
- ✅ Troubleshooting
- ✅ Comandos úteis
- ✅ Security best practices
- ✅ Backup & recovery

---

## 📦 O que é Deployado?

```
Containers:
✅ Next.js App (port 3000)
✅ PostgreSQL Database
✅ MinIO S3 Storage (ports 9000, 9001)
✅ DuckDNS Auto-DNS
✅ Nginx Reverse Proxy (ports 80, 443)

Volumes:
✅ Database persistente
✅ Ficheiros armazenados
✅ SSL Certificates
✅ Logs
```

---

## 🔑 Credenciais Padrão

Todas são **geradas aleatoriamente** no deploy:

| Serviço | Utilizador | Senha |
|---------|-----------|-------|
| App | admin@acrobaticz.com | password (mudar depois) |
| MinIO | minioadmin | gerada aleatória |
| Database | acrobaticz_user | gerada aleatória |

---

## 🌐 DuckDNS Setup

1. Ir a: https://www.duckdns.org
2. Login com GitHub/Google
3. Criar domínio (ex: "meudomain")
4. Guardar TOKEN

Depois:
```bash
./deploy-complete-duckdns-minio.sh ... \
    --duckdns-domain=meudomain \
    --duckdns-token=seu-token
```

---

## 💻 Requisitos Mínimos

**Computador Local:**
- Node.js 20+
- npm 10+
- Docker (se testar localmente)
- SSH key configurada

**Servidor:**
- 2GB RAM (4GB recomendado)
- 10GB disco
- Docker + Docker Compose
- Ubuntu 20+, Debian 11+, CentOS 8+

---

## ⚡ Tempos de Execução

| Etapa | Tempo |
|-------|-------|
| Validar ambiente | ~1 min |
| Build local | ~3-5 min |
| Upload SCP | ~1-2 min |
| Containers iniciar | ~1-2 min |
| **Total** | **~7-10 min** |

---

## 🆘 Problemas Comuns

### "SSH connection refused"
```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id user@seu-servidor.com
ssh user@seu-servidor.com  # Testar
```

### "npm run build failed"
```bash
npm install --force
npm run clean 2>/dev/null || true
npm run build
```

### "Docker not found"
Instalar Docker Desktop ou Docker Engine

### "Port 3000 already in use"
```bash
# No servidor:
docker-compose restart
```

---

## 📋 Arquivos Inclusos

| Arquivo | Descrição |
|---------|-----------|
| `validate-deploy.sh` | Valida tudo antes do deploy |
| `deploy-complete-duckdns-minio.sh` | Script de deploy principal |
| `DEPLOY_COMPLETE_DUCKDNS_MINIO.md` | Documentação completa |
| `docker-compose.yml` | Config containers (com DuckDNS) |
| `.env.example` | Template variáveis |
| `.env.prod` | Production preset |

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. ✅ Aceder a: https://seu-dominio.duckdns.org
2. ✅ Fazer login: admin@acrobaticz.com
3. ✅ Explorar MinIO Console: :9001
4. ✅ Fazer backup da database
5. ✅ Configurar email SMTP (opcional)
6. ✅ Monitirar logs: `docker-compose logs -f`

---

## 📞 Suporte Rápido

**Debug em tempo real:**
```bash
ssh user@servidor.com
cd /app/acrobaticz
docker-compose logs -f
```

**Reiniciar serviços:**
```bash
docker-compose restart
```

**Status:**
```bash
docker-compose ps
```

---

## 🔐 Security Checklist

- [ ] Mudar senha admin (login na app)
- [ ] Mudar password MinIO
- [ ] Ativar SSH key authentication
- [ ] Configurar firewall
- [ ] Backup database regularmente
- [ ] Monitorar logs

---

## ✨ Features Inclusos

✅ Auto-renewal SSL Certificates
✅ Dynamic DNS (DuckDNS)
✅ S3-Compatible Storage (MinIO)
✅ Multi-architecture support (amd64, arm64)
✅ Persistent volumes
✅ Health checks automáticos
✅ Restart policies
✅ Resource limits
✅ Comprehensive logging
✅ Production-ready config

---

## 📝 License & Support

Documentação e scripts de deploy mantidos por Acrobaticz Team.

Para mais informações: [DEPLOY_COMPLETE_DUCKDNS_MINIO.md](DEPLOY_COMPLETE_DUCKDNS_MINIO.md)

---

**Pronto? Vá para o passo 1 acima! 🚀**
