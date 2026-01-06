/**
 * File Loading Utilities
 * Handles loading JSON and other data files for seeding
 */

import * as fs from 'fs'
import * as path from 'path'
import { Logger } from './logger'

export class FileLoader {
  private static dataDirectory = path.join(process.cwd(), 'seeding', 'data')

  /**
   * Load and parse a JSON file
   */
  static loadJSON<T = any>(filename: string): T | null {
    const filePath = path.join(this.dataDirectory, filename)
    
    if (!fs.existsSync(filePath)) {
      Logger.warning(`File not found: ${filename}`)
      return null
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(content)
      Logger.debug(`Loaded ${filename} successfully`)
      return data
    } catch (error) {
      Logger.error(`Failed to parse JSON file: ${filename}`, error as Error)
      return null
    }
  }

  /**
   * Load multiple JSON files
   */
  static loadMultipleJSON<T = any>(filenames: string[]): Record<string, T | null> {
    const results: Record<string, T | null> = {}
    
    for (const filename of filenames) {
      results[filename] = this.loadJSON<T>(filename)
    }
    
    return results
  }

  /**
   * Check if a file exists
   */
  static fileExists(filename: string): boolean {
    const filePath = path.join(this.dataDirectory, filename)
    return fs.existsSync(filePath)
  }

  /**
   * List all JSON files in the data directory
   */
  static listJSONFiles(): string[] {
    if (!fs.existsSync(this.dataDirectory)) {
      Logger.warning('Data directory does not exist')
      return []
    }

    return fs.readdirSync(this.dataDirectory)
      .filter(file => file.endsWith('.json'))
  }

  /**
   * Validate that required files exist
   */
  static validateRequiredFiles(filenames: string[]): boolean {
    const missing: string[] = []
    
    for (const filename of filenames) {
      if (!this.fileExists(filename)) {
        missing.push(filename)
      }
    }

    if (missing.length > 0) {
      Logger.error(`Missing required data files:`)
      Logger.increaseIndent()
      missing.forEach(file => Logger.error(file))
      Logger.decreaseIndent()
      return false
    }

    return true
  }

  /**
   * Set custom data directory
   */
  static setDataDirectory(dir: string) {
    this.dataDirectory = dir
  }

  /**
   * Get current data directory
   */
  static getDataDirectory(): string {
    return this.dataDirectory
  }
}

export default FileLoader
