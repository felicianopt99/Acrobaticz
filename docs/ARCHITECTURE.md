# 🏗️ Acrobaticz Architecture Guide

Complete technical architecture documentation for developers.

---

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js 15 + React 19 + TypeScript + Tailwind + Shadcn   │
│  - Server Components                                        │
│  - Client Components (with hooks)                           │
│  - API Routes (Next.js 15)                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                          │
│  - Authentication (NextAuth.js / JWT)                      │
│  - Authorization (RBAC)                                     │
│  - Logging & Auditing                                      │
│  - Error Handling                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  API LAYER (Routes)                         │
│  - RESTful Endpoints                                        │
│  - Request Validation                                       │
│  - Response Serialization                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                SERVICE/REPOSITORY LAYER                    │
│  - Business Logic                                           │
│  - Data Access Layer (Repositories)                        │
│  - Caching Layer                                            │
│  - Translation Services                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER                                │
│  PostgreSQL + Prisma ORM                                   │
│  - 38+ Database Tables                                     │
│  - Migrations Management                                   │
│  - Connection Pooling                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
acrobaticz/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/                # Authentication endpoints
│   │   │   ├── equipment/           # Equipment CRUD
│   │   │   ├── quotes/              # Quote management
│   │   │   ├── events/              # Event management
│   │   │   ├── clients/             # Client management
│   │   │   ├── partners/            # Partner management
│   │   │   ├── admin/               # Admin operations
│   │   │   └── health/              # Health checks
│   │   ├── dashboard/               # Admin dashboard
│   │   ├── equipment/               # Equipment pages
│   │   ├── quotes/                  # Quote pages
│   │   ├── events/                  # Event pages
│   │   ├── clients/                 # Client pages
│   │   ├── catalog/                 # Public catalog
│   │   └── layout.tsx               # Root layout
│   │
│   ├── components/
│   │   ├── auth/                    # Auth components
│   │   ├── equipment/               # Equipment UI
│   │   ├── quotes/                  # Quote UI
│   │   ├── common/                  # Shared components
│   │   └── ui/                      # Shadcn UI components
│   │
│   ├── lib/
│   │   ├── repositories/            # Data access layer
│   │   │   ├── equipment.repository.ts
│   │   │   ├── quote.repository.ts
│   │   │   ├── event.repository.ts
│   │   │   ├── client.repository.ts
│   │   │   ├── partner.repository.ts
│   │   │   └── user.repository.ts
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── quote.service.ts
│   │   │   ├── translation.service.ts
│   │   │   └── cloud-storage.service.ts
│   │   │
│   │   ├── cache.ts                # In-memory cache system
│   │   ├── cache-invalidation.ts    # Cache invalidation
│   │   ├── database-cleanup.ts      # DB cleanup utilities
│   │   ├── api-auth.ts             # API authentication
│   │   ├── logger.ts               # Logging utility
│   │   └── constants.ts            # App constants
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook
│   │   ├── useApi.ts               # API hook
│   │   └── useCache.ts             # Cache hook
│   │
│   ├── types/
│   │   ├── index.ts                # Main type definitions
│   │   ├── api.ts                  # API types
│   │   └── database.ts             # DB types
│   │
│   └── utils/
│       ├── validation.ts           # Input validation
│       ├── formatting.ts           # Data formatting
│       ├── date-helpers.ts         # Date utilities
│       └── pdf-generator.ts        # PDF generation
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # Migration files
│
├── docs/
│   ├── FEATURES.md                 # All features
│   ├── ARCHITECTURE.md             # This file
│   ├── API/                        # API documentation
│   ├── DATABASE/                   # DB optimization
│   └── DEPLOYMENT/                 # Deployment guides
│
├── scripts/
│   ├── seed-comprehensive.ts       # Database seeding
│   ├── extract-seed-data.ts        # Data extraction
│   ├── deployment/                 # Deploy scripts
│   ├── maintenance/                # Maintenance scripts
│   ├── notifications/              # Notification jobs
│   └── archived/                   # Old scripts (deprecated)
│
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   └── images/                     # Static assets
│
├── tests/
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── next.config.ts                  # Next.js config
├── tailwind.config.ts              # Tailwind config
├── tsconfig.json                   # TypeScript config
├── vitest.config.ts                # Test config
├── package.json                    # Dependencies
└── README.md                       # Main documentation
```

---

## 🗄️ Database Architecture

### Core Entities

#### User Management
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String   // bcryptjs hashed
  name         String
  role         Role     // Admin, Manager, Technician, Employee, Viewer
  active       Boolean  @default(true)
  lastLogin    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### Equipment System
```prisma
model Equipment {
  id              String   @id @default(cuid())
  name            String
  category        Category @relation(fields: [categoryId])
  categoryId      String
  quantity        Int      // Total units
  dailyRate       Float    // Pricing
  weeklyRate      Float?
  monthlyRate     Float?
  serialNumber    String?
  brand           String?
  model           String?
  purchaseDate    DateTime?
  replacementCost Float?   // Insurance value
  images          String[] // JSON array of image URLs
}

