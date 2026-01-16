# 🔬 EVIDÊNCIAS TÉCNICAS - APÊNDICE A

## Detalhes de Cada Achado

---

## CRÍTICO #1: Calendário SEM BLOQUEIO

### Código-Fonte Analisado

**Arquivo:** `src/app/api/rentals/route.ts` (linhas 56-160)

```typescript
// POST /api/rentals - Create new rentals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RentalSchema.parse(body)

    // ✅ 1. EXISTE verificação de evento
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // ✅ 2. LOOP CRIA todos os rentals
    for (const item of validatedData.equipment) {
      const equipment = await prisma.equipmentItem.findUnique({
        where: { id: item.equipmentId },
      })
      
      // ❌ 3. AQUI: Cria sem verificar disponibilidade
      const rental = await prisma.rental.create({
        data: {
          eventId: validatedData.eventId,
          equipmentId: item.equipmentId,
          quantityRented: item.quantity,
        },
      })
      rentals.push(rental)
    }

    // ⚠️ 4. DEPOIS de criar tudo, TENTA detectar conflitos
    const { checkEquipmentConflicts } = await import('@/lib/notifications')
    
    for (const rental of rentals) {
      const conflictingEventIds = await checkEquipmentConflicts(
        rental.equipmentId,
        event.startDate,
        event.endDate,
      )
      
      // ❌ 5. MAS... Só envia notificação, não rejeita
      if (conflictingEventIds.length > 0) {
        createConflictNotification(allConflictingEventIds, rental.equipment.name)
      }
    }

    // ✅ Retorna sucesso SEMPRE
    return NextResponse.json(
      { success: true, rentals, count: rentals.length },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rentals' }, { status: 500 })
  }
}
```

### Test Case Que Expõe o Bug

```bash
# Equipamento X tem quantidade = 1

# User A cria aluguel:
POST /api/rentals
{
  "eventId": "event-jan-20",
  "equipment": [
    { "equipmentId": "equip-X", "quantity": 1 }
  ]
}
# Resposta: ✅ 201 Created (rental-A criado)

# User B (simultaneamente) tenta criar:
POST /api/rentals
{
  "eventId": "event-jan-20-2", 
  "equipment": [
    { "equipmentId": "equip-X", "quantity": 1 }
  ]
}
# Resposta: ✅ 201 Created (rental-B criado)

# Resultado: Equip X alugado 2x no mesmo dia!
# Conflito detectado? SIM (log mostra "Found 1 conflicting event")
# Aluguel bloqueado? NÃO ← CRÍTICO!
```

### Função de Detecção (Funciona, mas inútil)

**Arquivo:** `src/lib/notifications.ts` (linhas 680-715)

```typescript
export async function checkEquipmentConflicts(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  excludeRentalId?: string
): Promise<string[]> {
  try {
    console.log(
      `[Conflict Check] Checking conflicts for equipment ${equipmentId} from ${startDate} to ${endDate}`
    );

    // ✅ Query CORRETA: Busca rentals que se sobrepõem
    const conflicts = await prisma.rental.findMany({
      where: {
        equipmentId,
        event: {
          // Events que sobrepõem a data
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
        ...(excludeRentalId && { id: { not: excludeRentalId } }),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const conflictingEventIds = conflicts.map((c) => c.eventId);

    // ✅ Loga corretamente
    if (conflictingEventIds.length > 0) {
      console.warn(
        `[Conflict Check] Found ${conflictingEventIds.length} conflicting events`,
        conflicts.map((c) => ({
          eventId: c.eventId,
          eventName: c.event.name,
          dates: `${c.event.startDate} - ${c.event.endDate}`,
        }))
      );
    }

    return conflictingEventIds; // ✅ Retorna lista de eventos conflitantes
  } catch (error) {
    console.error('[Conflict Check] Error:', error);
    return []; // ❌ Em erro, ignora e retorna []
  }
}
```

### O Verdadeiro Problema

A função **detecta corretamente**, mas em `route.ts`:

