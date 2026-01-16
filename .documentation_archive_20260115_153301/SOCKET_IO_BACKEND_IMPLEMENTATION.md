# 🔧 SOCKET.IO - Backend Implementation Guide

## 📌 O que Precisa Ser Feito no Backend

O frontend está 100% pronto para receber eventos Socket.IO. Agora, o backend precisa de **emitir os eventos** quando dados são criados, atualizados ou apagados.

---

## 🚀 Quick Implementation Guide

Para cada operação no backend (create, update, delete), adicione uma emissão do evento Socket.IO.

### Padrão Geral

```typescript
// 1. Importar o Socket.IO
import { getSocketIO } from '@/lib/socket-server';

// 2. Na sua API endpoint, após criar/atualizar/apagar:
const io = getSocketIO();
if (io) {
  io.to('sync-entity-type').emit('entity:action', data);
}
```

---

## 📝 Implementações Específicas

### RENTALS (Aluguéis)

#### 📍 Ficheiro: `src/pages/api/rentals.ts` ou `src/app/api/rentals/route.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Rental
export async function createRental(rentalData) {
  const rental = await db.rental.create(rentalData);
  
  // Emitir evento para todos os clientes
  const io = getSocketIO();
  if (io) {
    io.to('sync-rental').emit('rental:created', rental);
  }
  
  return rental;
}

// UPDATE Rental
export async function updateRental(id, rentalData) {
  const rental = await db.rental.update(id, rentalData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-rental').emit('rental:updated', rental);
  }
  
  return rental;
}

// DELETE Rental
export async function deleteRental(id) {
  await db.rental.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-rental').emit('rental:deleted', id);
  }
}
```

---

### EQUIPMENT (Equipamento)

#### 📍 Ficheiro: `src/pages/api/equipment.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Equipment
export async function createEquipment(equipmentData) {
  const equipment = await db.equipment.create(equipmentData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-equipment').emit('equipment:created', equipment);
  }
  
  return equipment;
}

// UPDATE Equipment
export async function updateEquipment(id, equipmentData) {
  const equipment = await db.equipment.update(id, equipmentData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-equipment').emit('equipment:updated', equipment);
  }
  
  return equipment;
}

// DELETE Equipment
export async function deleteEquipment(id) {
  await db.equipment.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-equipment').emit('equipment:deleted', id);
  }
}
```

---

### EVENTS (Eventos)

#### 📍 Ficheiro: `src/pages/api/events.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Event
export async function createEvent(eventData) {
  const event = await db.event.create(eventData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-event').emit('event:created', event);
  }
  
  return event;
}

// UPDATE Event
export async function updateEvent(id, eventData) {
  const event = await db.event.update(id, eventData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-event').emit('event:updated', event);
  }
  
  return event;
}

// DELETE Event
export async function deleteEvent(id) {
  await db.event.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-event').emit('event:deleted', id);
  }
}
```

---

### CLIENTS (Clientes)

#### 📍 Ficheiro: `src/pages/api/clients.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Client
export async function createClient(clientData) {
  const client = await db.client.create(clientData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-client').emit('client:created', client);
  }
  
  return client;
}

// UPDATE Client
export async function updateClient(id, clientData) {
  const client = await db.client.update(id, clientData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-client').emit('client:updated', client);
  }
  
  return client;
}

// DELETE Client
export async function deleteClient(id) {
  await db.client.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-client').emit('client:deleted', id);
  }
}
```

---

### CATEGORIES (Categorias)

#### 📍 Ficheiro: `src/pages/api/categories.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Category
export async function createCategory(categoryData) {
  const category = await db.category.create(categoryData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-category').emit('category:created', category);
  }
  
  return category;
}

// UPDATE Category
export async function updateCategory(id, categoryData) {
  const category = await db.category.update(id, categoryData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-category').emit('category:updated', category);
  }
  
  return category;
}

// DELETE Category
export async function deleteCategory(id) {
  await db.category.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-category').emit('category:deleted', id);
  }
}
```

---

### SUBCATEGORIES (Subcategorias)

#### 📍 Ficheiro: `src/pages/api/subcategories.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Subcategory
export async function createSubcategory(subcategoryData) {
  const subcategory = await db.subcategory.create(subcategoryData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-subcategory').emit('subcategory:created', subcategory);
  }
  
  return subcategory;
}

// UPDATE Subcategory
export async function updateSubcategory(id, subcategoryData) {
  const subcategory = await db.subcategory.update(id, subcategoryData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-subcategory').emit('subcategory:updated', subcategory);
  }
  
  return subcategory;
}

// DELETE Subcategory
export async function deleteSubcategory(id) {
  await db.subcategory.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-subcategory').emit('subcategory:deleted', id);
  }
}
```

---

### QUOTES (Orçamentos)

#### 📍 Ficheiro: `src/pages/api/quotes.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE Quote
export async function createQuote(quoteData) {
  const quote = await db.quote.create(quoteData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-quote').emit('quote:created', quote);
  }
  
  return quote;
}

