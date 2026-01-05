/**
 * Utility functions for managing business information display in quotes
 * Pulls data from client, partner, or app branding
 */

import type { Client, Partner } from "@/types";

export interface BusinessInfo {
  id: string;
  name: string;
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  source: 'client' | 'partner' | 'app' | 'none';
}

/**
 * Get available business info sources based on form data
 */
export function getAvailableBusinessInfoSources(
  selectedClientId: string | undefined,
  clientName: string,
  selectedPartnerId: string | undefined,
  clients: Client[],
  partners: Partner[],
  appBrandingInfo?: BusinessInfo
): BusinessInfo[] {
  const sources: BusinessInfo[] = [];

  // Add selected client if valid
  if (selectedClientId && selectedClientId !== '__manual_client__') {
    const client = clients.find(c => c.id === selectedClientId);
    if (client) {
      sources.push({
        id: client.id,
        name: client.name,
        address: client.address,
        email: client.email,
        phone: client.phone,
        source: 'client',
      });
    }
  } else if (clientName && selectedClientId === '__manual_client__') {
    // Manual client entry
    sources.push({
      id: '__manual__',
      name: clientName,
      source: 'client',
    });
  }

  // Add selected partner if valid
  if (selectedPartnerId) {
    const partner = partners.find(p => p.id === selectedPartnerId);
    if (partner) {
      sources.push({
        id: partner.id,
        name: partner.name,
        companyName: partner.companyName,
        address: partner.address,
        email: partner.email,
        phone: partner.phone,
        source: 'partner',
      });
    }
  }

  // Add app branding (always available as fallback)
  if (appBrandingInfo) {
    sources.push(appBrandingInfo);
  } else {
    sources.push({
      id: 'app-default',
      name: 'AV Rentals',
      address: '1333 Grey Fox Farm Road',
      city: 'Houston, TX',
      source: 'app',
    });
  }

  return sources;
}

/**
 * Get the display-friendly label for a business info source
 */
export function getSourceLabel(source: BusinessInfo['source']): string {
  switch (source) {
    case 'client':
      return 'Client Details';
    case 'partner':
      return 'Partner Details';
    case 'app':
      return 'Company Branding';
    case 'none':
      return 'None';
    default:
      return 'Unknown';
  }
}

/**
 * Format business info for display in header
 */
export function formatBusinessInfoDisplay(info?: BusinessInfo | null): {
  mainName: string;
  subtitle?: string;
  address?: string;
} {
  if (!info) {
    return {
      mainName: 'AV Rentals',
      subtitle: undefined,
      address: undefined,
    };
  }

  return {
    mainName: info.name,
    subtitle: info.companyName,
    address: info.address && info.city 
      ? `${info.address}, ${info.city}`
      : info.address || info.city,
  };
}

/**
 * Get default business info (app branding)
 */
export function getDefaultBusinessInfo(): BusinessInfo {
  return {
    id: 'app-default',
    name: 'AV Rentals',
    companyName: 'Professional AV Equipment & Services',
    address: '1333 Grey Fox Farm Road',
    city: 'Houston, TX 77060',
    country: 'USA',
    email: 'sales@av-rentals.com',
    phone: '+1 (555) 123-4567',
    source: 'app',
  };
}
