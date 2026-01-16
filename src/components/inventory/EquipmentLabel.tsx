
"use client";

import React from 'react';
import QRCode from 'react-qr-code';
import type { EquipmentItem } from '@/types';
import { useBrandingConfig } from '@/contexts/BrandingContext';

type LabelTemplate = 'cable' | 'small-case' | 'flightcase' | 'shipping';

interface EquipmentLabelProps {
  item: EquipmentItem;
  companyName?: string;
  template?: LabelTemplate;
}

// Template configurations with realistic warehouse dimensions
const TEMPLATE_CONFIG: Record<LabelTemplate, {
  width: number;        // mm
  height: number;       // mm
  layout: 'vertical' | 'horizontal';
  padding: string;
  logoHeight?: string;
  fontSize: { company?: string; item: string; id?: string; qr: string };
  description: string;
}> = {
  cable: {
    // Envolvente - wraps around cable (25×75mm)
    width: 25,
    height: 75,
    layout: 'vertical',
    padding: 'p-1',
    fontSize: { item: 'text-xs', qr: '80' },
    description: 'Cable tag - wrappable (25×75mm)',
  },
  'small-case': {
    // Small flat surfaces (50×30mm) - landscape
    width: 50,
    height: 30,
    layout: 'horizontal',
    padding: 'p-1.5',
    logoHeight: 'h-4',
    fontSize: { item: 'text-xs', qr: '90' },
    description: 'Small case label (50×30mm)',
  },
  flightcase: {
    // Standard logistics (100×75mm) - landscape
    width: 100,
    height: 75,
    layout: 'horizontal',
    padding: 'p-2',
    logoHeight: 'h-6',
    fontSize: { company: 'text-xs', item: 'text-sm', qr: '120' },
    description: 'Flightcase/rack label (100×75mm)',
  },
  shipping: {
    // A6 Pallet label (105×148mm) - portrait
    width: 105,
    height: 148,
    layout: 'vertical',
    padding: 'p-3',
    logoHeight: 'h-8',
    fontSize: { company: 'text-sm', item: 'text-base', id: 'text-xs', qr: '140' },
    description: 'Shipping pallet label A6 (105×148mm)',
  },
};

