time="2026-01-14T20:15:29Z" level=warning msg="/media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz/docker-compose.dev.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
--
-- PostgreSQL database dump
--

\restrict Jk2SsdBHoXrxsT9dxEeJh8W8MrOg2taOf9jaXryE29tChlgM5SiW8t3AR11jGLJ

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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
-- Name: APIConfiguration; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."APIConfiguration" (
    id text NOT NULL,
    provider text NOT NULL,
    "apiKey" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "lastTestedAt" timestamp(3) without time zone,
    "testStatus" text DEFAULT 'not_tested'::text NOT NULL,
    "testError" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."APIConfiguration" OWNER TO avrentals_user;

--
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
-- Name: CategoryTranslation; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."CategoryTranslation" (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    language text NOT NULL,
    name text NOT NULL,
    description text,
    "isAutomatic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CategoryTranslation" OWNER TO avrentals_user;

--
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
    "partnerId" text
);


ALTER TABLE public."Client" OWNER TO avrentals_user;

--
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
    "descriptionPt" text,
    "imageData" text,
    "imageContentType" character varying(50),
    "quantityByStatus" jsonb DEFAULT '{"good": 0, "damaged": 0, "maintenance": 0}'::jsonb NOT NULL
);


ALTER TABLE public."EquipmentItem" OWNER TO avrentals_user;

--
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
    "agencyId" text,
    "quoteId" text,
    "totalRevenue" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."Event" OWNER TO avrentals_user;

--
-- Name: EventSubClient; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."EventSubClient" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "clientId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventSubClient" OWNER TO avrentals_user;

--
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


ALTER TABLE public."MaintenanceLog" OWNER TO avrentals_user;

--
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


ALTER TABLE public."NotificationPreference" OWNER TO avrentals_user;

