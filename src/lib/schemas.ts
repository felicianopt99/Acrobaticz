/**
 * Zod Schemas para Validação e Sanitização XSS
 * Inclui transformações customizadas para remover HTML/scripts
 * 
 * FEATURES:
 * 1. XSS Prevention: Remove all HTML tags
 * 2. Type-Safe: Full TypeScript inference
 * 3. Reusable: Schemas para todas as entidades
 * 4. Custom Validators: Datas futuras, ranges, enums
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ============================================================================
// SANITIZAÇÃO HELPERS
// ============================================================================

/**
 * Sanitizar string removendo HTML tags
 * Usa DOMPurify para remoção segura de scripts
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Sanitizar e validar email
 */
function sanitizeEmail(input: string): string {
  return sanitizeString(input).toLowerCase();
}

/**
 * Sanitizar URL
 */
function sanitizeUrl(input: string): string {
  const sanitized = sanitizeString(input);
  try {
    // Validar que é uma URL válida
    new URL(sanitized);
    return sanitized;
  } catch {
    throw new Error('URL inválida');
  }
}

/**
 * Sanitizar telefone (remover caracteres não numéricos)
 */
function sanitizePhone(input: string): string {
  const sanitized = sanitizeString(input);
  const cleaned = sanitized.replace(/\D/g, '');
  if (cleaned.length < 9) {
    throw new Error('Telefone deve ter pelo menos 9 dígitos');
  }
  return cleaned;
}

// ============================================================================
// CUSTOM ZOD TRANSFORMERS
// ============================================================================

export const SafeString = z
  .string()
  .min(1, 'Campo obrigatório')
  .max(500, 'Máximo 500 caracteres')
  .transform(sanitizeString);

export const SafeStringLong = z
  .string()
  .min(1, 'Campo obrigatório')
  .max(5000, 'Máximo 5000 caracteres')
  .transform(sanitizeString);

export const SafeEmail = z
  .string()
  .email('Email inválido')
  .max(255, 'Máximo 255 caracteres')
  .transform(sanitizeEmail);

export const SafePhone = z
  .string()
  .min(9, 'Mínimo 9 dígitos')
  .max(20, 'Máximo 20 caracteres')
  .transform(sanitizePhone);

export const SafeUrl = z
  .string()
  .url('URL inválida')
  .max(2048, 'URL muito longa')
  .transform(sanitizeUrl)
  .optional();

export const SafeDate = z
  .string()
  .datetime('Data/hora inválida')
  .transform((val) => new Date(val));

export const SafeDateFuture = z
  .string()
  .datetime('Data/hora inválida')
  .transform((val) => new Date(val))
  .refine(
    (date) => date > new Date(),
    'A data deve estar no futuro',
  );

// ============================================================================
// RENTAL SCHEMAS
// ============================================================================

export const RentalCreateSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  equipmentIds: z
    .array(z.string().uuid('ID de equipamento inválido'))
    .min(1, 'Mínimo 1 equipamento'),
  startDate: SafeDateFuture,
  endDate: SafeDateFuture,
  notes: SafeStringLong.optional(),
  totalPrice: z.number().positive('Preço deve ser positivo'),
  discountPercentage: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .optional()
    .default(0),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('PENDING'),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK'])
    .optional(),
  paymentStatus: z
    .enum(['PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED'])
    .optional()
    .default('PENDING'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate'],
  },
);

export const RentalUpdateSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido').optional(),
  equipmentIds: z
    .array(z.string().uuid('ID de equipamento inválido'))
    .min(1, 'Mínimo 1 equipamento')
    .optional(),
  startDate: SafeDateFuture.optional(),
  endDate: SafeDateFuture.optional(),
  notes: SafeStringLong.optional(),
  totalPrice: z.number().positive('Preço deve ser positivo').optional(),
  discountPercentage: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK'])
    .optional(),
  paymentStatus: z
    .enum(['PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED'])
    .optional(),
}).refine(
  (data) => {
    // Se ambos startDate e endDate fornecidos, validar ordem
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate'],
  },
);

