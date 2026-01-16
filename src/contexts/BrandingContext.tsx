"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PDFBrandingConfig {
  pdfLogoUrl: string | null;
  pdfCompanyName: string;
  pdfCompanyTagline: string;
  pdfContactEmail: string;
  pdfContactPhone: string;
  pdfUseTextLogo: boolean;
  pdfFooterMessage: string;
  pdfFooterContactText: string;
  isLoading: boolean;
  isUpdating: boolean;
  lastUpdated: number;
  error: string | null;
}

interface BrandingContextType {
  branding: PDFBrandingConfig;
  updateBrandingLogo: (logoUrl: string) => void;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default branding config
const DEFAULT_BRANDING: PDFBrandingConfig = {
  pdfLogoUrl: null,
  pdfCompanyName: 'AV Rentals',
  pdfCompanyTagline: '',
  pdfContactEmail: '',
  pdfContactPhone: '',
  pdfUseTextLogo: true,
  pdfFooterMessage: '',
  pdfFooterContactText: '',
  isLoading: true,
  isUpdating: false,
  lastUpdated: 0,
  error: null,
};

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PDFBrandingConfig>(DEFAULT_BRANDING);

  // Carrega configurações de PDF branding da API
  const refreshBranding = useCallback(async () => {
    try {
      setBranding(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/customization');
      if (!response.ok) {
        throw new Error('Failed to fetch PDF branding config');
      }

      const config = await response.json();
      
      // Mapeia as chaves do customization para o objeto PDFBrandingConfig
      setBranding(prev => ({
        ...prev,
        pdfLogoUrl: config.pdfLogoUrl || null,
        pdfCompanyName: config.pdfCompanyName || 'AV Rentals',
        pdfCompanyTagline: config.pdfCompanyTagline || '',
        pdfContactEmail: config.pdfContactEmail || '',
        pdfContactPhone: config.pdfContactPhone || '',
        pdfUseTextLogo: config.pdfUseTextLogo ?? true,
        pdfFooterMessage: config.pdfFooterMessage || '',
        pdfFooterContactText: config.pdfFooterContactText || '',
        isLoading: false,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.error('Error loading PDF branding config:', error);
      setBranding(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load branding',
      }));
    }
  }, []);

  // Carrega branding ao montar o componente
  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  // Setup para atualizar logo em tempo real (polling a cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBranding();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refreshBranding]);

  // Atualiza logo localmente e dispara atualização global
  const updateBrandingLogo = useCallback((logoUrl: string) => {
    setBranding(prev => ({
      ...prev,
      pdfLogoUrl: logoUrl,
      isUpdating: true,
    }));

    // Dispara um evento customizado para notificar outros componentes
    const event = new CustomEvent('brandingUpdated', { 
      detail: { logoUrl, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);

    // Atualiza a configuração no backend via /api/customization
    fetch('/api/customization', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfLogoUrl: logoUrl,
      }),
    })
      .then(() => {
        setBranding(prev => ({
          ...prev,
          isUpdating: false,
          lastUpdated: Date.now(),
        }));
      })
      .catch(error => {
        console.error('Error updating PDF branding logo:', error);
        setBranding(prev => ({
          ...prev,
          isUpdating: false,
          error: 'Failed to update logo',
        }));
      });
  }, []);

  const value: BrandingContextType = {
    branding,
    updateBrandingLogo,
    refreshBranding,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

// Hook para usar o contexto de branding
export function useBrandingContext() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  return context;
}

// Hook simplificado para apenas pegar o logo
export function useBrandingLogo() {
  const { branding } = useBrandingContext();
  return branding.pdfLogoUrl;
}

// Hook para pegar todo o config de PDF branding
export function useBrandingConfig() {
  const { branding } = useBrandingContext();
  return branding;
}
