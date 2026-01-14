# API Configuration Manager

The API Configuration Manager allows administrators to manage external API integrations (DeepL and Gemini) directly from the admin dashboard without modifying environment variables.

## Features

### 1. **Add API Integrations**
- Click the "Add API" button to configure a new API
- Select between:
  - **DeepL** - Translation API
  - **Gemini** - Google's AI API for content generation and analysis
- Enter your API key securely
- Configure provider-specific settings as JSON

### 2. **Manage Configurations**
Each API configuration shows:
- **Status**: Active/Inactive toggle
- **Test Connection**: Verify the API key is valid
- **Settings**: View or edit provider-specific configuration
- **Test History**: Last test result and timestamp
- **Actions**: Edit, delete, or toggle enabled/disabled

### 3. **Test Connections**
- Click the test icon to validate your API credentials
- Results show immediately with detailed error messages
- Test status is recorded in the database for auditing

### 4. **Database-Backed Configuration**
- API keys are stored securely in the database
- Services read from database first, fall back to environment variables
- Changes take effect immediately without restarting the app
- Cache automatically refreshes every 5 minutes

## How Services Use Configurations

### DeepL Service
The `src/lib/deepl.service.ts` service:
1. Checks database for active DeepL configuration
2. Falls back to `DEEPL_API_KEY` environment variable if not found
3. Caches key for 5 minutes for performance
4. Automatically retries failed requests with exponential backoff

**Usage:**
```typescript
import { deeplTranslateText, batchTranslate } from '@/lib/deepl.service';

// Translate text
const result = await deeplTranslateText('Hello', 'pt');

// Batch translate multiple items
const results = await batchTranslate([
  { text: 'Hello', targetLang: 'pt' },
  { text: 'World', targetLang: 'en' }
]);
```

### Gemini Service
The `src/lib/gemini.service.ts` service:
1. Checks database for active Gemini configuration
2. Falls back to `GEMINI_API_KEY` environment variable if not found
3. Caches key for 5 minutes for performance
4. Supports content generation and text analysis

**Usage:**
```typescript
import { generateContent, analyzeText } from '@/lib/gemini.service';

// Generate content
const response = await generateContent({
  prompt: 'Write a product description for...',
  maxTokens: 500,
  temperature: 0.7
});

// Analyze text
const analysis = await analyzeText(
  'Some text to analyze',
  'sentiment' // 'sentiment', 'summary', 'keywords', 'custom'
);
```

## Database Schema

The `APIConfiguration` table stores:
- `id`: Unique identifier (CUID)
- `provider`: 'deepl' or 'gemini' (unique)
- `apiKey`: The actual API key
- `isActive`: Whether this configuration is enabled
- `settings`: JSON object with provider-specific options
- `lastTestedAt`: When the connection was last tested
- `testStatus`: 'success', 'failed', or 'not_tested'
- `testError`: Error message from last failed test
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

## Server Actions

All operations are implemented as Next.js Server Actions:

```typescript
import {
  getAPIConfigurations,      // Get all configurations
  getAPIConfig,              // Get specific provider config
  getAPIKey,                 // Get API key (no sensitive data)
  updateAPIConfiguration,    // Create or update config
  toggleAPIConfiguration,    // Enable/disable config
  deleteAPIConfiguration,    // Delete a config
  testAPIConnection,         // Test API connectivity
  clearApiKeyCache,         // Clear cached API key
} from '@/app/api/actions/api-configuration.actions';
```

## Location in Admin Dashboard

The API Configuration Manager component is located at:
- **File**: `src/components/admin/APIConfigurationManager.tsx`
- **Import**: 
```typescript
import APIConfigurationManager from '@/components/admin/APIConfigurationManager';
```

## Security Considerations

1. **Database Storage**: API keys are stored in the database (encrypted in production)
2. **Access Control**: Only accessible to admin users (implement role check in your admin layout)
3. **Environment Fallback**: Environment variables still work if database config is not set
4. **Cache**: Keys are cached for 5 minutes to reduce database queries
5. **No Exposure**: Component never returns actual API keys in responses (except during creation)

## Troubleshooting

### "API key not configured" Error
- Ensure you've added the API configuration in the admin panel
- Verify the configuration is **Active** (toggle enabled)
- Check that the API key is correct

### Connection Test Failing
- **DeepL**: Verify your API key and that DeepL API is accessible
- **Gemini**: Check your Google API key and that the Gemini API is enabled
- Look at the detailed error message in the "Test Error" field

### Changes Not Taking Effect
- API keys are cached for 5 minutes
- Manual refresh via the test button will clear the cache
- Or wait 5 minutes for automatic cache expiry

## Example: Adding DeepL API Key

1. Go to Admin Dashboard
2. Click "Add API"
3. Select "DEEPL"
4. Paste your DeepL API key (from https://www.deepl.com/account)
5. Leave settings as `{}`
6. Click "Save"
7. Click the test icon to verify connectivity
8. The API key is now active and services will use it automatically

## Example: Adding Gemini API Key

1. Go to Admin Dashboard
2. Click "Add API"
3. Select "GEMINI"
4. Paste your Gemini API key (from https://makersuite.google.com/app/apikey)
5. Optionally configure settings:
```json
{
  "model": "gemini-pro",
  "apiVersion": "v1beta"
}
```
6. Click "Save"
7. Click the test icon to verify connectivity
8. The API key is now active and services will use it automatically
