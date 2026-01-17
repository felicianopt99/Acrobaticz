/**
 * Static UI Translations - Textos estáticos que devem ser pré-traduzidos
 * 
 * Este ficheiro contém todos os textos da interface que aparecem frequentemente
 * e devem estar traduzidos imediatamente quando o utilizador abre a aplicação.
 * 
 * O sistema vai:
 * 1. Verificar quais textos já existem na BD
 * 2. Traduzir os que faltam via DeepL
 * 3. Cachear tudo no cliente
 */

// Dashboard texts
export const DASHBOARD_TEXTS = [
  // Greetings
  'Good morning',
  'Good afternoon', 
  'Good evening',
  'Hello',
  'Welcome back!',
  
  // Role messages
  'Ready to manage your team?',
  'How can we optimize operations today?',
  'What equipment needs your expertise?',
  "Let's check today's schedule!",
  'Stay updated with the latest info.',
  
  // Dashboard sections
  'Quick Actions',
  'Get started by creating new items or managing your inventory.',
  'Add New Equipment',
  'Manage Events',
  'Create New Quote',
  
  // Stats
  'Total Equipment',
  'Total Clients',
  'Upcoming Events',
  'Units in Maintenance',
  'In next 7 days',
  'Total units needing service',
  
  // Events
  'Your Events This Week',
  'Events assigned to you for the current week.',
  'No events assigned this week.',
  'View Details',
  
  // Notifications  
  'Notifications',
  'Show All',
  'No unread notifications',
  
  // Charts
  'Monthly Revenue',
  'Revenue from accepted quotes over the last 6 months.',
  'Top Clients by Revenue',
  'Your most valuable clients based on accepted quotes.',
  'Most Rented Equipment',
  'The most popular items in your inventory.',
  
  // Loading
  'Loading dashboard data...',
  'Loading...',
];

// Navigation / Sidebar texts
export const NAVIGATION_TEXTS = [
  'Dashboard',
  'Inventory',
  'Equipment',
  'Maintenance',
  'Clients',
  'Partners',
  'Team',
  'Rentals',
  'Quotes',
  'Events',
  'Settings',
  'System Settings',
  'Storage Dashboard',
  'Administration',
  'User Management',
  'Translation Management',
  'Customization',
  'PDF Branding',
  'Logout',
  'Profile',
];

// Common UI texts
export const COMMON_TEXTS = [
  // Actions
  'Save',
  'Cancel',
  'Delete',
  'Edit',
  'Create',
  'Update',
  'Add',
  'Remove',
  'Close',
  'Open',
  'Submit',
  'Confirm',
  'Back',
  'Next',
  'Previous',
  'Search',
  'Filter',
  'Clear',
  'Reset',
  'Refresh',
  'Export',
  'Import',
  'Download',
  'Upload',
  'Copy',
  'Paste',
  'Print',
  
  // Status
  'Active',
  'Inactive',
  'Pending',
  'Approved',
  'Rejected',
  'Completed',
  'In Progress',
  'Draft',
  'Published',
  'Archived',
  'Deleted',
  
  // Equipment status
  'Good',
  'Damaged',
  'In Maintenance',
  'Available',
  'Rented',
  'Reserved',
  
  // Forms
  'Name',
  'Email',
  'Phone',
  'Address',
  'Description',
  'Notes',
  'Date',
  'Time',
  'Location',
  'Category',
  'Type',
  'Status',
  'Price',
  'Quantity',
  'Total',
  'Subtotal',
  'Discount',
  'Tax',
  
  // Validation
  'Required field',
  'Invalid email',
  'Invalid phone number',
  'This field is required',
  'Please fill in all required fields',
  
  // Confirmations
  'Are you sure?',
  'This action cannot be undone.',
  'Successfully saved',
  'Successfully deleted',
  'Successfully updated',
  'Error occurred',
  'Please try again',
  
  // Table headers
  'Actions',
  'Created',
  'Updated',
  'Created At',
  'Updated At',
  'Last Modified',
  'Details',
  'View',
  'Options',
  
  // Pagination
  'Page',
  'of',
  'items',
  'per page',
  'Showing',
  'to',
  'results',
  'No results found',
  'No data available',
];

