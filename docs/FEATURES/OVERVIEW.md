# 🎯 Core Features Guide - Acrobaticz Elite

Complete guide to all major features and how to use them.

---

## 🏢 Equipment Management

### Overview

Comprehensive inventory system for managing rental equipment with categories, stock tracking, and pricing.

### Key Features

- **Equipment CRUD** - Create, read, update, delete equipment items
- **Categories & Subcategories** - Organize equipment hierarchically
- **Stock Tracking** - Real-time inventory counts
- **Pricing** - Daily rates and rental pricing
- **Images & Documents** - Upload and manage equipment media
- **Search & Filtering** - Full-text search and advanced filters

### How to Use

```
Dashboard → Equipment → Manage Equipment

1. Create Equipment
   - Click "Add Equipment"
   - Fill: Name, Description, Category
   - Set daily rate (e.g., $50)
   - Upload image (from MinIO S3)
   - Save

2. View Equipment List
   - Search by name (real-time filter)
   - Filter by category or stock level
   - Sort by name, price, or date

3. Update Equipment
   - Click equipment item
   - Edit fields
   - Update image if needed
   - Save changes

4. Stock Adjustment
   - View current stock
   - Add units when received
   - Reduce when rented out
   - System tracks changes automatically
```

### Database Schema

```sql
equipment(
  id UUID,
  name VARCHAR,
  description TEXT,
  category_id UUID,
  daily_rate DECIMAL,
  stock_count INT,
  image_url VARCHAR,
  created_at TIMESTAMP
)

categories(
  id UUID,
  name VARCHAR,
  parent_id UUID  -- For subcategories
)
```

---

## 📋 Quote Generation

### Overview

Professional quote creation with automatic translations, PDF generation, and file storage.

### Features

- **Equipment Selection** - Choose items for quote
- **Pricing Calculation** - Auto-calculate totals
- **Multi-Language** - Automatic DeepL translation
- **PDF Export** - Professional branded PDFs
- **Cloud Storage** - Store quotes in MinIO S3
- **Quote History** - Track all quotes created

### How to Use

```
Dashboard → Quotes → Create Quote

Step 1: Select Client
  - Choose existing client or create new
  - Client info auto-fills

Step 2: Add Equipment
  - Search and select equipment items
  - System shows available stock
  - Adjust quantities if needed

Step 3: Set Rental Dates
  - Choose start date
  - Choose end date
  - System calculates duration

Step 4: Select Language
  - Choose language for PDF output
  - English: No translation needed
  - Portuguese, Spanish, French, etc.: Auto-translated via DeepL

Step 5: Generate Quote
  - Review pricing summary
  - Click "Generate PDF"
  - System translates content if needed
  - PDF uploaded to MinIO S3
  - Download link provided

Step 6: Send to Client
  - Copy share link
  - Email to client
  - Track quote status
```

### Quote Workflow

```
User Input (Equipment + Dates)
   ↓
Calculate Pricing
   ↓
Check Language (English?)
   ├─ YES → Skip translation
   └─ NO → Call DeepL API
   ↓
Generate PDF
   ↓
Upload to MinIO S3
   ↓
Return Download Link
```

### Database Schema

```sql
quotes(
  id UUID,
  client_id UUID,
  items JSONB,  -- Equipment selections
  total DECIMAL,
  language VARCHAR(10),
  pdf_url VARCHAR,
  status VARCHAR,  -- draft, sent, accepted
  created_at TIMESTAMP
)
```

---

## 🌍 Multi-Language Support (DB-First + DeepL)

### Overview

Automatic translation system using DeepL API with PostgreSQL caching for performance.

### How It Works

```
1. Content stored in database with English base
2. User requests different language
3. Check PostgreSQL Translations table for cache
4. Cache HIT → Return instantly (fast)
5. Cache MISS → Call DeepL API (4-5 seconds)
6. Store translation in DB for future use
7. Next time: Instant cache hit
```

### Supported Languages

```
English (en)           → Base language
Portuguese (pt)        → PT, PT-BR
Spanish (es)           → ES, ES-MX
French (fr)            → FR, FR-CA
German (de)            → DE, DE-AT
Italian (it)           → IT
Dutch (nl)             → NL, NL-BE
Polish (pl), Swedish (sv), Norwegian (no)
Japanese (ja), Chinese (zh)
+ 35+ more languages via DeepL
```

### Configuration

**Required:**
```bash
DEEPL_API_KEY=your-api-key-here
```

Get API key: https://www.deepl.com/pro-api

**Optional:**
```bash
TRANSLATE_TARGET_LANGUAGES=en,pt,es,fr,de
```

### API Usage

```javascript
// Automatic translation on quote generation
POST /api/quotes
{
  clientId: "...",
  items: [...],
  language: "pt"  // Portuguese
}
// System automatically translates all content
```

