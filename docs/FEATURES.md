# ✨ Acrobaticz Features Guide

Complete documentation of all features in the Acrobaticz AV Equipment Rental System.

---

## 📦 Equipment Management

### Core Functionality
- **Equipment Registry** - Add, edit, delete equipment items
- **Categories & Subcategories** - Organize equipment hierarchically
- **Pricing Tiers** - Daily rates, weekly rates, monthly rates
- **Real-time Availability** - Track equipment status (available, rented, maintenance)
- **Stock Tracking** - Manage quantity per equipment type
- **Equipment Attributes** - Brand, model, serial number, purchase date, warranty

### Advanced Features
- **Maintenance Tracking** - Log maintenance activities and dates
- **Depreciation Tracking** - Monitor equipment value over time
- **Equipment Images** - Store photos and specifications
- **Replacement Cost** - Track insurance/replacement value
- **Equipment Notes** - Add custom notes and history

### API Endpoints
```
GET    /api/equipment              - List all equipment
POST   /api/equipment              - Create equipment
GET    /api/equipment/:id          - Get equipment details
PUT    /api/equipment/:id          - Update equipment
DELETE /api/equipment/:id          - Delete equipment
GET    /api/categories             - List categories
POST   /api/categories             - Create category
```

---

## 📋 Quote Management

### Quote Generation
- **Professional PDFs** - Auto-generated quotes with branding
- **Custom Templates** - White-label quotes with company logo
- **Item Line Editing** - Add/remove items, adjust quantities
- **Discount Application** - Fixed amount or percentage discounts
- **Tax Calculation** - Automatic tax computation
- **Total Pricing** - Automatic total with all fees included

### Quote Features
- **Save as Draft** - Create and save quotes without sending
- **Send via Email** - Direct delivery to clients
- **Client-Specific Pricing** - Volume discounts per client
- **Quote Expiration** - Set validity dates
- **Quote History** - View previous versions
- **PDF Download** - Direct download of generated quotes

### Workflow
1. **Create Quote** - Select client and event date
2. **Add Items** - Choose equipment and quantities
3. **Apply Discounts** - Add promotions/volume discounts
4. **Review** - Check calculations and details
5. **Send/Download** - Email to client or download PDF
6. **Convert to Rental** - Turn approved quote into rental order

### API Endpoints
```
POST   /api/quotes                 - Create quote
GET    /api/quotes/:id             - Get quote details
PUT    /api/quotes/:id             - Update quote
DELETE /api/quotes/:id             - Delete quote
GET    /api/quotes/:id/pdf         - Download PDF
POST   /api/quotes/:id/send        - Send via email
```

---

## 📅 Event Management

### Event Creation
- **Event Details** - Name, date, location, client
- **Equipment Requirements** - Specify needed equipment
- **Event Duration** - Start and end dates
- **Delivery Instructions** - Where/when equipment delivered
- **Setup Notes** - Installation requirements

### Event Tracking
- **Status Management** - Pending, confirmed, in-progress, completed
- **Timeline View** - Visual calendar of all events
- **Resource Allocation** - Auto-assign available equipment
- **Conflicts Detection** - Warn if equipment double-booked
- **Event Notes** - Add comments and updates
- **Contact Information** - Client and venue contacts

### Equipment Assignment
- **Drag & Drop Assignment** - Easy equipment allocation
- **Auto-Suggest** - System recommends available equipment
- **Quantity Management** - Assign correct quantities
- **Condition Notes** - Equipment state when delivered
- **Return Tracking** - Verify all equipment returned

### API Endpoints
```
GET    /api/events                 - List all events
POST   /api/events                 - Create event
GET    /api/events/:id             - Get event details
PUT    /api/events/:id             - Update event
DELETE /api/events/:id             - Delete event
POST   /api/events/:id/equipment   - Assign equipment
```

---

## 👥 Client Management

### Client Profile
- **Basic Information** - Name, email, phone, address
- **Company Details** - Company name, tax ID, website
- **Contact Persons** - Multiple contacts per client
- **Payment Terms** - Default payment method and terms
- **Credit Limit** - Maximum credit allowed
- **Notes & History** - Client-specific information

### Client Segmentation
- **Client Types** - Individual, corporate, event organizer
- **Tier System** - VIP, regular, occasional clients
- **Discount Groups** - Auto-applied volume discounts
- **Reference Clients** - Track recommended clients

### Relationship Management
- **Rental History** - Complete history of rentals
- **Payment History** - Invoice tracking and payments
- **Communication Log** - Emails and interactions
- **Preferences** - Billing preferences, delivery options
- **Credit Status** - Payment reliability tracking

### API Endpoints
```
GET    /api/clients                - List all clients
POST   /api/clients                - Create client
GET    /api/clients/:id            - Get client details
PUT    /api/clients/:id            - Update client
DELETE /api/clients/:id            - Delete client
GET    /api/clients/:id/rentals    - Client rental history
```

---

## 🤝 Partner Network

### Partner Management
- **Sub-Rental Companies** - Link with other rental companies
- **Equipment Pooling** - Share equipment with partners
- **Pricing Agreements** - Negotiated rates per partner
- **Commission Tracking** - Track commissions and payments
- **Quality Ratings** - Rate partner performance

### Collaboration Features
- **Equipment Requests** - Request equipment from partners
- **Availability Checking** - View partner inventory
- **Pricing Lookup** - See partner pricing
- **Order Placement** - Place orders with partners
- **Payment Processing** - Automated partner payments

