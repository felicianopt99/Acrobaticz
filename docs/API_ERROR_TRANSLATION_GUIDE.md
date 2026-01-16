# Error Message Translation Integration Guide

## Overview

This guide explains how to integrate automatic error message translation in the application using `useToastWithTranslation` hook.

## Problem

Previously, error messages from APIs were displayed directly in Toast notifications without being translated. This created a poor user experience for non-English speakers, especially for Portuguese users.

## Solution

New utilities have been created to automatically translate error messages through the TranslationContext:

1. **`src/lib/api-error-translation.ts`** - Core error translation utilities
2. **`src/hooks/useToastWithTranslation.ts`** - Toast hook with built-in translation
3. **Error message mappings** - Common API error patterns to human-readable text

## Usage Examples

### Before (Without Translation)
```typescript
try {
  await deleteEquipment(id);
} catch (error) {
  const { toast } = useToast();
  toast({
    title: 'Error',
    description: error.message,  // Not translated!
    variant: 'destructive'
  });
}
```

### After (With Translation)
```typescript
import { useToastWithTranslation } from '@/hooks/useToastWithTranslation';

function MyComponent() {
  const { toastError, toastSuccess, toastApiError } = useToastWithTranslation();

  const handleDeleteEquipment = async (id: string) => {
    try {
      await deleteEquipment(id);
      await toastSuccess('Equipment deleted successfully');
    } catch (error) {
      // Option 1: Simple error toast (auto-translates message)
      await toastError(error, { title: 'Delete Failed' });
      
      // Option 2: API error toast (extracts and translates API response)
      // await toastApiError(error, 'Could not delete equipment');
      
      // Option 3: Custom error message
      // await toastError(undefined, { 
      //   title: 'Delete Failed',
      //   description: 'Equipment is still in use'
      // });
    }
  };

  return (
    <button onClick={() => handleDeleteEquipment(equipmentId)}>
      Delete Equipment
    </button>
  );
}
```

## API

### `useToastWithTranslation()`

Returns an object with the following methods:

#### `toastError(error, options?)`
Shows an error toast with translated message.

```typescript
await toastError(error, {
  title: 'Operation Failed',           // Will be translated
  description: 'Custom error message', // Will be translated
  duration: 4000,                       // Optional, defaults to 4000ms
  variant: 'destructive',              // Optional
  translateTitle: true,                 // Translate title (default: true)
  translateDescription: true,           // Translate description (default: true)
});
```

#### `toastSuccess(message, options?)`
Shows a success toast with optional translation.

```typescript
await toastSuccess('Equipment deleted', {
  title: 'Success',           // Optional
  duration: 3000,             // Optional
  translateTitle: true,       // Optional
  translateDescription: true, // Optional
});
```

#### `toastApiError(error, title?)`
Shows an error toast for API errors, extracting and translating the message.

```typescript
try {
  await deleteEquipment(id);
} catch (error) {
  await toastApiError(error, 'Could not delete equipment');
}
```

#### `toastInfo(message, options?)`
Shows an info/neutral toast.

```typescript
await toastInfo('Equipment is now in use');
```

#### `toastWarning(message, options?)`
Shows a warning toast.

```typescript
await toastWarning('This action cannot be undone');
```

## Common Error Messages

The system automatically recognizes and translates these common error patterns:

| Error Pattern | Translates To |
|---|---|
| `Cannot delete equipment with active rentals` | `Não é possível eliminar equipamento com alugueres ativos` |
| `Equipment has been deleted` | `Equipamento foi eliminado` |
| `Equipment is currently in use` | `Equipamento está em uso` |
| `You do not have permission` | `Acesso negado` |
| `Equipment not found` | `Equipamento não encontrado` |
| `Conflict detected` | `Conflito detectado` |

See `ERROR_MESSAGE_MAP` in `src/lib/api-error-translation.ts` for the full list.

## Integration with AppContext

To integrate with the AppContext, update the deletion functions:

```typescript
// In src/contexts/AppContext.tsx
import { useToastWithTranslation } from '@/hooks/useToastWithTranslation';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toastError, toastSuccess, toastApiError } = useToastWithTranslation();

  const deleteEquipmentItem = useCallback(async (itemId: string) => {
    try {
      await equipmentAPI.delete(itemId);
      setEquipment(prev => prev.filter(eq => eq.id !== itemId));
      await toastSuccess('Equipment deleted successfully');
    } catch (err) {
      console.error('Error deleting equipment:', err);
      await toastApiError(err, 'Failed to delete equipment');
      throw err;
    }
  }, [toastSuccess, toastApiError]);

  // ... rest of the code
}
```

## Translation Flow

1. **Error Occurs** → API returns error message
2. **Extract Message** → `extractErrorMessage()` extracts message from response
3. **Translate** → `useTranslation().t()` translates message through TranslationContext
4. **Display** → Toast shows translated message to user
5. **Fallback** → If translation fails, original message is shown

## For Frontend Components

Example in an inventory component:

```typescript
import { useToastWithTranslation } from '@/hooks/useToastWithTranslation';

export function InventoryListView() {
  const { toastError, toastSuccess } = useToastWithTranslation();
  const { deleteEquipmentItem } = useAppContext();

  const handleDelete = async (itemId: string) => {
    try {
      await deleteEquipmentItem(itemId);
      await toastSuccess('Equipment deleted');
    } catch (error) {
      await toastError(error, { title: 'Delete Failed' });
    }
  };

  // ... rest of component
}
```

## Adding New Error Translations

To add new error patterns:

1. Edit `src/lib/api-error-translation.ts`
2. Add pattern to `ERROR_MESSAGE_MAP`:
   ```typescript
   'YOUR_NEW_ERROR': 'Your error message in English',
   ```
3. The system will automatically try to translate it

Or add custom handling in `translateError()` function for complex patterns.

## Testing

Test the translation system:

1. Go to language toggle and switch to Portuguese
2. Trigger errors (delete, create, update operations)
3. Verify error messages appear in Portuguese
4. Check browser console for translation logs

## Performance Considerations

- Error messages are translated asynchronously, so UI remains responsive
- Translations are cached in `TranslationContext`, so repeated errors are fast
- If translation fails, original message is shown immediately
- No blocking of user interactions during translation

## Browser Compatibility

The translation system works in all modern browsers that support:
- ES2020+ features
- fetch API
- TranslationContext (React 18+)

## Troubleshooting

**Error messages not translating?**
1. Check browser console for translation errors
2. Verify TranslationContext is properly wrapped in app
3. Check if language is set to Portuguese ('pt')
4. Check network tab to see if translation API calls are succeeding

**Missing translation?**
- Check if text exists in database translations
- Add to `ERROR_MESSAGE_MAP` if it's a common error
- System will fall back to English if translation not found

## Migration Checklist

To migrate existing components to use `useToastWithTranslation`:

- [ ] Update import: `import { useToastWithTranslation } from '@/hooks/useToastWithTranslation'`
- [ ] Replace `useToast()` with `useToastWithTranslation()`
- [ ] Change `toast()` calls to `toastError()`, `toastSuccess()`, etc.
- [ ] Test error scenarios in both English and Portuguese
- [ ] Verify error messages are properly translated

## Related Files

- `src/lib/api-error-translation.ts` - Core error translation utilities
- `src/hooks/useToastWithTranslation.ts` - Toast hook with translation
- `src/contexts/TranslationContext.tsx` - Translation context provider
- `src/hooks/use-toast.ts` - Base toast hook (from Shadcn/ui)

## Support

For questions or issues with error translation:
1. Check this guide's troubleshooting section
2. Review example implementations in this file
3. Check logs in browser console for translation errors