---

## 🎪 Event & Reservation Management

### Overview

Schedule and manage rental events with calendar view and real-time updates.

### Features

- **Calendar View** - Monthly, weekly, daily views
- **Event Creation** - Schedule rental events
- **Equipment Assignment** - Assign equipment to events
- **Availability Checking** - Auto-check equipment availability
- **Event Editing** - Modify event details
- **Notifications** - Real-time event updates

### How to Use

```
Dashboard → Events → Calendar

1. Create Event
   - Click date on calendar
   - Enter event name and details
   - Select start/end dates
   - Click "Save"

2. Add Equipment to Event
   - Click equipment "Add"
   - Select items from inventory
   - Check availability (green = available)
   - Confirm

3. Edit Event
   - Click event in calendar
   - Modify details
   - Save changes

4. View Schedule
   - Monthly view: See all events
   - Weekly view: Detailed view
   - Drag to reschedule events
   - Real-time notifications
```

---

## 👥 Client & Partner Management

### Overview

CRM system for managing customer and vendor relationships.

### Features

- **Client Database** - Store customer info
- **Contact Management** - Phone, email, address
- **Rental History** - View all client rentals
- **Invoicing** - Track payments
- **Partner Management** - Vendor relationships
- **Communication** - Notes and history

### How to Use

```
Dashboard → Clients → Client Management

1. Add Client
   - Click "New Client"
   - Enter: Name, Email, Phone, Address
   - Save

2. View Client Details
   - Click client name
   - See rental history
   - View all quotes
   - Track payments

3. Update Client Info
   - Edit contact details
   - Update billing address
   - Save changes
```

---

## 💾 Cloud Storage (MinIO S3)

### Overview

S3-compatible file storage for equipment images, quotes, and documents.

### Features

- **File Upload** - Upload images, PDFs, documents
- **Cloud Storage** - Persistent file storage
- **Signed URLs** - Secure temporary download links
- **File Management** - Organize and manage files
- **Backup** - Automatic backups

### How Files Are Stored

```
User Uploads File
   ↓
MinIO S3 Validates
   ↓
Store in: s3://acrobaticz/bucket/
   ↓
Generate Signed URL (time-limited)
   ↓
Return download link
```

### API Usage

```bash
# Signed URL (expires in 7 days by default)
GET /api/storage/signed-url?file=equipment/img123.jpg

# Returns: https://s3.example.com/acrobaticz/equipment/img123.jpg?token=xyz&expires=123456
```

---

## 📊 Real-Time Updates (WebSocket)

### Overview

Live data synchronization across all connected users using Socket.io.

### Events

```
inventory-updated
  Emitted when: Equipment stock changed
  Payload: { equipmentId, newStock, timestamp }

reservation-created
  Emitted when: New booking made
  Payload: { equipmentId, clientId, dates, status }

quote-ready
  Emitted when: PDF quote generated
  Payload: { quoteId, downloadUrl, clientEmail }

system-alert
  Emitted when: Important notifications
  Payload: { title, message, severity }
```

### How It Works

```
Browser 1 updates inventory
   ↓
Backend updates PostgreSQL
   ↓
Socket.io broadcasts event
   ↓
Browser 2 receives update
   ↓
UI updates in real-time (no refresh!)
```

---

## 🔐 User Roles & Permissions

### Role Hierarchy

```
Admin (Full Access)
├─ Equipment Management: Create, Read, Update, Delete
├─ Quote Generation: Create, View, Send
├─ Reservations: Full control
├─ User Management: Create, Delete users
├─ Analytics: Full access
└─ Settings: System configuration

Manager (Operational)
├─ Equipment Management: Read, Update stock
├─ Quote Generation: Create, View, Send
├─ Reservations: Create, Edit, Cancel
├─ Analytics: Limited (own team)
└─ Settings: Cannot change

Technician (Limited)
├─ Equipment Management: Read only
├─ Quote Generation: View only
├─ Reservations: View, Check-in/out
├─ Analytics: No access
└─ Settings: No access
```

---

## 🧪 Testing Features

### Test Equipment Data

When seeding database, system creates:

```
65 Products:
├─ 21 Audio Equipment items
├─ 18 Lighting items
├─ 15 Video Equipment items
├─ 11 Rigging & Structure items

3 Users:
├─ admin@example.com (Admin)
├─ manager@example.com (Manager)
└─ tech@example.com (Technician)

6 Categories:
├─ Audio/Sound
├─ Lighting
├─ Video/Projection
├─ Rigging
├─ Staging
└─ Miscellaneous
```

---

## 📚 Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [API/ENDPOINTS.md](../API/ENDPOINTS.md) - API reference
- [ENVIRONMENT.md](../../ENVIRONMENT.md) - Configuration

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