export type RentalCreate = z.infer<typeof RentalCreateSchema>;
export type RentalUpdate = z.infer<typeof RentalUpdateSchema>;

// ============================================================================
// EQUIPMENT SCHEMAS
// ============================================================================

export const EquipmentCreateSchema = z.object({
  name: SafeString,
  description: SafeStringLong.optional(),
  categoryId: z.string().uuid('ID de categoria inválido'),
  subcategoryId: z.string().uuid('ID de subcategoria inválido').optional(),
  sku: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .transform(sanitizeString),
  purchasePrice: z.number().positive('Preço deve ser positivo'),
  dailyRate: z.number().positive('Taxa diária deve ser positiva'),
  condition: z
    .enum(['NEW', 'GOOD', 'FAIR', 'POOR'])
    .optional()
    .default('GOOD'),
  location: SafeString.optional(),
  status: z
    .enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED'])
    .optional()
    .default('AVAILABLE'),
  maintenanceDate: SafeDate.optional(),
  imageUrl: SafeUrl.optional(),
});

export const EquipmentUpdateSchema = z.object({
  name: SafeString.optional(),
  description: SafeStringLong.optional(),
  categoryId: z.string().uuid('ID de categoria inválido').optional(),
  subcategoryId: z.string().uuid('ID de subcategoria inválido').optional(),
  sku: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .transform(sanitizeString)
    .optional(),
  purchasePrice: z.number().positive('Preço deve ser positivo').optional(),
  dailyRate: z.number().positive('Taxa diária deve ser positiva').optional(),
  condition: z
    .enum(['NEW', 'GOOD', 'FAIR', 'POOR'])
    .optional(),
  location: SafeString.optional(),
  status: z
    .enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED'])
    .optional(),
  maintenanceDate: SafeDate.optional(),
  imageUrl: SafeUrl.optional(),
});

export type EquipmentCreate = z.infer<typeof EquipmentCreateSchema>;
export type EquipmentUpdate = z.infer<typeof EquipmentUpdateSchema>;

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const ClientCreateSchema = z.object({
  firstName: SafeString,
  lastName: SafeString,
  email: SafeEmail,
  phone: SafePhone,
  company: SafeString.optional(),
  taxId: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .optional(),
  address: SafeString.optional(),
  city: SafeString.optional(),
  postalCode: z
    .string()
    .min(5, 'Mínimo 5 caracteres')
    .optional(),
  country: SafeString.optional(),
  notes: SafeStringLong.optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'BLOCKED'])
    .optional()
    .default('ACTIVE'),
});

export const ClientUpdateSchema = z.object({
  firstName: SafeString.optional(),
  lastName: SafeString.optional(),
  email: SafeEmail.optional(),
  phone: SafePhone.optional(),
  company: SafeString.optional(),
  taxId: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .optional(),
  address: SafeString.optional(),
  city: SafeString.optional(),
  postalCode: z
    .string()
    .min(5, 'Mínimo 5 caracteres')
    .optional(),
  country: SafeString.optional(),
  notes: SafeStringLong.optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'BLOCKED'])
    .optional(),
});

export type ClientCreate = z.infer<typeof ClientCreateSchema>;
export type ClientUpdate = z.infer<typeof ClientUpdateSchema>;

// ============================================================================
// CATEGORY & SUBCATEGORY SCHEMAS
// ============================================================================

