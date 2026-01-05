"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EquipmentItem } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { useTranslate } from '@/contexts/TranslationContext';

export default function EditEquipmentPage() {
  // Translation hooks
  const { translated: uiEditEquipmentText } = useTranslate('Edit Equipment');
  const { translated: uiInventoryText } = useTranslate('Inventory');
  const { translated: uiDashboardText } = useTranslate('Dashboard');

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
      } else {
        // Equipment not found, redirect back
        router.push('/inventory');
        return;
      }
      setLoading(false);
    }
  }, [itemId, equipment, isDataLoaded, router]);

  if (loading || !isDataLoaded) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading equipment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!equipmentItem) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center p-4 md:p-6">
          <div className="text-center">
            <p className="text-lg text-destructive">Equipment not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Breadcrumb Navigation */}
      <div className="px-2 md:px-6 pt-2 md:pt-4">
        <Breadcrumb>
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
              <BreadcrumbPage>{uiEditEquipmentText}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {uiEditEquipmentText}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {equipmentItem.name}
            </p>
          </div>

          {/* Equipment Form */}
          <EquipmentForm
            initialData={equipmentItem}
            onSubmitSuccess={() => router.push('/inventory')}
          />
        </div>
      </div>
    </div>
  );
}
