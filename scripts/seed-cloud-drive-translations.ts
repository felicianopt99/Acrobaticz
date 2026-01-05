// Cloud drive/storage page text to be translated to Portuguese
const cloudDriveTexts = [
  // Headers & Titles
  'Cloud Storage',
  'Cloud Drive',
  'My Cloud',
  'Storage Dashboard',
  'Shared With Me',
  'Starred Files',
  'Recent Files',
  'Trash',
  
  // Quick Actions
  'Quick Actions',
  'Upload Files',
  'New Folder',
  'Upload',
  'Create',
  'Cancel',
  
  // Button Actions
  'Download',
  'Delete',
  'Restore',
  'Share',
  'Rename',
  'Move',
  'Copy',
  'Preview',
  'Open',
  'Close',
  'Save',
  'Edit',
  'View',
  'More',
  
  // Storage Related
  'Storage',
  'Storage Usage',
  'Used',
  'Available',
  'Total',
  'Upgrade',
  'Storage Full',
  'Storage Quota',
  'Storage Limit',
  'Free Space',
  'Used Space',
  'No storage space available',
  'Storage is full. Please delete some files.',
  'Storage almost full',
  'You are using most of your storage. Consider deleting unused files.',
  
  // File Management
  'Folder name...',
  'File name',
  'Name',
  'Type',
  'Size',
  'Date Modified',
  'Last Updated',
  'Created',
  'Owner',
  'Shared By',
  'No files yet',
  'No files found',
  'No folders',
  'No folders found',
  'Empty folder',
  'Create your first folder',
  'Add your first file',
  
  // File Operations
  'Upload failed',
  'Upload successful',
  'file(s) uploaded successfully',
  'Upload in progress...',
  'Uploading',
  'Downloading...',
  'Download complete',
  'Download failed',
  'Failed to download file',
  'File deleted',
  'Failed to delete file',
  'Folder created successfully',
  'Failed to create folder',
  'Folder deleted successfully',
  'Failed to delete folder',
  'Item restored from trash',
  'Failed to restore item',
  'Item permanently deleted',
  'Failed to delete item',
  'File renamed successfully',
  'Failed to rename file',
  'File moved successfully',
  'Failed to move file',
  
  // Search & Filter
  'Search files...',
  'Search folders...',
  'Filter by type',
  'Filter by status',
  'All',
  'Images',
  'Documents',
  'Videos',
  'Audio',
  'Archives',
  'Other',
  'Recent',
  'Oldest',
  'Largest',
  'Smallest',
  'A to Z',
  'Z to A',
  
  // Sharing
  'Share File',
  'Share Folder',
  'Shared With Me',
  'Share Link',
  'Copy Link',
  'Link Copied',
  'Sharing Settings',
  'Can View',
  'Can Edit',
  'Can Download',
  'Permissions',
  'Remove Access',
  'Shared Files',
  'No files shared with you yet',
  
  // Sorting
  'Sort by',
  'Name',
  'Date',
  'Size',
  'Type',
  'Ascending',
  'Descending',
  
  // Activity & Recent
  'Recent Activity',
  'Activity Log',
  'No recent activity',
  'Last accessed',
  'Last modified',
  'Recently uploaded',
  'Recently deleted',
  'Recently shared',
  
  // Dialogs & Confirmations
  'Confirm Deletion',
  'Are you sure?',
  'This action cannot be undone.',
  'Confirm',
  'This action cannot be undone. Are you sure?',
  'Delete permanently',
  'Move to trash',
  
  // Errors & Messages
  'Error',
  'Error loading files',
  'Error loading folders',
  'Error loading trash',
  'Failed to load storage quota',
  'Connection error',
  'Something went wrong',
  'Please try again',
  'File not found',
  'Folder not found',
  'Access denied',
  'Permission denied',
  'Invalid file type',
  'File too large',
  'Maximum file size exceeded',
  
  // Loading & Status
  'Loading...',
  'Loading files...',
  'Loading folders...',
  'Saving...',
  'Please wait...',
  'Processing...',
  
  // Success Messages
  'Success',
  'Operation completed successfully',
  'File uploaded',
  'Folder created',
  'Settings saved',
  
  // Navigation
  'Back',
  'Next',
  'Previous',
  'Home',
  'Settings',
  'Help',
  
  // Additional UI Elements
  'Add files here',
  'Drag files here to upload',
  'or click to select',
  'MB',
  'GB',
  'KB',
  'Bytes',
];

async function seedCloudDriveTranslations() {
  try {
    console.log(`🌍 Starting translation seed for ${cloudDriveTexts.length} cloud drive texts...`);
    
    const batchSize = 100;
    const batches = Math.ceil(cloudDriveTexts.length / batchSize);
    let allTranslations: string[] = [];

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, cloudDriveTexts.length);
      const batch = cloudDriveTexts.slice(start, end);

      console.log(`\n📦 Processing batch ${i + 1}/${batches} (${batch.length} texts)...`);

      const response = await fetch('http://localhost:3000/api/translate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: batch,
          targetLang: 'pt',
          progressive: false,
        }),
      });

      const data = await response.json();

      if (response.ok && data.translations && Array.isArray(data.translations)) {
        allTranslations = [...allTranslations, ...data.translations];
        console.log(`   ✅ Batch ${i + 1} done (${data.translations.length} translated)`);
      } else {
        console.error('❌ Batch translation failed:', data.error || 'Unknown error');
        process.exit(1);
      }

      // Small delay between batches to avoid rate limiting
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n✅ Successfully translated ${allTranslations.length} cloud drive texts to Portuguese`);
    console.log(`📊 Sample translations:`);
    
    const samples = [
      { en: 'Cloud Storage', pt: allTranslations[0] },
      { en: 'Upload Files', pt: allTranslations[11] },
      { en: 'New Folder', pt: allTranslations[12] },
      { en: 'Storage', pt: allTranslations[20] },
      { en: 'Download', pt: allTranslations[29] },
    ];
    
    samples.forEach(s => {
      console.log(`   "${s.en}" → "${s.pt}"`);
    });
    
    console.log(`\n✨ Cloud drive pages are now ready to translate!`);
    console.log(`\n💡 Tips:`);
    console.log(`   1. Reload the app to refresh cache`);
    console.log(`   2. Click the language toggle and select Português`);
    console.log(`   3. Navigate to Cloud Storage pages to see translations`);
  } catch (error: any) {
    console.error('❌ Error seeding translations:', error.message);
    console.log('\n💡 Make sure the app is running: docker-compose up');
    process.exit(1);
  }
}

seedCloudDriveTranslations();
