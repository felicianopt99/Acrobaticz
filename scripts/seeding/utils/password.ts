/**
 * Password Utilities
 * Handles password hashing for seeding operations
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export class PasswordUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  /**
   * Hash multiple passwords
   */
  static async hashMultiple(passwords: string[]): Promise<string[]> {
    return Promise.all(passwords.map(pwd => this.hash(pwd)))
  }

  /**
   * Verify a password against a hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}

export default PasswordUtils
