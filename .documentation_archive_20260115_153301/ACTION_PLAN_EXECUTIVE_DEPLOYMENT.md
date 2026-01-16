# 🚀 PLANO DE AÇÃO EXECUTIVO - DEPLOY SEGURO

**Objetivo:** Corrigir 3 itens críticos + 3 secundários  
**Prazo:** 24 horas para produção segura  
**Versão:** Final  

---

## 📋 TAREFAS CRÍTICAS (Próximas 2h)

### TASK 1: Bloqueio de Conflitos de Calendário

**Responsável:** Backend Developer  
**Tempo:** 20 minutos  
**Severidade:** 🔴 CRÍTICO

**O que fazer:**
1. Abrir `src/app/api/rentals/route.ts`
2. Localizar função `POST` (linha ~56)
3. **ANTES** de criar rentals, validar conflitos
4. Se houver conflitos, retornar HTTP 409 (Conflict)

**Código Exato:**

```typescript
// INSERIR antes do loop de criação (linha ~75)

// PRÉ-VALIDAR conflitos para CADA equipamento
for (const item of validatedData.equipment) {
  const { checkEquipmentConflicts } = await import('@/lib/notifications');
  
  const conflictingEventIds = await checkEquipmentConflicts(
    item.equipmentId,
    event.startDate,
    event.endDate
  );

  if (conflictingEventIds.length > 0) {
    return NextResponse.json(
      {
        error: 'Equipment not available during selected dates',
        detail: 'This equipment is already rented during this period',
        conflictingEventIds,
        suggestedDates: 'Please choose alternative dates'
      },
      { status: 409 }
    );
  }
}

// DEPOIS, criar rentals normalmente
```

**Teste de Aceitação:**
```bash
# Criar 2 aluguéis do mesmo equipamento, mesmos dias
POST /api/rentals (1º aluguel) → 201 ✅
POST /api/rentals (2º aluguel) → 409 ❌ (esperado)
```

---

### TASK 2: Socket.IO Frontend Sync

**Responsável:** Frontend Developer  
**Tempo:** 45 minutos  
**Severidade:** 🔴 CRÍTICO

**Subtarefa 2.1:** Emit eventos no backend (15min)

**Arquivo:** `src/app/api/rentals/route.ts`

```typescript
// NO TOPO do arquivo, adicionar:
import { getIO } from '@/lib/socket-io-server'; // Criar este arquivo!

// NO POST endpoint, após criar rentals (linha ~120):
try {
  const io = getIO();
  
  rentals.forEach(rental => {
    io.to(`sync-rental`).emit('rental:created', {
      rental,
      eventId: validatedData.eventId,
      timestamp: new Date().toISOString()
    });
  });
} catch (error) {
  // Não falha o request se socket.io falhar
  console.warn('[Socket] Falha ao emitir evento:', error);
}
```

**Arquivo novo:** `src/lib/socket-io-server.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setIO(socketIO: SocketIOServer) {
  io = socketIO;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
```

**Arquivo:** `server.js` - Adicionar após inicializar io

```javascript
import { setIO } from './src/lib/socket-io-server.ts';

const io = new SocketIOServer(httpServer, { ... });
setIO(io); // ← ADICIONAR ISTO
```

**Subtarefa 2.2:** Subscribe no Frontend (30min)

**Arquivo:** `src/contexts/AppContext.tsx` (NO useEffect que cuida de socket)

```typescript
// Procurar socket setup existente e ADICIONAR:

useEffect(() => {
  if (!socket) return;

  // Subscribe a eventos de rental
  socket.on('rental:created', (data) => {
    console.log('[Socket] Rental criado:', data.rental);
    setRentals(prev => {
      // Evitar duplicados
      if (prev.find(r => r.id === data.rental.id)) {
        return prev;
      }
      return [...prev, data.rental];
    });
  });

  socket.on('rental:updated', (data) => {
    console.log('[Socket] Rental atualizado:', data.rental);
    setRentals(prev =>
      prev.map(r => r.id === data.rental.id ? data.rental : r)
    );
  });

  socket.on('equipment:updated', (data) => {
    console.log('[Socket] Equipment atualizado:', data.equipment);
    setEquipment(prev =>
      prev.map(e => e.id === data.equipment.id ? data.equipment : e)
    );
  });

  socket.on('event:created', (data) => {
    console.log('[Socket] Event criado:', data.event);
    setEvents(prev => [...prev, data.event]);
  });

  return () => {
    socket.off('rental:created');
    socket.off('rental:updated');
    socket.off('equipment:updated');
    socket.off('event:created');
  };
}, [socket, setRentals, setEquipment, setEvents]);
```

**Teste de Aceitação:**
```bash
# Browser 1: User A
# Browser 2: User B

# User A: Clica "Add Rental" → POST /api/rentals
# User B: Lista de rentals atualiza AUTOMATICAMENTE (sem F5)
# ✅ Esperado: Novo rental aparece em < 1 segundo
```

---

### TASK 3: Upload File Size Limit + Timeout

