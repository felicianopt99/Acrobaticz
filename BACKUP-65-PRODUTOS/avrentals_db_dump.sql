pg_dump: last built-in OID is 16383
pg_dump: reading extensions
pg_dump: identifying extension members
pg_dump: reading schemas
pg_dump: reading user-defined tables
pg_dump: reading user-defined functions
pg_dump: reading user-defined types
pg_dump: reading procedural languages
pg_dump: reading user-defined aggregate functions
pg_dump: reading user-defined operators
pg_dump: reading user-defined access methods
pg_dump: reading user-defined operator classes
pg_dump: reading user-defined operator families
pg_dump: reading user-defined text search parsers
pg_dump: reading user-defined text search templates
pg_dump: reading user-defined text search dictionaries
pg_dump: reading user-defined text search configurations
pg_dump: reading user-defined foreign-data wrappers
pg_dump: reading user-defined foreign servers
pg_dump: reading default privileges
pg_dump: reading user-defined collations
pg_dump: reading user-defined conversions
pg_dump: reading type casts
pg_dump: reading transforms
pg_dump: reading table inheritance information
pg_dump: reading event triggers
pg_dump: finding extension tables
pg_dump: finding inheritance relationships
pg_dump: reading column info for interesting tables
pg_dump: finding table default expressions
pg_dump: flagging inherited columns in subtables
pg_dump: reading partitioning data
pg_dump: reading indexes
pg_dump: flagging indexes in partitioned tables
pg_dump: reading extended statistics
pg_dump: reading constraints
pg_dump: reading triggers
pg_dump: reading rewrite rules
pg_dump: reading policies
pg_dump: reading row-level security policies
pg_dump: reading publications
pg_dump: reading publication membership of tables
pg_dump: reading publication membership of schemas
pg_dump: reading subscriptions
pg_dump: reading large objects
pg_dump: reading dependency data
pg_dump: saving encoding = UTF8
pg_dump: saving standard_conforming_strings = on
pg_dump: saving search_path = 
pg_dump: creating TABLE "public.ActivityLog"
pg_dump: creating TABLE "public.BackupJob"
pg_dump: creating TABLE "public.BatchOperation"
pg_dump: creating TABLE "public.CatalogShare"
pg_dump: creating TABLE "public.CatalogShareInquiry"
pg_dump: creating TABLE "public.Category"
pg_dump: creating TABLE "public.Client"
pg_dump: creating TABLE "public.CloudFile"
pg_dump: creating TABLE "public.CloudFolder"
pg_dump: creating TABLE "public.DataSyncEvent"
pg_dump: creating TABLE "public.EquipmentItem"
pg_dump: creating TABLE "public.Event"
pg_dump: creating TABLE "public.EventSubClient"
pg_dump: creating TABLE "public.Fee"
pg_dump: creating TABLE "public.FileActivity"
pg_dump: creating TABLE "public.FileShare"
pg_dump: creating TABLE "public.FileTag"
pg_dump: creating TABLE "public.FileVersion"
pg_dump: creating TABLE "public.FolderShare"
pg_dump: creating TABLE "public.FolderTag"
pg_dump: creating TABLE "public.JobReference"
pg_dump: creating TABLE "public.MaintenanceLog"
pg_dump: creating TABLE "public.Notification"
--
-- PostgreSQL database dump
--

\restrict 1YEPaIkDcAWx71wZJwQ4lJ9GeKaXZ6Q1rR5kLGNswvlkB9QrxaXN0YVdDqyInft

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

-- Started on 2026-01-08 00:39:12 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16528)
-- Name: ActivityLog; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."ActivityLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    "entityType" text,
    "entityId" text,
    "oldData" text,
    "newData" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ActivityLog" OWNER TO avrentals_user;

--
-- TOC entry 250 (class 1259 OID 17019)
-- Name: BackupJob; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."BackupJob" (
    id text NOT NULL,
    "jobType" text NOT NULL,
    status text NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "backupFile" text,
    "fileSize" bigint,
    duration integer,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BackupJob" OWNER TO avrentals_user;

--
-- TOC entry 248 (class 1259 OID 16961)
-- Name: BatchOperation; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."BatchOperation" (
    id text NOT NULL,
    "operationType" text NOT NULL,
    status text NOT NULL,
    "fileCount" integer NOT NULL,
    "folderCount" integer DEFAULT 0 NOT NULL,
    "performedBy" text NOT NULL,
    "initiatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    details text,
    error text
);


ALTER TABLE public."BatchOperation" OWNER TO avrentals_user;

--
-- TOC entry 251 (class 1259 OID 17039)
-- Name: CatalogShare; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."CatalogShare" (
    id text NOT NULL,
    token text NOT NULL,
    "partnerId" text NOT NULL,
    "selectedEquipmentIds" text[],
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CatalogShare" OWNER TO avrentals_user;

--
-- TOC entry 252 (class 1259 OID 17056)
-- Name: CatalogShareInquiry; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."CatalogShareInquiry" (
    id text NOT NULL,
    "catalogShareId" text NOT NULL,
    "partnerId" text NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    items jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "breakdownDateTime" timestamp(3) without time zone,
    budget text,
    "customerCompany" text,
    "deliveryLocation" text,
    "eventLocation" text NOT NULL,
    "eventName" text NOT NULL,
    "eventType" text,
    "setupDateTime" timestamp(3) without time zone,
    "specialRequirements" text
);


ALTER TABLE public."CatalogShareInquiry" OWNER TO avrentals_user;

--
-- TOC entry 217 (class 1259 OID 16405)
-- Name: Category; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    icon text,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text
);


ALTER TABLE public."Category" OWNER TO avrentals_user;

--
-- TOC entry 221 (class 1259 OID 16441)
-- Name: Client; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    name text NOT NULL,
    "contactPerson" text,
    email text,
    phone text,
    address text,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "partnerId" text,
    "taxId" text
);


ALTER TABLE public."Client" OWNER TO avrentals_user;

--
-- TOC entry 238 (class 1259 OID 16765)
-- Name: CloudFile; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."CloudFile" (
    id text NOT NULL,
    name text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size bigint NOT NULL,
    "storagePath" text NOT NULL,
    url text,
    "folderId" text,
    "ownerId" text NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "isStarred" boolean DEFAULT false NOT NULL,
    "isTrashed" boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CloudFile" OWNER TO avrentals_user;

--
-- TOC entry 237 (class 1259 OID 16754)
-- Name: CloudFolder; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."CloudFolder" (
    id text NOT NULL,
    name text NOT NULL,
    "parentId" text,
    "ownerId" text NOT NULL,
    color text DEFAULT '#1F2937'::text,
    "isStarred" boolean DEFAULT false NOT NULL,
    "isTrashed" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CloudFolder" OWNER TO avrentals_user;

--
-- TOC entry 229 (class 1259 OID 16536)
-- Name: DataSyncEvent; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."DataSyncEvent" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    action text NOT NULL,
    data text,
    version integer NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DataSyncEvent" OWNER TO avrentals_user;

--
-- TOC entry 219 (class 1259 OID 16423)
-- Name: EquipmentItem; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."EquipmentItem" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "categoryId" text NOT NULL,
    "subcategoryId" text,
    quantity integer NOT NULL,
    status text NOT NULL,
    location text NOT NULL,
    "imageUrl" text,
    "dailyRate" double precision DEFAULT 0 NOT NULL,
    type text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "descriptionPt" text
);


ALTER TABLE public."EquipmentItem" OWNER TO avrentals_user;

--
-- TOC entry 222 (class 1259 OID 16450)
-- Name: Event; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    name text NOT NULL,
    "clientId" text NOT NULL,
    location text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "assignedTo" text,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "agencyId" text
);


ALTER TABLE public."Event" OWNER TO avrentals_user;

--
-- TOC entry 254 (class 1259 OID 17112)
-- Name: EventSubClient; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."EventSubClient" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "clientId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventSubClient" OWNER TO avrentals_user;

--
-- TOC entry 231 (class 1259 OID 16555)
-- Name: Fee; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Fee" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    amount double precision NOT NULL,
    type text DEFAULT 'fixed'::text NOT NULL,
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Fee" OWNER TO avrentals_user;

