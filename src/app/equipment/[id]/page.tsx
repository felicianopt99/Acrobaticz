'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EquipmentItem } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { useTranslate } from '@/contexts/TranslationContext';
import { ArrowLeft, Edit2 } from 'lucide-react';

export default function EquipmentDetailPage() {
  // Translation hooks
  const { translated: uiEquipmentText } = useTranslate('Equipment');
  const { translated: uiInventoryText } = useTranslate('Inventory');
  const { translated: uiDashboardText } = useTranslate('Dashboard');
  const { translated: uiEditText } = useTranslate('Edit');
  const { translated: uiBackText } = useTranslate('Back');
  const { translated: uiLoadingText } = useTranslate('Loading...');
  const { translated: uiEquipmentNotFoundText } = useTranslate('Equipment not found');
  const { translated: uiNoDescriptionText } = useTranslate('No description');
  const { translated: uiEquipmentTypeText } = useTranslate('Equipment Type');
  const { translated: uiStatusText } = useTranslate('Status');
  const { translated: uiTotalQuantityText } = useTranslate('Total Quantity');
  const { translated: uiLocationText } = useTranslate('Location');
  const { translated: uiDailyRateText } = useTranslate('Daily Rate');
  const { translated: uiImageText } = useTranslate('Image');
  const { translated: uiHasImageText } = useTranslate('Has image');
  const { translated: uiNoImageText } = useTranslate('No image');
  const { translated: uiConsumableText } = useTranslate('Consumable');
  const { translated: uiEquipmentTypeValueText } = useTranslate('Equipment');
  const { translated: uiNAText } = useTranslate('N/A');

  const params = useParams();
  const router = useRouter();
  const { equipment, isDataLoaded } = useAppContext();
  const [equipmentItem, setEquipmentItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const itemId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && itemId) {
      const foundItem = equipment.find((e: EquipmentItem) => e.id === itemId);
      if (foundItem) {
        setEquipmentItem(foundItem);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [isDataLoaded, itemId, equipment]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{uiLoadingText}</div>
      </div>
    );
  }

  if (!equipmentItem) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">{uiDashboardText}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/inventory">{uiInventoryText}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{uiEquipmentText}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-lg text-muted-foreground mb-4">{uiEquipmentNotFoundText}</p>
            <Button asChild variant="outline">
              <Link href="/inventory">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {uiBackText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">{uiDashboardText}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/inventory">{uiInventoryText}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{equipmentItem.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{equipmentItem.name}</h1>
              <p className="text-muted-foreground">{equipmentItem.description || uiNoDescriptionText}</p>
            </div>
            <Button asChild>
              <Link href={`/equipment/${itemId}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" />
                {uiEditText}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-1">{uiEquipmentTypeText}</p>
              <p className="font-semibold">{equipmentItem.type === 'consumable' ? uiConsumableText : uiEquipmentTypeValueText}</p>
            </div>
            <div className="border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-1">{uiStatusText}</p>
              <p className="font-semibold capitalize">{equipmentItem.status}</p>
            </div>
            <div className="border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-1">{uiTotalQuantityText}</p>
              <p className="font-semibold">{equipmentItem.quantity || 0}</p>
            </div>
            <div className="border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-1">{uiLocationText}</p>
              <p className="font-semibold">{equipmentItem.location || uiNAText}</p>
            </div>
            <div className="border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-1">{uiDailyRateText}</p>
              <p className="font-semibold">${equipmentItem.dailyRate?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-1">{uiImageText}</p>
              <p className="font-semibold text-sm">{equipmentItem.imageUrl ? uiHasImageText : uiNoImageText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