--
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
-- Name: ProductTranslation; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."ProductTranslation" (
    id text NOT NULL,
    "productId" text NOT NULL,
    language text NOT NULL,
    name text NOT NULL,
    description text,
    "isAutomatic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductTranslation" OWNER TO avrentals_user;

--
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


ALTER TABLE public."QuotaChangeHistory" OWNER TO avrentals_user;

--
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


ALTER TABLE public."Quote" OWNER TO avrentals_user;

--
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


ALTER TABLE public."Rental" OWNER TO avrentals_user;

--
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
-- Name: SubcategoryTranslation; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."SubcategoryTranslation" (
    id text NOT NULL,
    "subcategoryId" text NOT NULL,
    language text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SubcategoryTranslation" OWNER TO avrentals_user;

--
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


ALTER TABLE public."Subrental" OWNER TO avrentals_user;

--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."SystemSetting" (
    id text NOT NULL,
    category text NOT NULL,
    key text NOT NULL,
    value text,
    "isEncrypted" boolean DEFAULT false NOT NULL,
    "encryptedValue" text,
    description text,
    "isEditable" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO avrentals_user;

--
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
-- Name: TranslationCache; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."TranslationCache" (
    id text NOT NULL,
    "sourceText" text NOT NULL,
    "sourceLanguage" text DEFAULT 'en'::text NOT NULL,
    "targetLanguage" text NOT NULL,
    "translatedText" text NOT NULL,
    "contentType" text NOT NULL,
    "contentId" text,
    hash text NOT NULL,
    "isAutomatic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public."TranslationCache" OWNER TO avrentals_user;

--
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
-- Name: TranslationJob; Type: TABLE; Schema: public; Owner: avrentals_user
--

CREATE TABLE public."TranslationJob" (
    id text NOT NULL,
    "contentType" text NOT NULL,
    "contentId" text NOT NULL,
    "sourceLanguage" text DEFAULT 'en'::text NOT NULL,
    "targetLanguages" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    "totalItems" integer DEFAULT 1 NOT NULL,
    "completedItems" integer DEFAULT 0 NOT NULL,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."TranslationJob" OWNER TO avrentals_user;

--
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


ALTER TABLE public."User" OWNER TO avrentals_user;

--
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


ALTER TABLE public._prisma_migrations OWNER TO avrentals_user;

--
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


ALTER TABLE public.customization_settings OWNER TO avrentals_user;

--
-- Data for Name: APIConfiguration; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."APIConfiguration" (id, provider, "apiKey", "isActive", settings, "lastTestedAt", "testStatus", "testError", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."ActivityLog" (id, "userId", action, "entityType", "entityId", "oldData", "newData", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: BackupJob; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."BackupJob" (id, "jobType", status, "startedAt", "completedAt", "backupFile", "fileSize", duration, error, "createdAt") FROM stdin;
\.


--
-- Data for Name: BatchOperation; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."BatchOperation" (id, "operationType", status, "fileCount", "folderCount", "performedBy", "initiatedAt", "completedAt", details, error) FROM stdin;
\.


--
-- Data for Name: CatalogShare; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CatalogShare" (id, token, "partnerId", "selectedEquipmentIds", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CatalogShareInquiry; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CatalogShareInquiry" (id, "catalogShareId", "partnerId", "customerName", "customerEmail", "customerPhone", "startDate", "endDate", items, status, "createdAt", "updatedAt", "breakdownDateTime", budget, "customerCompany", "deliveryLocation", "eventLocation", "eventName", "eventType", "setupDateTime", "specialRequirements") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Category" (id, name, icon, version, "createdBy", "updatedBy", "createdAt", "updatedAt", description) FROM stdin;
cmk1e0n230003tb4gtbayc9jd	Lighting	Lightbulb	1	\N	\N	2026-01-06 16:55:54.022	2026-01-06 19:55:04.35	\N
cmk2xt5s50023cw5g2242d74c	Power	Settings	1	\N	\N	2026-01-06 18:42:57.03	2026-01-06 19:55:16.876	\N
cmk2yg76g002xcw5gs5phwj4g	Staging and Structures	Cuboid	1	\N	\N	2026-01-06 19:00:51.928	2026-01-06 19:55:26.233	\N
cmk2u2ind000ccw5gwp8sjln3	Video	Projector	1	\N	\N	2026-01-06 16:58:15.145	2026-01-06 19:55:37.185	\N
cmk1e0n260004tb4g37154d95	Audio and Sound	Speaker	1	\N	\N	2026-01-06 16:55:54.025	2026-01-06 19:55:43.764	\N
cmk2yahn1002mcw5gvbcgkszj	Others	Layers	1	\N	\N	2026-01-06 18:56:25.549	2026-01-06 19:55:54.467	\N
\.


--
-- Data for Name: CategoryTranslation; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CategoryTranslation" (id, "categoryId", language, name, description, "isAutomatic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Client" (id, name, "contactPerson", email, phone, address, notes, version, "createdBy", "updatedBy", "createdAt", "updatedAt", "partnerId") FROM stdin;
\.


--
-- Data for Name: CloudFile; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CloudFile" (id, name, "originalName", "mimeType", size, "storagePath", url, "folderId", "ownerId", "isPublic", "isStarred", "isTrashed", version, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CloudFolder; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."CloudFolder" (id, name, "parentId", "ownerId", color, "isStarred", "isTrashed", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DataSyncEvent; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."DataSyncEvent" (id, "entityType", "entityId", action, data, version, processed, "createdAt") FROM stdin;
\.


--
-- Data for Name: EquipmentItem; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."EquipmentItem" (id, name, description, "categoryId", "subcategoryId", quantity, status, location, "imageUrl", "dailyRate", type, version, "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionPt", "imageData", "imageContentType", "quantityByStatus") FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Event" (id, name, "clientId", location, "startDate", "endDate", "assignedTo", version, "createdBy", "updatedBy", "createdAt", "updatedAt", "agencyId", "quoteId", "totalRevenue") FROM stdin;
\.


--
-- Data for Name: EventSubClient; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."EventSubClient" (id, "eventId", "clientId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Fee; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Fee" (id, name, description, amount, type, category, "isActive", "isRequired", "createdAt", "updatedAt") FROM stdin;
cmk2tqx0h000ui9xdftir74iy	Delivery Fee	\N	100	fixed	\N	t	f	2026-01-06 16:49:13.889	2026-01-06 16:49:13.889
cmk2tqx0k000vi9xdl4i5lngv	Insurance	\N	5	percentage	\N	t	f	2026-01-06 16:49:13.893	2026-01-06 16:49:13.893
cmk2tqx0n000wi9xdmw4gbp6x	Late Return Fee	\N	50	fixed	\N	t	f	2026-01-06 16:49:13.895	2026-01-06 16:49:13.895
cmk2tqx0q000xi9xdhzubrhux	Damage Waiver	\N	150	fixed	\N	t	f	2026-01-06 16:49:13.898	2026-01-06 16:49:13.898
cmk2tqx0t000yi9xdixhgsiiz	Equipment Protection	\N	10	percentage	\N	t	f	2026-01-06 16:49:13.901	2026-01-06 16:49:13.901
\.


--
-- Data for Name: FileActivity; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileActivity" (id, "fileId", "userId", action, details, "createdAt") FROM stdin;
\.


--
-- Data for Name: FileShare; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileShare" (id, "fileId", "sharedWith", permission, "shareToken", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: FileTag; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileTag" (id, "fileId", "tagId", "addedAt") FROM stdin;
\.


--
-- Data for Name: FileVersion; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FileVersion" (id, "fileId", "versionNum", "storagePath", size, "uploadedAt", "uploadedBy") FROM stdin;
\.


--
-- Data for Name: FolderShare; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FolderShare" (id, "folderId", "sharedWith", permission, "shareToken", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: FolderTag; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."FolderTag" (id, "folderId", "tagId", "addedAt") FROM stdin;
\.


--
-- Data for Name: JobReference; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."JobReference" (id, "partnerId", "eventId", "quoteId", "clientName", "referralNotes", commission, status, "referralDate", version, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaintenanceLog; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."MaintenanceLog" (id, "equipmentId", date, description, cost, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Notification" (id, "userId", type, title, message, priority, "isRead", "entityType", "entityId", "actionUrl", "createdAt", "updatedAt", "expiresAt", "groupKey") FROM stdin;
\.


--
-- Data for Name: NotificationPreference; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."NotificationPreference" (id, "userId", "conflictAlerts", "statusChanges", "eventReminders", "overdueAlerts", "criticalAlerts", "stockAlerts", "equipmentAvailable", "monthlySummary", "toastCritical", "toastHigh", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Partner; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Partner" (id, name, "companyName", "contactPerson", email, phone, address, website, notes, "isActive", version, "createdBy", "updatedBy", "createdAt", "updatedAt", "clientId", "partnerType", commission, "logoUrl") FROM stdin;
cmk1e0n150000tb4g9cktv4bk	Rey Davis	VRD Production	\N	hello@vrd.productions	351969774999	\N	https://vrd.productions	Professional Audio Visual Equipment Rental	t	1	\N	cmk2tl2690000o85xlet8yxg7	2026-01-06 16:55:54.014	2026-01-06 20:27:56.57	\N	agency	\N	
\.


--
-- Data for Name: ProductTranslation; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."ProductTranslation" (id, "productId", language, name, description, "isAutomatic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: QuotaChangeHistory; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."QuotaChangeHistory" (id, "userId", "oldQuotaBytes", "newQuotaBytes", "changedBy", reason, "changedAt") FROM stdin;
\.


--
-- Data for Name: Quote; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Quote" (id, "quoteNumber", name, location, "clientId", "clientName", "clientEmail", "clientPhone", "clientAddress", "startDate", "endDate", "subTotal", "discountAmount", "discountType", "taxRate", "taxAmount", "totalAmount", status, notes, version, "createdBy", "updatedBy", "createdAt", "updatedAt", terms) FROM stdin;
\.


--
-- Data for Name: QuoteItem; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."QuoteItem" (id, "quoteId", type, "equipmentId", "equipmentName", "serviceId", "serviceName", "feeId", "feeName", amount, "feeType", quantity, "unitPrice", days, "lineTotal", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Rental; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Rental" (id, "eventId", "equipmentId", "quantityRented", "prepStatus", "createdAt", "updatedAt") FROM stdin;
\.


--
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
-- Data for Name: StorageQuota; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."StorageQuota" (id, "userId", "usedBytes", "quotaBytes", "lastUpdated", "cloudEnabled") FROM stdin;
\.


--
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
-- Data for Name: SubcategoryTranslation; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."SubcategoryTranslation" (id, "subcategoryId", language, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subrental; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."Subrental" (id, "partnerId", "eventId", "equipmentName", "equipmentDesc", quantity, "dailyRate", "totalCost", "startDate", "endDate", status, "invoiceNumber", notes, version, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."SystemSetting" (id, category, key, value, "isEncrypted", "encryptedValue", description, "isEditable", version, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TagDefinition; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."TagDefinition" (id, name, "ownerId", color, description, "createdAt", "updatedAt") FROM stdin;
\.


--
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
-- Data for Name: TranslationCache; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."TranslationCache" (id, "sourceText", "sourceLanguage", "targetLanguage", "translatedText", "contentType", "contentId", hash, "isAutomatic", "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: TranslationHistory; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."TranslationHistory" (id, "translationId", "oldTranslatedText", "newTranslatedText", "changedBy", "changeReason", version, "createdAt") FROM stdin;
\.


--
-- Data for Name: TranslationJob; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."TranslationJob" (id, "contentType", "contentId", "sourceLanguage", "targetLanguages", status, progress, "totalItems", "completedItems", error, "createdAt", "updatedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."User" (id, name, username, password, role, "isActive", version, "lastLoginAt", "photoUrl", nif, iban, "contactPhone", "contactEmail", "emergencyPhone", "isTeamMember", "teamTitle", "teamBio", "teamCoverPhoto", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
cmkegivmj0000gm5xrbsnwx5l	Feliciano	feliciano	$2b$12$4bbdjsoU/YTuUUduCJUee.0YMxDJYWIZi7g/B8.L28FGZMJxr6bCG	Admin	t	1	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	2026-01-14 20:12:17.947	2026-01-14 20:12:17.947
cmkegivtt0001gm5xfhlkaf5v	Lourenço	lourenco	$2b$12$RrGK4/0KIRnrr60P6TnA6es7UkdH6Tj30odKDQybGK/C4KTlN2Z1O	Manager	t	1	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	2026-01-14 20:12:18.209	2026-01-14 20:12:18.209
\.


--
-- Data for Name: UserSession; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public."UserSession" (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fdf1ca1c-3750-406b-84ef-0c5a6680a0d7	dabc6d21d076d83891a0c525f46fec027cc5b3944e8308179593872a9594061f	2026-01-14 20:12:17.055391+00	20260106_fix_schema_for_seeding	\N	\N	2026-01-14 20:12:17.044974+00	1
1ffb59f7-d2b2-4527-aecf-e3976f37d5c9	361fee0c8a24f6b93cc8844881adf5f16f4bf0063971ea31744bf018d0b647af	2026-01-14 20:12:15.883193+00	20251110233929_init_postgres	\N	\N	2026-01-14 20:12:15.331382+00	1
0712907b-69dc-45b0-8ad9-de042fcabbfd	22711c3b6e6a52266780c8e6dc5b4df2a6566ef151448f35a139c31bcb73fdc0	2026-01-14 20:12:16.775801+00	20260105005606_add_description_pt	\N	\N	2026-01-14 20:12:16.765616+00	1
f33f165b-2d7c-4a2e-a6d5-2ef7f3a360b1	41d0628e4c37983d0c2b1368ac83ab727b15631609280815f8e9031414eafa93	2026-01-14 20:12:15.925618+00	20251111045118_add_translation_cache	\N	\N	2026-01-14 20:12:15.885757+00	1
4471451c-c4ce-4ae4-aaa9-abfbe261c098	003727c26f6a866337cc5715f250b9d537da6082ad9713b986aee5bab5f0d98a	2026-01-14 20:12:16.007383+00	20251111135023_add_enhanced_translation_fields	\N	\N	2026-01-14 20:12:15.9289+00	1
33f9d24e-5da0-4f12-a0ae-ee65bfae9995	ce4552ea00d333f3320a26518df18bda3a49358c58650d3284fb1b886b155788	2026-01-14 20:12:16.021611+00	20251124143533_add_pdf_branding_fields	\N	\N	2026-01-14 20:12:16.010627+00	1
d731a11a-d667-482d-81e4-9614cd6259b3	633f231ad0d1a3ba69f1e2a72d6c1d6780bd739266f294e59834fbc37736c538	2026-01-14 20:12:16.831611+00	20260105041010_add_catalog_share	\N	\N	2026-01-14 20:12:16.778814+00	1
f8dfaf5d-1c7c-4789-962a-6bd4f819381e	9e29287f0ea55f812494125adcd2de89118fbe2f9f05a2841f10e5d797040abb	2026-01-14 20:12:16.034996+00	20251229170000_add_missing_columns	\N	\N	2026-01-14 20:12:16.024634+00	1
d890b2cf-46f6-498d-b3c0-01f68c795efa	f44587e34b857bc9c4e6679201ae7948b7f01b91f85f06bf8d2cfb95e463119a	2026-01-14 20:12:16.127798+00	20260101213648_add_partners_and_subrentals	\N	\N	2026-01-14 20:12:16.037785+00	1
6f1e81fc-4ae9-46c1-8c11-fd9cba28bf9f	ed9696e0840b58f85d88107eabe3a7efcdb965eba5ee6c73ec8f593107ac9951	2026-01-14 20:12:16.420709+00	20260101230350_add_cloud_storage	\N	\N	2026-01-14 20:12:16.131225+00	1
786a99e8-e547-452f-b15b-4922259d8fc8	a7a7c38265ab34352ab68e2b6e96d93fc083bd3d1482e8415248e4501b2034c0	2026-01-14 20:12:16.889012+00	20260105043537_add_catalog_inquiry	\N	\N	2026-01-14 20:12:16.834978+00	1
570024b9-884d-4438-a72a-ab643de1371f	7d84664db3913c43e2a7af0e8c6c20dc4c5fc163d74c81770883c38d8062643b	2026-01-14 20:12:16.432993+00	20260103_add_cloud_enabled	\N	\N	2026-01-14 20:12:16.423294+00	1
ec9620b2-644b-45c6-9052-338bc2291120	977d4998c1a2baae627978e42bcf2470f0e93ae46ea7dd80631f1557fe1bf043	2026-01-14 20:12:16.452446+00	20260103_add_partner_client_link	\N	\N	2026-01-14 20:12:16.435817+00	1
1ab6b9dc-2e0a-4e75-b429-1eee28a33c23	1c9bce2fac9059f63c37f5f883e2020062e784f24a6ce85bf40e3e39271733fa	2026-01-14 20:12:17.082465+00	20260108_add_event_revenue_tracking	\N	\N	2026-01-14 20:12:17.058427+00	1
b554ed4d-1760-4ee4-b928-6d130d95c387	aa5d6bdb4bc25feb6c8c542b2d4e4130816d599822721f720b2385ae91123652	2026-01-14 20:12:16.525757+00	20260103_add_partner_types_and_job_references	\N	\N	2026-01-14 20:12:16.455695+00	1
85ee7f0f-3c4c-4da3-bfe1-a32e2b842bab	12c0711d57376baf2155f141a8623d9775883e953555afd6497677ef6341c3ce	2026-01-14 20:12:16.899978+00	20260105043809_expand_inquiry_fields	\N	\N	2026-01-14 20:12:16.89178+00	1
7892f04e-d524-4bb2-9226-12ac3b227c98	0179da26a4fde3bbf3e8b97e11fb88d8a267e78758117c79d0884d0348a0eb14	2026-01-14 20:12:16.664974+00	20260103_add_phase2_features	\N	\N	2026-01-14 20:12:16.528595+00	1
de881e31-3759-4de6-b39a-61de40bebba7	f92aec7492c51881d49d2d6161db1d929595c5ace07b658f392d107487fab072	2026-01-14 20:12:16.750043+00	20260104142848_add_theme_preset_field	\N	\N	2026-01-14 20:12:16.66786+00	1
624b682d-12c9-4f9d-8abb-0a06dff8e2b9	8b33cba124e4f196cbc271ca7173a1c8d4848d8f527d15125bdcf40bfe1bf608	2026-01-14 20:12:16.762423+00	20260104170000_add_partner_logo	\N	\N	2026-01-14 20:12:16.753086+00	1
439c2e91-7642-4e9b-8166-2b6a717a1c21	16c1cf5c9e89c431b74118074941388f72e553c31535200a554bee57336c5a3a	2026-01-14 20:12:16.955355+00	20260105140254_add_notification_preferences	\N	\N	2026-01-14 20:12:16.902587+00	1
13f57453-2286-402c-b79c-7ddd757036eb	20b587ed4f7ac07a37c5628941df3dcc7a2d55ba784e45555a65d15d97d08d29	2026-01-14 20:12:17.492384+00	20260109_add_translation_tables	\N	\N	2026-01-14 20:12:17.277599+00	1
fecb2f25-6a47-46c3-9d38-3ef3226b06c4	c190f54821b6c72540b64a9ee24da235ccdb4090d9b2556d67ec7a31b7867524	2026-01-14 20:12:17.010392+00	20260105_add_agency_events_and_subclient	\N	\N	2026-01-14 20:12:16.958372+00	1
88468a3b-4c6b-49c3-98c3-483662ae6aff	9c258b68fbcc8b058bf43c3bcd4781a16f860af33465bfa189ac86a352fc9e50	2026-01-14 20:12:17.103687+00	20260108_add_image_data	\N	\N	2026-01-14 20:12:17.086007+00	1
8689d1c9-6227-4a23-97b3-a0777de3cdad	8f8d4a4660f95d21426567d7c367ccfe482087fda3f716406edbf2648d4d42c6	2026-01-14 20:12:17.028931+00	20260105_add_partner_to_client	\N	\N	2026-01-14 20:12:17.013429+00	1
bbc194a1-2d2a-4a7f-b0da-6c919a1517eb	2ab13f23f5e654f4ec9dc7396156f4bef8b4f26a9d2fa094f3ecc8c5aa7632ff	2026-01-14 20:12:17.04199+00	20260106_add_catalog_terms	\N	\N	2026-01-14 20:12:17.031915+00	1
86574894-58f0-4d67-aba4-2bddf8122d14	004bcae746643352ab0955a4caec693aceb98af57576d691a2fbf72f7ef085f2	2026-01-14 20:12:17.156338+00	20260109_add_api_configuration	\N	\N	2026-01-14 20:12:17.106815+00	1
be74c4d8-ea18-48a9-b619-4bd588f4df06	3d950141364900d019c07cbec766046b5d89ebbe2495891a7d546e05a5311797	2026-01-14 20:12:17.531287+00	20260109_create_system_setting	\N	\N	2026-01-14 20:12:17.49568+00	1
0fd7796e-c89c-4591-bc60-9d9d7eadb49f	71c7f2a4108a94e3313cb7513f66b62b2a412513b233d75bfe77968f8bf53643	2026-01-14 20:12:17.261883+00	20260109_add_performance_indexes	\N	\N	2026-01-14 20:12:17.159594+00	1
ffefef4d-777c-4984-a8d4-a0ddcdb77f15	a05e5722cc17d51026776788f21bae739d16910b46fd43eb400c72de568622a2	2026-01-06 16:49:00.660445+00	20260106164900_add_description_to_category	\N	\N	2026-01-06 16:49:00.651722+00	1
7ae4aaa8-fcfc-4272-9446-b9d38fb373a1	695a489db49bac3893a0d89b51cc3f8b1de4462953bbb4ad0b2f916a0c2d69be	2026-01-14 20:12:17.275109+00	20260109_add_quantity_by_status	\N	\N	2026-01-14 20:12:17.265049+00	1
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


--
-- Data for Name: customization_settings; Type: TABLE DATA; Schema: public; Owner: avrentals_user
--

COPY public.customization_settings (id, "companyName", "companyTagline", "contactEmail", "contactPhone", "useTextLogo", "primaryColor", "secondaryColor", "accentColor", "darkMode", "logoUrl", "faviconUrl", "loginBackgroundType", "loginBackgroundColor1", "loginBackgroundColor2", "loginBackgroundImage", "loginCardOpacity", "loginCardBlur", "loginCardPosition", "loginCardWidth", "loginCardBorderRadius", "loginCardShadow", "loginLogoUrl", "loginLogoSize", "loginWelcomeMessage", "loginWelcomeSubtitle", "loginFooterText", "loginShowCompanyName", "loginFormSpacing", "loginButtonStyle", "loginInputStyle", "loginAnimations", "loginLightRaysOrigin", "loginLightRaysColor", "loginLightRaysSpeed", "loginLightRaysSpread", "loginLightRaysLength", "loginLightRaysPulsating", "loginLightRaysFadeDistance", "loginLightRaysSaturation", "loginLightRaysFollowMouse", "loginLightRaysMouseInfluence", "loginLightRaysNoiseAmount", "loginLightRaysDistortion", "customCSS", "footerText", "systemName", timezone, "dateFormat", currency, language, "sessionTimeout", "requireStrongPasswords", "enableTwoFactor", "maxLoginAttempts", "emailEnabled", "smtpServer", "smtpPort", "smtpUsername", "smtpPassword", "fromEmail", "autoBackup", "backupFrequency", "backupRetention", version, "updatedBy", "createdAt", "updatedAt", "pdfCompanyName", "pdfCompanyTagline", "pdfContactEmail", "pdfContactPhone", "pdfLogoUrl", "pdfUseTextLogo", "pdfFooterMessage", "pdfFooterContactText", "pdfShowFooterContact", "themePreset", "catalogTermsAndConditions") FROM stdin;
default-settings	Acrobaticz AV Rentals	Professional Audio Visual Equipment Rental	\N	\N	t	#3b82f6	\N	\N	f	\N	\N	gradient	#3b82f6	#8b5cf6	\N	0.95	t	center	400	8	large	\N	80	\N	\N	\N	t	16	default	default	t	\N	\N	\N	\N	\N	f	\N	\N	t	\N	\N	\N	\N	\N	AV Rentals	Europe/Lisbon	DD/MM/YYYY	EUR	pt	\N	t	f	\N	t	\N	\N	\N	\N	\N	t	\N	\N	1	cmkegivmj0000gm5xrbsnwx5l	2026-01-14 20:12:18.221	2026-01-14 20:12:18.221	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
\.


--
-- Name: APIConfiguration APIConfiguration_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."APIConfiguration"
    ADD CONSTRAINT "APIConfiguration_pkey" PRIMARY KEY (id);


--
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: BackupJob BackupJob_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."BackupJob"
    ADD CONSTRAINT "BackupJob_pkey" PRIMARY KEY (id);


--
-- Name: BatchOperation BatchOperation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."BatchOperation"
    ADD CONSTRAINT "BatchOperation_pkey" PRIMARY KEY (id);


--
-- Name: CatalogShareInquiry CatalogShareInquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShareInquiry"
    ADD CONSTRAINT "CatalogShareInquiry_pkey" PRIMARY KEY (id);


--
-- Name: CatalogShare CatalogShare_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShare"
    ADD CONSTRAINT "CatalogShare_pkey" PRIMARY KEY (id);


--
-- Name: CategoryTranslation CategoryTranslation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CategoryTranslation"
    ADD CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: CloudFile CloudFile_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFile"
    ADD CONSTRAINT "CloudFile_pkey" PRIMARY KEY (id);


--
-- Name: CloudFolder CloudFolder_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFolder"
    ADD CONSTRAINT "CloudFolder_pkey" PRIMARY KEY (id);


--
-- Name: DataSyncEvent DataSyncEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."DataSyncEvent"
    ADD CONSTRAINT "DataSyncEvent_pkey" PRIMARY KEY (id);


--
-- Name: EquipmentItem EquipmentItem_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY (id);


--
-- Name: EventSubClient EventSubClient_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EventSubClient"
    ADD CONSTRAINT "EventSubClient_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Fee Fee_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Fee"
    ADD CONSTRAINT "Fee_pkey" PRIMARY KEY (id);


--
-- Name: FileActivity FileActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileActivity"
    ADD CONSTRAINT "FileActivity_pkey" PRIMARY KEY (id);


--
-- Name: FileShare FileShare_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileShare"
    ADD CONSTRAINT "FileShare_pkey" PRIMARY KEY (id);


--
-- Name: FileTag FileTag_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileTag"
    ADD CONSTRAINT "FileTag_pkey" PRIMARY KEY (id);


--
-- Name: FileVersion FileVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileVersion"
    ADD CONSTRAINT "FileVersion_pkey" PRIMARY KEY (id);


--
-- Name: FolderShare FolderShare_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderShare"
    ADD CONSTRAINT "FolderShare_pkey" PRIMARY KEY (id);


--
-- Name: FolderTag FolderTag_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderTag"
    ADD CONSTRAINT "FolderTag_pkey" PRIMARY KEY (id);


--
-- Name: JobReference JobReference_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceLog MaintenanceLog_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."MaintenanceLog"
    ADD CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY (id);


--
-- Name: NotificationPreference NotificationPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Partner Partner_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_pkey" PRIMARY KEY (id);


--
-- Name: ProductTranslation ProductTranslation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."ProductTranslation"
    ADD CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY (id);


--
-- Name: QuotaChangeHistory QuotaChangeHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuotaChangeHistory"
    ADD CONSTRAINT "QuotaChangeHistory_pkey" PRIMARY KEY (id);


--
-- Name: QuoteItem QuoteItem_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_pkey" PRIMARY KEY (id);


--
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- Name: Rental Rental_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: StorageQuota StorageQuota_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."StorageQuota"
    ADD CONSTRAINT "StorageQuota_pkey" PRIMARY KEY (id);


--
-- Name: SubcategoryTranslation SubcategoryTranslation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."SubcategoryTranslation"
    ADD CONSTRAINT "SubcategoryTranslation_pkey" PRIMARY KEY (id);


--
-- Name: Subcategory Subcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subcategory"
    ADD CONSTRAINT "Subcategory_pkey" PRIMARY KEY (id);


--
-- Name: Subrental Subrental_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subrental"
    ADD CONSTRAINT "Subrental_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: TagDefinition TagDefinition_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TagDefinition"
    ADD CONSTRAINT "TagDefinition_pkey" PRIMARY KEY (id);


--
-- Name: TranslationCache TranslationCache_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TranslationCache"
    ADD CONSTRAINT "TranslationCache_pkey" PRIMARY KEY (id);


--
-- Name: TranslationHistory TranslationHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TranslationHistory"
    ADD CONSTRAINT "TranslationHistory_pkey" PRIMARY KEY (id);


--
-- Name: TranslationJob TranslationJob_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TranslationJob"
    ADD CONSTRAINT "TranslationJob_pkey" PRIMARY KEY (id);


--
-- Name: Translation Translation_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Translation"
    ADD CONSTRAINT "Translation_pkey" PRIMARY KEY (id);


--
-- Name: UserSession UserSession_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."UserSession"
    ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: customization_settings customization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public.customization_settings
    ADD CONSTRAINT customization_settings_pkey PRIMARY KEY (id);


--
-- Name: APIConfiguration_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "APIConfiguration_createdAt_idx" ON public."APIConfiguration" USING btree ("createdAt");


--
-- Name: APIConfiguration_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "APIConfiguration_isActive_idx" ON public."APIConfiguration" USING btree ("isActive");


--
-- Name: APIConfiguration_provider_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "APIConfiguration_provider_idx" ON public."APIConfiguration" USING btree (provider);


--
-- Name: APIConfiguration_provider_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "APIConfiguration_provider_key" ON public."APIConfiguration" USING btree (provider);


--
-- Name: ActivityLog_action_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_action_idx" ON public."ActivityLog" USING btree (action);


--
-- Name: ActivityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_createdAt_idx" ON public."ActivityLog" USING btree ("createdAt");


--
-- Name: ActivityLog_entityType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_entityType_idx" ON public."ActivityLog" USING btree ("entityType");


--
-- Name: ActivityLog_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ActivityLog_userId_idx" ON public."ActivityLog" USING btree ("userId");


--
-- Name: BackupJob_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BackupJob_createdAt_idx" ON public."BackupJob" USING btree ("createdAt");


--
-- Name: BackupJob_jobType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BackupJob_jobType_idx" ON public."BackupJob" USING btree ("jobType");


--
-- Name: BackupJob_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BackupJob_status_idx" ON public."BackupJob" USING btree (status);


--
-- Name: BatchOperation_initiatedAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BatchOperation_initiatedAt_idx" ON public."BatchOperation" USING btree ("initiatedAt");


--
-- Name: BatchOperation_performedBy_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BatchOperation_performedBy_idx" ON public."BatchOperation" USING btree ("performedBy");


--
-- Name: BatchOperation_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "BatchOperation_status_idx" ON public."BatchOperation" USING btree (status);


--
-- Name: CatalogShareInquiry_catalogShareId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_catalogShareId_idx" ON public."CatalogShareInquiry" USING btree ("catalogShareId");


--
-- Name: CatalogShareInquiry_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_createdAt_idx" ON public."CatalogShareInquiry" USING btree ("createdAt");


--
-- Name: CatalogShareInquiry_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_partnerId_idx" ON public."CatalogShareInquiry" USING btree ("partnerId");


--
-- Name: CatalogShareInquiry_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShareInquiry_status_idx" ON public."CatalogShareInquiry" USING btree (status);


--
-- Name: CatalogShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShare_expiresAt_idx" ON public."CatalogShare" USING btree ("expiresAt");


--
-- Name: CatalogShare_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShare_partnerId_idx" ON public."CatalogShare" USING btree ("partnerId");


--
-- Name: CatalogShare_token_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CatalogShare_token_idx" ON public."CatalogShare" USING btree (token);


--
-- Name: CatalogShare_token_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "CatalogShare_token_key" ON public."CatalogShare" USING btree (token);


--
-- Name: CategoryTranslation_categoryId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CategoryTranslation_categoryId_idx" ON public."CategoryTranslation" USING btree ("categoryId");


--
-- Name: CategoryTranslation_categoryId_language_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON public."CategoryTranslation" USING btree ("categoryId", language);


--
-- Name: CategoryTranslation_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CategoryTranslation_createdAt_idx" ON public."CategoryTranslation" USING btree ("createdAt");


--
-- Name: CategoryTranslation_language_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CategoryTranslation_language_idx" ON public."CategoryTranslation" USING btree (language);


--
-- Name: Category_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Category_name_idx" ON public."Category" USING btree (name);


--
-- Name: Client_email_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Client_email_idx" ON public."Client" USING btree (email);


--
-- Name: Client_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Client_name_idx" ON public."Client" USING btree (name);


--
-- Name: Client_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Client_partnerId_idx" ON public."Client" USING btree ("partnerId");


--
-- Name: CloudFile_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_createdAt_idx" ON public."CloudFile" USING btree ("createdAt");


--
-- Name: CloudFile_folderId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_folderId_idx" ON public."CloudFile" USING btree ("folderId");


--
-- Name: CloudFile_isStarred_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_isStarred_idx" ON public."CloudFile" USING btree ("isStarred");


--
-- Name: CloudFile_isTrashed_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_isTrashed_idx" ON public."CloudFile" USING btree ("isTrashed");


--
-- Name: CloudFile_ownerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFile_ownerId_idx" ON public."CloudFile" USING btree ("ownerId");


--
-- Name: CloudFolder_isStarred_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_isStarred_idx" ON public."CloudFolder" USING btree ("isStarred");


--
-- Name: CloudFolder_isTrashed_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_isTrashed_idx" ON public."CloudFolder" USING btree ("isTrashed");


--
-- Name: CloudFolder_ownerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_ownerId_idx" ON public."CloudFolder" USING btree ("ownerId");


--
-- Name: CloudFolder_parentId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "CloudFolder_parentId_idx" ON public."CloudFolder" USING btree ("parentId");


--
-- Name: DataSyncEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "DataSyncEvent_createdAt_idx" ON public."DataSyncEvent" USING btree ("createdAt");


--
-- Name: DataSyncEvent_entityType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "DataSyncEvent_entityType_idx" ON public."DataSyncEvent" USING btree ("entityType");


--
-- Name: DataSyncEvent_processed_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "DataSyncEvent_processed_idx" ON public."DataSyncEvent" USING btree (processed);


--
-- Name: EquipmentItem_categoryId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_categoryId_idx" ON public."EquipmentItem" USING btree ("categoryId");


--
-- Name: EquipmentItem_imageData_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_imageData_idx" ON public."EquipmentItem" USING btree ("imageData") WHERE ("imageData" IS NOT NULL);


--
-- Name: EquipmentItem_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_name_idx" ON public."EquipmentItem" USING btree (name);


--
-- Name: EquipmentItem_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_status_idx" ON public."EquipmentItem" USING btree (status);


--
-- Name: EquipmentItem_subcategoryId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_subcategoryId_idx" ON public."EquipmentItem" USING btree ("subcategoryId");


--
-- Name: EquipmentItem_type_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EquipmentItem_type_idx" ON public."EquipmentItem" USING btree (type);


--
-- Name: EventSubClient_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EventSubClient_clientId_idx" ON public."EventSubClient" USING btree ("clientId");


--
-- Name: EventSubClient_eventId_clientId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "EventSubClient_eventId_clientId_key" ON public."EventSubClient" USING btree ("eventId", "clientId");


--
-- Name: EventSubClient_eventId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "EventSubClient_eventId_idx" ON public."EventSubClient" USING btree ("eventId");


--
-- Name: Event_agencyId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_agencyId_idx" ON public."Event" USING btree ("agencyId");


--
-- Name: Event_assignedTo_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_assignedTo_idx" ON public."Event" USING btree ("assignedTo");


--
-- Name: Event_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_clientId_idx" ON public."Event" USING btree ("clientId");


--
-- Name: Event_endDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_endDate_idx" ON public."Event" USING btree ("endDate");


--
-- Name: Event_quoteId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_quoteId_idx" ON public."Event" USING btree ("quoteId");


--
-- Name: Event_startDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_startDate_idx" ON public."Event" USING btree ("startDate");


--
-- Name: Event_totalRevenue_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Event_totalRevenue_idx" ON public."Event" USING btree ("totalRevenue") WHERE ("totalRevenue" > (0)::double precision);


--
-- Name: Fee_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Fee_category_idx" ON public."Fee" USING btree (category);


--
-- Name: Fee_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Fee_isActive_idx" ON public."Fee" USING btree ("isActive");


--
-- Name: Fee_isRequired_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Fee_isRequired_idx" ON public."Fee" USING btree ("isRequired");


--
-- Name: FileActivity_action_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_action_idx" ON public."FileActivity" USING btree (action);


--
-- Name: FileActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_createdAt_idx" ON public."FileActivity" USING btree ("createdAt");


--
-- Name: FileActivity_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_fileId_idx" ON public."FileActivity" USING btree ("fileId");


--
-- Name: FileActivity_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileActivity_userId_idx" ON public."FileActivity" USING btree ("userId");


--
-- Name: FileShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileShare_expiresAt_idx" ON public."FileShare" USING btree ("expiresAt");


--
-- Name: FileShare_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileShare_fileId_idx" ON public."FileShare" USING btree ("fileId");


--
-- Name: FileShare_shareToken_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileShare_shareToken_idx" ON public."FileShare" USING btree ("shareToken");


--
-- Name: FileShare_shareToken_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FileShare_shareToken_key" ON public."FileShare" USING btree ("shareToken");


--
-- Name: FileTag_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileTag_fileId_idx" ON public."FileTag" USING btree ("fileId");


--
-- Name: FileTag_fileId_tagId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FileTag_fileId_tagId_key" ON public."FileTag" USING btree ("fileId", "tagId");


--
-- Name: FileTag_tagId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileTag_tagId_idx" ON public."FileTag" USING btree ("tagId");


--
-- Name: FileVersion_fileId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileVersion_fileId_idx" ON public."FileVersion" USING btree ("fileId");


--
-- Name: FileVersion_fileId_versionNum_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FileVersion_fileId_versionNum_key" ON public."FileVersion" USING btree ("fileId", "versionNum");


--
-- Name: FileVersion_versionNum_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FileVersion_versionNum_idx" ON public."FileVersion" USING btree ("versionNum");


--
-- Name: FolderShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderShare_expiresAt_idx" ON public."FolderShare" USING btree ("expiresAt");


--
-- Name: FolderShare_folderId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderShare_folderId_idx" ON public."FolderShare" USING btree ("folderId");


--
-- Name: FolderShare_shareToken_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderShare_shareToken_idx" ON public."FolderShare" USING btree ("shareToken");


--
-- Name: FolderShare_shareToken_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FolderShare_shareToken_key" ON public."FolderShare" USING btree ("shareToken");


--
-- Name: FolderTag_folderId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderTag_folderId_idx" ON public."FolderTag" USING btree ("folderId");


--
-- Name: FolderTag_folderId_tagId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "FolderTag_folderId_tagId_key" ON public."FolderTag" USING btree ("folderId", "tagId");


--
-- Name: FolderTag_tagId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "FolderTag_tagId_idx" ON public."FolderTag" USING btree ("tagId");


--
-- Name: JobReference_eventId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_eventId_idx" ON public."JobReference" USING btree ("eventId");


--
-- Name: JobReference_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_partnerId_idx" ON public."JobReference" USING btree ("partnerId");


--
-- Name: JobReference_quoteId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_quoteId_idx" ON public."JobReference" USING btree ("quoteId");


--
-- Name: JobReference_referralDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_referralDate_idx" ON public."JobReference" USING btree ("referralDate");


--
-- Name: JobReference_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "JobReference_status_idx" ON public."JobReference" USING btree (status);


--
-- Name: NotificationPreference_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "NotificationPreference_userId_idx" ON public."NotificationPreference" USING btree ("userId");


--
-- Name: NotificationPreference_userId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON public."NotificationPreference" USING btree ("userId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_expiresAt_idx" ON public."Notification" USING btree ("expiresAt");


--
-- Name: Notification_groupKey_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_groupKey_idx" ON public."Notification" USING btree ("groupKey");


--
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- Name: Notification_priority_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_priority_idx" ON public."Notification" USING btree (priority);


--
-- Name: Notification_type_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_type_idx" ON public."Notification" USING btree (type);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: Partner_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_clientId_idx" ON public."Partner" USING btree ("clientId");


--
-- Name: Partner_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_isActive_idx" ON public."Partner" USING btree ("isActive");


--
-- Name: Partner_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_name_idx" ON public."Partner" USING btree (name);


--
-- Name: Partner_partnerType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Partner_partnerType_idx" ON public."Partner" USING btree ("partnerType");


--
-- Name: ProductTranslation_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ProductTranslation_createdAt_idx" ON public."ProductTranslation" USING btree ("createdAt");


--
-- Name: ProductTranslation_language_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ProductTranslation_language_idx" ON public."ProductTranslation" USING btree (language);


--
-- Name: ProductTranslation_productId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "ProductTranslation_productId_idx" ON public."ProductTranslation" USING btree ("productId");


--
-- Name: ProductTranslation_productId_language_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "ProductTranslation_productId_language_key" ON public."ProductTranslation" USING btree ("productId", language);


--
-- Name: QuotaChangeHistory_changedAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "QuotaChangeHistory_changedAt_idx" ON public."QuotaChangeHistory" USING btree ("changedAt");


--
-- Name: QuotaChangeHistory_changedBy_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "QuotaChangeHistory_changedBy_idx" ON public."QuotaChangeHistory" USING btree ("changedBy");


--
-- Name: QuotaChangeHistory_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "QuotaChangeHistory_userId_idx" ON public."QuotaChangeHistory" USING btree ("userId");


--
-- Name: Quote_clientId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_clientId_idx" ON public."Quote" USING btree ("clientId");


--
-- Name: Quote_quoteNumber_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_quoteNumber_idx" ON public."Quote" USING btree ("quoteNumber");


--
-- Name: Quote_quoteNumber_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON public."Quote" USING btree ("quoteNumber");


--
-- Name: Quote_startDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_startDate_idx" ON public."Quote" USING btree ("startDate");


--
-- Name: Quote_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Quote_status_idx" ON public."Quote" USING btree (status);


--
-- Name: Service_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Service_category_idx" ON public."Service" USING btree (category);


--
-- Name: Service_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Service_isActive_idx" ON public."Service" USING btree ("isActive");


--
-- Name: StorageQuota_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "StorageQuota_userId_idx" ON public."StorageQuota" USING btree ("userId");


--
-- Name: StorageQuota_userId_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "StorageQuota_userId_key" ON public."StorageQuota" USING btree ("userId");


--
-- Name: SubcategoryTranslation_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "SubcategoryTranslation_createdAt_idx" ON public."SubcategoryTranslation" USING btree ("createdAt");


--
-- Name: SubcategoryTranslation_language_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "SubcategoryTranslation_language_idx" ON public."SubcategoryTranslation" USING btree (language);


--
-- Name: SubcategoryTranslation_subcategoryId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "SubcategoryTranslation_subcategoryId_idx" ON public."SubcategoryTranslation" USING btree ("subcategoryId");


--
-- Name: SubcategoryTranslation_subcategoryId_language_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "SubcategoryTranslation_subcategoryId_language_key" ON public."SubcategoryTranslation" USING btree ("subcategoryId", language);


--
-- Name: Subcategory_name_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subcategory_name_idx" ON public."Subcategory" USING btree (name);


--
-- Name: Subcategory_parentId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subcategory_parentId_idx" ON public."Subcategory" USING btree ("parentId");


--
-- Name: Subrental_endDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_endDate_idx" ON public."Subrental" USING btree ("endDate");


--
-- Name: Subrental_eventId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_eventId_idx" ON public."Subrental" USING btree ("eventId");


--
-- Name: Subrental_partnerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_partnerId_idx" ON public."Subrental" USING btree ("partnerId");


--
-- Name: Subrental_startDate_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_startDate_idx" ON public."Subrental" USING btree ("startDate");


--
-- Name: Subrental_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Subrental_status_idx" ON public."Subrental" USING btree (status);


--
-- Name: SystemSetting_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "SystemSetting_category_idx" ON public."SystemSetting" USING btree (category);


--
-- Name: SystemSetting_category_key_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "SystemSetting_category_key_key" ON public."SystemSetting" USING btree (category, key);


--
-- Name: TagDefinition_ownerId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TagDefinition_ownerId_idx" ON public."TagDefinition" USING btree ("ownerId");


--
-- Name: TagDefinition_ownerId_name_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "TagDefinition_ownerId_name_key" ON public."TagDefinition" USING btree ("ownerId", name);


--
-- Name: TranslationCache_contentId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationCache_contentId_idx" ON public."TranslationCache" USING btree ("contentId");


--
-- Name: TranslationCache_contentType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationCache_contentType_idx" ON public."TranslationCache" USING btree ("contentType");


--
-- Name: TranslationCache_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationCache_createdAt_idx" ON public."TranslationCache" USING btree ("createdAt");


--
-- Name: TranslationCache_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationCache_expiresAt_idx" ON public."TranslationCache" USING btree ("expiresAt");


--
-- Name: TranslationCache_hash_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "TranslationCache_hash_key" ON public."TranslationCache" USING btree (hash);


--
-- Name: TranslationCache_targetLanguage_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationCache_targetLanguage_idx" ON public."TranslationCache" USING btree ("targetLanguage");


--
-- Name: TranslationHistory_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationHistory_createdAt_idx" ON public."TranslationHistory" USING btree ("createdAt");


--
-- Name: TranslationHistory_translationId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationHistory_translationId_idx" ON public."TranslationHistory" USING btree ("translationId");


--
-- Name: TranslationHistory_version_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationHistory_version_idx" ON public."TranslationHistory" USING btree (version);


--
-- Name: TranslationJob_contentId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationJob_contentId_idx" ON public."TranslationJob" USING btree ("contentId");


--
-- Name: TranslationJob_contentType_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationJob_contentType_idx" ON public."TranslationJob" USING btree ("contentType");


--
-- Name: TranslationJob_createdAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationJob_createdAt_idx" ON public."TranslationJob" USING btree ("createdAt");


--
-- Name: TranslationJob_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "TranslationJob_status_idx" ON public."TranslationJob" USING btree (status);


--
-- Name: Translation_category_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_category_idx" ON public."Translation" USING btree (category);


--
-- Name: Translation_needsReview_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_needsReview_idx" ON public."Translation" USING btree ("needsReview");


--
-- Name: Translation_qualityScore_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_qualityScore_idx" ON public."Translation" USING btree ("qualityScore");


--
-- Name: Translation_sourceText_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_sourceText_idx" ON public."Translation" USING btree ("sourceText");


--
-- Name: Translation_sourceText_targetLang_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "Translation_sourceText_targetLang_key" ON public."Translation" USING btree ("sourceText", "targetLang");


--
-- Name: Translation_status_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_status_idx" ON public."Translation" USING btree (status);


--
-- Name: Translation_targetLang_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_targetLang_idx" ON public."Translation" USING btree ("targetLang");


--
-- Name: Translation_usageCount_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "Translation_usageCount_idx" ON public."Translation" USING btree ("usageCount");


--
-- Name: UserSession_expiresAt_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "UserSession_expiresAt_idx" ON public."UserSession" USING btree ("expiresAt");


--
-- Name: UserSession_token_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "UserSession_token_idx" ON public."UserSession" USING btree (token);


--
-- Name: UserSession_token_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "UserSession_token_key" ON public."UserSession" USING btree (token);


--
-- Name: UserSession_userId_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "UserSession_userId_idx" ON public."UserSession" USING btree ("userId");


--
-- Name: User_isActive_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_isActive_idx" ON public."User" USING btree ("isActive");


--
-- Name: User_isTeamMember_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_isTeamMember_idx" ON public."User" USING btree ("isTeamMember");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_username_idx; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX "User_username_idx" ON public."User" USING btree (username);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: idx_catalogshare_createdat; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_catalogshare_createdat ON public."CatalogShare" USING btree ("createdAt" DESC);


--
-- Name: idx_catalogshare_partner_expires; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_catalogshare_partner_expires ON public."CatalogShare" USING btree ("partnerId", "expiresAt" DESC);


--
-- Name: idx_catalogshare_token; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_catalogshare_token ON public."CatalogShare" USING btree (token);


--
-- Name: idx_category_name; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_category_name ON public."Category" USING btree (name);


--
-- Name: idx_category_updatedat; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_category_updatedat ON public."Category" USING btree ("updatedAt" DESC);


--
-- Name: idx_equipment_category_id; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_category_id ON public."EquipmentItem" USING btree ("categoryId");


--
-- Name: idx_equipment_category_name; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_category_name ON public."EquipmentItem" USING btree ("categoryId", name);


--
-- Name: idx_equipment_createdat; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_createdat ON public."EquipmentItem" USING btree ("createdAt" DESC);


--
-- Name: idx_equipment_name; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_name ON public."EquipmentItem" USING btree (name);


--
-- Name: idx_equipment_status_category; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_status_category ON public."EquipmentItem" USING btree (status, "categoryId");


--
-- Name: idx_equipment_subcategory_id; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_subcategory_id ON public."EquipmentItem" USING btree ("subcategoryId");


--
-- Name: idx_equipment_subcategory_name; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_equipment_subcategory_name ON public."EquipmentItem" USING btree ("subcategoryId", name);


--
-- Name: idx_subcategory_name; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_subcategory_name ON public."Subcategory" USING btree (name);


--
-- Name: idx_subcategory_parent_name; Type: INDEX; Schema: public; Owner: avrentals_user
--

CREATE INDEX idx_subcategory_parent_name ON public."Subcategory" USING btree ("parentId", name);


--
-- Name: BatchOperation BatchOperation_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."BatchOperation"
    ADD CONSTRAINT "BatchOperation_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CatalogShareInquiry CatalogShareInquiry_catalogShareId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShareInquiry"
    ADD CONSTRAINT "CatalogShareInquiry_catalogShareId_fkey" FOREIGN KEY ("catalogShareId") REFERENCES public."CatalogShare"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CatalogShareInquiry CatalogShareInquiry_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShareInquiry"
    ADD CONSTRAINT "CatalogShareInquiry_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CatalogShare CatalogShare_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CatalogShare"
    ADD CONSTRAINT "CatalogShare_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Client Client_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CloudFile CloudFile_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFile"
    ADD CONSTRAINT "CloudFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CloudFile CloudFile_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFile"
    ADD CONSTRAINT "CloudFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CloudFolder CloudFolder_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFolder"
    ADD CONSTRAINT "CloudFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CloudFolder CloudFolder_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."CloudFolder"
    ADD CONSTRAINT "CloudFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EquipmentItem EquipmentItem_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EquipmentItem EquipmentItem_subcategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES public."Subcategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EventSubClient EventSubClient_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EventSubClient"
    ADD CONSTRAINT "EventSubClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventSubClient EventSubClient_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."EventSubClient"
    ADD CONSTRAINT "EventSubClient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Event Event_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FileActivity FileActivity_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileActivity"
    ADD CONSTRAINT "FileActivity_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileActivity FileActivity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileActivity"
    ADD CONSTRAINT "FileActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileShare FileShare_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileShare"
    ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileTag FileTag_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileTag"
    ADD CONSTRAINT "FileTag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileTag FileTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileTag"
    ADD CONSTRAINT "FileTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."TagDefinition"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileVersion FileVersion_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FileVersion"
    ADD CONSTRAINT "FileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."CloudFile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FolderShare FolderShare_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderShare"
    ADD CONSTRAINT "FolderShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FolderTag FolderTag_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderTag"
    ADD CONSTRAINT "FolderTag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."CloudFolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FolderTag FolderTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."FolderTag"
    ADD CONSTRAINT "FolderTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."TagDefinition"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobReference JobReference_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: JobReference JobReference_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobReference JobReference_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."JobReference"
    ADD CONSTRAINT "JobReference_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaintenanceLog MaintenanceLog_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."MaintenanceLog"
    ADD CONSTRAINT "MaintenanceLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."EquipmentItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationPreference NotificationPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Partner Partner_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuotaChangeHistory QuotaChangeHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuotaChangeHistory"
    ADD CONSTRAINT "QuotaChangeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."StorageQuota"("userId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuoteItem QuoteItem_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."EquipmentItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuoteItem QuoteItem_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."QuoteItem"
    ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quote Quote_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Rental Rental_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."EquipmentItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StorageQuota StorageQuota_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."StorageQuota"
    ADD CONSTRAINT "StorageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subcategory Subcategory_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subcategory"
    ADD CONSTRAINT "Subcategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subrental Subrental_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subrental"
    ADD CONSTRAINT "Subrental_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Subrental Subrental_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."Subrental"
    ADD CONSTRAINT "Subrental_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TagDefinition TagDefinition_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TagDefinition"
    ADD CONSTRAINT "TagDefinition_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TranslationHistory TranslationHistory_translationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avrentals_user
--

ALTER TABLE ONLY public."TranslationHistory"
    ADD CONSTRAINT "TranslationHistory_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES public."Translation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Jk2SsdBHoXrxsT9dxEeJh8W8MrOg2taOf9jaXryE29tChlgM5SiW8t3AR11jGLJ

