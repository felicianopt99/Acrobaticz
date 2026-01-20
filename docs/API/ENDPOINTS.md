# 🔌 API Reference - Acrobaticz Elite

Complete REST API and WebSocket documentation.

---

## 🔐 Authentication

### JWT Token

All API requests require JWT authentication (except `/api/auth/login`).

```bash
# Include JWT token in Authorization header
Authorization: Bearer <your-jwt-token>
```

### Login Endpoint

**POST** `/api/auth/login`

```json
Request:
{
  "email": "admin@example.com",
  "password": "admin123"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d",
  "user": {
    "id": "user-123",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Logout Endpoint

**POST** `/api/auth/logout`

```bash
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

### Verify Token

**GET** `/api/auth/verify`

```bash
Authorization: Bearer <token>

Response (200 OK):
{
  "valid": true,
  "user": {
    "id": "user-123",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## 📦 Equipment Endpoints

### List All Equipment

**GET** `/api/equipment`

```bash
Authorization: Bearer <token>

Query Parameters:
  ?search=projector      # Search by name
  ?category=audio        # Filter by category
  ?stock=true           # Only available items
  ?limit=50             # Results per page
  ?offset=0             # Pagination offset

Response (200 OK):
{
  "data": [
    {
      "id": "eq-123",
      "name": "Projector 4K",
      "description": "Professional 4K projector",
      "category": { "id": "cat-1", "name": "Audio/Video" },
      "stock": 5,
      "dailyRate": 150.00,
      "image": "https://s3.../equipment/proj123.jpg",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 65,
  "page": 1
}
```

### Get Single Equipment

**GET** `/api/equipment/:id`

```bash
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "eq-123",
  "name": "Projector 4K",
  "description": "Professional 4K projector",
  "category": { "id": "cat-1", "name": "Audio/Video" },
  "stock": 5,
  "dailyRate": 150.00,
  "translations": [
    {
      "language": "pt",
      "name": "Projetor 4K",
      "description": "Projetor profissional 4K"
    }
  ]
}
```

### Create Equipment

**POST** `/api/equipment`

```bash
Authorization: Bearer <token>
Role Required: admin

Request:
{
  "name": "New Equipment",
  "description": "Description",
  "categoryId": "cat-1",
  "dailyRate": 100.00,
  "stock": 10,
  "image": "base64-encoded-image"
}

Response (201 Created):
{
  "id": "eq-new",
  "name": "New Equipment",
  ...
}
```

### Update Equipment

**PUT** `/api/equipment/:id`

```bash
Authorization: Bearer <token>
Role Required: admin

Request:
{
  "name": "Updated Equipment",
  "stock": 15
}

Response (200 OK):
{
  "id": "eq-123",
  "name": "Updated Equipment",
  ...
}
```

### Delete Equipment

**DELETE** `/api/equipment/:id`

```bash
Authorization: Bearer <token>
Role Required: admin

Response (200 OK):
{
  "message": "Equipment deleted successfully"
}
```

---

## 📋 Quote Endpoints

### Create Quote

**POST** `/api/quotes`

```bash
Authorization: Bearer <token>

Request:
{
  "clientId": "client-123",
  "items": [
    { "equipmentId": "eq-1", "quantity": 2 },
    { "equipmentId": "eq-2", "quantity": 1 }
  ],
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "language": "pt"
}

Response (201 Created):
{
  "id": "quote-123",
  "clientId": "client-123",
  "items": [...],
  "total": 750.00,
  "language": "pt",
  "pdfUrl": "https://s3.../quotes/quote-123.pdf",
  "status": "draft",
  "createdAt": "2026-01-18T14:30:00Z"
}
```

### Get Quote

**GET** `/api/quotes/:id`

```bash
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "quote-123",
  "clientId": "client-123",
  "items": [...],
  "total": 750.00,
  "language": "pt",
  "pdfUrl": "https://s3.../quotes/quote-123.pdf",
  "status": "draft"
}
```

### List Quotes

**GET** `/api/quotes`

```bash
Authorization: Bearer <token>

Query Parameters:
  ?clientId=client-123   # Filter by client
  ?status=draft          # Filter by status
  ?language=pt           # Filter by language
  ?limit=50

Response (200 OK):
{
  "data": [...],
  "total": 42,
  "page": 1
}
```

### Update Quote Status

**PUT** `/api/quotes/:id`

```bash
Authorization: Bearer <token>

Request:
{
  "status": "sent"  # draft, sent, accepted, rejected
}

Response (200 OK):
{
  "id": "quote-123",
  "status": "sent"
}
```

---

## 👥 Client Endpoints

### List Clients

**GET** `/api/clients`

```bash
Authorization: Bearer <token>

Query Parameters:
  ?search=VRD           # Search by name
  ?limit=50

