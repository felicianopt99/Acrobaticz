# 🏗️ System Architecture - Acrobaticz Elite

Complete technical documentation of system design, data flow, and technology choices.

---

## 📊 System Overview

```
┌────────────────────────────────────────────┐
│    Next.js 15 + React 19 (Frontend)       │
│    Tailwind CSS + Shadcn/ui               │
└────────────────────────────────────────────┘
                     ↓
        ┌──────────────────────────┐
        │  REST API + WebSocket    │
        │  (Next.js API Routes)    │
        └──────────────────────────┘
                ↓    ↓    ↓
         ┌──────────┬──────────┬───────────┐
         │PostgreSQL│MinIO S3  │DeepL API  │
         │Database  │Storage   │Translate  │
         └──────────┴──────────┴───────────┘
```

---

## 🔄 Data Flow: Quote Generation

```
1. User selects equipment → API request
2. Query PostgreSQL (Prisma) → Get equipment
3. Calculate pricing → Add items
4. Check language (English?)
   ├─ YES: Skip translation
   └─ NO: Check DB cache
        ├─ HIT: Use cached
        └─ MISS: Call DeepL API
5. Generate PDF → Upload to MinIO
6. Return download link
```

---

## 🌐 Translation System (DB-First)

```
Equipment Table (Base):
├─ name: "Projector 4K"
└─ language: English

Translations Cache:
├─ (eq-123, pt) → "Projetor 4K"
├─ (eq-123, es) → "Proyector 4K"
└─ (eq-123, fr) → "Projecteur 4K"

Request:
1. User wants Portuguese
2. Check: SELECT * WHERE resourceId=eq-123 AND language='pt'
3. Cache HIT → Instant return
4. Cache MISS → DeepL API call → Store in DB
```

---

## 🔐 Authentication

```
1. User logs in (email + password)
2. Server validates credentials (bcrypt)
3. Generate JWT token (7-day expiration)
4. Client stores token
5. Include in every request: Authorization: Bearer <token>
6. Server verifies JWT signature
7. Check user role permissions
```

---

## 💾 Database Schema

**Users**
- id, email, password_hash, role, created_at

**Equipment**
- id, name, description, category_id, stock, daily_rate, created_at

**Translations**
- id, resource_id, language, field, value, provider, cached_at

**Quotes**
- id, client_id, items, total, status, language, pdf_url, created_at

**Reservations**
- id, equipment_id, client_id, start_date, end_date, status, created_at

---

## 🚀 Deployment Architecture

```
Load Balancer
    ├─ App Instance 1
    ├─ App Instance 2
    └─ App Instance 3
         ↓
Shared PostgreSQL
Distributed MinIO
Optional Redis Cache
```

---

## ⚡ Performance Features

- Query optimization with Prisma (select/include)
- Translation caching (90-day TTL)
- Database indexing on frequently queried fields
- Lazy loading with Next.js dynamic imports
- Client-side caching with TanStack Query
- WebSocket for real-time updates (no polling)

---

## 🔒 Security

- ✅ JWT authentication (7 days)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ HTTPS/TLS enforcement (production)
- ✅ CORS protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)
- ✅ Rate limiting
- ✅ Role-based access control

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
