/**
 * Refresh all Portuguese translations to PT-PT (European Portuguese)
 * 
 * This script clears all existing PT translations from the database cache
 * so they will be re-translated using DeepL with PT-PT target language.
 * 
 * Run: npx tsx scripts/refresh-pt-translations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🇵🇹 Refreshing Portuguese translations to PT-PT (European Portuguese)...\n');

  try {
    // Count existing PT translations
    const count = await prisma.translation.count({
      where: { targetLang: 'pt' }
    });

    console.log(`📊 Found ${count} Portuguese translations in database`);

    if (count === 0) {
      console.log('✅ No translations to refresh');
      return;
    }

    // Delete all PT translations so they get re-translated with PT-PT
    const deleted = await prisma.translation.deleteMany({
      where: { targetLang: 'pt' }
    });

    console.log(`🗑️  Deleted ${deleted.count} PT translations`);
    console.log('\n✅ Done! Translations will be re-fetched using PT-PT when pages load.');
    console.log('\n💡 Tips:');
    console.log('   1. Restart the application to clear in-memory cache');
    console.log('   2. Navigate through the app to trigger new PT-PT translations');
    console.log('   3. The DeepL API is now configured to use PT-PT (European Portuguese)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
