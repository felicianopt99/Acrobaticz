import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { hasPermission } from '@/lib/permissions'
import { configService } from '@/lib/config-service'
import type { UserRole } from '@/types'

export interface AuthUser {
  userId: string
  username: string
  role: UserRole
}

/**
 * Extracts user information from JWT token in request cookies
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const jwtSecret = await configService.get('Auth', 'JWT_SECRET')
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return null
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role as UserRole,
    }
  } catch {
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

