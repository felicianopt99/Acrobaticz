# 🔧 QUICK REFERENCE - Frente 1 Implementação

## 📦 Código Implementado - Cópiar & Colar

### 1. Schema Prisma - Campo Soft-Delete

```prisma
# Em: prisma/schema.prisma
# No modelo EquipmentItem, adicionar:

model EquipmentItem {
  // ... campos existentes ...
  updatedAt        DateTime
  deletedAt        DateTime?        # ← NOVO: NULL = não deletado, NOT NULL = deletado
  
  // ... restantes campos ...
  
  @@index([deletedAt])              # ← NOVO: Index para performance
}
```

---

### 2. Prisma Extensions - Soft Delete Automático

```typescript
// Ficheiro: src/lib/prisma-extensions.ts (NOVO FICHEIRO)

import { Prisma } from '@prisma/client'

export const equipmentSoftDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      equipmentItem: {
        async findMany({ args, query }) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        async count({ args, query }) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        async findUniqueOrThrow({ args, query }) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        async findFirstOrThrow({ args, query }) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
      },
    },
  })
})

export const deletedItemsExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      equipmentItem: {
        async findDeleted(where?: Prisma.EquipmentItemWhereInput) {
          return (client.equipmentItem as any).findMany({
            where: { ...where, deletedAt: { not: null } },
          })
        },
        async hardDelete(id: string) {
          return (client.equipmentItem as any).delete({ where: { id } })
        },
        async restore(id: string) {
          return (client.equipmentItem as any).update({
            where: { id },
            data: { deletedAt: null },
          })
        },
      },
    },
  })
})
```

---

### 3. Inicializar Prisma com Extensions

```typescript
// Ficheiro: src/lib/db-enhanced.ts
// Substitua a inicialização do prisma:

import { equipmentSoftDeleteExtension, deletedItemsExtension } from '@/lib/prisma-extensions'

// ... classe EnhancedPrismaClient ...

const globalForPrisma = globalThis as unknown as {
  prisma: EnhancedPrismaClient | undefined
}

// MUDANÇA: Aplicar extensions ao prisma
export const prisma = (globalForPrisma.prisma ?? new EnhancedPrismaClient())
  .$extends(equipmentSoftDeleteExtension)
  .$extends(deletedItemsExtension)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as any
}
```

---

### 4. DELETE API com Soft Delete + Validações

```typescript
// Ficheiro: src/app/api/equipment/route.ts
// Substitua a função DELETE existente:

import { requirePermission } from '@/lib/api-auth'
import { broadcastDataChange } from '@/lib/realtime-broadcast'

export async function DELETE(request: NextRequest) {
  const user = await requirePermission(request, 'canManageEquipment')

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }
    
    // 1. Get equipment com rentals ativas
    const equipment = await prisma.equipmentItem.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        Rental: {
          select: {
            id: true,
            Event: { select: { id: true, name: true, startDate: true, endDate: true } }
          },
          where: {
            Event: {
              OR: [
                { startDate: { lte: new Date() } },
                { startDate: { gte: new Date() } }
              ]
            }
          }
        }
      }
    })
    
    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    if (equipment.deletedAt !== null) {
      return NextResponse.json({ error: 'Equipment is already deleted' }, { status: 410 })
    }

    // 2. Check active rentals
    const activeRentals = equipment.Rental.filter(rental => {
      if (!rental.Event) return false
      const now = new Date()
      return rental.Event.startDate <= now && now <= rental.Event.endDate
    })

    if (activeRentals.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete equipment with active rentals',
        message: 'Não é possível eliminar um equipamento com alugueres ativos ou confirmados.',
        activeRentals: activeRentals.map(r => ({
          eventId: r.Event?.id,
          eventName: r.Event?.name,
          startDate: r.Event?.startDate,
          endDate: r.Event?.endDate,
        })),
      }, { status: 400 })
    }

    // 3. Soft delete + ActivityLog
    const softDeletedEquipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentItem.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: user.userId,
        },
        include: { category: true, subcategory: true },
      })

      await tx.activityLog.create({
        data: {
          userId: user.userId,
          action: 'SOFT_DELETE',
          entityType: 'EquipmentItem',
          entityId: id,
          oldData: JSON.stringify({ name: equipment.name }),
          newData: JSON.stringify({ name: updated.name, deletedAt: updated.deletedAt }),
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return updated
    })

    broadcastDataChange('EquipmentItem', 'SOFT_DELETE', softDeletedEquipment, user.userId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Equipment successfully soft-deleted',
      equipment: softDeletedEquipment 
    })
  } catch (error) {
    console.error('Error deleting equipment:', error)
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 })
  }
}
```

---

### 5. Cloud Storage - Ownership Check