const EquipmentLabel = React.forwardRef<HTMLDivElement, EquipmentLabelProps>(
  ({ item, companyName, template = 'flightcase' }, ref) => {
    const brandingConfig = useBrandingConfig();
    const config = TEMPLATE_CONFIG[template];

    const qrCodeUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/equipment/${item.id}/edit`
      : '';

    // Calculate pixel dimensions (assuming 96 DPI for screen display)
    const pxWidth = Math.round(config.width * 3.78); // mm to px conversion
    const pxHeight = Math.round(config.height * 3.78);

    const renderContent = () => {
      switch (template) {
        case 'cable':
          // Minimal envolvente design: QR + ID
          return (
            <div className="flex flex-col items-center justify-between gap-0.5 h-full w-full">
              {/* ID or short name at top */}
              <span className="text-[6px] font-bold uppercase tracking-tight">
                {item.id.slice(-4)}
              </span>

              {/* QR Code centered - fills most space */}
              {qrCodeUrl && (
                <div className="flex items-center justify-center flex-1">
                  <QRCode
                    value={qrCodeUrl}
                    size={parseInt(config.fontSize.qr)}
                    level="H"
                  />
                </div>
              )}

              {/* Optional small item identifier */}
              <span className="text-[6px] font-semibold uppercase tracking-tighter line-clamp-1 max-w-full">
                {item.name.slice(0, 12)}
              </span>
            </div>
          );

        case 'small-case':
          // Horizontal layout: Logo left, Name+QR right
          return (
            <div className="flex items-center justify-between gap-1 h-full w-full">
              {/* Logo - left side */}
              {brandingConfig.pdfLogoUrl && (
                <div className={`${config.logoHeight} flex-shrink-0`}>
                  <img
                    src={brandingConfig.pdfLogoUrl}
                    alt="Logo"
                    className="h-full object-contain"
                  />
                </div>
              )}

              {/* Right side: Name + QR stacked */}
              <div className="flex flex-col items-center justify-center gap-1 flex-1">
                {/* Item name */}
                <h4 className={`${config.fontSize.item} font-bold text-center line-clamp-2 leading-tight`}>
                  {item.name.slice(0, 15)}
                </h4>

                {/* QR Code - smaller for compact layout */}
                {qrCodeUrl && (
                  <QRCode
                    value={qrCodeUrl}
                    size={parseInt(config.fontSize.qr)}
                    level="L"
                  />
                )}
              </div>
            </div>
          );

        case 'flightcase':
          // Standard logistics: Logo + Company (top), Name (large middle), QR (bottom)
          return (
            <div className="flex flex-col items-center justify-between gap-1.5 h-full w-full">
              {/* Top section: Logo + Company name */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-full">
                {/* Logo */}
                {brandingConfig.pdfLogoUrl && (
                  <div className={`${config.logoHeight} w-full flex justify-center`}>
                    <img
                      src={brandingConfig.pdfLogoUrl}
                      alt="Logo"
                      className="h-full object-contain max-w-[90%]"
                    />
                  </div>
                )}

                {/* Company name */}
                {companyName && (
                  <p className={`${config.fontSize.company} font-bold uppercase tracking-wide`}>
                    {companyName}
                  </p>
                )}
              </div>

              {/* Middle: Item name - LARGE and prominent */}
              <h2 className="text-lg font-bold text-center line-clamp-3 leading-tight flex-1 flex items-center">
                {item.name}
              </h2>

              {/* Bottom: QR Code - large */}
              {qrCodeUrl && (
                <div className="flex-shrink-0">
                  <QRCode
                    value={qrCodeUrl}
                    size={parseInt(config.fontSize.qr)}
                    level="M"
                    style={{ padding: '2px', background: 'white' }}
                  />
                </div>
              )}
            </div>
          );

        case 'shipping':
          // A6 format: Maximum branding + ID + QR for external logistics
          return (
            <div className="flex flex-col items-center justify-between gap-2 h-full w-full">
              {/* Top: Logo - large and prominent */}
              {brandingConfig.pdfLogoUrl && (
                <div className={`${config.logoHeight} w-full flex justify-center flex-shrink-0`}>
                  <img
                    src={brandingConfig.pdfLogoUrl}
                    alt="Logo"
                    className="h-full object-contain max-w-[95%]"
                  />
                </div>
              )}

              {/* Company name */}
              {companyName && (
                <p className={`${config.fontSize.company} font-bold text-foreground uppercase tracking-wider flex-shrink-0 text-center`}>
                  {companyName}
                </p>
              )}

              {/* Item name - prominent */}
              <h2 className={`${config.fontSize.item} font-bold text-center line-clamp-3 flex-shrink-0`}>
                {item.name}
              </h2>

              {/* Inventory ID */}
              {item.id && (
                <div className={`${config.fontSize.id} font-semibold text-center flex-shrink-0`}>
                  ID: {item.id.slice(-8)}
                </div>
              )}

              {/* QR Code - large and prominent */}
              {qrCodeUrl && (
                <div className="flex-shrink-0 mt-auto">
                  <QRCode
                    value={qrCodeUrl}
                    size={parseInt(config.fontSize.qr)}
                    level="H"
                  />
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <>
        <style>{`
          @media print {
            .equipment-label {
              background-color: #FFFFFF !important;
              color: #000000 !important;
              border-color: #000000 !important;
            }
            .equipment-label img {
              max-width: 100%;
              page-break-inside: avoid;
            }
            .equipment-label svg {
              page-break-inside: avoid;
            }
            .equipment-label * {
              color: #000000 !important;
              background-color: transparent !important;
              box-shadow: none !important;
            }
          }
        `}</style>

        <div
          ref={ref}
          className="equipment-label border border-solid border-gray-300 rounded-sm flex flex-col items-center justify-center text-center bg-white print:bg-white"
          style={{
            width: `${pxWidth}px`,
            height: `${pxHeight}px`,
            padding: '8px',
          }}
        >
          {renderContent()}
        </div>
      </>
    );
  }
);

EquipmentLabel.displayName = 'EquipmentLabel';

export { EquipmentLabel, TEMPLATE_CONFIG, type LabelTemplate };

