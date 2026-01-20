#!/usr/bin/env python3
"""
Detailed price and data comparison: CATALOG vs SEED implementation
"""

import re
import json
from pathlib import Path

catalog_path = Path(__file__).parent / 'CATALOG_65_PRODUTOS' / 'CATALOGO_65_PRODUTOS.md'
content = catalog_path.read_text(encoding='utf-8')

# Split by product title
product_blocks = re.split(r'(?=^#### \d+\.)', content, flags=re.MULTILINE)

products = []

for block in product_blocks[1:]:  # Skip first empty split
    lines = block.split('\n')
    
    product = {
        'name': None,
        'id': None,
        'price_eur': None,
        'price_cents': None,
        'quantity': None,
        'status': None,
        'location': None,
        'desc_en': None,
        'desc_pt': None
    }
    
    for line in lines:
        # Name (#### 1. Product Name)
        if line.startswith('#### '):
            product['name'] = re.sub(r'^#### \d+\.\s*', '', line).strip()
        
        # ID
        elif '**ID:**' in line:
            match = re.search(r'`([^`]+)`', line)
            if match:
                product['id'] = match.group(1)
        
        # Price
        elif '**Taxa Diária:**' in line:
            match = re.search(r'€([\d.]+)', line)
            if match:
                eur = float(match.group(1))
                product['price_eur'] = eur
                product['price_cents'] = int(eur * 100)
        
        # Quantity
        elif '**Quantidade Disponível:**' in line:
            match = re.search(r':\s*(\d+)', line)
            if match:
                product['quantity'] = int(match.group(1))
        
        # Status
        elif line.startswith('**Status:**'):
            match = re.search(r':\s*(\w+)', line)
            if match:
                product['status'] = match.group(1)
        
        # Location
        elif '**Localização:**' in line:
            match = re.search(r':\s*(.+?)(?:\s*$|$)', line)
            if match:
                product['location'] = match.group(1).strip()
    
    if product['name']:
        products.append(product)

# Analysis
print("\n" + "="*120)
print("🔍 DETAILED PRICE & DATA VERIFICATION")
print("="*120 + "\n")

# Check for issues
issues = {
    'no_id': [],
    'no_price': [],
    'zero_price': [],
    'no_quantity': [],
    'no_status': [],
    'no_location': []
}

for i, p in enumerate(products, 1):
    if not p['id']:
        issues['no_id'].append(i)
    if p['price_eur'] is None:
        issues['no_price'].append(i)
    elif p['price_eur'] == 0:
        issues['zero_price'].append(i)
    if p['quantity'] is None:
        issues['no_quantity'].append(i)
    if not p['status']:
        issues['no_status'].append(i)
    if not p['location']:
        issues['no_location'].append(i)

print("📊 DATA COMPLETENESS CHECK:\n")
total = len(products)
for issue_type, product_nums in issues.items():
    if product_nums:
        print(f"❌ {issue_type}: {len(product_nums)}/{total} products")
        if len(product_nums) <= 5:
            product_list = ", ".join(f"#{num}" for num in product_nums)
            print(f"   Products: {product_list}")
    else:
        print(f"✅ {issue_type}: All products OK ({total}/{total})")

print("\n" + "-"*120)
print("\n📋 COMPLETE PRODUCT LIST:\n")

for i, p in enumerate(products, 1):
    price_str = f"€{p['price_eur']:.2f}" if p['price_eur'] is not None else "❌ MISSING"
    qty = p['quantity'] if p['quantity'] is not None else "❌ MISSING"
    status = p['status'] if p['status'] else "❌ MISSING"
    location = p['location'] if p['location'] else "❌ MISSING"
    
    print(f"{i:2d}. {p['name'][:50]:50s} | {price_str:>10s} | Q:{qty:>2} | {status:10s} | {location}")

# Export
output_file = Path(__file__).parent / 'PRODUCT_DATA_COMPLETE.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'total': len(products),
        'products': products,
        'issues_summary': {k: len(v) for k, v in issues.items()},
        'issues_detail': issues
    }, f, indent=2, ensure_ascii=False)

print(f"\n✅ Full data exported to: {output_file}\n")

# Summary
valid_prices = [p['price_eur'] for p in products if p['price_eur'] is not None and p['price_eur'] > 0]
print("💰 PRICING SUMMARY:")
print(f"   Total products: {len(products)}")
print(f"   Products with valid price: {len(valid_prices)}")
print(f"   Average price: €{sum(valid_prices)/len(valid_prices):.2f}" if valid_prices else "   No valid prices")
print(f"   Total daily revenue (all 1x): €{sum(p['price_eur'] for p in products if p['price_eur']): .2f}")
print()