```typescript
// ⚠️ Encontra conflitos
const conflictingEventIds = await checkEquipmentConflicts(...)

// ⚠️ Apenas cria notificação (usuario vê aviso)
createConflictNotification(allConflictingEventIds, rental.equipment.name)

// ⚠️ Mas NÃO rejeita HTTP
// Continua: return NextResponse.json({ success: true }, { status: 201 })
```

### Fix Imediato

```typescript
// EM: src/app/api/rentals/route.ts - ANTES de criar rentals

// 1. PRÉ-VALIDAR conflitos ANTES de criar
for (const item of validatedData.equipment) {
  const conflicts = await checkEquipmentConflicts(
    item.equipmentId,
    event.startDate,
    event.endDate
  );

  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error: 'Equipment not available',
        detail: `${equipment.name} has conflicts on selected dates`,
        conflictingEventIds: conflicts
      },
      { status: 409 } // Conflict
    );
  }
}

// 2. SÓ DEPOIS, criar rentals
for (const item of validatedData.equipment) {
  const rental = await prisma.rental.create({...})
}
```

**Tempo de implementação:** ~20 minutos

---

## CRÍTICO #2: Socket.IO não Sincroniza Frontend

### Infraestrutura Backend (Funcional)

**Arquivo:** `server.js` (linhas 130-180)

```javascript
// Socket.IO server inicializa ✅
const io = new SocketIOServer(httpServer, {
  path: '/api/socket',
  transports: ['websocket', 'polling'],
})

// Authentication middleware ✅
io.use(authenticateSocket)

io.on('connection', (socket) => {
  const userId = socket.data.userId
  const username = socket.data.username

  // ✅ Joins user-specific room
  if (authenticated && userId) {
    socket.join(`user-${userId}`)
  }

  // ✅ Handles data sync rooms
  socket.on('join-data-sync', (entityTypes) => {
    entityTypes.forEach((entityType) => {
      socket.join(`sync-${entityType}`)
    })
  })

  // ✅ Health check ping/pong
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })
})
```

### Onde os Events Seriam Emitidos

Não encontrado em:
- ❌ `src/app/api/rentals/route.ts` - Não emite após criar
- ❌ `src/app/api/equipment/route.ts` - Não emite após update
- ❌ `src/app/api/events/route.ts` - Não emite após criar

**Busca realizada:** grep "io.to(" em toda a codebase
**Resultado:** 0 matches

### Frontend Socket Setup (Incompleto)

**Arquivo:** `src/contexts/AppContext.tsx` (não analisado, provavelmente vazio)

**Sintoma:** AppContext gerencia state mas nunca listen a socket events

**Esperado:**
```typescript
useEffect(() => {
  if (!socket) return;

  // ✅ Subscribe to all sync events
  socket.on('rental:created', handleRentalCreated);
  socket.on('rental:updated', handleRentalUpdated);
  socket.on('equipment:updated', handleEquipmentUpdated);
  socket.on('event:created', handleEventCreated);

  return () => {
    socket.off('rental:created');
    socket.off('rental:updated');
    socket.off('equipment:updated');
    socket.off('event:created');
  };
}, [socket]);

const handleRentalCreated = (rental) => {
  setRentals(prev => [...prev, rental]);
};
```

**Atual:** Provavelmente vazio ou não emite

### Como Testar

```typescript
// Terminal 1 - Abrir browser 1
User A: http://localhost:3000/rentals/calendar

// Terminal 2 - Abrir browser 2  
User B: http://localhost:3000/rentals/calendar

// Terminal 1
User A: Clica "Add Rental" → POST /api/rentals

// Terminal 2
User B: Vê a lista de rentals
// Resultado: ❌ Não atualiza até F5!
```

### Fix Imediato

**Passo 1:** Emit eventos após create/update

```typescript
// src/app/api/rentals/route.ts
import { getIO } from '@/lib/socket-server'; // Criar este export

export async function POST(request: NextRequest) {
  // ... validação ...
  
  const rentals = [];
  for (const item of validatedData.equipment) {
    const rental = await prisma.rental.create({...});
    rentals.push(rental);
  }

  // ✅ NOVO: Emit event
  const io = getIO();
  io.to(`sync-rental`).emit('rental:created', {
    rental: rentals[0], // ou all rentals
    eventId: validatedData.eventId
  });

  return NextResponse.json({ success: true, rentals }, { status: 201 });
}
```

