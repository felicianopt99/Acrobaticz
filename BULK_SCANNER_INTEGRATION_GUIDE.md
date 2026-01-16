/**
 * Integration Guide: Usar BulkScanner com RentalPrepPage
 * Este ficheiro mostra como integrar o novo sistema de Bulk Scan
 */

/*
=========================================================================================
  PASSO 1: Importar componentes e hooks necessários
=========================================================================================
*/

import { BulkScanner } from '@/components/rentals/BulkScanner';
import { useBulkScanSession } from '@/hooks/useBulkScanSession';

/*
=========================================================================================
  PASSO 2: Adicionar estado ao componente RentalPrepPage
=========================================================================================
*/

// Adicionar estes states ao seu RentalPrepPage:

// const [isScanningCheckout, setIsScanningCheckout] = useState(false);
// const [isScanningCheckin, setIsScanningCheckin] = useState(false);

// const bulkSessionCheckout = useBulkScanSession();
// const bulkSessionCheckin = useBulkScanSession();

/*
=========================================================================================
  PASSO 3: Handler para validar scan com backend
=========================================================================================
*/

/**
 * Valida um scan contra o evento e a lista de rentals
 *
 * @param equipmentId - ID do equipamento
 * @param scanData - Dados do scan (tipo, eventId, timestamp)
 * @returns Promise<boolean> - true se válido, false se rejeitado
 */
async function validateScanWithBackend(
  equipmentId: string,
  scanData: { scanType: 'checkout' | 'checkin'; eventId: string; timestamp: number }
) {
  try {
    // OPÇÃO 1: Validação local (rápida)
    const rental = prepList.find(item => item.equipmentId === equipmentId);
    if (!rental) {
      console.warn('[Validate] Equipment not in event');
      return false;
    }

    if (scanData.scanType === 'checkout' && rental.scannedQuantity >= rental.quantity) {
      console.warn('[Validate] Already fully checked out');
      return false;
    }

    // OPÇÃO 2: Validação com backend (se quiser adicionar rastreamento)
    /*
    const response = await fetch(`/api/rentals/validate-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId,
        eventId: scanData.eventId,
        scanType: scanData.scanType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Validate] Backend rejected:', error);
      return false;
    }

    const result = await response.json();
    return result.valid;
    */

    return true;
  } catch (error) {
    console.error('[Validate] Error:', error);
    return false;
  }
}

/*
=========================================================================================
  PASSO 4: Handler para processar scans bem-sucedidos
=========================================================================================
*/

/**
 * Processa um scan bem-sucedido
 * Actualiza o estado local (prepList) com o novo scan
 */
async function handleBulkScanSuccess(
  equipmentId: string,
  scanData: any,
  scanType: 'checkout' | 'checkin'
): Promise<boolean> {
  // 1. Validar
  const isValid = await validateScanWithBackend(equipmentId, scanData);
  if (!isValid) {
    return false;
  }

  // 2. Actualizar prepList localmente
  const listToUpdate = scanType === 'checkout' ? prepList : checkInList;
  const setList = scanType === 'checkout' ? setPrepList : setCheckInList;
  const itemIndex = listToUpdate.findIndex(item => item.equipmentId === equipmentId);

  if (itemIndex === -1) {
    return false; // Não encontrado
  }

  setList(currentList => {
    const newList = [...currentList];
    const item = newList[itemIndex];

    // Incrementar quantidade (nunca exceder o total)
    if (item.scannedQuantity < item.quantity) {
      newList[itemIndex] = {
        ...item,
        scannedQuantity: item.scannedQuantity + 1
      };
    }

    return newList;
  });

  // 3. LOG: Registar o scan (opcional, para auditoria)
  // await ScanQueueManager.addScan(equipmentId, scanType);

  console.log(`[BulkScan] Processed: ${equipmentId} (${scanType})`);
  return true;
}

/*
=========================================================================================
  PASSO 5: Adicionar componente BulkScanner ao JSX
=========================================================================================
*/

// SUBSTITUIR as chamadas antiga de QRCodeScanner:

export default function RentalPrepPage() {
  // ... outros states e hooks ...
  const [isScanningCheckout, setIsScanningCheckout] = useState(false);
  const [isScanningCheckin, setIsScanningCheckin] = useState(false);

  return (
    <>
      {/* ... resto do JSX ... */}

      {/* NOVO: BulkScanner para Check-Out */}
      {isScanningCheckout && (
        <BulkScanner
          isOpen={isScanningCheckout}
          onOpenChange={setIsScanningCheckout}
          onScanSuccess={(equipmentId, scanData) =>
            handleBulkScanSuccess(equipmentId, scanData, 'checkout')
          }
          targetQuantity={totalToCheckout}
          autoStopWhenComplete={true}
          eventId={eventId!}
          scanType="checkout"
        />
      )}

      {/* NOVO: BulkScanner para Check-In */}
      {isScanningCheckin && (
        <BulkScanner
          isOpen={isScanningCheckin}
          onOpenChange={setIsScanningCheckin}
          onScanSuccess={(equipmentId, scanData) =>
            handleBulkScanSuccess(equipmentId, scanData, 'checkin')
          }
          targetQuantity={totalToCheckIn}
          autoStopWhenComplete={true}
          eventId={eventId!}
          scanType="checkin"
        />
      )}
    </>
  );
}

/*
=========================================================================================
  PASSO 6: Botões para iniciar scanning
=========================================================================================
*/

// No JSX do seu componente, substituir:

/*
  {/* CHECK-OUT TAB */}
  <TabsContent value="checkout">
    <Card>
      <CardHeader>
        <CardTitle>Equipment Check-Out</CardTitle>
        <CardDescription>Scan each item before it leaves for the event.</CardDescription>
        <div className="pt-2">
          <p className="text-sm font-medium">
            Progress: {checkedOutCount} / {totalToCheckout} items packed
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* NOVO: Botão Bulk Scan com indicação visual */}
        <Button
          size="lg"
          onClick={() => setIsScanningCheckout(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Zap className="mr-2 h-5 w-5" />
          Iniciar Scanning em Lote
          {totalToCheckout - checkedOutCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalToCheckout - checkedOutCount} itens
            </Badge>
          )}
        </Button>

        <Separator />

        {/* Lista de itens */}
        <ul className="space-y-2">
          {prepList.map((item, index) => (
            <li
              key={`${item.equipmentId}-${index}`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <div className="flex items-center">
                {getStatusIcon(item.scannedQuantity, item.quantity)}
                <span className="ml-3 font-medium">{item.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {item.scannedQuantity} / {item.quantity}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  </TabsContent>
*/

/*
=========================================================================================
  PASSO 7: API Endpoint para validação (Opcional)
=========================================================================================
*/

/**
 * Se quiser implementar validação no backend:
 * POST /api/rentals/validate-scan
 *
 * Request body:
 * {
 *   equipmentId: string,
 *   eventId: string,
 *   scanType: 'checkout' | 'checkin'
 * }
 *
 * Response:
 * {
 *   valid: boolean,
 *   reason?: string,
 *   currentStatus?: {
 *     scannedOut: number,
 *     scannedIn: number,
 *     total: number
 *   }
 * }
 */

/*
=========================================================================================
  PASSO 8: Testing & Debug
=========================================================================================
*/

// Para testar o sistema, abra a console do navegador e execute:

/*
// Teste de parsing de QR
import { parseEquipmentQRCode } from '@/lib/qrCodeUtils';
parseEquipmentQRCode('http://localhost:3000/equipment/eq-test-123/edit');

// Teste de feedback
import { ScanFeedbackManager } from '@/lib/scanFeedbackManager';
ScanFeedbackManager.indicateSuccess();
ScanFeedbackManager.indicateError();

// Teste de sessão
import { useBulkScanSession } from '@/hooks/useBulkScanSession';
const session = useBulkScanSession();
session.addScan('eq-test-1');
session.addScan('eq-test-2');
console.log(session.getSessionSummary());
*/

/*
=========================================================================================
  PASSO 9: Performance Tips
=========================================================================================
*/

/**
 * 1. Debouncing: O sistema já implementa throttle de 150ms
 * 2. Deduplicação: O sistema evita scans duplicados automaticamente
 * 3. Feedback: Use ScanFeedbackManager para beeps/vibração
 * 4. UI: O componente é otimizado para mobile (Tailwind responsive)
 * 5. Batch: Considere enviar múltiplos scans em batch para o backend
 */

export default {};