// UPDATE Quote
export async function updateQuote(id, quoteData) {
  const quote = await db.quote.update(id, quoteData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-quote').emit('quote:updated', quote);
  }
  
  return quote;
}

// DELETE Quote
export async function deleteQuote(id) {
  await db.quote.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-quote').emit('quote:deleted', id);
  }
}
```

---

### USERS (Utilizadores)

#### 📍 Ficheiro: `src/pages/api/users.ts` ou `src/app/api/users/route.ts`

```typescript
import { getSocketIO } from '@/lib/socket-server';

// CREATE User
export async function createUser(userData) {
  const user = await db.user.create(userData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-user').emit('user:created', user);
  }
  
  return user;
}

// UPDATE User
export async function updateUser(id, userData) {
  const user = await db.user.update(id, userData);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-user').emit('user:updated', user);
  }
  
  return user;
}

// DELETE User
export async function deleteUser(id) {
  await db.user.delete(id);
  
  const io = getSocketIO();
  if (io) {
    io.to('sync-user').emit('user:deleted', id);
  }
}
```

---

## ⚡ Forma Mais Fácil: Hooks de Base de Dados

Se usar Prisma middleware, pode centralizar isto:

```typescript
// src/lib/socket-middleware.ts
import { getSocketIO } from '@/lib/socket-server';

export function registerSocketMiddleware(prisma) {
  const io = getSocketIO();

  // User events
  prisma.$use(async (params, next) => {
    const result = await next(params);
    
    if (params.model === 'User' && io) {
      switch (params.action) {
        case 'create':
          io.to('sync-user').emit('user:created', result);
          break;
        case 'update':
          io.to('sync-user').emit('user:updated', result);
          break;
        case 'delete':
          io.to('sync-user').emit('user:deleted', result.id);
          break;
      }
    }
    
    // Equipment events
    if (params.model === 'Equipment' && io) {
      switch (params.action) {
        case 'create':
          io.to('sync-equipment').emit('equipment:created', result);
          break;
        case 'update':
          io.to('sync-equipment').emit('equipment:updated', result);
          break;
        case 'delete':
          io.to('sync-equipment').emit('equipment:deleted', result.id);
          break;
      }
    }
    
    // ... repeat for all other models
    
    return result;
  });
}
```

**Uso:**
```typescript
// src/lib/db.ts
import { registerSocketMiddleware } from './socket-middleware';

const prisma = new PrismaClient();
registerSocketMiddleware(prisma);

export default prisma;
```

---

## 🧪 Testes para Verificar

Depois de implementar as emissões no backend:

### Teste 1: Create Event
```bash
# 1. Abrir DevTools no Frontend (F12 > Console)
# 2. Criar novo item via API
# 3. Verificar log: [Socket.IO] <entity>:created - <id>
```

### Teste 2: Update Event
```bash
# 1. Atualizar item via API
# 2. Verificar log: [Socket.IO] <entity>:updated - <id>
```

### Teste 3: Delete Event
```bash
# 1. Apagar item via API
# 2. Verificar log: [Socket.IO] <entity>:deleted - <id>
```

### Teste 4: Multi-Tab Sync
```bash
# 1. Abrir 2 abas da aplicação
# 2. Na aba 1: Criar novo item
# 3. Na aba 2: Verificar que item aparece automaticamente
```

---

## ✅ Checklist de Implementação

- [ ] Rentals: create, update, delete emissões
- [ ] Equipment: create, update, delete emissões
- [ ] Events: create, update, delete emissões
- [ ] Clients: create, update, delete emissões
- [ ] Categories: create, update, delete emissões
- [ ] Subcategories: create, update, delete emissões
- [ ] Quotes: create, update, delete emissões
- [ ] Users: create, update, delete emissões
- [ ] Testes locais com DevTools
- [ ] Testes multi-tab
- [ ] Testes em staging
- [ ] Deploy em produção

---

## 🔍 Troubleshooting

### Problema: Frontend não recebe eventos
**Solução:**
1. Verificar se `getSocketIO()` retorna null
2. Verificar se Socket.IO está inicializado no servidor
3. Verificar se há erros nos logs do backend

### Problema: Múltiplos eventos duplicados
**Solução:**
1. Certificar que emit() é chamado apenas uma vez
2. Verificar se há múltiplas instâncias do middleware

### Problema: Performance degradada
**Solução:**
1. Adicionar rate limiting
2. Empacotar eventos em batches
3. Usar debounce para atualizações frequentes

---

## 📞 Referências

- [Socket.IO Documentation](https://socket.io/docs/)
- [Frontend Implementation](./SOCKET_IO_INTEGRATION_SUMMARY.md)
- [Testing Guide](./SOCKET_IO_TEST_GUIDE.md)

---

**Status:** 📝 PRONTO PARA IMPLEMENTAÇÃO
**Data:** 15 de Janeiro, 2026