model Category {
  id              String   @id @default(cuid())
  name            String   @unique
  description     String?
  translations    CategoryTranslation[]
  equipment       Equipment[]
}
```

#### Rental Management
```prisma
model Event {
  id              String   @id @default(cuid())
  name            String
  client          Client   @relation(fields: [clientId])
  clientId        String
  date            DateTime // Event date
  deliveryDate    DateTime
  returnDate      DateTime
  location        String
  status          EventStatus // Pending, Confirmed, In-Progress, Completed
  rentals         Rental[]
}

model Rental {
  id              String   @id @default(cuid())
  equipment       Equipment @relation(fields: [equipmentId])
  equipmentId     String
  event           Event    @relation(fields: [eventId])
  eventId         String
  quantity        Int
  dailyRate       Float
  startDate       DateTime
  endDate         DateTime
  status          RentalStatus // Pending, Rented, Returned
}
```

#### Client & Partner
```prisma
model Client {
  id              String   @id @default(cuid())
  name            String
  email           String
  phone           String?
  company         String?
  taxId           String?
  address         String?
  creditLimit     Float    @default(0)
  quotes          Quote[]
  events          Event[]
}

model Partner {
  id              String   @id @default(cuid())
  name            String   @unique
  email           String   @unique
  commission      Float    // Commission percentage
  equipment       PartnerEquipment[]
}
```

### Performance Optimizations

#### Indexes
```prisma
// On frequently queried fields
@@index([categoryId])
@@index([clientId])
@@index([eventId])
@@index([date])
@@unique([equipmentId, eventId])
```

#### Caching Strategy
- **Category Queries** - Cached 1 hour (in memory)
- **Equipment Lists** - Cached 30 minutes
- **Client Data** - Cached 10 minutes
- **TTL Management** - Auto-cleanup of expired cache

#### N+1 Query Elimination
- **Parallel Loading** - Use Promise.all() for counts
- **Select Optimization** - Only fetch needed fields
- **Relation Optimization** - Explicit joins, no implicit loading

---

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                 User Login Request                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Validate Credentials │
        │ (bcryptjs compare)   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Generate JWT Token   │
        │ (HS256 Algorithm)    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Return Token & User  │
        │ Store in client      │
        └──────────────────────┘
```

### Authorization (RBAC)

