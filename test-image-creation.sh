#!/bin/bash

# Test creating new equipment with an image URL

echo "Testing equipment creation with image URL..."

# Create equipment with a test image URL
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "name": "Test Speaker with Image",
    "description": "This is a test speaker that should save the image to the database",
    "categoryId": "cmk1y3fma000bftjh4knk5xhe",
    "subcategoryId": "cmk1y4io8000iftjhdhe7rvgx",
    "quantity": 1,
    "status": "good",
    "location": "Warehouse A",
    "imageUrl": "https://via.placeholder.com/600x400?text=Test+Equipment",
    "dailyRate": 50,
    "type": "equipment"
  }' 2>/dev/null | jq '.'

echo ""
echo "Checking database for imageData..."
docker exec av-postgres psql -U avrentals_user -d avrentals_db -c "
SELECT name, 
       CASE WHEN \"imageData\" IS NOT NULL THEN 'HAS IMAGE DATA' ELSE 'NO IMAGE DATA' END as image_status,
       \"imageContentType\"
FROM \"EquipmentItem\" 
WHERE name = 'Test Speaker with Image';
"
