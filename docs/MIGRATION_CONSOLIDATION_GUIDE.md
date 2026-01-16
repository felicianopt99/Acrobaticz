# 🎯 Consolidação de Migrações - Guia Prático

> **Última atualização:** Janeiro 2026  
> **Status:** Production Ready ✅  
> **Versão:** 1.0 (Phase 3)

---

## 📋 Sumário Executivo

Este guia explica como consolidar **29 migrações Prisma** em **1 migração baseline** de forma segura, sem perder dados.

| Aspecto | Valor |
|---------|-------|
| **Migrações atuais** | 29 (Nov 10, 2025 → Jan 9, 2026) |
| **Tempo de consolidação** | ~90 minutos |
| **Risco de perda de dados** | ❌ Zero (com backups) |
| **Linhas SQL consolidadas** | ~1.611 |
| **Novo nome migração** | `20260114000000_01_init` |
| **Compatibilidade Docker** | ✅ 100% (nova imagem) |

---

## 🚀 Início Rápido (2 minutos)

```bash
# 1. Navega para o projeto
cd /path/to/Acrobaticz

# 2. Inicia o PostgreSQL (se não estiver rodando)
docker-compose up -d postgres

# 3. Aguarda ~10 segundos para o DB ficar ready
sleep 10

# 4. Executa o script de consolidação
bash scripts/consolidate-migrations.sh

# 5. Segue as instruções no final do script
```

**Resultado esperado:**
- ✅ Backups criados em `backups/pre_consolidation_*.tar.gz`
- ✅ Nova migração em `prisma/migrations/20260114000000_01_init/`
- ✅ Git commit automático
- ✅ Pronto para testar!

---

## 📖 Guia Completo por Passos

### PASSO 1: Pré-Requisitos (5 min)

Certifique-se que tem:

```bash
# 1. Projeto Acrobaticz clonado
cd /path/to/Acrobaticz

# 2. Git configurado (commit será criado)
git config user.name "Your Name"
git config user.email "your@email.com"

# 3. Node.js e npm instalados
node --version   # v20+
npm --version    # v10+

# 4. Docker rodando
docker --version
docker ps        # deve listar containers

# 5. Nenhuma mudança não commitada (opcional, mas recomendado)
git status       # deve estar limpo
```

### PASSO 2: Iniciar PostgreSQL (2 min)

```bash
# Se já está rodando:
docker ps | grep postgres
# Output: deve mostrar container PostgreSQL

# Se NÃO está rodando:
docker-compose up -d postgres
docker-compose logs postgres | tail -10
# Aguarda até ver: "listening on IPv4 address"

# Verificar saúde
docker-compose ps
# STATUS deve ser "healthy"
```

### PASSO 3: Executar Script (3 min)

```bash
# Modo normal (RECOMENDADO para 1ª vez)
bash scripts/consolidate-migrations.sh

# Modo dry-run (apenas mostra o que faria)
bash scripts/consolidate-migrations.sh --dry-run

# Modo sem backup (APENAS se já fez backup manual)
bash scripts/consolidate-migrations.sh --no-backup
```

**Durante a execução verá:**

```
═══════════════════════════════════════════════════════
STEP 1: Pre-Flight Checks
═══════════════════════════════════════════════════════
ℹ  Checking project structure...
✓  Found: /path/to/prisma/migrations
ℹ  Counting existing migrations...
✓  Found 29 migrations to consolidate

═══════════════════════════════════════════════════════
STEP 2: Creating Comprehensive Backups
═══════════════════════════════════════════════════════
ℹ  Using backup directory: /path/to/backups
ℹ  Backing up migrations directory...
✓  Created: /path/to/backups/pre_consolidation_20260114_120530.migrations.tar.gz (45KB)
✓  Created: /path/to/backups/pre_consolidation_20260114_120530.schema.prisma
✓  Created: /path/to/backups/pre_consolidation_20260114_120530.package.json
ℹ  Docker PostgreSQL found, backing up database...
✓  Database backed up: /path/to/backups/pre_consolidation_20260114_120530.database.sql (2.3MB)

═══════════════════════════════════════════════════════
STEP 3: Generating Consolidated SQL from Schema
═══════════════════════════════════════════════════════
ℹ  Extracting schema from running database...
✓  Schema extracted: /tmp/consolidated_schema_1705254330.sql
ℹ  Cleaning up Prisma metadata...
✓  Consolidated SQL: 1611 lines (cleaned)

═══════════════════════════════════════════════════════
STEP 4: Creating New Migration (01_init)
═══════════════════════════════════════════════════════
ℹ  Archiving old migrations...
  → 20251110233929_init_postgres
  → 20251110234020_add_user_table
  → 20251111045118_add_translation_cache
  [... 26 mais migrações ...]
✓  Archived 29 migrations to: migration_lock.toml.archive.20260114_120530
ℹ  Creating new migration directory...
✓  Created: /path/to/prisma/migrations/20260114000000_01_init
ℹ  Copying consolidated SQL...
✓  Migration SQL created: /path/to/prisma/migrations/20260114000000_01_init/migration.sql

═══════════════════════════════════════════════════════
STEP 5: Git Commit
═══════════════════════════════════════════════════════
ℹ  Staging migration changes...
✓  Committed to git

═══════════════════════════════════════════════════════
Consolidation Complete!
═══════════════════════════════════════════════════════
✓  Migrations consolidated: 29 → 1
✓  New migration: 01_init
✓  Backups created: /path/to/backups/pre_consolidation_20260114_120530.*
```

