# 🚀 Phase 3: Migration Consolidation - Quick Start

> **Status:** Production Ready ✅  
> **Created:** January 14, 2026  
> **Time Estimate:** 90 minutes total

---

## 📝 Overview

Consolida **29 migrações Prisma** em **1 baseline migração** chamada `20260114000000_01_init` de forma 100% segura.

| Métrica | Valor |
|---------|-------|
| Migrações atuais | 29 |
| Migrações finais | 1 |
| Linhas SQL consolidadas | ~1.611 |
| Tempo estimado | 90 min |
| Risco de perda de dados | ❌ Zero |

---

## 🎯 O Que Este Processo Faz

✅ **Antes:**
```
prisma/migrations/
├── 20251110233929_init_postgres/
├── 20251111045118_add_translation_cache/
├── 20251111135023_add_enhanced_translation_fields/
├── ... 26 mais migrações ...
└── 20260109_create_system_setting/
```

✅ **Depois:**
```
prisma/migrations/
├── 20260114000000_01_init/
│   └── migration.sql (1.611 linhas, todo o schema)
├── migration_lock.toml
└── [migrações antigas arquivadas em migrations.archive.TIMESTAMP/]
```

---

## 🚀 Como Executar (3 Passos)

### 1️⃣ Iniciar PostgreSQL (2 min)

```bash
cd /path/to/Acrobaticz
docker-compose up -d postgres
sleep 15  # Aguarda até estar pronto
```

### 2️⃣ Executar Script de Consolidação (5 min)

```bash
bash scripts/consolidate-migrations.sh
```

**O que o script faz automaticamente:**
- ✅ Backup completo (migrations, schema.prisma, package.json, database.sql)
- ✅ Extrai schema consolidado do PostgreSQL
- ✅ Cria nova migração `20260114000000_01_init/`
- ✅ Arquiva migrações antigas
- ✅ Faz commit automático no git

### 3️⃣ Testar em Docker (15 min)

```bash
# Parar tudo e apagar dados
docker-compose down -v

# Iniciar fresh (teste real com nova migração)
docker-compose up -d

# Aguardar migrations
sleep 40

# Verificar logs
docker-compose logs app | grep -E "STEP|SUCCESS|ERROR"

# Verificar tabelas criadas
docker-compose exec postgres psql -U acrobaticz_user -d acrobaticz \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Deve retornar: ~48 tabelas
```

---

## ✅ Validação Rápida

Após executar, confirme:

```bash
# 1. Migração 01_init existe?
ls -lh prisma/migrations/20260114000000_01_init/migration.sql
# Output: ~45KB file

# 2. Backups foram criados?
ls -lh backups/pre_consolidation_*
# Output: migrations.tar.gz, schema.prisma, database.sql, etc.

# 3. Git foi commitado?
git log --oneline -1
# Output: "Consolidate Prisma migrations: 29 → 1 baseline (01_init)"

# 4. Testes passaram?
bash scripts/test-consolidation.sh
# Output: "✅ All tests passed!"
```

---

## 🔄 Se Algo Deu Errado (Rollback)

**Opção 1: Git Rollback (Recomendado)**

```bash
git reset --hard HEAD~1
# Migrações antigas são restauradas do git
```

**Opção 2: Restaurar Backups Manualmente**

```bash
# Extrair migrações de backup
tar -xzf backups/pre_consolidation_TIMESTAMP.migrations.tar.gz

# Restaurar database (se necessário)
TIMESTAMP="YYYYMMDD_HHMMSS"
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose exec -T postgres psql -U acrobaticz_user < \
  backups/pre_consolidation_${TIMESTAMP}.database.sql
```

---

## 📖 Documentação Completa

Para guia detalhado com screenshots e troubleshooting:

👉 [MIGRATION_CONSOLIDATION_GUIDE.md](./MIGRATION_CONSOLIDATION_GUIDE.md)

---

## 🧪 Testes Automáticos

Validar consolidação sem Docker:

```bash
bash scripts/test-consolidation.sh
```

Validar com Docker completo:

```bash
bash scripts/test-consolidation.sh --full
```

---

## ⚙️ Opções Avançadas

### Dry-Run (Simular sem Fazer)

```bash
bash scripts/consolidate-migrations.sh --dry-run
# Mostra o que seria feito, sem fazer realmente
```

### Sem Backups

```bash
bash scripts/consolidate-migrations.sh --no-backup
# Se já fez backup manual, pula etapa de backup
```

---

## 📊 O Que Muda Para Novos Usuários

**Antes (29 migrações):**
```bash
docker-compose up -d
# ⏳ Aguarda 15-30 segundos (29 migrations sequenciais)
# ⚠️  Mais pontos de falha possíveis
```

**Depois (1 migração):**
```bash
docker-compose up -d
# ⏳ Aguarda ~5 segundos (1 migration)
# ✅ Mais confiável, mais rápido
```

---

## 🎯 Próximas Etapas (After Consolidation)

Após validar consolidação:

1. **Phase 4:** Implementar componente `StepStorage.tsx` (wizard MinIO)
2. **Phase 5:** Criar middleware de auto-redirect (`/setup` → `/setup/install`)
3. **Final:** Acrobaticz pronto como "Elite" setup para distribuição!

---

## ❓ Perguntas Frequentes

**P: Preciso consolidar?**
A: Não, mas é **fortemente recomendado** para:
- Produção (1 migração mais rápida)
- Novos usuários (menos linhas para debug)
- Repo size (menos commits de migration)

**P: Posso usar em DB com dados?**
A: SIM! Script:
1. Faz backup ANTES
2. Testa em DB vazia
3. Opcionalmente restaura dados ao final

**P: E se não quiser os dados antigos?**
A: Simples:
```bash
docker-compose down -v
docker-compose up -d
# Novo DB vazio com schema consolidado
```

**P: Posso adicionar migrations depois?**
A: SIM! Funciona 100% normal:
```bash
npx prisma migrate dev --name add_new_table
# Cria: 20260115000000_add_new_table/migration.sql
```

---

## 📞 Suporte

Se encontrar problemas:

1. Ver log completo:
   ```bash
   cat /tmp/consolidate-migrations_*.log
   ```

2. Fazer dry-run:
   ```bash
   bash scripts/consolidate-migrations.sh --dry-run
   ```

3. Fazer rollback se necessário:
   ```bash
   git reset --hard HEAD~1
   ```

4. Consultar guia completo:
   👉 [MIGRATION_CONSOLIDATION_GUIDE.md](./MIGRATION_CONSOLIDATION_GUIDE.md)

---

## 📚 Recursos

- [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate/overview)
- [Prisma Squash Migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/16/backup.html)

---

**🎉 Pronto? Bora consolidar!**

```bash
cd /path/to/Acrobaticz
docker-compose up -d postgres
bash scripts/consolidate-migrations.sh
```
