"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Eye } from "lucide-react";
import type { BusinessInfo } from "@/lib/quote-business-info";
import { formatBusinessInfoDisplay, getSourceLabel } from "@/lib/quote-business-info";

interface QuoteHeaderProps {
  selectedBusinessInfo?: BusinessInfo;
  availableSources: BusinessInfo[];
  onSourceChange: (source: BusinessInfo) => void;
  quoteNumber?: string;
  isEditing: boolean;
  autoSaveStatus?: 'draft' | 'saving' | 'saved';
  lastSaved?: Date;
  onPreview?: () => void;
  onDownload?: () => void;
  isGeneratingPDF?: boolean;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  location?: string;
}

export function QuoteFormHeader({
  selectedBusinessInfo,
  availableSources,
  onSourceChange,
  quoteNumber,
  isEditing,
  autoSaveStatus = 'draft',
  lastSaved,
  onPreview,
  onDownload,
  isGeneratingPDF = false,
  clientName,
  clientEmail,
  clientPhone,
  clientAddress,
  location,
}: QuoteHeaderProps) {
  // Always use app branding for display header (default)
  const appBranding = availableSources.find(s => s.source === 'app') || availableSources[0];
  const current = appBranding;
  const displayInfo = formatBusinessInfoDisplay(current);

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Save Status */}
          <div className="lg:col-span-1">
            {!isEditing && (
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 w-full justify-center ${
                  autoSaveStatus === 'saved' ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700' :
                  autoSaveStatus === 'saving' ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-700' :
                  'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                    autoSaveStatus === 'saved' ? 'bg-green-500' :
                    autoSaveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-400'
                  }`}></div>
                  <span className={`text-xs font-medium ${
                    autoSaveStatus === 'saved' ? 'text-green-600 dark:text-green-400' :
                    autoSaveStatus === 'saving' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {autoSaveStatus === 'saved' && lastSaved ? 
                      `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                      autoSaveStatus === 'saving' ? 'Saving...' :
                      'Draft'
                    }
                  </span>
                </div>
              </div>
            )}

            {isEditing && quoteNumber && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-full w-full justify-center">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Quote #{quoteNumber}
                </span>
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            {(onPreview || onDownload) && (
              <div className="flex gap-2">
                {onPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onPreview}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                )}
                {onDownload && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onDownload}
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    {isGeneratingPDF ? 'Generating...' : 'Download'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