**Responsável:** Backend Developer  
**Tempo:** 30 minutos  
**Severidade:** 🔴 CRÍTICO

**Arquivo:** `src/app/api/cloud/files/upload/route.ts`

```typescript
// NO TOPO, adicionar constantes:
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// SUBSTITUIR função POST inteira com:

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ 1. Validar Content-Length ANTES de ler
    const contentLength = request.headers.get('content-length');
    if (!contentLength) {
      return NextResponse.json(
        { error: 'Content-Length header required' },
        { status: 411 }
      );
    }

    const fileSizeBytes = parseInt(contentLength);
    if (fileSizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum: 100MB, Provided: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 413 } // Payload Too Large
      );
    }

    // ✅ 2. Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, UPLOAD_TIMEOUT);

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // ✅ 3. Re-validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { 
            error: `File exceeds 100MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
          },
          { status: 413 }
        );
      }

      // ✅ 4. Validar MIME-type
      const ALLOWED_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/aac',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.type}` },
          { status: 415 } // Unsupported Media Type
        );
      }

      const buffer = await file.arrayBuffer();

      // ✅ 5. Upload com nome único
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `users/${auth.userId}/${timestamp}-${safeFileName}`;

      await uploadFile(storagePath, buffer);

      // ✅ 6. Registar na BD
      const cloudFile = await prisma.cloudFile.create({
        data: {
          name: file.name,
          originalName: safeFileName,
          mimeType: file.type,
          size: BigInt(file.size),
          storagePath,
          ownerId: auth.userId,
          url: `/api/cloud/files/download/${storagePath}`,
        },
      });

      return NextResponse.json({
        success: true,
        file: {
          id: cloudFile.id,
          name: cloudFile.name,
          size: Number(cloudFile.size),
          mimeType: cloudFile.mimeType,
          url: cloudFile.url,
        },
      }, { status: 201 });

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Upload timeout (5 minutes exceeded)' },
          { status: 408 }
        );
      }
      
      console.error('[Upload] Error:', error.message);
    }

    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

**Teste de Aceitação:**
```bash
# 1. Arquivo normal (< 100MB)
POST /api/cloud/files/upload (file.pdf 10MB)
# ✅ 201 Created

# 2. Arquivo grande (> 100MB)  
POST /api/cloud/files/upload (file.iso 500MB)
# ✅ 413 Payload Too Large

# 3. Arquivo inválido (type)
POST /api/cloud/files/upload (file.exe)
# ✅ 415 Unsupported Media Type

# 4. Upload lento (> 5min)
POST /api/cloud/files/upload (file-over-network-slow)
# ✅ 408 Request Timeout (após 5min)
```

---

## 🔧 TAREFAS SECUNDÁRIAS (Próximas 6h)

### TASK 4: Ownership Check em Rentals

**Responsável:** Backend Developer  
**Tempo:** 1 hora  
**Severidade:** 🟠 ALTO

**Arquivo:** `src/app/api/rentals/route.ts`

```typescript
// PATCH endpoint (caso exista para atualizar rental):

async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  const { id } = params;

  // ✅ Validar ownership
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { event: true }
  });

  if (!rental) {
    return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
  }

  // Verificar se user é owner do evento
  if (rental.event.createdBy !== auth.userId && auth.role !== 'Admin') {
    return NextResponse.json(
      { error: 'Not authorized to modify this rental' },
      { status: 403 }
    );
  }

  // Continuar com update...
}

// DELETE endpoint:
async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  const { id } = params;

  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { event: true }
  });

  if (!rental) {
    return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
  }

  // ✅ Mesma validação
  if (rental.event.createdBy !== auth.userId && auth.role !== 'Admin') {
    return NextResponse.json(
      { error: 'Not authorized to delete this rental' },
      { status: 403 }
    );
  }

  // Soft-delete
  await prisma.rental.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ success: true });
}
```

---

### TASK 5: Soft-Delete Query Filter

**Responsável:** Backend Developer  
**Tempo:** 1 hora  
**Severidade:** 🟠 ALTO

**Arquivo:** `src/app/api/equipment/route.ts` (GET endpoint)

```typescript
// ANTES:
const equipment = await prisma.equipmentItem.findMany();

// DEPOIS:
const equipment = await prisma.equipmentItem.findMany({
  where: { deletedAt: null }, // ✅ Filtrar apagados
  orderBy: { createdAt: 'desc' }
});
```

**Buscar todos os GET endpoints de:** equipment, categories, clients, etc.

**Ferramenta:** 
```bash
grep -r "findMany()" src/app/api/ | grep -v "where:"
# Encontrar endpoints que faltam filtro deletedAt
```

---

### TASK 6: API Rate Limiting

**Responsável:** DevOps / Backend  
**Tempo:** 1.5 horas  
**Severidade:** 🟠 ALTO (prevenção de abuse)

**Implementação via Middleware:**

**Arquivo:** `src/lib/rate-limit.ts` (novo)

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60 * 1000 // 1 minuto
) {
  const now = Date.now();
  const key = identifier;

  if (!store[key] || store[key].resetTime < now) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return true;
  }

  store[key].count++;

  if (store[key].count > limit) {
    return false;
  }

  return true;
}

