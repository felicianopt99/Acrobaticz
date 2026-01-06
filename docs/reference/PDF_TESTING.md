# PDF Catalog Generation - Testing Guide

## Quick Test Overview

This guide covers both automated and manual testing for the PDF catalog generation feature.

---

## 🤖 Automated Tests

### Unit Tests (Vitest)

**Test File:** `src/app/api/partners/catalog/__tests__/generate.test.ts`

**Running Unit Tests:**
```bash
# Run all tests
npm test

# Run catalog generation tests only
npm test -- generate.test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

**Test Cases Covered:**
- ✅ Returns 400 when no equipment IDs provided
- ✅ Returns 404 when no equipment found
- ✅ Successfully generates PDF with valid equipment
- ✅ Fetches only equipment with "good" status
- ✅ Handles database errors gracefully
- ✅ Sets correct PDF response headers

---

### Integration Script Test

**Test File:** `scripts/test-pdf-generation.js`

**Running Integration Tests:**
```bash
# Make script executable
chmod +x scripts/test-pdf-generation.js

# Run the test
node scripts/test-pdf-generation.js
```

**What It Checks:**
1. ✅ Dependencies installed (jsPDF)
2. ✅ Route file exists and is accessible
3. ✅ Required functions present in route
4. ✅ Frontend component properly implemented
5. ✅ PDF generation logic works correctly
6. ✅ Page layout calculations are correct
7. ✅ Equipment grouping by category works

**Expected Output:**
```
🧪 PDF Generation Test Suite

📦 Test 1: Checking dependencies...
  ✓ jsPDF is installed

📄 Test 2: Checking catalog generate route...
  ✓ Route file exists: ...

📋 Test 3: Validating route implementation...
  ✓ POST function
  ✓ generateCatalogPDF function
  ✓ jsPDF import
  ✓ Error handling
  ✓ PDF headers
  ✓ All required functions present

🎨 Test 4: Checking frontend component...
  ✓ Equipment loading
  ✓ Equipment selection
  ✓ PDF generation call
  ✓ Download functionality
  ✓ Frontend component properly implemented

⚙️  Test 5: Testing PDF generation logic...
  ✓ PDF generated successfully (12345 bytes)

📐 Test 6: Validating page layout logic...
  ✓ Page layout parameters:
    - Margin calculation: 15
    - Content width: 180
    - Page height: 297
    - Min spacing before new page: 40

🏷️  Test 7: Testing equipment grouping...
  ✓ Categories found: Cameras, Lighting
    - Cameras: 2 items
    - Lighting: 1 items

