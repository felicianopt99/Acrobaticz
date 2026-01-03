#!/bin/bash

# Test Cloud Features Script
# Tests all cloud storage functionality including upload, folder operations, sharing, etc.
# 
# CREDENTIALS: 
#   Username: feliciano
#   Password: superfeliz99

set -e

BASE_URL="http://localhost"
TEST_EMAIL="feliciano"
TEST_PASSWORD="superfeliz99"

echo "======================================="
echo "Cloud Storage Feature Test Suite"
echo "======================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper function to print test results
print_result() {
  local test_name="$1"
  local result="$2"
  if [ "$result" -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $test_name"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $test_name"
    ((FAILED++))
  fi
}

# Step 1: Login and get auth token
echo "[1/8] Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$AUTH_TOKEN" ]; then
  echo "✓ Login successful"
  COOKIE_HEADER="Cookie: auth-token=$AUTH_TOKEN"
else
  echo "✗ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Step 2: Check Disk Health
echo "[2/8] Checking Disk Health..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/cloud/health" \
  -H "$COOKIE_HEADER")

DISK_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"isAccessible":[^,}]*')
if echo "$HEALTH_RESPONSE" | grep -q '"isAccessible":true'; then
  echo "✓ Disk is accessible"
  echo "  Response: $HEALTH_RESPONSE" | head -c 200
  print_result "Disk Health Check" 0
else
  echo "✗ Disk is not accessible"
  echo "  Response: $HEALTH_RESPONSE"
  print_result "Disk Health Check" 1
fi
echo ""

# Step 3: Create a Test Folder
echo "[3/8] Creating Test Folder..."
FOLDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/cloud/folders" \
  -H "$COOKIE_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"name": "TestFolder", "color": "blue"}')

FOLDER_ID=$(echo "$FOLDER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -n "$FOLDER_ID" ]; then
  echo "✓ Folder created: $FOLDER_ID"
  print_result "Create Folder" 0
else
  echo "✗ Failed to create folder"
  echo "  Response: $FOLDER_RESPONSE"
  print_result "Create Folder" 1
fi
echo ""

# Step 4: Upload a Test File
echo "[4/8] Testing File Upload..."
TEST_FILE="/tmp/test-upload.txt"
echo "This is a test file for cloud storage upload" > "$TEST_FILE"

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/cloud/files/upload" \
  -H "$COOKIE_HEADER" \
  -F "files=@$TEST_FILE" \
  -F "folderId=$FOLDER_ID")

UPLOADED_FILE_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -n "$UPLOADED_FILE_ID" ]; then
  echo "✓ File uploaded: $UPLOADED_FILE_ID"
  print_result "File Upload" 0
else
  echo "✗ File upload failed"
  echo "  Response: $UPLOAD_RESPONSE"
  print_result "File Upload" 1
fi
echo ""

# Step 5: List Files
echo "[5/8] Listing Files..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/cloud/files?folderId=$FOLDER_ID" \
  -H "$COOKIE_HEADER")

if echo "$LIST_RESPONSE" | grep -q '"files"'; then
  FILE_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
  echo "✓ Files retrieved: $FILE_COUNT files found"
  print_result "List Files" 0
else
  echo "✗ Failed to list files"
  echo "  Response: $LIST_RESPONSE"
  print_result "List Files" 1
fi
echo ""

# Step 6: Search Files
echo "[6/8] Testing File Search..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/cloud/search?query=test" \
  -H "$COOKIE_HEADER")

if echo "$SEARCH_RESPONSE" | grep -q '"files"'; then
  echo "✓ Search functionality working"
  print_result "File Search" 0
else
  echo "✗ Search failed"
  echo "  Response: $SEARCH_RESPONSE"
  print_result "File Search" 1
fi
echo ""

# Step 7: Star a File (Favorite)
echo "[7/8] Testing Star/Favorite Feature..."
if [ -n "$UPLOADED_FILE_ID" ]; then
  STAR_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/cloud/files/$UPLOADED_FILE_ID" \
    -H "$COOKIE_HEADER" \
    -H "Content-Type: application/json" \
    -d '{"isStarred": true}')

  if echo "$STAR_RESPONSE" | grep -q '"success"'; then
    echo "✓ File starred successfully"
    print_result "Star Feature" 0
  else
    echo "✗ Star feature failed"
    echo "  Response: $STAR_RESPONSE"
    print_result "Star Feature" 1
  fi
else
  echo "⊘ Skipping (no file uploaded)"
  print_result "Star Feature" 1
fi
echo ""

# Step 8: Storage Quota Check
echo "[8/8] Checking Storage Quota..."
QUOTA_RESPONSE=$(curl -s -X GET "$BASE_URL/api/cloud/storage" \
  -H "$COOKIE_HEADER")

if echo "$QUOTA_RESPONSE" | grep -q '"usedBytes"'; then
  USED=$(echo "$QUOTA_RESPONSE" | grep -o '"usedBytes":"[^"]*' | cut -d'"' -f4)
  QUOTA=$(echo "$QUOTA_RESPONSE" | grep -o '"quotaBytes":"[^"]*' | cut -d'"' -f4)
  echo "✓ Storage quota: $USED / $QUOTA bytes"
  print_result "Storage Quota" 0
else
  echo "✗ Failed to retrieve storage quota"
  echo "  Response: $QUOTA_RESPONSE"
  print_result "Storage Quota" 1
fi
echo ""

# Disk space verification
echo "======================================="
echo "Disk Space Verification"
echo "======================================="
echo ""
echo "Cloud Storage Directory Structure:"
ls -lah /mnt/backup_drive/av-rentals/cloud-storage/ | grep -v "^\." || echo "  (empty or not mounted)"
echo ""
echo "Disk Usage Summary:"
df -h /mnt/backup_drive | tail -1
echo ""
echo "Cloud Storage Size:"
du -sh /mnt/backup_drive/av-rentals/cloud-storage 2>/dev/null || echo "  (directory not found)"
echo ""

# Final Results
echo "======================================="
echo "Test Results Summary"
echo "======================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
