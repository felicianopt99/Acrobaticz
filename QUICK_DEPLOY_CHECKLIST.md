# ⚡ QUICK START - DEPLOY EM 60 MINUTOS

**Impressão**: Print este ficheiro ou guarde no telemóvel ☝️

---

## 📍 SEUS DADOS

```
Server IP:     192.168.1.119
Username:      feliciano
Domain:        acrobaticz.duckdns.org
Email Admin:   felizartpt@gmail.com
```

---

## ⏱️ TIMELINE

### Minuto 1-10: Conectar ao Servidor

```bash
ssh feliciano@192.168.1.119
# Senha: superfeliz99
```

### Minuto 11-30: Setup do Servidor

```bash
# COPIAR E COLAR CADA BLOCO:

# [1] Update
sudo apt-get update && sudo apt-get upgrade -y

# [2] Install Docker
sudo apt-get install -y curl wget git build-essential software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# [3] Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# [4] Docker permissions
sudo usermod -aG docker feliciano
newgrp docker

# [5] Create directories
mkdir -p ~/acrobaticz ~/backup_drive/av-rentals/{backups,cloud-storage,app-data}

# [6] Firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp

# [7] Verify
docker --version
docker-compose --version
echo "✅ Setup concluído!"
```

### Minuto 31-45: Deploy

**NO SEU LAPTOP (Terminal nova janela):**

```bash
# [1] Navigate
cd ~/sua-pasta/Acrobaticz

# [2] Build
export DOCKER_BUILDKIT=1
npm run build

# [3] Deploy
bash deploy-ssh-fast.sh feliciano@192.168.1.119:~/acrobaticz

# Aguarde 10-15 minutos...
```

### Minuto 46-60: Verificar

**VOLTA AO SERVER:**

```bash
# [1] Check status
docker-compose ps

# [2] See logs (aguarde "Seeding successful")
docker-compose logs app

# [3] Health check
curl http://localhost:3000/api/health

# [4] Exit
exit
```

---

## 🌐 ACESSO

**No browser:**

```
App:       https://acrobaticz.duckdns.org
User:      admin@acrobaticz.com
Pass:      admin123

MinIO:     http://192.168.1.119:9001
User:      minioadmin
Pass:      biqRGsQJHb10Jwo2HyHwOIV8saAp1xA2I6Mn7xcskVQ=
```

---

## ⚠️ IMPORTANTE ANTES DE GO-LIVE

1. **Regenerar DuckDNS Token** (copiar novo valor, atualizar em .env):
   ```
   https://www.duckdns.org → Login → Regenerate → Copy token
   ```

2. **Trocar senha admin:**
   ```
   https://acrobaticz.duckdns.org → Settings → Users → Change password
   ```

3. **Validar HTTPS:**
   ```bash
   curl -I https://acrobaticz.duckdns.org
   # Expect: HTTP/2 200
   ```

---

## 🆘 PROBLEMAS COMUNS

| Problema | Solução |
|----------|---------|
| "Port already in use" | `sudo lsof -i :3000` → `kill -9 <PID>` |
| DB não conecta | `docker-compose restart db` |
| MinIO vazio | Aguarde seeding (5 minutos) |
| HTTPS erro | Desabilitar: `ENABLE_HTTPS=false` em .env |

---

## ✅ CHECKLIST FINAL

```
☐ Servidor atualizado
☐ Docker instalado
☐ Diretórios criados
☐ Firewall ativo
☐ Build local OK
☐ Deploy concluído
☐ Containers rodando
☐ Health check OK
☐ App acessível
☐ Seeding completo
☐ Logar funciona
☐ DuckDNS token regenerado
☐ Admin password alterada
```

---

## 📞 SUPORTE RÁPIDO

**Tudo deu errado? Restart completo:**

```bash
ssh feliciano@192.168.1.119
cd ~/acrobaticz
docker-compose down -v
docker-compose up -d
docker-compose logs -f app
```

---

**Status:** ✅ Ready for Production  
**Tempo Total:** ~60 minutos  
**Dificuldade:** 🟢 Fácil (segue os passos)  

