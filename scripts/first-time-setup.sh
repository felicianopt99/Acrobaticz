#!/bin/bash

# ============================================================================
# AV Rentals - First Time Setup Script
# ============================================================================
# This script safely initializes the application for a new user
# Usage: bash scripts/first-time-setup.sh
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

print_header "🚀 AV Rentals - First Time Setup"

# Step 1: Check if in correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    print_info "Please run this script from the root directory:"
    echo "  cd av-rentals"
    echo "  bash scripts/first-time-setup.sh"
    exit 1
fi

print_success "Found package.json in correct directory"

# Step 2: Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_info "Download from: https://nodejs.org (v18 or higher)"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Found Node.js: $NODE_VERSION"

# Step 3: Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi

print_success "Found npm"

# Step 4: Check for .env file
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_info "Creating from .env.example..."
    
    if [ ! -f ".env.example" ]; then
        print_error ".env.example not found!"
        exit 1
    fi
    
    cp .env.example .env
    print_success "Created .env file"
    
    print_warning "IMPORTANT: Edit .env with your database configuration!"
    print_info "Open .env in your text editor and update DATABASE_URL"
    echo ""
    echo "Example:"
    echo "  DATABASE_URL=\"postgresql://user:password@localhost:5432/avrentals_db\""
    echo ""
    read -p "Press Enter when you've updated .env, or Ctrl+C to cancel: "
fi

# Step 5: Check DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && ! grep -q "^DATABASE_URL=" .env; then
    print_error "DATABASE_URL not configured!"
    print_info "Edit .env and set DATABASE_URL before running this script"
    exit 1
fi

print_success "DATABASE_URL is configured"

# Step 6: Install dependencies
print_header "📦 Installing Dependencies"

if [ -d "node_modules" ]; then
    print_warning "node_modules already exists"
    read -p "Reinstall dependencies? (y/N): " REINSTALL
    if [ "$REINSTALL" = "y" ] || [ "$REINSTALL" = "Y" ]; then
        rm -rf node_modules package-lock.json
        npm install
    fi
else
    npm install
fi

print_success "Dependencies installed"

# Step 7: Generate Prisma Client
print_header "🔧 Generating Prisma Client"

npm run db:generate
print_success "Prisma Client generated"

# Step 8: Run migrations
print_header "🗄️  Running Database Migrations"

npm run db:migrate -- --skip-generate
print_success "Database migrations completed"

# Step 9: Seed database
print_header "🌱 Seeding Database"

# Generate secure admin password
ADMIN_PASSWORD=$(openssl rand -base64 12)

# Run seed script with the generated password
ADMIN_PASSWORD="$ADMIN_PASSWORD" npm run db:seed:defaults 2>/dev/null || {
    print_warning "Seed script not found or failed"
    print_info "Running manual seed..."
    
    # Create database admin user programmatically
    npm run db:seed
}

print_success "Database seeded"

# Step 10: Display login credentials
print_header "✅ Setup Complete!"

echo ""
echo "📊 Your application is ready to use!"
echo ""
print_success "Application: http://localhost:3000"
echo ""
echo "👤 Initial Admin Credentials:"
echo "   Username: admin"
echo "   Password: $ADMIN_PASSWORD"
echo ""
print_warning "IMPORTANT: Save this password somewhere secure!"
print_warning "You can change it in Settings → Profile after login"
echo ""

# Step 11: Display next steps
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Start the application:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Open browser:"
echo "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "3. Login with credentials above"
echo ""
echo "4. Change your password immediately"
echo ""
echo "5. Start adding your equipment and clients"
echo ""

# Step 12: Ask if user wants to start the app
read -p "Start development server now? (Y/n): " START_APP
if [ "$START_APP" != "n" ] && [ "$START_APP" != "N" ]; then
    print_header "🚀 Starting Application"
    print_info "Server running at http://localhost:3000"
    print_info "Press Ctrl+C to stop"
    npm run dev
else
    echo ""
    print_info "To start later, run:"
    echo "  ${YELLOW}npm run dev${NC}"
    echo ""
fi
