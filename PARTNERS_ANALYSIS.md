# Partners System Analysis: Provider vs Client Model

## 📋 Current Implementation

### Existing Partner Model
Currently, **Partners are exclusively PROVIDERS** - companies that supply equipment we rent from:

```prisma
model Partner {
  id            String      @id @default(cuid())
  name          String
  companyName   String?
  contactPerson String?
  email         String?
  phone         String?
  address       String?
  website       String?
  notes         String?
  isActive      Boolean     @default(true)
  version       Int         @default(1)
  createdBy     String?
  updatedBy     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  subrentals    Subrental[]
}

model Subrental {
  id              String    @id @default(cuid())
  partnerId       String      // ← Link to Provider
  eventId         String?
  equipmentName   String
  equipmentDesc   String?
  quantity        Int       @default(1)
  dailyRate       Float
  totalCost       Float
  startDate       DateTime
  endDate         DateTime
  status          String    @default("pending")
  invoiceNumber   String?
  notes           String?
  // ... audit fields
  partner         Partner   @relation(...)  // ← Equipment we get FROM partner
}
```

### Existing Client Model (Different Entity)
**Clients are end-users** who request our services:

```prisma
model Client {
  id            String   @id @default(cuid())
  name          String
  contactPerson String?
  email         String?
  phone         String?
  address       String?
  notes         String?
  // ... audit fields
  events        Event[]    // ← Events WE handle for this client
  quotes        Quote[]    // ← Quotes WE provide to this client
}
```

---

## 🎯 Your Proposal: Partner Types

Your idea makes perfect sense for a B2B AV rental business:

### 📊 Current State vs Proposed State

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Provider Partners** | ✅ Implemented | ✅ Keep & enhance |
| **Agency Partners** (Client Partners) | ❌ Not implemented | ✅ NEW - Add support |
| **Job Generation** | Manual | Could be automated |
| **Revenue Tracking** | Per subrental | Need partner-level tracking |

### Use Cases

#### 1️⃣ **Provider Partners** (Current)
- Stereolites, Sony, Aputure, etc.
- We **BUY/RENT equipment from them**
- We add to quotes under "Subrental" lines
- Example: "Sony FX6 rental from Stereolites - $500/day"

#### 2️⃣ **Agency Partners** (NEW)
- Agencies, production companies, event companies
- They **SEND US JOBS** through their clients
- We provide quotes and handle services
- Example: "Agency ABC brings us 3 events/month averaging $5K each"

#### 3️⃣ **Hybrid Partners** (Complex)
- Some companies might be both:
  - Buy camera packages from them (Provider)
  - Also send us events (Agency)

---

## 💡 Architecture Recommendation

### Option A: Add `partnerType` Field (Simple)
**Best for most businesses**

```prisma
model Partner {
  id            String      @id @default(cuid())
  name          String
  companyName   String?
  contactPerson String?
  email         String?
  phone         String?
  address       String?
  website       String?
  notes         String?
  
  // NEW FIELD
  partnerType   String      @default("provider")  // "provider" | "agency" | "both"
  
  isActive      Boolean     @default(true)
  version       Int         @default(1)
  createdBy     String?
  updatedBy     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relationships
  subrentals    Subrental[]      // ← Equipment we get FROM provider
  jobReferences JobReference[]   // ← NEW: Events they referred to us
}

// NEW MODEL: Track agency referrals
model JobReference {
  id          String    @id @default(cuid())
  partnerId   String
  eventId     String?
  quoteId     String?
  clientName  String    // Agency may send new clients
  notes       String?
  commission  Float?    // Track commission percentage if applicable
  status      String    @default("pending")  // pending, active, completed, archived
  referralDate DateTime @default(now())
  
  partner     Partner   @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  event       Event?    @relation(fields: [eventId], references: [id], onDelete: SetNull)
  
  @@index([partnerId])
  @@index([eventId])
}
```

### Option B: Separate Tables (More Complex)
**Best if you need distinct workflows**

```prisma
// Existing - rename for clarity
model EquipmentProvider {
  // Same as current Partner
}

// New - for agencies
model AgencyPartner {
  id            String      @id @default(cuid())
  name          String
  companyName   String?
  contactPerson String?
  email         String?
  phone         String?
  address       String?
  website       String?
  referralRate  Float?      // Commission %
  notes         String?
  isActive      Boolean     @default(true)
  version       Int         @default(1)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  jobReferences JobReference[]
}

model JobReference {
  id           String         @id @default(cuid())
  agencyId     String
  eventId      String?
  quoteName    String
  expectedValue Float?
  actualValue  Float?
  notes        String?
  // ... dates, status
  
  agency       AgencyPartner  @relation(fields: [agencyId], references: [id])
}
```

