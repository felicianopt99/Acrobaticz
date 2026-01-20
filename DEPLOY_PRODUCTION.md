# 🚀 Deploy via SSH - Guia Completo

## 🎯 Resumo Rápido (2 opções)

### Opção 1: Interativo (RECOMENDADO) ⭐
```bash
chmod +x deploy-interactive.sh
./deploy-interactive.sh
# Responde às perguntas e está pronto!
```

### Opção 2: Linha de Comando
```bash
chmod +x deploy-ssh-fast.sh
./deploy-ssh-fast.sh deploy@seu-servidor.com:/app/acrobaticz
```

---

## 📋 Pré-Requisitos

Antes de fazer deploy, certifique-se que:

### Local (sua máquina)
- ✅ Node.js 20+
- ✅ npm instalado
- ✅ SSH key configurada (`ssh-keygen -t rsa` se não tiver)
- ✅ Teste: `ssh user@host "echo OK"` funciona

### Servidor de Produção
- ✅ Node.js 20+
- ✅ PostgreSQL 14+
- ✅ npm instalado
- ✅ Diretório `/app/acrobaticz` (ou seu caminho) acessível via SSH
- ✅ Mínimo 2GB RAM (suficiente após build local)

---

## 🔧 Instalação Única (Server)

**Executar NO SERVIDOR uma única vez:**

```bash
# Conectar ao servidor
ssh deploy@seu-servidor.com

# Criar diretório
mkdir -p /app/acrobaticz
cd /app/acrobaticz

# Criar arquivo .env.production com variáveis:
cat > .env.production << 'EOF'
DATABASE_URL="postgresql://user:pass@localhost:5432/acrobaticz"
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
EOF
```

---

## 🚀 Deploy (1a vez ou atualizar)

**No seu computador:**

### Método 1: Interativo (RECOMENDADO)
```bash
./deploy-interactive.sh
```
- Pergunta tudo de forma interativa
- Valida SSH automaticamente
- Mostra preview antes de executar

### Método 2: Direto
```bash
./deploy-ssh-fast.sh deploy@seu-servidor.com:/app/acrobaticz
```

### Método 3: Teste primeiro (DRY RUN)
```bash
./deploy-ssh-fast.sh deploy@seu-servidor.com:/app/acrobaticz --dry-run
```
- Mostra o que seria feito
- Não executa nada

---

## 📊 O que o Script Faz

```
┌─────────────────────────────────────┐
│ 1. BUILD LOCAL (.next)              │
│    └─ Usa RAM da sua máquina        │
│    └─ Evita sobrecarregar server    │
├─────────────────────────────────────┤
│ 2. COMPACTAR BUILD + CONFIG         │
│    └─ .next/ (build compilado)      │
│    └─ public/ (assets)              │
│    └─ prisma/ (migrações)           │
│    └─ package.json                  │
├─────────────────────────────────────┤
│ 3. ENVIAR VIA SCP (SSH)             │
│    └─ ~200MB (rápido)               │
├─────────────────────────────────────┤
│ 4. NO SERVIDOR:                     │
│    ├─ Extrair arquivo               │
│    ├─ npm install --production      │
│    ├─ Migrações de DB               │
│    └─ npm run start                 │
└─────────────────────────────────────┘
```

---

## ✔️ Verificação Pós-Deploy

### 1. Verificar que está a rodar
```bash
# No servidor
ps aux | grep "node"
# ou
curl http://localhost:3000/api/health
```

### 2. Ver logs da aplicação
```bash
# No servidor, se usar PM2:
pm2 logs acrobaticz

# Ou com SSH remoto:
ssh deploy@seu-servidor.com "pm2 logs acrobaticz"
```

### 3. Testar endpoint
```bash
curl -X GET http://seu-dominio.com/api/health
```

### 4. Acessar aplicação
```
https://seu-dominio.com
```

---

## 🔄 Manter Rodando (PM2)

Para que a app reinicie automaticamente se cair:

```bash
# No servidor
npm install -g pm2

cd /app/acrobaticz/app
pm2 start npm --name "acrobaticz" -- start
pm2 save
pm2 startup
```

Depois:
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs acrobaticz

# Reiniciar
pm2 restart acrobaticz
```

---

## 🌐 Nginx Reverse Proxy

Se quiser acesso por domínio HTTP/HTTPS:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 Troubleshooting

### SSH não funciona
```bash
# Testar conexão
ssh -v deploy@seu-servidor.com

# Copiar chave SSH se não tiver
ssh-keygen -t rsa
ssh-copy-id deploy@seu-servidor.com
```

### Erro de memória no build local
```bash
# Aumentar limite Node
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Porta 3000 já está em uso
```bash
# No servidor, matar processo antigo
lsof -i :3000
kill -9 <PID>

# Ou usar outra porta
PORT=3001 npm run start
```

### Database connection error
```bash
# Verificar .env.production no servidor
ssh deploy@seu-servidor.com "cat /app/acrobaticz/app/.env.production"

# Testar conexão à BD
psql postgresql://user:pass@localhost:5432/acrobaticz
```

---

## 📈 Atualizar Deploy

Para fazer nova versão:

```bash
# Local (seu computador)
git pull
npm run build  # testar localmente
./deploy-ssh-fast.sh deploy@seu-servidor.com:/app/acrobaticz
```

É idempotente - pode rodar quantas vezes quiser!

---

## 💡 Dicas

1. **Teste local primeiro**: `npm run build && npm run start`
2. **Use --dry-run**: `./deploy-ssh-fast.sh ... --dry-run` para ver o que vai fazer
3. **Backup do .env**: Guarde uma cópia do `.env.production` do servidor
4. **Monitorar logs**: Tenha um terminal aberto com `pm2 logs`
5. **Scaling**: Se tiver muito tráfego, considere PM2 Cluster Mode

---

## 📞 Scripts Disponíveis

| Script | Uso | Quando |
|--------|-----|--------|
| `deploy-interactive.sh` | Guia interativo | Primeira vez / Fácil |
| `deploy-ssh-fast.sh` | Direto CLI | Automated / CI/CD |
| `deploy-ssh-local-build.sh` | Versão anterior | Referência |

---

**Status**: ✅ 100% Pronto para Produção
**Última atualização**: Janeiro 2026