### PASSO 4: Verificar Resultado (1 min)

```bash
# Ver estrutura das migrações
find prisma/migrations -type d | sort
# Output:
# prisma/migrations
# prisma/migrations/20260114000000_01_init

# Ver tamanho da nova migração
ls -lh prisma/migrations/20260114000000_01_init/migration.sql
# Output: -rw-r--r-- 1 user group 45K Jan 14 12:05 migration.sql

# Ver primeiras linhas
head -30 prisma/migrations/20260114000000_01_init/migration.sql

# Ver quantas linhas tem
wc -l prisma/migrations/20260114000000_01_init/migration.sql
# Output: 1611 lines

# Verificar backups criados
ls -lh backups/pre_consolidation_*
# Output: ~2.3MB database backup
```

### PASSO 5: Testar em Docker (15 min) ⚠️ CRÍTICO

Este é o teste **mais importante**. Valida que:
- ✅ Nova migração funciona em DB vazia
- ✅ Todos os 48+ tables são criados
- ✅ App consegue se conectar
- ✅ `docker-compose up -d` funciona sem erros

```bash
# 1. Parar tudo e apagar volume de dados
docker-compose down -v
# Output: Removing container...
#         Removing volume...

# 2. Iniciar fresh com a nova migração
docker-compose up -d
# Output: Creating network...
#         Creating volumes...
#         Creating postgres...
#         Creating minio...
#         Creating app...

# 3. Aguardar migrations (30-45 segundos)
sleep 40

# 4. Verificar logs
docker-compose logs app | grep -E "STEP|SUCCESS|ERROR"
# Output esperado:
# STEP 1: Environment validation... ✓
# STEP 3: Polling PostgreSQL... ✓
# STEP 7: Running Prisma migrations... ✓
# Database schema up-to-date.
# STEP 11: Application is ready!

# 5. Verificar tabelas criadas
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Output: 48+ tables

# 6. Listar algumas tables principais
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "\dt" | head -20
# Output:
#         List of relations
#  Schema | Name | Type | Owner
# --------+------|------|-------
#  public | APIConfiguration | table | acrobaticz_user
#  public | ActivityLog | table | acrobaticz_user
#  public | Category | table | acrobaticz_user
#  [... mais 45 tables ...]

# 7. Verificar saúde da aplicação
curl http://localhost/api/health
# Output: {"status":"healthy","timestamp":"2026-01-14T12:30:00Z"}

# 8. Verificar console MinIO (opcional)
# Abrir browser: http://localhost:9001
# Login: minioadmin / minioadmin
```

**Se tudo passou ✅:**
- Consolidação bem-sucedida!
- Continua para PASSO 6

