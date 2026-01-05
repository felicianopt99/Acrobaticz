// src/components/partners/PartnerCatalogPDFPreview.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language } from '@/lib/translation';
import { useTranslate } from '@/contexts/TranslationContext';
import { EquipmentItem, Partner } from '@/types';
import { translateText, translateBatch } from '@/lib/client-translation';

interface PartnerCatalogPDFPreviewProps {
  partner: Partner | null;
  equipment: EquipmentItem[];
  isOpen: boolean;
  onClose: () => void;
  customTermsText?: string;
}

export function PartnerCatalogPDFPreview({ 
  partner, 
  equipment, 
  isOpen, 
  onClose,
  customTermsText = ''
}: PartnerCatalogPDFPreviewProps) {
  // Translation hooks
  const { translated: toastDownloadFailedTitle } = useTranslate('Download Failed');
  const { translated: toastTherewasanerrordownl } = useTranslate('There was an error downloading the PDF.');
  const { translated: toastPDFDownloadedTitle } = useTranslate('PDF Downloaded');
  const { translated: toastPDFGenerationFailed } = useTranslate('PDF Generation Failed');
  const { translated: toastTherewasanerrorgener } = useTranslate('There was an error generating the PDF preview.');

  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  // Generate PDF blob when dialog opens, language changes, or terms change
  useEffect(() => {
    if (partner && equipment.length > 0 && isOpen) {
      generatePDFBlob();
    }
    return () => {
      // Cleanup URL when component unmounts or quote changes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [partner, equipment, isOpen, selectedLanguage, customTermsText]);

  const generatePDFBlob = async () => {
    // PDF generation now happens server-side via API
    // For preview, we'll fetch the PDF from the API endpoint
    if (!partner || equipment.length === 0) return;

    try {
      setIsGenerating(true);

      const response = await fetch('/api/partners/catalog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: partner.id,
          partnerName: partner.name,
          companyName: partner.companyName,
          logoUrl: partner.logoUrl,
          equipmentIds: equipment.map(e => e.id),
          language: selectedLanguage,
          download: false,
          customTermsText: customTermsText,
        }),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = response.statusText || 'Unknown error';
        let errorData: any = {};
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
            errorMessage = errorData.details || errorData.error || errorMessage;
          } else {
            // Try to read as text for debugging
            const text = await response.text();
            if (text) {
              errorMessage = text.substring(0, 200); // Limit to first 200 chars
              console.debug('PDF generation error response body:', text);
            }
          }
        } catch (parseError) {
          console.debug('Could not parse error response:', parseError);
          // Continue with statusText as fallback
        }

        const errorInfo = {
          status: response.status,
          statusText: response.statusText,
          contentType,
          errorMessage,
          errorData,
        };

        console.error('PDF generation failed:', errorInfo);
        throw new Error(`Failed to generate PDF (${response.status}): ${errorMessage}`);
      }

      const blob = await response.blob();
      
      // Validate that we got a PDF, not an error
      if (blob.type !== 'application/pdf' && !blob.type.startsWith('application/pdf')) {
        console.warn('Unexpected response type:', blob.type);
        if (blob.size < 100000) {
          // If it's a small response, try to read it as text for debugging
          const text = await blob.text();
          console.error('Response was not a PDF. Content:', text.substring(0, 500));
          throw new Error(`Invalid response type: ${blob.type}. Expected PDF.`);
        }
      }

      setPdfBlob(blob);

      // Create URL for PDF preview
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: toastPDFGenerationFailed,
        description: toastTherewasanerrorgener
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!partner || equipment.length === 0 || !pdfBlob) return;

    try {
      setIsGenerating(true);
      const languageSuffix = selectedLanguage === 'pt' ? '_pt' : '';
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${partner.name}-catalog${languageSuffix}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: toastPDFDownloadedTitle,
        description: `Catalog for ${partner.name} has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: toastDownloadFailedTitle,
        description: toastTherewasanerrordownl
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfBlob(null);
    onClose();
  };

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Catalog PDF Preview - {partner.name}
              </DialogTitle>
              <DialogDescription>
                Preview and download the professional equipment catalog PDF
              </DialogDescription>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2 mr-2">
                <Languages className="h-4 w-4" />
                <Select value={selectedLanguage} onValueChange={(value: Language) => setSelectedLanguage(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <div className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Preview
            </h3>

            <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[70vh]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generating PDF...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0 min-h-[70vh]"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>PDF preview not available</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={generatePDFBlob}
                  >
                    Retry Preview
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Partner: {partner.name} • Items: {equipment.length} • Language: {selectedLanguage === 'pt' ? 'Português' : 'English'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={downloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
