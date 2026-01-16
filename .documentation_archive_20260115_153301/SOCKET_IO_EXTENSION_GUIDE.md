# Socket.IO - Guia de Extensão para Novos Eventos

Este guia mostra como adicionar novos eventos Socket.IO ao `AppContext.tsx`.

## Padrão Geral

Todos os novos eventos devem seguir este padrão:

```typescript
socket.on('evento:acao', (data: TipoDados) => {
  console.log('Evento recebido:', data);
  setEstado(prevEstado => {
    // Lógica imutável aqui
    return [...prevEstado, data]; // ou map(), filter(), etc.
  });
});
```

## Exemplos Práticos

### 1. Equipamento Criado (`equipment:created`)

```typescript
socket.on('equipment:created', (equipment: EquipmentItem) => {
  console.log('Equipment created event received:', equipment);
  setEquipment(prevEquipment => {
    const exists = prevEquipment.some(eq => eq.id === equipment.id);
    if (exists) {
      return prevEquipment;
    }
    return [...prevEquipment, equipment];
  });
});
```

**Limpeza:**
```typescript
return () => {
  if (socket) {
    socket.off('equipment:created');
    // ... outros listeners
  }
};
```

### 2. Equipamento Apagado (`equipment:deleted`)

```typescript
socket.on('equipment:deleted', (equipmentId: string) => {
  console.log('Equipment deleted event received:', equipmentId);
  setEquipment(prevEquipment =>
    prevEquipment.filter(eq => eq.id !== equipmentId)
  );
});
```

### 3. Aluguel Atualizado (`rental:updated`)

```typescript
socket.on('rental:updated', (rental: Rental) => {
  console.log('Rental updated event received:', rental);
  setRentals(prevRentals =>
    prevRentals.map(r =>
      r.id === rental.id ? rental : r
    )
  );
});
```

### 4. Aluguel Apagado (`rental:deleted`)

```typescript
socket.on('rental:deleted', (rentalId: string) => {
  console.log('Rental deleted event received:', rentalId);
  setRentals(prevRentals =>
    prevRentals.filter(r => r.id !== rentalId)
  );
});
```

### 5. Cliente Criado (`client:created`)

```typescript
socket.on('client:created', (client: Client) => {
  console.log('Client created event received:', client);
  setClients(prevClients => {
    const exists = prevClients.some(c => c.id === client.id);
    if (exists) {
      return prevClients;
    }
    return [...prevClients, client];
  });
});
```

### 6. Cliente Atualizado (`client:updated`)

```typescript
socket.on('client:updated', (client: Client) => {
  console.log('Client updated event received:', client);
  setClients(prevClients =>
    prevClients.map(c =>
      c.id === client.id ? client : c
    )
  );
});
```

### 7. Notificação (`notification`)

```typescript
socket.on('notification', (notification: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}) => {
  console.log('Notification received:', notification);
  // Usar hook useToastWithTranslation
  // toastSuccess(notification.message);
});
```

## Boas Práticas

### ✅ O que fazer:

1. **Usar funções de atualização de estado (functional updates):**
   ```typescript
   setEquipment(prevEquipment => ({
     ...prevEquipment,
     // mudanças aqui
   }));
   ```

2. **Verificar duplicatas antes de adicionar:**
   ```typescript
   const exists = prevArray.some(item => item.id === newItem.id);
   if (exists) return prevArray;
   ```

3. **Ser específico nos listeners - apenas o que muda:**
   ```typescript
   setEquipment(prevEquipment =>
     prevEquipment.map(eq =>
       eq.id === updated.id ? updated : eq
     )
   );
   ```

4. **Logging detalhado:**
   ```typescript
   console.log('Event type received:', eventData);
   ```

### ❌ O que NÃO fazer:

1. **Não modificar estado diretamente:**
   ```typescript
   // ❌ ERRADO
   equipment[0].name = 'Nova Valor'; // Mutação!
   setEquipment(equipment);
   
   // ✅ CORRETO
   setEquipment(prev => 
     prev.map((eq, i) => 
       i === 0 ? { ...eq, name: 'Nova Valor' } : eq
     )
   );
   ```

2. **Não esquecer de remover listeners:**
   ```typescript
   // ❌ ERRADO - memory leak!
   useEffect(() => {
     socket.on('evento', handler);
     // Sem cleanup!
   }, []);
   
   // ✅ CORRETO
   useEffect(() => {
     socket.on('evento', handler);
     return () => {
       socket.off('evento');
     };
   }, []);
   ```

3. **Não usar índices para update:**
   ```typescript
   // ❌ ERRADO - frágil
   setEquipment(prev => {
     prev[indexFromServer] = newData;
     return prev;
   });
   
   // ✅ CORRETO - por ID
   setEquipment(prev =>
     prev.map(eq =>
       eq.id === newData.id ? newData : eq
     )
   );
   ```

## Template Completo

Para adicionar um novo evento, use este template:

```typescript
// Subscribe to [evento:acao] events
socket.on('[evento:acao]', ([data]: [TipoDados]) => {
  console.log('[Evento] event received:', [data]);
  // Update [state] immutably
  set[State](prev[State] => {
    // TODO: Implementar lógica de update
    return prev[State];
  });
});

// No cleanup return, adicione:
socket.off('[evento:acao]');
```

## Debugging

Para verificar se os eventos estão a ser emitidos:

1. **Abrir Chrome DevTools (F12)**
2. **Ir para a aba Network**
3. **Filtrar por "socket" ou "io"**
4. **Procurar por mensagens WebSocket**

Ou adicionar logging no console:

```typescript
socket.onAny((eventName, ...args) => {
  console.log('Socket event received:', eventName, args);
});
```

## Performance

Para melhor performance com muitos eventos:

1. **Usar `useCallback` para handlers:**
   ```typescript
   const handleRentalCreated = useCallback((rental: Rental) => {
     setRentals(prev => [...prev, rental]);
   }, []);
   
   socket.on('rental:created', handleRentalCreated);
   ```

2. **Debounce para eventos frequentes:**
   ```typescript
   import { debounce } from 'lodash';
   
   const handleEquipmentUpdated = debounce((equipment: EquipmentItem) => {
     setEquipment(prev => 
       prev.map(eq => eq.id === equipment.id ? equipment : eq)
     );
   }, 300);
   
   socket.on('equipment:updated', handleEquipmentUpdated);
   ```

## Sincronização Entre Abas

Para sincronizar dados entre múltiplas abas do navegador:

```typescript
// Receber do Socket.IO
socket.on('rental:created', (rental: Rental) => {
  // Broadcast para outras abas
  const channel = new BroadcastChannel('rental-updates');
  channel.postMessage({ type: 'rental:created', data: rental });
  
  // Update local state
  setRentals(prev => [...prev, rental]);
});
```