```typescript
// Ficheiro: src/app/api/cloud/files/[id]/route.ts
// Adicione esta função helper no topo:

function isFileOwnerOrAdmin(userId: string, fileOwnerId: string, userRole: string): boolean {
  return fileOwnerId === userId || userRole === 'Admin'
}

// ===== GET (Download) =====
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = verifyAuth(request)
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const file = await prisma.cloudFile.findUnique({
      where: { id },
      select: { 
        id: true,
        ownerId: true, 
        storagePath: true, 
        name: true, 
        mimeType: true,
        isTrashed: true,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (file.isTrashed) {
      return NextResponse.json({ error: 'File is in trash' }, { status: 410 })
    }

    // ✅ OWNERSHIP VALIDATION
    if (!isFileOwnerOrAdmin(auth.userId, file.ownerId, auth.role)) {
      return NextResponse.json(
        { error: 'Access denied - insufficient permissions' }, 
        { status: 403 }
      )
    }

    const buffer = await readFile(file.storagePath)
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }
}

// ===== DELETE =====
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = verifyAuth(request)
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const file = await prisma.cloudFile.findUnique({
      where: { id },
      select: { 
        id: true,
        ownerId: true, 
        storagePath: true, 
        size: true,
        name: true,
        isTrashed: true,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // ✅ OWNERSHIP VALIDATION
    if (!isFileOwnerOrAdmin(auth.userId, file.ownerId, auth.role)) {
      return NextResponse.json(
        { error: 'Access denied - insufficient permissions' }, 
        { status: 403 }
      )
    }

    if (permanent && !file.isTrashed) {
      return NextResponse.json(
        { error: 'File must be in trash before permanent deletion' }, 
        { status: 400 }
      )
    }

    if (permanent) {
      await prisma.$transaction(async (tx) => {
        try {
          await deleteFile(file.storagePath)
        } catch (e) {
          console.error('Failed to delete from disk:', e)
        }

        await tx.cloudFile.delete({ where: { id } })
        
        await tx.storageQuota.updateMany({
          where: { userId: auth.userId },
          data: { usedBytes: { decrement: file.size } },
        })

        // ✅ ActivityLog
        await tx.activityLog.create({
          data: {
            userId: auth.userId,
            action: 'PERMANENT_DELETE',
            entityType: 'CloudFile',
            entityId: id,
            oldData: JSON.stringify({ name: file.name, size: file.size.toString() }),
            newData: null,
            ipAddress: request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        })
      })
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.cloudFile.update({
          where: { id },
          data: { isTrashed: true },
        })

        // ✅ ActivityLog
        await tx.activityLog.create({
          data: {
            userId: auth.userId,
            action: 'TRASH',
            entityType: 'CloudFile',
            entityId: id,
            newData: JSON.stringify({ isTrashed: true }),
            ipAddress: request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        })
      })
    }

    return NextResponse.json({ 
      success: true,
      message: permanent ? 'File permanently deleted' : 'File moved to trash',
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
```

---

## 🚀 Aplicar a Migração

```bash
# 1. (Opcional) Gerar Prisma Client
npx prisma generate

# 2. Aplicar migração quando BD está online
npx prisma migrate deploy

# 3. (Se tiver BD local) Criar migração interativa
npx prisma migrate dev --name add_soft_delete_to_equipment
```

---

## ✅ Testes Rápidos

```bash
# 1. Verificar schema foi aplicado
npx prisma db push

# 2. Abrir Prisma Studio
npx prisma studio

# 3. Verificar queries filtram deletados
npx prisma db execute --stdin << 'SQL'
SELECT * FROM "EquipmentItem" WHERE "deletedAt" IS NOT NULL;
SQL
```

---

## 📊 HTTP Status Codes

| Operação | Sucesso | Erro | HTTP |
|----------|---------|------|------|
| DELETE Equipment (OK) | Deletado | - | 200 |
| DELETE Equipment (já deletado) | - | "Already deleted" | 410 |
| DELETE Equipment (rentals ativas) | - | "Active rentals" | 400 |
| GET CloudFile (não owner) | - | "Forbidden" | 403 |
| DELETE CloudFile (não owner) | - | "Forbidden" | 403 |
| File não existe | - | "Not found" | 404 |
| File em trash | - | "Gone" | 410 |

---

## 🔍 Útil: Queries SQL para Auditoria

```sql
-- Ver todos os soft-deletes de equipment
SELECT 
  al.userId, 
  al.entityId, 
  al.createdAt,
  al.ipAddress
FROM "ActivityLog" al
WHERE al.entityType = 'EquipmentItem' 
  AND al.action = 'SOFT_DELETE'
ORDER BY al.createdAt DESC;

-- Ver ficheiros deletados (trash)
SELECT id, name, "ownerId", "isTrashed", "updatedAt"
FROM "CloudFile"
WHERE "isTrashed" = true
ORDER BY "updatedAt" DESC;

-- Ver equipamentos não deletados
SELECT id, name, "deletedAt"
FROM "EquipmentItem"
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC;
```

---

## 📚 Referências

- [Frente 1 - Documentação Completa](./FRENTE_1_IMPLEMENTACAO.md)
- [Auditoria 360º Completa](./AUDITORIA_360_COMPLETA.md)
- [Prisma Docs - Extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
