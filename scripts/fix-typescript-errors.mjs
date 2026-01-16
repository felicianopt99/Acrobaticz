#!/usr/bin/env node
/**
 * Script automatizado para corrigir TODOS os erros TypeScript de Prisma
 * Adiciona campos obrigatórios (id, updatedAt) em todos os creates
 */

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { glob } from 'glob';

const files = await glob('src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/.next/**'] });

let totalFixes = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Fix 1: Adicionar randomUUID import quando falta
  if (content.includes('randomUUID()') && !content.includes("import { randomUUID }")) {
    if (content.includes("import { NextRequest")) {
      content = content.replace(
        /import \{ NextRequest/,
        "import { randomUUID } from 'crypto';\nimport { NextRequest"
      );
      modified = true;
      totalFixes++;
    }
  }

  // Fix 2: Adicionar id: randomUUID() em prisma.*.create({ data: { sem id
  const createRegex = /await prisma\.\w+\.create\(\{\s*data:\s*\{([^}]+)\}/g;
  content = content.replace(createRegex, (match) => {
    if (!match.includes('id:')) {
      const fixed = match.replace('data: {', `data: {\n        id: randomUUID(),`);
      modified = true;
      totalFixes++;
      return fixed;
    }
    return match;
  });

  // Fix 3: Adicionar updatedAt: new Date() se faltar
  const createDataRegex = /create:\s*\{([^}]+)\}/gs;
  content = content.replace(createDataRegex, (match) => {
    if (!match.includes('updatedAt:')) {
      const fixed = match.replace(/(\},\s*)$/, ',\n        updatedAt: new Date(),\n      },');
      modified = true;
      totalFixes++;
      return fixed;
    }
    return match;
  });

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✓ Fixed ${file}`);
  }
}

console.log(`\n✅ Total fixes applied: ${totalFixes} across ${files.length} files`);
