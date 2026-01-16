
"use client";

import { 
  useState, 
  useMemo, 
  useCallback, 
  useRef, 
  createRef, 
  useEffect,
  useTransition 
} from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useBrandingConfig, useBrandingContext } from '@/contexts/BrandingContext';
import { EquipmentLabelPDFGenerator, type LabelTemplate } from '@/lib/equipment-label-pdf-generator';
import { LabelLivePreview } from './LabelLivePreview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Search, 
  RefreshCw, 
  Loader2,
  FileText,
  Zap
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useTranslate } from '@/contexts/TranslationContext';
import { debounce } from '@/lib/utils';

const TEMPLATE_SPECS: Record<LabelTemplate, {
  label: string;
  width: number;
  height: number;
  description: string;
}> = {
  cable: { 
    label: 'Cable Tag',
    width: 25,
    height: 75,
    description: 'Para cabos e conectores'
  },
  small: {
    label: 'Small Case',
    width: 50,
    height: 30,
    description: 'Para cases compactos'
  },
  flightcase: {
    label: 'Flightcase (Recomendado)',
    width: 100,
    height: 75,
    description: 'Standard para armazém'
  },
  shipping: {
    label: 'Shipping Label (A6)',
    width: 210,
    height: 148,
    description: 'Para envios e paletes'
  }
};

