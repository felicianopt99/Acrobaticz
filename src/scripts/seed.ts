#!/usr/bin/env tsx
/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🌱 UNIFIED SEED SCRIPT - AV-RENTALS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is the SINGLE SOURCE OF TRUTH for database seeding.
 * Used by: CLI, Docker entrypoint, Setup Wizard API
 * Data source: CATALOG_65_PRODUTOS/
 * 
 * IDEMPOTENT: Can be run multiple times without duplicating data (uses upsert)
 * 
 * Usage:
 *   npm run db:seed              # Basic seed (upsert mode - idempotent)
 *   npm run db:seed -- --clean   # Clean database first, then seed
 *   npm run db:seed -- --dry-run # Show what would be seeded
 *   npm run db:seed -- --verbose # Show detailed output
 *   npm run db:seed -- --check   # Check if database needs seeding (exit 0=needs, 1=seeded)
 * 
 * What gets seeded:
 *   ✅ 3 Users (Admin, Manager, Technician)
 *   ✅ 1 Client (VRD Production)
 *   ✅ 1 Partner (VRD Production)
 *   ✅ 6 Categories
 *   ✅ 21 Subcategories
 *   ✅ 65 Products with full descriptions (PT/EN)
 *   ✅ 77 Product Images → public/images/
 *   ✅ Platform Logos → public/logos/
 * 
 * Environment Variables:
 *   SEED_ON_START=true    # Auto-seed on Docker startup
 *   SEED_CLEAN=true       # Clean before seed
 *   SEED_VERBOSE=true     # Verbose output
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const prisma = new PrismaClient();
const CATALOG_DIR = path.join(process.cwd(), 'CATALOG_65_PRODUTOS');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Default password for seeded users
const DEFAULT_PASSWORD = 'Acrobaticz2026!';

// Terminal colors
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// ============================================================================
// Types
// ============================================================================