--
-- TOC entry 242 (class 1259 OID 16803)
-- Name: FileActivity; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."FileActivity" (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FileActivity" OWNER TO avrentals_user;

--
-- TOC entry 239 (class 1259 OID 16777)
-- Name: FileShare; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."FileShare" (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "sharedWith" text,
    permission text DEFAULT 'view'::text NOT NULL,
    "shareToken" text,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FileShare" OWNER TO avrentals_user;

--
-- TOC entry 246 (class 1259 OID 16945)
-- Name: FileTag; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."FileTag" (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "tagId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FileTag" OWNER TO avrentals_user;

--
-- TOC entry 241 (class 1259 OID 16795)
-- Name: FileVersion; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."FileVersion" (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "versionNum" integer NOT NULL,
    "storagePath" text NOT NULL,
    size bigint NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "uploadedBy" text
);


ALTER TABLE public."FileVersion" OWNER TO avrentals_user;

--
-- TOC entry 240 (class 1259 OID 16786)
-- Name: FolderShare; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."FolderShare" (
    id text NOT NULL,
    "folderId" text NOT NULL,
    "sharedWith" text,
    permission text DEFAULT 'view'::text NOT NULL,
    "shareToken" text,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FolderShare" OWNER TO avrentals_user;

--
-- TOC entry 247 (class 1259 OID 16953)
-- Name: FolderTag; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."FolderTag" (
    id text NOT NULL,
    "folderId" text NOT NULL,
    "tagId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FolderTag" OWNER TO avrentals_user;

--
-- TOC entry 244 (class 1259 OID 16904)
-- Name: JobReference; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."JobReference" (
    id text NOT NULL,
    "partnerId" text NOT NULL,
    "eventId" text,
    "quoteId" text,
    "clientName" text,
    "referralNotes" text,
    commission double precision,
    status text DEFAULT 'pending'::text NOT NULL,
    "referralDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JobReference" OWNER TO avrentals_user;

--
-- TOC entry 220 (class 1259 OID 16433)
-- Name: MaintenanceLog; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."MaintenanceLog" (
    id text NOT NULL,
    "equipmentId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    cost double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


pg_dump: creating TABLE "public.NotificationPreference"
pg_dump: creating TABLE "public.Partner"
ALTER TABLE public."MaintenanceLog" OWNER TO avrentals_user;

--
-- TOC entry 232 (class 1259 OID 16566)
-- Name: Notification; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "entityType" text,
    "entityId" text,
    "actionUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "groupKey" text
);


ALTER TABLE public."Notification" OWNER TO avrentals_user;

--
-- TOC entry 253 (class 1259 OID 17079)
-- Name: NotificationPreference; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."NotificationPreference" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "conflictAlerts" boolean DEFAULT true NOT NULL,
    "statusChanges" boolean DEFAULT true NOT NULL,
    "eventReminders" boolean DEFAULT true NOT NULL,
    "overdueAlerts" boolean DEFAULT true NOT NULL,
    "criticalAlerts" boolean DEFAULT true NOT NULL,
    "stockAlerts" boolean DEFAULT true NOT NULL,
    "equipmentAvailable" boolean DEFAULT true NOT NULL,
    "monthlySummary" boolean DEFAULT true NOT NULL,
    "toastCritical" boolean DEFAULT true NOT NULL,
    "toastHigh" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


pg_dump: creating TABLE "public.QuotaChangeHistory"
ALTER TABLE public."NotificationPreference" OWNER TO avrentals_user;

--
-- TOC entry 235 (class 1259 OID 16716)
-- Name: Partner; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Partner" (
    id text NOT NULL,
    name text NOT NULL,
    "companyName" text,
    "contactPerson" text,
    email text,
    phone text,
    address text,
    website text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text,
    "partnerType" text DEFAULT 'provider'::text NOT NULL,
    commission double precision,
    "logoUrl" text
);


ALTER TABLE public."Partner" OWNER TO avrentals_user;

--
-- TOC entry 249 (class 1259 OID 17011)
-- Name: QuotaChangeHistory; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."QuotaChangeHistory" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "oldQuotaBytes" bigint NOT NULL,
    "newQuotaBytes" bigint NOT NULL,
    "changedBy" text NOT NULL,
    reason text,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


pg_dump: creating TABLE "public.Quote"
ALTER TABLE public."QuotaChangeHistory" OWNER TO avrentals_user;

--
-- TOC entry 224 (class 1259 OID 16467)
-- Name: Quote; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Quote" (
    id text NOT NULL,
    "quoteNumber" text NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    "clientId" text,
    "clientName" text NOT NULL,
    "clientEmail" text,
    "clientPhone" text,
    "clientAddress" text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "subTotal" double precision NOT NULL,
    "discountAmount" double precision DEFAULT 0 NOT NULL,
    "discountType" text DEFAULT 'fixed'::text NOT NULL,
    "taxRate" double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    terms text
);


pg_dump: creating TABLE "public.QuoteItem"
pg_dump: creating TABLE "public.Rental"
pg_dump: creating TABLE "public.Service"
ALTER TABLE public."Quote" OWNER TO avrentals_user;

--
-- TOC entry 225 (class 1259 OID 16481)
-- Name: QuoteItem; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."QuoteItem" (
    id text NOT NULL,
    "quoteId" text NOT NULL,
    type text NOT NULL,
    "equipmentId" text,
    "equipmentName" text,
    "serviceId" text,
    "serviceName" text,
    "feeId" text,
    "feeName" text,
    amount double precision,
    "feeType" text,
    quantity integer,
    "unitPrice" double precision,
    days integer,
    "lineTotal" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."QuoteItem" OWNER TO avrentals_user;

--
-- TOC entry 223 (class 1259 OID 16459)
-- Name: Rental; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Rental" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "equipmentId" text NOT NULL,
    "quantityRented" integer NOT NULL,
    "prepStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


pg_dump: creating TABLE "public.StorageQuota"
pg_dump: creating TABLE "public.Subcategory"
pg_dump: creating TABLE "public.Subrental"
ALTER TABLE public."Rental" OWNER TO avrentals_user;

--
-- TOC entry 230 (class 1259 OID 16545)
-- Name: Service; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Service" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "unitPrice" double precision NOT NULL,
    unit text DEFAULT 'hour'::text NOT NULL,
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Service" OWNER TO avrentals_user;

--
-- TOC entry 243 (class 1259 OID 16811)
-- Name: StorageQuota; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."StorageQuota" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "usedBytes" bigint DEFAULT 0 NOT NULL,
    "quotaBytes" bigint DEFAULT '10737418240'::bigint NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cloudEnabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."StorageQuota" OWNER TO avrentals_user;

--
-- TOC entry 218 (class 1259 OID 16414)
-- Name: Subcategory; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Subcategory" (
    id text NOT NULL,
    name text NOT NULL,
    "parentId" text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Subcategory" OWNER TO avrentals_user;

--
-- TOC entry 236 (class 1259 OID 16726)
-- Name: Subrental; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Subrental" (
    id text NOT NULL,
    "partnerId" text NOT NULL,
    "eventId" text,
    "equipmentName" text NOT NULL,
    "equipmentDesc" text,
    quantity integer DEFAULT 1 NOT NULL,
    "dailyRate" double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "invoiceNumber" text,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


pg_dump: creating TABLE "public.TagDefinition"
pg_dump: creating TABLE "public.Translation"
pg_dump: creating TABLE "public.TranslationHistory"
ALTER TABLE public."Subrental" OWNER TO avrentals_user;

--
-- TOC entry 245 (class 1259 OID 16936)
-- Name: TagDefinition; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."TagDefinition" (
    id text NOT NULL,
    name text NOT NULL,
    "ownerId" text NOT NULL,
    color text DEFAULT '#3B82F6'::text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TagDefinition" OWNER TO avrentals_user;

--
-- TOC entry 233 (class 1259 OID 16675)
-- Name: Translation; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."Translation" (
    id text NOT NULL,
    "sourceText" text NOT NULL,
    "targetLang" text NOT NULL,
    "translatedText" text NOT NULL,
    model text DEFAULT 'deepl'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    context text,
    "isAutoTranslated" boolean DEFAULT false NOT NULL,
    "lastUsed" timestamp(3) without time zone,
    "needsReview" boolean DEFAULT false NOT NULL,
    "qualityScore" integer DEFAULT 100 NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    status text DEFAULT 'approved'::text NOT NULL,
    tags text[],
    "usageCount" integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Translation" OWNER TO avrentals_user;

--
-- TOC entry 234 (class 1259 OID 16694)
-- Name: TranslationHistory; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."TranslationHistory" (
    id text NOT NULL,
    "translationId" text NOT NULL,
    "oldTranslatedText" text NOT NULL,
    "newTranslatedText" text NOT NULL,
    "changedBy" text,
    "changeReason" text,
    version integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TranslationHistory" OWNER TO avrentals_user;

--
-- TOC entry 216 (class 1259 OID 16394)
-- Name: User; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "photoUrl" text,
    nif text,
    iban text,
    "contactPhone" text,
    "contactEmail" text,
    "emergencyPhone" text,
    "isTeamMember" boolean DEFAULT false NOT NULL,
    "teamTitle" text,
    "teamBio" text,
    "teamCoverPhoto" text,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


pg_dump: creating TABLE "public.User"
pg_dump: creating TABLE "public.UserSession"
pg_dump: creating TABLE "public._prisma_migrations"
ALTER TABLE public."User" OWNER TO avrentals_user;

--
-- TOC entry 227 (class 1259 OID 16519)
-- Name: UserSession; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."UserSession" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserSession" OWNER TO avrentals_user;

--
-- TOC entry 215 (class 1259 OID 16385)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


pg_dump: creating TABLE "public.customization_settings"
ALTER TABLE public._prisma_migrations OWNER TO avrentals_user;

--
-- TOC entry 226 (class 1259 OID 16489)
-- Name: customization_settings; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public.customization_settings (
    id text NOT NULL,
    "companyName" text,
    "companyTagline" text,
    "contactEmail" text,
    "contactPhone" text,
    "useTextLogo" boolean DEFAULT true NOT NULL,
    "primaryColor" text,
    "secondaryColor" text,
    "accentColor" text,
    "darkMode" boolean DEFAULT false NOT NULL,
    "logoUrl" text,
    "faviconUrl" text,
    "loginBackgroundType" text DEFAULT 'gradient'::text NOT NULL,
    "loginBackgroundColor1" text,
    "loginBackgroundColor2" text,
    "loginBackgroundImage" text,
    "loginCardOpacity" double precision DEFAULT 0.95 NOT NULL,
    "loginCardBlur" boolean DEFAULT true NOT NULL,
    "loginCardPosition" text DEFAULT 'center'::text NOT NULL,
    "loginCardWidth" integer DEFAULT 400 NOT NULL,
    "loginCardBorderRadius" integer DEFAULT 8 NOT NULL,
    "loginCardShadow" text DEFAULT 'large'::text NOT NULL,
    "loginLogoUrl" text,
    "loginLogoSize" integer DEFAULT 80 NOT NULL,
    "loginWelcomeMessage" text,
    "loginWelcomeSubtitle" text,
    "loginFooterText" text,
    "loginShowCompanyName" boolean DEFAULT true NOT NULL,
    "loginFormSpacing" integer DEFAULT 16 NOT NULL,
    "loginButtonStyle" text DEFAULT 'default'::text NOT NULL,
    "loginInputStyle" text DEFAULT 'default'::text NOT NULL,
    "loginAnimations" boolean DEFAULT true NOT NULL,
    "loginLightRaysOrigin" text,
    "loginLightRaysColor" text,
    "loginLightRaysSpeed" double precision,
    "loginLightRaysSpread" double precision,
    "loginLightRaysLength" double precision,
    "loginLightRaysPulsating" boolean DEFAULT false NOT NULL,
    "loginLightRaysFadeDistance" double precision,
    "loginLightRaysSaturation" double precision,
    "loginLightRaysFollowMouse" boolean DEFAULT true NOT NULL,
    "loginLightRaysMouseInfluence" double precision,
    "loginLightRaysNoiseAmount" double precision,
    "loginLightRaysDistortion" double precision,
    "customCSS" text,
    "footerText" text,
    "systemName" text,
    timezone text,
    "dateFormat" text,
    currency text,
    language text,
    "sessionTimeout" integer,
    "requireStrongPasswords" boolean DEFAULT true NOT NULL,
    "enableTwoFactor" boolean DEFAULT false NOT NULL,
    "maxLoginAttempts" integer,
    "emailEnabled" boolean DEFAULT true NOT NULL,
    "smtpServer" text,
    "smtpPort" text,
    "smtpUsername" text,
    "smtpPassword" text,
    "fromEmail" text,
    "autoBackup" boolean DEFAULT true NOT NULL,
    "backupFrequency" text,
    "backupRetention" integer,
    version integer DEFAULT 1 NOT NULL,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "pdfCompanyName" text,
    "pdfCompanyTagline" text,
    "pdfContactEmail" text,
    "pdfContactPhone" text,
    "pdfLogoUrl" text,
    "pdfUseTextLogo" boolean,
    "pdfFooterMessage" text,
    "pdfFooterContactText" text,
    "pdfShowFooterContact" boolean,
    "themePreset" text,
    "catalogTermsAndConditions" text
);


pg_dump: processing data for table "public.ActivityLog"
pg_dump: dumping contents of table "public.ActivityLog"
pg_dump: processing data for table "public.BackupJob"
pg_dump: dumping contents of table "public.BackupJob"
pg_dump: processing data for table "public.BatchOperation"
pg_dump: dumping contents of table "public.BatchOperation"
pg_dump: processing data for table "public.CatalogShare"
pg_dump: dumping contents of table "public.CatalogShare"
ALTER TABLE public.customization_settings OWNER TO avrentals_user;

--
-- TOC entry 3956 (class 0 OID 16528)
-- Dependencies: 228
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."ActivityLog" (id, "userId", action, "entityType", "entityId", "oldData", "newData", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- TOC entry 3978 (class 0 OID 17019)
-- Dependencies: 250
-- Data for Name: BackupJob; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."BackupJob" (id, "jobType", status, "startedAt", "completedAt", "backupFile", "fileSize", duration, error, "createdAt") FROM stdin;
\.


--
-- TOC entry 3976 (class 0 OID 16961)
-- Dependencies: 248
-- Data for Name: BatchOperation; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."BatchOperation" (id, "operationType", status, "fileCount", "folderCount", "performedBy", "initiatedAt", "completedAt", details, error) FROM stdin;
\.


--
-- TOC entry 3979 (class 0 OID 17039)
pg_dump: processing data for table "public.CatalogShareInquiry"
pg_dump: dumping contents of table "public.CatalogShareInquiry"
pg_dump: processing data for table "public.Category"
pg_dump: dumping contents of table "public.Category"
-- Dependencies: 251
-- Data for Name: CatalogShare; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CatalogShare" (id, token, "partnerId", "selectedEquipmentIds", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3980 (class 0 OID 17056)
-- Dependencies: 252
-- Data for Name: CatalogShareInquiry; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CatalogShareInquiry" (id, "catalogShareId", "partnerId", "customerName", "customerEmail", "customerPhone", "startDate", "endDate", items, status, "createdAt", "updatedAt", "breakdownDateTime", budget, "customerCompany", "deliveryLocation", "eventLocation", "eventName", "eventType", "setupDateTime", "specialRequirements") FROM stdin;
\.


--
-- TOC entry 3945 (class 0 OID 16405)
-- Dependencies: 217
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Category" (id, name, icon, version, "createdBy", "updatedBy", "createdAt", "updatedAt", description) FROM stdin;
pg_dump: processing data for table "public.Client"
pg_dump: dumping contents of table "public.Client"
cmk1e0n230003tb4gtbayc9jd	Lighting	Lightbulb	1	\N	\N	2026-01-06 16:55:54.022	2026-01-06 19:55:04.35	\N
cmk2xt5s50023cw5g2242d74c	Power	Settings	1	\N	\N	2026-01-06 18:42:57.03	2026-01-06 19:55:16.876	\N
cmk2yg76g002xcw5gs5phwj4g	Staging and Structures	Cuboid	1	\N	\N	2026-01-06 19:00:51.928	2026-01-06 19:55:26.233	\N
cmk2u2ind000ccw5gwp8sjln3	Video	Projector	1	\N	\N	2026-01-06 16:58:15.145	2026-01-06 19:55:37.185	\N
cmk1e0n260004tb4g37154d95	Audio and Sound	Speaker	1	\N	\N	2026-01-06 16:55:54.025	2026-01-06 19:55:43.764	\N
cmk2yahn1002mcw5gvbcgkszj	Others	Layers	1	\N	\N	2026-01-06 18:56:25.549	2026-01-06 19:55:54.467	\N
\.


--
-- TOC entry 3949 (class 0 OID 16441)
-- Dependencies: 221
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Client" (id, name, "contactPerson", email, phone, address, notes, version, "createdBy", "updatedBy", "createdAt", "updatedAt", "partnerId", "taxId") FROM stdin;
cmk1e0n1r0002tb4gjb98wkjn	Rey Davis	Rey Davis Team	hello@vrd.productions	351969774999	VRD Production	Professional Audio Visual Equipment Rental Provider	1	\N	\N	2026-01-06 16:55:54.018	2026-01-06 16:55:54.018	cmk1e0n150000tb4g9cktv4bk	\N
pg_dump: processing data for table "public.CloudFile"
pg_dump: dumping contents of table "public.CloudFile"
\.


--
-- TOC entry 3966 (class 0 OID 16765)
-- Dependencies: 238
-- Data for Name: CloudFile; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CloudFile" (id, name, "originalName", "mimeType", size, "storagePath", url, "folderId", "ownerId", "isPublic", "isStarred", "isTrashed", version, "createdAt", "updatedAt") FROM stdin;
cmk2tqx5p003si9xdzcwrk1un	Event Checklist.pdf	Event Checklist.pdf	application/pdf	150000	/storage/1767718154077-Event Checklist.pdf	\N	cmk2tqx5c003ki9xd5vjrb077	cmk2tl2690000o85xlet8yxg7	f	f	f	1	2026-01-06 16:49:14.078	2026-01-06 16:49:14.078
cmk2tqx5t003ui9xdqrox2869	Equipment List.xlsx	Equipment List.xlsx	application/vnd.ms-excel	85000	/storage/1767718154081-Equipment List.xlsx	\N	cmk2tqx5c003ki9xd5vjrb077	cmk2tl2690000o85xlet8yxg7	f	f	f	1	2026-01-06 16:49:14.082	2026-01-06 16:49:14.082
cmk2tqx5x003wi9xdgzxa7k4d	Quote Template.docx	Quote Template.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	45000	/storage/1767718154085-Quote Template.docx	\N	cmk2tqx5f003mi9xd9f58dmpu	cmk2tl2690000o85xlet8yxg7	f	f	f	1	2026-01-06 16:49:14.085	2026-01-06 16:49:14.085
pg_dump: processing data for table "public.CloudFolder"
pg_dump: dumping contents of table "public.CloudFolder"
cmk2tqx60003yi9xdenffiahc	Event Schedule.pdf	Event Schedule.pdf	application/pdf	200000	/storage/1767718154088-Event Schedule.pdf	\N	cmk2tqx59003ii9xdobblxc65	cmk2tl2690000o85xlet8yxg7	f	f	f	1	2026-01-06 16:49:14.089	2026-01-06 16:49:14.089
\.


--
-- TOC entry 3965 (class 0 OID 16754)
-- Dependencies: 237
-- Data for Name: CloudFolder; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CloudFolder" (id, name, "parentId", "ownerId", color, "isStarred", "isTrashed", "createdAt", "updatedAt") FROM stdin;
cmk2tqx59003ii9xdobblxc65	My Drive	\N	cmk2tl2690000o85xlet8yxg7	#1F2937	f	f	2026-01-06 16:49:14.061	2026-01-06 16:49:14.061
cmk2tqx5c003ki9xd5vjrb077	Events	cmk2tqx59003ii9xdobblxc65	cmk2tl2690000o85xlet8yxg7	#1F2937	f	f	2026-01-06 16:49:14.065	2026-01-06 16:49:14.065
cmk2tqx5f003mi9xd9f58dmpu	Equipment Docs	cmk2tqx59003ii9xdobblxc65	cmk2tl2690000o85xlet8yxg7	#1F2937	f	f	2026-01-06 16:49:14.068	2026-01-06 16:49:14.068
cmk2tqx5i003oi9xdvw5bjnw9	Quotes & Invoices	cmk2tqx59003ii9xdobblxc65	cmk2tl2690000o85xlet8yxg7	#1F2937	f	f	2026-01-06 16:49:14.071	2026-01-06 16:49:14.071
pg_dump: processing data for table "public.DataSyncEvent"
pg_dump: dumping contents of table "public.DataSyncEvent"
pg_dump: processing data for table "public.EquipmentItem"
pg_dump: dumping contents of table "public.EquipmentItem"
cmk2tqx5m003qi9xdmzg5j7gx	Archive	cmk2tqx59003ii9xdobblxc65	cmk2tl2690000o85xlet8yxg7	#1F2937	f	f	2026-01-06 16:49:14.074	2026-01-06 16:49:14.074
\.


--
-- TOC entry 3957 (class 0 OID 16536)
-- Dependencies: 229
-- Data for Name: DataSyncEvent; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."DataSyncEvent" (id, "entityType", "entityId", action, data, version, processed, "createdAt") FROM stdin;
\.


--
-- TOC entry 3947 (class 0 OID 16423)
-- Dependencies: 219
-- Data for Name: EquipmentItem; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."EquipmentItem" (id, name, description, "categoryId", "subcategoryId", quantity, status, location, "imageUrl", "dailyRate", type, version, "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionPt") FROM stdin;
cmk1r2r5y000ftjehu7vmjvk4	Ape Labs Neon Tube – Professional Wireless LED Tube	The Ape Labs Neon Tube is the ultimate tool for creating sophisticated, modern lighting environments. Unlike traditional LED bars, this 100cm tube offers a 180° homogeneous glow with absolutely no visible "pixel dots." It is a heavy-duty, battery-powered fixture designed for professionals who need high-impact visual effects with zero cables and zero hassle.	cmk1e0n230003tb4gtbayc9jd	cmk1e0n3f000mtb4g4wo3p1kw	6	good	Warehouse A	/seeding-images/equipment-1767653200216-vwbhw98b1.jpg	25	equipment	1	\N	\N	2026-01-06 16:55:54.053	2026-01-06 16:55:54.053	O tubo de néon da Ape Labs é a ferramenta ideal para criar ambientes de iluminação sofisticados e modernos. Ao contrário das barras de LED tradicionais, este tubo de 100 cm oferece um brilho homogéneo de 180° sem quaisquer "pontos de pixel" visíveis. Trata-se de uma luminária resistente, alimentada por bateria, concebida para profissionais que necessitam de efeitos visuais de grande impacto sem cabos e sem complicações.
cmk1e0n2r000ctb4ghxbg3if0	FOS ACL LINE 12	ACL Pixel Control line bar, 12 led 30watt RGBW, 3 degrees beam angle, Linear Dimmer 0-100%, DMX modes 10/48/58 ch, 93 cm, 7.9kg	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2a0006tb4gfvum37v3	6	good	Warehouse A	/seeding-images/equipment-1767652774835-zhdybbmzk.jpg	45	equipment	1	\N	\N	2026-01-06 16:55:54.06	2026-01-06 16:55:54.06	Barra de linha ACL Pixel Control, 12 leds RGBW de 30 watts, ângulo de feixe de 3 graus, regulador de intensidade linear 0-100%, modos DMX 10/48/58 ch, 93 cm, 7,9 kg
cmk1e0n3b000ktb4go104acfo	FOS F-7	Professional super bright outdoor IP65 Strobe/washer, 48 leds 15watt RGBW, 35° optics for each led, field angle 120°, diecast barndoor, Four section pixel control (Horizontal LED groups), true powercon	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2w000etb4gowy0l9bi	4	good	Warehouse A	/seeding-images/equipment-1767652798760-z74ni74i6.jpg	35	equipment	1	\N	\N	2026-01-06 16:55:54.063	2026-01-06 16:55:54.063	Lâmpada estroboscópica/lavadora profissional super brilhante para exterior IP65, 48 leds RGBW de 15 watts, ótica de 35° para cada led, ângulo de campo de 120°, barndoor fundido, controlo de pixéis de quatro secções (grupos de LED horizontais), verdadeiro controlo de potência
cmk1e0n3j000otb4gaiz45mya	FOS Luminus PRO IP	High quality professional battery operated led par, 6 led HEX RGBW+A+UV 12 watt, IP Rating: IP54 top/ IP20 bottom, 100% true wireless DMX up to 400m visible control distance, Rechargeable	cmk1e0n230003tb4gtbayc9jd	cmk1e0n3f000mtb4g4wo3p1kw	8	good	Warehouse A	/seeding-images/equipment-1767652824077-s63nwhotv.jpg	15	equipment	1	\N	\N	2026-01-06 16:55:54.067	2026-01-06 16:55:54.067	Par de leds profissionais de alta qualidade operados por bateria, 6 leds HEX RGBW+A+UV 12 watts, Classificação IP: IP54 superior/ IP20 inferior, DMX sem fios 100% verdadeiro até 400m de distância de controlo visível, recarregável
cmk1e0n35000itb4gv63dhi2w	FOS Par 18x10WPRO IP65	Weatherproof aluminium led par with IP connectors, Beam aperture: 30°, 18 RGBW 10w LEDs (4in1), Dimmer: 0-100% stop/strobe effect, aluminium 4kg, noiseless cooling system	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2w000etb4gowy0l9bi	8	good	Warehouse A	/seeding-images/equipment-1767652872896-dbwz5sx2h.jpg	25	equipment	1	\N	\N	2026-01-06 16:55:54.074	2026-01-06 16:55:54.074	Par de leds em alumínio à prova de intempéries com conectores IP, abertura de feixe: 30°, 18 LEDs RGBW 10w (4em1), Regulador de intensidade: 0-100% efeito de paragem/estroboscópico, alumínio 4kg, sistema de arrefecimento silencioso
cmk1e0n2m000atb4g7a1gjcxs	FOS Q19 Ultra	High power Wash / Beam moving head, 19 RGBW 40w 4in1 LEDs, linear zoom 6-60°, full pixel control, round ring with dynamic patterns, color temperature adjustment, 24,30,112 DMX channels, theater	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2a0006tb4gfvum37v3	4	good	Warehouse A	/seeding-images/equipment-1767652898711-7h5jdh312.jpg	75	equipment	1	\N	\N	2026-01-06 16:55:54.077	2026-01-06 16:55:54.077	Cabeça móvel Wash / Beam de alta potência, 19 LEDs RGBW 40w 4in1, zoom linear 6-60°, controlo total de pixéis, anel redondo com padrões dinâmicos, ajuste da temperatura da cor, 24,30,112 canais DMX, teatro
cmk1e0n2g0008tb4gn4gfv84j	FOS TITAN BEAM - 230W Moving Head Beam Light	Fast and powerful 230W moving head, producing a bright, parallel beam with a 0-3.8° angle. Features 14 colors + white, 17 fixed gobos + open, an 8-facet rotating prism, frost	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2a0006tb4gfvum37v3	2	good	Warehouse A	/seeding-images/equipment-1767652943787-aieb3wm5w.jpg	55	equipment	1	\N	\N	2026-01-06 16:55:54.083	2026-01-06 16:55:54.083	Cabeça móvel rápida e potente de 230 W, produzindo um feixe luminoso e paralelo com um ângulo de 0-3,8°. Inclui 14 cores + branco, 17 gobos fixos + abertos, um prisma rotativo de 8 facetas, gelo
cmk1e0n4g000wtb4gj2yekt3o	FOS Retro	Retro background fixture, diameter 64cm, 750 watt halogen lamp driven by internal dimmer, 96pcs 3in1 RGB LEDs background lighting, 4/6/9 DMX channels, Aluminum alloy housing, LCD menu	cmk1e0n230003tb4gtbayc9jd	cmk1e0n44000stb4gyw8a3jx9	2	good	Warehouse A	/seeding-images/equipment-1767652917348-izz6dgnby.jpg	40	equipment	2	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.08	2026-01-06 20:10:21.473	Luminária de fundo retro, 64 cm de diâmetro, lâmpada de halogéneo de 750 watts acionada por um regulador de intensidade interno, iluminação de fundo com LEDs RGB 3 em 1 de 96 peças, 4/6/9 canais DMX, caixa em liga de alumínio, menu LCD
cmk1e0n5r001gtb4gs0gw00ef	Electro-Voice EVERSE 8 (White) – Ultra-Portable Battery Powered PA	Ultimate "no-stress" speaker. Designed for total mobility, this sleek white unit is completely wireless, running on high-capacity internal battery. Perfect for rooftop events and mobile setups	cmk1e0n260004tb4g37154d95	cmk1e0n5m001etb4gstw7s39f	2	good	Warehouse B	/seeding-images/equipment-1767653239198-3x1k21hxw.jpg	100	equipment	2	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.057	2026-01-06 20:11:53.238	O melhor altifalante "sem stress". Concebida para uma mobilidade total, esta elegante unidade branca é totalmente sem fios e funciona com uma bateria interna de elevada capacidade. Perfeito para eventos em telhados e configurações móveis
cmk1e0n4s0012tb4glanvxelb	HK Audio Linear 5 MKII 112 XA	The "Swiss Army Knife" of professional audio. High-performance, active 12" loudspeaker built for versatility, serving as crystal-clear front-of-house (FOH)	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	2	good	Warehouse B	/seeding-images/equipment-1767653282925-kltb0j1un.jpg	70	equipment	2	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.086	2026-01-06 20:13:01.231	O "canivete suíço" do áudio profissional. Altifalante ativo de 12" de elevado desempenho, construído para ser versátil, servindo como um sistema de som cristalino para a frente da sala (FOH)
cmk1e0n63001mtb4gwcx4ojpb	Shure SM57 LC	Industry's most trusted professional instrument microphone. Known as the "Workhorse", it is the global standard for capturing loud, high-impact sound sources with absolute clarity	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	2	good	Warehouse B	/seeding-images/equipment-1767653442872-f3iq0emiz.jpg	8	equipment	1	\N	\N	2026-01-06 16:55:54.105	2026-01-06 16:55:54.105	O microfone para instrumentos profissionais mais fiável do sector. Conhecido como o "cavalo de batalha", é o padrão global para captar fontes sonoras altas e de alto impacto com absoluta clareza
cmk1e0n5z001ktb4gzpm5wbbf	Shure SM58	The legendary "King of Microphones". Known globally as the industry standard for live vocals, this heavy-duty dynamic mic is famous for its nearly indestructible build and ability to handle extreme SPL	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	3	good	Warehouse B	/seeding-images/equipment-1767653472474-dyy4kasov.jpg	8	equipment	1	\N	\N	2026-01-06 16:55:54.108	2026-01-06 16:55:54.108	O lendário "Rei dos Microfones". Conhecido mundialmente como o padrão da indústria para vocais ao vivo, este microfone dinâmico de alta resistência é famoso por sua construção quase indestrutível e capacidade de suportar SPL extremos
cmk1rams2000utjehyl67da9p	Stairville AFH-600 DMX	The Stairville AFH-600 is a high-performance atmospheric tool built for professional stage and lighting applications. Unlike standard smoke machines that produce thick, opaque clouds, this Hazer creates a fine, translucent mist that hangs in the air to perfectly define light beams, lasers, and textures. It is the industry-standard choice for ensuring your lighting design is visible from every angle without blocking the audience’s view of the stage	cmk1e0n230003tb4gtbayc9jd	cmk1ra3xh000qtjeh69nb1iod	2	good	Warehouse A	/seeding-images/equipment-1767653568202-j07l8pxi4.jpg	35	equipment	1	\N	\N	2026-01-06 16:55:54.112	2026-01-06 16:55:54.112	O Stairville AFH-600 é uma ferramenta atmosférica de alto desempenho criada para aplicações profissionais de palco e iluminação. Ao contrário das máquinas de fumo normais que produzem nuvens espessas e opacas, este Hazer cria uma névoa fina e translúcida que paira no ar para definir perfeitamente feixes de luz, lasers e texturas. É a escolha padrão da indústria para garantir que o seu projeto de iluminação é visível de todos os ângulos sem bloquear a visão do palco por parte do público
cmk1e0n4b000utb4gst864yww	Varytec Retro Blinder TRI 180	Add a high-impact "eye-candy" effect to your stage or event with this unique triangular fixture combining the nostalgic look of a classic halogen blinder with modern LED technology	cmk1e0n230003tb4gtbayc9jd	cmk1e0n44000stb4gyw8a3jx9	2	good	Warehouse A	/seeding-images/equipment-1767652968319-b8r9chmnd.jpg	45	equipment	1	\N	\N	2026-01-06 16:55:54.115	2026-01-06 16:55:54.115	Acrescente um efeito "eye-candy" de grande impacto ao seu palco ou evento com esta luminária triangular única que combina o aspeto nostálgico de um projetor de halogéneo clássico com a moderna tecnologia LED
cmk1e0n3n000qtb4g9j3brv6c	Varytec bat.PAR V2 RGBWW	Elevate your event atmosphere with the ultimate cable-free lighting solution. Compact, high-performance LED spotlight designed for quick setup and professional results	cmk1e0n230003tb4gtbayc9jd	cmk1e0n3f000mtb4g4wo3p1kw	9	good	Warehouse A	/seeding-images/equipment-1767652996994-fco9qoh93.jpg	15	equipment	1	\N	\N	2026-01-06 16:55:54.118	2026-01-06 16:55:54.118	Eleve a atmosfera do seu evento com a derradeira solução de iluminação sem cabos. Projetor LED compacto e de elevado desempenho concebido para uma configuração rápida e resultados profissionais
cmk1e0n4x0014tb4gghayqvr8	HK Audio Linear 5 MKII 308 LTA – Long-Throw Active PA Speaker	Ultimate solution when you need to deliver high-fidelity sound over long distances. High-performance, horn-loaded active unit designed to bridge the gap between studio and venue	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	4	good	Warehouse B	/seeding-images/equipment-1767653325588-zzyp1d648.jpg	100	equipment	3	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.093	2026-01-06 20:15:35.189	A derradeira solução quando é necessário fornecer som de alta fidelidade a longas distâncias. Unidade ativa de alto desempenho, carregada com corneta, concebida para fazer a ponte entre o estúdio e o local
cmk1e0n5i001ctb4gqp1dhbzt	Mackie Thump 118S – 18" Professional Active Subwoofer	High-performance, heavy-duty subwoofer designed for shaking the room. If your event needs that deep, physical bass that defines professional dance events	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	2	good	Warehouse B	/images/equipment-1767731688410-3plft6k3a.jpg	100	equipment	3	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.095	2026-01-06 20:34:48.413	Subwoofer de alto desempenho e resistente, concebido para agitar a sala. Se o seu evento precisa de graves profundos e físicos que definem os eventos de dança profissionais
cmk1e0n5e001atb4g5t045ubr	Mackie Thump 212 – 12" Professional High-Performance PA	Professional-grade loudspeaker designed for those who need high-intensity sound and absolute reliability. Built to deliver "big stage" sound in versatile 12-inch format	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	4	good	Warehouse B	/images/equipment-1767731647952-5a4hietu8.jpg	60	equipment	3	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.099	2026-01-06 20:34:07.957	Altifalante de nível profissional concebido para quem precisa de som de alta intensidade e fiabilidade absoluta. Construído para proporcionar um som de "grande palco" num formato versátil de 12 polegadas
cmk1e0n570018tb4gtoctaq22	Mackie Thump 215 – 15" High-Output Performance PA	Built for power. As the largest member of the legendary Thump series, this 15-inch loudspeaker is designed for events that demand high-impact bass and massive coverage	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	2	good	Warehouse B	/images/equipment-1767731647952-5a4hietu8.jpg	75	equipment	3	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.101	2026-01-06 22:06:49.131	Construído para potência. Sendo o maior membro da lendária série Thump, este altifalante de 15 polegadas foi concebido para eventos que exigem graves de grande impacto e uma cobertura maciça
cmk2u85k8000ncw5gg7qqxoy4	Showtec 50cm Professional Mirrorball – The Ultimate Stage Classic	The Showtec 50cm Mirrorball is the definitive tool for transforming any venue into a high-end dance floor. Designed for professional installations and large-scale events, its massive half-meter diameter ensures thousands of sharp, brilliant light reflections that fill every corner of the room. This is the heavy-duty choice for those who want the authentic, high-impact "Glitterbox" aesthetic with a build quality that meets strict professional safety standards.	cmk1e0n230003tb4gtbayc9jd	cmk1ra3xh000qtjeh69nb1iod	1	good	Warehouse A	/images/equipment-1767718957404-04ewbll5q.jpg	25	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 17:02:38.12	2026-01-06 17:02:38.12	O Showtec 50cm Mirrorball é a ferramenta definitiva para transformar qualquer local numa pista de dança de alta qualidade. Concebida para instalações profissionais e eventos de grande escala, o seu enorme diâmetro de meio metro garante milhares de reflexos de luz nítidos e brilhantes que preenchem todos os cantos da sala. Esta é a escolha ideal para quem pretende a estética autêntica e de grande impacto da "Glitterbox" com uma qualidade de construção que cumpre as rigorosas normas de segurança profissionais.
cmk2ufazg000xcw5glbrssj80	Sennheiser ew IEM G4 Twin – Professional Wireless In-Ear Monitoring	The Sennheiser G4 Twin is the ultimate professional solution for on-stage monitoring. This "Twin" set allows two performers to receive an independent, crystal-clear wireless feed from a single transmitter. By moving your monitoring to in-ears, you eliminate stage noise, prevent feedback, and ensure you hear every note with studio-grade precision, no matter how loud the rest of the band is.	cmk1e0n260004tb4g37154d95	cmk2ubkmf000pcw5g90hz31lj	2	good	Warehouse A	/images/equipment-1767719291176-8sadamqct.jpg	75	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 17:08:11.74	2026-01-06 17:08:11.74	O Sennheiser G4 Twin é a derradeira solução profissional para monitorização em palco. Este conjunto "Twin" permite que dois artistas recebam uma alimentação sem fios independente e cristalina a partir de um único transmissor. Ao transferir a monitorização para os intra-auriculares, elimina o ruído do palco, evita o feedback e garante que ouve cada nota com precisão de estúdio, independentemente do volume do resto da banda.
cmk2umxbf0015cw5g9wzc1nkj	Sennheiser e 604 – Professional 3-Pack Drum & Percussion Microphones	The Sennheiser e 604 is a professional-grade dynamic instrument microphone designed specifically for the high-intensity environment of a drum kit. Part of the legendary Evolution 600 series, this microphone has become the world standard for toms and snare drums. With the ability to handle extreme sound pressure levels and a design that clips directly onto the drum rim, the e 604 delivers a punchy, clear sound without the clutter of mic stands.	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	3	good	Warehouse A	/images/equipment-1767719704569-5xd92td6t.jpg	20	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 17:14:07.275	2026-01-06 17:15:04.572	O Sennheiser e 604 é um microfone de instrumento dinâmico de nível profissional concebido especificamente para o ambiente de alta intensidade de um kit de bateria. Parte da lendária série Evolution 600, este microfone tornou-se o padrão mundial para toms e caixas de bateria. Com a capacidade de suportar níveis de pressão sonora extremos e um design que se prende diretamente ao aro da bateria, o e 604 proporciona um som forte e nítido sem a confusão dos suportes de microfone.
cmk2u46ju000icw5gr2ziu0lk	Epson EB-L530U – High-Performance 5200 Lumens Laser Projector	The Epson EB-L530U is a professional-grade, high-brightness laser projector engineered for environments where image quality and reliability are non-negotiable. Delivering 5200 lumens of equal white and color brightness, this unit cuts through ambient light to produce stunningly sharp, vibrant images even in well-lit rooms. As a laser-source projector, it offers a "set it and forget it" level of reliability that traditional bulb projectors simply cannot match.	cmk2u2ind000ccw5gwp8sjln3	cmk2u2qjj000ecw5gonqu3cu9	1	good	Warehouse A	/images/equipment-1767730198067-0inqq5kf8.jpg	250	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:59:32.778	2026-01-06 20:09:58.074	O Epson EB-L530U é um projetor laser de alto brilho de nível profissional, concebido para ambientes onde a qualidade de imagem e a fiabilidade não são negociáveis. Com 5200 lúmenes de igual brilho branco e de cor, esta unidade atravessa a luz ambiente para produzir imagens incrivelmente nítidas e vibrantes, mesmo em salas bem iluminadas. Sendo um projetor de fonte laser, oferece um nível de fiabilidade do tipo "instalar e esquecer" que os projectores de lâmpada tradicionais simplesmente não conseguem igualar.
cmk2x4wsq001rcw5gx7hiq14d	Shure Beta 52A Dynamic Kick Drum Microphone	The Shure Beta 52A is a high-output supercardioid dynamic microphone tailored for low-frequency punch. It features a frequency response of 20Hz-10kHz, specifically designed for kick drums and bass amplifiers. With a maximum SPL of 174dB, it handles extreme volume without distortion.	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	1	good	Warehouse A	/images/equipment-1767723845143-hun4264n3.webp	20	equipment	3	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:24:05.642	2026-01-06 20:18:39.174	O Shure Beta 52A é um microfone dinâmico supercardióide de alta saída, concebido para uma potência de baixa frequência. Apresenta uma resposta de frequência de 20Hz-10kHz, especificamente concebida para kick drums e amplificadores de graves. Com um SPL máximo de 174dB, suporta volumes extremos sem distorção.
cmk1e0n30000gtb4g7rv7rb7x	FOS PAR ZOOM ULTRA	Professional Zoom Par, 19 leds x 15watt 4in1 RGBW color mixing, linear motorized zoom 10-60, 10 DMX Channels, 4 button led display, aluminum die cast housing, 0-100% linear dimmer, 6.5 kg	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2w000etb4gowy0l9bi	8	good	Warehouse A	/seeding-images/equipment-1767652845020-tomq0vl0o.jpg	35	equipment	2	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.071	2026-01-06 17:00:05.546	Zoom Par profissional, 19 leds x 15 watts, mistura de cores 4 em 1 RGBW, zoom linear motorizado 10-60, 10 canais DMX, ecrã de 4 botões LED, caixa em alumínio fundido, regulação linear 0-100%, 6,5 kg
cmk2wnqua0019cw5glo6dnmny	BSS Audio AR133	The BSS AR-133 is the ultimate workhorse of the professional audio industry. Whether in high-end recording studios or on the world’s biggest concert stages, this active DI box is the go-to solution for converting unbalanced signals (like guitars, basses, or keyboards) into a balanced, noise-free feed for your mixer. Known for its tank-like durability and pristine audio transparency, the AR-133 is an essential tool for any serious audio setup.	cmk1e0n260004tb4g37154d95	cmk2ubkmf000pcw5g90hz31lj	9	good	Warehouse A	/images/equipment-1767723044077-g6xn9s5e8.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:10:44.77	2026-01-06 18:10:44.77	O BSS AR-133 é o melhor cavalo de batalha da indústria de áudio profissional. Quer seja em estúdios de gravação topo de gama ou nos maiores palcos de concertos do mundo, esta caixa DI ativa é a solução ideal para converter sinais desequilibrados (como guitarras, baixos ou teclados) numa alimentação equilibrada e sem ruído para o seu misturador. Conhecida pela sua durabilidade semelhante à de um tanque e transparência de áudio cristalina, a AR-133 é uma ferramenta essencial para qualquer configuração de áudio séria.
cmk2xmmta001wcw5gq6hm5iwg	Sennheiser HT 747 Black Headset Microphone	The Sennheiser HT 747 is a high-performance supercardioid headset microphone designed for active users. It features a sweat-resistant construction and a secure dual-ear-hook design with an adjustable neckband. Technical specs include a 100Hz-15kHz frequency response and 125dB max SPL, ensuring clear speech while rejecting background noise. Ideal for fitness instructors, sports commentators, and high-movement stage performances requiring reliable, hands-free audio.	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	2	good	Warehouse A	/images/equipment-1767724671991-uwbfmve0u.jpg	25	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:37:52.51	2026-01-06 18:37:52.51	O Sennheiser HT 747 é um microfone de auricular supercardióide de alto desempenho concebido para utilizadores activos. Possui uma construção resistente ao suor e um design seguro de gancho duplo para o ouvido com uma banda de pescoço ajustável. As especificações técnicas incluem uma resposta de frequência de 100 Hz-15 kHz e um SPL máximo de 125 dB, garantindo um discurso claro e rejeitando o ruído de fundo. Ideal para instrutores de fitness, comentadores desportivos e actuações em palco de grande movimento que exijam áudio fiável e mãos-livres.
cmk2y38b2002hcw5gmkv9xf4u	Varytec VP-m20 Mobile Video BiLight PA	The Varytec VP-m20 is a compact 45W LED video panel featuring 300 SMD LEDs with a high CRI of 95 for natural color rendering. It offers a steplessly adjustable color temperature from 2850K to 5700K and a wide 120-degree beam angle. The integrated battery provides up to 7.5 hours of operation, making it ideal for mobile journalism, professional streaming, and on-location photography. Includes built-in barndoors and a USB port for charging external mobile devices.	cmk1e0n230003tb4gtbayc9jd	cmk1e0n3f000mtb4g4wo3p1kw	2	good	Warehouse A	/images/equipment-1767725446422-82blp7cdk.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:50:46.861	2026-01-06 18:50:46.861	O Varytec VP-m20 é um painel de vídeo LED compacto de 45 W com 300 LEDs SMD com um CRI elevado de 95 para uma reprodução de cor natural. Oferece uma temperatura de cor ajustável de 2850K a 5700K e um amplo ângulo de feixe de 120 graus. A bateria integrada proporciona até 7,5 horas de funcionamento, tornando-o ideal para jornalismo móvel, transmissão profissional e fotografia no local. Inclui barndoors incorporados e uma porta USB para carregar dispositivos móveis externos.
cmk2y5ofe002lcw5gdzjsf1k4	Stairville LED BossFX-1 Pro Bundle Complete	The Stairville LED BossFX-1 Pro is a versatile multi-effect lighting system including two RGBW LED spots, two derby effects, and four strobe LEDs. It features a built-in laser for extra visual impact. Technical specs include DMX-512 control, sound-to-light mode, and an integrated wireless footswitch. This complete bundle comes with a sturdy tripod and a transport bag. Perfect for mobile DJs, small bands, and private events in Lisbon venues.	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2w000etb4gowy0l9bi	1	good	Warehouse A	/images/equipment-1767725560625-m0b6lal65.jpg	45	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:52:41.066	2026-01-06 18:52:41.066	O Stairville LED BossFX-1 Pro é um sistema de iluminação multi-efeitos versátil que inclui dois spots LED RGBW, dois efeitos derby e quatro LEDs estroboscópicos. Inclui um laser incorporado para um impacto visual extra. As especificações técnicas incluem controlo DMX-512, modo de som para luz e um pedal sem fios integrado. Este conjunto completo inclui um tripé robusto e um saco de transporte. Perfeito para DJs móveis, pequenas bandas e eventos privados em locais de Lisboa.
cmk2ydtdv002wcw5gstwcmpu9	Deluxe Bubble Machine	The Deluxe Bubble Machine is a high-output effects unit featuring dual rotating wands for a continuous stream of large bubbles. It utilizes a heavy-duty motor housed in a durable metal casing with a built-in fan for effective bubble projection. With a 0.6-liter fluid tank and easy-to-use manual operation, it is designed for reliable performance.	cmk1e0n230003tb4gtbayc9jd	cmk1ra3xh000qtjeh69nb1iod	1	good	Warehouse A	/images/equipment-1767725940241-pzg7z0307.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:59:00.739	2026-01-06 18:59:00.739	A Deluxe Bubble Machine é uma unidade de efeitos de alto rendimento com duas varinhas rotativas para um fluxo contínuo de grandes bolhas. Utiliza um motor de alta resistência alojado numa caixa de metal durável com uma ventoinha incorporada para uma projeção eficaz das bolhas. Com um depósito de fluido de 0,6 litros e um funcionamento manual fácil de utilizar, foi concebido para um desempenho fiável.
cmk31jx8y0069cw5gqgp3x3k3	Custom 32A  Power Distributor (Modified)	It features a 32A CEE 5-pin input for high-capacity power handling, delivering energy through four standard 16A Schuko outlets and two IEC C13 ports. Housed in a durable, impact-resistant ABS casing with an IP44 protection rating, the unit includes an integrated circuit breaker to ensure safe operation. It is an essential tool for providing localized power drops to stage equipment and production desks.	cmk2xt5s50023cw5g2242d74c	cmk3062bl005fcw5g359snsxf	0	good	Warehouse A	/images/equipment-1767731263992-ey9ca664y.png	0	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 20:27:44.529	2026-01-06 20:27:44.529	Possui uma entrada de 32A CEE de 5 pinos para uma elevada capacidade de manuseamento de energia, fornecendo energia através de quatro tomadas Schuko de 16A padrão e duas portas IEC C13. Alojada numa caixa de ABS durável e resistente a impactos com uma classificação de proteção IP44, a unidade inclui um disjuntor integrado para garantir um funcionamento seguro. É uma ferramenta essencial para fornecer quedas de energia localizadas a equipamentos de palco e mesas de produção.
cmk2ucipu000tcw5ge9ooxnrg	Sennheiser EW-D – Pro Digital Wireless 	The Sennheiser EW-D is the "gold standard" of wireless technology. If you are a musician, a speaker, or an event organizer who cannot afford a single second of static or signal drop-outs, this is the system you rent. It is a digital system, meaning it works more like a secure Wi-Fi connection than an old-fashioned radio, resulting in a sound that is as clear as a high-quality cable.	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	2	good	Warehouse A	/images/equipment-1767719161232-niiz3gtsg.jpg	60	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 17:06:01.794	2026-01-06 17:11:12.26	O Sennheiser EW-D é o "padrão de ouro" da tecnologia sem fios. Se é um músico, um orador ou um organizador de eventos que não se pode dar ao luxo de ter um único segundo de estática ou de falhas de sinal, este é o sistema que deve alugar. É um sistema digital, o que significa que funciona mais como uma ligação Wi-Fi segura do que como um rádio à moda antiga, resultando num som tão nítido como um cabo de alta qualidade.
cmk2wrct6001dcw5gl78mgwlg	sE Electronics sE8 Stereo Set – Professional Matched Pair Condenser Microphones	A professional matched pair of small-diaphragm condensers for perfect stereo imaging. Handcrafted with gold-sputtered capsules, these mics deliver studio-grade transparency and a smooth high-end. Ideal for acoustic guitars, pianos, and drum overheads. Features switchable pads and low-cut filters to handle any volume.	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	1	good	Warehouse A	/images/equipment-1767723212708-n6iimqnfa.jpg	30	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:13:33.21	2026-01-06 18:13:33.21	Um par profissional de condensadores de diafragma pequeno para uma imagem estéreo perfeita. Fabricados artesanalmente com cápsulas com pulverização de ouro, estes microfones proporcionam transparência de nível de estúdio e um som de alta qualidade suave. Ideal para guitarras acústicas, pianos e overheads de bateria. Inclui pads comutáveis e filtros de corte baixo para lidar com qualquer volume.
cmk2uiy4a0011cw5g38yld7kw	Sennheiser XSW 2-835 (A-Band) – Professional Wireless Vocal System	The Sennheiser XSW 2-835 is a high-performance wireless system built for performers who demand professional reliability and a powerful "front-of-house" sound. Featuring the legendary Evolution 835 dynamic capsule, this microphone is engineered to cut through loud stages and high-pressure environments, ensuring your voice remains clear, warm, and prominent in the mix.	cmk1e0n260004tb4g37154d95	cmk1e0n5v001itb4g5o2ie47u	2	good	Warehouse A	/images/equipment-1767719461085-dzicscjph.jpg	40	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 17:11:01.69	2026-01-06 17:11:01.69	O XSW 2-835 da Sennheiser é um sistema sem fios de alto desempenho concebido para artistas que exigem fiabilidade profissional e um som potente na "frente da casa". Com a lendária cápsula dinâmica Evolution 835, este microfone foi concebido para atravessar palcos ruidosos e ambientes de alta pressão, assegurando que a sua voz permanece clara, quente e proeminente na mistura.
cmk2x0fma001jcw5g9u7udc4v	Allen & Heath CQ-18T 18-Channel Digital Mixer	The Allen & Heath CQ-18T is an ultra-compact 96kHz digital mixer designed for bands, producers, and AV rentals. It features 16 high-quality mic preamps, a 7” capacitive touchscreen, and built-in Dual-Band Wi-Fi for seamless app control. With smart tools like Gain Assistant and Feedback Assistant, it simplifies complex mixing tasks. It also supports multitrack recording via SD card or USB, making it a versatile powerhouse for live sound and studio applications in a portable format.	cmk1e0n260004tb4g37154d95	cmk2wxsub001fcw5gcpkpmxpz	0	good	Warehouse A	/images/equipment-1767723636172-17chqi2sw.jpg	85	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:20:36.754	2026-01-06 18:20:36.754	O Allen & Heath CQ-18T é um misturador digital ultracompacto de 96kHz concebido para bandas, produtores e alugueres de AV. Possui 16 pré-amplificadores de microfone de alta qualidade, um ecrã tátil capacitivo de 7" e Wi-Fi de banda dupla incorporado para um controlo de aplicações sem falhas. Com ferramentas inteligentes como o Gain Assistant e o Feedback Assistant, simplifica tarefas de mistura complexas. Também suporta gravação multipista através de cartão SD ou USB, o que o torna uma potência versátil para aplicações de som ao vivo e de estúdio num formato portátil.
cmk2x39p0001ncw5gq1yjj4p0	Chauvet DJ EZpin Zoom Pack (4 Battery-Powered Pinspots)	The EZpin Zoom Pack is a versatile lighting kit featuring four battery-operated LED pinspots, ideal for highlighting centerpieces or architectural details. Each fixture includes a manual zoom for precise beam control and a magnetic base for easy attachment to metal surfaces. The pack includes a dedicated carrying bag and an IRC-6 remote, allowing for effortless wireless operation. Perfect for weddings and corporate events in Lisbon where cable-free, discreet lighting is required.	cmk1e0n230003tb4gtbayc9jd	cmk1e0n3f000mtb4g4wo3p1kw	1	good	Warehouse A	/images/equipment-1767723768626-02ifemf9j.jpg	65	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:22:49.044	2026-01-06 18:22:49.044	O EZpin Zoom Pack é um kit de iluminação versátil que inclui quatro pinspots LED a pilhas, ideais para realçar peças centrais ou detalhes arquitectónicos. Cada luminária inclui um zoom manual para um controlo preciso do feixe e uma base magnética para fácil fixação a superfícies metálicas. O pacote inclui um saco de transporte dedicado e um controlo remoto IRC-6, permitindo uma operação sem fios sem esforço. Perfeito para casamentos e eventos empresariais em Lisboa, onde é necessária uma iluminação discreta e sem cabos.
cmk2xq3nj0022cw5g47nd8irb	Stairville FS-x150 LED Follow Spot	Professional LED follow spot featuring a 150W cool white LED source. It offers a 10° beam angle ideal for distances up to 15 meters, with a 5-color wheel and stepless iris control. Supports DMX and manual operation with adjustable dimming curves and electronic shutter. Perfect for theaters, small concerts, and school auditorium events.	cmk1e0n230003tb4gtbayc9jd	cmk2xpun6001ycw5gbbd6i2bz	1	good	Warehouse A	/images/equipment-1767724833758-qm46q31oe.jpg	45	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:40:34.303	2026-01-06 18:40:34.303	Refletor LED profissional com uma fonte LED branca fria de 150 W. Oferece um ângulo de feixe de 10° ideal para distâncias até 15 metros, com uma roda de 5 cores e controlo de íris contínuo. Suporta DMX e funcionamento manual com curvas de regulação ajustáveis e obturador eletrónico. Perfeito para teatros, pequenos concertos e eventos em auditórios de escolas.
cmk2y0em9002dcw5ga6b63e96	Yamaha MG16XU 16-Channel Analog Mixer	The Yamaha MG16XU is a versatile 16-channel analog mixing console featuring 10 studio-grade "D-PRE" discrete class-A mic preamps. It includes a built-in SPX digital effects processor with 24 programs and a 24-bit/192kHz USB audio interface for seamless recording. With 1-knob compressors and a rugged metal chassis, it is ideal for live bands, corporate events, and theater productions requiring transparent sound and reliable dynamics control.	cmk1e0n260004tb4g37154d95	cmk2wxsub001fcw5gcpkpmxpz	1	good	Warehouse A	/images/equipment-1767725314622-lxldlp09l.jpg	40	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:48:35.073	2026-01-06 18:48:35.073	A Yamaha MG16XU é uma versátil consola de mistura analógica de 16 canais com 10 pré-amplificadores de microfone discretos classe A "D-PRE" de qualidade de estúdio. Inclui um processador de efeitos digitais SPX incorporado com 24 programas e uma interface de áudio USB de 24 bits/192 kHz para uma gravação perfeita. Com compressores de 1 botão e um chassis metálico robusto, é ideal para bandas ao vivo, eventos empresariais e produções teatrais que exijam um som transparente e um controlo de dinâmica fiável.
cmk2ybpar002scw5gzvkzclo8	Equation 330W Industrial Floor Drum Fan (60cm)	High-performance industrial drum fan featuring a robust 330W motor and a 60cm diameter. It offers two speed settings for adjustable airflow and a tiltable head for precise direction. Technical specs include an 85dB noise level, steel construction, and integrated wheels for easy mobility. Ideal for cooling stages, drying outdoor event surfaces, and improving ventilation in warehouse venues or temporary festival marquees.	cmk2yahn1002mcw5gvbcgkszj	cmk2yav4d002ocw5g7jyebitz	1	good	Warehouse A	/images/equipment-1767725841712-ugyud7rwy.jpeg	20	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:57:22.131	2026-01-06 18:57:22.131	Ventilador de tambor industrial de elevado desempenho, com um motor robusto de 330 W e um diâmetro de 60 cm. Oferece duas definições de velocidade para um fluxo de ar ajustável e uma cabeça inclinável para uma direção precisa. As especificações técnicas incluem um nível de ruído de 85dB, construção em aço e rodas integradas para uma fácil mobilidade. Ideal para arrefecer palcos, secar superfícies de eventos ao ar livre e melhorar a ventilação em armazéns ou tendas de festivais temporários.
cmk2yhxxj0033cw5gde4tj1nh	Stairville Tour Stage Platform 2x1m ODW	Professional heavy-duty stage platform measuring 200x100cm, built with a lightweight aluminum frame and a weatherproof plywood surface. It features a HEXA anti-slip coating and a massive load capacity of 750kg/m². Designed for both indoor and outdoor use, its ergonomic profile allows for rapid assembly using standard 60x60mm legs. Perfect for festival stages, corporate risers, drum platforms, and catwalks in professional venues.	cmk1e0n230003tb4gtbayc9jd	cmk2yguod002zcw5gazl94gfi	12	good	Warehouse A	/images/equipment-1767726132834-p25yooegg.jpg	25	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:02:13.254	2026-01-06 19:02:13.254	Plataforma de palco profissional para trabalhos pesados com 200x100cm, construída com uma estrutura de alumínio leve e uma superfície de contraplacado resistente às intempéries. Possui um revestimento antiderrapante HEXA e uma enorme capacidade de carga de 750 kg/m². Concebida para utilização no interior e no exterior, o seu perfil ergonómico permite uma montagem rápida utilizando pernas normais de 60x60 mm. Perfeita para palcos de festivais, plataformas de empresas, plataformas de bateria e passadiços em locais profissionais.
cmk2ynljn003dcw5gvcx7adg4	Pioneer DJ CDJ-3000 Professional Multi Player	The Pioneer CDJ-3000 is a professional flagship multi-player powered by a state-of-the-art MPU for advanced performance and stability. It features a 9-inch high-resolution touch screen, eight dedicated Hot Cue buttons, and a redesigned mechanical jog wheel for ultra-smooth scratching. With 96kHz/32-bit audio processing and Pro DJ Link with Gigabit Ethernet, it is the global industry standard for festival stages, nightclubs, and high-end corporate events.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	4	good	Warehouse A	/images/equipment-1767726396715-qpu48vri9.jpg	100	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:06:37.139	2026-01-06 19:06:37.139	O CDJ-3000 da Pioneer é um leitor multileitor profissional de topo, equipado com uma MPU de última geração para um desempenho e estabilidade avançados. Possui um ecrã tátil de alta resolução de 9 polegadas, oito botões Hot Cue dedicados e um jog wheel mecânico redesenhado para um scratching ultra-suave. Com processamento de áudio de 96kHz/32-bit e Pro DJ Link com Gigabit Ethernet, é o padrão global da indústria para palcos de festivais, clubes noturnos e eventos empresariais de alta qualidade.
cmk2yptia003hcw5g6yj1adjp	Pioneer DJ DJM-V10-LF Professional 6-Channel Mixer	The DJM-V10-LF is a 6-channel professional mixer featuring 60mm long-throw faders for precise volume control. It boasts studio-quality 64-bit processing, 32-bit AD/DA converters, and a 4-band EQ on every channel. With a dedicated compressor, expanded send/return section, and 3-band master isolator, it delivers elite sound quality. Dual headphone outputs and a booth EQ make it the ultimate choice for complex festival setups and high-end club performances in Lisbon.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	1	good	Warehouse A	/images/equipment-1767726500168-9d7keduzl.jpg	150	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:08:20.768	2026-01-06 19:08:20.768	A DJM-V10-LF é uma mesa de mistura profissional de 6 canais com faders de longo alcance de 60 mm para um controlo preciso do volume. Possui processamento de 64-bit com qualidade de estúdio, conversores AD/DA de 32-bit e um EQ de 4 bandas em cada canal. Com um compressor dedicado, uma secção de envio/retorno expandida e um isolador principal de 3 bandas, proporciona uma qualidade de som de elite. Saídas duplas para auscultadores e um equalizador de cabine fazem dele a melhor escolha para configurações complexas de festivais e actuações em clubes de topo em Lisboa.
cmk2zbqg90045cw5gidb6ou9i	Mini LED Moving Head Spot 25W	Ultra-compact 25W LED moving head spotlight designed for dynamic event lighting. Features 7 patterns (gobos) and 7 vibrant colors plus white, with high-speed pan and tilt movements. Operating modes include DMX512 control, sound-activated, and automatic programs. Its lightweight, portable design makes it perfect for mobile DJ booths, small stages, and private parties looking for professional club-style effects in a compact format	cmk1e0n230003tb4gtbayc9jd	cmk1e0n2a0006tb4gfvum37v3	2	good	Warehouse A	/images/equipment-1767727522753-rl2wozqhe.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:25:23.24	2026-01-06 19:25:23.24	Projetor de cabeça móvel LED ultra-compacto de 25 W concebido para iluminação dinâmica de eventos. Inclui 7 padrões (gobos) e 7 cores vibrantes mais branco, com movimentos de rotação e inclinação de alta velocidade. Os modos de funcionamento incluem controlo DMX512, ativação por som e programas automáticos. O seu design leve e portátil torna-o perfeito para cabinas de DJ móveis, pequenos palcos e festas privadas que procuram efeitos profissionais de estilo de clube num formato compacto
cmk2z5gsj003xcw5gzxv14a5h	Technics SL-1200 MK2 Direct-Drive Turntable	The world’s most iconic analog DJ turntable. Renowned for its heavy-duty construction and vibration-resistant rubber base, it features a high-torque direct-drive motor that reaches full speed in 0.7s. Includes quartz-locked continuous pitch control (±8%) and a highly sensitive S-shaped tonearm. Built for absolute precision and durability, it remains the primary choice for professional vinyl DJs and high-end club setups globally.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	2	good	Warehouse A	/images/equipment-1767727230221-ew0j7mqa4.jpg	60	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:20:30.786	2026-01-06 20:19:32.888	O gira-discos analógico para DJ mais icónico do mundo. Reconhecido pela sua construção robusta e base de borracha resistente a vibrações, possui um motor de acionamento direto de binário elevado que atinge a velocidade máxima em 0,7s. Inclui controlo de pitch contínuo bloqueado por quartzo (±8%) e um braço em forma de S altamente sensível. Construído para uma precisão e durabilidade absolutas, continua a ser a principal escolha para DJs profissionais de vinil e configurações de discotecas topo de gama em todo o mundo.
cmk2yljqx0037cw5gystjn9ij	Albrecht Tectalk Worker 3 Wireless Intercom Set (4-Way)	Professional PMR446 radio set featuring four robust handheld units designed for event coordination. These radios offer 16 channels, hands-free VOX functionality, and a high-capacity 1200mAh battery for 14-hour shifts. The set includes a multi-charger station and four security-style headsets with integrated microphones. Housed in a heavy-duty hardshell transport case, this system ensures reliable, interference-free communication across large venues, festival sites, and production teams.	cmk1e0n260004tb4g37154d95	cmk2ubkmf000pcw5g90hz31lj	1	good	Warehouse A	/images/equipment-1767726301040-jqxnwdd3m.jpg	25	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:05:01.497	2026-01-06 19:05:01.497	Conjunto de rádios profissionais PMR446 com quatro unidades portáteis robustas concebidas para a coordenação de eventos. Estes rádios oferecem 16 canais, funcionalidade VOX mãos-livres e uma bateria de 1200mAh de elevada capacidade para turnos de 14 horas. O conjunto inclui uma estação de carregamento múltiplo e quatro auriculares de segurança com microfones integrados. Alojado numa mala de transporte rígida e resistente, este sistema assegura uma comunicação fiável e sem interferências em grandes recintos, locais de festivais e equipas de produção.
cmk2ysdvr003lcw5g189invzn	Pioneer DJ XDJ-RX3 All-In-One DJ System	The Pioneer XDJ-RX3 is a professional 2-channel all-in-one DJ system featuring a 10.1-inch high-resolution touchscreen. It inherits its layout and performance features from the club-standard CDJ-3000 and DJM-900NXS2, including 14 Beat FX and 6 Sound Color FX. Supporting rekordbox and Serato DJ Pro, it offers an enhanced GUI for faster browsing and smooth waveforms. Ideal for mobile DJs, corporate events, and wedding receptions.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	1	good	Warehouse A	/images/equipment-1767726619867-qm3uxznua.png	100	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:10:20.484	2026-01-06 19:10:20.484	O Pioneer XDJ-RX3 é um sistema profissional de DJ tudo-em-um de 2 canais com um ecrã tátil de alta resolução de 10,1 polegadas. Herda o seu layout e caraterísticas de desempenho do CDJ-3000 e da DJM-900NXS2, padrão de clube, incluindo 14 Beat FX e 6 Sound Color FX. Compatível com o rekordbox e o Serato DJ Pro, oferece uma GUI melhorada para uma navegação mais rápida e formas de onda suaves. Ideal para DJs móveis, eventos empresariais e recepções de casamento.
cmk2yz93t003tcw5gytrhmfpv	Allen and Heath Xone:23 	A high-performance 2-channel analog mixer featuring the legendary Xone filter system with voltage-controlled resonance. It offers 2+2 channels with dual phono/line inputs, 3-band total kill EQ, and a professional FX loop. Its robust build and balanced XLR outputs deliver studio-quality audio in a compact frame. Ideal for small club setups, vinyl enthusiasts, and high-end private events requiring the signature warm analog sound.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	1	good	Warehouse A	/images/equipment-1767726940362-d3fdymazt.jpg	50	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:15:40.888	2026-01-06 19:15:40.888	Uma mesa de mistura analógica de 2 canais de alto desempenho que inclui o lendário sistema de filtros Xone com ressonância controlada por tensão. Oferece 2+2 canais com entradas duplas de fono/linha, equalização total de 3 bandas e um loop FX profissional. A sua construção robusta e as saídas XLR equilibradas proporcionam áudio com qualidade de estúdio numa estrutura compacta. Ideal para pequenos clubes, entusiastas do vinil e eventos privados de alta qualidade que requerem o som analógico quente caraterístico.
cmk2z91i70041cw5gcmovaham	ADAM Audio A7X Active Studio Monitor	High-performance active monitor ideal for event production, VIP lounges, and backstage monitoring. Featuring the precision X-ART tweeter and a 7" woofer, it delivers transparent, fatigue-free sound even during long shifts. Its compact design and front-panel power/volume controls make it perfect for temporary setups in warehouses or corporate Green Rooms. Reliable XLR/RCA inputs ensure quick integration into professional AV racks or mobile DJ booths.	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	2	good	Warehouse A	/images/equipment-1767727397136-sohalsbe7.jpg	50	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:23:17.596	2026-01-06 19:23:17.596	Monitor ativo de elevado desempenho ideal para produção de eventos, salas VIP e monitorização de bastidores. Com o tweeter de precisão X-ART e um woofer de 7", proporciona um som transparente e sem fadiga, mesmo durante turnos longos. O seu design compacto e os controlos de potência/volume no painel frontal tornam-no perfeito para configurações temporárias em armazéns ou salas verdes de empresas. As fiáveis entradas XLR/RCA garantem uma rápida integração em racks AV profissionais ou cabines de DJ móveis.
cmk2ziybe004fcw5gk1cln47p	ChamSys MagicQ Compact Connect USB Controller	he MagicQ Compact Connect is a lightweight, professional USB control surface that transforms any PC or Mac into a powerful lighting station. It features 10 playback faders, 8 attribute encoders, and 2 direct DMX outputs. Supporting 64 universes via its onboard network port, it offers tactile control for lighting, media, and LEDs. Small enough for hand luggage, it includes an internal USB hub and audio input, making it the ultimate tool for touring designers and mobile productions.	cmk1e0n230003tb4gtbayc9jd	cmk2zfbje0047cw5gihy6kc4h	1	good	Warehouse A	/images/equipment-1767727859432-ttpepgiuz.png	250	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:31:00.026	2026-01-06 19:31:00.026	MagicQ Compact Connect é uma superfície de controlo USB leve e profissional que transforma qualquer PC ou Mac numa poderosa estação de iluminação. Possui 10 faders de reprodução, 8 codificadores de atributos e 2 saídas DMX diretas. Suportando 64 universos através da sua porta de rede integrada, oferece controlo tátil para iluminação, meios de comunicação e LEDs. Suficientemente pequeno para levar na bagagem de mão, inclui um hub USB interno e uma entrada de áudio, o que o torna a ferramenta ideal para designers em digressão e produções móveis.
cmk2zmtp7004lcw5g4v3j31nk	Stageworx Cable Bridge 2MC	The Stageworx Cable Bridge 2MC is a heavy-duty, two-channel protector designed for high-traffic event environments. Featuring a high-visibility yellow hinged lid, it supports a maximum load of 3 tonnes, making it suitable for both pedestrian and light vehicle traffic. Each channel measures 3.2 x 3.2 cm, comfortably housing power and signal cables. This durable bridge ensures site safety and cable integrity during concerts, trade shows, and outdoor corporate events.	cmk2yg76g002xcw5gs5phwj4g	cmk2zm9g4004hcw5g0hmjrt3d	12	good	Warehouse A	/images/equipment-1767728040013-905dct48g.jpg	10	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:34:00.666	2026-01-06 19:34:00.666	A ponte de cabos Stageworx 2MC é um protetor de dois canais para trabalhos pesados, concebido para ambientes de eventos com muito tráfego. Com uma tampa articulada amarela de alta visibilidade, suporta uma carga máxima de 3 toneladas, o que a torna adequada tanto para o tráfego de peões como de veículos ligeiros. Cada canal mede 3,2 x 3,2 cm, albergando confortavelmente cabos de alimentação e de sinal. Esta ponte duradoura garante a segurança do local e a integridade dos cabos durante concertos, feiras comerciais e eventos empresariais ao ar livre.
cmk2zsxr2004vcw5gxpz4yjv1	Zoom H5 Handy Recorder	The Zoom H5 is a versatile portable digital recorder featuring an interchangeable capsule system and four tracks of simultaneous recording. It comes standard with the XYH-5 X/Y microphone capsule, designed to handle up to 140 dB SPL for distortion-free audio. 	cmk1e0n260004tb4g37154d95	cmk2zsbnb004rcw5gpo2fybt8	1	good	Warehouse A	/images/equipment-1767728325380-us7yb08bz.jpg	40	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:38:45.854	2026-01-06 19:38:45.854	O Zoom H5 é um gravador digital portátil versátil que inclui um sistema de cápsulas intercambiáveis e quatro pistas de gravação simultânea. É fornecido de série com a cápsula de microfone XYH-5 X/Y, concebida para suportar até 140 dB SPL para um áudio sem distorção.
cmk3007u20059cw5gndf55q8d	Eurolite RF-300 Radial Wind Machine	The Eurolite RF-300 is a powerful and quiet radial blower designed for creating focused air effects on stage and in studio environments. It features a sturdy, road-ready plastic housing with a built-in handle for easy transport. The air discharge angle is adjustable (0° or 45°) by repositioning the housing, and the unit delivers a maximum airflow of 510 m³/h. Compact and efficient, it is ideal for fashion shoots, theaters, and exhibitions requiring plug-and-play operation.	cmk1e0n230003tb4gtbayc9jd	cmk1ra3xh000qtjeh69nb1iod	1	good	Warehouse A	/images/equipment-1767728665084-23eodp0fc.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:44:25.514	2026-01-06 19:44:25.514	O Eurolite RF-300 é um potente e silencioso soprador radial concebido para criar efeitos de ar focados no palco e em ambientes de estúdio. Possui uma caixa de plástico robusta, preparada para a estrada, com uma pega incorporada para facilitar o transporte. O ângulo de descarga de ar é ajustável (0° ou 45°) através do reposicionamento da caixa, e a unidade fornece um caudal de ar máximo de 510 m³/h. Compacta e eficiente, é ideal para sessões fotográficas de moda, teatros e exposições que requerem um funcionamento "plug-and-play".
cmk3070ja005jcw5gjjakzrmp	Botex Power Splitter 32A CEE to Schuko/CEE Distribution Box	The Botex Power Splitter 32 is a rugged 32A CEE three-phase power distributor designed for reliable stage and truss integration. It features a 32A CEE input and output (loop-through) and distributes power to six Schuko (230V) outlets. 	cmk2xt5s50023cw5g2242d74c	cmk3062bl005fcw5g359snsxf	1	good	Warehouse A	/images/equipment-1767728982139-050kjnqmw.jpg	20	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:49:42.646	2026-01-06 19:49:42.646	O Botex Power Splitter 32 é um distribuidor de energia trifásico CEE de 32A robusto, concebido para uma integração fiável em palcos e estruturas. Possui uma entrada e saída CEE de 32A (loop-through) e distribui energia para seis tomadas Schuko (230V).
cmk308q32005ncw5gv7rwx1zo	 Global Truss CC50403 Base Plate Steel 600mm	The Global Truss CC50403 is a sleek, black powder-coated steel base plate measuring 600x600x5mm. Weighing approximately 13kg, it provides a stable and discreet foundation for pipe-and-drape systems or lightweight vertical truss totems. Its low-profile design is perfect for high-end events where safety and aesthetics are paramount, offering multiple mounting points for F22 through F34 truss systems and telescopic uprights.	cmk2yg76g002xcw5gs5phwj4g	cmk2zuebl004xcw5gs501q7p4	4	good	Warehouse A	/images/equipment-1767729061809-8jbq1v0j2.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:51:02.413	2026-01-06 19:51:02.413	A Global Truss CC50403 é uma placa de base de aço elegante, revestida a pó preto, que mede 600x600x5mm. Com um peso aproximado de 13 kg, proporciona uma base estável e discreta para sistemas de tubos e cordas ou totens de treliça verticais leves. O seu design de baixo perfil é perfeito para eventos de alta qualidade em que a segurança e a estética são fundamentais, oferecendo vários pontos de montagem para sistemas de treliça F22 a F34 e montantes telescópicos.
cmk2zoyuz004pcw5gzjf3r2wh	Stageworx Cable Bridge 1S	The Stageworx Cable Bridge 1S is an ultra-slim, professional cable protector designed for indoor use and light pedestrian traffic. It features a single 10 x 48 mm channel, perfect for discreetly managing power leads or XLR signal cables. With a load capacity of 200 kg and a total length of 90 cm, this non-slip bridge prevents tripping hazards while maintaining a low profile. Its lightweight 1.4 kg construction allows for rapid deployment and easy transport for small events and gallery spaces.	cmk2yg76g002xcw5gs5phwj4g	cmk2zm9g4004hcw5g0hmjrt3d	12	good	Warehouse A	/images/equipment-1767728140164-f0cog3gjv.jpg	8	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:35:40.665	2026-01-06 19:35:40.665	O Stageworx Cable Bridge 1S é um protetor de cabos profissional ultrafino, concebido para utilização em interiores e tráfego pedonal ligeiro. Possui um único canal de 10 x 48 mm, perfeito para gerir discretamente cabos de alimentação ou cabos de sinal XLR. Com uma capacidade de carga de 200 kg e um comprimento total de 90 cm, esta ponte antiderrapante evita os riscos de tropeçar, mantendo um perfil baixo. A sua construção leve de 1,4 kg permite uma utilização rápida e um transporte fácil para pequenos eventos e espaços de galeria.
cmk2zv5y60051cw5gm6vusmve	Global Truss F34200-B Truss 2,0m Black	The Global Truss F34200-B is a professional 4-point square truss section with a sleek black powder-coated finish. This 2-meter straight segment features a 29 cm edge dimension, 50 mm main pipes, and 2 mm wall thickness. Designed for high visibility and aesthetic integration, it is TÜV certified for safety and includes conical connectors for rapid, secure assembly. It is ideal for corporate events, exhibitions, and stage designs requiring a premium, non-reflective look.	cmk2yg76g002xcw5gs5phwj4g	cmk2zuebl004xcw5gs501q7p4	6	good	Warehouse A	/images/equipment-1767728429078-jcvo3dzh1.jpg	25	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:40:29.79	2026-01-06 19:40:29.79	A Global Truss F34200-B é uma secção de treliça quadrada profissional de 4 pontos com um elegante acabamento revestido a pó preto. Este segmento reto de 2 metros apresenta uma dimensão de borda de 29 cm, tubos principais de 50 mm e espessura de parede de 2 mm. Concebida para uma elevada visibilidade e integração estética, possui certificação TÜV para segurança e inclui conectores cónicos para uma montagem rápida e segura. É ideal para eventos empresariais, exposições e projectos de palcos que exijam um aspeto de qualidade superior e não refletor.
cmk2zy3p10055cw5gjq6mz7hi	Global Truss 27195 Baseplate Multi 80x80cm	The Global Truss 27195 is a heavy-duty, multi-purpose steel baseplate designed for maximum stability of vertical truss columns. Weighing 36kg, this 80x80cm plate provides a low center of gravity for "totem" configurations. It features a versatile hole pattern compatible with Global Truss F23, F24, F33, and F34 systems. The black powder-coated finish ensures a professional, discreet appearance, while rounded corners enhance safety and ease of handling during load-ins.	cmk2yg76g002xcw5gs5phwj4g	cmk2zuebl004xcw5gs501q7p4	2	good	Warehouse A	/images/equipment-1767728566434-9786s18xh.jpg	10	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:42:46.837	2026-01-06 19:42:46.837	A Global Truss 27195 é uma placa de base em aço para trabalhos pesados e polivalentes, concebida para a máxima estabilidade de colunas de treliça verticais. Pesando 36 kg, esta placa de 80x80 cm proporciona um centro de gravidade baixo para configurações de "totem". Apresenta um padrão de orifícios versátil compatível com os sistemas Global Truss F23, F24, F33 e F34. O acabamento revestido a pó preto garante uma aparência profissional e discreta, enquanto os cantos arredondados aumentam a segurança e a facilidade de manuseamento durante as cargas.
cmk3032mi005dcw5g4cvlohkc	Global Truss F34C21-B 90° Corner Black	The Global Truss F34C21-B is a professional 2-way 90-degree corner designed for the F34 square truss system. This 0.5-meter segment features a high-durability black powder-coated finish, specifically engineered for seamless architectural integration. Constructed from 50 mm main tubes with a 2 mm wall thickness, it includes all necessary conical connectors for a secure, load-bearing fit. It is the perfect solution for creating sleek, non-reflective truss boxes and stage frames.	cmk2yg76g002xcw5gs5phwj4g	cmk2zuebl004xcw5gs501q7p4	2	good	Warehouse A	/images/equipment-1767728798225-3zn718omf.jpg	15	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:46:38.729	2026-01-06 19:46:38.729	O Global Truss F34C21-B é um canto profissional de 90 graus de 2 vias concebido para o sistema de treliça quadrada F34. Este segmento de 0,5 metros apresenta um acabamento revestido a pó preto de alta durabilidade, especificamente concebido para uma integração arquitetónica perfeita. Construído a partir de tubos principais de 50 mm com uma espessura de parede de 2 mm, inclui todos os conectores cónicos necessários para um encaixe seguro e de suporte de carga. É a solução perfeita para criar caixas de treliça e estruturas de palco elegantes e não reflectoras.
cmk30aj41005rcw5g6vz94vgn	PCE Merz M-SVE3 63/121-9 Power Distributor	PCE Merz M-SVE3 63/121-9 Power Distributot features a 63A CEE input and provides a comprehensive range of outputs: 1x CEE 63A, 2x CEE 32A, 1x CEE 16A, and 9x Schuko sockets. Equipped with dual 63A/0.03A RCDs and individual circuit breakers for all ports, this IP44-rated unit ensures maximum safety and high-load capacity for professional stage, event, and industrial power management.	cmk2xt5s50023cw5g2242d74c	cmk3062bl005fcw5g359snsxf	1	good	Warehouse A	/images/equipment-1767729145962-ltek6fq5a.jpg	50	equipment	1	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:52:26.689	2026-01-06 19:52:26.689	O distribuidor de energia PCE Merz M-SVE3 63/121-9 possui uma entrada CEE 63A e fornece uma gama abrangente de saídas: 1x CEE 63A, 2x CEE 32A, 1x CEE 16A, e 9x tomadas Schuko. Equipada com dois RCDs de 63A/0,03A e disjuntores individuais para todas as portas, esta unidade com classificação IP44 garante a máxima segurança e uma elevada capacidade de carga para gestão profissional de energia em palcos, eventos e indústria.
cmk2ywvbj003pcw5g88a5boe9	Allen & Heath Xone:92 Limited Edition (20th Anniversary)	The Xone:92 Limited Edition is a premium 6-channel analog mixer celebrating two decades of the industry-standard "92" sound. This collector’s version features a retro silver top plate, updated RIAA phono preamps specifically tuned for electronic vinyl, and a custom mini innoFADER Pro for superior handling. It retains the legendary dual VCF filters (now with silent switching) and the iconic 4-band "total kill" EQ. With only 920 units produced worldwide.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	1	good	Warehouse A	/images/equipment-1767726829084-or1p4q885.jpg	120	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:13:49.71	2026-01-06 20:06:35.621	A Xone:92 Limited Edition é uma mesa de mistura analógica de 6 canais de qualidade superior que celebra duas décadas do som "92" padrão da indústria. Esta versão de colecionador apresenta uma placa superior prateada retro, pré-amplificadores fono RIAA actualizados, especificamente sintonizados para vinil eletrónico, e um mini innoFADER Pro personalizado para um manuseamento superior. Mantém os lendários filtros VCF duplos (agora com comutação silenciosa) e o icónico equalizador de 4 bandas "total kill". Com apenas 920 unidades produzidas em todo o mundo.
cmk2xxr6w0029cw5g6kr0ovvn	Extension Cable CEE 32A 5-Pin - 50m 	Professional 50-meter power extension featuring high-quality CEE 32A 5-pin male and female connectors. Built with heavy-duty H07RN-F 5G2.5 cable, it is designed for extreme mechanical stress and outdoor use (IP44). Provides reliable three-phase power distribution for lighting rigs, sound systems, and industrial machinery. Essential for large-scale events requiring long-distance power runs without significant voltage drop.	cmk2xt5s50023cw5g2242d74c	cmk2xxaci0025cw5gl37pa6cl	2	good	Warehouse A	/images/equipment-1767725190598-05vyor5z4.jpg	20	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 18:46:31.4	2026-01-06 20:09:17.4	Extensão de alimentação profissional de 50 metros com conectores CEE 32A de 5 pinos macho e fêmea de alta qualidade. Construída com um cabo H07RN-F 5G2.5 resistente, foi concebida para suportar esforços mecânicos extremos e utilização no exterior (IP44). Proporciona uma distribuição de energia trifásica fiável para equipamentos de iluminação, sistemas de som e maquinaria industrial. Essencial para eventos de grande escala que exijam percursos de energia de longa distância sem queda de tensão significativa.
cmk1e0n520016tb4gpdkryc32	dB Technologies ES 802 – Ultra-Portable Column PA System	High-output, vertical array system built for those who refuse to compromise on acoustic pressure and sound coverage. Unlike small portable speakers, this system utilizes true column design	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	3	good	Warehouse B	/seeding-images/equipment-1767653633919-hwisdmx1i.jpg	150	equipment	2	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.122	2026-01-06 20:17:54.8	Sistema de matriz vertical de alta potência construído para aqueles que se recusam a comprometer a pressão acústica e a cobertura sonora. Ao contrário das pequenas colunas portáteis, este sistema utiliza um verdadeiro design de coluna
cmk2zg2yz004bcw5go4az2yik	ChamSys MagicDMX Full USB DMX Interface	The ChamSys MagicDMX Full is a professional-grade USB-to-DMX interface designed for the MagicQ software ecosystem. It provides a single universe of DMX output via a 5-pin XLR connector without time restrictions. This compact device supports RDM and is essential for lighting technicians requiring a portable, reliable link between a PC/Mac and lighting fixtures. It offers full control of 512 channels, making it perfect for small shows, testing, and high-end architectural lighting setups.	cmk1e0n230003tb4gtbayc9jd	cmk2zfbje0047cw5gihy6kc4h	2	good	Warehouse A	/images/equipment-1767727725526-53z2r5wpy.png	50	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 19:28:46.091	2026-01-06 20:10:49.855	O ChamSys MagicDMX Full é uma interface USB-to-DMX de nível profissional concebida para o ecossistema do software MagicQ. Fornece um único universo de saída DMX através de um conetor XLR de 5 pinos sem restrições de tempo. Este dispositivo compacto suporta RDM e é essencial para os técnicos de iluminação que necessitam de uma ligação portátil e fiável entre um PC/Mac e os aparelhos de iluminação. Oferece controlo total de 512 canais, o que o torna perfeito para pequenos espectáculos, testes e configurações de iluminação arquitetónica de alta qualidade.
cmk1e0n4n0010tb4g0yr9ijgx	HK Audio Linear 5 MKII 118 Sub HPA – High-Power Active Subwoofer	Ultimate powerhouse foundation for sound systems. 18" high-performance active subwoofer engineered to deliver extreme sound pressure levels	cmk1e0n260004tb4g37154d95	cmk1e0n4j000ytb4gz5y21ntw	6	good	Warehouse B	/seeding-images/equipment-1767653305842-3jb80ag5r.jpg	150	equipment	2	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.089	2026-01-06 20:14:10.025	A melhor base de potência para sistemas de som. Subwoofer ativo de 18" de elevado desempenho concebido para proporcionar níveis de pressão sonora extremos
cmk31dumm0065cw5gxkklvhla	Traktor Kontrol Z1 	The Traktor Kontrol Z1 is an ultra-portable, professional 2-channel mixing controller, audio interface, and EQ system for Traktor Pro and Traktor DJ. It features high-quality faders, a 3-band EQ, and a dedicated filter section for each channel. The built-in 24-bit audio interface provides club-ready sound with a dedicated headphone cue. Its compact footprint makes it the perfect solution for mobile DJs and backup rigs, offering tactile control in a travel-friendly design.	cmk1e0n260004tb4g37154d95	cmk2yn0840039cw5gavgf2wsn	1	good	Warehouse A	/images/equipment-1767731812313-tobuvk1wq.jpg	35	equipment	2	cmk2tl2690000o85xlet8yxg7	cmk2tl2690000o85xlet8yxg7	2026-01-06 20:23:01.197	2026-01-06 20:36:52.32	O Traktor Kontrol Z1 é um controlador de mistura profissional ultra-portátil de 2 canais, interface de áudio e sistema de equalização para Traktor Pro e Traktor DJ. Inclui faders de alta qualidade, um equalizador de 3 bandas e uma secção de filtro dedicada para cada canal. A interface de áudio de 24 bits incorporada proporciona um som pronto para o clube com um sinal de auscultadores dedicado. O seu tamanho compacto faz com que seja a solução perfeita para DJs móveis e equipamentos de reserva, oferecendo controlo tátil num design fácil de transportar.
pg_dump: processing data for table "public.Event"
pg_dump: dumping contents of table "public.Event"
pg_dump: processing data for table "public.EventSubClient"
pg_dump: dumping contents of table "public.EventSubClient"
pg_dump: processing data for table "public.Fee"
pg_dump: dumping contents of table "public.Fee"
\.


--
-- TOC entry 3950 (class 0 OID 16450)
-- Dependencies: 222
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Event" (id, name, "clientId", location, "startDate", "endDate", "assignedTo", version, "createdBy", "updatedBy", "createdAt", "updatedAt", "agencyId") FROM stdin;
\.


--
-- TOC entry 3982 (class 0 OID 17112)
-- Dependencies: 254
-- Data for Name: EventSubClient; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."EventSubClient" (id, "eventId", "clientId", "createdAt") FROM stdin;
\.


--
-- TOC entry 3959 (class 0 OID 16555)
-- Dependencies: 231
-- Data for Name: Fee; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Fee" (id, name, description, amount, type, category, "isActive", "isRequired", "createdAt", "updatedAt") FROM stdin;
cmk2tqx0h000ui9xdftir74iy	Delivery Fee	\N	100	fixed	\N	t	f	2026-01-06 16:49:13.889	2026-01-06 16:49:13.889
cmk2tqx0k000vi9xdl4i5lngv	Insurance	\N	5	percentage	\N	t	f	2026-01-06 16:49:13.893	2026-01-06 16:49:13.893
pg_dump: processing data for table "public.FileActivity"
pg_dump: dumping contents of table "public.FileActivity"
pg_dump: processing data for table "public.FileShare"
pg_dump: dumping contents of table "public.FileShare"
pg_dump: processing data for table "public.FileTag"
pg_dump: dumping contents of table "public.FileTag"
cmk2tqx0n000wi9xdmw4gbp6x	Late Return Fee	\N	50	fixed	\N	t	f	2026-01-06 16:49:13.895	2026-01-06 16:49:13.895
cmk2tqx0q000xi9xdhzubrhux	Damage Waiver	\N	150	fixed	\N	t	f	2026-01-06 16:49:13.898	2026-01-06 16:49:13.898
cmk2tqx0t000yi9xdixhgsiiz	Equipment Protection	\N	10	percentage	\N	t	f	2026-01-06 16:49:13.901	2026-01-06 16:49:13.901
\.


--
-- TOC entry 3970 (class 0 OID 16803)
-- Dependencies: 242
-- Data for Name: FileActivity; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileActivity" (id, "fileId", "userId", action, details, "createdAt") FROM stdin;
\.


--
-- TOC entry 3967 (class 0 OID 16777)
-- Dependencies: 239
-- Data for Name: FileShare; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileShare" (id, "fileId", "sharedWith", permission, "shareToken", "expiresAt", "createdAt") FROM stdin;
\.


--
-- TOC entry 3974 (class 0 OID 16945)
-- Dependencies: 246
-- Data for Name: FileTag; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileTag" (id, "fileId", "tagId", "addedAt") FROM stdin;
pg_dump: processing data for table "public.FileVersion"
pg_dump: dumping contents of table "public.FileVersion"
pg_dump: processing data for table "public.FolderShare"
pg_dump: dumping contents of table "public.FolderShare"
pg_dump: processing data for table "public.FolderTag"
pg_dump: dumping contents of table "public.FolderTag"
\.


--
-- TOC entry 3969 (class 0 OID 16795)
-- Dependencies: 241
-- Data for Name: FileVersion; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileVersion" (id, "fileId", "versionNum", "storagePath", size, "uploadedAt", "uploadedBy") FROM stdin;
\.


--
-- TOC entry 3968 (class 0 OID 16786)
-- Dependencies: 240
-- Data for Name: FolderShare; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FolderShare" (id, "folderId", "sharedWith", permission, "shareToken", "expiresAt", "createdAt") FROM stdin;
\.


--
-- TOC entry 3975 (class 0 OID 16953)
-- Dependencies: 247
-- Data for Name: FolderTag; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FolderTag" (id, "folderId", "tagId", "addedAt") FROM stdin;
\.


--
-- TOC entry 3972 (class 0 OID 16904)
-- Dependencies: 244
-- Data for Name: JobReference; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."JobReference" (id, "partnerId", "eventId", "quoteId", "clientName", "referralNotes", commission, status, "referralDate", version, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
pg_dump: processing data for table "public.JobReference"
pg_dump: dumping contents of table "public.JobReference"
pg_dump: processing data for table "public.MaintenanceLog"
pg_dump: dumping contents of table "public.MaintenanceLog"
pg_dump: processing data for table "public.Notification"
pg_dump: dumping contents of table "public.Notification"
pg_dump: processing data for table "public.NotificationPreference"
pg_dump: dumping contents of table "public.NotificationPreference"
\.


--
-- TOC entry 3948 (class 0 OID 16433)
-- Dependencies: 220
-- Data for Name: MaintenanceLog; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."MaintenanceLog" (id, "equipmentId", date, description, cost, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3960 (class 0 OID 16566)
-- Dependencies: 232
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Notification" (id, "userId", type, title, message, priority, "isRead", "entityType", "entityId", "actionUrl", "createdAt", "updatedAt", "expiresAt", "groupKey") FROM stdin;
\.


--
-- TOC entry 3981 (class 0 OID 17079)
-- Dependencies: 253
-- Data for Name: NotificationPreference; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."NotificationPreference" (id, "userId", "conflictAlerts", "statusChanges", "eventReminders", "overdueAlerts", "criticalAlerts", "stockAlerts", "equipmentAvailable", "monthlySummary", "toastCritical", "toastHigh", "updatedAt") FROM stdin;
pg_dump: processing data for table "public.Partner"
pg_dump: dumping contents of table "public.Partner"
pg_dump: processing data for table "public.QuotaChangeHistory"
pg_dump: dumping contents of table "public.QuotaChangeHistory"
cmk2tp45z000bcw5gs05nj478	cmk2tl2690000o85xlet8yxg7	t	t	t	t	t	t	t	t	t	t	2026-01-06 16:47:49.847
\.


--
-- TOC entry 3963 (class 0 OID 16716)
-- Dependencies: 235
-- Data for Name: Partner; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Partner" (id, name, "companyName", "contactPerson", email, phone, address, website, notes, "isActive", version, "createdBy", "updatedBy", "createdAt", "updatedAt", "clientId", "partnerType", commission, "logoUrl") FROM stdin;
cmk1e0n150000tb4g9cktv4bk	Rey Davis	VRD Production	\N	hello@vrd.productions	351969774999	\N	https://vrd.productions	Professional Audio Visual Equipment Rental	t	1	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.014	2026-01-06 20:27:56.57	\N	agency	\N	
\.


--
-- TOC entry 3977 (class 0 OID 17011)
-- Dependencies: 249
-- Data for Name: QuotaChangeHistory; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."QuotaChangeHistory" (id, "userId", "oldQuotaBytes", "newQuotaBytes", "changedBy", reason, "changedAt") FROM stdin;
pg_dump: processing data for table "public.Quote"
pg_dump: dumping contents of table "public.Quote"
pg_dump: processing data for table "public.QuoteItem"
pg_dump: dumping contents of table "public.QuoteItem"
pg_dump: processing data for table "public.Rental"
pg_dump: dumping contents of table "public.Rental"
\.


--
-- TOC entry 3952 (class 0 OID 16467)
-- Dependencies: 224
-- Data for Name: Quote; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Quote" (id, "quoteNumber", name, location, "clientId", "clientName", "clientEmail", "clientPhone", "clientAddress", "startDate", "endDate", "subTotal", "discountAmount", "discountType", "taxRate", "taxAmount", "totalAmount", status, notes, version, "createdBy", "updatedBy", "createdAt", "updatedAt", terms) FROM stdin;
\.


--
-- TOC entry 3953 (class 0 OID 16481)
-- Dependencies: 225
-- Data for Name: QuoteItem; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."QuoteItem" (id, "quoteId", type, "equipmentId", "equipmentName", "serviceId", "serviceName", "feeId", "feeName", amount, "feeType", quantity, "unitPrice", days, "lineTotal", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3951 (class 0 OID 16459)
-- Dependencies: 223
-- Data for Name: Rental; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Rental" (id, "eventId", "equipmentId", "quantityRented", "prepStatus", "createdAt", "updatedAt") FROM stdin;
pg_dump: processing data for table "public.Service"
pg_dump: dumping contents of table "public.Service"
pg_dump: processing data for table "public.StorageQuota"
pg_dump: dumping contents of table "public.StorageQuota"
\.


--
-- TOC entry 3958 (class 0 OID 16545)
-- Dependencies: 230
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Service" (id, name, description, "unitPrice", unit, category, "isActive", "createdAt", "updatedAt") FROM stdin;
cmk2tqx01000pi9xdr8yztqxw	Setup & Teardown	\N	250	event	\N	t	2026-01-06 16:49:13.874	2026-01-06 16:49:13.874
cmk2tqx05000qi9xdilwbpbfw	Technical Support	\N	75	hour	\N	t	2026-01-06 16:49:13.877	2026-01-06 16:49:13.877
cmk2tqx07000ri9xdvfwfbd8f	Operator	\N	150	day	\N	t	2026-01-06 16:49:13.88	2026-01-06 16:49:13.88
cmk2tqx0a000si9xdov7irdcn	Delivery & Setup	\N	500	event	\N	t	2026-01-06 16:49:13.883	2026-01-06 16:49:13.883
cmk2tqx0d000ti9xd9c72c0g2	Installation	\N	300	event	\N	t	2026-01-06 16:49:13.885	2026-01-06 16:49:13.885
\.


--
-- TOC entry 3971 (class 0 OID 16811)
-- Dependencies: 243
-- Data for Name: StorageQuota; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."StorageQuota" (id, "userId", "usedBytes", "quotaBytes", "lastUpdated", "cloudEnabled") FROM stdin;
pg_dump: processing data for table "public.Subcategory"
pg_dump: dumping contents of table "public.Subcategory"
cmk2tp3vz0009cw5gzyw2nfgz	cmk2tl2690000o85xlet8yxg7	0	53687091200	2026-01-06 16:47:49.487	f
\.


--
-- TOC entry 3946 (class 0 OID 16414)
-- Dependencies: 218
-- Data for Name: Subcategory; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Subcategory" (id, name, "parentId", version, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
cmk1e0n3f000mtb4g4wo3p1kw	Battery	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 16:55:54.028	2026-01-06 16:55:54.028
cmk1e0n5m001etb4gstw7s39f	Battery Speakers	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 16:55:54.032	2026-01-06 16:55:54.032
cmk1e0n44000stb4gyw8a3jx9	Decorative Lighting	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 16:55:54.035	2026-01-06 16:55:54.035
cmk1ra3xh000qtjeh69nb1iod	Effects	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 16:55:54.038	2026-01-06 16:55:54.038
cmk1e0n2w000etb4gowy0l9bi	LED Par	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 16:55:54.041	2026-01-06 16:55:54.041
cmk1e0n5v001itb4g5o2ie47u	Microphones	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 16:55:54.044	2026-01-06 16:55:54.044
cmk1e0n2a0006tb4gfvum37v3	Moving Head	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 16:55:54.047	2026-01-06 16:55:54.047
cmk1e0n4j000ytb4gz5y21ntw	Speakers	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 16:55:54.05	2026-01-06 16:55:54.05
cmk2u2qjj000ecw5gonqu3cu9	Projector	cmk2u2ind000ccw5gwp8sjln3	1	\N	\N	2026-01-06 16:58:25.376	2026-01-06 16:58:25.376
cmk2ubkmf000pcw5g90hz31lj	Stage & Touring Gear	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 17:05:17.607	2026-01-06 17:05:17.607
cmk2wxsub001fcw5gcpkpmxpz	Mixing Consoles	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 18:18:33.914	2026-01-06 18:18:33.914
cmk2xpun6001ycw5gbbd6i2bz	Follow Spots	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 18:40:22.626	2026-01-06 18:40:22.626
cmk2xxaci0025cw5gl37pa6cl	Cabling & Distribution	cmk2xt5s50023cw5g2242d74c	1	\N	\N	2026-01-06 18:46:09.571	2026-01-06 18:46:09.571
cmk2yav4d002ocw5g7jyebitz	Fans and ventilation	cmk2yahn1002mcw5gvbcgkszj	1	\N	\N	2026-01-06 18:56:43.022	2026-01-06 18:56:43.022
cmk2yguod002zcw5gazl94gfi	Stage Platforms & Risers	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 19:01:22.381	2026-01-06 19:01:22.381
cmk2yn0840039cw5gavgf2wsn	DJ Equipment	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 19:06:09.508	2026-01-06 19:06:09.508
cmk2zfbje0047cw5gihy6kc4h	Lighting Control	cmk1e0n230003tb4gtbayc9jd	1	\N	\N	2026-01-06 19:28:10.538	2026-01-06 19:28:10.538
cmk2zm9g4004hcw5g0hmjrt3d	Cable Management & Safety	cmk2yg76g002xcw5gs5phwj4g	1	\N	\N	2026-01-06 19:33:34.42	2026-01-06 19:33:34.42
cmk2zsbnb004rcw5gpo2fybt8	Audio Recorder and Player	cmk1e0n260004tb4g37154d95	1	\N	\N	2026-01-06 19:38:17.207	2026-01-06 19:38:17.207
cmk2zuebl004xcw5gs501q7p4	Trussing and Support	cmk2yg76g002xcw5gs5phwj4g	1	\N	\N	2026-01-06 19:39:53.985	2026-01-06 19:39:53.985
cmk3062bl005fcw5g359snsxf	Power Distribution	cmk2xt5s50023cw5g2242d74c	1	\N	\N	2026-01-06 19:48:58.305	2026-01-06 19:48:58.305
\.


--
-- TOC entry 3964 (class 0 OID 16726)
-- Dependencies: 236
-- Data for Name: Subrental; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Subrental" (id, "partnerId", "eventId", "equipmentName", "equipmentDesc", quantity, "dailyRate", "totalCost", "startDate", "endDate", status, "invoiceNumber", notes, version, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
pg_dump: processing data for table "public.Subrental"
pg_dump: dumping contents of table "public.Subrental"
pg_dump: processing data for table "public.TagDefinition"
pg_dump: dumping contents of table "public.TagDefinition"
pg_dump: processing data for table "public.Translation"
pg_dump: dumping contents of table "public.Translation"
\.


--
-- TOC entry 3973 (class 0 OID 16936)
-- Dependencies: 245
-- Data for Name: TagDefinition; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."TagDefinition" (id, name, "ownerId", color, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3961 (class 0 OID 16675)
-- Dependencies: 233
-- Data for Name: Translation; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Translation" (id, "sourceText", "targetLang", "translatedText", model, "createdAt", "updatedAt", category, context, "isAutoTranslated", "lastUsed", "needsReview", "qualityScore", "reviewedAt", "reviewedBy", status, tags, "usageCount", version) FROM stdin;
cmk31dulz0062cw5g6944yfnn	The Traktor Kontrol Z1 is an ultra-portable, professional 2-channel mixing controller, audio interface, and EQ system for Traktor Pro and Traktor DJ. It features high-quality faders, a 3-band EQ, and a dedicated filter section for each channel. The built-in 24-bit audio interface provides club-ready sound with a dedicated headphone cue. Its compact footprint makes it the perfect solution for mobile DJs and backup rigs, offering tactile control in a travel-friendly design.	pt	O Traktor Kontrol Z1 é um controlador de mistura profissional ultra-portátil de 2 canais, interface de áudio e sistema de equalização para Traktor Pro e Traktor DJ. Inclui faders de alta qualidade, um equalizador de 3 bandas e uma secção de filtro dedicada para cada canal. A interface de áudio de 24 bits incorporada proporciona um som pronto para o clube com um sinal de auscultadores dedicado. O seu tamanho compacto faz com que seja a solução perfeita para DJs móveis e equipamentos de reserva, oferecendo controlo tátil num design fácil de transportar.	deepl	2026-01-06 20:23:01.176	2026-01-06 20:23:01.188	general	\N	f	2026-01-06 20:23:01.187	f	100	\N	\N	approved	\N	1	1
cmk2tobdu0001cw5g7yumfitg	Sign in to your account	pt	Iniciar sessão na sua conta	deepl	2026-01-06 16:47:12.537	2026-01-07 20:38:27.558	general	\N	f	2026-01-07 20:38:27.551	f	100	\N	\N	approved	\N	2	1
cmk2tobmf0006cw5gwjildrvg	Password	pt	Palavra-passe	deepl	2026-01-06 16:47:12.855	2026-01-07 20:38:27.559	general	\N	f	2026-01-07 20:38:27.551	f	100	\N	\N	approved	\N	2	1
cmk2tobn90007cw5gwm2vm6i9	Forgot your password?	pt	Esqueceu-se da sua palavra-passe?	deepl	2026-01-06 16:47:12.886	2026-01-07 20:38:27.56	general	\N	f	2026-01-07 20:38:27.552	f	100	\N	\N	approved	\N	2	1
cmk2tobh20004cw5gvjz89gw1	Sign In	pt	Iniciar sessão	deepl	2026-01-06 16:47:12.663	2026-01-07 20:38:27.563	general	\N	f	2026-01-07 20:38:27.552	f	100	\N	\N	approved	\N	2	1
cmk2tobh80005cw5gjtw48gph	Enter your password	pt	Introduza a sua palavra-passe	deepl	2026-01-06 16:47:12.668	2026-01-07 20:38:27.563	general	\N	f	2026-01-07 20:38:27.552	f	100	\N	\N	approved	\N	2	1
cmk2tobem0003cw5gomx91j3y	Enter your username	pt	Introduza o seu nome de utilizador	deepl	2026-01-06 16:47:12.563	2026-01-07 20:38:27.559	general	\N	f	2026-01-07 20:38:27.551	f	100	\N	\N	approved	\N	2	1
cmk2tobec0002cw5g7khs75y1	Username	pt	Nome de utilizador	deepl	2026-01-06 16:47:12.565	2026-01-07 20:38:27.559	general	\N	f	2026-01-07 20:38:27.551	f	100	\N	\N	approved	\N	2	1
cmk2u46jh000fcw5gnrjab6c3	The Epson EB-L530U is a professional-grade, high-brightness laser projector engineered for environments where image quality and reliability are non-negotiable. Delivering 5200 lumens of equal white and color brightness, this unit cuts through ambient light to produce stunningly sharp, vibrant images even in well-lit rooms. As a laser-source projector, it offers a "set it and forget it" level of reliability that traditional bulb projectors simply cannot match.	pt	O Epson EB-L530U é um projetor laser de alto brilho de nível profissional, concebido para ambientes onde a qualidade de imagem e a fiabilidade não são negociáveis. Com 5200 lúmenes de igual brilho branco e de cor, esta unidade atravessa a luz ambiente para produzir imagens incrivelmente nítidas e vibrantes, mesmo em salas bem iluminadas. Sendo um projetor de fonte laser, oferece um nível de fiabilidade do tipo "instalar e esquecer" que os projectores de lâmpada tradicionais simplesmente não conseguem igualar.	deepl	2026-01-06 16:59:32.765	2026-01-06 16:59:32.777	general	\N	f	2026-01-06 16:59:32.776	f	100	\N	\N	approved	\N	1	1
cmk2tobdg0000cw5g1yh9hpd1	Welcome back	pt	Bem-vindo de volta	deepl	2026-01-06 16:47:12.533	2026-01-07 20:38:27.558	general	\N	f	2026-01-07 20:38:27.551	f	100	\N	\N	approved	\N	2	1
cmk2u4vto000jcw5gigfp0vjt	Professional Zoom Par, 19 leds x 15watt 4in1 RGBW color mixing, linear motorized zoom 10-60, 10 DMX Channels, 4 button led display, aluminum die cast housing, 0-100% linear dimmer, 6.5 kg	pt	Zoom Par profissional, 19 leds x 15 watts, mistura de cores 4 em 1 RGBW, zoom linear motorizado 10-60, 10 canais DMX, ecrã de 4 botões LED, caixa em alumínio fundido, regulação linear 0-100%, 6,5 kg	deepl	2026-01-06 17:00:05.533	2026-01-06 17:00:05.545	general	\N	f	2026-01-06 17:00:05.544	f	100	\N	\N	approved	\N	1	1
cmk2u85jw000kcw5gj9falk2k	The Showtec 50cm Mirrorball is the definitive tool for transforming any venue into a high-end dance floor. Designed for professional installations and large-scale events, its massive half-meter diameter ensures thousands of sharp, brilliant light reflections that fill every corner of the room. This is the heavy-duty choice for those who want the authentic, high-impact "Glitterbox" aesthetic with a build quality that meets strict professional safety standards.	pt	O Showtec 50cm Mirrorball é a ferramenta definitiva para transformar qualquer local numa pista de dança de alta qualidade. Concebida para instalações profissionais e eventos de grande escala, o seu enorme diâmetro de meio metro garante milhares de reflexos de luz nítidos e brilhantes que preenchem todos os cantos da sala. Esta é a escolha ideal para quem pretende a estética autêntica e de grande impacto da "Glitterbox" com uma qualidade de construção que cumpre as rigorosas normas de segurança profissionais.	deepl	2026-01-06 17:02:38.108	2026-01-06 17:02:38.12	general	\N	f	2026-01-06 17:02:38.119	f	100	\N	\N	approved	\N	1	1
cmk2uciph000qcw5grabp3unn	The Sennheiser EW-D is the "gold standard" of wireless technology. If you are a musician, a speaker, or an event organizer who cannot afford a single second of static or signal drop-outs, this is the system you rent. It is a digital system, meaning it works more like a secure Wi-Fi connection than an old-fashioned radio, resulting in a sound that is as clear as a high-quality cable.	pt	O Sennheiser EW-D é o "padrão de ouro" da tecnologia sem fios. Se é um músico, um orador ou um organizador de eventos que não se pode dar ao luxo de ter um único segundo de estática ou de falhas de sinal, este é o sistema que deve alugar. É um sistema digital, o que significa que funciona mais como uma ligação Wi-Fi segura do que como um rádio à moda antiga, resultando num som tão nítido como um cabo de alta qualidade.	deepl	2026-01-06 17:06:01.781	2026-01-06 17:06:01.793	general	\N	f	2026-01-06 17:06:01.793	f	100	\N	\N	approved	\N	1	1
cmk2ufaz3000ucw5gmnpgis10	The Sennheiser G4 Twin is the ultimate professional solution for on-stage monitoring. This "Twin" set allows two performers to receive an independent, crystal-clear wireless feed from a single transmitter. By moving your monitoring to in-ears, you eliminate stage noise, prevent feedback, and ensure you hear every note with studio-grade precision, no matter how loud the rest of the band is.	pt	O Sennheiser G4 Twin é a derradeira solução profissional para monitorização em palco. Este conjunto "Twin" permite que dois artistas recebam uma alimentação sem fios independente e cristalina a partir de um único transmissor. Ao transferir a monitorização para os intra-auriculares, elimina o ruído do palco, evita o feedback e garante que ouve cada nota com precisão de estúdio, independentemente do volume do resto da banda.	deepl	2026-01-06 17:08:11.727	2026-01-06 17:08:11.74	general	\N	f	2026-01-06 17:08:11.739	f	100	\N	\N	approved	\N	1	1
cmk31jx8k0066cw5geoi7s0pi	It features a 32A CEE 5-pin input for high-capacity power handling, delivering energy through four standard 16A Schuko outlets and two IEC C13 ports. Housed in a durable, impact-resistant ABS casing with an IP44 protection rating, the unit includes an integrated circuit breaker to ensure safe operation. It is an essential tool for providing localized power drops to stage equipment and production desks.	pt	Possui uma entrada de 32A CEE de 5 pinos para uma elevada capacidade de manuseamento de energia, fornecendo energia através de quatro tomadas Schuko de 16A padrão e duas portas IEC C13. Alojada numa caixa de ABS durável e resistente a impactos com uma classificação de proteção IP44, a unidade inclui um disjuntor integrado para garantir um funcionamento seguro. É uma ferramenta essencial para fornecer quedas de energia localizadas a equipamentos de palco e mesas de produção.	deepl	2026-01-06 20:27:44.517	2026-01-06 20:27:44.529	general	\N	f	2026-01-06 20:27:44.528	f	100	\N	\N	approved	\N	1	1
cmk2uiy3x000ycw5g7uceko6j	The Sennheiser XSW 2-835 is a high-performance wireless system built for performers who demand professional reliability and a powerful "front-of-house" sound. Featuring the legendary Evolution 835 dynamic capsule, this microphone is engineered to cut through loud stages and high-pressure environments, ensuring your voice remains clear, warm, and prominent in the mix.	pt	O XSW 2-835 da Sennheiser é um sistema sem fios de alto desempenho concebido para artistas que exigem fiabilidade profissional e um som potente na "frente da casa". Com a lendária cápsula dinâmica Evolution 835, este microfone foi concebido para atravessar palcos ruidosos e ambientes de alta pressão, assegurando que a sua voz permanece clara, quente e proeminente na mistura.	deepl	2026-01-06 17:11:01.678	2026-01-06 17:11:01.69	general	\N	f	2026-01-06 17:11:01.689	f	100	\N	\N	approved	\N	1	1
cmk2umxb20012cw5gfwk7qttb	The Sennheiser e 604 is a professional-grade dynamic instrument microphone designed specifically for the high-intensity environment of a drum kit. Part of the legendary Evolution 600 series, this microphone has become the world standard for toms and snare drums. With the ability to handle extreme sound pressure levels and a design that clips directly onto the drum rim, the e 604 delivers a punchy, clear sound without the clutter of mic stands.	pt	O Sennheiser e 604 é um microfone de instrumento dinâmico de nível profissional concebido especificamente para o ambiente de alta intensidade de um kit de bateria. Parte da lendária série Evolution 600, este microfone tornou-se o padrão mundial para toms e caixas de bateria. Com a capacidade de suportar níveis de pressão sonora extremos e um design que se prende diretamente ao aro da bateria, o e 604 proporciona um som forte e nítido sem a confusão dos suportes de microfone.	deepl	2026-01-06 17:14:07.262	2026-01-06 17:14:07.275	general	\N	f	2026-01-06 17:14:07.274	f	100	\N	\N	approved	\N	1	1
cmk2xq3n6001zcw5g0macqn1y	Professional LED follow spot featuring a 150W cool white LED source. It offers a 10° beam angle ideal for distances up to 15 meters, with a 5-color wheel and stepless iris control. Supports DMX and manual operation with adjustable dimming curves and electronic shutter. Perfect for theaters, small concerts, and school auditorium events.	pt	Refletor LED profissional com uma fonte LED branca fria de 150 W. Oferece um ângulo de feixe de 10° ideal para distâncias até 15 metros, com uma roda de 5 cores e controlo de íris contínuo. Suporta DMX e funcionamento manual com curvas de regulação ajustáveis e obturador eletrónico. Perfeito para teatros, pequenos concertos e eventos em auditórios de escolas.	deepl	2026-01-06 18:40:34.29	2026-01-06 18:40:34.303	general	\N	f	2026-01-06 18:40:34.302	f	100	\N	\N	approved	\N	1	1
cmk2ydtdj002tcw5g0viilsvd	The Deluxe Bubble Machine is a high-output effects unit featuring dual rotating wands for a continuous stream of large bubbles. It utilizes a heavy-duty motor housed in a durable metal casing with a built-in fan for effective bubble projection. With a 0.6-liter fluid tank and easy-to-use manual operation, it is designed for reliable performance.	pt	A Deluxe Bubble Machine é uma unidade de efeitos de alto rendimento com duas varinhas rotativas para um fluxo contínuo de grandes bolhas. Utiliza um motor de alta resistência alojado numa caixa de metal durável com uma ventoinha incorporada para uma projeção eficaz das bolhas. Com um depósito de fluido de 0,6 litros e um funcionamento manual fácil de utilizar, foi concebido para um desempenho fiável.	deepl	2026-01-06 18:59:00.727	2026-01-06 18:59:00.739	general	\N	f	2026-01-06 18:59:00.738	f	100	\N	\N	approved	\N	1	1
cmk2yhxx50030cw5goxpb9qkb	Professional heavy-duty stage platform measuring 200x100cm, built with a lightweight aluminum frame and a weatherproof plywood surface. It features a HEXA anti-slip coating and a massive load capacity of 750kg/m². Designed for both indoor and outdoor use, its ergonomic profile allows for rapid assembly using standard 60x60mm legs. Perfect for festival stages, corporate risers, drum platforms, and catwalks in professional venues.	pt	Plataforma de palco profissional para trabalhos pesados com 200x100cm, construída com uma estrutura de alumínio leve e uma superfície de contraplacado resistente às intempéries. Possui um revestimento antiderrapante HEXA e uma enorme capacidade de carga de 750 kg/m². Concebida para utilização no interior e no exterior, o seu perfil ergonómico permite uma montagem rápida utilizando pernas normais de 60x60 mm. Perfeita para palcos de festivais, plataformas de empresas, plataformas de bateria e passadiços em locais profissionais.	deepl	2026-01-06 19:02:13.242	2026-01-06 19:02:13.254	general	\N	f	2026-01-06 19:02:13.253	f	100	\N	\N	approved	\N	1	1
cmk2wnqtn0016cw5gaf416ej3	The BSS AR-133 is the ultimate workhorse of the professional audio industry. Whether in high-end recording studios or on the world’s biggest concert stages, this active DI box is the go-to solution for converting unbalanced signals (like guitars, basses, or keyboards) into a balanced, noise-free feed for your mixer. Known for its tank-like durability and pristine audio transparency, the AR-133 is an essential tool for any serious audio setup.	pt	O BSS AR-133 é o melhor cavalo de batalha da indústria de áudio profissional. Quer seja em estúdios de gravação topo de gama ou nos maiores palcos de concertos do mundo, esta caixa DI ativa é a solução ideal para converter sinais desequilibrados (como guitarras, baixos ou teclados) numa alimentação equilibrada e sem ruído para o seu misturador. Conhecida pela sua durabilidade semelhante à de um tanque e transparência de áudio cristalina, a AR-133 é uma ferramenta essencial para qualquer configuração de áudio séria.	deepl	2026-01-06 18:10:44.747	2026-01-06 18:10:44.761	general	\N	f	2026-01-06 18:10:44.76	f	100	\N	\N	approved	\N	1	1
cmk2wrcst001acw5gxmo04uep	A professional matched pair of small-diaphragm condensers for perfect stereo imaging. Handcrafted with gold-sputtered capsules, these mics deliver studio-grade transparency and a smooth high-end. Ideal for acoustic guitars, pianos, and drum overheads. Features switchable pads and low-cut filters to handle any volume.	pt	Um par profissional de condensadores de diafragma pequeno para uma imagem estéreo perfeita. Fabricados artesanalmente com cápsulas com pulverização de ouro, estes microfones proporcionam transparência de nível de estúdio e um som de alta qualidade suave. Ideal para guitarras acústicas, pianos e overheads de bateria. Inclui pads comutáveis e filtros de corte baixo para lidar com qualquer volume.	deepl	2026-01-06 18:13:33.197	2026-01-06 18:13:33.21	general	\N	f	2026-01-06 18:13:33.209	f	100	\N	\N	approved	\N	1	1
cmk2x0fll001gcw5g0gtavtfj	The Allen & Heath CQ-18T is an ultra-compact 96kHz digital mixer designed for bands, producers, and AV rentals. It features 16 high-quality mic preamps, a 7” capacitive touchscreen, and built-in Dual-Band Wi-Fi for seamless app control. With smart tools like Gain Assistant and Feedback Assistant, it simplifies complex mixing tasks. It also supports multitrack recording via SD card or USB, making it a versatile powerhouse for live sound and studio applications in a portable format.	pt	O Allen & Heath CQ-18T é um misturador digital ultracompacto de 96kHz concebido para bandas, produtores e alugueres de AV. Possui 16 pré-amplificadores de microfone de alta qualidade, um ecrã tátil capacitivo de 7" e Wi-Fi de banda dupla incorporado para um controlo de aplicações sem falhas. Com ferramentas inteligentes como o Gain Assistant e o Feedback Assistant, simplifica tarefas de mistura complexas. Também suporta gravação multipista através de cartão SD ou USB, o que o torna uma potência versátil para aplicações de som ao vivo e de estúdio num formato portátil.	deepl	2026-01-06 18:20:36.73	2026-01-06 18:20:36.744	general	\N	f	2026-01-06 18:20:36.743	f	100	\N	\N	approved	\N	1	1
cmk2x39oo001kcw5gk5b7p1ea	The EZpin Zoom Pack is a versatile lighting kit featuring four battery-operated LED pinspots, ideal for highlighting centerpieces or architectural details. Each fixture includes a manual zoom for precise beam control and a magnetic base for easy attachment to metal surfaces. The pack includes a dedicated carrying bag and an IRC-6 remote, allowing for effortless wireless operation. Perfect for weddings and corporate events in Lisbon where cable-free, discreet lighting is required.	pt	O EZpin Zoom Pack é um kit de iluminação versátil que inclui quatro pinspots LED a pilhas, ideais para realçar peças centrais ou detalhes arquitectónicos. Cada luminária inclui um zoom manual para um controlo preciso do feixe e uma base magnética para fácil fixação a superfícies metálicas. O pacote inclui um saco de transporte dedicado e um controlo remoto IRC-6, permitindo uma operação sem fios sem esforço. Perfeito para casamentos e eventos empresariais em Lisboa, onde é necessária uma iluminação discreta e sem cabos.	deepl	2026-01-06 18:22:49.032	2026-01-06 18:22:49.044	general	\N	f	2026-01-06 18:22:49.043	f	100	\N	\N	approved	\N	1	1
cmk2x4wsc001ocw5gh54anxv3	The Shure Beta 52A is a high-output dynamic microphone with a frequency response specifically tailored for kick drums and bass instruments. It delivers incredible "punch" and studio-quality clarity even at extreme sound pressure levels (up to 174 dB). Its supercardioid pattern ensures maximum isolation from other stage sounds and high resistance to feedback. Built for the road, it features a hardened steel mesh grille and an integrated locking stand adapter for easy, secure positioning.	pt	O Shure Beta 52A é um microfone dinâmico de alta saída com uma resposta de frequência especificamente adaptada para baterias e instrumentos de baixo. Proporciona um "punch" incrível e clareza com qualidade de estúdio, mesmo em níveis extremos de pressão sonora (até 174 dB). O seu padrão supercardioide garante o máximo isolamento de outros sons de palco e uma elevada resistência ao feedback. Construído para a estrada, possui uma grelha de malha de aço endurecido e um adaptador de suporte de bloqueio integrado para um posicionamento fácil e seguro.	deepl	2026-01-06 18:24:05.628	2026-01-06 18:24:05.641	general	\N	f	2026-01-06 18:24:05.64	f	100	\N	\N	approved	\N	1	1
cmk2xiesq001scw5gdsr53udf	The Shure Beta 52A is a high-output supercardioid dynamic microphone tailored for low-frequency punch. It features a frequency response of 20Hz-10kHz, specifically designed for kick drums and bass amplifiers. With a maximum SPL of 174dB, it handles extreme volume without distortion.	pt	O Shure Beta 52A é um microfone dinâmico supercardióide de alta saída, concebido para uma potência de baixa frequência. Apresenta uma resposta de frequência de 20Hz-10kHz, especificamente concebida para kick drums e amplificadores de graves. Com um SPL máximo de 174dB, suporta volumes extremos sem distorção.	deepl	2026-01-06 18:34:35.499	2026-01-06 18:34:35.511	general	\N	f	2026-01-06 18:34:35.51	f	100	\N	\N	approved	\N	1	1
cmk317a740061cw5gu3qmdl2j	High-output, vertical array system built for those who refuse to compromise on acoustic pressure and sound coverage. Unlike small portable speakers, this system utilizes true column design	pt	Sistema de matriz vertical de alta potência construído para aqueles que se recusam a comprometer a pressão acústica e a cobertura sonora. Ao contrário das pequenas colunas portáteis, este sistema utiliza um verdadeiro design de coluna	deepl	2026-01-06 20:17:54.784	2026-01-06 20:17:54.797	general	\N	f	2026-01-06 20:17:54.796	f	100	\N	\N	approved	\N	1	1
cmk2xmmsw001tcw5gap7bxdlg	The Sennheiser HT 747 is a high-performance supercardioid headset microphone designed for active users. It features a sweat-resistant construction and a secure dual-ear-hook design with an adjustable neckband. Technical specs include a 100Hz-15kHz frequency response and 125dB max SPL, ensuring clear speech while rejecting background noise. Ideal for fitness instructors, sports commentators, and high-movement stage performances requiring reliable, hands-free audio.	pt	O Sennheiser HT 747 é um microfone de auricular supercardióide de alto desempenho concebido para utilizadores activos. Possui uma construção resistente ao suor e um design seguro de gancho duplo para o ouvido com uma banda de pescoço ajustável. As especificações técnicas incluem uma resposta de frequência de 100 Hz-15 kHz e um SPL máximo de 125 dB, garantindo um discurso claro e rejeitando o ruído de fundo. Ideal para instrutores de fitness, comentadores desportivos e actuações em palco de grande movimento que exijam áudio fiável e mãos-livres.	deepl	2026-01-06 18:37:52.497	2026-01-06 18:37:52.51	general	\N	f	2026-01-06 18:37:52.509	f	100	\N	\N	approved	\N	1	1
cmk2xxr5s0026cw5g6dzacuza	Professional 50-meter power extension featuring high-quality CEE 16A 5-pin male and female connectors. Built with heavy-duty H07RN-F 5G2.5 cable, it is designed for extreme mechanical stress and outdoor use (IP44). Provides reliable three-phase power distribution for lighting rigs, sound systems, and industrial machinery. Essential for large-scale events requiring long-distance power runs without significant voltage drop.	pt	Extensão de alimentação profissional de 50 metros com conectores CEE 16A de 5 pinos macho e fêmea de alta qualidade. Construída com um cabo H07RN-F 5G2.5 de alta resistência, foi concebida para suportar esforços mecânicos extremos e utilização no exterior (IP44). Proporciona uma distribuição de energia trifásica fiável para equipamentos de iluminação, sistemas de som e maquinaria industrial. Essencial para eventos de grande escala que exijam percursos de energia de longa distância sem queda de tensão significativa.	deepl	2026-01-06 18:46:31.36	2026-01-06 18:46:31.389	general	\N	f	2026-01-06 18:46:31.388	f	100	\N	\N	approved	\N	1	1
cmk2y0elv002acw5g1g63xhwu	The Yamaha MG16XU is a versatile 16-channel analog mixing console featuring 10 studio-grade "D-PRE" discrete class-A mic preamps. It includes a built-in SPX digital effects processor with 24 programs and a 24-bit/192kHz USB audio interface for seamless recording. With 1-knob compressors and a rugged metal chassis, it is ideal for live bands, corporate events, and theater productions requiring transparent sound and reliable dynamics control.	pt	A Yamaha MG16XU é uma versátil consola de mistura analógica de 16 canais com 10 pré-amplificadores de microfone discretos classe A "D-PRE" de qualidade de estúdio. Inclui um processador de efeitos digitais SPX incorporado com 24 programas e uma interface de áudio USB de 24 bits/192 kHz para uma gravação perfeita. Com compressores de 1 botão e um chassis metálico robusto, é ideal para bandas ao vivo, eventos empresariais e produções teatrais que exijam um som transparente e um controlo de dinâmica fiável.	deepl	2026-01-06 18:48:35.06	2026-01-06 18:48:35.073	general	\N	f	2026-01-06 18:48:35.072	f	100	\N	\N	approved	\N	1	1
cmk2y38ao002ecw5gnjaghz5f	The Varytec VP-m20 is a compact 45W LED video panel featuring 300 SMD LEDs with a high CRI of 95 for natural color rendering. It offers a steplessly adjustable color temperature from 2850K to 5700K and a wide 120-degree beam angle. The integrated battery provides up to 7.5 hours of operation, making it ideal for mobile journalism, professional streaming, and on-location photography. Includes built-in barndoors and a USB port for charging external mobile devices.	pt	O Varytec VP-m20 é um painel de vídeo LED compacto de 45 W com 300 LEDs SMD com um CRI elevado de 95 para uma reprodução de cor natural. Oferece uma temperatura de cor ajustável de 2850K a 5700K e um amplo ângulo de feixe de 120 graus. A bateria integrada proporciona até 7,5 horas de funcionamento, tornando-o ideal para jornalismo móvel, transmissão profissional e fotografia no local. Inclui barndoors incorporados e uma porta USB para carregar dispositivos móveis externos.	deepl	2026-01-06 18:50:46.849	2026-01-06 18:50:46.861	general	\N	f	2026-01-06 18:50:46.86	f	100	\N	\N	approved	\N	1	1
cmk2y5of0002icw5gz74lxev2	The Stairville LED BossFX-1 Pro is a versatile multi-effect lighting system including two RGBW LED spots, two derby effects, and four strobe LEDs. It features a built-in laser for extra visual impact. Technical specs include DMX-512 control, sound-to-light mode, and an integrated wireless footswitch. This complete bundle comes with a sturdy tripod and a transport bag. Perfect for mobile DJs, small bands, and private events in Lisbon venues.	pt	O Stairville LED BossFX-1 Pro é um sistema de iluminação multi-efeitos versátil que inclui dois spots LED RGBW, dois efeitos derby e quatro LEDs estroboscópicos. Inclui um laser incorporado para um impacto visual extra. As especificações técnicas incluem controlo DMX-512, modo de som para luz e um pedal sem fios integrado. Este conjunto completo inclui um tripé robusto e um saco de transporte. Perfeito para DJs móveis, pequenas bandas e eventos privados em locais de Lisboa.	deepl	2026-01-06 18:52:41.053	2026-01-06 18:52:41.066	general	\N	f	2026-01-06 18:52:41.065	f	100	\N	\N	approved	\N	1	1
cmk2ybpad002pcw5gf5tpiq9z	High-performance industrial drum fan featuring a robust 330W motor and a 60cm diameter. It offers two speed settings for adjustable airflow and a tiltable head for precise direction. Technical specs include an 85dB noise level, steel construction, and integrated wheels for easy mobility. Ideal for cooling stages, drying outdoor event surfaces, and improving ventilation in warehouse venues or temporary festival marquees.	pt	Ventilador de tambor industrial de elevado desempenho, com um motor robusto de 330 W e um diâmetro de 60 cm. Oferece duas definições de velocidade para um fluxo de ar ajustável e uma cabeça inclinável para uma direção precisa. As especificações técnicas incluem um nível de ruído de 85dB, construção em aço e rodas integradas para uma fácil mobilidade. Ideal para arrefecer palcos, secar superfícies de eventos ao ar livre e melhorar a ventilação em armazéns ou tendas de festivais temporários.	deepl	2026-01-06 18:57:22.118	2026-01-06 18:57:22.13	general	\N	f	2026-01-06 18:57:22.129	f	100	\N	\N	approved	\N	1	1
cmk2yljqk0034cw5gyqoxams1	Professional PMR446 radio set featuring four robust handheld units designed for event coordination. These radios offer 16 channels, hands-free VOX functionality, and a high-capacity 1200mAh battery for 14-hour shifts. The set includes a multi-charger station and four security-style headsets with integrated microphones. Housed in a heavy-duty hardshell transport case, this system ensures reliable, interference-free communication across large venues, festival sites, and production teams.	pt	Conjunto de rádios profissionais PMR446 com quatro unidades portáteis robustas concebidas para a coordenação de eventos. Estes rádios oferecem 16 canais, funcionalidade VOX mãos-livres e uma bateria de 1200mAh de elevada capacidade para turnos de 14 horas. O conjunto inclui uma estação de carregamento múltiplo e quatro auriculares de segurança com microfones integrados. Alojado numa mala de transporte rígida e resistente, este sistema assegura uma comunicação fiável e sem interferências em grandes recintos, locais de festivais e equipas de produção.	deepl	2026-01-06 19:05:01.484	2026-01-06 19:05:01.496	general	\N	f	2026-01-06 19:05:01.495	f	100	\N	\N	approved	\N	1	1
cmk2ynlja003acw5ggnfy5ub8	The Pioneer CDJ-3000 is a professional flagship multi-player powered by a state-of-the-art MPU for advanced performance and stability. It features a 9-inch high-resolution touch screen, eight dedicated Hot Cue buttons, and a redesigned mechanical jog wheel for ultra-smooth scratching. With 96kHz/32-bit audio processing and Pro DJ Link with Gigabit Ethernet, it is the global industry standard for festival stages, nightclubs, and high-end corporate events.	pt	O CDJ-3000 da Pioneer é um leitor multileitor profissional de topo, equipado com uma MPU de última geração para um desempenho e estabilidade avançados. Possui um ecrã tátil de alta resolução de 9 polegadas, oito botões Hot Cue dedicados e um jog wheel mecânico redesenhado para um scratching ultra-suave. Com processamento de áudio de 96kHz/32-bit e Pro DJ Link com Gigabit Ethernet, é o padrão global da indústria para palcos de festivais, clubes noturnos e eventos empresariais de alta qualidade.	deepl	2026-01-06 19:06:37.127	2026-01-06 19:06:37.139	general	\N	f	2026-01-06 19:06:37.138	f	100	\N	\N	approved	\N	1	1
cmk2ypthw003ecw5g0zyj3jbx	The DJM-V10-LF is a 6-channel professional mixer featuring 60mm long-throw faders for precise volume control. It boasts studio-quality 64-bit processing, 32-bit AD/DA converters, and a 4-band EQ on every channel. With a dedicated compressor, expanded send/return section, and 3-band master isolator, it delivers elite sound quality. Dual headphone outputs and a booth EQ make it the ultimate choice for complex festival setups and high-end club performances in Lisbon.	pt	A DJM-V10-LF é uma mesa de mistura profissional de 6 canais com faders de longo alcance de 60 mm para um controlo preciso do volume. Possui processamento de 64-bit com qualidade de estúdio, conversores AD/DA de 32-bit e um EQ de 4 bandas em cada canal. Com um compressor dedicado, uma secção de envio/retorno expandida e um isolador principal de 3 bandas, proporciona uma qualidade de som de elite. Saídas duplas para auscultadores e um equalizador de cabine fazem dele a melhor escolha para configurações complexas de festivais e actuações em clubes de topo em Lisboa.	deepl	2026-01-06 19:08:20.756	2026-01-06 19:08:20.768	general	\N	f	2026-01-06 19:08:20.767	f	100	\N	\N	approved	\N	1	1
cmk2ysdv8003icw5gn5p8ii2g	The Pioneer XDJ-RX3 is a professional 2-channel all-in-one DJ system featuring a 10.1-inch high-resolution touchscreen. It inherits its layout and performance features from the club-standard CDJ-3000 and DJM-900NXS2, including 14 Beat FX and 6 Sound Color FX. Supporting rekordbox and Serato DJ Pro, it offers an enhanced GUI for faster browsing and smooth waveforms. Ideal for mobile DJs, corporate events, and wedding receptions.	pt	O Pioneer XDJ-RX3 é um sistema profissional de DJ tudo-em-um de 2 canais com um ecrã tátil de alta resolução de 10,1 polegadas. Herda o seu layout e caraterísticas de desempenho do CDJ-3000 e da DJM-900NXS2, padrão de clube, incluindo 14 Beat FX e 6 Sound Color FX. Compatível com o rekordbox e o Serato DJ Pro, oferece uma GUI melhorada para uma navegação mais rápida e formas de onda suaves. Ideal para DJs móveis, eventos empresariais e recepções de casamento.	deepl	2026-01-06 19:10:20.469	2026-01-06 19:10:20.483	general	\N	f	2026-01-06 19:10:20.481	f	100	\N	\N	approved	\N	1	1
cmk2yz93e003qcw5gcxl8dn1p	A high-performance 2-channel analog mixer featuring the legendary Xone filter system with voltage-controlled resonance. It offers 2+2 channels with dual phono/line inputs, 3-band total kill EQ, and a professional FX loop. Its robust build and balanced XLR outputs deliver studio-quality audio in a compact frame. Ideal for small club setups, vinyl enthusiasts, and high-end private events requiring the signature warm analog sound.	pt	Uma mesa de mistura analógica de 2 canais de alto desempenho que inclui o lendário sistema de filtros Xone com ressonância controlada por tensão. Oferece 2+2 canais com entradas duplas de fono/linha, equalização total de 3 bandas e um loop FX profissional. A sua construção robusta e as saídas XLR equilibradas proporcionam áudio com qualidade de estúdio numa estrutura compacta. Ideal para pequenos clubes, entusiastas do vinil e eventos privados de alta qualidade que requerem o som analógico quente caraterístico.	deepl	2026-01-06 19:15:40.874	2026-01-06 19:15:40.888	general	\N	f	2026-01-06 19:15:40.886	f	100	\N	\N	approved	\N	1	1
cmk2z91ho003ycw5gsea1zrfd	High-performance active monitor ideal for event production, VIP lounges, and backstage monitoring. Featuring the precision X-ART tweeter and a 7" woofer, it delivers transparent, fatigue-free sound even during long shifts. Its compact design and front-panel power/volume controls make it perfect for temporary setups in warehouses or corporate Green Rooms. Reliable XLR/RCA inputs ensure quick integration into professional AV racks or mobile DJ booths.	pt	Monitor ativo de elevado desempenho ideal para produção de eventos, salas VIP e monitorização de bastidores. Com o tweeter de precisão X-ART e um woofer de 7", proporciona um som transparente e sem fadiga, mesmo durante turnos longos. O seu design compacto e os controlos de potência/volume no painel frontal tornam-no perfeito para configurações temporárias em armazéns ou salas verdes de empresas. As fiáveis entradas XLR/RCA garantem uma rápida integração em racks AV profissionais ou cabines de DJ móveis.	deepl	2026-01-06 19:23:17.581	2026-01-06 19:23:17.595	general	\N	f	2026-01-06 19:23:17.593	f	100	\N	\N	approved	\N	1	1
cmk2ywvb3003mcw5ggh58ry36	The Xone:92 Limited Edition is a premium 6-channel analog mixer celebrating two decades of the industry-standard "92" sound. This collector’s version features a retro silver top plate, updated RIAA phono preamps specifically tuned for electronic vinyl, and a custom mini innoFADER Pro for superior handling. It retains the legendary dual VCF filters (now with silent switching) and the iconic 4-band "total kill" EQ. With only 920 units produced worldwide.	pt	A Xone:92 Limited Edition é uma mesa de mistura analógica de 6 canais de qualidade superior que celebra duas décadas do som "92" padrão da indústria. Esta versão de colecionador apresenta uma placa superior prateada retro, pré-amplificadores fono RIAA actualizados, especificamente sintonizados para vinil eletrónico, e um mini innoFADER Pro personalizado para um manuseamento superior. Mantém os lendários filtros VCF duplos (agora com comutação silenciosa) e o icónico equalizador de 4 bandas "total kill". Com apenas 920 unidades produzidas em todo o mundo.	deepl	2026-01-06 19:13:49.696	2026-01-06 19:13:49.71	general	\N	f	2026-01-06 19:13:49.708	f	100	\N	\N	approved	\N	1	1
cmk2z5gs3003ucw5godx1pl0n	The world’s most iconic analog DJ turntable. Renowned for its heavy-duty construction and vibration-resistant rubber base, it features a high-torque direct-drive motor that reaches full speed in 0.7s. Includes quartz-locked continuous pitch control (±8%) and a highly sensitive S-shaped tonearm. Built for absolute precision and durability, it remains the primary choice for professional vinyl DJs and high-end club setups globally.	pt	O gira-discos analógico para DJ mais icónico do mundo. Reconhecido pela sua construção robusta e base de borracha resistente a vibrações, possui um motor de acionamento direto de binário elevado que atinge a velocidade máxima em 0,7s. Inclui controlo de pitch contínuo bloqueado por quartzo (±8%) e um braço em forma de S altamente sensível. Construído para uma precisão e durabilidade absolutas, continua a ser a principal escolha para DJs profissionais de vinil e configurações de discotecas topo de gama em todo o mundo.	deepl	2026-01-06 19:20:30.771	2026-01-06 19:20:30.785	general	\N	f	2026-01-06 19:20:30.784	f	100	\N	\N	approved	\N	1	1
cmk2zbqfu0042cw5gew605dmc	Ultra-compact 25W LED moving head spotlight designed for dynamic event lighting. Features 7 patterns (gobos) and 7 vibrant colors plus white, with high-speed pan and tilt movements. Operating modes include DMX512 control, sound-activated, and automatic programs. Its lightweight, portable design makes it perfect for mobile DJ booths, small stages, and private parties looking for professional club-style effects in a compact format	pt	Projetor de cabeça móvel LED ultra-compacto de 25 W concebido para iluminação dinâmica de eventos. Inclui 7 padrões (gobos) e 7 cores vibrantes mais branco, com movimentos de rotação e inclinação de alta velocidade. Os modos de funcionamento incluem controlo DMX512, ativação por som e programas automáticos. O seu design leve e portátil torna-o perfeito para cabinas de DJ móveis, pequenos palcos e festas privadas que procuram efeitos profissionais de estilo de clube num formato compacto	deepl	2026-01-06 19:25:23.227	2026-01-06 19:25:23.24	general	\N	f	2026-01-06 19:25:23.239	f	100	\N	\N	approved	\N	1	1
cmk2zmtot004icw5g03myl2dv	The Stageworx Cable Bridge 2MC is a heavy-duty, two-channel protector designed for high-traffic event environments. Featuring a high-visibility yellow hinged lid, it supports a maximum load of 3 tonnes, making it suitable for both pedestrian and light vehicle traffic. Each channel measures 3.2 x 3.2 cm, comfortably housing power and signal cables. This durable bridge ensures site safety and cable integrity during concerts, trade shows, and outdoor corporate events.	pt	A ponte de cabos Stageworx 2MC é um protetor de dois canais para trabalhos pesados, concebido para ambientes de eventos com muito tráfego. Com uma tampa articulada amarela de alta visibilidade, suporta uma carga máxima de 3 toneladas, o que a torna adequada tanto para o tráfego de peões como de veículos ligeiros. Cada canal mede 3,2 x 3,2 cm, albergando confortavelmente cabos de alimentação e de sinal. Esta ponte duradoura garante a segurança do local e a integridade dos cabos durante concertos, feiras comerciais e eventos empresariais ao ar livre.	deepl	2026-01-06 19:34:00.654	2026-01-06 19:34:00.665	general	\N	f	2026-01-06 19:34:00.664	f	100	\N	\N	approved	\N	1	1
cmk2zsxqn004scw5gqbmwlwiu	The Zoom H5 is a versatile portable digital recorder featuring an interchangeable capsule system and four tracks of simultaneous recording. It comes standard with the XYH-5 X/Y microphone capsule, designed to handle up to 140 dB SPL for distortion-free audio. 	pt	O Zoom H5 é um gravador digital portátil versátil que inclui um sistema de cápsulas intercambiáveis e quatro pistas de gravação simultânea. É fornecido de série com a cápsula de microfone XYH-5 X/Y, concebida para suportar até 140 dB SPL para um áudio sem distorção.	deepl	2026-01-06 19:38:45.839	2026-01-06 19:38:45.853	general	\N	f	2026-01-06 19:38:45.852	f	100	\N	\N	approved	\N	1	1
cmk2zg2yn0048cw5gudja9wxv	The ChamSys MagicDMX Full is a professional-grade USB-to-DMX interface designed for the MagicQ software ecosystem. It provides a single universe of DMX output via a 5-pin XLR connector without time restrictions. This compact device supports RDM and is essential for lighting technicians requiring a portable, reliable link between a PC/Mac and lighting fixtures. It offers full control of 512 channels, making it perfect for small shows, testing, and high-end architectural lighting setups.	pt	O ChamSys MagicDMX Full é uma interface USB-to-DMX de nível profissional concebida para o ecossistema do software MagicQ. Fornece um único universo de saída DMX através de um conetor XLR de 5 pinos sem restrições de tempo. Este dispositivo compacto suporta RDM e é essencial para os técnicos de iluminação que necessitam de uma ligação portátil e fiável entre um PC/Mac e os aparelhos de iluminação. Oferece controlo total de 512 canais, o que o torna perfeito para pequenos espectáculos, testes e configurações de iluminação arquitetónica de alta qualidade.	deepl	2026-01-06 19:28:46.079	2026-01-06 19:28:46.091	general	\N	f	2026-01-06 19:28:46.09	f	100	\N	\N	approved	\N	1	1
cmk2ziyb8004ccw5gdwczf542	he MagicQ Compact Connect is a lightweight, professional USB control surface that transforms any PC or Mac into a powerful lighting station. It features 10 playback faders, 8 attribute encoders, and 2 direct DMX outputs. Supporting 64 universes via its onboard network port, it offers tactile control for lighting, media, and LEDs. Small enough for hand luggage, it includes an internal USB hub and audio input, making it the ultimate tool for touring designers and mobile productions.	pt	MagicQ Compact Connect é uma superfície de controlo USB leve e profissional que transforma qualquer PC ou Mac numa poderosa estação de iluminação. Possui 10 faders de reprodução, 8 codificadores de atributos e 2 saídas DMX diretas. Suportando 64 universos através da sua porta de rede integrada, oferece controlo tátil para iluminação, meios de comunicação e LEDs. Suficientemente pequeno para levar na bagagem de mão, inclui um hub USB interno e uma entrada de áudio, o que o torna a ferramenta ideal para designers em digressão e produções móveis.	deepl	2026-01-06 19:31:00.02	2026-01-06 19:31:00.026	general	\N	f	2026-01-06 19:31:00.025	f	100	\N	\N	approved	\N	1	1
cmk2zoyuk004mcw5ggab4rspy	The Stageworx Cable Bridge 1S is an ultra-slim, professional cable protector designed for indoor use and light pedestrian traffic. It features a single 10 x 48 mm channel, perfect for discreetly managing power leads or XLR signal cables. With a load capacity of 200 kg and a total length of 90 cm, this non-slip bridge prevents tripping hazards while maintaining a low profile. Its lightweight 1.4 kg construction allows for rapid deployment and easy transport for small events and gallery spaces.	pt	O Stageworx Cable Bridge 1S é um protetor de cabos profissional ultrafino, concebido para utilização em interiores e tráfego pedonal ligeiro. Possui um único canal de 10 x 48 mm, perfeito para gerir discretamente cabos de alimentação ou cabos de sinal XLR. Com uma capacidade de carga de 200 kg e um comprimento total de 90 cm, esta ponte antiderrapante evita os riscos de tropeçar, mantendo um perfil baixo. A sua construção leve de 1,4 kg permite uma utilização rápida e um transporte fácil para pequenos eventos e espaços de galeria.	deepl	2026-01-06 19:35:40.653	2026-01-06 19:35:40.665	general	\N	f	2026-01-06 19:35:40.664	f	100	\N	\N	approved	\N	1	1
cmk2zv5xu004ycw5gr0aobqpl	The Global Truss F34200-B is a professional 4-point square truss section with a sleek black powder-coated finish. This 2-meter straight segment features a 29 cm edge dimension, 50 mm main pipes, and 2 mm wall thickness. Designed for high visibility and aesthetic integration, it is TÜV certified for safety and includes conical connectors for rapid, secure assembly. It is ideal for corporate events, exhibitions, and stage designs requiring a premium, non-reflective look.	pt	A Global Truss F34200-B é uma secção de treliça quadrada profissional de 4 pontos com um elegante acabamento revestido a pó preto. Este segmento reto de 2 metros apresenta uma dimensão de borda de 29 cm, tubos principais de 50 mm e espessura de parede de 2 mm. Concebida para uma elevada visibilidade e integração estética, possui certificação TÜV para segurança e inclui conectores cónicos para uma montagem rápida e segura. É ideal para eventos empresariais, exposições e projectos de palcos que exijam um aspeto de qualidade superior e não refletor.	deepl	2026-01-06 19:40:29.778	2026-01-06 19:40:29.79	general	\N	f	2026-01-06 19:40:29.789	f	100	\N	\N	approved	\N	1	1
cmk2zy3on0052cw5gqyd3i19n	The Global Truss 27195 is a heavy-duty, multi-purpose steel baseplate designed for maximum stability of vertical truss columns. Weighing 36kg, this 80x80cm plate provides a low center of gravity for "totem" configurations. It features a versatile hole pattern compatible with Global Truss F23, F24, F33, and F34 systems. The black powder-coated finish ensures a professional, discreet appearance, while rounded corners enhance safety and ease of handling during load-ins.	pt	A Global Truss 27195 é uma placa de base em aço para trabalhos pesados e polivalentes, concebida para a máxima estabilidade de colunas de treliça verticais. Pesando 36 kg, esta placa de 80x80 cm proporciona um centro de gravidade baixo para configurações de "totem". Apresenta um padrão de orifícios versátil compatível com os sistemas Global Truss F23, F24, F33 e F34. O acabamento revestido a pó preto garante uma aparência profissional e discreta, enquanto os cantos arredondados aumentam a segurança e a facilidade de manuseamento durante as cargas.	deepl	2026-01-06 19:42:46.824	2026-01-06 19:42:46.837	general	\N	f	2026-01-06 19:42:46.836	f	100	\N	\N	approved	\N	1	1
cmk3032mc005acw5g9b9mik0p	The Global Truss F34C21-B is a professional 2-way 90-degree corner designed for the F34 square truss system. This 0.5-meter segment features a high-durability black powder-coated finish, specifically engineered for seamless architectural integration. Constructed from 50 mm main tubes with a 2 mm wall thickness, it includes all necessary conical connectors for a secure, load-bearing fit. It is the perfect solution for creating sleek, non-reflective truss boxes and stage frames.	pt	O Global Truss F34C21-B é um canto profissional de 90 graus de 2 vias concebido para o sistema de treliça quadrada F34. Este segmento de 0,5 metros apresenta um acabamento revestido a pó preto de alta durabilidade, especificamente concebido para uma integração arquitetónica perfeita. Construído a partir de tubos principais de 50 mm com uma espessura de parede de 2 mm, inclui todos os conectores cónicos necessários para um encaixe seguro e de suporte de carga. É a solução perfeita para criar caixas de treliça e estruturas de palco elegantes e não reflectoras.	deepl	2026-01-06 19:46:38.724	2026-01-06 19:46:38.729	general	\N	f	2026-01-06 19:46:38.728	f	100	\N	\N	approved	\N	1	1
cmk308q2p005kcw5gzqo1y34a	The Global Truss CC50403 is a sleek, black powder-coated steel base plate measuring 600x600x5mm. Weighing approximately 13kg, it provides a stable and discreet foundation for pipe-and-drape systems or lightweight vertical truss totems. Its low-profile design is perfect for high-end events where safety and aesthetics are paramount, offering multiple mounting points for F22 through F34 truss systems and telescopic uprights.	pt	A Global Truss CC50403 é uma placa de base de aço elegante, revestida a pó preto, que mede 600x600x5mm. Com um peso aproximado de 13 kg, proporciona uma base estável e discreta para sistemas de tubos e cordas ou totens de treliça verticais leves. O seu design de baixo perfil é perfeito para eventos de alta qualidade em que a segurança e a estética são fundamentais, oferecendo vários pontos de montagem para sistemas de treliça F22 a F34 e montantes telescópicos.	deepl	2026-01-06 19:51:02.402	2026-01-06 19:51:02.413	general	\N	f	2026-01-06 19:51:02.412	f	100	\N	\N	approved	\N	1	1
cmk30aj3x005ocw5g2q7cveo3	PCE Merz M-SVE3 63/121-9 Power Distributot features a 63A CEE input and provides a comprehensive range of outputs: 1x CEE 63A, 2x CEE 32A, 1x CEE 16A, and 9x Schuko sockets. Equipped with dual 63A/0.03A RCDs and individual circuit breakers for all ports, this IP44-rated unit ensures maximum safety and high-load capacity for professional stage, event, and industrial power management.	pt	O distribuidor de energia PCE Merz M-SVE3 63/121-9 possui uma entrada CEE 63A e fornece uma gama abrangente de saídas: 1x CEE 63A, 2x CEE 32A, 1x CEE 16A, e 9x tomadas Schuko. Equipada com dois RCDs de 63A/0,03A e disjuntores individuais para todas as portas, esta unidade com classificação IP44 garante a máxima segurança e uma elevada capacidade de carga para gestão profissional de energia em palcos, eventos e indústria.	deepl	2026-01-06 19:52:26.685	2026-01-06 19:52:26.689	general	\N	f	2026-01-06 19:52:26.688	f	100	\N	\N	approved	\N	1	1
cmk3007tp0056cw5gg2bk33zr	The Eurolite RF-300 is a powerful and quiet radial blower designed for creating focused air effects on stage and in studio environments. It features a sturdy, road-ready plastic housing with a built-in handle for easy transport. The air discharge angle is adjustable (0° or 45°) by repositioning the housing, and the unit delivers a maximum airflow of 510 m³/h. Compact and efficient, it is ideal for fashion shoots, theaters, and exhibitions requiring plug-and-play operation.	pt	O Eurolite RF-300 é um potente e silencioso soprador radial concebido para criar efeitos de ar focados no palco e em ambientes de estúdio. Possui uma caixa de plástico robusta, preparada para a estrada, com uma pega incorporada para facilitar o transporte. O ângulo de descarga de ar é ajustável (0° ou 45°) através do reposicionamento da caixa, e a unidade fornece um caudal de ar máximo de 510 m³/h. Compacta e eficiente, é ideal para sessões fotográficas de moda, teatros e exposições que requerem um funcionamento "plug-and-play".	deepl	2026-01-06 19:44:25.502	2026-01-06 19:44:25.514	general	\N	f	2026-01-06 19:44:25.513	f	100	\N	\N	approved	\N	1	1
cmk316i8h005zcw5gzz2l9hqq	Built for power. As the largest member of the legendary Thump series, this 15-inch loudspeaker is designed for events that demand high-impact bass and massive coverage	pt	Construído para potência. Sendo o maior membro da lendária série Thump, este altifalante de 15 polegadas foi concebido para eventos que exigem graves de grande impacto e uma cobertura maciça	deepl	2026-01-06 20:17:18.545	2026-01-06 22:06:49.128	general	\N	f	2026-01-06 22:06:49.126	f	100	\N	\N	approved	\N	2	1
cmk3070ix005gcw5gb3jsjyqi	The Botex Power Splitter 32 is a rugged 32A CEE three-phase power distributor designed for reliable stage and truss integration. It features a 32A CEE input and output (loop-through) and distributes power to six Schuko (230V) outlets. 	pt	O Botex Power Splitter 32 é um distribuidor de energia trifásico CEE de 32A robusto, concebido para uma integração fiável em palcos e estruturas. Possui uma entrada e saída CEE de 32A (loop-through) e distribui energia para seis tomadas Schuko (230V).	deepl	2026-01-06 19:49:42.633	2026-01-06 19:49:42.645	general	\N	f	2026-01-06 19:49:42.644	f	100	\N	\N	approved	\N	1	1
cmk30w6yg005scw5g9vg29fee	Professional 50-meter power extension featuring high-quality CEE 32A 5-pin male and female connectors. Built with heavy-duty H07RN-F 5G2.5 cable, it is designed for extreme mechanical stress and outdoor use (IP44). Provides reliable three-phase power distribution for lighting rigs, sound systems, and industrial machinery. Essential for large-scale events requiring long-distance power runs without significant voltage drop.	pt	Extensão de alimentação profissional de 50 metros com conectores CEE 32A de 5 pinos macho e fêmea de alta qualidade. Construída com um cabo H07RN-F 5G2.5 resistente, foi concebida para suportar esforços mecânicos extremos e utilização no exterior (IP44). Proporciona uma distribuição de energia trifásica fiável para equipamentos de iluminação, sistemas de som e maquinaria industrial. Essencial para eventos de grande escala que exijam percursos de energia de longa distância sem queda de tensão significativa.	deepl	2026-01-06 20:09:17.369	2026-01-06 20:09:17.383	general	\N	f	2026-01-06 20:09:17.382	f	100	\N	\N	approved	\N	1	1
cmk30xkez005tcw5grynetupo	Retro background fixture, diameter 64cm, 750 watt halogen lamp driven by internal dimmer, 96pcs 3in1 RGB LEDs background lighting, 4/6/9 DMX channels, Aluminum alloy housing, LCD menu	pt	Luminária de fundo retro, 64 cm de diâmetro, lâmpada de halogéneo de 750 watts acionada por um regulador de intensidade interno, iluminação de fundo com LEDs RGB 3 em 1 de 96 peças, 4/6/9 canais DMX, caixa em liga de alumínio, menu LCD	deepl	2026-01-06 20:10:21.468	2026-01-06 20:10:21.472	general	\N	f	2026-01-06 20:10:21.471	f	100	\N	\N	approved	\N	1	1
cmk30zj7o005ucw5gtrh2ndug	Ultimate "no-stress" speaker. Designed for total mobility, this sleek white unit is completely wireless, running on high-capacity internal battery. Perfect for rooftop events and mobile setups	pt	O melhor altifalante "sem stress". Concebida para uma mobilidade total, esta elegante unidade branca é totalmente sem fios e funciona com uma bateria interna de elevada capacidade. Perfeito para eventos em telhados e configurações móveis	deepl	2026-01-06 20:11:53.221	2026-01-06 20:11:53.235	general	\N	f	2026-01-06 20:11:53.234	f	100	\N	\N	approved	\N	1	1
cmk310zoe005vcw5gpifwuytc	The "Swiss Army Knife" of professional audio. High-performance, active 12" loudspeaker built for versatility, serving as crystal-clear front-of-house (FOH)	pt	O "canivete suíço" do áudio profissional. Altifalante ativo de 12" de elevado desempenho, construído para ser versátil, servindo como um sistema de som cristalino para a frente da sala (FOH)	deepl	2026-01-06 20:13:01.214	2026-01-06 20:13:01.228	general	\N	f	2026-01-06 20:13:01.227	f	100	\N	\N	approved	\N	1	1
cmk312grd005wcw5gufz23jn7	Ultimate powerhouse foundation for sound systems. 18" high-performance active subwoofer engineered to deliver extreme sound pressure levels	pt	A melhor base de potência para sistemas de som. Subwoofer ativo de 18" de elevado desempenho concebido para proporcionar níveis de pressão sonora extremos	deepl	2026-01-06 20:14:10.009	2026-01-06 20:14:10.023	general	\N	f	2026-01-06 20:14:10.021	f	100	\N	\N	approved	\N	1	1
cmk312tyz005xcw5ga8qrtt9w	Ultimate solution when you need to deliver high-fidelity sound over long distances. High-performance, horn-loaded active unit designed to bridge the gap between studio and venue	pt	A derradeira solução quando é necessário fornecer som de alta fidelidade a longas distâncias. Unidade ativa de alto desempenho, carregada com corneta, concebida para fazer a ponte entre o estúdio e o local	deepl	2026-01-06 20:14:27.132	2026-01-06 20:14:27.145	general	\N	f	2026-01-06 20:14:27.143	f	100	\N	\N	approved	\N	1	1
cmk315vhb005ycw5gcry4l6we	High-performance, heavy-duty subwoofer designed for shaking the room. If your event needs that deep, physical bass that defines professional dance events	pt	Subwoofer de alto desempenho e resistente, concebido para agitar a sala. Se o seu evento precisa de graves profundos e físicos que definem os eventos de dança profissionais	deepl	2026-01-06 20:16:49.056	2026-01-06 20:16:49.068	general	\N	f	2026-01-06 20:16:49.067	f	100	\N	\N	approved	\N	1	1
cmk316w5s0060cw5gqfv5j0wj	Professional-grade loudspeaker designed for those who need high-intensity sound and absolute reliability. Built to deliver "big stage" sound in versatile 12-inch format	pt	Altifalante de nível profissional concebido para quem precisa de som de alta intensidade e fiabilidade absoluta. Construído para proporcionar um som de "grande palco" num formato versátil de 12 polegadas	deepl	2026-01-06 20:17:36.593	2026-01-06 20:17:36.604	general	\N	f	2026-01-06 20:17:36.603	f	100	\N	\N	approved	\N	1	1
\.


--
-- TOC entry 3962 (class 0 OID 16694)
pg_dump: processing data for table "public.TranslationHistory"
pg_dump: dumping contents of table "public.TranslationHistory"
pg_dump: processing data for table "public.User"
pg_dump: dumping contents of table "public.User"
-- Dependencies: 234
-- Data for Name: TranslationHistory; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."TranslationHistory" (id, "translationId", "oldTranslatedText", "newTranslatedText", "changedBy", "changeReason", version, "createdAt") FROM stdin;
\.


--
-- TOC entry 3944 (class 0 OID 16394)
-- Dependencies: 216
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."User" (id, name, username, password, role, "isActive", version, "lastLoginAt", "photoUrl", nif, iban, "contactPhone", "contactEmail", "emergencyPhone", "isTeamMember", "teamTitle", "teamBio", "teamCoverPhoto", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
cmk2tl2690000o85xlet8yxg7	Feliciano	feliciano	$2b$12$Js4hq462ew9m.3yQ4OnKTOwG6jTDCUS34B7pcUBuQql1XEviWMq8e	Admin	t	1	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:44:40.641	2026-01-07 13:51:12.219
cmk2tplku0000kfa8jtrkdz49	João 	joao	$2b$12$HICw/qGqWVCTYx0yKeasg.NW9JHP5gUUpBJSroNmOlDzLUEeozl2u	technician	t	1	\N	\N	\N	\N	+351 900 000 003	joao@acrobaticz.pt	\N	t			\N	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:48:12.415	2026-01-07 13:51:13.08
pg_dump: processing data for table "public.UserSession"
pg_dump: dumping contents of table "public.UserSession"
pg_dump: processing data for table "public._prisma_migrations"
pg_dump: dumping contents of table "public._prisma_migrations"
cmk2tl2eg0001o85xnfveh2t1	Lourenço	lourenco	$2b$12$kw1otQO7EpYHH/j7Cyf2BeJnBu.ANYAo2SerAknkyzsvrVD7ydxRW	Manager	t	1	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:44:40.936	2026-01-07 13:51:14.183
\.


--
-- TOC entry 3955 (class 0 OID 16519)
-- Dependencies: 227
-- Data for Name: UserSession; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."UserSession" (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3943 (class 0 OID 16385)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ffefef4d-777c-4984-a8d4-a0ddcdb77f15	a05e5722cc17d51026776788f21bae739d16910b46fd43eb400c72de568622a2	2026-01-06 16:49:00.660445+00	20260106164900_add_description_to_category	\N	\N	2026-01-06 16:49:00.651722+00	1
055d46b9-7c18-47b4-8724-f95bee1cbba0	361fee0c8a24f6b93cc8844881adf5f16f4bf0063971ea31744bf018d0b647af	2026-01-06 16:44:39.145117+00	20251110233929_init_postgres	\N	\N	2026-01-06 16:44:38.685067+00	1
0281a532-06bd-4bc8-877a-0beadd35c863	22711c3b6e6a52266780c8e6dc5b4df2a6566ef151448f35a139c31bcb73fdc0	2026-01-06 16:44:39.912062+00	20260105005606_add_description_pt	\N	\N	2026-01-06 16:44:39.90392+00	1
df56e674-8f46-4d82-81a1-6fd99177a3c4	41d0628e4c37983d0c2b1368ac83ab727b15631609280815f8e9031414eafa93	2026-01-06 16:44:39.185085+00	20251111045118_add_translation_cache	\N	\N	2026-01-06 16:44:39.147492+00	1
461061c2-408e-477e-9215-edbae0f3795f	003727c26f6a866337cc5715f250b9d537da6082ad9713b986aee5bab5f0d98a	2026-01-06 16:44:39.255033+00	20251111135023_add_enhanced_translation_fields	\N	\N	2026-01-06 16:44:39.187913+00	1
7443e8d0-b34f-4e88-a140-e9427e1fdaea	ce4552ea00d333f3320a26518df18bda3a49358c58650d3284fb1b886b155788	2026-01-06 16:44:39.266387+00	20251124143533_add_pdf_branding_fields	\N	\N	2026-01-06 16:44:39.257702+00	1
e2339189-4f81-4d4f-897b-8132403bcdce	633f231ad0d1a3ba69f1e2a72d6c1d6780bd739266f294e59834fbc37736c538	2026-01-06 16:44:39.956564+00	20260105041010_add_catalog_share	\N	\N	2026-01-06 16:44:39.914544+00	1
b5044dcf-d444-44cb-9f4e-ce1ccf63231d	9e29287f0ea55f812494125adcd2de89118fbe2f9f05a2841f10e5d797040abb	2026-01-06 16:44:39.277717+00	20251229170000_add_missing_columns	\N	\N	2026-01-06 16:44:39.269422+00	1
fbc859e6-e9e0-4083-980b-257058a66948	f44587e34b857bc9c4e6679201ae7948b7f01b91f85f06bf8d2cfb95e463119a	2026-01-06 16:44:39.353793+00	20260101213648_add_partners_and_subrentals	\N	\N	2026-01-06 16:44:39.280188+00	1
b699feeb-1976-452c-a34a-11aad5a77540	ed9696e0840b58f85d88107eabe3a7efcdb965eba5ee6c73ec8f593107ac9951	2026-01-06 16:44:39.600928+00	20260101230350_add_cloud_storage	\N	\N	2026-01-06 16:44:39.356198+00	1
793d28e3-62cc-4177-b675-e770a42756d9	a7a7c38265ab34352ab68e2b6e96d93fc083bd3d1482e8415248e4501b2034c0	2026-01-06 16:44:40.001663+00	20260105043537_add_catalog_inquiry	\N	\N	2026-01-06 16:44:39.959178+00	1
8e82639c-6628-494b-b04f-5b38c8492094	7d84664db3913c43e2a7af0e8c6c20dc4c5fc163d74c81770883c38d8062643b	2026-01-06 16:44:39.61126+00	20260103_add_cloud_enabled	\N	\N	2026-01-06 16:44:39.60363+00	1
7574c859-a0ba-47b8-b6fc-601899ac77d1	977d4998c1a2baae627978e42bcf2470f0e93ae46ea7dd80631f1557fe1bf043	2026-01-06 16:44:39.628202+00	20260103_add_partner_client_link	\N	\N	2026-01-06 16:44:39.613797+00	1
997055e7-a55e-4a3a-a230-3cee55523634	aa5d6bdb4bc25feb6c8c542b2d4e4130816d599822721f720b2385ae91123652	2026-01-06 16:44:39.684871+00	20260103_add_partner_types_and_job_references	\N	\N	2026-01-06 16:44:39.630636+00	1
2c2bf421-d79b-4592-a757-2bf0e7c4833c	12c0711d57376baf2155f141a8623d9775883e953555afd6497677ef6341c3ce	2026-01-06 16:44:40.013066+00	20260105043809_expand_inquiry_fields	\N	\N	2026-01-06 16:44:40.004099+00	1
705658c1-0e67-4b35-90f2-0ea15d19f0c6	0179da26a4fde3bbf3e8b97e11fb88d8a267e78758117c79d0884d0348a0eb14	2026-01-06 16:44:39.819843+00	20260103_add_phase2_features	\N	\N	2026-01-06 16:44:39.687476+00	1
36b15d8e-6d83-41fd-aa43-9022d9bba5f9	f92aec7492c51881d49d2d6161db1d929595c5ace07b658f392d107487fab072	2026-01-06 16:44:39.891238+00	20260104142848_add_theme_preset_field	\N	\N	2026-01-06 16:44:39.822604+00	1
1971b052-96e1-449a-8fed-7fe1d49cc664	8b33cba124e4f196cbc271ca7173a1c8d4848d8f527d15125bdcf40bfe1bf608	2026-01-06 16:44:39.901361+00	20260104170000_add_partner_logo	\N	\N	2026-01-06 16:44:39.89368+00	1
ea4a7ba7-c08d-431d-a8e0-5f3f1b604dfc	16c1cf5c9e89c431b74118074941388f72e553c31535200a554bee57336c5a3a	2026-01-06 16:44:40.068222+00	20260105140254_add_notification_preferences	\N	\N	2026-01-06 16:44:40.015999+00	1
bb66010a-6d4e-4889-8f01-20f4100646d1	bd58b0930bb08e1ed686df4d05759f97e1ecf29bdc5b8f43ca4d2446b872ca6f	2026-01-06 16:44:40.141844+00	20260105_add_agency_events_and_subclient	\N	\N	2026-01-06 16:44:40.070882+00	1
e70edb66-b32f-41b8-9465-2d0b6caa313b	8f8d4a4660f95d21426567d7c367ccfe482087fda3f716406edbf2648d4d42c6	2026-01-06 16:44:40.158903+00	20260105_add_partner_to_client	\N	\N	2026-01-06 16:44:40.144421+00	1
d42ce3c6-c032-4c1f-8640-39b68c0f478c	2ab13f23f5e654f4ec9dc7396156f4bef8b4f26a9d2fa094f3ecc8c5aa7632ff	2026-01-06 16:44:40.169479+00	20260106_add_catalog_terms	\N	\N	2026-01-06 16:44:40.161729+00	1
\.


pg_dump: processing data for table "public.customization_settings"
pg_dump: dumping contents of table "public.customization_settings"
--
-- TOC entry 3954 (class 0 OID 16489)
-- Dependencies: 226
-- Data for Name: customization_settings; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public.customization_settings (id, "companyName", "companyTagline", "contactEmail", "contactPhone", "useTextLogo", "primaryColor", "secondaryColor", "accentColor", "darkMode", "logoUrl", "faviconUrl", "loginBackgroundType", "loginBackgroundColor1", "loginBackgroundColor2", "loginBackgroundImage", "loginCardOpacity", "loginCardBlur", "loginCardPosition", "loginCardWidth", "loginCardBorderRadius", "loginCardShadow", "loginLogoUrl", "loginLogoSize", "loginWelcomeMessage", "loginWelcomeSubtitle", "loginFooterText", "loginShowCompanyName", "loginFormSpacing", "loginButtonStyle", "loginInputStyle", "loginAnimations", "loginLightRaysOrigin", "loginLightRaysColor", "loginLightRaysSpeed", "loginLightRaysSpread", "loginLightRaysLength", "loginLightRaysPulsating", "loginLightRaysFadeDistance", "loginLightRaysSaturation", "loginLightRaysFollowMouse", "loginLightRaysMouseInfluence", "loginLightRaysNoiseAmount", "loginLightRaysDistortion", "customCSS", "footerText", "systemName", timezone, "dateFormat", currency, language, "sessionTimeout", "requireStrongPasswords", "enableTwoFactor", "maxLoginAttempts", "emailEnabled", "smtpServer", "smtpPort", "smtpUsername", "smtpPassword", "fromEmail", "autoBackup", "backupFrequency", "backupRetention", version, "updatedBy", "createdAt", "updatedAt", "pdfCompanyName", "pdfCompanyTagline", "pdfContactEmail", "pdfContactPhone", "pdfLogoUrl", "pdfUseTextLogo", "pdfFooterMessage", "pdfFooterContactText", "pdfShowFooterContact", "themePreset", "catalogTermsAndConditions") FROM stdin;
pg_dump: creating CONSTRAINT "public.ActivityLog ActivityLog_pkey"
pg_dump: creating CONSTRAINT "public.BackupJob BackupJob_pkey"
pg_dump: creating CONSTRAINT "public.BatchOperation BatchOperation_pkey"
pg_dump: creating CONSTRAINT "public.CatalogShareInquiry CatalogShareInquiry_pkey"
pg_dump: creating CONSTRAINT "public.CatalogShare CatalogShare_pkey"
pg_dump: creating CONSTRAINT "public.Category Category_pkey"
pg_dump: creating CONSTRAINT "public.Client Client_pkey"
pg_dump: creating CONSTRAINT "public.CloudFile CloudFile_pkey"
default-settings	Acrobaticz 	Professional Audio Visual Equipment Rental	info@avrental.com	 	f	#3B82F6	#F3F4F6	#10B981	f	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACRCAMAAABOgHVYAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAwBQTFRFAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Bz0LCAAAAQB0Uk5TAAE5GSJyflAygGYHg2uHdH8FCjBYeImRjWI8FwYmRWR6hIZ9akkpCCxhZS8E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		gradient	#0F1419	#1E293B		0.95	t	center	400	8	large		80	Welcome back	Sign in to your account		t	16	default	default	t	top-center	#00ffff	1.5	0.8	1.2	f	1	1	t	0.1	0.1	0.05			AV Rentals	\N	\N	\N	pt	\N	t	f	\N	t	\N	\N	\N	\N	\N	t	\N	\N	1	\N	2026-01-06 16:55:54.008	2026-01-06 22:10:47.743	Acrobaticz 			    	data:image/png;base64,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	f			t	custom	
\.


--
-- TOC entry 3607 (class 2606 OID 16535)
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 3734 (class 2606 OID 17026)
-- Name: BackupJob BackupJob_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."BackupJob"
    ADD CONSTRAINT "BackupJob_pkey" PRIMARY KEY (id);


--
-- TOC entry 3724 (class 2606 OID 16969)
-- Name: BatchOperation BatchOperation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."BatchOperation"
    ADD CONSTRAINT "BatchOperation_pkey" PRIMARY KEY (id);


--
-- TOC entry 3746 (class 2606 OID 17064)
-- Name: CatalogShareInquiry CatalogShareInquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShareInquiry"
    ADD CONSTRAINT "CatalogShareInquiry_pkey" PRIMARY KEY (id);


--
-- TOC entry 3739 (class 2606 OID 17046)
-- Name: CatalogShare CatalogShare_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShare"
    ADD CONSTRAINT "CatalogShare_pkey" PRIMARY KEY (id);


--
-- TOC entry 3558 (class 2606 OID 16413)
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- TOC entry 3576 (class 2606 OID 16449)
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- TOC entry 3672 (class 2606 OID 16776)
-- Name: CloudFile CloudFile_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFile"
    ADD CONSTRAINT "CloudFile_pkey" PRIMARY KEY (id);


--
-- TOC entry 3665 (class 2606 OID 16764)
-- Name: CloudFolder CloudFolder_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFolder"
    ADD CONSTRAINT "CloudFolder_pkey" PRIMARY KEY (id);


pg_dump: creating CONSTRAINT "public.CloudFolder CloudFolder_pkey"
pg_dump: creating CONSTRAINT "public.DataSyncEvent DataSyncEvent_pkey"
pg_dump: creating CONSTRAINT "public.EquipmentItem EquipmentItem_pkey"
pg_dump: creating CONSTRAINT "public.EventSubClient EventSubClient_pkey"
pg_dump: creating CONSTRAINT "public.Event Event_pkey"
pg_dump: creating CONSTRAINT "public.Fee Fee_pkey"
--
-- TOC entry 3612 (class 2606 OID 16544)
-- Name: DataSyncEvent DataSyncEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."DataSyncEvent"
    ADD CONSTRAINT "DataSyncEvent_pkey" PRIMARY KEY (id);


--
-- TOC entry 3566 (class 2606 OID 16432)
-- Name: EquipmentItem EquipmentItem_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3756 (class 2606 OID 17119)
-- Name: EventSubClient EventSubClient_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EventSubClient"
    ADD CONSTRAINT "EventSubClient_pkey" PRIMARY KEY (id);


--
-- TOC entry 3582 (class 2606 OID 16458)
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- TOC entry 3622 (class 2606 OID 16565)
-- Name: Fee Fee_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_userpg_dump: creating CONSTRAINT "public.FileActivity FileActivity_pkey"
pg_dump: creating CONSTRAINT "public.FileShare FileShare_pkey"
pg_dump: creating CONSTRAINT "public.FileTag FileTag_pkey"
pg_dump: creating CONSTRAINT "public.FileVersion FileVersion_pkey"
pg_dump: creating CONSTRAINT "public.FolderShare FolderShare_pkey"

--

ALTER TABLE ONLY public."Fee"
    ADD CONSTRAINT "Fee_pkey" PRIMARY KEY (id);


--
-- TOC entry 3694 (class 2606 OID 16810)
-- Name: FileActivity FileActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileActivity"
    ADD CONSTRAINT "FileActivity_pkey" PRIMARY KEY (id);


--
-- TOC entry 3676 (class 2606 OID 16785)
-- Name: FileShare FileShare_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileShare"
    ADD CONSTRAINT "FileShare_pkey" PRIMARY KEY (id);


--
-- TOC entry 3714 (class 2606 OID 16952)
-- Name: FileTag FileTag_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileTag"
    ADD CONSTRAINT "FileTag_pkey" PRIMARY KEY (id);


--
-- TOC entry 3688 (class 2606 OID 16802)
-- Name: FileVersion FileVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileVersion"
    ADD CONSTRAINT "FileVersion_pkey" PRIMARY KEY (id);


--
-- TOC entry 3682 (class 2606 OID 16794)
pg_dump: creating CONSTRAINT "public.FolderTag FolderTag_pkey"
pg_dump: creating CONSTRAINT "public.JobReference JobReference_pkey"
pg_dump: creating CONSTRAINT "public.MaintenanceLog MaintenanceLog_pkey"
pg_dump: creating CONSTRAINT "public.NotificationPreference NotificationPreference_pkey"
pg_dump: creating CONSTRAINT "public.Notification Notification_pkey"
pg_dump: creating CONSTRAINT "public.Partner Partner_pkey"
pg_dump: creating CONSTRAINT "public.QuotaChangeHistory QuotaChangeHistory_pkey"
pg_dump: creating CONSTRAINT "public.QuoteItem QuoteItem_pkey"
pg_dump: creating CONSTRAINT "public.Quote Quote_pkey"
-- Name: FolderShare FolderShare_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderShare"
    ADD CONSTRAINT "FolderShare_pkey" PRIMARY KEY (id);


--
-- TOC entry 3719 (class 2606 OID 16960)
-- Name: FolderTag FolderTag_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderTag"
    ADD CONSTRAINT "FolderTag_pkey" PRIMARY KEY (id);


--
-- TOC entry 3703 (class 2606 OID 16914)
-- Name: JobReference JobReference_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_pkey" PRIMARY KEY (id);


--
-- TOC entry 3571 (class 2606 OID 16440)
-- Name: MaintenanceLog MaintenanceLog_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."MaintenanceLog"
    ADD CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 3749 (class 2606 OID 17095)
-- Name: NotificationPreference NotificationPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY (id);


--
-- TOC entry 3628 (class 2606 OID 16575)
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- TOC entry 3652 (class 2606 OID 16725)
-- Name: Partner Partner_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_pkey" PRIMARY KEY (id);


--
-- TOC entry 3729 (class 2606 OID 17018)
-- Name: QuotaChangeHistory QuotaChangeHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuotaChangeHistory"
    ADD CONSTRAINT "QuotaChangeHistory_pkey" PRIMARY KEY (id);


--
-- TOC entry 3594 (class 2606 OID 16488)
-- Name: QuoteItem QuoteItem_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_pkey" PRIMARY KEY (id);


pg_dump: creating CONSTRAINT "public.Rental Rental_pkey"
pg_dump: creating CONSTRAINT "public.Service Service_pkey"
pg_dump: creating CONSTRAINT "public.StorageQuota StorageQuota_pkey"
pg_dump: creating CONSTRAINT "public.Subcategory Subcategory_pkey"
--
-- TOC entry 3588 (class 2606 OID 16480)
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- TOC entry 3585 (class 2606 OID 16466)
-- Name: Rental Rental_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_pkey" PRIMARY KEY (id);


--
-- TOC entry 3617 (class 2606 OID 16554)
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- TOC entry 3697 (class 2606 OID 16820)
-- Name: StorageQuota StorageQuota_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."StorageQuota"
    ADD CONSTRAINT "StorageQuota_pkey" PRIMARY KEY (id);


--
-- TOC entry 3562 (class 2606 OID 16422)
-- Name: Subcategory Subcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_userpg_dump: creating CONSTRAINT "public.Subrental Subrental_pkey"
pg_dump: creating CONSTRAINT "public.TagDefinition TagDefinition_pkey"
pg_dump: creating CONSTRAINT "public.TranslationHistory TranslationHistory_pkey"
pg_dump: creating CONSTRAINT "public.Translation Translation_pkey"
pg_dump: creating CONSTRAINT "public.UserSession UserSession_pkey"
pg_dump: creating CONSTRAINT "public.User User_pkey"
pg_dump: creating CONSTRAINT "public._prisma_migrations _prisma_migrations_pkey"
pg_dump:
--

ALTER TABLE ONLY public."Subcategory"
    ADD CONSTRAINT "Subcategory_pkey" PRIMARY KEY (id);


--
-- TOC entry 3657 (class 2606 OID 16736)
-- Name: Subrental Subrental_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subrental"
    ADD CONSTRAINT "Subrental_pkey" PRIMARY KEY (id);


--
-- TOC entry 3710 (class 2606 OID 16944)
-- Name: TagDefinition TagDefinition_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TagDefinition"
    ADD CONSTRAINT "TagDefinition_pkey" PRIMARY KEY (id);


--
-- TOC entry 3644 (class 2606 OID 16701)
-- Name: TranslationHistory TranslationHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TranslationHistory"
    ADD CONSTRAINT "TranslationHistory_pkey" PRIMARY KEY (id);


--
-- TOC entry 3635 (class 2606 OID 16683)
-- Name: Translation Translation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Translation"
    ADD CONSTRAINT "Translation_pkey" PRIMARY KEY (id);


 creating CONSTRAINT "public.customization_settings customization_settings_pkey"
pg_dump: creating INDEX "public.ActivityLog_action_idx"
pg_dump: creating INDEX "public.ActivityLog_createdAt_idx"
pg_dump: creating INDEX "public.ActivityLog_entityType_idx"
pg_dump: creating INDEX "public.ActivityLog_userId_idx"
pg_dump: creating INDEX "public.BackupJob_createdAt_idx"
--
-- TOC entry 3599 (class 2606 OID 16527)
-- Name: UserSession UserSession_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."UserSession"
    ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY (id);


--
-- TOC entry 3552 (class 2606 OID 16404)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3548 (class 2606 OID 16393)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3596 (class 2606 OID 16518)
-- Name: customization_settings customization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public.customization_settings
    ADD CONSTRAINT customization_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3603 (class 1259 OID 16605)
-- Name: ActivityLog_action_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_action_idx" ON public."ActivityLog" USING btree (action);


--
-- TOC entry 3604 (class 1259 OID 16607)
-- Name: ActivityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_createdAt_idx" ON public."ActivityLog" USING btree ("createdAt");


--
-- TOC entry 3605 (class 1259 OID 16606)
-- Name: ActivityLog_entityType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_entityType_idx" ON public."ActivityLog" USING btree ("entityType");


--
-- TOC entry 3608 (class 1259 OID 16604)
-- Name: ActivityLog_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_userId_idx" ON public."ActivityLog" USING btree ("userId");


--
-- TOC entry 3731 (class 1259 OID 17032)
-- Name: BackupJob_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BackupJob_createdAt_idx" ON public."BackupJob" USING btree ("createdAt");


pg_dump: creating INDEX "public.BackupJob_jobType_idx"
pg_dump: creating INDEX "public.BackupJob_status_idx"
pg_dump: creating INDEX "public.BatchOperation_initiatedAt_idx"
pg_dump: creating INDEX "public.BatchOperation_performedBy_idx"
pg_dump: creating INDEX "public.BatchOperation_status_idx"
pg_dump: creating INDEX "public.CatalogShareInquiry_catalogShareId_idx"
pg_dump: creating INDEX "public.CatalogShareInquiry_createdAt_idx"
--
-- TOC entry 3732 (class 1259 OID 17030)
-- Name: BackupJob_jobType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BackupJob_jobType_idx" ON public."BackupJob" USING btree ("jobType");


--
-- TOC entry 3735 (class 1259 OID 17031)
-- Name: BackupJob_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BackupJob_status_idx" ON public."BackupJob" USING btree (status);


--
-- TOC entry 3721 (class 1259 OID 16980)
-- Name: BatchOperation_initiatedAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BatchOperation_initiatedAt_idx" ON public."BatchOperation" USING btree ("initiatedAt");


--
-- TOC entry 3722 (class 1259 OID 16978)
-- Name: BatchOperation_performedBy_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BatchOperation_performedBy_idx" ON public."BatchOperation" USING btree ("performedBy");


--
-- TOC entry 3725 (class 1259 OID 16979)
-- Name: BatchOperation_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BatchOperation_status_idx" ON public."BatchOperation" USING btree (status);


--
-- TOC entry 3742 (class 1259 OID 17065)
-- Name: CatalogShareInquiry_catalogShareId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_catalogShareId_idx" ON public."CatalogShareInquiry" USING btree ("catalogShareId");


--
-- TOC entry 3743 (class 1259 OID 17068)
-- Name: CatalogShareInquiry_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_createdAt_idx" ON public."CatalogShareInquiry" USING btree ("createdAt");


--
-- TOC entry 3744 (class 1259 OID 17066)
-- Name: CatalogShareInquiry_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_partnerId_idx" ON public."CatalogShareInquiry" USING btree ("partnerId");


--
-- TOC entry 3747 (class 1259 OID 17067)
-- Name: CatalogShareInquiry_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_status_idx" ON public."CatalogShareInquiry" USING btree (status);


pg_dump: creating INDEX "public.CatalogShareInquiry_partnerId_idx"
pg_dump: creating INDEX "public.CatalogShareInquiry_status_idx"
pg_dump: creating INDEX "public.CatalogShare_expiresAt_idx"
pg_dump: creating INDEX "public.CatalogShare_partnerId_idx"
pg_dump: creating INDEX "public.CatalogShare_token_idx"
pg_dump: creating INDEX "public.CatalogShare_token_key"
pg_dump: creating INDEX "public.Category_name_idx"
pg_dump: creating INDEX "public.Client_email_idx"
pg_dump: creating INDEX "public.Client_name_idx"
pg_dump: creating INDEX "public.Client_partnerId_idx"
pg_dump: creating INDEX "public.CloudFile_createdAt_idx"
pg_dump: creating INDEX "public.CloudFile_folderId_idx"
--
-- TOC entry 3736 (class 1259 OID 17050)
-- Name: CatalogShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShare_expiresAt_idx" ON public."CatalogShare" USING btree ("expiresAt");


--
-- TOC entry 3737 (class 1259 OID 17049)
-- Name: CatalogShare_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShare_partnerId_idx" ON public."CatalogShare" USING btree ("partnerId");


--
-- TOC entry 3740 (class 1259 OID 17048)
-- Name: CatalogShare_token_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShare_token_idx" ON public."CatalogShare" USING btree (token);


--
-- TOC entry 3741 (class 1259 OID 17047)
-- Name: CatalogShare_token_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "CatalogShare_token_key" ON public."CatalogShare" USING btree (token);


--
-- TOC entry 3556 (class 1259 OID 16581)
-- Name: Category_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Category_name_idx" ON public."Category" USING btree (name);


--
-- TOC entry 3572 (class 1259 OID 16590)
-- Name: Client_email_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Client_email_idx" ON public."Client" USING btree (email);


--
-- TOC entry 3573 (class 1259 OID 16589)
-- Name: Client_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Client_name_idx" ON public."Client" USING btree (name);


--
-- TOC entry 3574 (class 1259 OID 17143)
-- Name: Client_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Client_partnerId_idx" ON public."Client" USING btree ("partnerId");


--
-- TOC entry 3666 (class 1259 OID 16829)
-- Name: CloudFile_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_createdAt_idx" ON public."CloudFile" USING btree ("createdAt");


--
-- TOC entry 3667 (class 1259 OID 16826)
-- Name: CloudFile_folderId_idx; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.CloudFile_isStarred_idx"
pg_dump: creating INDEX "public.CloudFile_isTrashed_idx"
pg_dump: creating INDEX "public.CloudFile_ownerId_idx"
pg_dump: creating INDEX "public.CloudFolder_isStarred_idx"
pg_dump: creating INDEX "public.CloudFolder_isTrashed_idx"

--

CREATE INDEX "CloudFile_folderId_idx" ON public."CloudFile" USING btree ("folderId");


--
-- TOC entry 3668 (class 1259 OID 16828)
-- Name: CloudFile_isStarred_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_isStarred_idx" ON public."CloudFile" USING btree ("isStarred");


--
-- TOC entry 3669 (class 1259 OID 16827)
-- Name: CloudFile_isTrashed_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_isTrashed_idx" ON public."CloudFile" USING btree ("isTrashed");


--
-- TOC entry 3670 (class 1259 OID 16825)
-- Name: CloudFile_ownerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_ownerId_idx" ON public."CloudFile" USING btree ("ownerId");


--
-- TOC entry 3660 (class 1259 OID 16824)
-- Name: CloudFolder_isStarred_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_isStarred_idx" ON public."CloudFolder" USING btree ("isStarred");


--
-- TOC entry 3661 (class 1259 OID 16823)
pg_dump: creating INDEX "public.CloudFolder_ownerId_idx"
pg_dump: creating INDEX "public.CloudFolder_parentId_idx"
pg_dump: creating INDEX "public.DataSyncEvent_createdAt_idx"
pg_dump: creating INDEX "public.DataSyncEvent_entityType_idx"
pg_dump: creating INDEX "public.DataSyncEvent_processed_idx"
pg_dump: creating INDEX "public.EquipmentItem_categoryId_idx"
-- Name: CloudFolder_isTrashed_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_isTrashed_idx" ON public."CloudFolder" USING btree ("isTrashed");


--
-- TOC entry 3662 (class 1259 OID 16821)
-- Name: CloudFolder_ownerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_ownerId_idx" ON public."CloudFolder" USING btree ("ownerId");


--
-- TOC entry 3663 (class 1259 OID 16822)
-- Name: CloudFolder_parentId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_parentId_idx" ON public."CloudFolder" USING btree ("parentId");


--
-- TOC entry 3609 (class 1259 OID 16610)
-- Name: DataSyncEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "DataSyncEvent_createdAt_idx" ON public."DataSyncEvent" USING btree ("createdAt");


--
-- TOC entry 3610 (class 1259 OID 16608)
-- Name: DataSyncEvent_entityType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "DataSyncEvent_entityType_idx" ON public."DataSyncEvent" USING btree ("entityType");


pg_dump: creating INDEX "public.EquipmentItem_name_idx"
pg_dump: creating INDEX "public.EquipmentItem_status_idx"
pg_dump: creating INDEX "public.EquipmentItem_subcategoryId_idx"
pg_dump: creating INDEX "public.EquipmentItem_type_idx"
pg_dump: creating INDEX "public.EventSubClient_clientId_idx"
pg_dump: creating INDEX "public.EventSubClient_eventId_clientId_key"
--
-- TOC entry 3613 (class 1259 OID 16609)
-- Name: DataSyncEvent_processed_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "DataSyncEvent_processed_idx" ON public."DataSyncEvent" USING btree (processed);


--
-- TOC entry 3563 (class 1259 OID 16584)
-- Name: EquipmentItem_categoryId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_categoryId_idx" ON public."EquipmentItem" USING btree ("categoryId");


--
-- TOC entry 3564 (class 1259 OID 16588)
-- Name: EquipmentItem_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_name_idx" ON public."EquipmentItem" USING btree (name);


--
-- TOC entry 3567 (class 1259 OID 16586)
-- Name: EquipmentItem_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_status_idx" ON public."EquipmentItem" USING btree (status);


--
-- TOC entry 3568 (class 1259 OID 16585)
-- Name: EquipmentItem_subcategoryId_idx; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.EventSubClient_eventId_idx"

--

CREATE INDEX "EquipmentItem_subcategoryId_idx" ON public."EquipmentItem" USING btree ("subcategoryId");


--
-- TOC entry 3569 (class 1259 OID 16587)
-- Name: EquipmentItem_type_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_type_idx" ON public."EquipmentItem" USING btree (type);


--
-- TOC entry 3752 (class 1259 OID 17132)
-- Name: EventSubClient_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EventSubClient_clientId_idx" ON public."EventSubClient" USING btree ("clientId");


--
-- TOC entry 3753 (class 1259 OID 17130)
-- Name: EventSubClient_eventId_clientId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "EventSubClient_eventId_clientId_key" ON public."EventSubClient" USING btree ("eventId", "clientId");


--
-- TOC entry 3754 (class 1259 OID 17131)
-- Name: EventSubClient_eventId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EventSubClient_eventId_idx" ON public."EventSubClient" USING btree ("eventId");


pg_dump: creating INDEX "public.Event_agencyId_idx"
pg_dump: creating INDEX "public.Event_assignedTo_idx"
pg_dump: creating INDEX "public.Event_clientId_idx"
pg_dump: creating INDEX "public.Event_endDate_idx"
pg_dump: creating INDEX "public.Event_startDate_idx"
--
-- TOC entry 3577 (class 1259 OID 17106)
-- Name: Event_agencyId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_agencyId_idx" ON public."Event" USING btree ("agencyId");


--
-- TOC entry 3578 (class 1259 OID 16594)
-- Name: Event_assignedTo_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_assignedTo_idx" ON public."Event" USING btree ("assignedTo");


--
-- TOC entry 3579 (class 1259 OID 16591)
-- Name: Event_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_clientId_idx" ON public."Event" USING btree ("clientId");


--
-- TOC entry 3580 (class 1259 OID 16593)
-- Name: Event_endDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_endDate_idx" ON public."Event" USING btree ("endDate");


--
-- TOC entry 3583 (class 1259 OID 16592)
-- Name: Event_startDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_startDate_idx" ON public."Event" USING btree ("startDate");


pg_dump: creating INDEX "public.Fee_category_idx"
pg_dump: creating INDEX "public.Fee_isActive_idx"
pg_dump: creating INDEX "public.Fee_isRequired_idx"
pg_dump: creating INDEX "public.FileActivity_action_idx"
pg_dump: creating INDEX "public.FileActivity_createdAt_idx"
--
-- TOC entry 3618 (class 1259 OID 16615)
-- Name: Fee_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Fee_category_idx" ON public."Fee" USING btree (category);


--
-- TOC entry 3619 (class 1259 OID 16613)
-- Name: Fee_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Fee_isActive_idx" ON public."Fee" USING btree ("isActive");


--
-- TOC entry 3620 (class 1259 OID 16614)
-- Name: Fee_isRequired_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Fee_isRequired_idx" ON public."Fee" USING btree ("isRequired");


--
-- TOC entry 3690 (class 1259 OID 16842)
-- Name: FileActivity_action_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_action_idx" ON public."FileActivity" USING btree (action);


--
-- TOC entry 3691 (class 1259 OID 16843)
-- Name: FileActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_createdAt_idx" ON public."FileActivity" USING btree ("createdAt");


pg_dump: creating INDEX "public.FileActivity_fileId_idx"
pg_dump: creating INDEX "public.FileActivity_userId_idx"
pg_dump: creating INDEX "public.FileShare_expiresAt_idx"
pg_dump: creating INDEX "public.FileShare_fileId_idx"
pg_dump: creating INDEX "public.FileShare_shareToken_idx"
--
-- TOC entry 3692 (class 1259 OID 16840)
-- Name: FileActivity_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_fileId_idx" ON public."FileActivity" USING btree ("fileId");


--
-- TOC entry 3695 (class 1259 OID 16841)
-- Name: FileActivity_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_userId_idx" ON public."FileActivity" USING btree ("userId");


--
-- TOC entry 3673 (class 1259 OID 16833)
-- Name: FileShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileShare_expiresAt_idx" ON public."FileShare" USING btree ("expiresAt");


--
-- TOC entry 3674 (class 1259 OID 16831)
-- Name: FileShare_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileShare_fileId_idx" ON public."FileShare" USING btree ("fileId");


--
-- TOC entry 3677 (class 1259 OID 16832)
-- Name: FileShare_shareToken_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileShare_shareToken_idx" ON public."FileShare" USING btree ("shareToken");


pg_dump: creating INDEX "public.FileShare_shareToken_key"
pg_dump: creating INDEX "public.FileTag_fileId_idx"
pg_dump: creating INDEX "public.FileTag_fileId_tagId_key"
pg_dump: creating INDEX "public.FileTag_tagId_idx"
pg_dump: creating INDEX "public.FileVersion_fileId_idx"
--
-- TOC entry 3678 (class 1259 OID 16830)
-- Name: FileShare_shareToken_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FileShare_shareToken_key" ON public."FileShare" USING btree ("shareToken");


--
-- TOC entry 3711 (class 1259 OID 16973)
-- Name: FileTag_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileTag_fileId_idx" ON public."FileTag" USING btree ("fileId");


--
-- TOC entry 3712 (class 1259 OID 16972)
-- Name: FileTag_fileId_tagId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FileTag_fileId_tagId_key" ON public."FileTag" USING btree ("fileId", "tagId");


--
-- TOC entry 3715 (class 1259 OID 16974)
-- Name: FileTag_tagId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileTag_tagId_idx" ON public."FileTag" USING btree ("tagId");


--
-- TOC entry 3685 (class 1259 OID 16839)
-- Name: FileVersion_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileVersion_fileId_idx" ON public."FileVersion" USING btree ("fileId");


pg_dump: creating INDEX "public.FileVersion_fileId_versionNum_key"
pg_dump: creating INDEX "public.FileVersion_versionNum_idx"
pg_dump: creating INDEX "public.FolderShare_expiresAt_idx"
pg_dump: creating INDEX "public.FolderShare_folderId_idx"
pg_dump: creating INDEX "public.FolderShare_shareToken_idx"
pg_dump: creating INDEX "public.FolderShare_shareToken_key"
pg_dump: creating INDEX "public.FolderTag_folderId_idx"
pg_dump: creating INDEX "public.FolderTag_folderId_tagId_key"
pg_dump: --
-- TOC entry 3686 (class 1259 OID 16838)
-- Name: FileVersion_fileId_versionNum_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FileVersion_fileId_versionNum_key" ON public."FileVersion" USING btree ("fileId", "versionNum");


--
-- TOC entry 3689 (class 1259 OID 17033)
-- Name: FileVersion_versionNum_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileVersion_versionNum_idx" ON public."FileVersion" USING btree ("versionNum");


--
-- TOC entry 3679 (class 1259 OID 16837)
-- Name: FolderShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderShare_expiresAt_idx" ON public."FolderShare" USING btree ("expiresAt");


--
-- TOC entry 3680 (class 1259 OID 16835)
-- Name: FolderShare_folderId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderShare_folderId_idx" ON public."FolderShare" USING btree ("folderId");


--
-- TOC entry 3683 (class 1259 OID 16836)
-- Name: FolderShare_shareToken_idx; Type: INDEX; Schema: public; Owner: avrentals_usercreating INDEX "public.FolderTag_tagId_idx"
pg_dump: creating INDEX "public.JobReference_eventId_idx"

--

CREATE INDEX "FolderShare_shareToken_idx" ON public."FolderShare" USING btree ("shareToken");


--
-- TOC entry 3684 (class 1259 OID 16834)
-- Name: FolderShare_shareToken_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FolderShare_shareToken_key" ON public."FolderShare" USING btree ("shareToken");


--
-- TOC entry 3716 (class 1259 OID 16976)
-- Name: FolderTag_folderId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderTag_folderId_idx" ON public."FolderTag" USING btree ("folderId");


--
-- TOC entry 3717 (class 1259 OID 16975)
-- Name: FolderTag_folderId_tagId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FolderTag_folderId_tagId_key" ON public."FolderTag" USING btree ("folderId", "tagId");


--
-- TOC entry 3720 (class 1259 OID 16977)
-- Name: FolderTag_tagId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderTag_tagId_idx" ON public."FolderTag" USING btree ("tagId");


--
-- TOC entry 3700 (class 1259 OID 16917)
pg_dump: creating INDEX "public.JobReference_partnerId_idx"
pg_dump: creating INDEX "public.JobReference_quoteId_idx"
pg_dump: creating INDEX "public.JobReference_referralDate_idx"
pg_dump: creating INDEX "public.JobReference_status_idx"
-- Name: JobReference_eventId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_eventId_idx" ON public."JobReference" USING btree ("eventId");


--
-- TOC entry 3701 (class 1259 OID 16916)
-- Name: JobReference_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_partnerId_idx" ON public."JobReference" USING btree ("partnerId");


--
-- TOC entry 3704 (class 1259 OID 16918)
-- Name: JobReference_quoteId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_quoteId_idx" ON public."JobReference" USING btree ("quoteId");


--
-- TOC entry 3705 (class 1259 OID 16920)
-- Name: JobReference_referralDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_referralDate_idx" ON public."JobReference" USING btree ("referralDate");


--
-- TOC entry 3706 (class 1259 OID 16919)
-- Name: JobReference_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_status_idx" ON public."JobReference" USING btree (status);


pg_dump: creating INDEX "public.NotificationPreference_userId_idx"
pg_dump: creating INDEX "public.NotificationPreference_userId_key"
pg_dump: creating INDEX "public.Notification_createdAt_idx"
pg_dump: creating INDEX "public.Notification_expiresAt_idx"
pg_dump: creating INDEX "public.Notification_groupKey_idx"
--
-- TOC entry 3750 (class 1259 OID 17097)
-- Name: NotificationPreference_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "NotificationPreference_userId_idx" ON public."NotificationPreference" USING btree ("userId");


--
-- TOC entry 3751 (class 1259 OID 17096)
-- Name: NotificationPreference_userId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON public."NotificationPreference" USING btree ("userId");


--
-- TOC entry 3623 (class 1259 OID 16619)
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- TOC entry 3624 (class 1259 OID 17100)
-- Name: Notification_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_expiresAt_idx" ON public."Notification" USING btree ("expiresAt");


--
-- TOC entry 3625 (class 1259 OID 17099)
-- Name: Notification_groupKey_idx; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.Notification_isRead_idx"
pg_dump: creating INDEX "public.Notification_priority_idx"
pg_dump: creating INDEX "public.Notification_type_idx"
pg_dump: creating INDEX "public.Notification_userId_idx"
pg_dump: creating INDEX "public.Partner_clientId_idx"
pg_dump: creating INDEX "public.Partner_isActive_idx"
pg_dump: 
--

CREATE INDEX "Notification_groupKey_idx" ON public."Notification" USING btree ("groupKey");


--
-- TOC entry 3626 (class 1259 OID 16617)
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- TOC entry 3629 (class 1259 OID 17098)
-- Name: Notification_priority_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_priority_idx" ON public."Notification" USING btree (priority);


--
-- TOC entry 3630 (class 1259 OID 16618)
-- Name: Notification_type_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_type_idx" ON public."Notification" USING btree (type);


--
-- TOC entry 3631 (class 1259 OID 16616)
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- TOC entry 3647 (class 1259 OID 16897)
creating INDEX "public.Partner_name_idx"
pg_dump: creating INDEX "public.Partner_partnerType_idx"
pg_dump: creating INDEX "public.QuotaChangeHistory_changedAt_idx"
-- Name: Partner_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_clientId_idx" ON public."Partner" USING btree ("clientId");


--
-- TOC entry 3648 (class 1259 OID 16738)
-- Name: Partner_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_isActive_idx" ON public."Partner" USING btree ("isActive");


--
-- TOC entry 3649 (class 1259 OID 16737)
-- Name: Partner_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_name_idx" ON public."Partner" USING btree (name);


--
-- TOC entry 3650 (class 1259 OID 16915)
-- Name: Partner_partnerType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_partnerType_idx" ON public."Partner" USING btree ("partnerType");


--
-- TOC entry 3726 (class 1259 OID 17028)
-- Name: QuotaChangeHistory_changedAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "QuotaChangeHistory_changedAt_idx" ON public."QuotaChangeHistory" USING btree ("changedAt");


pg_dump: creating INDEX "public.QuotaChangeHistory_changedBy_idx"
pg_dump: creating INDEX "public.QuotaChangeHistory_userId_idx"
pg_dump: creating INDEX "public.Quote_clientId_idx"
pg_dump: creating INDEX "public.Quote_quoteNumber_idx"
pg_dump: creating INDEX "public.Quote_quoteNumber_key"
--
-- TOC entry 3727 (class 1259 OID 17029)
-- Name: QuotaChangeHistory_changedBy_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "QuotaChangeHistory_changedBy_idx" ON public."QuotaChangeHistory" USING btree ("changedBy");


--
-- TOC entry 3730 (class 1259 OID 17027)
-- Name: QuotaChangeHistory_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "QuotaChangeHistory_userId_idx" ON public."QuotaChangeHistory" USING btree ("userId");


--
-- TOC entry 3586 (class 1259 OID 16596)
-- Name: Quote_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_clientId_idx" ON public."Quote" USING btree ("clientId");


--
-- TOC entry 3589 (class 1259 OID 16599)
-- Name: Quote_quoteNumber_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_quoteNumber_idx" ON public."Quote" USING btree ("quoteNumber");


--
-- TOC entry 3590 (class 1259 OID 16595)
-- Name: Quote_quoteNumber_key; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.Quote_startDate_idx"
pg_dump: creating INDEX "public.Quote_status_idx"
pg_dump: creating INDEX "public.Service_category_idx"
pg_dump: creating INDEX "public.Service_isActive_idx"
pg_dump: creating INDEX "public.StorageQuota_userId_idx"
pg_dump: creating INDEX "public.StorageQuota_userId_key"
pg_dump: creating INDEX "public.Subcategory_name_idx"
pg_dump: creating INDEX "public.Subcategory_parentId_idx"
pg_dump: creating INDEX "public.Subrental_endDate_idx"

--

CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON public."Quote" USING btree ("quoteNumber");


--
-- TOC entry 3591 (class 1259 OID 16598)
-- Name: Quote_startDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_startDate_idx" ON public."Quote" USING btree ("startDate");


--
-- TOC entry 3592 (class 1259 OID 16597)
-- Name: Quote_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_status_idx" ON public."Quote" USING btree (status);


--
-- TOC entry 3614 (class 1259 OID 16612)
-- Name: Service_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Service_category_idx" ON public."Service" USING btree (category);


--
-- TOC entry 3615 (class 1259 OID 16611)
-- Name: Service_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Service_isActive_idx" ON public."Service" USING btree ("isActive");


--
-- TOC entry 3698 (class 1259 OID 16845)
-- Name: StorageQuota_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.Subrental_eventId_idx"

--

CREATE INDEX "StorageQuota_userId_idx" ON public."StorageQuota" USING btree ("userId");


--
-- TOC entry 3699 (class 1259 OID 16844)
-- Name: StorageQuota_userId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "StorageQuota_userId_key" ON public."StorageQuota" USING btree ("userId");


--
-- TOC entry 3559 (class 1259 OID 16583)
-- Name: Subcategory_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subcategory_name_idx" ON public."Subcategory" USING btree (name);


--
-- TOC entry 3560 (class 1259 OID 16582)
-- Name: Subcategory_parentId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subcategory_parentId_idx" ON public."Subcategory" USING btree ("parentId");


--
-- TOC entry 3653 (class 1259 OID 16743)
-- Name: Subrental_endDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_endDate_idx" ON public."Subrental" USING btree ("endDate");


--
-- TOC entry 3654 (class 1259 OID 16740)
-- Name: Subrental_eventId_idx; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.Subrental_partnerId_idx"
pg_dump: creating INDEX "public.Subrental_startDate_idx"
pg_dump: creating INDEX "public.Subrental_status_idx"
pg_dump: creating INDEX "public.TagDefinition_ownerId_idx"
pg_dump: creating INDEX "public.TagDefinition_ownerId_name_key"

--

CREATE INDEX "Subrental_eventId_idx" ON public."Subrental" USING btree ("eventId");


--
-- TOC entry 3655 (class 1259 OID 16739)
-- Name: Subrental_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_partnerId_idx" ON public."Subrental" USING btree ("partnerId");


--
-- TOC entry 3658 (class 1259 OID 16742)
-- Name: Subrental_startDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_startDate_idx" ON public."Subrental" USING btree ("startDate");


--
-- TOC entry 3659 (class 1259 OID 16741)
-- Name: Subrental_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_status_idx" ON public."Subrental" USING btree (status);


--
-- TOC entry 3707 (class 1259 OID 16970)
-- Name: TagDefinition_ownerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TagDefinition_ownerId_idx" ON public."TagDefinition" USING btree ("ownerId");


--
-- TOC entry 3708 (class 1259 OID 16971)
-- Name: TagDefinition_ownerId_name_key; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.TranslationHistory_createdAt_idx"
pg_dump: creating INDEX "public.TranslationHistory_translationId_idx"
pg_dump: creating INDEX "public.TranslationHistory_version_idx"
pg_dump: creating INDEX "public.Translation_category_idx"

--

CREATE UNIQUE INDEX "TagDefinition_ownerId_name_key" ON public."TagDefinition" USING btree ("ownerId", name);


--
-- TOC entry 3642 (class 1259 OID 16704)
-- Name: TranslationHistory_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationHistory_createdAt_idx" ON public."TranslationHistory" USING btree ("createdAt");


--
-- TOC entry 3645 (class 1259 OID 16702)
-- Name: TranslationHistory_translationId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationHistory_translationId_idx" ON public."TranslationHistory" USING btree ("translationId");


--
-- TOC entry 3646 (class 1259 OID 16703)
-- Name: TranslationHistory_version_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationHistory_version_idx" ON public."TranslationHistory" USING btree (version);


--
-- TOC entry 3632 (class 1259 OID 16706)
-- Name: Translation_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_category_idx" ON public."Translation" USING btree (category);


pg_dump: creating INDEX "public.Translation_needsReview_idx"
pg_dump: creating INDEX "public.Translation_qualityScore_idx"
pg_dump: creating INDEX "public.Translation_sourceText_idx"
pg_dump: creating INDEX "public.Translation_sourceText_targetLang_key"
pg_dump: creating INDEX "public.Translation_status_idx"
pg_dump: creating INDEX "public.Translation_targetLang_idx"
--
-- TOC entry 3633 (class 1259 OID 16708)
-- Name: Translation_needsReview_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_needsReview_idx" ON public."Translation" USING btree ("needsReview");


--
-- TOC entry 3636 (class 1259 OID 16707)
-- Name: Translation_qualityScore_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_qualityScore_idx" ON public."Translation" USING btree ("qualityScore");


--
-- TOC entry 3637 (class 1259 OID 16684)
-- Name: Translation_sourceText_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_sourceText_idx" ON public."Translation" USING btree ("sourceText");


--
-- TOC entry 3638 (class 1259 OID 16686)
-- Name: Translation_sourceText_targetLang_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "Translation_sourceText_targetLang_key" ON public."Translation" USING btree ("sourceText", "targetLang");


--
-- TOC entry 3639 (class 1259 OID 16705)
-- Name: Translation_status_idx; Type: INDEX; Schema: public; Owner: avrentals_userpg_dump: creating INDEX "public.Translation_usageCount_idx"
pg_dump: creating INDEX "public.UserSession_expiresAt_idx"
pg_dump: creating INDEX "public.UserSession_token_idx"
pg_dump: creating INDEX "public.UserSession_token_key"

--

CREATE INDEX "Translation_status_idx" ON public."Translation" USING btree (status);


--
-- TOC entry 3640 (class 1259 OID 16685)
-- Name: Translation_targetLang_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_targetLang_idx" ON public."Translation" USING btree ("targetLang");


--
-- TOC entry 3641 (class 1259 OID 16709)
-- Name: Translation_usageCount_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_usageCount_idx" ON public."Translation" USING btree ("usageCount");


--
-- TOC entry 3597 (class 1259 OID 16603)
-- Name: UserSession_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "UserSession_expiresAt_idx" ON public."UserSession" USING btree ("expiresAt");


--
-- TOC entry 3600 (class 1259 OID 16602)
-- Name: UserSession_token_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "UserSession_token_idx" ON public."UserSession" USING btree (token);


--
-- TOC entry 3601 (class 1259 OID 16600)
pg_dump: creating INDEX "public.UserSession_userId_idx"
pg_dump: creating INDEX "public.User_isActive_idx"
pg_dump: creating INDEX "public.User_isTeamMember_idx"
pg_dump: creating INDEX "public.User_role_idx"
pg_dump: creating INDEX "public.User_username_idx"
-- Name: UserSession_token_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "UserSession_token_key" ON public."UserSession" USING btree (token);


--
-- TOC entry 3602 (class 1259 OID 16601)
-- Name: UserSession_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "UserSession_userId_idx" ON public."UserSession" USING btree ("userId");


--
-- TOC entry 3549 (class 1259 OID 16579)
-- Name: User_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_isActive_idx" ON public."User" USING btree ("isActive");


--
-- TOC entry 3550 (class 1259 OID 16580)
-- Name: User_isTeamMember_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_isTeamMember_idx" ON public."User" USING btree ("isTeamMember");


--
-- TOC entry 3553 (class 1259 OID 16578)
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- TOC entry 3554 (class 1259 OID 16577)
pg_dump: creating INDEX "public.User_username_key"
pg_dump: creating FK CONSTRAINT "public.BatchOperation BatchOperation_performedBy_fkey"
pg_dump: creating FK CONSTRAINT "public.CatalogShareInquiry CatalogShareInquiry_catalogShareId_fkey"
pg_dump: creating FK CONSTRAINT "public.CatalogShareInquiry CatalogShareInquiry_partnerId_fkey"
pg_dump: creating FK CONSTRAINT "public.CatalogShare CatalogShare_partnerId_fkey"
pg_dump: creating FK CONSTRAINT "public.Client Client_partnerId_fkey"
-- Name: User_username_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_username_idx" ON public."User" USING btree (username);


--
-- TOC entry 3555 (class 1259 OID 16576)
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- TOC entry 3792 (class 2606 OID 17006)
-- Name: BatchOperation BatchOperation_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."BatchOperation"
    ADD CONSTRAINT "BatchOperation_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3795 (class 2606 OID 17069)
-- Name: CatalogShareInquiry CatalogShareInquiry_catalogShareId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShareInquiry"
    ADD CONSTRAINT "CatalogShareInquiry_catalogShareId_fkey" FOREIGN KEY ("catalogShareId") REFERENCES public."CatalogShare"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3796 (class 2606 OID 17074)
-- Name: CatalogShareInquiry CatalogShareInquiry_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShareInquiry"
    ADD CONSTRAINT "CatalogShareInquiry_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3794 (class 2606 OID 17051)
-- Name: CatalogShare CatalogShare_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShare"
    ADD CONSTRAINT "CatalogShare_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3761 (class 2606 OID 17144)
-- Name: Client Client_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE SET NULL;


pg_dump: creating FK CONSTRAINT "public.CloudFile CloudFile_folderId_fkey"
pg_dump: creating FK CONSTRAINT "public.CloudFile CloudFile_ownerId_fkey"
pg_dump: creating FK CONSTRAINT "public.CloudFolder CloudFolder_ownerId_fkey"
pg_dump: creating FK CONSTRAINT "public.CloudFolder CloudFolder_parentId_fkey"
pg_dump: creating FK CONSTRAINT "public.EquipmentItem EquipmentItem_categoryId_fkey"
pg_dump: creating FK CONSTRAINT "public.EquipmentItem EquipmentItem_subcategoryId_fkey"
pg_dump: creating FK CONSTRAINT "public.EventSubClient EventSubClient_clientId_fkey"
--
-- TOC entry 3776 (class 2606 OID 16856)
-- Name: CloudFile CloudFile_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFile"
    ADD CONSTRAINT "CloudFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3777 (class 2606 OID 16861)
-- Name: CloudFile CloudFile_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFile"
    ADD CONSTRAINT "CloudFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3774 (class 2606 OID 16851)
-- Name: CloudFolder CloudFolder_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFolder"
    ADD CONSTRAINT "CloudFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3775 (class 2606 OID 16846)
-- Name: CloudFolder CloudFolder_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFolder"
    ADD CONSTRAINT "CloudFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3758 (class 2606 OID 16625)
-- Name: EquipmentItem EquipmentItem_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3759 (class 2606 OID 16630)
-- Name: EquipmentItem EquipmentItem_subcategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES public."Subcategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3798 (class 2606 OID 17125)
pg_dump: creating FK CONSTRAINT "public.EventSubClient EventSubClient_eventId_fkey"
pg_dump: creating FK CONSTRAINT "public.Event Event_agencyId_fkey"
pg_dump: creating FK CONSTRAINT "public.Event Event_clientId_fkey"
pg_dump: creating FK CONSTRAINT "public.FileActivity FileActivity_fileId_fkey"
-- Name: EventSubClient EventSubClient_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EventSubClient"
    ADD CONSTRAINT "EventSubClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3799 (class 2606 OID 17120)
-- Name: EventSubClient EventSubClient_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EventSubClient"
    ADD CONSTRAINT "EventSubClient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3762 (class 2606 OID 17107)
-- Name: Event Event_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3763 (class 2606 OID 16640)
-- Name: Event Event_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_userpg_dump: creating FK CONSTRAINT "public.FileActivity FileActivity_userId_fkey"
pg_dump: creating FK CONSTRAINT "public.FileShare FileShare_fileId_fkey"

--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3781 (class 2606 OID 16881)
-- Name: FileActivity FileActivity_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileActivity"
    ADD CONSTRAINT "FileActivity_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3782 (class 2606 OID 16886)
-- Name: FileActivity FileActivity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileActivity"
    ADD CONSTRAINT "FileActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3778 (class 2606 OID 16866)
-- Name: FileShare FileShare_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileShare"
    ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


pg_dump: creating FK CONSTRAINT "public.FileTag FileTag_fileId_fkey"
pg_dump: creating FK CONSTRAINT "public.FileTag FileTag_tagId_fkey"
pg_dump: creating FK CONSTRAINT "public.FileVersion FileVersion_fileId_fkey"
pg_dump: creating FK CONSTRAINT "public.FolderShare FolderShare_folderId_fkey"
--
-- TOC entry 3788 (class 2606 OID 16986)
-- Name: FileTag FileTag_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileTag"
    ADD CONSTRAINT "FileTag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3789 (class 2606 OID 16991)
-- Name: FileTag FileTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileTag"
    ADD CONSTRAINT "FileTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."TagDefinition"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3780 (class 2606 OID 16876)
-- Name: FileVersion FileVersion_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileVersion"
    ADD CONSTRAINT "FileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3779 (class 2606 OID 16871)
-- Name: FolderShare FolderShare_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_userpg_dump: creating FK CONSTRAINT "public.FolderTag FolderTag_folderId_fkey"
pg_dump: creating FK CONSTRAINT "public.FolderTag FolderTag_tagId_fkey"
pg_dump: creating FK CONSTRAINT "public.JobReference JobReference_eventId_fkey"
pg_dump: creating FK CONSTRAINT "public.JobReference JobReference_partnerId_fkey"
pg_dump: creating FK CONSTRAINT "public.JobReference JobReference_quoteId_fkey"

--

ALTER TABLE ONLY public."FolderShare"
    ADD CONSTRAINT "FolderShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3790 (class 2606 OID 16996)
-- Name: FolderTag FolderTag_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderTag"
    ADD CONSTRAINT "FolderTag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3791 (class 2606 OID 17001)
-- Name: FolderTag FolderTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderTag"
    ADD CONSTRAINT "FolderTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."TagDefinition"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3784 (class 2606 OID 16926)
-- Name: JobReference JobReference_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


pg_dump: creating FK CONSTRAINT "public.MaintenanceLog MaintenanceLog_equipmentId_fkey"
pg_dump: creating FK CONSTRAINT "public.NotificationPreference NotificationPreference_userId_fkey"
pg_dump: creating FK CONSTRAINT "public.Notification Notification_userId_fkey"
pg_dump: creating FK CONSTRAINT "public.Partner Partner_clientId_fkey"
pg_dump: creating FK CONSTRAINT "public.QuotaChangeHistory QuotaChangeHistory_userId_fkey"
--
-- TOC entry 3785 (class 2606 OID 16921)
-- Name: JobReference JobReference_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3786 (class 2606 OID 16931)
-- Name: JobReference JobReference_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3760 (class 2606 OID 16635)
-- Name: MaintenanceLog MaintenanceLog_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."MaintenanceLog"
    ADD CONSTRAINT "MaintenanceLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."EquipmentItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3797 (class 2606 OID 17101)
-- Name: NotificationPreference NotificationPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3769 (class 2606 OID 16670)
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3771 (class 2606 OID 16898)
-- Name: Partner Partner_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
pg_dump: creating FK CONSTRAINT "public.QuoteItem QuoteItem_equipmentId_fkey"
pg_dump: creating FK CONSTRAINT "public.QuoteItem QuoteItem_quoteId_fkey"
-- TOC entry 3793 (class 2606 OID 17034)
-- Name: QuotaChangeHistory QuotaChangeHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuotaChangeHistory"
    ADD CONSTRAINT "QuotaChangeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."StorageQuota"("userId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3767 (class 2606 OID 16665)
-- Name: QuoteItem QuoteItem_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."EquipmentItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3768 (class 2606 OID 16660)
-- Name: QuoteItem QuoteItem_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


pg_dump: creating FK CONSTRAINT "public.Quote Quote_clientId_fkey"
pg_dump: creating FK CONSTRAINT "public.Rental Rental_equipmentId_fkey"
pg_dump: creating FK CONSTRAINT "public.Rental Rental_eventId_fkey"
pg_dump: creating FK CONSTRAINT "public.StorageQuota StorageQuota_userId_fkey"
pg_dump: creating FK CONSTRAINT "public.Subcategory Subcategory_parentId_fkey"
pg_dump: creating FK CONSTRAINT "public.Subrental Subrental_eventId_fkey"
pg_dump: creating FK CONSTRAINT "public.Subrental Subrental_partnerId_fkey"
--
-- TOC entry 3766 (class 2606 OID 16655)
-- Name: Quote Quote_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3764 (class 2606 OID 16650)
-- Name: Rental Rental_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."EquipmentItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3765 (class 2606 OID 16645)
-- Name: Rental Rental_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3783 (class 2606 OID 16891)
-- Name: StorageQuota StorageQuota_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_userpg_dump: creating FK CONSTRAINT "public.TagDefinition TagDefinition_ownerId_fkey"
pg_dump: creating FK CONSTRAINT "public.TranslationHistory TranslationHistory_translationId_fkey"

--

ALTER TABLE ONLY public."StorageQuota"
    ADD CONSTRAINT "StorageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3757 (class 2606 OID 16620)
-- Name: Subcategory Subcategory_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subcategory"
    ADD CONSTRAINT "Subcategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3772 (class 2606 OID 16749)
-- Name: Subrental Subrental_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subrental"
    ADD CONSTRAINT "Subrental_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3773 (class 2606 OID 16744)
-- Name: Subrental Subrental_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subrental"
    ADD CONSTRAINT "Subrental_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3787 (class 2606 OID 16981)
-- Name: TagDefinition TagDefinition_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TagDefinition"
    ADD CONSTRAINT "TagDefinition_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3770 (class 2606 OID 16710)
-- Name: TranslationHistory TranslationHistory_translationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TranslationHistory"
    ADD CONSTRAINT "TranslationHistory_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES public."Translation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-01-08 00:39:12 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict 1YEPaIkDcAWx71wZJwQ4lJ9GeKaXZ6Q1rR5kLGNswvlkB9QrxaXN0YVdDqyInft

