// User and Role types for authentication and permissions
export type UserRole = 'Admin' | 'Manager' | 'Technician' | 'Employee' | 'Viewer';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Optional for client-side usage (never expose)
  role: UserRole;
  isActive: boolean;
  version?: number;
  lastLoginAt?: Date;
  // Profile fields
  photoUrl?: string;
  nif?: string;
  iban?: string;
  contactPhone?: string;
  contactEmail?: string;
  emergencyPhone?: string;
  // Team member fields
  isTeamMember?: boolean;
  teamTitle?: string;
  teamBio?: string;
  teamCoverPhoto?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserData {
  name: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface UserFormValues {
  name: string;
  username: string;
  password: string;
  role: UserRole;
}

// Role Permissions
export interface RolePermissions {
  canManageUsers: boolean;
  canManageEquipment: boolean;
  canManageClients: boolean;
  canManageEvents: boolean;
  canManageQuotes: boolean;
  canManageRentals: boolean;
  canViewReports: boolean;
  canManageMaintenance: boolean;
  canManagePartners: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string; // Lucide icon name or SVG path
}

export interface Subcategory {
  id: string;
  name: string;
  parentId: string; // Category ID
}

export type EquipmentStatus = 'good' | 'damaged' | 'maintenance';
// New type to distinguish between standard equipment and consumables
export type EquipmentType = 'equipment' | 'consumable';

// Quantity breakdown by status
export interface QuantityByStatus {
  good: number;
  damaged: number;
  maintenance: number;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  date: Date;
  description: string;
  workStatus?: 'pending' | 'in-progress' | 'completed';
  cost?: number;
  hoursSpent?: number;
  technician?: string;
  tags?: string[];
  notes?: string;
  isOutsideRepair?: boolean;
  vendorName?: string;
  expectedReturnDate?: Date;
  repairStatus?: 'sent' | 'in-progress' | 'ready-for-pickup' | 'returned';
  referenceNumber?: string;
}

export interface EquipmentItem {
  id:string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  quantity: number;
  status: EquipmentStatus; // DEPRECATED: Use quantityByStatus instead
  quantityByStatus: QuantityByStatus; // New field: breakdown by status
  location: string; // Physical location
  imageUrl?: string;
  imageData?: string; // Base64 encoded image
  imageContentType?: string; // MIME type (e.g., image/jpeg)
  dailyRate: number; // Will be 0 for consumables
  maintenanceHistory?: MaintenanceLog[]; 
  type: EquipmentType; // Added type field
}

export interface Client {
  id: string;
  name: string; // Company name or individual's full name
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  partnerId?: string; // Link to a Partner/Agency that this client is associated with
}

export type RentalPrepStatus = 'pending' | 'checked-out' | 'checked-in';

// New Event type
export interface Event {
  id: string;
  name: string;
  clientId: string;
  agencyId?: string;  // Partner/Agency that created/owns this event
  location: string;
  startDate: Date;
  endDate: Date;
  assignedTo?: string;
  date: Date; // Added date property for event filtering
  quoteId?: string; // Optional: Link to the quote used to create this event
  totalRevenue?: number; // Total revenue for this event (from quote or auto-calculated)
  subClients?: EventSubClient[]; // Multiple sub-clients for this event
}

export interface EventSubClient {
  id: string;
  eventId: string;
  clientId: string;
  createdAt: Date;
}

export interface Rental {
  id: string;
  eventId: string; // Link to the Event
  equipmentId: string;
  quantityRented: number;
  prepStatus?: RentalPrepStatus; // New property for check-in/out
}


// New types for Quotes
export type QuoteItemType = 'equipment' | 'service' | 'fee' | 'subrental';

export interface QuoteItem {
  id: string; // Unique ID for the quote item line
  type: QuoteItemType;
  // For equipment
  equipmentId?: string;
  equipmentName?: string;
  // For service
  serviceId?: string;
  serviceName?: string;
  // For fee
  feeId?: string;
  feeName?: string;
  // For subrental (from partner)
  partnerId?: string;
  partnerName?: string;
  subrentalCost?: number; // What we pay the partner (per day per unit)
  // Common fields
  quantity?: number; // For equipment/services/subrentals
  unitPrice?: number; // For equipment/services (what client pays per day per unit)
  days?: number; // For equipment/services/subrentals
  lineTotal: number;
  description?: string; // Optional description for the item
  // For fees
  amount?: number; // For fee
  feeType?: 'fixed' | 'percentage';
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Archived';

export interface Quote {
  id: string;
  quoteNumber: string; // e.g., Q2024-001
  name: string; // User-defined name for the quote
  location: string; // Venue/location for the event
  clientId?: string; // Optional: Link to an existing client
  clientName: string; // Can be manually entered or from selected client
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  startDate: Date;
  endDate: Date;
  items: QuoteItem[];
  subTotal: number;
  discountAmount: number; // Can be percentage or fixed amount
  discountType: 'percentage' | 'fixed';
  taxRate: number; // Percentage e.g. 0.05 for 5%
  taxAmount: number;
  totalAmount: number;
  status: QuoteStatus;
  notes?: string;
  terms?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Service types for quote management
export interface Service {
  id: string;
  name: string;
  description?: string;
  unitPrice: number; // Price per service
  unit: string; // e.g., 'hour', 'day', 'service', 'per event'
  category?: string; // e.g., 'Setup', 'Technical Support', 'Delivery'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Fee types for quote management
export interface Fee {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: 'fixed' | 'percentage'; // Fixed amount or percentage of total
  category?: string; // e.g., 'Delivery', 'Setup', 'Insurance', 'Late Return'
  isActive: boolean;
  isRequired: boolean; // If true, automatically added to all quotes
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Partner types for subrental and agency management
export type PartnerType = 'provider' | 'agency' | 'both';

export interface Partner {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  clientId?: string;
  partnerType: PartnerType;
  commission?: number;
  isActive: boolean;
  logoUrl?: string; // Company logo URL for catalogs
  version?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  subrentals?: Subrental[];
  jobReferences?: JobReference[];
  _count?: {
    subrentals: number;
    jobReferences?: number;
  };
}

export type JobReferenceStatus = 'pending' | 'active' | 'completed' | 'archived';

export interface JobReference {
  id: string;
  partnerId: string;
  eventId?: string;
  quoteId?: string;
  clientName?: string;
  referralNotes?: string;
  commission?: number;
  status: JobReferenceStatus;
  referralDate: Date;
  version?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  partner?: Partner;
  event?: Event;
  quote?: Quote;
}

export type SubrentalStatus = 'pending' | 'active' | 'returned' | 'cancelled';

export interface Subrental {
  id: string;
  partnerId: string;
  eventId?: string;
  equipmentName: string;
  equipmentDesc?: string;
  quantity: number;
  dailyRate: number;
  totalCost: number;
  startDate: Date;
  endDate: Date;
  status: SubrentalStatus;
  invoiceNumber?: string;
  notes?: string;
  version?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  partner?: Partner;
  event?: Event;
}
