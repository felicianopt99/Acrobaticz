"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X, TrendingUp } from "lucide-react";
import type { FieldArrayWithId } from "react-hook-form";
import { useTranslate } from '@/contexts/TranslationContext';

interface QuoteItemsTableProps {
  fields: FieldArrayWithId<any, "items", "id">[];
  days: number;
  onDeleteItem: (index: number) => void;
  getFieldValue: (fieldName: string) => any;
  setFieldValue: (fieldName: string, value: any, options?: any) => void;
  isDesktop: boolean; // true for desktop table view, false for mobile card view
}

export function QuoteItemsTable({
  fields,
  days,
  onDeleteItem,
  getFieldValue,
  setFieldValue,
  isDesktop,
}: QuoteItemsTableProps) {
  // Translation hooks
  const { translated: itemText } = useTranslate('Item');
  const { translated: typeText } = useTranslate('Type');
  const { translated: qtyText } = useTranslate('Qty');
  const { translated: rateText } = useTranslate('Rate');
  const { translated: daysText } = useTranslate('Days');
  const { translated: totalText } = useTranslate('Total');
  const { translated: actionText } = useTranslate('Action');
  const { translated: unnamedItemText } = useTranslate('Unnamed Item');
  const { translated: partnerText } = useTranslate('Partner');
  const { translated: profitText } = useTranslate('Profit');
  const { translated: perDayText } = useTranslate('/day');
  const { translated: viaText } = useTranslate('via');
  const { translated: equipmentText } = useTranslate('Equipment');
  const { translated: serviceText } = useTranslate('Service');
  const { translated: feeText } = useTranslate('Fee');

  if (!isDesktop) {
    // Mobile card view - handled by original component
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="text-left py-3 px-4 font-semibold text-card-foreground">{itemText}</th>
            <th className="text-left py-3 px-4 font-semibold text-card-foreground">{typeText}</th>
            <th className="text-right py-3 px-4 font-semibold text-card-foreground w-20">{qtyText}</th>
            <th className="text-right py-3 px-4 font-semibold text-card-foreground w-24">{rateText}</th>
            {days > 1 && (
              <th className="text-right py-3 px-4 font-semibold text-card-foreground w-16">{daysText}</th>
            )}
            <th className="text-right py-3 px-4 font-semibold text-card-foreground w-28">{totalText}</th>
            <th className="text-right py-3 px-4 font-semibold text-card-foreground w-12">{actionText}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const itemType = getFieldValue(`items.${index}.type`);
            const quantity = getFieldValue(`items.${index}.quantity`) || 1;
            const unitPrice = getFieldValue(`items.${index}.unitPrice`) || 0;
            const lineTotal = getFieldValue(`items.${index}.lineTotal`) || 0;
            
            let itemName = '';
            if (itemType === 'equipment' || itemType === 'subrental') {
              itemName = getFieldValue(`items.${index}.equipmentName`) || '';
            } else if (itemType === 'service') {
              itemName = getFieldValue(`items.${index}.serviceName`) || '';
            } else if (itemType === 'fee') {
              itemName = getFieldValue(`items.${index}.feeName`) || '';
            }

            const colorMap: Record<string, string> = {
              equipment: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
              service: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
              fee: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
              subrental: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            };
            const typeColor = colorMap[itemType] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';

            const typeLabelMap: Record<string, string> = {
              equipment: equipmentText,
              service: serviceText,
              fee: feeText,
              subrental: partnerText,
            };
            const typeLabel = typeLabelMap[itemType] || itemType;

            return (
              <tr key={field.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium text-card-foreground">{itemName || unnamedItemText}</div>
                  {getFieldValue(`items.${index}.description`) && (
                    <div className="text-xs text-muted-foreground mt-1">{getFieldValue(`items.${index}.description`)}</div>
                  )}
                  {itemType === 'subrental' && getFieldValue(`items.${index}.partnerName`) && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {viaText} {getFieldValue(`items.${index}.partnerName`)}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${typeColor}`}>
                    {typeLabel}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">{quantity}</td>
                <td className="py-3 px-4 text-right">
                  <div className="font-semibold">€{unitPrice.toFixed(2)}</div>
                  {(itemType === 'equipment' || itemType === 'service' || itemType === 'subrental') && (
                    <div className="text-xs text-muted-foreground">{itemType === 'equipment' ? perDayText : ''}</div>
                  )}
                </td>
                {days > 1 && (
                  <td className="py-3 px-4 text-right">{days}</td>
                )}
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-card-foreground">€{lineTotal.toFixed(2)}</div>
                  {itemType === 'subrental' && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      {profitText}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteItem(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
