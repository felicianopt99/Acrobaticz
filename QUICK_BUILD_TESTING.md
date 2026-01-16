# 🚀 ACROBATICZ - QUICK START BUILD TESTING

## 📍 Status Atual

**✅ PRÉ-BUILD VALIDATION: PASSOU**
- Docker environment: Configurado
- Dockerfile: Multi-stage otimizado com Alpine
- .dockerignore: Completo com 155 padrões
- package.json: Válido com 81 + 17 dev dependencies
- Prisma: Schema válido com 46 modelos
- TypeScript: Modo strict ativado
- Disco: 174GB disponível
- Estimativa de build: ~70 segundos

---

## 🎯 PRÓXIMOS PASSOS

### Opção 1: Teste de Build Completo (Recomendado)

```bash
cd /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz

# Teste básico com output limpo
bash scripts/test-production-build.sh

# Teste com logs detalhados (para debugging)
bash scripts/test-production-build.sh --verbose

# Manter imagem após build (para inspeção)
bash scripts/test-production-build.sh --skip-cleanup
```

### Opção 2: Build Rápido com Docker CLI (Alternativa)

```bash
cd /media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz

# Build com --no-cache (simula ambiente clean)
DOCKER_BUILDKIT=1 docker build --no-cache \
  --progress=plain \
  --tag acrobaticz-prod:test \
  -f Dockerfile .

# Ver tamanho da imagem
docker images | grep acrobaticz-prod

# Testar container
docker run --rm -d \
  --name acrobaticz-test \
  acrobaticz-prod:test

docker logs acrobaticz-test
docker rm -f acrobaticz-test
```

### Opção 3: Build com Variáveis de Ambiente

```bash
# Se precisar passar vars específicas para o build:
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_TELEMETRY_DISABLED=1 \
  -t acrobaticz-prod:v1 .
```

---

## 🔍 O QUE O BUILD VAI FAZER

### Stage 1: Dependencies (10-15s)
1. ✅ Base image: node:22-alpine
2. ✅ Instala openssl e curl
3. ✅ npm ci --omit=dev (production dependencies only)
4. ✅ Clean cache

### Stage 2: Builder (50-60s)
1. ✅ Cópia de node_modules da stage 1
2. ✅ Copia package.json/package-lock.json
3. ✅ **Gera Prisma Client**: `npx prisma generate`
4. ✅ Copia código fonte
5. ✅ **Compila Next.js**: `npm run build`
6. ✅ Valida `.next/standalone` (verificação crítica)

### Stage 3: Runtime (10s)
1. ✅ Base image: node:22-alpine (limpa)
2. ✅ Copia apenas `.next/standalone` + `public` + `prisma`
3. ✅ Cria user não-root (`nextjs:1001`)
4. ✅ Configura health check
5. ✅ Tini como PID 1 (signal handling)

---

## 📊 MÉTRICAS & BENCHMARKS

| Métrica | Valor Esperado | Seu Sistema |
|---------|----------------|------------|
| Node.js | 22-alpine | ✅ OK |
| npm | 9.2.0 | ✅ OK |
| Tamanho .next | 50-100MB | ? |
| Tamanho final imagem | 280-350MB | ? |
| Tempo build | 60-90s | ~ 70s |
| Memory (peak) | 1-2GB | ? |

---

## 🐛 TROUBLESHOOTING RÁPIDO

### ❌ "FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed"
**Causa:** Memória insuficiente durante compilação  
**Solução:** Aumentar `NODE_OPTIONS` em Dockerfile
```dockerfile
# De:
NODE_OPTIONS="--max_old_space_size=4096"

# Para:
NODE_OPTIONS="--max_old_space_size=8192"
```

### ❌ "Cannot find module '@/components'"
**Causa:** Path alias não resolvido  
**Solução:** Verificar tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ❌ "Prisma Client generation failed"
**Causa:** Schema inválido ou DATABASE_URL faltante  
**Solução:**
```bash
npx prisma validate
npx prisma generate
```

### ❌ "Error: ENOENT: no such file..."
**Causa:** Arquivo não copiado ao build context  
**Solução:** Verificar .dockerignore
```bash
# Ver o que será copiado
docker build --progress=plain --dry-run .
```

### ⏱️ "Build muito lento (>3 minutos)"
**Possíveis causas:**
- Cache de Docker desativado (`--no-cache`)
- Disco muito lento
- Sistema sobrecarregado
- Dependências muito pesadas

**Soluções:**
```bash
# Limpar cache Docker
docker system prune -a

# Usar buildkit mais eficiente
DOCKER_BUILDKIT=1 docker build .

# Verificar espaço
df -h
```

---

## 📝 FILES CRIADOS/ATUALIZADOS

```
scripts/
├── test-production-build.sh     ← Script principal de teste
└── diagnose-build.sh             ← Diagnóstico rápido

.env                              ← Atualizado com DATABASE_URL
BUILD_ANALYSIS.md                ← Este documento
```

---

## ✨ PRÓXIMOS PASSOS APÓS BUILD SUCESSO

1. **Medir tamanho real da imagem**
   ```bash
   docker images acrobaticz-prod-test
   docker history acrobaticz-prod-test:latest --human --no-trunc
   ```

2. **Testar container em modo daemon**
   ```bash
   docker run -d \
     --name acrobaticz-prod-test \
     -p 3000:3000 \
     -e DATABASE_URL="postgres://..." \
     acrobaticz-prod-test:latest
   ```

3. **Validar health check**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Verificar logs**
   ```bash
   docker logs acrobaticz-prod-test
   ```

5. **Enviar para registry (se necessário)**
   ```bash
   docker tag acrobaticz-prod-test:latest your-registry/acrobaticz:prod
   docker push your-registry/acrobaticz:prod
   ```

---

## 🎓 RECURSOS ADICIONAIS

- **Dockerfile best practices**: https://docs.docker.com/develop/dev-best-practices/dockerfile
- **Next.js production**: https://nextjs.org/docs/deployment
- **Prisma Docker**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker
- **Node.js Alpine**: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md

---

## 📞 COMANDOS RÁPIDOS DE REFERÊNCIA

```bash
# Diagnóstico rápido (sem build)
bash scripts/diagnose-build.sh

# Build completo com teste
bash scripts/test-production-build.sh

# Build apenas (sem testes)
docker build -t acrobaticz:prod .

# Ver imagens
docker images | grep acrobaticz

# Ver histórico de layers
docker history acrobaticz:prod --human

# Entrar no container
docker run -it acrobaticz:prod /bin/sh

# Verificar tamanho dos diretórios
docker run --rm acrobaticz:prod du -sh /app/*

# Logs de build detalhados
DOCKER_BUILDKIT=1 docker build --progress=plain .

# Limpar Docker cache
docker system prune -a -f
```

---

**Última atualização:** 15 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para teste de build
