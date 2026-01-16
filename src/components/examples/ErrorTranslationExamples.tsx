// @ts-nocheck
/**
 * Example Integration: Using useToastWithTranslation in Components
 * 
 * This file demonstrates how to integrate the error translation system
 * in your frontend components.
 * 
 * DO NOT USE THIS FILE AS-IS - It's a reference/template only.
 * Copy the patterns to your actual components.
 */

'use client';

import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { useToastWithTranslation } from '@/hooks/useToastWithTranslation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/**
 * EXAMPLE 1: Simple Delete with Error Translation
 */
export function DeleteEquipmentExample() {
  const { deleteEquipmentItem } = useAppDispatch();
  const { toastError, toastSuccess, toastApiError } = useToastWithTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (equipmentId: string) => {
    setIsDeleting(true);
    try {
      // Delete the equipment
      await deleteEquipmentItem(equipmentId);
      
      // Show success message (automatically translated)
      await toastSuccess('Equipment deleted successfully', {
        title: 'Delete Successful',
      });
    } catch (error) {
      // Show error message (automatically translated)
      // This will handle:
      // - "Cannot delete equipment with active rentals" → Translates automatically
      // - "Equipment has been deleted" → Translates automatically
      // - Custom error messages → Tries to translate
      await toastApiError(error, 'Failed to delete equipment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={() => handleDelete('equipment-id')}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete Equipment'}
    </Button>
  );
}

/**
 * EXAMPLE 2: Form Submission with Multiple Error Types
 */
export function EquipmentFormExample() {
  const { toastError, toastSuccess } = useToastWithTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Validate form
      if (!formData.name) {
        await toastError(undefined, {
          title: 'Validation Error',
          description: 'Equipment name is required',
        });
        return;
      }

      // Submit to API
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      // Show success
      await toastSuccess('Equipment created successfully');
      
      // Reset form, redirect, etc.
    } catch (error) {
      // Show error with translation
      // Handles API errors, network errors, validation errors
      await toastError(error, {
        title: 'Failed to Create Equipment',
        translateDescription: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit({
        name: 'Test Equipment',
        // ... other fields
      });
    }}>
      {/* Form fields here */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Equipment'}
      </Button>
    </form>
  );
}

/**
 * EXAMPLE 3: Batch Operations with Error Translation
 */
export function BatchDeleteExample() {
  const { deleteEquipmentItem } = useAppDispatch();
  const { toastError, toastSuccess, toastWarning } = useToastWithTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBatchDelete = async (equipmentIds: string[]) => {
    if (equipmentIds.length === 0) {
      await toastWarning('No equipment selected');
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const id of equipmentIds) {
      try {
        await deleteEquipmentItem(id);
        successCount++;
      } catch (error) {
        failureCount++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push(message);
        console.warn(`Failed to delete equipment ${id}:`, error);
      }
    }

    setIsDeleting(false);

    // Show results
    if (failureCount === 0) {
      await toastSuccess(
        `${successCount} equipment items deleted successfully`
      );
    } else if (successCount === 0) {
      await toastError(undefined, {
        title: 'Batch Delete Failed',
        description: `Failed to delete ${failureCount} items`,
      });
    } else {
      await toastWarning(
        `${successCount} deleted, ${failureCount} failed`
      );
    }
  };

  return (
    <Button 
      variant="destructive"
      onClick={() => handleBatchDelete(['id1', 'id2', 'id3'])}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete Selected'}
    </Button>
  );
}

/**
 * EXAMPLE 4: API Call with Specific Error Handling
 */
export function EquipmentCheckoutExample() {
  const { toastError, toastSuccess, toastInfo } = useToastWithTranslation();

  const handleCheckout = async (equipmentId: string) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error codes
        if (response.status === 409) {
          // Conflict: Equipment already checked out
          await toastError(error, {
            title: 'Equipment Already Checked Out',
            description: error.message,
          });
        } else if (response.status === 403) {
          // Forbidden: Permission denied
          await toastError(undefined, {
            title: 'Access Denied',
            description: 'You do not have permission to check out this equipment',
          });
        } else {
          // Generic error
          await toastApiError(error, 'Checkout Failed');
        }
        
        return;
      }

      // Success
      await toastSuccess('Equipment checked out successfully');
    } catch (error) {
      // Network error
      await toastError(error, {
        title: 'Network Error',
        description: 'Please check your internet connection',
      });
    }
  };

  return (
    <Button onClick={() => handleCheckout('equipment-id')}>
      Checkout Equipment
    </Button>
  );
}

/**
 * EXAMPLE 5: Info Toast for Status Updates
 */
export function StatusUpdateExample() {
  const { toastInfo, toastSuccess, toastWarning } = useToastWithTranslation();

  const handleStatusUpdate = async (equipmentId: string, newStatus: string) => {
    // Show info while processing
    await toastInfo(`Updating equipment status to ${newStatus}...`, {
      duration: 2000,
    });

    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Show success
      await toastSuccess(`Status updated to ${newStatus}`);
    } catch (error) {
      // Show error
      await toastWarning('Status update failed. Please try again.');
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={() => handleStatusUpdate('id', 'good')}>
        Mark as Good
      </Button>
      <Button onClick={() => handleStatusUpdate('id', 'maintenance')}>
        Mark for Maintenance
      </Button>
    </div>
  );
}

/**
 * IMPORTANT NOTES:
 * 
 * 1. Always use async/await when calling toast functions
 * 2. Wrap API calls in try/catch for proper error handling
 * 3. Use specific toast methods:
 *    - toastSuccess() for successful operations
 *    - toastError() for errors
 *    - toastApiError() for API response errors
 *    - toastWarning() for warnings
 *    - toastInfo() for informational messages
 * 
 * 4. Error messages are automatically translated to the user's language
 * 5. If translation fails, original message is shown
 * 6. All messages are automatically cached for performance
 * 
 * 7. For custom translations, add to:
 *    - TranslationContext for dynamic text
 *    - ERROR_MESSAGE_MAP for common error patterns
 * 
 * 8. Don't forget to handle loading states with disabled buttons
 */
