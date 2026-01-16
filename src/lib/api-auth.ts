import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/types'

export interface AuthUser {
  userId: string
  username: string
  role: UserRole
}

/**
 * Gets JWT_SECRET from environment variables
 * Falls back to a dev-only secret if not configured (for local development)
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[API Auth] JWT_SECRET not set in environment, using dev fallback');
    return 'dev-secret-key-for-local-development-only';
  }
  return secret;
}

/**
 * Extracts user information from JWT token in request cookies
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const jwtSecret = getJwtSecret();

    const decoded = jwt.verify(token, jwtSecret) as any
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role as UserRole,
    }
  } catch (error) {
    // Don't log expected errors (invalid/expired tokens)
    if (error instanceof jwt.JsonWebTokenError) {
      return null;
    }
    console.error('[API Auth] Unexpected error:', error);
    return null
  }
}

/**
 * Requires authentication for an API route
 * Throws 401 if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Requires a specific permission for an API route
 * Throws 403 if insufficient permissions
 */
export async function requirePermission(
  request: NextRequest,
  permission: keyof import('@/types').RolePermissions
): Promise<AuthUser> {
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!hasPermission(user.role, permission)) {
    throw new Error('Forbidden')
  }

  return user
}

/**
 * Checks if the request has read access (any authenticated user can read)
 * For write operations, use requirePermission instead
 */
export async function requireReadAccess(request: NextRequest): Promise<AuthUser> {
  return await requireAuth(request)
}

