# 🚀 SETUP SERVIDOR SSH - Acrobaticz Deploy

**Servidor:** `192.168.1.119` (feliciano)  
**Usuário:** feliciano  
**IP Local:** 192.168.1.119  
**DuckDNS:** acrobaticz.duckdns.org  
**IP Público:** 85.244.171.171  

---

## 📋 PASSOS DE PREPARAÇÃO DO SERVIDOR

### 1️⃣ **CONECTAR AO SERVIDOR SSH**

```bash
# Conectar via SSH
ssh feliciano@192.168.1.119

# Ou configurar em ~/.ssh/config para mais fácil:
# Host acro-servidor
#   HostName 192.168.1.119
#   User feliciano
#   IdentityFile ~/.ssh/id_rsa
#   Port 22

# Depois usar:
ssh acro-servidor
```

---

### 2️⃣ **ATUALIZAR SISTEMA E INSTALAR DEPENDÊNCIAS BÁSICAS**

```bash
# Atualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# Instalar dependências essenciais
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release
```

---

### 3️⃣ **INSTALAR DOCKER**

```bash
# Remover Docker antigo (se existir)
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# Adicionar repositório Docker oficial
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker CE
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker run hello-world
```

---

### 4️⃣ **INSTALAR DOCKER COMPOSE (Standalone)**

```bash
# Download versão latest do Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão executável
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker-compose --version
```

---

### 5️⃣ **CONFIGURAR DOCKER PARA USUÁRIO NÃO-ROOT (Opcional mas Recomendado)**

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker feliciano

# Aplicar permissões (sem fazer logout)
newgrp docker

# Verificar
docker ps
```

---

### 6️⃣ **CRIAR ESTRUTURA DE DIRETÓRIOS**

```bash
# Criar diretórios para o projeto
mkdir -p ~/${HOME}/acrobaticz/{app,storage,backups,data,logs,config}

# Criar diretório de backup
sudo mkdir -p /mnt/backup_drive/av-rentals/{backups,cloud-storage,app-data}

# Dar permissões (use o caminho correto se existir)
# Se /mnt/backup_drive existe:
sudo chown -R feliciano:feliciano /mnt/backup_drive/av-rentals

# Se não existir, criar localmente em ~/backup (alternativa):
mkdir -p ~/backup_drive/av-rentals/{backups,cloud-storage,app-data}

# Mostrar estrutura
tree -L 2 ~/acrobaticz/ 2>/dev/null || find ~/acrobaticz -type d
```

---

### 7️⃣ **CONFIGURAR FIREWALL**

```bash
# Verificar status UFW
sudo ufw status

# Ativar firewall
sudo ufw enable

# Abrir portas necessárias
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 3000/tcp   # Next.js app
sudo ufw allow 9000/tcp   # MinIO API
sudo ufw allow 9001/tcp   # MinIO Console
sudo ufw allow 5432/tcp   # PostgreSQL (local only - ver depois)

# Verificar regras
sudo ufw show added
```

---

### 8️⃣ **INSTALAR NODE.JS (Opcional - para build local)**

```bash
# Instalar Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version
npm --version
```

---

### 9️⃣ **CRIAR ARQUIVO .ENV NO SERVIDOR**

```bash
# Criar arquivo .env no servidor
nano ~/acrobaticz/.env

# OU usar cat para criar direto:
cat > ~/acrobaticz/.env << 'EOF'
# ==============================================
# Production Environment - Acrobaticz
# ==============================================

NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

# Database
DB_NAME=acrobaticz
DB_USER=acrobaticz_user
DB_PASSWORD=3YJvxjGdGXHbDPopGXgTyPRkp8A7TkANpEFPxGi+QE4=
DB_POOL_SIZE=20
DB_TIMEOUT=30000

# JWT & Security
JWT_SECRET=ua1ReIfOZnPhpWtOek3QLlHRU8aUO9/MlUFP3zSgVng=
JWT_EXPIRATION=7d
ENCRYPTION_KEY=cNXCU6OBKrgYrYAwuqmHf59HfZ+auUUU/oOGfbtdvho=
NEXTAUTH_SECRET=ua1ReIfOZnPhpWtOek3QLlHRU8aUO9/MlUFP3zSgVng=
NEXTAUTH_URL=https://acrobaticz.duckdns.org
SESSION_SECRET=7w2sM5nO3pQ6rT9uV1xY4zA8bC0dE3fG5hI7jK9l=

