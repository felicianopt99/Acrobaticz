/**
 * Centralised Error Handler
 * 
 * Converts Prisma errors and other backend errors into user-friendly messages
 * Prevents exposure of technical stack traces to the client
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { NextResponse } from 'next/server';
import { NextResponse as NextResponseLib } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * Prisma Error Code Map
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const PRISMA_ERROR_MAP: Record<string, { message: string; statusCode: number }> = {
  P2000: {
    message: 'The value provided for a column exceeds the character limit',
    statusCode: 400,
  },
  P2001: {
    message: 'The record searched for in the where condition does not exist',
    statusCode: 404,
  },
  P2002: {
    message: 'A unique constraint violation occurred. This value already exists in the system.',
    statusCode: 409,
  },
  P2003: {
    message: 'A foreign key constraint failed. The referenced record does not exist.',
    statusCode: 400,
  },
  P2004: {
    message: 'A constraint violation occurred on the database',
    statusCode: 400,
  },
  P2005: {
    message: 'The value provided is invalid for the column type',
    statusCode: 400,
  },
  P2006: {
    message: 'The provided value for the relation is invalid',
    statusCode: 400,
  },
  P2007: {
    message: 'The data provided is invalid for the model',
    statusCode: 400,
  },
  P2008: {
    message: 'Failed to parse the query',
    statusCode: 400,
  },
  P2009: {
    message: 'Failed to validate the query',
    statusCode: 400,
  },
  P2010: {
    message: 'Raw query failed',
    statusCode: 400,
  },
  P2011: {
    message: 'Null constraint violation',
    statusCode: 400,
  },
  P2012: {
    message: 'A missing required value was provided',
    statusCode: 400,
  },
  P2013: {
    message: 'Missing required argument',
    statusCode: 400,
  },
  P2014: {
    message: 'The required relation cannot be disconnected',
    statusCode: 400,
  },
  P2015: {
    message: 'An invalid relation argument was provided',
    statusCode: 400,
  },
  P2016: {
    message: 'Query interpretation error',
    statusCode: 400,
  },
  P2017: {
    message: 'The records for the relation do not exist',
    statusCode: 404,
  },
  P2018: {
    message: 'The required connected records were not found',
    statusCode: 400,
  },
  P2019: {
    message: 'Input error',
    statusCode: 400,
  },
  P2020: {
    message: 'Value out of range',
    statusCode: 400,
  },
  P2021: {
    message: 'The table does not exist in the current database',
    statusCode: 500,
  },
  P2022: {
    message: 'The column does not exist in the current database',
    statusCode: 500,
  },
  P2023: {
    message: 'Inconsistent column data',
    statusCode: 500,
  },
  P2024: {
    message: 'Timed out fetching a new connection from the connection pool',
    statusCode: 503,
  },
  P2025: {
    message: 'An operation failed because it depends on one or more records that were required but not found',
    statusCode: 404,
  },
  P2026: {
    message: 'The current database does not support the feature you requested',
    statusCode: 400,
  },
  P2027: {
    message: 'Multiple errors occurred in the query',
    statusCode: 400,
  },
  P2028: {
    message: 'Transaction API error',
    statusCode: 500,
  },
  P2029: {
    message: 'Error in external database connector',
    statusCode: 500,
  },
  P2030: {
    message: 'Full text search index not found',
    statusCode: 400,
  },
  P2031: {
    message: 'Prisma Client is unable to reach the database server',
    statusCode: 503,
  },
  P2032: {
    message: 'Prisma Client request timed out',
    statusCode: 504,
  },
  P2033: {
    message: 'Number filtering not supported for the given filter',
    statusCode: 400,
  },
  P2034: {
    message: 'Transaction conflicts with another transaction',
    statusCode: 409,
  },
  P2035: {
    message: 'Assertion violation',
    statusCode: 400,
  },
};

/**
 * Parse Prisma error and return user-friendly message
 */
function parsePrismaError(error: PrismaClientKnownRequestError): ApiError {
  const errorInfo = PRISMA_ERROR_MAP[error.code] || {
    message: 'A database error occurred. Please try again later.',
    statusCode: 500,
  };

  let details: any = undefined;

  // Extract more specific info for certain errors
  if (error.code === 'P2002') {
    const target = error.meta?.target as string[] | undefined;
    if (target) {
      details = {
        field: target[0],
        message: `${target[0]} already exists in the system`,
      };
    }
  }

  if (error.code === 'P2025') {
    details = {
      message: 'The record you are trying to access does not exist',
    };
  }

  return {
    code: error.code,
    message: errorInfo.message,
    details,
    statusCode: errorInfo.statusCode,
  };
}

/**
 * Handle generic errors and convert to API response
 */
function parseGenericError(error: any): ApiError {
  // Validation errors
  if (error.name === 'ZodError') {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data provided',
      details: error.errors,
      statusCode: 400,
    };
  }

  // Authentication errors
  if (error.message?.includes('unauthorized') || error.message?.includes('Unauthorized')) {
    return {
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to perform this action',
      statusCode: 401,
    };
  }

  // Not found errors
  if (error.message?.includes('not found') || error.message?.includes('Not found')) {
    return {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      statusCode: 404,
    };
  }

  // Conflict errors
  if (error.message?.includes('conflict') || error.message?.includes('Conflict')) {
    return {
      code: 'CONFLICT',
      message: 'This operation conflicts with existing data',
      statusCode: 409,
    };
  }

  // Default error
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
  };
}

/**
 * Main error handler function
 * @param error - The error object to handle
 * @returns NextResponse with appropriate status code and message
 */
export function handleApiError(error: any): NextResponse {
  let apiError: ApiError;

  // Log the full error for debugging (only in development or server logs)
  console.error('[API Error Handler]', {
    name: error.name,
    message: error.message,
    code: error.code,
    meta: error.meta,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Parse specific error types
  if (error instanceof PrismaClientKnownRequestError) {
    apiError = parsePrismaError(error);
  } else {
    apiError = parseGenericError(error);
  }

  return NextResponseLib.json(
    {
      error: apiError.message,
      code: apiError.code,
      ...(apiError.details && { details: apiError.details }),
    },
    { status: apiError.statusCode }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, statusCode: number = 200): NextResponse {
  return NextResponseLib.json(data, { status: statusCode });
}

/**
 * Error response helper for manual errors
 */
export function errorResponse(
  message: string,
  statusCode: number = 400,
  details?: any
): NextResponse {
  return NextResponseLib.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): string[] {
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!data[field]) {
      missingFields.push(field);
    }
  }
  return missingFields;
}