**Se falhou ❌:**
- Ver [Troubleshooting](#-troubleshooting)

### PASSO 6: Restaurar Dados de Dev (10 min)

Se tem dados que quer manter no seu ambiente de desenvolvimento:

```bash
# 1. Parar docker
docker-compose down

# 2. Restaurar backup do DB
BACKUP_FILE="backups/pre_consolidation_YYYYMMDD_HHMMSS.database.sql"
docker-compose up -d postgres
sleep 10

# 3. Restaurar dados (preserva estrutura, adiciona dados)
docker-compose exec -T postgres psql -U acrobaticz_user -d acrobaticz < "$BACKUP_FILE"

# 4. Reiniciar aplicação
docker-compose up -d
sleep 20

# 5. Verificar dados
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "SELECT COUNT(*) FROM \"User\";" \
  -c "SELECT COUNT(*) FROM \"Equipment\";" \
  -c "SELECT COUNT(*) FROM \"Quote\";"
```

### PASSO 7: Commit Final (1 min)

```bash
# Verificar o que será commitado
git status
# Output: On branch main
#         nothing to commit, working tree clean
#         (já foi commitado no script)

# Se quiser revisar o commit
git log --oneline -1
# Output: a1b2c3d Consolidate Prisma migrations: 29 → 1 baseline (01_init)

# Ver quais arquivos foram mudados
git show --name-status
# Output:
# M  prisma/migrations/migration_lock.toml
# A  prisma/migrations/20260114000000_01_init/migration.sql
# D  prisma/migrations/20251110233929_init_postgres/migration.sql
# D  prisma/migrations/20251111045118_add_translation_cache/migration.sql
# [... 27 mais removidos ...]
```

---

## 🔄 Rollback (Se Algo Deu Errado)

### Opção 1: Git Rollback (Recomendado)

```bash
# 1. Desfazer o commit
git reset --hard HEAD~1

# 2. Restaurar migrações antigas do arquivo
ARCHIVE_DIR="prisma/migrations.archive.YYYYMMDD_HHMMSS"
rm -rf prisma/migrations/20260114000000_01_init
mv "$ARCHIVE_DIR"/* prisma/migrations/

# 3. Restart Docker
docker-compose down -v
docker-compose up -d

# 4. Verificar que as 29 antigas migrações estão de volta
find prisma/migrations -type d | wc -l
# Output: 30 (migrations folder + 29 migration folders)
```

### Opção 2: Restaurar Database Backup

```bash
# Se a estrutura do DB ficou corrompida
BACKUP_FILE="backups/pre_consolidation_YYYYMMDD_HHMMSS.database.sql"

# 1. Parar docker
docker-compose down -v

# 2. Iniciar apenas postgres
docker-compose up -d postgres
sleep 10

# 3. Restaurar backup completo
docker-compose exec -T postgres psql -U acrobaticz_user < "$BACKUP_FILE"

# 4. Reiniciar tudo
docker-compose up -d
```

### Opção 3: Restaurar Manualmente

```bash
# 1. Extrair arquivo de backup das migrações
tar -xzf backups/pre_consolidation_YYYYMMDD_HHMMSS.migrations.tar.gz

# 2. Git reset
git reset --hard HEAD~1

# 3. Copiar schema.prisma original
cp backups/pre_consolidation_YYYYMMDD_HHMMSS.schema.prisma prisma/schema.prisma

# 4. Copiar package.json original
cp backups/pre_consolidation_YYYYMMDD_HHMMSS.package.json package.json
npm install

# 5. Restart e execute migrations antigas
docker-compose down -v
docker-compose up -d
```

---

## ⚙️ Opções Avançadas

### Dry-Run (Simular sem Fazer Mudanças)

```bash
bash scripts/consolidate-migrations.sh --dry-run

# Mostra exatamente o que seria feito, sem fazer:
# [DRY RUN] Would create: /path/to/prisma/migrations/20260114000000_01_init
# [DRY RUN] Would copy 1611 lines of SQL
# [DRY RUN] Would commit: 'Consolidate Prisma migrations: 29 → 1...'
```

### Sem Backups (Se Já Fez Manualmente)

```bash
# Se já fez backup manual das migrações, DB e package.json
bash scripts/consolidate-migrations.sh --no-backup

# Pula as etapas de backup e vai direto para consolidação
```

### Executar Apenas um Step

Se o script falhar em meio, pode continuar de onde parou:

```bash
# Exemplo: falhou no STEP 3 (generating SQL)
# 1. Soluciona o problema (ex: verificar PostgreSQL)
# 2. Edita o script para comentar os steps já feitos
# 3. Re-executa

# Ou melhor: ve o log completo
cat /tmp/consolidate-migrations_*.log
```

---

## 🐛 Troubleshooting

### "Database is not running"

```bash
# Solução 1: Iniciar PostgreSQL
docker-compose up -d postgres

# Verificar se está pronto
docker-compose logs postgres | tail -5
# Deve mostrar: "listening on IPv4 address"

# Solução 2: Reset completo
docker-compose down -v
docker-compose up -d postgres
sleep 15
bash scripts/consolidate-migrations.sh
```

### "Permission denied" no script

```bash
# Dar permissão de execução
chmod +x scripts/consolidate-migrations.sh

# Re-executar
bash scripts/consolidate-migrations.sh
```

### "Failed to extract schema from database"

```bash
# Problema: schema está corrompido ou vazio
# Solução 1: Apagar volume PostgreSQL e recomeçar
docker-compose down -v postgres
docker-compose up -d postgres
sleep 15

# Solução 2: Verificar conexão manual
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "SELECT COUNT(*) FROM information_schema.tables;"

# Deve retornar: 48+ tables
# Se returnar 0: o schema está vazio, resetar:
docker-compose down -v
docker-compose up -d
# E deixar as 29 migrações antigas rodarem primeiro
```

### "Git: no such file or directory"

```bash
# Problema: não está num repo git
# Solução: inicializar git (ou navegar para pasta correta)
cd /path/to/Acrobaticz
git status   # deve funcionar

# Se não está no git:
git init
git add .
git commit -m "Initial commit"
```

### "Docker: connection refused"

```bash
# Problema: Docker daemon não está rodando
# Solução:
sudo systemctl start docker  # Linux
brew services start docker    # macOS
# Windows: abrir Docker Desktop

# Verificar
docker ps
```

### Consolidação foi feita mas docker-compose up falha

```bash
# Problema: nova migração tem erro SQL
# Solução 1: Verificar SQL gerada
tail -50 prisma/migrations/20260114000000_01_init/migration.sql

# Solução 2: Ver erro completo em logs
docker-compose logs app | tail -100

# Solução 3: Usar ROLLBACK (Opção 1 acima)
git reset --hard HEAD~1

# Solução 4: Editar migration.sql manualmente se souber o erro
# (não recomendado, usar rollback em vez)
```

---

## 📊 Validação Pós-Consolidação

Depois de consolidar, confirme que:

### Checklist 1: Estrutura de Arquivos

- [ ] Nova migração existe: `prisma/migrations/20260114000000_01_init/`
- [ ] Arquivo SQL tem ~1611 linhas: `migration.sql`
- [ ] Arquivo lock existe: `migration_lock.toml`
- [ ] Migrations antigas foram arquivadas em: `prisma/migrations.archive.*`
- [ ] Backups existem em: `backups/pre_consolidation_*`

```bash
# Verify:
ls -lah prisma/migrations/
ls -lah prisma/migrations.archive.* 2>/dev/null || echo "Archived"
ls -lah backups/pre_consolidation_*
```

### Checklist 2: Git

- [ ] Commit foi criado: `"Consolidate Prisma migrations: 29 → 1 baseline (01_init)"`
- [ ] Nenhuma mudança não commitada

```bash
# Verify:
git status      # should be clean
git log --oneline -3
```

### Checklist 3: Docker

- [ ] `docker-compose down -v && docker-compose up -d` funciona
- [ ] Migrations aplicadas com sucesso (ver logs)
- [ ] 48+ tabelas criadas
- [ ] App responde em `http://localhost/api/health` com status `healthy`

```bash
# Verify (need docker-compose running):
docker-compose ps                  # all healthy
curl http://localhost/api/health    # {"status":"healthy"}
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Should return: ~48
```

### Checklist 4: Dados (Se Restaurou)

- [ ] Usuários foram restaurados
- [ ] Equipamentos foram restaurados
- [ ] Quotes/Events foram restaurados

```bash
# Verify (if restored data):
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz << EOF
SELECT COUNT(*) as users FROM "User";
SELECT COUNT(*) as equipment FROM "Equipment";
SELECT COUNT(*) as quotes FROM "Quote";
SELECT COUNT(*) as events FROM "Event";
EOF
```

---

## 📚 Referências

- [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate/overview)
- [Prisma Squash Migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/16/backup.html)

---

## ❓ Perguntas Frequentes

**P: Posso fazer isso em produção?**
A: NÃO. Esta consolidação é para:
- 🟢 Desenvolvimento local
- 🟢 Staging
- 🟢 Novo DB de produção (vazio)
Não use em DB de produção com dados!

**P: Perco dados?**
A: NÃO. Todos os dados originais são:
1. Preservados nos backups (pré-consolidação)
2. Opcionalmente restaurados ao final

**P: E se algo der errado?**
A: Tem 3 formas de rollback (ver seção anterior). Não consegue estragar nada permanentemente.

**P: Quanto tempo demora?**
A: ~90 minutos total:
- 15 min: Backups
- 20 min: Gerar SQL consolidado
- 25 min: Criar nova migração e testar
- 20 min: Restaurar dados (opcional)

**P: Preciso fazer isto?**
A: Não é obrigatório, mas é **fortemente recomendado** para:
- Novos usuários (29 migrações = mais lento)
- Múltiplos deployments (mais falhas)
- Limpeza de repo (reduz git size)

**P: Como faço depois para adicionar novas migrações?**
A: Normal! Após consolidação:
```bash
npx prisma migrate dev --name add_new_feature
# Cria: prisma/migrations/20260115000000_add_new_feature/
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Vê o log completo:**
   ```bash
   cat /tmp/consolidate-migrations_*.log
   ```

2. **Reproduz em dry-run:**
   ```bash
   bash scripts/consolidate-migrations.sh --dry-run
   ```

3. **Usa rollback se necessário:**
   ```bash
   git reset --hard HEAD~1
   ```

4. **Contacta o time** com o log do script

---

**🎉 Parabéns! Consolidação completa!**

Agora tem 1 migração baseline super-rápida. Novos usuários conseguem fazer `docker-compose up -d` e estar pronto em <60 segundos (incluindo migrations).