# MinIO / S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=biqRGsQJHb10Jwo2HyHwOIV8saAp1xA2I6Mn7xcskVQ=
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=yqj2wpugBvTavePLStY6LM5idXogmtyk
S3_BUCKET=acrobaticz
S3_REGION=us-east-1

# Domain & DuckDNS
DOMAIN=acrobaticz.duckdns.org
DUCKDNS_DOMAIN=acrobaticz
DUCKDNS_TOKEN=f0027691-1f98-4a3e-9f26-94020479451e
TZ=UTC

# SSL/TLS
CERTBOT_EMAIL=felizartpt@gmail.com
ENABLE_HTTPS=true

# API Keys
GEMINI_API_KEY=AIzaSyDmiWTyY0G0EMSnU9muUAxJNSEtfPpWNGY
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDmiWTyY0G0EMSnU9muUAxJNSEtfPpWNGY
DEEPL_API_KEY=3ca0c43d-7f6b-0a9d-eb49-45132322a270:fx

# Storage
EXTERNAL_STORAGE_PATH=/home/feliciano/backup_drive/av-rentals/cloud-storage
APP_DATA_PATH=/home/feliciano/backup_drive/av-rentals/app-data
BACKUP_PATH=/home/feliciano/backup_drive/av-rentals/backups

# Seeding
SEED_ON_START=true
FORCE_SEED=false
EOF

# Verificar arquivo criado
cat ~/acrobaticz/.env | head -20
```

---

### 🔟 **CONFIGURAR SSH KEY (Recomendado para Deploy Automático)**

```bash
# No seu laptop LOCAL, gerar SSH key se não tiver
ssh-keygen -t ed25519 -C "felizartpt@gmail.com" -f ~/.ssh/acro-deploy

# Copiar chave pública para servidor
ssh-copy-id -i ~/.ssh/acro-deploy.pub -p 22 feliciano@192.168.1.119

# Testar conexão
ssh -i ~/.ssh/acro-deploy feliciano@192.168.1.119 "echo 'SSH OK!'"

# Adicionar ao ~/.ssh/config (no seu laptop)
cat >> ~/.ssh/config << 'EOF'
Host acro-deploy
  HostName 192.168.1.119
  User feliciano
  IdentityFile ~/.ssh/acro-deploy
  Port 22
EOF

# Teste
ssh acro-deploy "docker --version"
```

---

## 🔧 VERIFICAÇÕES PÓS-SETUP

```bash
# Conectar ao servidor
ssh acro-deploy

# Verificar dependências
echo "=== Docker ===" && docker --version
echo "=== Docker Compose ===" && docker-compose --version
echo "=== Node.js ===" && node --version
echo "=== NPM ===" && npm --version
echo "=== Git ===" && git --version

# Verificar diretórios
ls -la ~/acrobaticz/
cat ~/acrobaticz/.env | grep DB_PASSWORD

# Verificar firewall
sudo ufw status

# Verificar espaço em disco
df -h

# Sair
exit
```

---

## 📝 PRÓXIMOS PASSOS

1. **Clone projeto** no servidor:
   ```bash
   ssh acro-deploy
   cd ~/acrobaticz
   git clone https://github.com/seu-usuario/acrobaticz.git .
   ```

2. **Build e deploy** usando script:
   ```bash
   bash deploy-ssh-fast.sh acro-deploy
   ```

3. **Verificar health**:
   ```bash
   curl https://acrobaticz.duckdns.org/api/health
   ```

---

## ⚠️ NOTAS IMPORTANTES

- **DuckDNS Token em produção:** O token `f0027691-1f98-4a3e-9f26-94020479451e` está público. **Rotacione em https://www.duckdns.org** após deploy bem-sucedido.
- **Backup Path:** Se `/mnt/backup_drive` não existir fisicamente, usar `~/backup_drive` (criado como alternativa)
- **Firewall PostgreSQL:** PostgreSQL está configurado para rodar dentro do Docker. **Não abrir porta 5432 ao público**
- **HTTPS:** Certbot será configurado automaticamente no primeiro deploy com `ENABLE_HTTPS=true`

