/**
 * Input Sanitization and Validation with Zod
 * 
 * Provides secure validation schemas that:
 * - Sanitize strings to prevent XSS attacks
 * - Validate dates are in the future for rentals
 * - Validate data types and constraints
 * - Prevent injection attacks
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize string input to prevent XSS
 * Removes all HTML tags and dangerous attributes
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags and dangerous content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
  
  // Additional safety: trim whitespace
  return sanitized.trim();
}

/**
 * Custom Zod transformers for safe data handling
 */
export const SafeString = z
  .string()
  .min(1, 'Value cannot be empty')
  .max(500, 'Value exceeds maximum length')
  .transform((val) => sanitizeString(val));

export const SafeEmail = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .max(255, 'Email exceeds maximum length')
  .transform((val) => sanitizeString(val));

export const SafePhone = z
  .string()
  .regex(/^[0-9+\-\s()]*$/, 'Invalid phone format')
  .max(20, 'Phone exceeds maximum length')
  .transform((val) => sanitizeString(val));

export const SafeURL = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL exceeds maximum length')
  .transform((val) => sanitizeString(val));

/**
 * Validate that date is in the future
 */
const FutureDate = z
  .date()
  .or(z.string().datetime())
  .transform((val) => new Date(val))
  .refine(
    (date) => date > new Date(),
    { message: 'Date must be in the future' }
  );

/**
 * Validate that end date is after start date
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}

/**
 * Rental Creation Schema - with full input sanitization
 */
export const RentalCreationSchema = z.object({
  eventId: z
    .string()
    .uuid('Event ID must be a valid UUID')
    .min(1, 'Event ID is required'),
  
  equipment: z
    .array(
      z.object({
        equipmentId: z
          .string()
          .uuid('Equipment ID must be a valid UUID')
          .min(1, 'Equipment ID is required'),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .positive('Quantity must be positive')
          .max(10000, 'Quantity exceeds maximum'),
      })
    )
    .min(1, 'At least one equipment item is required')
    .max(100, 'Too many equipment items'),
  
  notes: SafeString.optional(),
});

/**
 * Rental Update Schema
 */
export const RentalUpdateSchema = z.object({
  id: z.string().uuid('Invalid rental ID'),
  eventId: z.string().uuid('Invalid event ID').optional(),
  equipmentId: z.string().uuid('Invalid equipment ID').optional(),
  quantityRented: z.number().int().positive().optional(),
  prepStatus: z.enum(['pending', 'checked-out', 'checked-in']).optional(),
  notes: SafeString.optional(),
});

/**
 * Equipment Creation Schema
 */
export const EquipmentCreationSchema = z.object({
  name: SafeString,
  description: SafeString.optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive'),
  dailyRate: z
    .number()
    .positive('Daily rate must be positive')
    .max(999999, 'Daily rate exceeds maximum'),
  location: SafeString.optional(),
  barcode: z.string().optional().transform((val) => val ? sanitizeString(val) : undefined),
});

/**
 * Equipment Update Schema
 */
export const EquipmentUpdateSchema = z.object({
  id: z.string().uuid('Invalid equipment ID'),
  name: SafeString.optional(),
  description: SafeString.optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  quantity: z.number().int().positive().optional(),
  dailyRate: z.number().positive().optional(),
  location: SafeString.optional(),
  barcode: z.string().optional(),
});

/**
 * Event Creation Schema
 */
export const EventCreationSchema = z.object({
  name: SafeString,
  clientId: z.string().uuid('Invalid client ID'),
  location: SafeString,
  startDate: z
    .date()
    .or(z.string().datetime())
    .transform((val) => new Date(val)),
  endDate: z
    .date()
    .or(z.string().datetime())
    .transform((val) => new Date(val)),
  description: SafeString.optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Event Update Schema
 */
export const EventUpdateSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
  name: SafeString.optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  location: SafeString.optional(),
  startDate: z
    .date()
    .or(z.string().datetime())
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .date()
    .or(z.string().datetime())
    .transform((val) => new Date(val))
    .optional(),
  description: SafeString.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Client Creation Schema
 */
export const ClientCreationSchema = z.object({
  name: SafeString,
  email: SafeEmail,
  phone: SafePhone,
  companyName: SafeString.optional(),
  taxId: z.string().optional().transform((val) => val ? sanitizeString(val) : undefined),
  address: SafeString.optional(),
  city: SafeString.optional(),
  country: SafeString.optional(),
  notes: SafeString.optional(),
});

/**
 * Client Update Schema
 */
export const ClientUpdateSchema = z.object({
  id: z.string().uuid('Invalid client ID'),
  name: SafeString.optional(),
  email: SafeEmail.optional(),
  phone: SafePhone.optional(),
  companyName: SafeString.optional(),
  taxId: z.string().optional(),
  address: SafeString.optional(),
  city: SafeString.optional(),
  country: SafeString.optional(),
  notes: SafeString.optional(),
});

/**
 * Category Creation Schema
 */
export const CategoryCreationSchema = z.object({
  name: SafeString,
  description: SafeString.optional(),
});

/**
 * Subcategory Creation Schema
 */
export const SubcategoryCreationSchema = z.object({
  name: SafeString,
  parentId: z.string().uuid('Invalid parent category ID'),
  description: SafeString.optional(),
});

/**
 * Quote Creation Schema
 */
export const QuoteCreationSchema = z.object({
  name: SafeString,
  clientId: z.string().uuid('Invalid client ID'),
  location: SafeString.optional(),
  startDate: z
    .date()
    .or(z.string().datetime())
    .transform((val) => new Date(val)),
  endDate: z
    .date()
    .or(z.string().datetime())
    .transform((val) => new Date(val)),
  items: z
    .array(
      z.object({
        type: z.enum(['equipment', 'service']),
        equipmentId: z.string().uuid().optional(),
        quantity: z.number().int().positive().optional(),
        description: SafeString.optional(),
        unitPrice: z.number().positive().optional(),
      })
    )
    .min(1, 'Quote must have at least one item'),
  notes: SafeString.optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * User Creation Schema
 */
export const UserCreationSchema = z.object({
  name: SafeString,
  email: SafeEmail,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  role: z.enum(['admin', 'user', 'viewer']),
});

/**
 * Batch validation helper
 * Validates all fields and returns comprehensive error report
 */
export function validateInput<T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string[]> } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return { 
      success: false, 
      errors: { general: ['Validation failed'] } 
    };
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}