Response (200 OK):
{
  "data": [
    {
      "id": "client-123",
      "name": "VRD Production",
      "email": "contact@vrd.com",
      "phone": "+351 911 234 567",
      "address": "Lisbon, Portugal",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ],
  "total": 15
}
```

### Create Client

**POST** `/api/clients`

```bash
Authorization: Bearer <token>
Role Required: admin, manager

Request:
{
  "name": "New Client",
  "email": "client@example.com",
  "phone": "+351 911 234 567",
  "address": "Address, City"
}

Response (201 Created):
{
  "id": "client-new",
  "name": "New Client",
  ...
}
```

---

## 🎪 Reservation Endpoints

### Create Reservation

**POST** `/api/reservations`

```bash
Authorization: Bearer <token>
Role Required: admin, manager

Request:
{
  "equipmentId": "eq-123",
  "clientId": "client-123",
  "startDate": "2026-02-01",
  "endDate": "2026-02-05"
}

Response (201 Created):
{
  "id": "res-123",
  "equipmentId": "eq-123",
  "clientId": "client-123",
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "status": "confirmed",
  "createdAt": "2026-01-18T14:30:00Z"
}
```

### Check Equipment Availability

**GET** `/api/reservations/availability/:equipmentId`

```bash
Authorization: Bearer <token>

Query Parameters:
  ?startDate=2026-02-01
  ?endDate=2026-02-05

Response (200 OK):
{
  "equipmentId": "eq-123",
  "available": true,
  "availableCount": 3,
  "totalCount": 5,
  "conflictingReservations": []
}
```

---

## 🌐 Translation Endpoints

### Get Translations

**GET** `/api/translations`

```bash
Authorization: Bearer <token>

Query Parameters:
  ?resourceId=eq-123     # Equipment ID
  ?language=pt           # Language code
  ?field=name            # Field to translate

Response (200 OK):
{
  "data": [
    {
      "id": "trans-1",
      "resourceId": "eq-123",
      "language": "pt",
      "field": "name",
      "value": "Projetor 4K",
      "provider": "deepl",
      "cachedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### Translate Text

**POST** `/api/translations/translate`

```bash
Authorization: Bearer <token>

Request:
{
  "text": "Professional projector",
  "targetLanguage": "pt",
  "sourceLanguage": "en"
}

Response (200 OK):
{
  "originalText": "Professional projector",
  "translatedText": "Projetor profissional",
  "sourceLanguage": "en",
  "targetLanguage": "pt",
  "provider": "deepl"
}
```

---

## 📊 Analytics Endpoints

### Dashboard Stats

**GET** `/api/analytics/dashboard`

```bash
Authorization: Bearer <token>
Role Required: admin, manager

Response (200 OK):
{
  "totalEquipment": 65,
  "availableEquipment": 45,
  "activeReservations": 12,
  "totalQuotes": 42,
  "totalRevenue": 15750.00,
  "monthlyRevenue": 3200.00
}
```

### Equipment Report

**GET** `/api/analytics/equipment`

```bash
Authorization: Bearer <token>

Response (200 OK):
{
  "data": [
    {
      "equipmentId": "eq-123",
      "name": "Projector 4K",
      "timesRented": 8,
      "revenue": 1200.00,
      "utilizationRate": 65
    }
  ]
}
```

---

## 🔔 WebSocket Events

### Connection

```javascript
// Connect
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Connected
socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Listen to Events

```javascript
// Inventory Updated
socket.on('inventory-updated', (data) => {
  // { equipmentId, newStock, timestamp }
  updateEquipmentStock(data.equipmentId, data.newStock);
});

// Reservation Created
socket.on('reservation-created', (data) => {
  // { equipmentId, clientId, dates, status }
  addReservationToCalendar(data);
});

// Quote Ready
socket.on('quote-ready', (data) => {
  // { quoteId, downloadUrl, clientEmail }
  notifyQuoteReady(data);
});

// System Alert
socket.on('system-alert', (data) => {
  // { title, message, severity }
  showNotification(data);
});
```

### Disconnect

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## ⚠️ Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Missing or invalid authentication token"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions for this action"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "An unexpected error occurred",
  "requestId": "req-abc123"
}
```

---

## 🧪 Testing API with cURL

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

# Get Equipment
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/equipment

# Create Quote
curl -X POST http://localhost:3000/api/quotes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-123",
    "items": [{"equipmentId": "eq-1", "quantity": 2}],
    "startDate": "2026-02-01",
    "endDate": "2026-02-05",
    "language": "pt"
  }'
```

---

## 📚 Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [FEATURES/OVERVIEW.md](../FEATURES/OVERVIEW.md) - Feature descriptions
- [ENVIRONMENT.md](../../ENVIRONMENT.md) - Configuration

---

**Last Updated**: January 18, 2026 | **Status**: Production Ready ✅
