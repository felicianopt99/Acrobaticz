// @ts-nocheck
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // Return a simple object that acts like an img element
    return Object.assign(Object.create(Object.prototype), {
      ...props,
      tagName: 'IMG'
    })
  },
}))

// Set environment variables for testing
process.env.NODE_ENV = 'test'
process.env.API_BASE_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://acrobaticz_user:change_me_strong_password_123@localhost:5432/acrobaticz'
process.env.JWT_SECRET = 'test-secret-key-1234567890abcdefghijklmnop'
process.env.MINIO_ENDPOINT = 'http://localhost:9000'
process.env.MINIO_ACCESS_KEY = 'minioadmin'
process.env.MINIO_SECRET_KEY = 'minioadmin'
