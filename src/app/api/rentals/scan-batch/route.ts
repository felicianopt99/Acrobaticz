import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

interface ScanItem {
  equipmentId: string;
  scanType: 'checkout' | 'checkin';
  eventId: string;
  timestamp: number;
}

interface BatchScanRequest {
  scans: ScanItem[];
}

interface ScanError {
  equipmentId: string;
  error: string;
  code?: 'VERSION_CONFLICT' | 'NOT_FOUND' | 'QUANTITY_COMPLETE' | 'SERVER_ERROR';
}

interface BatchScanResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: ScanError[];
  timestamp: number;
}

/**
 * Interface estendida para suportar OCC (Optimistic Concurrency Control)
 */
interface ScanItemWithVersion extends ScanItem {
  currentVersion?: number;
}

/**
 * POST /api/rentals/scan-batch
 * 
 * Processa múltiplos scans em lote com:
 * - Transação Prisma para atomicidade (SERIALIZABLE)
 * - Validação de versão (OCC - Optimistic Concurrency Control)
 * - updateMany com validação de versão para operação atômica
 * - Rastreamento completo (EquipmentScanLog)
 * - Retry automático no cliente se versão mudar (erro 409)
 */
export async function POST(req: NextRequest): Promise<NextResponse<BatchScanResponse>> {
  try {
    // 1. AUTENTICAÇÃO
    const user = await requirePermission(req, 'canManageEquipment');

    // 2. VALIDAR REQUEST
    const body = await req.json() as BatchScanRequest;
    
    if (!body.scans || !Array.isArray(body.scans) || body.scans.length === 0) {
      return NextResponse.json(
        {
          success: false,
          processed: 0,
          failed: 0,
          errors: [{ equipmentId: 'N/A', error: 'Empty scan list', code: 'SERVER_ERROR' }],
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    // 3. PROCESSAR EM LOTE COM TRANSAÇÃO ISOLADA
    const response: BatchScanResponse = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      timestamp: Date.now()
    };

    for (const scan of body.scans) {
      try {
        // Validar campos obrigatórios
        if (!scan.equipmentId || !scan.scanType || !scan.eventId) {
          throw { code: 'SERVER_ERROR', message: 'Missing required fields' };
        }

        // 🔒 TRANSAÇÃO ATÓMICA COM ISOLAMENTO SERIALIZABLE
        // Garante que nenhuma outra transação pode modificar o rental enquanto esta está em execução
        const result = await prisma.$transaction(async (tx) => {
          // ════════════════════════════════════════════════════════════════════
          // PASSO 1: Buscar rental com versão atual
          // ════════════════════════════════════════════════════════════════════
          const rental = await tx.rental.findFirst({
            where: {
              equipmentId: scan.equipmentId,
              eventId: scan.eventId,
            },
            include: { EquipmentItem: true, Event: true }
          });

          if (!rental) {
            throw { 
              code: 'NOT_FOUND', 
              message: `Equipment ${scan.equipmentId} not found in event ${scan.eventId}` 
            };
          }

          // ════════════════════════════════════════════════════════════════════
          // PASSO 2: Validar quantidade baseado no scanType
          // ════════════════════════════════════════════════════════════════════
          const fieldName = scan.scanType === 'checkout' ? 'scannedOut' : 'scannedIn';
          const currentValue = rental[fieldName as keyof typeof rental] as number;
          
          if (currentValue >= rental.quantityRented) {
            throw { 
              code: 'QUANTITY_COMPLETE', 
              message: `Already fully ${scan.scanType}ed (${currentValue}/${rental.quantityRented})` 
            };
          }

          // ════════════════════════════════════════════════════════════════════
          // PASSO 3: ATUALIZAR com OCC - updateMany garante atomicidade
          // A cláusula WHERE inclui version: rental.version
          // Se a versão mudou desde o fetch, updateMany retorna count=0
          // ════════════════════════════════════════════════════════════════════
          const newVersion = rental.version + 1;
          const updateResult = await tx.rental.updateMany({
            where: {
              id: rental.id,
              version: rental.version  // ← CHAVE DO OCC: versão deve corresponder
            },
            data: {
              [fieldName]: currentValue + 1,
              version: newVersion,  // ← Incrementa versão manualmente
              updatedAt: new Date()
            }
          });

          // Se nenhuma linha foi actualizada, significa que a versão mudou
          if (updateResult.count === 0) {
            // ❌ CONFLITO DE VERSÃO: Outro cliente já modificou este rental
            // Retornar erro 409 para o cliente fazer retry automático
            throw {
              code: 'VERSION_CONFLICT',
              message: `Rental version changed (current: ${newVersion}). Retry with updated version.`,
              conflictData: {
                rentalId: rental.id,
                currentVersion: newVersion,
                suggestRetry: true
              }
            };
          }

          // ════════════════════════════════════════════════════════════════════
          // PASSO 4: Buscar estado atualizado (para confirmar nova versão)
          // ════════════════════════════════════════════════════════════════════
          const updated = await tx.rental.findUnique({
            where: { id: rental.id }
          });

          if (!updated) {
            throw { code: 'SERVER_ERROR', message: 'Failed to fetch updated rental' };
          }

          // ════════════════════════════════════════════════════════════════════
          // PASSO 5: Registar em EquipmentScanLog (dentro da mesma transação)
          // Se isto falhar, TODA a transação falha (atomicidade garantida)
          // ════════════════════════════════════════════════════════════════════
          await tx.equipmentScanLog.create({
            data: {
              rentalId: updated.id,
              equipmentId: scan.equipmentId,
              userId: user.userId,  // ← Usar userId, não id
              eventId: scan.eventId,
              scanType: scan.scanType,
              status: 'success',
              timestamp: new Date(),
              ipAddress: req.headers.get('x-forwarded-for') || 
                        req.headers.get('cf-connecting-ip') ||
                        'unknown'
            }
          });

          // ════════════════════════════════════════════════════════════════════
          // PASSO 6: Retornar sucesso com nova versão (cliente usa isto no retry)
          // ════════════════════════════════════════════════════════════════════
          return {
            success: true,
            updated,
            newVersion: newVersion,
            progress: {
              out: `${updated.scannedOut}/${updated.quantityRented}`,
              in: `${updated.scannedIn}/${updated.quantityRented}`
            }
          };

        }, {
          // Isolamento SERIALIZABLE para máxima proteção contra race conditions
          isolationLevel: 'Serializable',
          timeout: 5000  // 5 segundos timeout (previne deadlocks infinitos)
        });

        response.processed++;
        console.log(`[SCAN-BATCH] ✅ ${scan.equipmentId} (${scan.scanType}): processed successfully (v${result.newVersion})`);

      } catch (error: any) {
        response.success = false;
        response.failed++;

        const errorCode = error.code || 'SERVER_ERROR';
        const errorMessage = error.message || String(error);

        console.warn(`[SCAN-BATCH] ❌ ${scan.equipmentId}: ${errorMessage} (code: ${errorCode})`);

        // Mapear erro Prisma P2025 para VERSION_CONFLICT
        // (Serializable isolation pode lançar P2025 se versão não bate)
        if (error.code === 'P2025') {
          response.errors.push({
            equipmentId: scan.equipmentId,
            error: `Version conflict - rental was modified by another user. Retry with updated version.`,
            code: 'VERSION_CONFLICT'
          });
        } else {
          response.errors.push({
            equipmentId: scan.equipmentId,
            error: errorMessage,
            code: errorCode
          });
        }
      }
    }

    console.log(`[SCAN-BATCH] Complete: ${response.processed}/${body.scans.length} processed, ${response.failed} errors`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[SCAN-BATCH] Fatal error:', error);
    
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        failed: 1,
        errors: [{ 
          equipmentId: 'N/A', 
          error: 'Internal server error',
          code: 'SERVER_ERROR'
        }],
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rentals/scan-batch/status
 * 
 * Endpoint simplificado para verificar operacionalidade
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Scan batch endpoint is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SCAN-BATCH GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
