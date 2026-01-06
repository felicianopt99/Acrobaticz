'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileDown, FileText, Search, Filter, Eye, Link as LinkIcon, Copy, Check, ChevronDown } from 'lucide-react';
import { EquipmentItem, Partner } from '@/types';
import { PartnerCatalogPDFPreview } from './PartnerCatalogPDFPreview';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { useTranslate } from '@/contexts/TranslationContext';
import { translateText, translateBatch } from '@/lib/client-translation';

interface PartnerCatalogGeneratorProps {
  partnerId: string;
  partnerName: string;
}

export function PartnerCatalogGenerator({ partnerId, partnerName }: PartnerCatalogGeneratorProps) {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [customTerms, setCustomTerms] = useState<string>('');

  // Translation hooks
  const { translated: equipmentCatalog } = useTranslate('Equipment Catalog Generator');
  const { translated: searchEquipment } = useTranslate('Search equipment...');
  const { translated: allCategories } = useTranslate('All Categories');
  const { translated: availableEquipment } = useTranslate('Available Equipment');
  const { translated: selected } = useTranslate('selected');
  const { translated: selectAll } = useTranslate('Select All');
  const { translated: deselectAll } = useTranslate('Deselect All');
  const { translated: noEquipment } = useTranslate('No equipment found matching your search');
  const { translated: generatePdf } = useTranslate('Generate Catalog PDF');
  const { translated: generatingPdf } = useTranslate('Generating PDF...');
  const { translated: pleaseSelect } = useTranslate('Please select at least one equipment item');
  const { translated: catalogSuccess } = useTranslate('Catalog PDF generated and downloaded');
  const { translated: catalogError } = useTranslate('Failed to generate catalog');
  const { translated: previewPdf } = useTranslate('Preview PDF');
  const { translated: generateShareLinkText } = useTranslate('Generate Share Link');
  const { translated: generatingShareLinkText } = useTranslate('Generating link...');
  const { translated: shareLinkGeneratedText } = useTranslate('Share link generated successfully');
  const { translated: copyToClipboardText } = useTranslate('Copy to clipboard');
  const { translated: copiedText } = useTranslate('Copied!');
  const { translated: shareCatalogWithClients } = useTranslate('Share this catalog with clients without login');
  const { translated: termsAndConditionsTitle } = useTranslate('Terms and Conditions');
  const { translated: iAcceptTerms } = useTranslate('I accept the terms and conditions');
  const { translated: acceptTermsRequired } = useTranslate('You must accept the terms and conditions to generate the catalog');
  const { translated: viewTerms } = useTranslate('View Terms and Conditions');
  const { translated: rentalEquipmentTerms } = useTranslate('Equipment rental terms apply. All rental equipment must be returned in good condition. Damage charges may apply.');
  const { translated: editTerms } = useTranslate('Edit Terms and Conditions');

  useEffect(() => {
    loadEquipmentAndPartner();
  }, []);

  const loadEquipmentAndPartner = async () => {
    try {
      const [equipRes, partnerRes, customRes] = await Promise.all([
        fetch('/api/equipment'),
        fetch(`/api/partners?id=${partnerId}`),
        fetch('/api/customization')
      ]);

      if (equipRes.ok) {
        const equipData = await equipRes.json();
        const items = equipData.data || equipData || [];
        setEquipment(items);

        // Extract unique categories
        const cats = [...new Set(items.map((eq: any) => eq.category?.name || 'Other'))];
        setCategories(cats as string[]);
      } else {
        console.error('Equipment fetch error:', equipRes.status, equipRes.statusText);
        toast({
          title: 'Warning',
          description: 'Failed to load equipment',
          variant: 'destructive',
        });
      }

      if (partnerRes.ok) {
        const partnerData = await partnerRes.json();
        // API may return an array of partners or a single partner object.
        let partnerObj: any = null;
        if (Array.isArray(partnerData)) {
          partnerObj = partnerData.find((p: any) => p.id === partnerId) || partnerData[0] || null;
        } else {
          partnerObj = partnerData;
        }
        setPartner(partnerObj);
      } else {
        console.error('Partner fetch error:', partnerRes.status, partnerRes.statusText);
      }

      // Load customization settings including terms and conditions
      if (customRes.ok) {
        const customData = await customRes.json();
        if (customData.catalogTermsAndConditions) {
          setCustomTerms(customData.catalogTermsAndConditions);
        }
      } else {
        console.error('Customization fetch error:', customRes.status, customRes.statusText);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load equipment and partner',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectEquipment = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipment(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEquipment.size === filteredEquipment.length) {
      setSelectedEquipment(new Set());
    } else {
      setSelectedEquipment(new Set(filteredEquipment.map(eq => eq.id)));
    }
  };

  const generateCatalog = async (preview: boolean = false) => {
    if (selectedEquipment.size === 0) {
      toast({
        title: 'Error',
        description: pleaseSelect,
        variant: 'destructive',
      });
      return;
    }

    if (preview) {
      setIsPDFPreviewOpen(true);
      return;
    }

    setGenerating(true);
    try {
      const selectedItems = equipment.filter(e => selectedEquipment.has(e.id));

      // Send request to the new API endpoint for PDF generation
      const response = await fetch('/api/partners/catalog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: partnerId,
          partnerName: partner?.name || partnerName,
          companyName: partner?.companyName,
          logoUrl: partner?.logoUrl,
          equipmentIds: Array.from(selectedEquipment),
          download: true,
          customTermsText: customTerms,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate catalog');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${partner?.name || partnerName}-equipment-catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: catalogSuccess,
      });
    } catch (error) {
      console.error('Catalog generation error:', error);
      toast({
        title: 'Error',
        description: catalogError,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateShareCatalogLink = async () => {
    if (selectedEquipment.size === 0) {
      toast({
        title: 'Error',
        description: pleaseSelect,
        variant: 'destructive',
      });
      return;
    }

    setGeneratingShareLink(true);
    try {
      const response = await fetch('/api/catalog/generate-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: partnerId,
          selectedEquipmentIds: Array.from(selectedEquipment),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate share link');
      }

      const data = await response.json();
      setShareLink(data.shareLink);
      setShowShareLink(true);

      toast({
        title: 'Success',
        description: shareLinkGeneratedText,
      });
    } catch (error) {
      console.error('Share link generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    } finally {
      setGeneratingShareLink(false);
    }
  };

  const copyLinkToClipboard = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedToClipboard(true);
      toast({
        title: 'Success',
        description: copiedText,
      });
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner info with logo */}
      {partner && (
        <Card className="glass-card bg-card/50 border border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {partner.logoUrl && (
                <div className="w-24 h-24 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{partner.name}</h2>
                {partner.companyName && (
                  <p className="text-muted-foreground">{partner.companyName}</p>
                )}
                {partner.address && (
                  <p className="text-sm text-muted-foreground mt-2">{partner.address}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {equipmentCatalog}
          </CardTitle>
          <CardDescription>
            Create a professional PDF catalog of available equipment for {partnerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search, Filter, and Language Selection */}
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchEquipment}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
              >
                <option value="all">{allCategories}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Selection */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {availableEquipment} ({selectedEquipment.size} {selected})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedEquipment.size === filteredEquipment.length ? deselectAll : selectAll}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredEquipment.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 hover:bg-white/5 rounded transition-colors cursor-pointer"
                  onClick={() => handleSelectEquipment(item.id)}
                >
                  <Checkbox
                    checked={selectedEquipment.has(item.id)}
                    onCheckedChange={() => handleSelectEquipment(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                    <p className="text-xs font-semibold text-amber-400 mt-1">
                      €{item.dailyRate?.toFixed(2) || '0.00'} / day
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredEquipment.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {noEquipment}
              </div>
            )}
          </div>


          {/* Terms and Conditions Section */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <Collapsible open={showTerms} onOpenChange={setShowTerms} className="space-y-3">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-2 px-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{viewTerms}</span>
                    <ChevronDown className={`h-4 w-4 text-blue-900 dark:text-blue-100 transition-transform ${showTerms ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-900 dark:text-blue-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{termsAndConditionsTitle}</p>
                      <span className="text-xs text-blue-700 dark:text-blue-300">{editTerms}</span>
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        value={customTerms}
                        onChange={(e) => setCustomTerms(e.target.value)}
                        className="w-full text-xs border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950/50 text-blue-900 dark:text-blue-100 placeholder-blue-500 dark:placeholder-blue-400"
                        placeholder="Enter your terms and conditions. Each line will be treated as a separate point."
                        rows={6}
                      />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Tip: Enter one term per line. These will be included in the catalog PDF.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => generateCatalog(true)}
              disabled={generating || selectedEquipment.size === 0}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewPdf}
            </Button>
            <Button
              onClick={() => generateCatalog(false)}
              disabled={generating || selectedEquipment.size === 0}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              {generating ? (
                <>
                  <div className="animate-spin mr-2">
                    <FileDown className="h-4 w-4" />
                  </div>
                  {generatingPdf}
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  {generatePdf} ({selectedEquipment.size} items)
                </>
              )}
            </Button>
            <Button
              onClick={generateShareCatalogLink}
              disabled={generatingShareLink || selectedEquipment.size === 0}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              {generatingShareLink ? (
                <>
                  <div className="animate-spin mr-2">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  {generatingShareLinkText}
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {generateShareLinkText}
                </>
              )}
            </Button>
          </div>

          {/* Share Link Display */}
          {showShareLink && shareLink && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100">{shareLinkGeneratedText}</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">{shareCatalogWithClients}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-stretch bg-white dark:bg-gray-950 rounded border border-green-200 dark:border-green-800 overflow-hidden">
                    <Input
                      value={shareLink}
                      readOnly
                      className="border-0 focus-visible:ring-0 bg-white dark:bg-gray-950"
                    />
                    <Button
                      onClick={copyLinkToClipboard}
                      variant="ghost"
                      size="sm"
                      className="rounded-none border-l border-green-200 dark:border-green-800"
                    >
                      {copiedToClipboard ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">{copiedText}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="ml-2 text-xs">{copyToClipboardText}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      <PartnerCatalogPDFPreview
        partner={partner}
        equipment={equipment.filter(e => selectedEquipment.has(e.id))}
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
        customTermsText={customTerms}
      />
    </div>
  );
}
