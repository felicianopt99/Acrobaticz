# 📦 MinIO S3 - Resumo de Funcionamento

**Última atualização:** 20 de Janeiro de 2026  
**Status:** ✅ Totalmente funcional e integrado  

---

## 🎯 TL;DR - O que é MinIO?

MinIO é um **armazenamento compatível com S3** que oferece:
- ✅ Upload/download de arquivos
- ✅ API compatível com AWS S3 (usado para integração)
- ✅ WebUI para administração (porta 9001)
- ✅ Storage local ou externo (disco rígido, NAS, etc)

**No seu projeto:**
```
Utilizador faz upload → Next.js App → MinIO S3 API → /mnt/backup_drive
```

---

## 🔧 Configuração Atual (seu .env)

```env
# Credenciais de admin
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Onde guardar os ficheiros
STORAGE_PATH=/mnt/backup_drive
MINIO_VOLUMES=/mnt/backup_drive

# URLs de acesso
MINIO_ENDPOINT=http://192.168.1.119:9000      # API (interno)
S3_ENDPOINT=http://192.168.1.119:9000         # Para Next.js app

# Credenciais para app fazer uploads
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123

# Bucket (pasta) onde guardar
S3_BUCKET=acrobaticz
S3_REGION=us-east-1
S3_USE_PATH_STYLE=true
```

---

## 📊 Como Funciona (Fluxo)

### 1️⃣ Inicialização
```bash
docker-compose up -d
# → MinIO inicia no container
# → Volume externo (/mnt/backup_drive) é montado
# → Health check valida conectividade
```

### 2️⃣ Criação de Bucket
```bash
# Automático no docker-entrypoint.sh
# Cria bucket "acrobaticz" se não existir
# Usa AWS CLI ou fallback curl
```

### 3️⃣ Upload de Arquivo (User clica em "Upload")
```
1. User seleciona ficheiro na web app
2. Next.js valida (tipo, tamanho, etc)
3. AWS SDK v3 envia para MinIO via S3 API
4. MinIO escreve em /mnt/backup_drive
5. Retorna sucesso ao usuario
```

### 4️⃣ Download de Arquivo (User clica em "Download")
```
1. User clica em arquivo na app
2. Next.js consulta MinIO via S3 API
3. MinIO retorna arquivo
4. Browser faz download
```

---

## 🌐 Acesso

### WebUI Console (Administração)
```
URL: http://192.168.1.119:9001
User: minioadmin
Pass: minioadmin123

Aqui você pode:
- Ver buckets e arquivos
- Monitorar espaço usado
- Gerir credenciais
```

### API S3 (Para app)
```
URL: http://192.168.1.119:9000
Usado internamente pela Next.js app
Não precisa acessar manualmente
```

---

## 📂 Ficheiros de Projeto que Usam MinIO

| Ficheiro | Propósito |
|----------|-----------|
| [docker-compose.yml](docker-compose.yml) | Define container MinIO |
| [docker-entrypoint.sh](docker-entrypoint.sh) | Setup automático de bucket |
| [src/app/(setup)/install/components/StepStorage.tsx](src/app/(setup)/install/components/StepStorage.tsx) | Form de config MinIO (setup wizard) |
| [src/app/api/setup/test-storage/route.ts](src/app/api/setup/test-storage/route.ts) | API para testar conexão |
| [src/components/cloud/EnhancedCloudPage.tsx](src/components/cloud/EnhancedCloudPage.tsx) | Interface upload/download |
| [.env](.env) | Variáveis de configuração |

---

## 🚀 Comandos Úteis

```bash
# Ver status MinIO
docker-compose ps minio

# Ver logs em tempo real
docker-compose logs minio -f

# Testar saúde
curl http://192.168.1.119:9000/minio/health/live

# Testar bucket
docker-compose exec minio mc ls minio/acrobaticz

# Ver espaço usado
du -sh /mnt/backup_drive

# Criar bucket manualmente (se necessário)
docker-compose exec minio mc mb minio/acrobaticz

# Deletar arquivo (CUIDADO!)
docker-compose exec minio mc rm minio/acrobaticz/arquivo.pdf
```

---

## ✅ Status Componentes

| Componente | Status | Detalhes |
|-----------|--------|----------|
| **Docker Image** | ✅ | minio/minio:latest |
| **Container** | ✅ | acrobaticz-minio |
| **Storage** | ✅ | /mnt/backup_drive mapeado |
| **Health Checks** | ✅ | 20s interval, 10s timeout, 5 retries |
| **API S3** | ✅ | Porta 9000 funcional |
| **WebUI** | ✅ | Porta 9001 funcional |
| **Credenciais** | ⚠️ | Padrão (trocar em produção!) |
| **Bucket** | ✅ | "acrobaticz" auto-criado |
| **Integração App** | ✅ | AWS SDK v3 + fallback HTTP |

---

## ⚠️ Pontos Críticos

### 🔐 Segurança
- **CUIDADO:** Credenciais padrão (minioadmin/minioadmin123)
- **AÇÃO:** Trocar antes de colocar em produção
- **AÇÃO:** WebUI exposto - proteger com firewall

### 📊 Storage
- **Limite:** Quota 50GB padrão
- **Local:** /mnt/backup_drive
- **AÇÃO:** Monitorar uso de disco

### 🔄 Backups
- **IMPORTANTE:** Dados MinIO NÃO fazem backup automático
- **AÇÃO:** Configurar backup rotineiro
- Exemplo: `docker-compose exec db pg_dump`

### 🚨 Se Falhar
- **Se MinIO não inicia:** `docker-compose logs minio`
- **Se upload falha:** Verificar espaço disco: `df -h`
- **Se conexão recusada:** `netstat -tlnp | grep 9000`

---

## 🎯 Próximos Passos

1. **Verificar quando fizer deploy:**
   ```bash
   docker-compose ps minio
   curl http://192.168.1.119:9000/minio/health/live
   ```

2. **Acessar console MinIO:**
   ```
   http://192.168.1.119:9001
   ```

3. **Testar upload via app:**
   - Ir para seção Cloud/Storage
   - Fazer upload de ficheiro
   - Confirmar que aparece em MinIO console

4. **Em produção:**
   - Trocar credenciais
   - Configurar backups
   - Monitorar espaço disco
   - Ativar HTTPS para MinIO

---

**Status Final:** ✅ MinIO está pronto, totalmente integrado e funcional!

