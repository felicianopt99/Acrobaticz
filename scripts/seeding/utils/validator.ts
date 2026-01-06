/**
 * Data Validation Utilities
 * Validates seeding data before insertion
 */

import { Logger } from './logger'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class Validator {
  /**
   * Validate required fields in an object
   */
  static validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[],
    itemName: string
  ): ValidationResult {
    const errors: string[] = []

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`Missing required field: ${field}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format (basic)
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9
  }

  /**
   * Validate that a value is one of allowed options
   */
  static validateEnum(value: string, allowedValues: string[], fieldName: string): ValidationResult {
    const isValid = allowedValues.includes(value)
    return {
      isValid,
      errors: isValid ? [] : [`Invalid ${fieldName}: ${value}. Must be one of: ${allowedValues.join(', ')}`]
    }
  }

  /**
   * Validate array data
   */
  static validateArray<T>(
    data: T[],
    itemValidator: (item: T, index: number) => ValidationResult,
    dataType: string
  ): ValidationResult {
    const allErrors: string[] = []

    data.forEach((item, index) => {
      const result = itemValidator(item, index)
      if (!result.isValid) {
        allErrors.push(`${dataType}[${index}]: ${result.errors.join(', ')}`)
      }
    })

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }

  /**
   * Log validation errors
   */
  static logValidationErrors(errors: string[], context: string) {
    if (errors.length > 0) {
      Logger.error(`Validation failed for ${context}:`)
      Logger.increaseIndent()
      errors.forEach(error => Logger.error(error))
      Logger.decreaseIndent()
    }
  }
}

export default Validator
