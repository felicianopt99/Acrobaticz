// Partners page text to be translated to Portuguese
const partnersPageTexts = [
  'Partners',
  'Partner List',
  'Add New Partner',
  'Edit Partner',
  'Delete Partner',
  'Confirm Deletion',
  'Are you sure you want to delete this partner?',
  'No partners yet.',
  'Create your first partner',
  'Name',
  'Company',
  'Contact',
  'Email',
  'Subrentals',
  'Status',
  'Actions',
  'Active',
  'Inactive',
  'Search partners...',
  'Filter by status',
  'All',
  'Agency',
  'Both',
  'Save',
  'Cancel',
  'Delete',
  'Edit',
  'Partner Details',
  'Partner Information',
  'First Name',
  'Last Name',
  'Phone',
  'Address',
  'City',
  'State',
  'Zip Code',
  'Country',
  'Business Type',
  'Commission Rate',
  'Payment Method',
  'Notes',
  'Created',
  'Last Updated',
  'Total Rentals',
  'Total Revenue',
  'Active Rentals',
  'Loading...',
  'Error loading partners',
  'Failed to save partner',
  'Partner saved successfully',
  'Partner deleted successfully',
  'Error deleting partner',
];

async function seedTranslations() {
  try {
    console.log(`🌍 Starting translation seed for ${partnersPageTexts.length} partners page texts...`);
    
    // Call the batch translation API
    const response = await fetch('http://localhost:3000/api/translate', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: partnersPageTexts,
        targetLang: 'pt',
        progressive: false, // Wait for all results
      }),
    });

    const data = await response.json();

    console.log('Response status:', response.status);

    if (response.ok && data.translations && Array.isArray(data.translations)) {
      console.log(`✅ Successfully translated ${data.translations.length} texts to Portuguese`);
      console.log(`📊 Sample translations:`);
      
      // Show some sample translations
      const samples = [
        { en: 'Partners', pt: data.translations[0] },
        { en: 'Partner List', pt: data.translations[1] },
        { en: 'Add New Partner', pt: data.translations[2] },
        { en: 'Save', pt: data.translations[23] },
        { en: 'Cancel', pt: data.translations[24] },
      ];
      
      samples.forEach(s => {
        console.log(`   "${s.en}" → "${s.pt}"`);
      });
      
      console.log(`\n✨ Partners page is now ready to translate!`);
      console.log(`\n💡 Tips:`);
      console.log(`   1. Reload the app to refresh cache`);
      console.log(`   2. Click the language toggle and select Português`);
      console.log(`   3. Navigate to the Partners page to see translations`);
    } else {
      console.error('❌ Translation failed:', data.error || 'Unknown error');
      console.error('Response:', data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error seeding translations:', error.message);
    
    console.log('\n💡 Make sure the app is running: docker-compose up');
    process.exit(1);
  }
}

seedTranslations();
