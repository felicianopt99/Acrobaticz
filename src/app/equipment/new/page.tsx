
"use client";

import { useSearchParams } from 'next/navigation';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { useTranslate } from '@/contexts/TranslationContext';
import { useAppContext } from '@/contexts/AppContext';
import { useMemo } from 'react';
import { Package, Home, FolderKanban } from 'lucide-react';

export default function NewEquipmentPage() {
  // Translation hooks
  const { translated: uiAddNewEquipmentText } = useTranslate('Add New Equipment');
  const { translated: uiInventoryText } = useTranslate('Inventory');
  const { translated: uiDashboardText } = useTranslate('Dashboard');
  const { translated: uiFillFormText } = useTranslate('Fill in the details below to add a new piece of equipment to your inventory');
  const { translated: uiDuplicatingText } = useTranslate('Duplicating existing item');

  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const { equipment } = useAppContext();
  
  // Get the equipment to duplicate from
  const equipmentToDuplicate = useMemo(() => {
    if (duplicateId) {
      const found = equipment.find(e => e.id === duplicateId);
      if (found) {
        // Remove the ID so it creates a new item, and add "(Copy)" to name
        const { id, ...rest } = found;
        return {
          ...rest,
          name: `${found.name} (Copy)`,
        };
      }
    }
    return undefined;
  }, [duplicateId, equipment]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      
      {/* Header Section with Breadcrumb */}
      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">{uiDashboardText}</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/inventory" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <FolderKanban className="w-4 h-4" />
                    <span className="hidden sm:inline">{uiInventoryText}</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1.5 text-primary font-medium">
                  <Package className="w-4 h-4" />
                  {uiAddNewEquipmentText}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {uiAddNewEquipmentText}
                </h1>
                {duplicateId && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                    {uiDuplicatingText}
                  </span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              {uiFillFormText}
            </p>
          </div>

          {/* Equipment Form */}
          <EquipmentForm initialData={equipmentToDuplicate as any} />
        </div>
      </div>
    </div>
  );
}
