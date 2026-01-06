/**
 * Seeding Configuration
 * Central configuration for all seeding operations
 */

export interface SeedingConfig {
  // Database settings
  cleanDatabase: boolean
  
  // Execution settings
  verbose: boolean
  dryRun: boolean
  
  // Data source settings
  useJSONData: boolean
  useDefaultData: boolean
  
  // Feature flags
  seedUsers: boolean
  seedCategories: boolean
  seedSubcategories: boolean
  seedClients: boolean
  seedProducts: boolean
  seedCustomization: boolean
  seedPartners: boolean
  
  // Retry settings
  maxRetries: number
  retryDelay: number
}

export const DEFAULT_CONFIG: SeedingConfig = {
  cleanDatabase: false,
  verbose: false,
  dryRun: false,
  useJSONData: true,
  useDefaultData: false,
  seedUsers: true,
  seedCategories: true,
  seedSubcategories: true,
  seedClients: true,
  seedProducts: true,
  seedCustomization: true,
  seedPartners: false,
  maxRetries: 3,
  retryDelay: 1000
}

/**
 * Parse command line arguments into config
 */
export function parseArgs(args: string[]): Partial<SeedingConfig> {
  const config: Partial<SeedingConfig> = {}

  if (args.includes('--clean')) {
    config.cleanDatabase = true
  }

  if (args.includes('--verbose') || args.includes('-v')) {
    config.verbose = true
  }

  if (args.includes('--dry-run')) {
    config.dryRun = true
  }

  if (args.includes('--defaults')) {
    config.useDefaultData = true
    config.useJSONData = false
  }

  if (args.includes('--json')) {
    config.useJSONData = true
    config.useDefaultData = false
  }

  // Feature flags
  if (args.includes('--users-only')) {
    config.seedUsers = true
    config.seedCategories = false
    config.seedSubcategories = false
    config.seedClients = false
    config.seedProducts = false
    config.seedCustomization = false
    config.seedPartners = false
  }

  if (args.includes('--no-products')) {
    config.seedProducts = false
  }

  if (args.includes('--with-partners')) {
    config.seedPartners = true
  }

  return config
}

/**
 * Merge config with defaults
 */
export function mergeConfig(partial: Partial<SeedingConfig>): SeedingConfig {
  return { ...DEFAULT_CONFIG, ...partial }
}