export function createRateLimitMiddleware(limit: number = 60) {
  return (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const allowed = rateLimit(ip, limit);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  };
}
```

**Uso em endpoints críticos:**

```typescript
// src/app/api/rentals/route.ts
import { createRateLimitMiddleware } from '@/lib/rate-limit';

const rateLimitCheck = createRateLimitMiddleware(30); // 30 req/min

export async function POST(request: NextRequest) {
  // Verificar rate limit
  const limitResponse = rateLimitCheck(request);
  if (limitResponse) return limitResponse;

  // ... resto da lógica
}
```

---

## 📊 CHECKLIST PRÉ-DEPLOY

- [ ] **Code Review** dos 3 fixes críticos (2 pessoas)
- [ ] **Unit tests** novos para conflitos, socket, upload
- [ ] **Integration tests** - teste multi-user simultaneamente
- [ ] **Load test** - 50 users simultâneos por 5 minutos
- [ ] **Security scan** - OWASP top 10 (SQL injection, XSS, etc.)
- [ ] **Backup atual** antes de deploy
- [ ] **Rollback plan** documentado (como reverter em 5 minutos)
- [ ] **Monitoring setup** - alertas para 500 errors, latência > 2s
- [ ] **Documentation** atualizado
- [ ] **Stakeholders informed** sobre changes

---

## 🚨 DEPLOY CHECKLIST (DIA DA PRODUÇÃO)

```bash
# 1. Parar app (5 min downtime)
docker-compose down

# 2. Backup database
pg_dump postgresql://user:pass@host/db > backup-pre-deploy.sql

# 3. Pull latest code
git pull origin main

# 4. Apply migrations
npm run db:migrate

# 5. Build
npm run build

# 6. Start app
docker-compose up -d

# 7. Verificar health
curl http://localhost:3000/api/health

# 8. Smoke tests (10 minutos)
- [ ] Login
- [ ] Create rental (sem conflitos)
- [ ] Tentar rental com conflito (deve falhar 409)
- [ ] Socket sync (2 browsers abertos)
- [ ] File upload

# 9. Monitor por 30 minutos
- [ ] Logs sem errors
- [ ] Performance normal
- [ ] No database locks
```

---

## ⏱️ TIMELINE PROPOSTA

| Hora | Tarefa | Responsável |
|---|---|---|
| **09:00** | Briefing da equipa | PM |
| **09:15** | TASK 1 (Conflitos) | Backend Dev |
| **09:35** | TASK 2.1 (Socket backend) | Backend Dev |
| **09:50** | TASK 2.2 (Socket frontend) | Frontend Dev |
| **10:35** | TASK 3 (Upload) | Backend Dev |
| **11:05** | **CODE REVIEW** | 2 devs |
| **11:35** | UNIT TESTS | QA / Dev |
| **12:35** | INTEGRATION TESTS | QA |
| **13:35** | **Almoço** | - |
| **14:35** | Load Testing | DevOps |
| **15:35** | Security Scan | DevOps |
| **16:35** | Documentation | Tech Writer |
| **17:35** | **DEPLOY STAGING** | DevOps |
| **18:35** | Final smoke tests | QA |
| **19:35** | **DEPLOY PRODUCTION** | DevOps |
| **20:00** | Monitorar por 1h | On-call |

---

## 💬 COMUNICAÇÃO COM STAKEHOLDERS

**Subject:** Acrobaticz Deploy - Janela de Manutenção 15h-20h

```
Caros stakeholders,

Faremos deploy de correções críticas em segurança e performance.

⏰ JANELA DE DOWNTIME: 15h00 - 20h00 (5 minutos esperados)

🔧 O que está a ser corrigido:
1. Bloqueio de calendário conflitos (equipamentos overbooking)
2. Sincronização em tempo real (Socket.IO)
3. Limite de upload (prevenção memory crash)

✅ Esperado após deploy: Sistema 40% mais robusto

📞 Contato emergencial: ops@company.com

Obrigado,
QA Lead
```

---

## 📞 ROLLBACK PROCEDURE

Se algo der errado:

```bash
# 1. Reverter código
git revert HEAD

# 2. Rebuild
npm run build

# 3. Restart
docker-compose restart app

# 4. Restaurar database (se necessário)
psql postgresql://user:pass@host/db < backup-pre-deploy.sql

# 5. Verificar health
curl http://localhost:3000/api/health
```

**Tempo total:** ~10 minutos

---

## 📋 PRÓXIMOS PASSOS (Pós-Deploy)

- [ ] Monitor performance por 7 dias
- [ ] Coletar feedback de users
- [ ] Preparar TASK 4-6 para deploy na próxima semana
- [ ] Criar testes automáticos para prevenir regressões

---

**Plano de Ação Criado:** 2026-01-15  
**Versão:** 1.0 - FINAL  
**Status:** PRONTO PARA EXECUÇÃO