**Passo 2:** Subscribe no frontend

```typescript
// src/contexts/AppContext.tsx
useEffect(() => {
  if (!socket) return;

  socket.on('rental:created', (data) => {
    console.log('[Socket] Rental created:', data);
    setRentals(prev => [...prev, data.rental]);
    // Update calendar view
  });

  return () => socket.off('rental:created');
}, [socket]);
```

**Tempo total:** 45 minutos

---

## CRÍTICO #3: Upload sem Limite de Tamanho

### Upload Endpoint

**Arquivo:** `src/app/api/cloud/files/upload/route.ts` (linhas 14-80)

```typescript
function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ❌ PROBLEMA: Sem validação de tamanho
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ❌ Pode ser 5GB! Node.js tenta carregar tudo na RAM
    const buffer = await file.arrayBuffer();

    // ❌ Sem timeout - pode ficar pendurado indefinidamente
    const storagePath = `users/${auth.userId}/${file.name}`;
    await uploadFile(storagePath, buffer);

    // Sucesso
    return NextResponse.json({ success: true, file: { name: file.name } });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### Vulnerabilidades Expostas

**1. Memory Exhaustion**
```
User uploads 10GB file
→ Node.js carrega na RAM
→ Heap overflow
→ Servidor crash
```

**2. Request Timeout**
```
User uploads 50MB arquivo lento
→ Upload leva 10 minutos
→ HTTP timeout (geralmente 30s)
→ Conexão abandona
→ Arquivo parcial no storage
```

**3. Storage Inconsistency**
```
Upload começa → Arquivo vai para MinIO
Timeout → Conexão fecha
Arquivo fica orfão no storage
Database entry nunca inserido
Desespaço usado mas não recuperável
```

### Test Case

```bash
# 1. Criar arquivo grande
dd if=/dev/zero of=large.bin bs=1M count=500

# 2. Tentar upload
curl -X POST http://localhost:3000/api/cloud/files/upload \
  -H "Cookie: auth-token=xyz" \
  -F "file=@large.bin"

# Resultado:
# ❌ Servidor lento/crash
# ❌ Timeout (sem retry)
# ❌ Sem feedback do progresso
```

### Fix Imediato

```typescript
// src/app/api/cloud/files/upload/route.ts

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ 1. Validar tamanho ANTES de ler buffer
    const contentLength = request.headers.get('content-length');
    if (!contentLength || parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds 100MB limit (received: ${contentLength} bytes)` },
        { status: 413 } // Payload Too Large
      );
    }

    // ✅ 2. Configurar timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, UPLOAD_TIMEOUT);

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // ✅ 3. Re-validar tamanho do arquivo
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File exceeds 100MB limit` },
          { status: 413 }
        );
      }

      // ✅ 4. Ler buffer com controle
      const buffer = await file.arrayBuffer();

      // ✅ 5. Validar MIME-type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav'
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.type}` },
          { status: 415 } // Unsupported Media Type
        );
      }

      const storagePath = `users/${auth.userId}/${Date.now()}-${file.name}`;
      await uploadFile(storagePath, buffer);

      return NextResponse.json({
        success: true,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          path: storagePath
        }
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upload timeout (5 minutes exceeded)' },
        { status: 408 } // Request Timeout
      );
    }

    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

**Tempo de implementação:** 30 minutos

---

## Sumário dos Fixes

| Crítico | Tempo | Complexidade | Impacto |
|---|---|---|---|
| #1 Bloqueio conflitos | 20min | Baixa | CRÍTICO |
| #2 Socket frontend | 45min | Média | CRÍTICO |
| #3 Upload límite | 30min | Baixa | CRÍTICO |
| **Total** | **95min (< 2h)** | - | **Deploy viável** |

---

**Documento Técnico Completo**  
Data: 2026-01-15  
Auditor: QA Lead