export function InventoryLabelGenerator() {
  const { translated: attrSearchequipmentText } = useTranslate('Search equipment...');
  const { translated: uiCompanyNameforLabelsText } = useTranslate('Company Name for Labels');
  const { translated: uiInventoryLabelGeneraText } = useTranslate('Inventory Label Generator');
  const { translated: toastDownloadCompletTitleText } = useTranslate('Download Complete');

  const { equipment, isDataLoaded } = useAppContext();
  const branding = useBrandingConfig();
  const { refreshBranding } = useBrandingContext();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // States
  const [selectedQuantities, setSelectedQuantities] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [companyName, setCompanyName] = useState(branding.pdfCompanyName || APP_NAME);
  const [labelTemplate, setLabelTemplate] = useState<LabelTemplate>('flightcase');
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Sincronizar company name com branding
  useEffect(() => {
    if (branding.pdfCompanyName) {
      setCompanyName(branding.pdfCompanyName);
    }
  }, [branding.pdfCompanyName]);

  // Listener de updates de branding
  useEffect(() => {
    const handleBrandingUpdate = () => {
      refreshBranding();
    };
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    return () => window.removeEventListener('brandingUpdated', handleBrandingUpdate);
  }, [refreshBranding]);

  const filteredEquipment = useMemo(() => 
    equipment.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [equipment, searchTerm]
  );

  // Debounced preview update (300ms)
  const debouncedPreviewUpdate = useCallback(
    debounce((itemId: string | null) => {
      setPreviewItem(itemId);
    }, 300),
    []
  );

  const handleSelectItem = (itemId: string, quantity: number) => {
    setSelectedQuantities(prev => {
      const newMap = new Map(prev);
      if (quantity > 0) {
        newMap.set(itemId, quantity);
        // Auto-preview ao selecionar
        debouncedPreviewUpdate(itemId);
      } else {
        newMap.delete(itemId);
      }
      return newMap;
    });
  };

  const totalLabels = Array.from(selectedQuantities.values()).reduce((sum, qty) => sum + qty, 0);
  const estimatedPages = Math.ceil(totalLabels / (labelTemplate === 'shipping' ? 2 : 6));
  const estimatedFileSize = Math.round((estimatedPages * 150) / 1024); // KB

  // Download PDF
  const handleDownload = useCallback(async () => {
    if (selectedQuantities.size === 0) return;

    setIsGeneratingPDF(true);
    startTransition(async () => {
      try {
        toast({
          title: 'Generating PDF...',
          description: `Preparing ${totalLabels} labels...`,
        });

        const selectedItems = Array.from(selectedQuantities.keys())
          .map(id => equipment.find(e => e.id === id))
          .filter((item): item is typeof equipment[0] => item !== undefined);

        const blob = await EquipmentLabelPDFGenerator.generateLabelsPDF(
          selectedItems,
          selectedQuantities,
          {
            download: true,
            filename: `equipment-labels-${labelTemplate}-${Date.now()}.pdf`,
            templateSize: labelTemplate,
            language: 'pt'
          }
        );

        toast({
          title: toastDownloadCompletTitleText,
          description: `Successfully generated ${totalLabels} labels PDF`,
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate PDF labels',
        });
      } finally {
        setIsGeneratingPDF(false);
      }
    });
  }, [selectedQuantities, equipment, labelTemplate, totalLabels, toast]);

  const previewItemData = previewItem 
    ? equipment.find(e => e.id === previewItem) || null 
    : null;

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HEADER COM BOTÃO DOWNLOAD GRANDE ===== */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{uiInventoryLabelGeneraText}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Professional equipment label generation with real-time preview
          </p>
        </div>

        {/* Download Button Grande */}
        <Button
          onClick={handleDownload}
          disabled={selectedQuantities.size === 0 || isGeneratingPDF || isPending}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
        >
          <Download className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="font-semibold">{isGeneratingPDF ? 'Generating...' : 'Generate PDF'}</span>
            {totalLabels > 0 && (
              <span className="text-xs opacity-90">
                {totalLabels} labels • {estimatedPages}p • ~{estimatedFileSize}KB
              </span>
            )}
          </div>
          {isGeneratingPDF && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>

      {/* ===== MAIN CONTENT: Controles à esquerda + Preview à direita ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ===== LEFT: Controles ===== */}
        <div className="xl:col-span-2 space-y-6">
          {/* Template & Company Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Label Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Template Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Template</Label>
                  <Select value={labelTemplate} onValueChange={(v) => setLabelTemplate(v as LabelTemplate)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATE_SPECS).map(([key, spec]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{spec.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {spec.width}×{spec.height}mm
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {TEMPLATE_SPECS[labelTemplate].description}
                  </p>
                </div>

                {/* Company Name */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">{uiCompanyNameforLabelsText}</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={APP_NAME}
                    className="bg-background"
                  />
                  {branding.pdfCompanyName && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Auto-synced from Branding
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment List */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="text-lg">Equipment</CardTitle>
                <CardDescription className="mt-1">
                  {selectedQuantities.size} selected • {totalLabels} total labels
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={attrSearchequipmentText}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 w-48 bg-background text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-2">
                  {filteredEquipment.map(item => {
                    const qty = selectedQuantities.get(item.id) || 0;
                    const isSelected = qty > 0;
                    const isPreview = item.id === previewItem;

                    return (
                      <div
                        key={item.id}
                        onClick={() => debouncedPreviewUpdate(item.id)}
                        className={`
                          p-3 rounded-lg border-2 transition-all cursor-pointer
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : isPreview
                            ? 'border-blue-300 bg-blue-25 dark:bg-blue-900/30'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-900/30'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {item.quantity || 0} units
                            </p>
                          </div>

                          {/* Quantity Input - Redesigned */}
                          <div className="flex items-center gap-1 bg-background rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(item.id, Math.max(0, qty - 1));
                              }}
                              className="text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              −
                            </button>

                            <input
                              type="number"
                              min="0"
                              max={item.quantity || 1000}
                              value={qty}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newQty = Math.max(0, parseInt(e.target.value) || 0);
                                handleSelectItem(item.id, newQty);
                              }}
                              className="w-12 text-center text-sm font-bold bg-transparent border-0 outline-none"
                            />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(item.id, qty + 1);
                              }}
                              className="text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Badge de quantidade */}
                          {isSelected && (
                            <Badge className="bg-blue-600 text-white flex-shrink-0">
                              {qty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredEquipment.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No equipment found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ===== RIGHT: PREVIEW CARD ===== */}
        <div className="xl:col-span-1">
          <Card className="border-0 shadow-lg sticky top-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Preview</CardTitle>
                {(isGeneratingPDF || isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
              <CardDescription className="mt-1 text-xs">
                {previewItemData 
                  ? `${previewItemData.name}`
                  : 'Select item to preview'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex items-center justify-center">
              <LabelLivePreview
                item={previewItemData}
                template={labelTemplate}
                companyName={companyName}
                isGenerating={isGeneratingPDF || isPending}
              />
            </CardContent>

            {/* Info Box */}
            {previewItemData && (
              <div className="border-t px-4 py-3 bg-blue-50 dark:bg-blue-950/30 text-xs space-y-1">
                <p><strong>ID:</strong> {previewItemData.id.substring(0, 12)}...</p>
                <p><strong>Type:</strong> {previewItemData.type || 'Equipment'}</p>
                <p><strong>Template:</strong> {TEMPLATE_SPECS[labelTemplate].width}×{TEMPLATE_SPECS[labelTemplate].height}mm</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Summary Info */}
      {totalLabels > 0 && (
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Ready to Generate</p>
                <p className="text-xs text-muted-foreground">
                  {totalLabels} labels • {estimatedPages} page(s) • ~{estimatedFileSize}KB
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownload}
              disabled={isGeneratingPDF || isPending}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-1" />
              Download Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