✓ ALL TESTS PASSED
```

---

## 🧪 Manual Testing

### Pre-requisites
- [ ] Development server running: `npm run dev`
- [ ] Database has partners with equipment
- [ ] Logged in as Admin or Manager
- [ ] Test equipment items in the system

### Test Case 1: Basic Catalog Generation

**Objective:** Verify basic PDF generation workflow

**Steps:**
1. Navigate to http://localhost:3000/partners
2. Click on any partner (e.g., "Stereolites")
3. Click "Generate Catalog" button
4. Verify page loads with equipment list
5. Select 2-3 equipment items
6. Click "Generate Catalog PDF"
7. Verify PDF downloads with correct filename

**Expected Results:**
- Page loads without errors
- Equipment list displays with search/filter
- PDF downloads as `{PartnerName}-equipment-catalog-{Date}.pdf`
- PDF opens and displays equipment correctly

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 2: Equipment Search

**Objective:** Verify search functionality works correctly

**Steps:**
1. Navigate to catalog page for a partner
2. Type "Sony" in search bar
3. Verify equipment list filters to show Sony items
4. Clear search
5. Type "Camera"
6. Verify results show camera-related items
7. Search for non-existent item (e.g., "xyz123")

**Expected Results:**
- Search filters equipment in real-time
- Results match search term in name or description
- Empty state shows when no matches
- Clearing search restores full list

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 3: Category Filtering

**Objective:** Verify category filter works

**Steps:**
1. Navigate to catalog page
2. Click category dropdown
3. Select "Cameras"
4. Verify only camera equipment displays
5. Select "All Categories"
6. Verify full list returns
7. Select different category and verify

**Expected Results:**
- Category dropdown shows all available categories
- Filtering by category updates equipment list
- "All Categories" shows all items
- Category filter works with search simultaneously

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 4: Equipment Selection

**Objective:** Verify equipment selection logic

**Steps:**
1. Navigate to catalog page
2. Click individual checkbox on equipment
3. Verify item is selected and count updates
4. Click "Select All" button
5. Verify all visible items are selected
6. Click "Select All" again (deselect)
7. Verify all items are deselected
8. Try to generate PDF with no items selected

**Expected Results:**
- Individual checkboxes toggle item selection
- Selection count updates correctly
- "Select All" selects all filtered items
- "Deselect All" button appears when all selected
- Generate button disabled with no items selected
- Error message shown if trying to generate without selection

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 5: PDF Content Verification

**Objective:** Verify generated PDF content is correct

**Steps:**
1. Select 3-4 equipment items
2. Generate PDF
3. Open downloaded PDF in reader
4. Verify header shows "Equipment Catalog"
5. Verify partner name is displayed
6. Verify generation date is shown
7. Verify equipment items are listed with:
   - Item number
   - Equipment name
   - Description
   - Daily rate
   - Quantity available
   - Status
8. Verify items are grouped by category
9. Check footer contains contact message

**Expected Results:**
- PDF header shows catalog title and partner info
- All selected equipment appears in PDF
- Equipment properly formatted with all details
- Items organized by category alphabetically
- Page breaks work correctly if many items
- Footer shows on each page

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 6: PDF Pagination

**Objective:** Verify page breaks work for large catalogs

**Steps:**
1. Select 20+ equipment items
2. Generate PDF
3. Open PDF and check number of pages
4. Verify each page has:
   - Proper margins
   - Header information on first page
   - Content properly formatted
   - No text cut off at page boundaries
5. Scroll through pages to verify layout

**Expected Results:**
- PDF handles multiple pages correctly
- No content overlaps page boundaries
- Each page properly formatted
- Text wraps correctly on each page
- Page breaks occur at logical points (between items)

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 7: Error Handling

**Objective:** Verify error states are handled

**Steps:**
1. Select equipment for PDF generation
2. Disconnect network/turn off server (simulate error)
3. Click "Generate Catalog PDF"
4. Verify error toast appears
5. Verify button re-enables
6. Reconnect/restart server
7. Retry generation
8. Verify generation succeeds

**Expected Results:**
- Error messages are user-friendly
- Error toast displayed at top
- Generate button remains usable after error
- No broken state after error
- Retry after fixing issue works

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 8: Mobile Responsiveness

**Objective:** Verify feature works on mobile devices

**Steps:**
1. Open browser dev tools (F12)
2. Select mobile device view (iPhone 12)
3. Navigate to catalog page
4. Verify layout is responsive
5. Test search on mobile
6. Test category filter on mobile
7. Test equipment selection on mobile
8. Generate PDF on mobile
9. Verify PDF downloads correctly

**Expected Results:**
- Layout adapts to mobile screen
- All controls accessible on mobile
- Touch interactions work (checkboxes, buttons)
- PDF generation works on mobile
- No horizontal scrolling needed

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 9: Access Control

**Objective:** Verify only authorized users can access feature

**Steps:**
1. Log in as Admin → Should access catalog page ✓
2. Log in as Manager → Should access catalog page ✓
3. Log in as regular User → Should see error message
4. Log out → Should redirect to login

**Expected Results:**
- Admin can generate catalogs
- Manager can generate catalogs
- Other roles see "Access Denied" message
- Unauthenticated users redirected to login

**Pass/Fail:** ☐ Pass  ☐ Fail

---

### Test Case 10: Performance

**Objective:** Verify system performs well with large catalogs

**Steps:**
1. Partner with 100+ equipment items
2. Navigate to catalog page
3. Time how long equipment loads
4. Time how long PDF generates
5. Select all 100+ items
6. Generate PDF
7. Monitor for performance issues

**Expected Results:**
- Equipment loads within 2 seconds
- PDF generates within 5 seconds
- No lag during interactions
- No memory leaks
- Smooth user experience

**Pass/Fail:** ☐ Pass  ☐ Fail

---

## 📊 Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Unit Tests | ☐ | |
| Integration Tests | ☐ | |
| Basic Generation | ☐ | |
| Equipment Search | ☐ | |
| Category Filtering | ☐ | |
| Equipment Selection | ☐ | |
| PDF Content | ☐ | |
| PDF Pagination | ☐ | |
| Error Handling | ☐ | |
| Mobile Responsive | ☐ | |
| Access Control | ☐ | |
| Performance | ☐ | |

---

## 🐛 Bug Report Template

If you encounter issues, use this template:

```
**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Browser/Device:**

**Screenshots:**

**Additional Context:**
```

---

## ✅ Sign-off Checklist

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual tests completed
- [ ] No console errors
- [ ] No security issues
- [ ] Mobile responsive verified
- [ ] PDF quality acceptable
- [ ] Error messages clear
- [ ] Performance acceptable
- [ ] Documentation updated

---

## 📞 Support

For issues or questions:
1. Check the [Catalog Generation Analysis](./CATALOG_GENERATION_ANALYSIS.md)
2. Review code comments in route and component
3. Check browser console for errors
4. Review test output for specifics
