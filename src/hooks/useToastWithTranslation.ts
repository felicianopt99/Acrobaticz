/**
 * useToastWithTranslation Hook
 * Combines toast notifications with error message translation
 * Ensures all error messages shown to users are properly translated
 */

'use client';

import { useToast } from '@/hooks/use-toast';
import { useApiErrorTranslation } from '@/lib/api-error-translation';

export interface ToastErrorOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
  translateTitle?: boolean;
  translateDescription?: boolean;
}

/**
 * Hook that combines Toast with automatic error translation
 * Usage:
 *   const { toastError, toastSuccess } = useToastWithTranslation();
 *   try {
 *     await deleteEquipment(id);
 *     toastSuccess('Equipment deleted successfully');
 *   } catch (error) {
 *     toastError(error, { title: 'Delete Failed' });
 *   }
 */
export function useToastWithTranslation() {
  const { toast } = useToast();
  const { translateError, translateApiError, extractErrorMessage } = useApiErrorTranslation();

  /**
   * Show error toast with automatic translation
   * @param error - The error to display
   * @param options - Toast options including title, custom description, etc.
   */
  const toastError = async (error: unknown, options: ToastErrorOptions = {}) => {
    const {
      title = 'Error',
      description,
      duration = 4000,
      variant = 'destructive',
      translateTitle = true,
      translateDescription = true,
    } = options;

    try {
      // Get error message
      let errorMessage = description || extractErrorMessage(error);

      // Translate the error message if needed
      if (translateDescription) {
        errorMessage = await translateError(errorMessage);
      }

      // Translate title if needed
      let translatedTitle = title;
      if (translateTitle) {
        translatedTitle = await translateError(title);
      }

      toast({
        title: translatedTitle,
        description: errorMessage,
        variant,
        duration,
      });
    } catch (translationError) {
      // If translation fails, show original message anyway
      console.error('Error translating message:', translationError);
      toast({
        title: title,
        description: description || extractErrorMessage(error),
        variant,
        duration,
      });
    }
  };

  /**
   * Show success toast with optional translation
   * @param message - Success message to display
   * @param options - Toast options
   */
  const toastSuccess = async (
    message: string,
    options: Omit<ToastErrorOptions, 'variant'> & { variant?: 'default' } = {}
  ) => {
    const {
      title = 'Success',
      description = message,
      duration = 3000,
      variant = 'default',
      translateTitle = true,
      translateDescription = true,
    } = options;

    try {
      // Translate message if needed
      let translatedMessage = description;
      if (translateDescription) {
        translatedMessage = await translateError(description);
      }

      // Translate title if needed
      let translatedTitle = title;
      if (translateTitle) {
        translatedTitle = await translateError(title);
      }

      toast({
        title: translatedTitle,
        description: translatedMessage,
        duration,
      });
    } catch (translationError) {
      // If translation fails, show original message anyway
      console.warn('Error translating success message:', translationError);
      toast({
        title: title,
        description: description,
        duration,
      });
    }
  };

  /**
   * Show info toast with optional translation
   */
  const toastInfo = async (
    message: string,
    options: Omit<ToastErrorOptions, 'variant'> = {}
  ) => {
    return toastSuccess(message, { ...options, variant: 'default' });
  };

  /**
   * Show API error toast with full translation
   * Extracts error message from API response and translates it
   */
  const toastApiError = async (error: unknown, title = 'Operation Failed') => {
    try {
      const translatedMessage = await translateApiError(error);
      const translatedTitle = await translateError(title);

      toast({
        title: translatedTitle,
        description: translatedMessage,
        variant: 'destructive',
        duration: 4000,
      });
    } catch (translationError) {
      // Fallback if translation fails
      console.error('Error translating API error:', translationError);
      const message = extractErrorMessage(error);
      toast({
        title: title,
        description: message,
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  /**
   * Show warning toast
   */
  const toastWarning = async (
    message: string,
    options: Omit<ToastErrorOptions, 'variant'> = {}
  ) => {
    const {
      title = 'Warning',
      description = message,
      duration = 4000,
      translateTitle = true,
      translateDescription = true,
    } = options;

    try {
      let translatedMessage = description;
      if (translateDescription) {
        translatedMessage = await translateError(description);
      }

      let translatedTitle = title;
      if (translateTitle) {
        translatedTitle = await translateError(title);
      }

      toast({
        title: translatedTitle,
        description: translatedMessage,
        variant: 'destructive',
        duration,
      });
    } catch (translationError) {
      console.warn('Error translating warning message:', translationError);
      toast({
        title: title,
        description: description,
        variant: 'destructive',
        duration,
      });
    }
  };

  return {
    toastError,
    toastSuccess,
    toastInfo,
    toastApiError,
    toastWarning,
  };
}
