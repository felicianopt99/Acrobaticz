"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { CalendarIcon, Download, Eye, Send, Check, TrendingDown, Percent, DollarSign } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BusinessInfo } from "@/lib/quote-business-info";
import { useTranslate } from '@/contexts/TranslationContext';

interface QuoteSidebarProps {
  form: UseFormReturn<any>;
  quoteName?: string;
  quoteStatus?: string;
  startDate?: Date;
  endDate?: Date;
  rentalDays?: number;
  subtotal: number;
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  taxRate: number;
  totalAmount: number;
  onPreview?: () => void;
  onDownload?: () => void;
  onSend?: () => void;
  isGeneratingPDF?: boolean;
}

// Helper to check if all client details are filled
const hasCompleteClientInfo = (name?: string, email?: string, phone?: string, address?: string) => {
  return !!(name && email && phone && address);
};

export function QuoteSidebar({
  form,
  quoteName,
  quoteStatus,
  startDate,
  endDate,
  rentalDays,
  subtotal,
  discountAmount,
  discountType,
  taxRate,
  totalAmount,
  onPreview,
  onDownload,
  onSend,
  isGeneratingPDF = false,
}: QuoteSidebarProps) {
  // Translation hooks
  const { translated: financialSummaryTitle } = useTranslate('Financial Summary');
  const { translated: financialSummaryDesc } = useTranslate('Configure pricing, discounts, and tax calculations');
  const { translated: pricingConfigTitle } = useTranslate('Pricing Configuration');
  const { translated: discountTypeLabel } = useTranslate('Discount Type');
  const { translated: fixedAmountLabel } = useTranslate('Fixed Amount (€)');
  const { translated: percentageLabel } = useTranslate('Percentage (%)');
  const { translated: discountAmountLabel } = useTranslate('Discount Amount');
  const { translated: taxRateLabel } = useTranslate('Tax Rate (%)');
  const { translated: costBreakdownTitle } = useTranslate('Cost Breakdown');
  const { translated: subtotalLabel } = useTranslate('Subtotal');
  const { translated: discountLabel } = useTranslate('Discount');
  const { translated: beforeTaxLabel } = useTranslate('Before Tax');
  const { translated: taxLabel } = useTranslate('Tax');
  const { translated: totalAmountLabel } = useTranslate('Total Amount');
  const { translated: totalDescText } = useTranslate('Final quote total including all items, discounts, and taxes');
  const { translated: sendInvoiceText } = useTranslate('Send Invoice');

  const discountValue = discountType === 'percentage' 
    ? (subtotal * (discountAmount / 100)) 
    : discountAmount;

  const taxAmount = (subtotal - discountValue) * (taxRate / 100);

  return (
    <div className="space-y-4 sticky top-0 h-fit">
      {/* Financial Summary Card */}
      <Card className="shadow-xl border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold leading-none tracking-tight">{financialSummaryTitle}</CardTitle>
          <CardDescription>{financialSummaryDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pricing Configuration */}
          <div className="bg-muted/20 p-6 rounded-lg mb-6 border border-border/30">
            <h4 className="font-semibold text-card-foreground mb-4">{pricingConfigTitle}</h4>
            <div className="space-y-3">
              {/* Discount Type */}
              <FormField control={form.control} name="discountType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">{discountTypeLabel}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="fixed" className="rounded-md">{fixedAmountLabel}</SelectItem>
                        <SelectItem value="percentage" className="rounded-md">{percentageLabel}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Discount Amount */}
              <FormField control={form.control} name="discountAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">
                    {discountAmountLabel} {form.watch('discountType') === 'percentage' ? '(%)' : '(€)'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      className="h-9 text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Tax Rate */}
              <FormField control={form.control} name="taxRate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">{taxRateLabel}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      className="h-9 text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-muted/20 p-6 rounded-lg border border-border/30" aria-live="polite" aria-label="Financial summary">
            <h4 className="font-semibold text-card-foreground mb-5">{costBreakdownTitle}</h4>
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{subtotalLabel}</span>
                </div>
                <span className="font-semibold text-card-foreground">€{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount */}
              {discountValue > 0 && (
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm">{discountLabel} {discountType === 'percentage' ? `(${discountAmount}%)` : ''}</span>
                  </div>
                  <span className="font-semibold">-€{discountValue.toFixed(2)}</span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-border/50 my-2"></div>

              {/* Subtotal After Discount */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{beforeTaxLabel}</span>
                <span className="font-semibold text-card-foreground">€{(subtotal - discountValue).toFixed(2)}</span>
              </div>

              {/* Tax */}
              {taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{taxLabel} ({taxRate}%)</span>
                  </div>
                  <span className="font-semibold text-card-foreground">€{taxAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Final Total - Prominent */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 text-foreground p-5 rounded-xl mt-5 border-2 border-primary/30 shadow-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold">{totalAmountLabel}</span>
                    <span className="text-4xl font-bold tracking-tight">€{totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {totalDescText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        {onSend && (
          <Button
            type="button"
            onClick={onSend}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendInvoiceText}
          </Button>
        )}
        <div className="flex gap-2">
          {onPreview && (
            <Button
              type="button"
              variant="outline"
              onClick={onPreview}
              className="flex-1"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button
              type="button"
              variant="outline"
              onClick={onDownload}
              disabled={isGeneratingPDF}
              className="flex-1"
            >
              {isGeneratingPDF ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