---

## 🛠️ Implementation Steps

### Phase 1: Enhance Current Partner Model
1. Add `partnerType` field to Partner model
2. Add index: `@@index([partnerType])`
3. Create migration
4. Update Partner validation schema
5. Update UI filters: "Show Providers" / "Show Agencies" / "Show All"

### Phase 2: Add Job Reference Tracking
1. Create `JobReference` model
2. Create migration
3. Add API endpoints:
   - `POST /api/job-references` - Add new referral
   - `GET /api/job-references?partnerId=X` - List referrals
   - `PUT /api/job-references/[id]` - Update status/notes
   - `GET /api/analytics/partners` - Partner performance

### Phase 3: UI Enhancements
1. Partner list: Filter by type
2. Partner detail: Show referral history
3. Quote form: Track referring agency
4. Dashboard: Partner performance metrics

### Phase 4: Analytics & Reporting
- Revenue by partner
- Referral frequency
- Job quality metrics
- Commission tracking

---

## 📊 Data Model Relationships

### Current Flow (Provider Only)
```
Quote
  └─ QuoteItem (subrental type)
       └─ Partner (Equipment Provider)
            └─ Subrental record
```

### Enhanced Flow (With Agencies)
```
Event/Quote
  ├─ originating from Client
  ├─ potentially referred by: JobReference → Agency Partner
  └─ may include: QuoteItem → Equipment Provider Partner
```

---

## ✅ Benefits of This Model

| Benefit | Provider Type | Agency Type |
|---------|---------------|-------------|
| **Revenue tracking** | Cost tracking | Revenue attribution |
| **Relationship mgmt** | Supply chain | Business development |
| **Reporting** | Supplier analysis | Partner performance |
| **Scalability** | Equipment sourcing | Growing agency network |

---

## 🎓 Examples

### Scenario 1: Direct Client
```
Client: Acme Corp
Event: Product Launch
Rentals: 2x Sony FX6 from Stereolites, Lighting kit
Source: Direct inquiry
```

### Scenario 2: Agency Referral
```
Agency Partner: Creative Minds Productions
Client: Their client "XYZ Events"
Event: Corporate Gala
Rentals: Full AV package, personnel
Commission: 10% or flat fee
```

### Scenario 3: Hybrid Supplier-Agency
```
Partner: Studio Equipment Co.
Type: "both"
As Provider: Rent RED cameras from them ($800/day)
As Agency: They send us 5-10 events/year from their network
```

---

## 🔄 Migration Path (if using Option A)

### SQL Migration Example
```sql
-- Add new column
ALTER TABLE "Partner" ADD COLUMN "partnerType" TEXT DEFAULT 'provider';

-- Add index
CREATE INDEX "Partner_partnerType_idx" ON "Partner"("partnerType");

-- Create JobReference table
CREATE TABLE "JobReference" (
  id TEXT PRIMARY KEY,
  partnerId TEXT NOT NULL,
  eventId TEXT,
  quoteId TEXT,
  clientName TEXT,
  notes TEXT,
  commission FLOAT,
  status TEXT DEFAULT 'pending',
  referralDate TIMESTAMP DEFAULT now(),
  CONSTRAINT "JobReference_partnerId_fkey" 
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") 
    ON DELETE CASCADE
);

CREATE INDEX "JobReference_partnerId_idx" ON "JobReference"("partnerId");
CREATE INDEX "JobReference_eventId_idx" ON "JobReference"("eventId");
```

---

## 🎯 Recommendation

**Use Option A** (add `partnerType` field) because:
- ✅ Minimal database changes
- ✅ Supports both provider and agency relationships
- ✅ Allows hybrid partnerships
- ✅ Easy to query and filter
- ✅ Can scale to additional partner types later (consultants, subcontractors, etc.)
- ✅ Backwards compatible with existing data

---

## 📝 Next Steps

1. **Decision**: Confirm Option A or B
2. **Define**: Commission structure for agencies
3. **Build**: Migration + schema update
4. **Test**: With sample data
5. **Deploy**: To production
6. **UI**: Add partner type filter to components
7. **Analytics**: Create partner performance dashboard

---

## 💬 Questions to Answer

- Should agencies pay commission or earn it from us?
- Track commission per referral or as % of job value?
- Do you want automated alerts for partner performance?
- Should partners have different permissions/access?
- Need integration with accounting for settlements?
