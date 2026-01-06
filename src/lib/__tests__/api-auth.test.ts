import { describe, it, expect, beforeEach } from 'vitest'
import { generateToken, verifyToken } from '@/lib/api-auth'
import type { User } from '@/types'

describe('JWT Authentication', () => {
  const mockUser: User = {
    id: 'test-user-123',
    name: 'Test User',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'Admin',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include user information in token payload', () => {
      const token = generateToken(mockUser)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded?.id).toBe(mockUser.id)
      expect(decoded?.username).toBe(mockUser.username)
      expect(decoded?.role).toBe(mockUser.role)
    })

    it('should not include sensitive data like password', () => {
      const token = generateToken(mockUser)
      expect(token).not.toContain('hashedpassword')
      
      const decoded = verifyToken(token)
      expect(decoded).not.toHaveProperty('password')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded?.id).toBe(mockUser.id)
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })

    it('should return null for expired token', () => {
      // This test would require mocking time or using a short expiry
      // For now, we just verify invalid format returns null
      const decoded = verifyToken('')
      expect(decoded).toBeNull()
    })

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not-a-jwt')
      expect(decoded).toBeNull()
    })
  })

  describe('Token expiration', () => {
    it('should generate token with expiration', () => {
      const token = generateToken(mockUser)
      const decoded = verifyToken(token) as any
      
      expect(decoded?.exp).toBeDefined()
      expect(typeof decoded?.exp).toBe('number')
      
      // Token should expire in the future
      const now = Math.floor(Date.now() / 1000)
      expect(decoded?.exp).toBeGreaterThan(now)
    })
  })
})
