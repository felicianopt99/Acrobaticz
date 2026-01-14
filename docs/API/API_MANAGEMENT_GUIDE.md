# API Management System

## Overview
The admin dashboard now includes a dedicated **API Integrations** panel where administrators can manage external API configurations for **DeepL** and **Gemini** services.

## Features

### 1. **Add/Edit API Configurations**
- Add new API keys for DeepL and Gemini
- Edit existing configurations with new API keys
- Store custom settings as JSON for each provider
- Encrypted API key storage in the database

### 2. **API Connection Testing**
- Test connectivity to each API before activation
- View test status (Passed/Failed/Not tested)
- See detailed error messages if tests fail
- Track last tested date for each API

### 3. **Enable/Disable APIs**
- Toggle APIs on/off without deleting configurations
- Only active APIs are used by services
- Useful for A/B testing or rollback scenarios

### 4. **API Management Actions**
- View all configurations in a card-based interface
- Edit API keys and settings
- Delete configurations
- Manage settings as JSON for advanced configuration

## Database Schema

### `APIConfiguration` Table
```sql
- id: String (Primary Key)
- provider: String (Unique) - 'deepl' or 'gemini'
- apiKey: String - Encrypted API key
- isActive: Boolean - Whether the API is enabled
- settings: JSON - Provider-specific settings
- lastTestedAt: DateTime - Last test timestamp
- testStatus: String - 'success', 'failed', or 'not_tested'
- testError: String - Error message from last failed test
- createdAt: DateTime
- updatedAt: DateTime
```

## Integration Points

### Services That Use This
1. **DeepL Service** (`src/lib/deepl.service.ts`)
   - Reads DeepL API key from database first
   - Falls back to environment variable if not in database
   - Caches API key for 5 minutes

2. **Gemini Service** (`src/lib/gemini.service.ts`)
   - Reads Gemini API key from database
   - Same fallback and caching pattern
   - Supports content generation and text analysis

### Server Actions
Location: `src/app/api/actions/api-configuration.actions.ts`

**Available Functions:**
- `getAPIConfigurations()` - Get all configurations
- `getAPIConfig(provider: string)` - Get specific provider config
- `getAPIKey(provider: string)` - Get API key for service use
- `updateAPIConfiguration(request)` - Create or update config
- `toggleAPIConfiguration(provider, isActive)` - Enable/disable API
- `deleteAPIConfiguration(provider)` - Delete config
- `testAPIConnection(provider)` - Test API connectivity

### UI Component
Location: `src/components/admin/APIConfigurationManager.tsx`

**Features:**
- Display all API configurations
- Add new API dialog with provider selection
- Edit existing configurations
- Test API connections with visual feedback
- Enable/disable with confirmation
- Delete with safety confirmation
- Real-time status updates

## How to Use

### Adding a New API
1. Click the "Add API" button in the API Integrations panel
2. Select the provider (DeepL or Gemini)
3. Enter the API key
4. (Optional) Add custom settings as JSON
5. Click "Save"

### Testing an API
1. Find the API in the list
2. Click the test button (flask icon)
3. Wait for the test to complete
4. Check the status and error message (if any)

### Enabling/Disabling APIs
1. Find the API in the list
2. Click "Enable" or "Disable" button
3. The service will use only active APIs

### Updating an API Key
1. Find the API in the list
2. Click "Edit"
3. Enter the new API key
4. Click "Save"
5. Test the connection to verify

## API Key Priority
Services check for API keys in this order:
1. Database (APIConfiguration table)
2. Environment variables (fallback)
3. Config service (if available)

If no API key is found, the service gracefully fails with an error message.

## Security Notes
- API keys are stored in the database (encrypted in production)
- Keys are not exposed in API responses to admins (shown as hidden input)
- Test connections verify key validity without exposing the key
- Each test result is logged with timestamp and error details

## Integration with Services

### Using DeepL After Configuration
```typescript
import { deeplTranslateText } from '@/lib/deepl.service';

const result = await deeplTranslateText('Hello', 'pt');
if (result.status === 'success') {
  console.log(result.data);
}
```

### Using Gemini After Configuration
```typescript
import { generateContent } from '@/lib/gemini.service';

const result = await generateContent({
  prompt: 'Write a product description',
  maxTokens: 500,
});
if (result.status === 'success') {
  console.log(result.data.content);
}
```

## Future Enhancements
- Add support for more providers (ChatGPT, Claude, etc.)
- Usage tracking and cost monitoring
- Rate limiting per API
- Webhook notifications for API failures
- API key rotation scheduling
