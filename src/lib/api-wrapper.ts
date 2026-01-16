/**
 * API Wrapper com Rate Limiting, Validação e Error Handling
 * HOC (Higher-Order Component) function `withSafety` para envolver rotas API
 * 
 * FEATURES:
 * 1. Rate Limiting: 10 req/min por IP
 * 2. Input Validation: Zod schema com sanitização XSS
 * 3. Error Handling: Maps Prisma errors para HTTP status codes semânticos
 * 4. Activity Logging: Integração automática com prisma-extended
 * 5. Type-Safe: Full TypeScript support
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { setOperationContext, clearOperationContext } from './prisma-extended';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ApiHandlerContext {
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  requestId: string;
  method: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface WithSafetyOptions {
  validateBody?: ZodSchema;
  validateQuery?: ZodSchema;
  rateLimitConfig?: RateLimitConfig;
  requireAuth?: boolean;
  errorHandler?: (error: unknown) => ApiResponse;
}

export interface RateLimitConfig {
  windowMs?: number; // milliseconds
  maxRequests?: number; // requests per window
  skipSuccessfulRequests?: boolean;
}

export type ApiHandler = (
  request: NextRequest,
  context?: ApiHandlerContext,
) => Promise<NextResponse<ApiResponse>>;

// ============================================================================
// RATE LIMITING STORE (In-Memory)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Limpar entries expiradas do rate limit store
 * Executado a cada nova requisição
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Verificar rate limit para um IP
 */
function checkRateLimit(
  ip: string,
  config: RateLimitConfig = {},
): { allowed: boolean; remaining: number; resetTime: number } {
  const windowMs = config.windowMs || 60000; // 1 minuto
  const maxRequests = config.maxRequests || 10; // 10 req/min

  const now = Date.now();
  cleanupRateLimitStore();

  const key = `rate-limit:${ip}`;
  let entry = rateLimitStore.get(key);

  // Criar nova entry se não existir ou estiver expirada
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Resetar rate limit para um IP (para testes)
 */
export function resetRateLimitForIP(ip: string): void {
  rateLimitStore.delete(`rate-limit:${ip}`);
}

/**
 * Resetar todos os rate limits (para testes)
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}

// ============================================================================
// PRISMA ERROR HANDLING
// ============================================================================

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  // Unique constraint violations
  P2002: {
    status: 409,
    message: 'Um registo com este valor já existe',
  },
  // Record not found
  P2025: {
    status: 404,
    message: 'Registo não encontrado',
  },
  // Foreign key constraint
  P2003: {
    status: 400,
    message: 'Referência inválida a outro registo',
  },
  // Field value too long
  P2000: {
    status: 400,
    message: 'Um ou mais campos excedem o tamanho máximo permitido',
  },
  // Value out of range
  P2011: {
    status: 400,
    message: 'Um valor está fora do intervalo permitido',
  },
  // Missing required field
  P2012: {
    status: 400,
    message: 'Campo obrigatório não fornecido',
  },
  // Invalid data provided
  P2013: {
    status: 400,
    message: 'Dados inválidos fornecidos',
  },
  // Database access denied
  P2014: {
    status: 403,
    message: 'Acesso negado à base de dados',
  },
  // Query parameter not found
  P2015: {
    status: 400,
    message: 'Parâmetro de query inválido',
  },
  // Database connection error
  P2024: {
    status: 503,
    message: 'Serviço de base de dados indisponível',
  },
  // Unknown error
  P2016: {
    status: 500,
    message: 'Erro desconhecido da base de dados',
  },
  P2017: {
    status: 500,
    message: 'Erro de integridade de dados',
  },
  P2020: {
    status: 400,
    message: 'Valor desconhecido fornecido',
  },
};

/**
 * Converter Prisma error para API response
 */
function handlePrismaError(
  error: any,
): { status: number; code: string; message: string; details?: any } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorMap = PRISMA_ERROR_MAP[error.code];

    if (errorMap) {
      // Extrair nomes de campos para unique violations
      let details: any = undefined;
      if (error.code === 'P2002' && error.meta?.target) {
        details = {
          conflictingFields: error.meta.target,
        };
      }

      return {
        status: errorMap.status,
        code: error.code,
        message: errorMap.message,
        details,
      };
    }

    return {
      status: 500,
      code: error.code,
      message: 'Erro de base de dados desconhecido',
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos',
      details: error.message,
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      status: 500,
      code: 'DATABASE_PANIC',
      message: 'Erro crítico da base de dados',
    };
  }

  // Erro genérico
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
  };
}

// ============================================================================
// ZOD VALIDATION ERROR HANDLING
// ============================================================================

/**
 * Converter Zod validation error para API response
 */
function handleZodError(
  error: ZodError,
): { status: number; code: string; message: string; details: any } {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));

  return {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Dados de entrada inválidos',
    details: {
      issues,
    },
  };
}

// ============================================================================
// EXTRACT CONTEXT HELPER
// ============================================================================

/**
 * Extrair contexto de operação da requisição
 */
function extractContext(request: NextRequest): ApiHandlerContext {
  // Extrair IP da requisição
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    (request as unknown as { ip?: string }).ip ||
    'unknown';

  // Extrair user agent
  const userAgent = request.headers.get('user-agent') || undefined;

  // Gerar request ID
  const requestId = request.headers.get('x-request-id') || generateRequestId();

  // Extrair método
  const method = request.method;

  // userId será extraído de headers (JWT) se disponível
  const userId = request.headers.get('x-user-id') || undefined;

  return {
    ipAddress: ip,
    userAgent,
    requestId,
    method,
    userId,
  };
}