interface SeedStats {
  users: number;
  clients: number;
  partners: number;
  categories: number;
  subcategories: number;
  products: number;
  images: number;
  logos: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

interface CatalogData {
  users: any[];
  clients: any[];
  partners: any[];
  categories: Record<string, string>;
  subcategories: Record<string, { name: string; parentId: string }>;
  products: Product[];
  logos: any;
}

interface Product {
  id: string;
  name: string;
  descriptionPt: string;
  descriptionEn: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  imageUrl: string;
  status: string;
  location: string;
}

// ============================================================================
// Logger
// ============================================================================

const log = {
  header: (title: string) => {
    console.log(`\n${C.cyan}${C.bright}${'━'.repeat(70)}${C.reset}`);
    console.log(`${C.cyan}${C.bright}  🌱 ${title}${C.reset}`);
    console.log(`${C.cyan}${C.bright}${'━'.repeat(70)}${C.reset}\n`);
  },
  section: (title: string) => {
    console.log(`\n${C.blue}${C.bright}▸ ${title}${C.reset}\n`);
  },
  item: (msg: string) => console.log(`  ${C.green}✓${C.reset} ${msg}`),
  info: (msg: string) => console.log(`  ${C.blue}ℹ${C.reset} ${msg}`),
  warn: (msg: string) => console.log(`  ${C.yellow}⚠${C.reset} ${msg}`),
  error: (msg: string) => console.log(`  ${C.red}✗${C.reset} ${msg}`),
  stat: (label: string, value: number | string) =>
    console.log(`  ${C.dim}• ${label}:${C.reset} ${C.bright}${value}${C.reset}`),
  progress: (current: number, total: number, label: string) => {
    const pct = Math.round((current / total) * 100);
    const filled = Math.round(pct / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    process.stdout.write(`\r  ${bar} ${pct}% (${current}/${total}) ${label}    `);
    if (current === total) console.log('');
  },
};

// ============================================================================
// Data Loading
// ============================================================================

function loadJSON(filename: string): any {
  const filepath = path.join(CATALOG_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function loadCatalogData(): CatalogData {
  log.section('Loading Catalog Data');

  // Load supplementary data (categories, subcategories)
  const suppData = loadJSON('SUPPLEMENTARY_DATA.json');
  log.item(`Loaded ${Object.keys(suppData.categories || {}).length} categories`);
  log.item(`Loaded ${Object.keys(suppData.subcategories || {}).length} subcategories`);

  // Load users, clients, partners
  const usersData = loadJSON('USERS_CLIENTS_PARTNERS.json');
  log.item(`Loaded ${usersData.users?.length || 0} users`);
  log.item(`Loaded ${usersData.clients?.length || 0} clients`);
  log.item(`Loaded ${usersData.partners?.length || 0} partners`);

  // Parse products from markdown
  const markdownPath = path.join(CATALOG_DIR, 'CATALOGO_65_PRODUTOS.md');
  const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
  const products = parseProductsFromMarkdown(markdownContent);
  log.item(`Parsed ${products.length} products from markdown`);

  return {
    users: usersData.users || [],
    clients: usersData.clients || [],
    partners: usersData.partners || [],
    categories: suppData.categories || {},
    subcategories: suppData.subcategories || {},
    products,
    logos: usersData.logos || {},
  };
}

// ============================================================================
// Markdown Parser
// ============================================================================

function parseProductsFromMarkdown(content: string): Product[] {
  const products: Product[] = [];
  const lines = content.split('\n');

  let currentCategory = '';
  let currentSubcategory = '';
  let buffer: Partial<Product> = {};
  let inDescEn = false;
  let inDescPt = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Category (## Lighting or ## 💡 Lighting)
    if (line.startsWith('## ')) {
      // Remove any emoji characters and extract category name
      const cleanLine = line.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
      const match = cleanLine.match(/^##\s+(.+)/);
      if (match && !match[1].includes('Índice')) {
        currentCategory = match[1].trim();
      }
    }

    // Subcategory (### Moving Head (4 produtos))
    if (line.match(/^### [A-Z]/)) {
      const match = line.match(/^### (.+?) \(/);
      if (match) {
        currentSubcategory = match[1].trim();
      }
    }

    // Product header (#### 1. Product Name)
    if (line.match(/^#### \d+\./)) {
      // Save previous product if exists
      if (buffer.name && buffer.id && currentCategory) {
        products.push(createProduct(buffer, currentCategory, currentSubcategory));
      }

      // Start new product
      buffer = {
        name: line.replace(/#### \d+\.\s*/, '').trim(),
        descriptionPt: '',
        descriptionEn: '',
        price: 0,
        quantity: 1,
        imageUrl: '',
        status: 'good',
        location: 'Warehouse A',
      };
      inDescEn = false;
      inDescPt = false;
    }

    // Extract ID
    if (line.includes('**ID:**')) {
      const match = line.match(/\*\*ID:\*\*\s*`([^`]+)`/);
      if (match) buffer.id = match[1];
    }

    // Extract image URL
    if (line.includes('./images/equipment-')) {
      const match = line.match(/\(\.\/images\/(equipment-[^)]+)\)/);
      if (match) buffer.imageUrl = `/images/${match[1]}`;
    }

    // Extract daily rate
    if (line.includes('**Taxa Diária:**')) {
      const match = line.match(/€([\d.]+)/);
      if (match) buffer.price = parseFloat(match[1]);
    }

    // Extract quantity
    if (line.includes('**Quantidade Disponível:**')) {
      const match = line.match(/:\s*(\d+)/);
      if (match) buffer.quantity = parseInt(match[1], 10);
    }

    // Extract status
    if (line.includes('**Status:**')) {
      const match = line.match(/:\s*(\w+)/);
      if (match) buffer.status = match[1];
    }

    // Extract location
    if (line.includes('**Localização:**')) {
      const match = line.match(/:\s*(.+)/);
      if (match) buffer.location = match[1].trim();
    }

    // Extract English description
    if (line.includes('**Descrição (EN):**')) {
      inDescEn = true;
      inDescPt = false;
      const inline = line.replace('**Descrição (EN):**', '').trim();
      if (inline) buffer.descriptionEn = inline;
    } else if (inDescEn && !line.startsWith('**') && line.trim()) {
      buffer.descriptionEn = (buffer.descriptionEn || '') + ' ' + line.trim();
    }

    // Extract Portuguese description
    if (line.includes('**Descrição (PT):**')) {
      inDescPt = true;
      inDescEn = false;
      const inline = line.replace('**Descrição (PT):**', '').trim();
      if (inline) buffer.descriptionPt = inline;
    } else if (inDescPt && !line.startsWith('**') && line.trim()) {
      buffer.descriptionPt = (buffer.descriptionPt || '') + ' ' + line.trim();
    }

    // Stop description capture on next field
    if (line.startsWith('**Taxa') || line.startsWith('**Quantidade') || line.startsWith('**Status') || line.startsWith('**Localização') || line.startsWith('---')) {
      inDescEn = false;
      inDescPt = false;
    }
  }

  // Don't forget last product
  if (buffer.name && buffer.id && currentCategory) {
    products.push(createProduct(buffer, currentCategory, currentSubcategory));
  }

  return products;
}

function createProduct(buffer: Partial<Product>, category: string, subcategory: string): Product {
  // Generate placeholder image URL based on category
  const placeholderImages: Record<string, string> = {
    'Lighting': 'https://images.unsplash.com/photo-1578232904666-ffa8ae7e9b6c?w=500&h=500&fit=crop',
    'Audio and Sound': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    'Video': 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&h=500&fit=crop',
    'Power': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&h=500&fit=crop',
    'Staging and Structures': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=500&fit=crop',
    'Others': 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&h=500&fit=crop',
  };

  // Use buffer imageUrl if available, fallback to placeholder
  const imageUrl = buffer.imageUrl && buffer.imageUrl.trim() 
    ? buffer.imageUrl 
    : placeholderImages[category] || placeholderImages['Others'];

  return {
    id: buffer.id || randomUUID(),
    name: buffer.name || 'Unknown Product',
    descriptionPt: (buffer.descriptionPt || 'Equipamento AV profissional').substring(0, 1000).trim(),
    descriptionEn: (buffer.descriptionEn || 'Professional AV equipment').substring(0, 1000).trim(),
    category,
    subcategory,
    price: buffer.price || 50,
    quantity: buffer.quantity || 1,
    imageUrl,
    status: buffer.status || 'good',
    location: buffer.location || 'Warehouse A',
  };
}

// ============================================================================
// Seeding Functions
// ============================================================================

async function seedUsers(data: CatalogData, stats: SeedStats, verbose: boolean) {
  log.section('Seeding Users');

  for (const user of data.users) {
    try {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

      await prisma.user.upsert({
        where: { username: user.username },
        update: {
          name: user.name,
          contactEmail: user.email,
          contactPhone: user.phone || null,
          role: user.role.toUpperCase(),
        },
        create: {
          id: user.id || randomUUID(),
          name: user.name,
          username: user.username,
          password: hashedPassword,
          contactEmail: user.email,
          contactPhone: user.phone || null,
          role: user.role.toUpperCase(),
          updatedAt: new Date(),
        },
      });

      if (verbose) log.item(`${user.role.toUpperCase()}: ${user.name} (${user.email})`);
      stats.users++;
    } catch (error) {
      log.error(`User ${user.username}: ${error}`);
      stats.errors++;
    }
  }

  log.stat('Users seeded', stats.users);
}

async function seedClients(data: CatalogData, stats: SeedStats, verbose: boolean) {
  log.section('Seeding Clients');

  for (const client of data.clients) {
    try {
      const notes = [
        client.specialties ? `Specialties: ${client.specialties.join(', ')}` : '',
        client.website ? `Website: ${client.website}` : '',
        client.productAccessPercentage ? `Catalog Access: ${client.productAccessPercentage}%` : '',
      ].filter(Boolean).join(' | ');

      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          name: client.company || client.name,
          contactPerson: client.name,
          phone: client.phone,
          address: client.location,
          notes: notes || null,
          email: client.email,
        },
        create: {
          id: client.id || randomUUID(),
          name: client.company || client.name,
          contactPerson: client.name,
          phone: client.phone,
          address: client.location,
          notes: notes || null,
          email: client.email,
          updatedAt: new Date(),
        },
      });

      if (verbose) log.item(`${client.company || client.name} - ${client.location}`);
      stats.clients++;
    } catch (error) {
      log.error(`Client ${client.name}: ${error}`);
      stats.errors++;
    }
  }

  log.stat('Clients seeded', stats.clients);
}

async function seedPartners(data: CatalogData, stats: SeedStats, verbose: boolean) {
  log.section('Seeding Partners');

  for (const partner of data.partners) {
    try {
      const email = partner.contact || `${partner.name.toLowerCase().replace(/\s/g, '')}@partner.local`;
      const partnerType = (partner.type || 'provider').toLowerCase();

      await prisma.partner.upsert({
        where: { id: partner.id },
        update: {
          name: partner.name,
          phone: partner.phone || null,
          partnerType: partnerType,
          commission: partner.commissionPercentage || null,
          isActive: true,
          email: email,
        },
        create: {
          id: partner.id || randomUUID(),
          name: partner.name,
          phone: partner.phone || null,
          partnerType: partnerType,
          commission: partner.commissionPercentage || null,
          isActive: true,
          email: email,
          updatedAt: new Date(),
        },
      });

      if (verbose) log.item(`${partner.name} (${partnerType})`);
      stats.partners++;
    } catch (error) {
      log.error(`Partner ${partner.name}: ${error}`);
      stats.errors++;
    }
  }

  log.stat('Partners seeded', stats.partners);
}

async function seedCategories(data: CatalogData, stats: SeedStats, verbose: boolean) {
  log.section('Seeding Categories');

  const categoryIcons: Record<string, string> = {
    'Lighting': '💡',
    'Audio and Sound': '🎤',
    'Video': '📹',
    'Power': '⚡',
    'Staging and Structures': '🏗️',
    'Others': '📦',
  };

  for (const [id, name] of Object.entries(data.categories)) {
    try {
      await prisma.category.upsert({
        where: { id },
        update: {
          name: String(name),
          description: `${name} - Professional AV Equipment`,
        },
        create: {
          id,
          name: String(name),
          description: `${name} - Professional AV Equipment`,
          icon: categoryIcons[String(name)] || '📦',
          updatedAt: new Date(),
        },
      });

      if (verbose) log.item(`Category: ${name}`);
      stats.categories++;
    } catch (error) {
      log.error(`Category ${name}: ${error}`);
      stats.errors++;
    }
  }

  log.stat('Categories seeded', stats.categories);
}

async function seedSubcategories(data: CatalogData, stats: SeedStats, verbose: boolean) {
  log.section('Seeding Subcategories');

  for (const [id, subcat] of Object.entries(data.subcategories)) {
    try {
      const parent = await prisma.category.findUnique({
        where: { id: subcat.parentId },
      });

      if (!parent) {
        if (verbose) log.warn(`Parent not found for subcategory: ${subcat.name}`);
        continue;
      }

      await prisma.subcategory.upsert({
        where: { id },
        update: {
          name: subcat.name,
          parentId: parent.id,
        },
        create: {
          id,
          name: subcat.name,
          parentId: parent.id,
          updatedAt: new Date(),
        },
      });

      stats.subcategories++;
    } catch (error) {
      log.error(`Subcategory ${subcat.name}: ${error}`);
      stats.errors++;
    }
  }

  log.stat('Subcategories seeded', stats.subcategories);
}

async function seedProducts(data: CatalogData, stats: SeedStats, verbose: boolean) {
  log.section('Seeding Products');
  log.info(`Processing ${data.products.length} products...`);

  for (let i = 0; i < data.products.length; i++) {
    const product = data.products[i];

    try {
      // Find category - REQUIRED
      const category = await prisma.category.findFirst({
        where: { name: { contains: product.category, mode: 'insensitive' } },
      });

      if (!category) {
        log.warn(`Product ${product.name}: Category "${product.category}" not found, skipping...`);
        stats.errors++;
        continue;
      }

      // Find subcategory - OPTIONAL
      const subcategory = await prisma.subcategory.findFirst({
        where: {
          name: { contains: product.subcategory, mode: 'insensitive' },
          parentId: category.id,
        },
      });

      // Validate price and quantity
      const dailyRate = Math.max(0, Math.round((product.price || 0) * 100)); // Convert to cents
      const quantity = Math.max(0, product.quantity || 1);

      // Ensure imageUrl is a valid string (not empty or null)
      // imageUrl will already have a placeholder from createProduct() if not set
      const imageUrl = product.imageUrl && product.imageUrl.trim() ? product.imageUrl : null;

      await prisma.equipmentItem.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.descriptionEn,
          descriptionPt: product.descriptionPt,
          type: 'equipment',
          categoryId: category.id, // REQUIRED - must have valid category
          subcategoryId: subcategory?.id || null, // OPTIONAL
          quantity,
          dailyRate,
          status: (product.status || 'good').toUpperCase(),
          location: product.location || 'Warehouse A',
          imageUrl,
        },
        create: {
          id: product.id,
          name: product.name,
          description: product.descriptionEn,
          descriptionPt: product.descriptionPt,
          type: 'equipment',
          categoryId: category.id, // REQUIRED - must have valid category
          subcategoryId: subcategory?.id || null, // OPTIONAL
          quantity,
          dailyRate,
          status: (product.status || 'good').toUpperCase(),
          location: product.location || 'Warehouse A',
          imageUrl,
          updatedAt: new Date(),
        },
      });

      stats.products++;

      // Progress bar every 10 products
      if ((i + 1) % 10 === 0 || i === data.products.length - 1) {
        log.progress(i + 1, data.products.length, 'products');
      }
    } catch (error) {
      log.error(`Product ${product.name}: ${error instanceof Error ? error.message : String(error)}`);
      stats.errors++;
    }
  }

  log.stat('Products seeded', stats.products);
}

async function copyAssets(stats: SeedStats, verbose: boolean) {
  log.section('Copying Assets to public/');

  const imageSource = path.join(CATALOG_DIR, 'images');
  const logoSource = path.join(CATALOG_DIR, 'logos');
  const publicImages = path.join(PUBLIC_DIR, 'images');
  const publicLogos = path.join(PUBLIC_DIR, 'logos');

  // Copy product images
  if (fs.existsSync(imageSource)) {
    if (!fs.existsSync(publicImages)) {
      fs.mkdirSync(publicImages, { recursive: true });
    }

    const images = fs.readdirSync(imageSource).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp')
    );

    log.info(`Copying ${images.length} product images...`);

    for (let i = 0; i < images.length; i++) {
      try {
        const src = path.join(imageSource, images[i]);
        const dest = path.join(publicImages, images[i]);

        fs.copyFileSync(src, dest);
        stats.images++;

        if ((i + 1) % 20 === 0 || i === images.length - 1) {
          log.progress(i + 1, images.length, 'images');
        }
      } catch (error) {
        if (verbose) log.warn(`Image ${images[i]}: ${error}`);
      }
    }

    log.stat('Images copied', stats.images);
  } else {
    log.warn('No images directory found');
  }

  // Copy logos
  if (fs.existsSync(logoSource)) {
    if (!fs.existsSync(publicLogos)) {
      fs.mkdirSync(publicLogos, { recursive: true });
    }

    log.info('Copying logos...');

    const copyRecursive = (src: string, dest: string) => {
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
          const subDest = path.join(dest, item);
          if (!fs.existsSync(subDest)) {
            fs.mkdirSync(subDest, { recursive: true });
          }
          copyRecursive(srcPath, subDest);
        } else {
          try {
            const destPath = path.join(dest, item);
            fs.copyFileSync(srcPath, destPath);
            stats.logos++;
            if (verbose) log.item(item);
          } catch (error) {
            if (verbose) log.warn(`Logo ${item}: ${error}`);
          }
        }
      }
    };

    copyRecursive(logoSource, publicLogos);
    log.stat('Logos copied', stats.logos);
  }
}

async function cleanDatabase() {
  log.section('Cleaning Database');

  try {
    // Delete in dependency order
    const counts = {
      equipment: await prisma.equipmentItem.deleteMany({}),
      subcategories: await prisma.subcategory.deleteMany({}),
      categories: await prisma.category.deleteMany({}),
      partners: await prisma.partner.deleteMany({}),
      clients: await prisma.client.deleteMany({}),
      users: await prisma.user.deleteMany({}),
    };

    log.item(`Deleted ${counts.equipment.count} equipment items`);
    log.item(`Deleted ${counts.subcategories.count} subcategories`);
    log.item(`Deleted ${counts.categories.count} categories`);
    log.item(`Deleted ${counts.partners.count} partners`);
    log.item(`Deleted ${counts.clients.count} clients`);
    log.item(`Deleted ${counts.users.count} users`);
  } catch (error) {
    log.error(`Cleanup failed: ${error}`);
    throw error;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Check if database needs seeding
 * Returns true if database is empty or missing essential data
 */
async function checkNeedsSeeding(): Promise<boolean> {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { username: 'feliciano' }
    });
    
    // Check if categories exist
    const categoryCount = await prisma.category.count();
    
    // Check if products exist
    const productCount = await prisma.equipmentItem.count();
    
    // Database needs seeding if any of these are missing
    const needsSeeding = !adminUser || categoryCount === 0 || productCount === 0;
    
    return needsSeeding;
  } catch (error) {
    // If we can't check, assume we need seeding
    return true;
  }
}

/**
 * Export for API usage
 */
export { checkNeedsSeeding };

async function main() {
  const args = process.argv.slice(2);
  const envClean = process.env.SEED_CLEAN === 'true';
  const envVerbose = process.env.SEED_VERBOSE === 'true';
  
  const options = {
    clean: args.includes('--clean') || envClean,
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v') || envVerbose,
    check: args.includes('--check'),
  };

  // Check mode - just verify if seeding is needed
  if (options.check) {
    const needsSeeding = await checkNeedsSeeding();
    if (needsSeeding) {
      console.log('Database needs seeding');
      process.exit(0); // Exit 0 = needs seeding
    } else {
      console.log('Database already seeded');
      process.exit(1); // Exit 1 = already seeded
    }
  }

  const stats: SeedStats = {
    users: 0,
    clients: 0,
    partners: 0,
    categories: 0,
    subcategories: 0,
    products: 0,
    images: 0,
    logos: 0,
    errors: 0,
    startTime: new Date(),
  };

  log.header('AV-RENTALS DATABASE SEEDING');

  log.info(`Catalog Directory: ${CATALOG_DIR}`);
  log.info(`Public Directory: ${PUBLIC_DIR}`);
  log.info(`Clean Mode: ${options.clean ? 'YES' : 'NO'}`);
  log.info(`Dry Run: ${options.dryRun ? 'YES' : 'NO'}`);
  log.info(`Verbose: ${options.verbose ? 'YES' : 'NO'}`);

  if (!fs.existsSync(CATALOG_DIR)) {
    log.error(`Catalog directory not found: ${CATALOG_DIR}`);
    process.exit(1);
  }

  try {
    // Load all data
    const data = loadCatalogData();

    // Dry run - just show summary
    if (options.dryRun) {
      log.section('DRY RUN - What would be seeded:');
      log.stat('Users', data.users.length);
      log.stat('Clients', data.clients.length);
      log.stat('Partners', data.partners.length);
      log.stat('Categories', Object.keys(data.categories).length);
      log.stat('Subcategories', Object.keys(data.subcategories).length);
      log.stat('Products', data.products.length);

      const imageDir = path.join(CATALOG_DIR, 'images');
      if (fs.existsSync(imageDir)) {
        log.stat('Images', fs.readdirSync(imageDir).length);
      }

      console.log(`\n${C.yellow}No changes made (dry run mode)${C.reset}\n`);
      await prisma.$disconnect();
      return;
    }

    // Clean database if requested
    if (options.clean) {
      await cleanDatabase();
    }

    // Execute seeding in order
    await seedUsers(data, stats, options.verbose);
    await seedClients(data, stats, options.verbose);
    await seedPartners(data, stats, options.verbose);
    await seedCategories(data, stats, options.verbose);
    await seedSubcategories(data, stats, options.verbose);
    await seedProducts(data, stats, options.verbose);
    await copyAssets(stats, options.verbose);

    // Final summary
    stats.endTime = new Date();
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

    log.header('SEEDING COMPLETED');
    log.stat('Users', stats.users);
    log.stat('Clients', stats.clients);
    log.stat('Partners', stats.partners);
    log.stat('Categories', stats.categories);
    log.stat('Subcategories', stats.subcategories);
    log.stat('Products', stats.products);
    log.stat('Images', stats.images);
    log.stat('Logos', stats.logos);
    log.stat('Errors', stats.errors);
    log.stat('Duration', `${duration.toFixed(2)}s`);

    if (stats.errors > 0) {
      console.log(`\n${C.yellow}⚠ Completed with ${stats.errors} errors${C.reset}\n`);
    } else {
      console.log(`\n${C.green}${C.bright}✅ All data seeded successfully!${C.reset}\n`);
    }

    process.exit(stats.errors > 0 ? 1 : 0);
  } catch (error) {
    log.error(`Fatal error: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();
