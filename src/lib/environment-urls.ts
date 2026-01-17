/**
 * Environment URL Utility
 * Centraliza a gestão de URLs baseadas em variáveis de ambiente
 * Garante consistência entre Frontend e Backend
 */

/**
 * Obtém a URL base da aplicação (Frontend)
 * - Produção: Use NEXT_PUBLIC_SITE_URL ou NEXT_PUBLIC_APP_URL
 * - Desenvolvimento: Fallback para localhost:3000
 * - Docker: Use o nome do serviço (ex: http://app:3000)
 */
export function getAppURL(): string {
  // Tenta NEXT_PUBLIC_SITE_URL primeiro (preferência)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback para NEXT_PUBLIC_APP_URL
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback para desenvolvimento local
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : 'https://localhost:3000'; // Nunca deve usar localhost em produção real
}

/**
 * Obtém a URL base da API (Backend)
 * - Produção: Use NEXT_PUBLIC_API_URL
 * - Docker: Use http://backend:PORT (nome do serviço)
 * - Desenvolvimento: Use localhost
 */
export function getAPIURL(): string {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Em Next.js, se não estiver no cliente, usar relativamente (/api)
  if (typeof window === 'undefined') {
    return '/api';
  }

  // Cliente: use API relativa ou a mesma origem
  return '/api';
}

/**
 * Obtém a URL base para NextAuth
 * - Produção: Use NEXTAUTH_URL
 * - Docker: Use http://app:3000 (nome do serviço Next.js)
 * - Desenvolvimento: Use localhost:3000
 */
export function getNextAuthURL(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://localhost:3000';
}

/**
 * Resolve uma URL relativa ou absoluta
 * Útil para carregar imagens e recursos
 * 
 * @param url - URL relativa (ex: /images/logo.png) ou absoluta
 * @returns URL absoluta resolvida
 */
export function resolveResourceURL(url: string): string {
  if (!url) {
    return '';
  }

  // Se já é absoluta, retorna como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Se é relativa, adiciona a origem
  if (url.startsWith('/')) {
    const origin = getAppURL();
    return origin.replace(/\/$/, '') + url;
  }

  // Se começa com ponto, é relativa
  if (url.startsWith('.')) {
    const origin = getAppURL();
    return origin.replace(/\/$/, '') + '/' + url.replace(/^\.\//, '');
  }

  // Fallback: assume que é relativa à origem
  const origin = getAppURL();
  return origin.replace(/\/$/, '') + '/' + url;
}

/**
 * Verifica se a app está em produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verifica se a app está em desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Log de variáveis de ambiente (apenas em dev)
 * Útil para debugging
 */
export function debugEnvironmentURLs(): void {
  if (!isDevelopment()) {
    return;
  }

  console.log('[URL-DEBUG] Environment URLs:');
  console.log('  NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('  NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  Resolved App URL:', getAppURL());
  console.log('  Resolved API URL:', getAPIURL());
  console.log('  Resolved NextAuth URL:', getNextAuthURL());
}
