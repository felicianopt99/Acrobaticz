'use client';

import { useParams } from 'next/navigation';
import { EquipmentDetailView } from '@/components/maintenance/EquipmentDetailView';
import { useAppContext } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';
import { useTranslate } from '@/contexts/TranslationContext';

export default function MaintenanceEquipmentDetailPage() {
  const params = useParams();
  const { isDataLoaded } = useAppContext();
  const [isReady, setIsReady] = useState(false);
  
  const { translated: loadingText } = useTranslate('Loading equipment details...');

  const itemId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && itemId) {
      setIsReady(true);
    }
  }, [isDataLoaded, itemId]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <EquipmentDetailView equipmentId={itemId!} />
      </div>
    </div>
  );
}