export const CategoryCreateSchema = z.object({
  name: SafeString,
  description: SafeStringLong.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser formato hexadecimal (#RRGGBB)')
    .optional(),
});

export const CategoryUpdateSchema = z.object({
  name: SafeString.optional(),
  description: SafeStringLong.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser formato hexadecimal (#RRGGBB)')
    .optional(),
});

export const SubcategoryCreateSchema = z.object({
  name: SafeString,
  categoryId: z.string().uuid('ID de categoria inválido'),
  description: SafeStringLong.optional(),
});

export const SubcategoryUpdateSchema = z.object({
  name: SafeString.optional(),
  categoryId: z.string().uuid('ID de categoria inválido').optional(),
  description: SafeStringLong.optional(),
});

export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
export type SubcategoryCreate = z.infer<typeof SubcategoryCreateSchema>;
export type SubcategoryUpdate = z.infer<typeof SubcategoryUpdateSchema>;

// ============================================================================
// QUOTE SCHEMAS
// ============================================================================

export const QuoteCreateSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  equipmentIds: z
    .array(z.string().uuid('ID de equipamento inválido'))
    .min(1, 'Mínimo 1 equipamento'),
  startDate: SafeDateFuture,
  endDate: SafeDateFuture,
  notes: SafeStringLong.optional(),
  subtotal: z.number().positive('Subtotal deve ser positivo'),
  taxPercentage: z
    .number()
    .min(0, 'Taxa não pode ser negativa')
    .max(100, 'Taxa não pode ser maior que 100%')
    .optional()
    .default(0),
  discountPercentage: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .optional()
    .default(0),
  status: z
    .enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
    .optional()
    .default('DRAFT'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate'],
  },
);

export const QuoteUpdateSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido').optional(),
  equipmentIds: z
    .array(z.string().uuid('ID de equipamento inválido'))
    .min(1, 'Mínimo 1 equipamento')
    .optional(),
  startDate: SafeDateFuture.optional(),
  endDate: SafeDateFuture.optional(),
  notes: SafeStringLong.optional(),
  subtotal: z.number().positive('Subtotal deve ser positivo').optional(),
  taxPercentage: z
    .number()
    .min(0, 'Taxa não pode ser negativa')
    .max(100, 'Taxa não pode ser maior que 100%')
    .optional(),
  discountPercentage: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
    .optional(),
});

export type QuoteCreate = z.infer<typeof QuoteCreateSchema>;
export type QuoteUpdate = z.infer<typeof QuoteUpdateSchema>;

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const EventCreateSchema = z.object({
  title: SafeString,
  description: SafeStringLong.optional(),
  startDate: SafeDateFuture,
  endDate: SafeDateFuture,
  location: SafeString.optional(),
  clientId: z.string().uuid('ID de cliente inválido').optional(),
  equipmentIds: z
    .array(z.string().uuid('ID de equipamento inválido'))
    .optional(),
  notes: SafeStringLong.optional(),
  eventType: z
    .enum(['RENTAL', 'MAINTENANCE', 'INSPECTION', 'OTHER'])
    .optional()
    .default('OTHER'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .optional()
    .default('MEDIUM'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate'],
  },
);

export const EventUpdateSchema = z.object({
  title: SafeString.optional(),
  description: SafeStringLong.optional(),
  startDate: SafeDateFuture.optional(),
  endDate: SafeDateFuture.optional(),
  location: SafeString.optional(),
  clientId: z.string().uuid('ID de cliente inválido').optional(),
  equipmentIds: z
    .array(z.string().uuid('ID de equipamento inválido'))
    .optional(),
  notes: SafeStringLong.optional(),
  eventType: z
    .enum(['RENTAL', 'MAINTENANCE', 'INSPECTION', 'OTHER'])
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .optional(),
});

export type EventCreate = z.infer<typeof EventCreateSchema>;
export type EventUpdate = z.infer<typeof EventUpdateSchema>;

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserCreateSchema = z.object({
  email: SafeEmail,
  name: SafeString,
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  role: z
    .enum(['ADMIN', 'MANAGER', 'STAFF', 'CLIENT'])
    .optional()
    .default('STAFF'),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .optional()
    .default('ACTIVE'),
});

export const UserUpdateSchema = z.object({
  email: SafeEmail.optional(),
  name: SafeString.optional(),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial')
    .optional(),
  role: z
    .enum(['ADMIN', 'MANAGER', 'STAFF', 'CLIENT'])
    .optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .optional(),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.coerce
    .number()
    .min(1, 'Página deve ser >= 1')
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .min(1, 'Limite deve ser >= 1')
    .max(100, 'Limite máximo é 100')
    .optional()
    .default(10),
  sort: z
    .string()
    .optional(),
  order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Validar dados contra um schema e retornar resultado tipado
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result as any;
}

export { z };
export type { ZodError } from 'zod';
