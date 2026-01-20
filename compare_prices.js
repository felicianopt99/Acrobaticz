#!/usr/bin/env node

/**
 * Script to compare product prices between CATALOG_65_PRODUTOS.md and database
 */

const fs = require('fs');
const path = require('path');

// Read the markdown file
const catalogPath = path.join(__dirname, 'CATALOG_65_PRODUTOS', 'CATALOGO_65_PRODUTOS.md');
const content = fs.readFileSync(catalogPath, 'utf-8');

// Parse products and prices from markdown
const products = [];
const lines = content.split('\n');

let currentProduct = null;
let currentName = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect product title (#### 1. Product Name)
  if (line.match(/^####\s+\d+\.\s+(.+)/)) {
    if (currentProduct) {
      products.push(currentProduct);
    }
    currentName = line.replace(/^####\s+\d+\.\s+/, '').trim();
    currentProduct = { name: currentName, price: null, quantity: null, status: null, location: null, id: null };
  }

  // Extract ID
  if (line.includes('**ID:**')) {
    const match = line.match(/`([^`]+)`/);
    if (match) currentProduct.id = match[1];
  }

  // Extract daily rate (price)
  if (line.includes('**Taxa Diária:**')) {
    const match = line.match(/€([\d.]+)/);
    if (match) currentProduct.price = parseFloat(match[1]);
  }

  // Extract quantity
  if (line.includes('**Quantidade Disponível:**')) {
    const match = line.match(/:\s*(\d+)/);
    if (match) currentProduct.quantity = parseInt(match[1], 10);
  }

  // Extract status
  if (line.includes('**Status:**')) {
    const match = line.match(/:\s*(\w+)/);
    if (match) currentProduct.status = match[1];
  }

  // Extract location
  if (line.includes('**Localização:**')) {
    const match = line.match(/:\s*(.+)/);
    if (match) currentProduct.location = match[1].trim();
  }
}

// Add last product
if (currentProduct) {
  products.push(currentProduct);
}

console.log('\n📋 PRODUCTS FOUND IN MARKDOWN:\n');
console.log('Total products:', products.length);
console.log('\n' + '─'.repeat(80));

products.forEach((p, idx) => {
  console.log(`\n${idx + 1}. ${p.name}`);
  console.log(`   ID: ${p.id}`);
  console.log(`   Price: €${p.price || 'NOT FOUND'}`);
  console.log(`   Quantity: ${p.quantity}`);
  console.log(`   Status: ${p.status}`);
  console.log(`   Location: ${p.location}`);
});

// Export to JSON for comparison
const outputPath = path.join(__dirname, 'CATALOG_PRICES.json');
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
console.log(`\n✅ Exported to: ${outputPath}\n`);

console.log('Summary by price range:');
const priceRanges = {
  'Under €20': products.filter(p => p.price && p.price < 20).length,
  '€20-50': products.filter(p => p.price && p.price >= 20 && p.price < 50).length,
  '€50-100': products.filter(p => p.price && p.price >= 50 && p.price < 100).length,
  'Over €100': products.filter(p => p.price && p.price >= 100).length,
  'No price': products.filter(p => !p.price).length,
};

Object.entries(priceRanges).forEach(([range, count]) => {
  console.log(`  ${range}: ${count} products`);
});
