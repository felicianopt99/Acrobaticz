#!/bin/bash

DOMAIN="https://acrobaticz.duckdns.org"
COOKIE_JAR=$(mktemp)

echo "=== Testing Image Storage in Database on Production ==="
echo "Domain: $DOMAIN"
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$DOMAIN/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "feliciano", "password": "Feliciano123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "✗ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "✓ Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create equipment with image URL
echo "Step 2: Creating equipment with image URL..."

RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$DOMAIN/api/equipment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Speaker - DB Image Storage",
    "description": "This equipment should store the image as base64 in the database",
    "categoryId": "cmk1e0n230003tb4gtbayc9jd",
    "quantity": 1,
    "status": "good",
    "location": "Test Warehouse",
    "imageUrl": "https://via.placeholder.com/600x400?text=Test+Equipment",
    "dailyRate": 75.50,
    "type": "equipment"
  }')

EQUIPMENT_ID=$(echo "$RESPONSE" | jq -r '.id // empty' 2>/dev/null)

if [ -z "$EQUIPMENT_ID" ]; then
  echo "✗ Failed to create equipment"
  echo "Response: $RESPONSE"
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "✓ Equipment created with ID: $EQUIPMENT_ID"
echo ""

# Step 3: Check the created equipment
echo "Step 3: Fetching created equipment from API..."
curl -s -b "$COOKIE_JAR" "$DOMAIN/api/equipment?search=DB+Image" | jq '.data[] | {name, imageUrl, imageData: (if .imageData then "✓ HAS BASE64" else "✗ NO BASE64" end), imageContentType}' 2>/dev/null

echo ""
echo "=== Test Complete ==="
echo "Equipment ID: $EQUIPMENT_ID"

# Cleanup
rm -f "$COOKIE_JAR"