// Quotes/Estimates texts
export const QUOTES_TEXTS = [
  'New Quote',
  'Edit Quote',
  'Quote Details',
  'Quote Number',
  'Client',
  'Valid Until',
  'Items',
  'Add Item',
  'Remove Item',
  'Total Amount',
  'Send Quote',
  'Accept Quote',
  'Reject Quote',
  'Quote accepted',
  'Quote rejected',
  'Quote sent successfully',
  'Generate PDF',
  'Download PDF',
  'Rental Period',
  'Start Date',
  'End Date',
  'Days',
  'Unit Price',
  'Line Total',
];

// Events texts
export const EVENTS_TEXTS = [
  'New Event',
  'Edit Event',
  'Event Details',
  'Event Name',
  'Event Date',
  'Start Time',
  'End Time',
  'Assigned To',
  'Equipment List',
  'Event Location',
  'Event Notes',
  'All Events',
  'Upcoming Events',
  'Past Events',
  'Today',
  'This Week',
  'This Month',
];

// Equipment texts
export const EQUIPMENT_TEXTS = [
  'New Equipment',
  'Edit Equipment',
  'Equipment Details',
  'Equipment Name',
  'Equipment Type',
  'Serial Number',
  'Purchase Date',
  'Purchase Price',
  'Current Value',
  'Condition',
  'Availability',
  'Rental Rate',
  'Daily Rate',
  'Weekly Rate',
  'Monthly Rate',
  'Equipment Status',
  'Assign to Event',
  'Return Equipment',
  'Schedule Maintenance',
  'View History',
];

// Client texts
export const CLIENT_TEXTS = [
  'New Client',
  'Edit Client',
  'Client Details',
  'Client Name',
  'Contact Person',
  'Company',
  'Tax ID',
  'Client Notes',
  'Client History',
  'Total Quotes',
  'Total Events',
  'Total Revenue',
];

// Login texts
export const LOGIN_TEXTS = [
  'Login',
  'Sign In',
  'Welcome back',
  'Sign in to your account',
  'Username',
  'Password',
  'Enter your username',
  'Enter your password',
  'Signing in...',
  'Login successful',
  'Login failed',
  'Please check your credentials and try again.',
  'Forgot your password?',
  'Show password',
  'Hide password',
  'Please enter your username',
  'Please enter your password',
];

// Maintenance texts
export const MAINTENANCE_TEXTS = [
  'Maintenance',
  'Equipment Maintenance',
  'Maintenance Schedule',
  'Schedule Maintenance',
  'Complete',
  'In Progress',
  'Pending',
  'Add Maintenance Log',
  'Work Status',
  'Date of Work',
  'Work Type',
  'Hours Spent',
  'Cost',
  'Technician',
  'Vendor Name',
  'Expected Return Date',
  'Repair Status',
  'Reference Number',
  'Sent to Vendor',
  'Ready for Pickup',
  'Returned',
  'Outside Repair',
  'YTD spending',
  'Work orders recorded',
  'Days ago',
  'No history',
  'Avg completion time',
];

// Team/User Management texts
export const TEAM_TEXTS = [
  'Team',
  'Team Management',
  'User Management',
  'Add Member',
  'Add User',
  'Create User',
  'Edit User',
  'Delete User',
  'Role',
  'Admin',
  'Manager',
  'Technician',
  'Employee',
  'Viewer',
  'Active',
  'Inactive',
  'Active Status',
  'Invite User',
  'Team Member',
  'Add to Team',
  'Remove from Team',
  'Cover Photo',
  'Manage system users and their roles',
];

// Partners texts
export const PARTNERS_TEXTS = [
  'Partners',
  'New Partner',
  'Edit Partner',
  'Partner Details',
  'Partner Catalog',
  'View Catalog',
  'Share Catalog',
  'Partner Equipment',
];

// All static texts combined
export const ALL_STATIC_TEXTS = [
  ...DASHBOARD_TEXTS,
  ...NAVIGATION_TEXTS,
  ...COMMON_TEXTS,
  ...QUOTES_TEXTS,
  ...EVENTS_TEXTS,
  ...EQUIPMENT_TEXTS,
  ...CLIENT_TEXTS,
  ...LOGIN_TEXTS,
  ...MAINTENANCE_TEXTS,
  ...TEAM_TEXTS,
  ...PARTNERS_TEXTS,
];

// Remove duplicates
export const UNIQUE_STATIC_TEXTS = [...new Set(ALL_STATIC_TEXTS)];

export default UNIQUE_STATIC_TEXTS;
