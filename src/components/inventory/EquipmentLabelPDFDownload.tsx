// src/components/inventory/EquipmentLabelPDFDownload.tsx
// Componente para download de etiquetas em PDF
// Integrado com EquipmentLabelPDFGenerator e BrandingContext

"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EquipmentLabelPDFGenerator, type LabelTemplate, LABEL_TEMPLATES } from '@/lib/equipment-label-pdf-generator';
import type { EquipmentItem } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EquipmentLabelPDFDownloadProps {
  selectedItems: EquipmentItem[];
  quantities: Map<string, number>;  // itemId → quantity
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
}

export function EquipmentLabelPDFDownload({
  selectedItems,
  quantities,
  onDownloadStart,
  onDownloadComplete,
}: EquipmentLabelPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>('flightcase');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'pt'>('pt');
  const { toast } = useToast();

  // Calcular total de etiquetas
  const totalLabels = Array.from(quantities.values()).reduce((sum, qty) => sum + qty, 0);

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedItems || selectedItems.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um item.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);
      onDownloadStart?.();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const filename = `equipment-labels-${selectedTemplate}-${timestamp}.pdf`;

      // Gerar PDF usando a classe
      const blob = await EquipmentLabelPDFGenerator.generateLabelsPDF(
        selectedItems,
        quantities,
        {
          download: true,
          filename,
          templateSize: selectedTemplate,
          language: selectedLanguage,
        }
      );

      // Toast de sucesso
      const labelText = selectedLanguage === 'pt' 
        ? `${totalLabels} etiqueta${totalLabels > 1 ? 's' : ''} gerada${totalLabels > 1 ? 's' : ''}`
        : `${totalLabels} label${totalLabels > 1 ? 's' : ''} generated`;

      toast({
        title: selectedLanguage === 'pt' ? 'Sucesso!' : 'Success!',
        description: selectedLanguage === 'pt'
          ? `${labelText} em formato ${LABEL_TEMPLATES[selectedTemplate].name}`
          : `${labelText} in ${LABEL_TEMPLATES[selectedTemplate].name} format`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: selectedLanguage === 'pt' ? 'Erro' : 'Error',
        description: selectedLanguage === 'pt'
          ? 'Erro ao gerar PDF. Tente novamente.'
          : 'Error generating PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      onDownloadComplete?.();
    }
  }, [selectedItems, quantities, selectedTemplate, selectedLanguage, toast, totalLabels, onDownloadStart, onDownloadComplete]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {selectedLanguage === 'pt' ? 'Gerar Etiquetas PDF' : 'Generate PDF Labels'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {totalLabels} {selectedLanguage === 'pt' ? 'etiqueta(s)' : 'label(s)'}
        </span>
      </div>

      {/* Seletor de Template */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {selectedLanguage === 'pt' ? 'Tamanho da Etiqueta' : 'Label Size'}
        </label>
        <Select value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as LabelTemplate)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LABEL_TEMPLATES).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{template.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {template.width}×{template.height}mm - {template.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seletor de Idioma */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {selectedLanguage === 'pt' ? 'Idioma' : 'Language'}
        </label>
        <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as 'en' | 'pt')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview do Template Selecionado */}
      <div className="p-3 bg-muted rounded-md border border-border">
        <div className="text-sm space-y-1">
          <p className="font-medium">{LABEL_TEMPLATES[selectedTemplate].name}</p>
          <p className="text-xs text-muted-foreground">
            {LABEL_TEMPLATES[selectedTemplate].width}mm × {LABEL_TEMPLATES[selectedTemplate].height}mm
          </p>
          <p className="text-xs text-muted-foreground">
            {LABEL_TEMPLATES[selectedTemplate].description}
          </p>
        </div>
      </div>

      {/* Botão de Download */}
      <Button
        onClick={handleDownloadPDF}
        disabled={isGenerating || selectedItems.length === 0}
        className="w-full gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {selectedLanguage === 'pt' ? 'Gerando...' : 'Generating...'}
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {selectedLanguage === 'pt' ? 'Download PDF' : 'Download PDF'}
          </>
        )}
      </Button>

      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        {selectedLanguage === 'pt'
          ? `${totalLabels} página${totalLabels > 1 ? 's' : ''} serão geradas. Cada item com quantidade > 1 gerará múltiplas etiquetas.`
          : `${totalLabels} page${totalLabels > 1 ? 's' : ''} will be generated. Each item with quantity > 1 will generate multiple labels.`}
      </p>
    </div>
  );
}
