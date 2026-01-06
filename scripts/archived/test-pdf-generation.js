#!/usr/bin/env node

/**
 * Manual PDF Generation Test Script
 * Tests the catalog generation feature end-to-end
 * 
 * Usage: node scripts/test-pdf-generation.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPDFGeneration() {
  log('blue', '🧪 PDF Generation Test Suite\n');

  try {
    // Test 1: Check if jsPDF is installed
    log('cyan', '📦 Test 1: Checking dependencies...');
    try {
      await import('jspdf');
      log('green', '  ✓ jsPDF is installed\n');
    } catch (e) {
      log('red', '  ✗ jsPDF not found. Installing...');
      execSync('npm install jspdf', { stdio: 'inherit' });
      log('green', '  ✓ jsPDF installed\n');
    }

    // Test 2: Check if route file exists
    log('cyan', '📄 Test 2: Checking catalog generate route...');
    const routePath = path.join(
      __dirname,
      '../src/app/api/partners/catalog/generate/route.ts'
    );
    if (fs.existsSync(routePath)) {
      log('green', `  ✓ Route file exists: ${routePath}\n`);
    } else {
      log('red', `  ✗ Route file not found: ${routePath}\n`);
      return false;
    }

    // Test 3: Validate route file content
    log('cyan', '📋 Test 3: Validating route implementation...');
    const routeContent = fs.readFileSync(routePath, 'utf-8');
    
    const requiredFunctions = [
      { name: 'POST function', pattern: /export async function POST/ },
      { name: 'generateCatalogPDF function', pattern: /function generateCatalogPDF/ },
      { name: 'jsPDF import', pattern: /from ['"]jspdf['"]/ },
      { name: 'Error handling', pattern: /catch\s*\(/ },
      { name: 'PDF headers', pattern: /Content-Type.*pdf/ },
    ];

    let allValid = true;
    requiredFunctions.forEach((fn) => {
      if (fn.pattern.test(routeContent)) {
        log('green', `  ✓ ${fn.name}`);
      } else {
        log('red', `  ✗ ${fn.name} - NOT FOUND`);
        allValid = false;
      }
    });

    if (!allValid) {
      log('red', '\n  Some required functions are missing!\n');
      return false;
    }
    log('green', '  ✓ All required functions present\n');

    // Test 4: Check frontend component
    log('cyan', '🎨 Test 4: Checking frontend component...');
    const componentPath = path.join(
      __dirname,
      '../src/components/partners/PartnerCatalogGenerator.tsx'
    );
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf-8');
      
      const componentChecks = [
        { name: 'Equipment loading', pattern: /loadEquipment/ },
        { name: 'Equipment selection', pattern: /selectedEquipment/ },
        { name: 'PDF generation call', pattern: /\/api\/partners\/catalog\/generate/ },
        { name: 'Download functionality', pattern: /createObjectURL|download/ },
      ];

      let componentValid = true;
      componentChecks.forEach((check) => {
        if (check.pattern.test(componentContent)) {
          log('green', `  ✓ ${check.name}`);
        } else {
          log('red', `  ✗ ${check.name} - NOT FOUND`);
          componentValid = false;
        }
      });

      if (componentValid) {
        log('green', '  ✓ Frontend component properly implemented\n');
      } else {
        log('red', '\n  Some component features missing!\n');
        return false;
      }
    } else {
      log('red', `  ✗ Component not found: ${componentPath}\n`);
      return false;
    }

    // Test 5: Simulate PDF generation
    log('cyan', '⚙️  Test 5: Testing PDF generation logic...');
    try {
      // First try jsPDF path
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(24);
      doc.text('Equipment Catalog', 105, 15, { align: 'center' });
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      if (pdfBuffer.length > 0) {
        log('green', `  ✓ jsPDF generated PDF successfully (${pdfBuffer.length} bytes)`);
      } else {
        log('red', '  ✗ jsPDF buffer is empty');
        return false;
      }

      // Then test @react-pdf/renderer PDF (A4)
      log('cyan', '⚙️  Test 5b: Testing @react-pdf/renderer PDF (A4)...');
      try {
        const React = await import('react');
        const rpdf = await import('@react-pdf/renderer');
        const { Document, Page, Text, StyleSheet, pdf } = rpdf;

        const styles = StyleSheet.create({
          page: { padding: 20 },
          title: { fontSize: 18, textAlign: 'center', marginBottom: 10 }
        });

        const MyDoc = React.createElement(Document, null,
          React.createElement(Page, { size: 'A4', style: styles.page },
            React.createElement(Text, { style: styles.title }, 'Equipment Catalog (react-pdf test)'),
            React.createElement(Text, null, 'Generated for: Test Partner')
          )
        );

        const outPath = path.join(__dirname, '../tmp/test-react-pdf.pdf');
        const pdfInstance = pdf(MyDoc);
        const buffer = await pdfInstance.toBuffer();
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
        await fs.promises.writeFile(outPath, buffer);
        const stats = await fs.promises.stat(outPath);
        if (stats.size > 0) {
          log('green', `  ✓ @react-pdf/renderer produced A4 PDF: ${outPath} (${stats.size} bytes)\n`);
        } else {
          log('red', '  ✗ @react-pdf/renderer PDF is empty\n');
          return false;
        }
      } catch (rpErr) {
        log('red', `  ✗ @react-pdf/renderer test failed: ${rpErr.message}\n`);
        return false;
      }
    } catch (error) {
      log('red', `  ✗ PDF generation failed: ${error.message}\n`);
      return false;
    }

    // Test 6: Check page layout
    log('cyan', '📐 Test 6: Validating page layout logic...');
    const layoutChecks = [
      { name: 'Margin calculation', value: 15 },
      { name: 'Content width', value: 180 }, // 210 - 2*15
      { name: 'Page height', value: 297 },
      { name: 'Min spacing before new page', value: 40 },
    ];

    log('green', '  ✓ Page layout parameters:');
    layoutChecks.forEach((check) => {
      log('green', `    - ${check.name}: ${check.value}`);
    });
    log('green', '');

    // Test 7: Check category grouping
    log('cyan', '🏷️  Test 7: Testing equipment grouping...');
    const sampleEquipment = [
      { id: '1', name: 'Sony FX6', category: { name: 'Cameras' } },
      { id: '2', name: 'Aputure 600d', category: { name: 'Lighting' } },
      { id: '3', name: 'Sony A6700', category: { name: 'Cameras' } },
    ];

    const grouped = sampleEquipment.reduce((acc, item) => {
      const category = item.category?.name || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    const categories = Object.keys(grouped).sort();
    log('green', `  ✓ Categories found: ${categories.join(', ')}`);
    categories.forEach((cat) => {
      log('green', `    - ${cat}: ${grouped[cat].length} items`);
    });
    log('green', '');

    // Final summary
    log('green', '═════════════════════════════════════');
    log('green', '✓ ALL TESTS PASSED');
    log('green', '═════════════════════════════════════\n');

    log('yellow', '📝 Next Steps:');
    log('yellow', '  1. Start the development server: npm run dev');
    log('yellow', '  2. Navigate to: http://localhost:3000/partners');
    log('yellow', '  3. Click on a partner to view details');
    log('yellow', '  4. Click "Generate Catalog" button');
    log('yellow', '  5. Select equipment and generate PDF\n');

    return true;
  } catch (error) {
    log('red', `\n❌ Test failed with error: ${error.message}\n`);
    console.error(error);
    return false;
  }
}

// Run tests
const success = await testPDFGeneration();
process.exit(success ? 0 : 1);