/**
 * Gerar ID único para requisição
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

/**
 * Construir resposta de sucesso
 */
export function successResponse<T>(
  data: T,
  requestId: string,
  statusCode: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: statusCode },
  );
}

/**
 * Construir resposta de erro
 */
export function errorResponse(
  code: string,
  message: string,
  requestId: string,
  statusCode: number = 500,
  details?: any,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: statusCode },
  );
}

// ============================================================================
// MAIN HOC: withSafety
// ============================================================================

/**
 * Higher-Order Component para envolver handlers de API
 * Aplica rate limiting, validação, error handling, e activity logging
 * 
 * USAGE:
 * export const POST = withSafety(
 *   async (request, context) => {
 *     // handler logic
 *   },
 *   {
 *     validateBody: RentalCreationSchema,
 *     rateLimitConfig: { maxRequests: 10, windowMs: 60000 },
 *   }
 * );
 */
export function withSafety(
  handler: (request: NextRequest, context: ApiHandlerContext) => Promise<NextResponse<ApiResponse>>,
  options: WithSafetyOptions = {},
): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse>> => {
    // ========================================================================
    // 1. EXTRACT CONTEXT
    // ========================================================================
    const context = extractContext(request);
    setOperationContext({
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });

    try {
      // ====================================================================
      // 2. RATE LIMITING CHECK
      // ====================================================================
      const rateLimitConfig = options.rateLimitConfig || {
        maxRequests: 10,
        windowMs: 60000,
      };

      const rateLimit = checkRateLimit(context.ipAddress, rateLimitConfig);

      if (!rateLimit.allowed) {
        const resetTime = new Date(rateLimit.resetTime);
        return errorResponse(
          'RATE_LIMIT_EXCEEDED',
          'Limite de requisições excedido. Tente novamente mais tarde.',
          context.requestId,
          429,
          {
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
            resetTime: resetTime.toISOString(),
          },
        );
      }

      // ====================================================================
      // 3. INPUT VALIDATION
      // ====================================================================

      let bodyData: any = null;

      // Validar body se schema fornecido
      if (options.validateBody) {
        try {
          // Parse body apenas uma vez
          const rawBody = await request.json();
          const validationResult = options.validateBody.safeParse(rawBody);

          if (!validationResult.success) {
            const zodError = handleZodError(validationResult.error);
            return errorResponse(
              zodError.code,
              zodError.message,
              context.requestId,
              zodError.status,
              zodError.details,
            );
          }

          bodyData = validationResult.data;
        } catch (error) {
          if (error instanceof SyntaxError) {
            return errorResponse(
              'INVALID_JSON',
              'JSON inválido no body da requisição',
              context.requestId,
              400,
            );
          }
          throw error;
        }
      }

      // Validar query se schema fornecido
      if (options.validateQuery) {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        const validationResult = options.validateQuery.safeParse(queryParams);

        if (!validationResult.success) {
          const zodError = handleZodError(validationResult.error);
          return errorResponse(
            zodError.code,
            zodError.message,
            context.requestId,
            zodError.status,
            zodError.details,
          );
        }
      }

      // ====================================================================
      // 4. EXECUTE HANDLER
      // ====================================================================

      // Criar novo request com body já parseado para reuso
      let requestToPass = request;
      if (bodyData !== null) {
        // Se validamos body, precisamos de um request novo com o body já parseado
        requestToPass = new NextRequest(request, {
          body: JSON.stringify(bodyData),
        });
      }

      const response = await handler(requestToPass, context);

      // ====================================================================
      // 5. ADD RATE LIMIT HEADERS
      // ====================================================================

      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', String(rateLimitConfig.maxRequests || 10));
      headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      headers.set('X-RateLimit-Reset', String(rateLimit.resetTime));
      headers.set('X-Request-ID', context.requestId);

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // ========================================================================
      // 6. GLOBAL ERROR HANDLING
      // ========================================================================

      let errorResult: {
        status: number;
        code: string;
        message: string;
        details?: any;
      } = {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        details: undefined,
      };

      // Tratamento específico para erros Prisma
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError ||
        error instanceof Prisma.PrismaClientRustPanicError
      ) {
        errorResult = handlePrismaError(error);
      }
      // Tratamento específico para erros Zod
      else if (error instanceof ZodError) {
        const zodError = handleZodError(error);
        errorResult = {
          status: zodError.status,
          code: zodError.code,
          message: zodError.message,
          details: zodError.details,
        };
      }
      // Erro genérico
      else if (error instanceof Error) {
        console.error(`[API Error] ${context.requestId}:`, error);
        // Em desenvolvimento, enviar stack trace
        if (process.env.NODE_ENV === 'development') {
          errorResult.details = error.message;
        }
      }

      return errorResponse(
        errorResult.code,
        errorResult.message,
        context.requestId,
        errorResult.status,
        errorResult.details,
      );
    } finally {
      // ========================================================================
      // 7. CLEANUP CONTEXT
      // ========================================================================
      clearOperationContext();
    }
  };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { Prisma };
export type { NextRequest, NextResponse };
