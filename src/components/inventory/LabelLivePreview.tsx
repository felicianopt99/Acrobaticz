"use client";

import { useMemo, useEffect, useState } from 'react';
import { EquipmentItem } from '@/types';
import { type LabelTemplate } from '@/lib/equipment-label-pdf-generator';
import { useBrandingConfig } from '@/contexts/BrandingContext';
import QRCode from 'qrcode';

interface LabelLivePreviewProps {
  item: EquipmentItem | null;
  template: LabelTemplate;
  companyName: string;
  isGenerating?: boolean;
}

/**
 * LabelLivePreview: Renderiza a etiqueta em tempo real com tamanho real (proporção mm→px)
 * 
 * Usa CSS puro para simular exatamente como aparecerá no PDF
 * Mostra animação de pulse enquanto o QR está a ser gerado
 * Integra logo real do admin branding
 */
export function LabelLivePreview({ 
  item, 
  template, 
  companyName,
  isGenerating = false 
}: LabelLivePreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const branding = useBrandingConfig();

  // Configurações de template (mm → px com escala 3.78px per mm no ecrã)
  const templateDimensions = useMemo(() => {
    const scale = 3.78; // pixels per mm
    const templates: Record<LabelTemplate, { width: number; height: number; name: string }> = {
      cable: { 
        width: Math.round(25 * scale),      // 25mm
        height: Math.round(75 * scale),     // 75mm
        name: 'Cable Tag'
      },
      small: {
        width: Math.round(50 * scale),      // 50mm
        height: Math.round(30 * scale),     // 30mm
        name: 'Small Case'
      },
      flightcase: {
        width: Math.round(100 * scale),     // 100mm
        height: Math.round(75 * scale),     // 75mm
        name: 'Flightcase'
      },
      shipping: {
        width: Math.round(210 * scale),     // 210mm (A6 width)
        height: Math.round(148 * scale),    // 148mm (A6 height)
        name: 'Shipping Label'
      }
    };
    return templates[template];
  }, [template]);

  // Gerar QR code quando item muda
  useEffect(() => {
    const generateQR = async () => {
      if (!item) {
        setQrDataUrl('');
        return;
      }

      setIsLoadingQR(true);
      try {
        // Usar a mesma função de normalização que o PDF generator
        const payload = `av-rental://equipment/${item.id}`;
        
        // Usar QRCode.toDataURL diretamente para o preview
        const qrUrl = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 200,
          margin: 1,
          scale: 10,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code preview:', error);
        setQrDataUrl('');
      } finally {
        setIsLoadingQR(false);
      }
    };

    generateQR();
  }, [item]);

  // Buscar logo do branding
  useEffect(() => {
    // Usar exclusivamente pdfLogoUrl (única fonte de verdade)
    const url = branding?.pdfLogoUrl || '';
    setLogoUrl(url);
  }, [branding?.pdfLogoUrl]);

  if (!item) {
    return (
      <div 
        className="flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-xl"
        style={{
          width: `${templateDimensions.width}px`,
          height: `${templateDimensions.height}px`,
        }}
      >
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Select an item to preview</p>
          <p className="text-xs">{templateDimensions.name}</p>
        </div>
      </div>
    );
  }

  // Layout diferente por template
  const isVertical = ['cable'].includes(template);
  const isCompact = ['small'].includes(template);

  return (
    <div
      className={`
        relative bg-white rounded-lg border border-gray-200 shadow-xl
        flex flex-col overflow-hidden
        transition-all duration-200
        ${isGenerating || isLoadingQR ? 'ring-2 ring-blue-400 animate-pulse' : ''}
      `}
      style={{
        width: `${templateDimensions.width}px`,
        height: `${templateDimensions.height}px`,
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-white" />

      {/* Conteúdo */}
      <div className="relative p-1 h-full flex flex-col">
        {/* ===== HEADER: Logo + Company Name ===== */}
        <div className="flex-shrink-0 border-b border-gray-300 pb-1 gap-1 flex items-center">
          {logoUrl && (
            <img 
              src={logoUrl}
              alt="Company Logo"
              className="h-4 object-contain flex-shrink-0"
              style={{
                maxWidth: template === 'flightcase' ? '25%' : template === 'shipping' ? '40%' : '20%'
              }}
            />
          )}
          <p className="text-xs font-bold text-gray-900 truncate px-1 leading-tight flex-1">
            {companyName || 'Company Name'}
          </p>
        </div>

        {/* ===== BODY: Layout por tipo ===== */}
        {isVertical ? (
          // Cable: Vertical layout (nome, QR, SEM ID no preview)
          <div className="flex-1 flex flex-col items-center justify-between py-1 px-1">
            {/* Nome */}
            <div className="text-center">
              <p className="text-[6px] font-bold text-gray-800 truncate max-w-[80%]">
                {item.name}
              </p>
            </div>

            {/* QR Code (micro) com quiet zone visual de 3mm */}
            {qrDataUrl && (
              <div className="relative p-1 bg-white border border-gray-200">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code"
                  className="w-6 h-6"
                />
              </div>
            )}

            {/* Categoria (itálico, sem ID) */}
            <p className="text-[4px] italic text-gray-600 truncate max-w-[80%]">
              {item.type || '—'}
            </p>
          </div>
        ) : isCompact ? (
          // Small: Split vertical (nome top, QR bottom)
          <div className="flex-1 flex flex-col">
            {/* Top: Nome */}
            <div className="flex-1 flex items-center justify-center border-b border-gray-300">
              <p className="text-[7px] font-bold text-gray-800 truncate px-0.5">
                {item.name.substring(0, 15)}
              </p>
            </div>

            {/* Bottom: QR */}
            <div className="flex-1 flex items-center justify-center">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code"
                  className="w-4 h-4"
                />
              )}
            </div>
          </div>
        ) : (
          // Flightcase + Shipping: Horizontal (text left, QR right com quiet zone)
          <div className="flex-1 flex gap-1 p-1">
            {/* Esquerda: Text (Nome Bold + Categoria Itálica, SEM ID) */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <p className="text-[8px] font-bold text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-[6px] italic text-gray-600 truncate">
                {item.type || 'Equipment'}
              </p>
            </div>

            {/* Direita: QR Code com quiet zone visual (3mm branco ao redor) */}
            {qrDataUrl && (
              <div className="flex items-center justify-center flex-shrink-0 p-0.5 bg-white border border-gray-200 rounded-sm">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code"
                  className={template === 'shipping' ? 'w-12 h-12' : 'w-8 h-8'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {(isGenerating || isLoadingQR) && (
        <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Size indicator (bottom right) */}
      <div className="absolute bottom-0.5 right-0.5 text-[6px] text-gray-400">
        {templateDimensions.name}
      </div>
    </div>
  );
}
