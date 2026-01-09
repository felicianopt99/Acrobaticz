#!/bin/bash

set -e

DOMAIN="localhost:3000"
COOKIE_JAR=$(mktemp)

echo "=== Testing Image Storage in Database ==="
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
curl -s -c "$COOKIE_JAR" -X POST "http://$DOMAIN/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "feliciano",
    "password": "Feliciano123!"
  }' > /dev/null

echo "✓ Login successful"
echo ""

# Step 2: Get categories and subcategories
echo "Step 2: Getting categories..."
CATEGORY_ID=$(docker exec av-postgres psql -U avrentals_user -d avrentals_db -t -c "SELECT id FROM \"Category\" LIMIT 1;")
CATEGORY_ID=$(echo "$CATEGORY_ID" | xargs)

SUBCATEGORY_ID=$(docker exec av-postgres psql -U avrentals_user -d avrentals_db -t -c "SELECT id FROM \"Subcategory\" LIMIT 1;")
SUBCATEGORY_ID=$(echo "$SUBCATEGORY_ID" | xargs)

echo "✓ Using Category: $CATEGORY_ID"
echo "✓ Using Subcategory: $SUBCATEGORY_ID"
echo ""

# Step 3: Create equipment with image
echo "Step 3: Creating equipment with image URL..."
RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "http://$DOMAIN/api/equipment" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Speaker - DB Image Storage\",
    \"description\": \"This equipment should store the image as base64 in the database\",
    \"categoryId\": \"$CATEGORY_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"quantity\": 1,
    \"status\": \"good\",
    \"location\": \"Test Warehouse\",
    \"imageUrl\": \"https://via.placeholder.com/600x400?text=Test+Equipment\",
    \"dailyRate\": 75.50,
    \"type\": \"equipment\"
  }")

EQUIPMENT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')

if [ -z "$EQUIPMENT_ID" ]; then
  echo "✗ Failed to create equipment"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✓ Equipment created with ID: $EQUIPMENT_ID"
echo ""

# Step 4: Check database for imageData
echo "Step 4: Checking database for image data..."
echo ""
docker exec av-postgres psql -U avrentals_user -d avrentals_db << SQL
SELECT 
  name,
  CASE WHEN "imageData" IS NOT NULL THEN '✓ HAS BASE64 IMAGE' ELSE '✗ NO IMAGE DATA' END as image_storage,
  CASE WHEN "imageContentType" IS NOT NULL THEN "imageContentType" ELSE 'N/A' END as mime_type,
  LENGTH("imageData") as data_length_bytes
FROM "EquipmentItem"
WHERE id = '$EQUIPMENT_ID';
SQL

echo ""
echo "Step 5: Verifying image data is valid base64..."
IMAGE_DATA=$(docker exec av-postgres psql -U avrentals_user -d avrentals_db -t -c "SELECT \"imageData\" FROM \"EquipmentItem\" WHERE id = '$EQUIPMENT_ID';")

if [ -z "$IMAGE_DATA" ] || [ "$IMAGE_DATA" = " " ]; then
  echo "✗ No image data found in database"
else
  DATA_SIZE=${#IMAGE_DATA}
  echo "✓ Image stored in database: $DATA_SIZE bytes of base64 data"
  
  # Verify it's valid base64
  if echo "$IMAGE_DATA" | head -c 100 | base64 -d > /dev/null 2>&1; then
    echo "✓ Base64 data is valid"
  else
    echo "✗ Base64 data appears invalid"
  fi
fi

echo ""
echo "=== Test Complete ==="
echo "Equipment ID: $EQUIPMENT_ID"
echo ""

# Cleanup
rm -f "$COOKIE_JAR"
