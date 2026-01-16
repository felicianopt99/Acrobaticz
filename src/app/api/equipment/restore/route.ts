import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db-enhanced'
import { requirePermission } from '@/lib/api-auth'
import { broadcastDataChange } from '@/lib/realtime-broadcast'

/**
 * PATCH /api/equipment/restore?id={id}
 * 
 * Restaura um equipamento que foi soft-deletado.
 * - Verifica se o equipamento existe e está deletado
 * - Define deletedAt = null
 * - Cria ActivityLog com ação 'RESTORE'
 * - Faz broadcast real-time
 */
export async function PATCH(request: NextRequest) {
  const user = await requirePermission(request, 'canManageEquipment')

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Equipment ID is required' },
        { status: 400 }
      )
    }

    // 1. Get equipment (without soft-delete filter to check if it's actually deleted)
    const equipment = await (prisma as any).equipmentItem.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
    }).catch(() => null)

    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      )
    }

    // 2. Check if already not deleted
    if (equipment.deletedAt === null) {
      return NextResponse.json(
        { error: 'Equipment is not deleted' },
        { status: 400 }
      )
    }

    // 3. Perform restore + ActivityLog in transaction
    const restoredEquipment = await prisma.$transaction(async (tx) => {
      // Update: set deletedAt = null
      const updated = await (tx as any).equipmentItem.update({
        where: { id },
        data: {
          deletedAt: null,
          updatedBy: user.userId,
        },
      })

      // Create ActivityLog for audit trail
      await (tx as any).activityLog.create({
        data: {
          id: `actlog-${Date.now()}-${Math.random()}`,
          userId: user.userId,
          action: 'RESTORE',
          entityType: 'EquipmentItem',
          entityId: id,
          oldData: JSON.stringify({
            name: equipment.name,
            deletedAt: equipment.deletedAt?.toISOString(),
          }),
          newData: JSON.stringify({
            name: updated.name,
            deletedAt: null,
          }),
          ipAddress: (request as any).ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          createdAt: new Date(),
        },
      })

      return updated
    })

    // 4. Broadcast real-time update
    broadcastDataChange('EquipmentItem', 'UPDATE', {
      ...(restoredEquipment as any),
      deletedAt: (restoredEquipment as any).deletedAt?.toISOString(),
    }, user.userId)

    return NextResponse.json({
      success: true,
      message: 'Equipment successfully restored',
      equipment: restoredEquipment,
    })
  } catch (error) {
    console.error('Error restoring equipment:', error)
    return NextResponse.json(
      { error: 'Failed to restore equipment' },
      { status: 500 }
    )
  }
}
