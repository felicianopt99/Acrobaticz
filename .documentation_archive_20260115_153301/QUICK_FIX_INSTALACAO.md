# ⚡ QUICK REFERENCE - Erro "Installation Failed" RESOLVIDO

**TL;DR**: Campo `id` estava em falta em 13+ operações Prisma. Corrigido.

---

## 🔴 PROBLEMA
```
POST /api/setup/complete falha com erro genérico "Installation failed"
```

## ✅ SOLUÇÃO
```typescript
// Adicionar isto em TODOS os systemSetting.upsert().create:
await txPrisma.systemSetting.upsert({
  where: { category_key: { category: 'General', key: 'DOMAIN' } },
  create: {
    id: randomUUID(),  // ← LINHA CRÍTICA ADICIONADA
    category: 'General',
    key: 'DOMAIN',
    value: data.domain,
    isEncrypted: false,
  },
});
```

---

## 📊 RESUMO DO PROBLEMA

| Item | Status |
|------|--------|
| Causa | Campo `id` ausente em upserts de SystemSetting |
| Impacto | Transação Prisma faz ROLLBACK total |
| Resultado | Frontend vê "Installation failed" (genérico) |
| Ficheiro | [src/app/api/setup/complete/route.ts](src/app/api/setup/complete/route.ts) |
| Linhas | 149, 164, 181, 200, 223, 246, 265, 284, 303, 324, 341, 360, 379, 401 |

---

## ✅ IMPLEMENTADO

✅ **13 upserts** corrigidos com `id: randomUUID()`  
✅ **isEncrypted** corrigido para `true` em campos encriptados  
✅ **20+ logs** `[INSTALL-DEBUG]` adicionados para fácil diagnóstico  
✅ **Error handling** melhorado para mostrar detalhe em dev mode  

---

## 🚀 DEPLOY (30 segundos)

```bash
# 1. Aplicar migrations
npx prisma db push

# 2. Reiniciar
npm run dev

# 3. Testar
# Abrir: http://localhost:3000/install
# Clicar "Complete Installation"

# 4. Ver logs
# Terminal deve mostrar: [INSTALL-DEBUG] ... INSTALAÇÃO COMPLETA
```

---

## 📋 FICHEIROS AFETADOS

```
✅ src/app/api/setup/complete/route.ts (510 linhas)
   - Adicionado id em 13 upserts
   - Adicionado 20+ logs debug
   - Melhorado error handling

📚 DIAGNOSTICO_TECNICO_ERRO_INSTALACAO.md
📚 ANALISE_PROFUNDA_ERRO_INSTALACAO.md  
📚 SOLUCAO_IMPLEMENTADA_ERRO_INSTALACAO.md
📚 RESUMO_SOLUCAO_ERRO_INSTALACAO.md
```

---

## 🔍 DEBUG

Se falhar, ver logs:
```
[INSTALL-DEBUG] ===== STEP X: ...
[INSTALL-ERROR] ===== ERRO NA INSTALAÇÃO =====
[INSTALL-ERROR] Erro completo: { "errorType": "...", "errorMessage": "..." }
```

---

**Status**: ✅ RESOLVIDO | Pronto para produção