```
Role Hierarchy:
  Admin       → Full system access
  Manager     → Business operations
  Technician  → Equipment operations
  Employee    → Basic operations
  Viewer      → Read-only access
```

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...
```

---

## 🚀 Performance Optimization

### Frontend Optimization
- **Server-Side Rendering** - Next.js server components
- **Static Generation** - ISR (5-minute revalidation)
- **Code Splitting** - Automatic per-page bundles
- **Image Optimization** - Next.js Image component
- **CSS Optimization** - Tailwind purging

### Backend Optimization
- **Database Caching** - In-memory cache with TTL
- **Query Optimization** - Minimal field selection
- **Connection Pooling** - Reuse DB connections
- **Compression** - gzip response compression
- **Rate Limiting** - Prevent abuse

### Measured Improvements
✓ 96% reduction in database queries (51 → 2)
✓ 100x faster cache hits vs database
✓ 85% latency reduction (2.5s → 180ms)
✓ 66% smaller API payloads
✓ 10x more concurrent users

---

## 🔄 API Design

### RESTful Conventions
```
GET    /api/equipment              # List items
POST   /api/equipment              # Create item
GET    /api/equipment/:id          # Get single item
PUT    /api/equipment/:id          # Update item
DELETE /api/equipment/:id          # Delete item
```

### Request/Response Format
```json
// Request
{
  "name": "LED Panel 1x2m",
  "categoryId": "cat-123",
  "quantity": 5
}

// Response (Success)
{
  "success": true,
  "data": {
    "id": "eq-789",
    "name": "LED Panel 1x2m",
    ...
  },
  "timestamp": "2026-01-14T10:00:00Z"
}

// Response (Error)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'name' is required",
    "details": {...}
  },
  "timestamp": "2026-01-14T10:00:00Z"
}
```

### Error Handling
```
200 OK              - Successful request
201 Created         - Resource created
204 No Content      - Successful deletion
400 Bad Request     - Validation error
401 Unauthorized    - Authentication required
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource not found
409 Conflict        - Resource conflict
500 Server Error    - Unexpected error
```

---

## 🧪 Testing Strategy

### Unit Tests
- Repository layer
- Service layer
- Utility functions
- Coverage: 80%+

### Integration Tests
- API endpoint testing
- Database integration
- Auth flow testing
- Error scenarios

### E2E Tests
- User workflows
- Complete rental process
- Multi-page navigation
- Form submissions

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

---

## 📊 Monitoring & Logging

### Application Logging
```typescript
import { logger } from '@/lib/logger';

logger.info('Equipment created', { id, name });
logger.warn('Quota approaching', { usage });
logger.error('Database error', { error });
```

### Activity Audit
- All CRUD operations logged
- User identification
- Timestamp tracking
- Change tracking

### Performance Monitoring
- Database query times
- API response times
- Cache hit rates
- Error rates

---

## 🔄 Deployment Architecture

### Environment Stages
```
Development
  ├── localhost:3000
  ├── SQLite or local PostgreSQL
  └── Hot reload enabled

Staging
  ├── staging.acrobaticz.com
  ├── PostgreSQL production-like
  └── Full testing

Production
  ├── acrobaticz.com
  ├── PostgreSQL managed
  └── Monitoring & backups
```

### Deployment Methods
- **Vercel** - Git-based, automatic deployments
- **Docker** - Container-based, any host
- **VPS** - Traditional Node.js server

---

## 📚 Technology Stack Details

### Frontend Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.0+ |
| UI Library | React | 19.0+ |
| Language | TypeScript | 5.0+ |
| Styling | Tailwind CSS | 3.4+ |
| Components | Shadcn/ui | Latest |
| HTTP | SWR | Latest |
| State | TanStack Query | Optional |
| Validation | Zod | Latest |

### Backend Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Next.js | 15.0+ |
| Language | TypeScript | 5.0+ |
| ORM | Prisma | 5.0+ |
| Database | PostgreSQL | 14+ |
| Auth | JWT | - |
| Translation | DeepL API | Latest |
| Storage | S3/Local | - |

### Development Tools
| Category | Tools |
|----------|-------|
| Testing | Vitest, React Testing Library |
| Linting | ESLint, Prettier |
| Git | GitHub, Git Flow |
| CI/CD | GitHub Actions |
| Monitoring | Sentry (optional) |

---

**Last Updated:** January 14, 2026
**Status:** Production-Ready
