import { z } from 'zod';

/**
 * Installation Setup Schema - Centralizado para validação Frontend + Backend
 * Define o contrato de dados para a finalização da instalação do Acrobaticz
 */

// Regex para validação de password
// Requer: 8+ chars, 1 número
const STRONG_PASSWORD_REGEX = /^(?=.*\d).{8,}$/;

const PASSWORD_ERROR_MESSAGE =
  'Password deve ter no mínimo 8 caracteres e incluir 1 número';

/**
 * Schema para configurações gerais do site
 * Validação de domínio, nome da empresa, código de compra
 */
export const SiteConfigSchema = z.object({
  domain: z
    .string()
    .min(3, 'Domain deve ter no mínimo 3 caracteres')
    .max(255, 'Domain não pode exceder 255 caracteres')
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(:[\d]{1,5})?$/,
      'Domain inválido (ex: example.com, localhost:3000)'
    )
    .describe('Domínio do site (ex: example.com ou localhost:3000)'),

  companyName: z
    .string()
    .min(2, 'Nome da empresa deve ter no mínimo 2 caracteres')
    .max(100, 'Nome da empresa não pode exceder 100 caracteres')
    .describe('Nome legal da empresa'),
});

/**
 * Base schema para credenciais do utilizador administrador (sem refine)
 * Validação de email e password com requisitos de segurança
 */
const AdminCredentialsBaseSchema = z.object({
  adminEmail: z
    .string()
    .email('Email de administrador inválido')
    .max(255, 'Email não pode exceder 255 caracteres')
    .describe('Email do primeiro utilizador administrador'),

  adminPassword: z
    .string()
    .min(8, PASSWORD_ERROR_MESSAGE)
    .regex(STRONG_PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE)
    .describe('Password do administrador com requisitos de segurança'),

  adminPasswordConfirm: z
    .string()
    .describe('Confirmação de password'),
});

/**
 * Schema para credenciais do utilizador administrador
 * Validação de email e password com requisitos de segurança
 */
export const AdminCredentialsSchema = AdminCredentialsBaseSchema.refine(
  (data: Record<string, any>) => data.adminPassword === data.adminPasswordConfirm,
  {
    message: 'Passwords não coincidem',
    path: ['adminPasswordConfirm'],
  }
);

/**
 * Schema para configurações de branding
 * Validação de logo URL e cores opcionais
 */
export const BrandingConfigSchema = z.object({
  logoUrl: z
    .string()
    .url('URL do logo inválida')
    .max(500, 'URL do logo não pode exceder 500 caracteres')
    .optional()
    .or(z.literal(''))
    .describe('URL do logo da empresa (opcional)'),

  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor primária deve ser um código hex válido (#XXXXXX)')
    .optional()
    .or(z.literal(''))
    .describe('Cor primária para branding (hex, opcional)'),

  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor secundária deve ser um código hex válido (#XXXXXX)')
    .optional()
    .or(z.literal(''))
    .describe('Cor secundária para branding (hex, opcional)'),

  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor de destaque deve ser um código hex válido (#XXXXXX)')
    .optional()
    .or(z.literal(''))
    .describe('Cor de destaque para branding (hex, opcional)'),
});

/**
 * Schema para configurações de autenticação e chaves de serviços
 * JWT Secret e API keys para serviços externos
 */
export const AuthConfigSchema = z.object({
  jwtSecret: z
    .string()
    .min(32, 'JWT Secret deve ter no mínimo 32 caracteres')
    .max(500, 'JWT Secret não pode exceder 500 caracteres')
    .describe('Chave criptográfica para assinatura JWT (gerada automaticamente)'),

  deeplApiKey: z
    .string()
    .max(255, 'DeepL API Key não pode exceder 255 caracteres')
    .optional()
    .or(z.literal(''))
    .describe('API Key do DeepL para tradução automática (opcional)'),

  geminiApiKeys: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, 'Nome da chave não pode estar vazio')
          .max(100, 'Nome não pode exceder 100 caracteres')
          .describe('Nome descritivo para a chave Gemini'),
        apiKey: z
          .string()
          .min(1, 'Chave não pode estar vazia')
          .max(500, 'Chave não pode exceder 500 caracteres')
          .describe('API Key do Google Gemini'),
      })
    )
    .optional()
    .default([])
    .describe('Array de múltiplas API Keys do Google Gemini para IA e criação de equipamentos'),
});

/**
 * Base schema para configurações de armazenamento (MinIO/S3) - sem refine
 * Validação de endpoint, credenciais e bucket
 */