### Partner Portal
- **Self-Service Platform** - Partners manage own inventory
- **Order Status** - Track requests in real-time
- **Communication** - Direct messaging system
- **Reports** - Partner performance analytics
- **API Access** - Integration with partner systems

### API Endpoints
```
GET    /api/partners               - List all partners
POST   /api/partners               - Create partner
GET    /api/partners/:id           - Get partner details
PUT    /api/partners/:id           - Update partner
GET    /api/partners/:id/equipment - Partner's equipment
```

---

## 🌍 Multi-Language Support

### Supported Languages
- **Portuguese (PT)** - Default language
- **English (EN)** - Full English interface
- **Expandable** - Add more languages easily

### Translation System
- **Automatic Translation** - DeepL API integration
- **Manual Translations** - Override automatic translations
- **Database Storage** - Translations stored in DB
- **Category Translations** - Equipment names in multiple languages
- **API Multilingual** - Return data in requested language

### Implementation Details
- **Database Schema** - Separate translation tables
- **Fallback Logic** - Use English if translation missing
- **Admin Interface** - Manage translations easily
- **Performance Optimized** - Cached translations

### API Endpoints
```
GET    /api/translations/:language - Get translations
POST   /api/translations           - Create translation
PUT    /api/translations/:id       - Update translation
```

---

## 🔐 Access Control

### Role-Based Access (RBAC)
- **Admin** - Full system access, user management
- **Manager** - Business operations, reporting
- **Technician** - Equipment management, maintenance
- **Employee** - Basic operations, limited access
- **Viewer** - Read-only access

### Permission System
- **Equipment** - Create, read, update, delete with role restrictions
- **Quotes** - Generate, send, approve with workflow
- **Events** - Create, manage, assign with role limits
- **Clients** - Create, manage, view with segmentation
- **Partners** - Manage relationships and agreements
- **Users** - Admin only user management
- **Reports** - View limited by role

### Security Features
- JWT Authentication
- Session Management
- Activity Logging
- Permission Auditing

---

## 📊 Analytics & Reporting

### Equipment Reports
- **Utilization Rate** - % time equipment is rented
- **Revenue per Item** - Income generated per equipment
- **Maintenance Schedule** - Upcoming maintenance
- **Age & Depreciation** - Equipment lifecycle tracking

### Business Analytics
- **Revenue Tracking** - Total income by period
- **Client Analytics** - Top clients, client value
- **Event Statistics** - Event volume and trends
- **Profitability** - Revenue minus costs

### Operational Reports
- **Availability Report** - Equipment availability status
- **Rental Calendar** - Visual equipment schedule
- **Overdue Returns** - Track late equipment
- **Partner Performance** - Partner reliability metrics

### Export Options
- **PDF Reports** - Formatted reports
- **Excel Exports** - Data in spreadsheet format
- **CSV Data** - Raw data export
- **Email Delivery** - Scheduled report delivery

---

## 🔔 Notifications

### Notification Types
- **Quote Expiration** - Remind about expiring quotes
- **Equipment Return** - Notify about return dates
- **Maintenance Reminders** - Schedule maintenance
- **Order Updates** - Status changes for clients
- **Payment Reminders** - Invoice reminders
- **System Alerts** - Important system messages

### Notification Channels
- **In-App** - Dashboard notifications
- **Email** - Automated email alerts
- **SMS** - Text message notifications (optional)
- **Webhooks** - External system integration

---

## 🖼️ Cloud Storage

### File Management
- **Document Upload** - Store quotes, contracts, images
- **File Organization** - Folders and categorization
- **Access Control** - Permission-based file access
- **Version History** - Track document versions
- **File Sharing** - Share with clients/partners

### Supported File Types
- **Documents** - PDF, DOCX, XLSX
- **Images** - JPG, PNG, WebP
- **Media** - MP4, MOV for video
- **Archives** - ZIP for bulk uploads

### Storage Options
- **Local Storage** - Self-hosted file storage
- **AWS S3** - Amazon cloud storage
- **Custom Endpoints** - SFTP or custom servers

---

## 🔧 Maintenance Module

### Maintenance Tracking
- **Schedule Maintenance** - Plan equipment service
- **Maintenance Log** - Record all maintenance activities
- **Cost Tracking** - Monitor maintenance expenses
- **Technician Assignment** - Assign maintenance to staff
- **Equipment Status** - Mark equipment in maintenance

### Preventive Maintenance
- **Service Reminders** - Automated maintenance alerts
- **Maintenance Cycles** - Recurring maintenance schedules
- **Cost Forecasting** - Predict maintenance costs
- **Warranty Tracking** - Track equipment warranties

---

## 📈 Business Intelligence

### Dashboard Widgets
- **Revenue Overview** - Current period revenue
- **Utilization Rate** - Equipment availability
- **Client Metrics** - New clients, top clients
- **Upcoming Events** - Next 7 days events
- **Alerts** - System alerts and warnings

### Custom Reports
- **Date Range Selection** - Filter reports by dates
- **Department Filtering** - Filter by equipment category
- **Client Filtering** - Analyze specific clients
- **Export All Formats** - PDF, Excel, CSV

---

## ✅ Production-Ready Features

✓ Enterprise-grade database (PostgreSQL)
✓ Secure authentication (JWT, bcryptjs)
✓ Role-based access control
✓ Activity audit logging
✓ Automated backups
✓ Performance optimizations
✓ Error handling & recovery
✓ API rate limiting
✓ CORS protection
✓ Input validation & sanitization

---

**Last Updated:** January 14, 2026
**Version:** 1.0.0
