# Bulk Scanner - Quick Start Integration

## 🎯 How to Integrate into Your Page (5 Minutes)

### 1. Import & Initialize
```typescript
import { BulkScanner, type ScanData } from '@/components/rentals/BulkScanner';
import { ScanQueueManager } from '@/lib/scanQueueManager';

// On component mount
useEffect(() => {
  ScanQueueManager.initialize();  // Load persisted scans
}, []);
```

### 2. Add State
```typescript
const [showScanner, setShowScanner] = useState(false);
```

### 3. Implement Handler
```typescript
async function handleScanSuccess(
  equipmentId: string,
  scanData: ScanData
): Promise<boolean> {
  ScanQueueManager.addScan(
    equipmentId,
    scanData.scanType,
    scanData.eventId
  );
  
  const result = await ScanQueueManager.sync(
    '/api/rentals/scan-batch'
  );
  
  return true;
}
```

### 4. Add Component
```tsx
<Button onClick={() => setShowScanner(true)}>
  📱 Modo Pistola
</Button>

<BulkScanner
  isOpen={showScanner}
  onOpenChange={setShowScanner}
  onScanSuccess={handleScanSuccess}
  targetQuantity={50}
  eventId={currentEventId}
  scanType="checkout"
/>
```

---

## ✅ You're Done!

The scanner now:
- ✅ Scans QR codes at 15 FPS (optimized for 4GB RAM)
- ✅ Persists scans to localStorage (survives crashes)
- ✅ Syncs to API with OCC conflict handling
- ✅ Shows confirmation on incomplete close
- ✅ Provides distinctive audio/haptic feedback

**No additional setup needed!**
