#!/usr/bin/env python3
"""
Script to extract and compare product prices from catalog markdown
"""

import re
import json
from pathlib import Path

# Read catalog
catalog_path = Path(__file__).parent / 'CATALOG_65_PRODUTOS' / 'CATALOGO_65_PRODUTOS.md'
content = catalog_path.read_text(encoding='utf-8')

products = []
lines = content.split('\n')

current_product = None
product_count = 0

for i, line in enumerate(lines):
    # Detect product title (#### 1. Product Name)
    match = re.match(r'^####\s+\d+\.\s+(.+)', line)
    if match:
        if current_product:
            products.append(current_product)
        product_count += 1
        current_product = {
            'num': product_count,
            'name': match.group(1).strip(),
            'price_eur': None,
            'price_cents': None,
            'quantity': None,
            'status': None,
            'location': None,
            'id': None,
            'line': i + 1
        }

    # Extract ID
    if '**ID:**' in line and current_product:
        id_match = re.search(r'`([^`]+)`', line)
        if id_match:
            current_product['id'] = id_match.group(1)

    # Extract daily rate
    if '**Taxa Diária:**' in line and current_product:
        price_match = re.search(r'€([\d.]+)', line)
        if price_match:
            eur = float(price_match.group(1))
            current_product['price_eur'] = eur
            current_product['price_cents'] = int(eur * 100)

    # Extract quantity
    if '**Quantidade Disponível:**' in line and current_product:
        qty_match = re.search(r':\s*(\d+)', line)
        if qty_match:
            current_product['quantity'] = int(qty_match.group(1))

    # Extract status
    if '**Status:**' in line and current_product:
        status_match = re.search(r':\s*(\w+)', line)
        if status_match:
            current_product['status'] = status_match.group(1)

    # Extract location
    if '**Localização:**' in line and current_product:
        loc_match = re.search(r':\s*(.+?)(?:\n|$)', line)
        if loc_match:
            current_product['location'] = loc_match.group(1).strip()

# Add last product
if current_product:
    products.append(current_product)

# Display results
print("\n" + "="*100)
print("📦 CATALOG PRICE ANALYSIS - 65 PRODUTOS")
print("="*100 + "\n")

print(f"Total products found: {len(products)}\n")

# Group by price ranges
price_ranges = {
    'Under €20': [],
    '€20-50': [],
    '€50-100': [],
    '€100-200': [],
    'Over €200': [],
    'No price': []
}

for p in products:
    if p['price_eur'] is None:
        price_ranges['No price'].append(p)
    elif p['price_eur'] < 20:
        price_ranges['Under €20'].append(p)
    elif p['price_eur'] < 50:
        price_ranges['€20-50'].append(p)
    elif p['price_eur'] < 100:
        price_ranges['€50-100'].append(p)
    elif p['price_eur'] < 200:
        price_ranges['€100-200'].append(p)
    else:
        price_ranges['Over €200'].append(p)

print("📊 PRICES BY RANGE:\n")
for range_name, items in price_ranges.items():
    if items:
        print(f"{range_name}: {len(items)} products")

print("\n" + "-"*100)
print("\n🔍 DETAILED PRODUCT LIST:\n")

for p in products:
    price_str = f"€{p['price_eur']:.2f}" if p['price_eur'] is not None else "⚠️  NO PRICE"
    qty_str = f"Qty: {p['quantity']}" if p['quantity'] is not None else "⚠️  NO QTY"
    status_str = p['status'] or "⚠️  NO STATUS"
    
    print(f"{p['num']:2d}. {p['name'][:50]:50s} | {price_str:>8s} ({p['price_cents']:>6d}¢) | {qty_str:>8s} | {status_str:10s}")

# Export to JSON
output_file = Path(__file__).parent / 'CATALOG_PRICES_ANALYSIS.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'total_products': len(products),
        'price_ranges': {k: len(v) for k, v in price_ranges.items()},
        'products': products
    }, f, indent=2, ensure_ascii=False)

print(f"\n✅ Exported to: {output_file}")

# Summary stats
total_revenue = sum(p['price_eur'] or 0 for p in products)
avg_price = total_revenue / len([p for p in products if p['price_eur'] is not None]) if len([p for p in products if p['price_eur'] is not None]) > 0 else 0

print(f"\n💰 PRICE STATISTICS:")
print(f"   Total value (if all rented 1x): €{total_revenue:,.2f}")
print(f"   Average price: €{avg_price:.2f}")
print(f"   Min price: €{min((p['price_eur'] for p in products if p['price_eur'] is not None), default=0):.2f}")
print(f"   Max price: €{max((p['price_eur'] for p in products if p['price_eur'] is not None), default=0):.2f}")
print()