const StorageConfigBaseSchema = z.object({
  minioEndpoint: z
    .string()
    .min(5, 'MinIO endpoint inválido')
    .max(255, 'MinIO endpoint não pode exceder 255 caracteres')
    .optional()
    .or(z.literal(''))
    .describe('URL do servidor MinIO (ex: minio:9000, opcional)'),

  minioAccessKey: z
    .string()
    .min(3, 'Access Key inválida')
    .max(255, 'Access Key não pode exceder 255 caracteres')
    .optional()
    .or(z.literal(''))
    .describe('Access Key para autenticação MinIO (opcional)'),

  minioSecretKey: z
    .string()
    .min(8, 'Secret Key deve ter no mínimo 8 caracteres')
    .max(255, 'Secret Key não pode exceder 255 caracteres')
    .optional()
    .or(z.literal(''))
    .describe('Secret Key para autenticação MinIO (opcional)'),

  minioBucket: z
    .string()
    .min(3, 'Bucket name deve ter no mínimo 3 caracteres')
    .max(63, 'Bucket name não pode exceder 63 caracteres')
    .regex(
      /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/,
      'Bucket name inválido (letras minúsculas, números, hífens e pontos)'
    )
    .optional()
    .or(z.literal(''))
    .describe('Nome do bucket S3/MinIO (opcional)'),
});

/**
 * Schema para configurações de armazenamento (MinIO/S3)
 * Validação de endpoint, credenciais e bucket
 */
export const StorageConfigSchema = StorageConfigBaseSchema.refine(
  // Se algum campo é preenchido, todos os campos obrigatórios devem estar preenchidos
  (data: Record<string, any>) => {
    const hasAnyField = Boolean(data.minioEndpoint || data.minioAccessKey || data.minioSecretKey || data.minioBucket);
    if (!hasAnyField) return true; // Todos opcionais - OK

    // Se algum é preenchido, todos são obrigatórios
    return Boolean(data.minioEndpoint && data.minioAccessKey && data.minioSecretKey && data.minioBucket);
  },
  {
    message: 'Se configurar MinIO, todos os campos (Endpoint, Access Key, Secret Key, Bucket) são obrigatórios',
    path: ['minioEndpoint'],
  }
);

/**
 * Schema PRINCIPAL para o payload completo de instalação
 * Combina todos os schemas anteriores em um único contrato
 */
export const InstallationCompleteSchema = z
  .object({
    // Site Configuration
    domain: SiteConfigSchema.shape.domain,
    companyName: SiteConfigSchema.shape.companyName,

    // Admin Credentials
    adminEmail: AdminCredentialsBaseSchema.shape.adminEmail,
    adminPassword: AdminCredentialsBaseSchema.shape.adminPassword,
    adminPasswordConfirm: AdminCredentialsBaseSchema.shape.adminPasswordConfirm,

    // Branding Configuration
    logoUrl: BrandingConfigSchema.shape.logoUrl,
    primaryColor: BrandingConfigSchema.shape.primaryColor,
    secondaryColor: BrandingConfigSchema.shape.secondaryColor,
    accentColor: BrandingConfigSchema.shape.accentColor,

    // Authentication & Services
    jwtSecret: AuthConfigSchema.shape.jwtSecret,
    deeplApiKey: AuthConfigSchema.shape.deeplApiKey,
    geminiApiKeys: AuthConfigSchema.shape.geminiApiKeys,

    // Storage Configuration (opcional)
    minioEndpoint: StorageConfigBaseSchema.shape.minioEndpoint,
    minioAccessKey: StorageConfigBaseSchema.shape.minioAccessKey,
    minioSecretKey: StorageConfigBaseSchema.shape.minioSecretKey,
    minioBucket: StorageConfigBaseSchema.shape.minioBucket,
  })
  .strict() // Rejeita campos extras
  .refine(
    // Se algum campo MinIO é preenchido, todos os campos obrigatórios devem estar preenchidos
    (data) => {
      const hasAnyField = Boolean(
        data.minioEndpoint ||
          data.minioAccessKey ||
          data.minioSecretKey ||
          data.minioBucket
      );
      if (!hasAnyField) return true; // Todos opcionais - OK

      // Se algum é preenchido, todos são obrigatórios
      return Boolean(
        data.minioEndpoint &&
          data.minioAccessKey &&
          data.minioSecretKey &&
          data.minioBucket
      );
    },
    {
      message:
        'Se configurar MinIO, todos os campos (Endpoint, Access Key, Secret Key, Bucket) são obrigatórios',
      path: ['minioEndpoint'],
    }
  );

/**
 * Type-safe interface gerada a partir do schema
 * Usada no frontend para form values e no backend para parsed request body
 */
export type InstallationCompletePayload = z.infer<typeof InstallationCompleteSchema>;

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type AdminCredentials = z.infer<typeof AdminCredentialsSchema>;
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;

/**
 * Helper function para validar um objeto contra o schema
 * Retorna resultado com tipo discriminado (success | error)
 */
export function validateInstallationData(data: unknown) {
  return InstallationCompleteSchema.safeParse(data);
}

/**
 * Helper para extração segura de erros de validação
 * Formata mensagens de erro para exibição no frontend
 */
export function formatValidationErrors(issues: z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  return errors;
}
